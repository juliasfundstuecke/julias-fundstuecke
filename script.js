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

function renderDeal(deal){
  const badge = deal.discountLabel
    ? `<div class="deal-badge">${escapeHtml(deal.discountLabel)}</div>`
    : '';

  const media = deal.image
    ? `<img src="${escapeHtml(deal.image)}" alt="${escapeHtml(deal.product)}" loading="lazy">`
    : `<div class="placeholder">${escapeHtml(deal.emoji || '🔥')}</div>`;

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
        <div class="price-check">Aktuellen Preis direkt bei Amazon prüfen</div>
        ${promo}
        <div class="deal-actions">
          <a class="btn btn-primary" href="${amazonAffiliateUrl(deal.asin)}" target="_blank" rel="nofollow sponsored noopener">Zum Angebot →</a>
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
      const limit = Number(target.dataset.limit || 0);
      if (limit > 0) deals = deals.slice(0, limit);

      target.innerHTML = deals.length
        ? deals.map(renderDeal).join('')
        : '<div class="info-box">Zurzeit sind keine aktiven Deals verfügbar.</div>';
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
  toggle.addEventListener('click',()=>nav.classList.toggle('open'));
}

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
loadDeals();
