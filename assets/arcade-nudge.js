(() => {
  'use strict';
  // The one-time invitation belongs only on the main storefront.
  if (!document.querySelector('.play-win-nav') || document.body.classList.contains('product-page')) return;

  const key = 'dhPlayWinNavNudgeSeenV10';
  let seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; } catch (_) {}
  if (seen) return;

  const desktopTarget = document.querySelector('.play-win-nav');
  const mobileTarget = document.querySelector('.play-win-mobile-link');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const isMobile = () => matchMedia('(max-width:760px)').matches;

  const nudge = document.createElement('aside');
  nudge.className = 'dh-play-nudge';
  nudge.setAttribute('aria-label', 'Play and Win arcade invitation');
  nudge.innerHTML = `
    <button type="button" aria-label="Dismiss Play & Win invitation">×</button>
    <small>DAB HABITZ · AFTER HOURS</small>
    <strong>5 games. Real rewards.</strong>
    <p>Play for discounts up to ₹666, free shipping and other rewards.</p>
    <a href="./play-win/index.html">SEE PLAY & WIN <span>↗</span></a>`;
  document.body.appendChild(nudge);

  let opened = false;
  let activeTarget = null;
  let autoCloseTimer = 0;

  const markSeen = () => { try { sessionStorage.setItem(key, '1'); } catch (_) {} };
  const position = () => {
    if (!opened || !activeTarget) return;
    const r = activeTarget.getBoundingClientRect();
    const nr = nudge.getBoundingClientRect();
    let left = r.right - nr.width;
    left = Math.max(12, Math.min(innerWidth - nr.width - 12, left));
    let top = r.bottom + 10;
    if (top + nr.height > innerHeight - 12) top = Math.max(12, r.top - nr.height - 10);
    nudge.style.left = `${Math.round(left)}px`;
    nudge.style.top = `${Math.round(top)}px`;
  };
  const open = (target) => {
    if (opened || !target) return;
    const r = target.getBoundingClientRect();
    if (!r.width || !r.height) return;
    opened = true; activeTarget = target;
    target.classList.add('dh-nudge-pulse');
    nudge.classList.add('is-open');
    requestAnimationFrame(position);
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(close, 9000);
  };
  const close = () => {
    if (!opened) return;
    clearTimeout(autoCloseTimer);
    nudge.classList.remove('is-open');
    activeTarget?.classList.remove('dh-nudge-pulse');
    opened = false;
    markSeen();
  };

  nudge.querySelector('button')?.addEventListener('click', close);
  nudge.querySelector('a')?.addEventListener('click', markSeen);
  addEventListener('resize', position, {passive:true});
  addEventListener('scroll', position, {passive:true});

  if (!isMobile()) {
    setTimeout(() => open(desktopTarget), 850);
  } else if (menuToggle && mobileMenu && mobileTarget) {
    // On phones, wait until the user actually opens the menu so the callout
    // grows out of the Play & Win item instead of floating over the page.
    menuToggle.addEventListener('click', () => {
      setTimeout(() => {
        if (mobileMenu.classList.contains('is-open')) { if (!opened) open(mobileTarget); }
        else if (opened) close();
      }, 180);
    });
  }
})();
