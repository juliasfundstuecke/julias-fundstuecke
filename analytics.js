(() => {
  const EXCLUDE_KEY = 'jf_analytics_exclude';
  const params = new URLSearchParams(window.location.search);

  try {
    if (params.get('jf_admin') === '1') {
      localStorage.setItem(EXCLUDE_KEY, '1');
    } else if (params.get('jf_admin') === '0') {
      localStorage.removeItem(EXCLUDE_KEY);
    }
  } catch (e) {}

  let excluded = false;
  try {
    excluded = localStorage.getItem(EXCLUDE_KEY) === '1';
  } catch (e) {}

  window.JF_ANALYTICS_EXCLUDED = excluded;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  if (excluded) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-PBWRE15XZL';
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', 'G-PBWRE15XZL');
})();
