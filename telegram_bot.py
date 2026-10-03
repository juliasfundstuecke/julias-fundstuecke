#!/usr/bin/env python3
import html
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DEALS_FILE = Path("deals.json")
STATE_FILE = Path("telegram-state.json")
SITE_BASE = "https://julias-fundstuecke.de"
DEFAULT_CHAT_ID = "@Rabattsammler"
TZ = ZoneInfo("Europe/Berlin")


def load_json(path, default):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path, data):
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def is_active(deal, today):
    expiry = deal.get("expires")
    if not expiry:
        return True
    try:
        return date.fromisoformat(expiry) >= today
    except ValueError:
        return True


def choose_deal(deals, posted_ids, today):
    for deal in deals:
        deal_id = str(deal.get("id", "")).strip()
        if not deal_id or deal_id in posted_ids:
            continue
        if not is_active(deal, today):
            continue
        if not str(deal.get("price", "")).strip():
            continue
        return deal
    return None


def build_message(deal):
    product = html.escape(str(deal.get("product", "Deal")).strip())
    price = html.escape(str(deal.get("price", "")).strip())
    old_price = html.escape(str(deal.get("oldPrice", "")).strip())
    label = html.escape(str(deal.get("discountLabel", "")).strip())
    promo = html.escape(str(deal.get("promoText", "")).strip())
    deal_id = str(deal["id"]).strip()
    url = f"{SITE_BASE}/deals.html#{deal_id}"

    lines = []
    if label:
        lines.append(f"<b>{label}</b>")
    else:
        lines.append("🔥 <b>Neues Fundstück</b>")

    lines.append(f"<b>{product}</b>")

    if old_price:
        lines.append(f"💶 <b>{price}</b> · statt {old_price}")
    else:
        lines.append(f"💶 <b>{price}</b>")

    if promo:
        lines.append(promo)

    lines.extend([
        "",
        "👉 <b>Deal ansehen & Preis prüfen:</b>",
        url,
        "",
        "Preise und Verfügbarkeit können sich kurzfristig ändern.",
        "Werbung | Affiliate-Seite"
    ])
    return "\n".join(lines)


def send_telegram(token, chat_id, text):
    endpoint = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }).encode("utf-8")

    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Telegram HTTP {error.code}: {details}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Telegram-Verbindung fehlgeschlagen: {error}") from error

    if not body.get("ok"):
        raise RuntimeError(f"Telegram API meldet Fehler: {body}")
    return body


def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", DEFAULT_CHAT_ID).strip()
    force_post = os.environ.get("FORCE_POST", "0") == "1"

    if not token:
        print("TELEGRAM_BOT_TOKEN fehlt.", file=sys.stderr)
        return 2

    now = datetime.now(TZ)

    # Geplante Läufe posten bewusst nur peu à peu:
    # alle zwei Stunden zwischen 08:00 und 21:59 Uhr deutscher Zeit.
    if not force_post:
        if now.hour < 8 or now.hour >= 22 or now.hour % 2 != 0:
            print(f"Kein Posting-Zeitfenster: {now:%Y-%m-%d %H:%M %Z}")
            return 0

    deals = load_json(DEALS_FILE, [])
    state = load_json(STATE_FILE, {"posted_ids": [], "last_posted_at": None})
    posted_ids = set(state.get("posted_ids", []))

    deal = choose_deal(deals, posted_ids, now.date())
    if not deal:
        print("Kein neuer aktiver Deal zum Posten.")
        return 0

    message = build_message(deal)
    send_telegram(token, chat_id, message)

    deal_id = str(deal["id"])
    posted = [deal_id] + [item for item in state.get("posted_ids", []) if item != deal_id]
    state["posted_ids"] = posted[:500]
    state["last_posted_at"] = now.isoformat()
    state["last_posted_id"] = deal_id
    save_json(STATE_FILE, state)

    print(f"Gepostet: {deal_id} -> {chat_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
