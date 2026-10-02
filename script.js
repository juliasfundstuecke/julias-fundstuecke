const AMAZON_TRACKING_TAG = 'juliasfundstuecke-21';

const escapeHtml = (value='') => String(value)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#039;');

const amazonAffiliateUrl = (asin) =>
  `https://www.amazon.de/dp/${encodeURIComponent(asin)}/ref=nosim?tag=${encodeURIComponent(AMAZON_TRACKING_TAG)}`;

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

  return `
    <article class="deal-card" id="${escapeHtml(deal.id)}">
      ${badge}
      <div class="deal-media">${media}</div>
      <div class="deal-content">
        <div class="deal-kicker">${deal.code ? '🎟️ Gutscheincode' : '🔥 Aktuelles Angebot'}</div>
        <h3>${escapeHtml(deal.product)}</h3>
        <p class="deal-desc">${escapeHtml(deal.description || '')}</p>
        <div class="price-row">
          ${deal.price ? `<span class="price-now">${escapeHtml(deal.price)}</span>` : ''}
          ${deal.oldPrice ? `<span class="price-old">${escapeHtml(deal.oldPrice)}</span>` : ''}
        </div>
        <div class="price-check">Aktuellen Preis direkt bei Amazon prüfen</div>
        ${promo}
        <p class="deal-hint">${escapeHtml(purchaseHint(deal))}</p>
        <div class="deal-actions">
          <a class="btn btn-primary" href="${amazonAffiliateUrl(deal.asin)}" target="_blank" rel="nofollow sponsored noopener">Zum Angebot →</a>
        </div>
        <div class="affiliate-note">Werbung | Affiliate-Link${deal.expires ? ' · Gültig bis ' + formatExpiry(deal.expires) : ''}</div>
        <div class="feedback-box">
          <strong>💬 Hat der Deal bei dir geklappt?</strong>
          <span>Teile deine Erfahrung mit anderen Schnäppchenjägern und komm gerne in unsere Facebook-Gruppe.</span>
          <a href="https://www.facebook.com/share/g/1CDpJMHCjn/?mibextid=wwXIfr" target="_blank" rel="noopener">👉 Feedback &amp; Austausch auf Facebook</a>
        </div>
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
