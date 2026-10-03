const AMAZON_TRACKING_TAG = 'juliasfundstuecke-21';

const escapeHtml = (value='') => String(value)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#039;');

const amazonAffiliateUrl = (asin) =>
  `https://www.amazon.de/dp/${encodeURIComponent(asin)}/ref=nosim?tag=${encodeURIComponent(AMAZON_TRACKING_TAG)}`;

const SHARE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a3 3 0 1 0-2.83-4A3 3 0 0 0 15 5c0 .18.02.35.05.52L8.91 8.59A3 3 0 0 0 7 8a3 3 0 1 0 1.91 5.41l6.14 3.07A3 3 0 0 0 15 17c0 .18.02.35.05.52A3 3 0 1 0 16 15c-.44 0-.86.1-1.23.27L8.63 12.2A3.1 3.1 0 0 0 9 11c0-.42-.08-.82-.23-1.19l6.13-3.07c.52.78 1.41 1.26 2.4 1.26H18Z"/></svg>`;

function showShareFeedback(button, text='Link kopiert ✓'){
  if (!button) return;
  const oldHtml = button.innerHTML;
  const oldLabel = button.getAttribute('aria-label');
  button.textContent = text;
  button.setAttribute('aria-label', text);
  button.classList.add('share-success');
  setTimeout(() => {
    button.innerHTML = oldHtml;
    if (oldLabel) button.setAttribute('aria-label', oldLabel);
    button.classList.remove('share-success');
  }, 1600);
}

async function copyShareLink(url, button){
  try{
    await navigator.clipboard.writeText(url);
    showShareFeedback(button);
  }catch(error){
    const helper = document.createElement('textarea');
    helper.value = url;
    helper.setAttribute('readonly','');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
    showShareFeedback(button);
  }
}

async function shareUrl({title=document.title, text='', url=window.location.href, button=null} = {}){
  if (navigator.share) {
    try{
      await navigator.share({title, text, url});
      return;
    }catch(error){
      if (error && error.name === 'AbortError') return;
    }
  }
  await copyShareLink(url, button);
}

const formatExpiry = (dateString) => {
  if (!dateString) return '';
  const [y,m,d] = dateString.split('-');
  return `${d}.${m}.${y}`;
};

const isExpired = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const expiry = new Date(dateString + 'T23:59:59');
  return expiry < today;
};

function purchaseHint(deal){
  switch(deal.promoType){
    case 'code':
      return 'Den Gutscheincode kannst du vor dem Kauf auf der Amazon-Produktseite eingeben und anschließend den finalen Preis prüfen.';
    case 'code_prime':
      return 'Den Gutscheincode kannst du vor dem Kauf auf der Amazon-Produktseite eingeben. Prüfe dort auch den zusätzlichen Prime-Rabatt und anschließend den finalen Preis.';
    case 'coupon':
    case 'coupon_prime':
      return 'Den Coupon kannst du direkt auf der Amazon-Produktseite aktivieren. Prüfe anschließend den finalen Preis vor dem Kauf.';
    default:
      return 'Der Rabatt wird direkt auf der Amazon-Produktseite angezeigt. Prüfe dort vor dem Kauf den aktuellen finalen Preis.';
  }
}

function renderDeal(deal){
  const codeMode = document.body.classList.contains('codes-page');
  const homeMode = document.body.classList.contains('home-page');
  const compactMode = document.body.classList.contains('deals-page') || codeMode || homeMode;
  const badge = deal.discountLabel
    ? `<div class="deal-badge">${escapeHtml(deal.discountLabel)}</div>`
    : '';

  const media = deal.image
    ? `<img src="${escapeHtml(deal.image)}" alt="${escapeHtml(deal.product)}" loading="lazy">`
    : `<div class="placeholder placeholder-premium" aria-hidden="true"><span class="placeholder-mark">${escapeHtml(deal.emoji || '✦')}</span><span class="placeholder-brand">Julia's</span><span class="placeholder-label">Fundstück</span></div>`;

  let promo = '';
  if (deal.code) {
    promo = `<div class="coupon">🎟️ Code <span class="code">${escapeHtml(deal.code)}</span><button class="copy-btn" data-copy="${escapeHtml(deal.code)}">Code kopieren</button>${deal.promoText ? `<span>${escapeHtml(deal.promoText)}</span>` : ''}</div>`;
  } else if (deal.promoText) {
    promo = `<div class="coupon">${escapeHtml(deal.promoText)}</div>`;
  }

  const dealSharePage = codeMode ? 'gutscheincodes.html' : 'deals.html';
  const dealShareUrl = new URL(`${dealSharePage}#${deal.id}`, window.location.href).href;

  const details = compactMode
    ? `<details class="deal-details">
         <summary>Details & Hinweise</summary>
         <p class="deal-desc">${escapeHtml(deal.description || '')}</p>
         <p class="deal-hint">${escapeHtml(purchaseHint(deal))}</p>
       </details>`
    : `<p class="deal-desc">${escapeHtml(deal.description || '')}</p>
       <p class="deal-hint">${escapeHtml(purchaseHint(deal))}</p>`;

  return `
    <article class="deal-card" id="${escapeHtml(deal.id)}">
      ${badge}
      <div class="deal-media">${media}</div>
      <div class="deal-content">
        <div class="deal-kicker">${deal.code ? '🎟️ Gutscheincode' : '🔥 Aktuelles Angebot'}</div>
        <h3>${escapeHtml(deal.product)}</h3>
        <div class="price-row">
          ${deal.price ? `<span class="price-now">${escapeHtml(deal.price)}</span>` : ''}
          ${deal.oldPrice ? `<span class="price-old">${escapeHtml(deal.oldPrice)}</span>` : ''}
        </div>
        <div class="price-check">Aktuellen Preis direkt bei Amazon prüfen</div>
        ${promo}
        ${details}
        <div class="deal-actions">
          <a class="btn btn-primary" href="${amazonAffiliateUrl(deal.asin)}" target="_blank" rel="nofollow sponsored noopener">${codeMode ? 'Code & Angebot prüfen →' : ((compactMode || homeMode) ? 'Deal prüfen →' : 'Zum Angebot →')}</a>
          <button class="btn btn-share-deal" type="button" data-share-deal data-share-url="${escapeHtml(dealShareUrl)}" data-share-title="${escapeHtml(deal.product)}" aria-label="${escapeHtml(deal.product)} teilen">${SHARE_ICON}<span>Teilen</span></button>
        </div>
        <div class="affiliate-note">Werbung | Affiliate-Link${deal.expires ? ' · Gültig bis ' + formatExpiry(deal.expires) : ''}</div>
      </div>
    </article>`;
}

async function loadDeals(){
  const targets = document.querySelectorAll('[data-deals]');
  if (!targets.length) return;

  try{
    const response = await fetch('deals.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Deals konnten nicht geladen werden.');
    const allDeals = await response.json();
    const activeDeals = allDeals.filter(deal => !isExpired(deal.expires));

    targets.forEach(target => {
      let deals = [...activeDeals];
      if (target.dataset.onlyCodes === 'true') deals = deals.filter(d => d.code);
      if (target.dataset.ids) {
        const ids = target.dataset.ids.split(',').map(id => id.trim()).filter(Boolean);
        deals = ids.map(id => deals.find(d => d.id === id)).filter(Boolean);
      }
      const limit = Number(target.dataset.limit || 0);
      if (limit > 0) deals = deals.slice(0, limit);

      target.innerHTML = deals.length
        ? deals.map(renderDeal).join('')
        : '<div class="info-box">Zurzeit sind keine aktiven Deals verfügbar.</div>';

      // Wenn die Seite mit einem Deal-Anker geöffnet wurde (z. B. von Pinterest),
      // erst nach dem dynamischen Laden der Deals zum gewünschten Angebot springen.
      if (window.location.hash) {
        const dealId = decodeURIComponent(window.location.hash.slice(1));
        const anchoredDeal = document.getElementById(dealId);
        if (anchoredDeal) {
          requestAnimationFrame(() => anchoredDeal.scrollIntoView({behavior:'auto', block:'start'}));
        }
      }
    });
  }catch(error){
    targets.forEach(target => {
      target.innerHTML = '<div class="info-box">Die Deals konnten gerade nicht geladen werden. Bitte versuche es gleich noch einmal.</div>';
    });
  }
}

document.addEventListener('click', async (event)=>{
  const button = event.target.closest('[data-copy]');
  if (!button) return;

  const code = button.getAttribute('data-copy');
  try{
    await navigator.clipboard.writeText(code);
    const old = button.textContent;
    button.textContent = 'Kopiert ✓';
    setTimeout(()=>button.textContent=old,1400);
  }catch(e){
    alert('Code: ' + code);
  }
});

const headerInner = document.querySelector('.header-inner');
if (headerInner && !headerInner.querySelector('[data-site-share]')) {
  const siteShareButton = document.createElement('button');
  siteShareButton.type = 'button';
  siteShareButton.className = 'site-share-button';
  siteShareButton.setAttribute('data-site-share','');
  siteShareButton.setAttribute('aria-label','Diese Seite teilen');
  siteShareButton.setAttribute('title','Diese Seite teilen');
  siteShareButton.innerHTML = SHARE_ICON;
  const navToggle = headerInner.querySelector('.nav-toggle');
  headerInner.insertBefore(siteShareButton, navToggle || headerInner.querySelector('.nav'));
}

document.addEventListener('click', async (event) => {
  const dealShare = event.target.closest('[data-share-deal]');
  if (dealShare) {
    await shareUrl({
      title: dealShare.dataset.shareTitle || document.title,
      text: dealShare.dataset.shareTitle ? `${dealShare.dataset.shareTitle} – gefunden bei Julia's Fundstücke` : '',
      url: dealShare.dataset.shareUrl || window.location.href,
      button: dealShare
    });
    return;
  }

  const siteShare = event.target.closest('[data-site-share]');
  if (siteShare) {
    await shareUrl({
      title: document.title,
      text: "Julia's Fundstücke – Deals, Gutscheine & Empfehlungen",
      url: window.location.href,
      button: siteShare
    });
  }
});

const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  });
  nav.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click',()=>{
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Menü öffnen');
    });
  });
}
const currentPage=(window.location.pathname.split('/').pop()||'index.html').toLowerCase();
document.querySelectorAll('.nav a').forEach(link=>{
  const href=(link.getAttribute('href')||'').toLowerCase();
  if(href===currentPage) link.classList.add('active');
});

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
loadDeals();


// Privacy-friendly Google Analytics consent controls.
(() => {
  const CONSENT_KEY = 'jf_analytics_consent';
  const banner = document.querySelector('[data-consent-banner]');

  if (window.JF_ANALYTICS_EXCLUDED) {
    if (banner) banner.hidden = true;
    return;
  }
  const applyConsent = (choice) => {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: choice === 'granted' ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
  };
  const saveChoice = (choice) => {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch(e) {}
    applyConsent(choice);
    // The initial page_view was queued while analytics consent was denied.
    // After an explicit opt-in, send a fresh page_view so GA4 receives the visit immediately.
    if (choice === 'granted' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href
      });
    }
    if (banner) banner.hidden = true;
  };
  let saved = null;
  try { saved = localStorage.getItem(CONSENT_KEY); } catch(e) {}
  if (saved === 'granted' || saved === 'denied') {
    applyConsent(saved);
  } else if (banner) {
    banner.hidden = false;
  }
  document.querySelectorAll('[data-consent-accept]').forEach(el => el.addEventListener('click', () => saveChoice('granted')));
  document.querySelectorAll('[data-consent-reject]').forEach(el => el.addEventListener('click', () => saveChoice('denied')));
  document.querySelectorAll('[data-consent-close]').forEach(el => el.addEventListener('click', () => { if (banner) banner.hidden = true; }));
  document.querySelectorAll('[data-consent-settings]').forEach(el => el.addEventListener('click', () => { if (banner) banner.hidden = false; }));
})();
