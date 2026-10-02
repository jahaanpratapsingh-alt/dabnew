(() => {
  const KEY = 'dabHabitzBagV1';
  const SCRIPT_SRC = document.currentScript?.src || '';
  const assetUrl = file => new URL(file, SCRIPT_SRC).href;
  const CATALOG = {
    sugar: {
      name: 'Sugar Crash',
      meta: '66 ML · Eau de Parfum',
      image: assetUrl('sugar-bag-thumb.png')
    },
    situationship: {
      name: 'Situationship',
      meta: '66 ML · Eau de Parfum',
      image: assetUrl('situationship-portrait.jpg')
    },
    darkmatter: {
      name: 'Dark Matter',
      meta: '66 ML · Eau de Parfum',
      image: assetUrl('dark-matter-portrait.jpg')
    }
  };

  const safeRead = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  let bag = safeRead();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch {}
  };
  const total = () => Object.values(bag).reduce((n, v) => n + Math.max(0, Number(v) || 0), 0);

  const overlay = document.createElement('div');
  overlay.className = 'dh-cart-overlay';
  overlay.setAttribute('data-cart-close', '');

  const drawer = document.createElement('aside');
  drawer.className = 'dh-cart';
  drawer.setAttribute('aria-label', 'Dab Habitz bag');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="dh-cart-head">
      <div>
        <div class="dh-cart-eyebrow">DAB HABITZ · YOUR BAG</div>
        <h2>Your habits.</h2>
      </div>
      <button class="dh-cart-close" type="button" data-cart-close aria-label="Close bag">×</button>
    </div>
    <div class="dh-cart-items" data-cart-items></div>
    <div class="dh-cart-foot">
      <p>Your bag is saved on this device while checkout is being connected.</p>
      <button class="dh-cart-continue" type="button" data-cart-close>CONTINUE SHOPPING</button>
    </div>`;

  const toast = document.createElement('div');
  toast.className = 'dh-cart-toast';
  toast.setAttribute('role', 'status');
  document.body.append(overlay, drawer, toast);

  const render = () => {
    const count = total();
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = String(count));
    const items = drawer.querySelector('[data-cart-items]');
    const rows = Object.entries(bag).filter(([slug, qty]) => CATALOG[slug] && qty > 0);

    if (!rows.length) {
      items.innerHTML = '<div class="dh-cart-empty">Nothing here yet.<br>Pick the habit you want to keep.</div>';
      return;
    }

    items.innerHTML = rows.map(([slug, qty]) => {
      const p = CATALOG[slug];
      return `
        <article class="dh-cart-line" data-cart-line="${slug}">
          <img class="dh-cart-thumb" src="${p.image}" alt="${p.name} perfume" loading="lazy">
          <div class="dh-cart-copy">
            <small>EAU DE PARFUM</small>
            <h3>${p.name}</h3>
            <p>${p.meta}</p>
          </div>
          <div class="dh-cart-qty">
            <button type="button" data-cart-dec="${slug}" aria-label="Decrease ${p.name}">−</button>
            <span>${qty}</span>
            <button type="button" data-cart-inc="${slug}" aria-label="Increase ${p.name}">+</button>
          </div>
        </article>`;
    }).join('');
  };

  const open = () => {
    render();
    document.body.classList.add('dh-cart-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.querySelector('.dh-cart-close')?.focus();
  };

  const close = () => {
    document.body.classList.remove('dh-cart-open');
    drawer.setAttribute('aria-hidden', 'true');
  };

  let toastTimer;
  const notify = msg => {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1700);
  };

  const add = (slug, btn) => {
    if (!CATALOG[slug]) return;
    bag[slug] = (Number(bag[slug]) || 0) + 1;
    save();
    render();
    notify(`${CATALOG[slug].name} added to bag`);
    if (btn) {
      const old = btn.innerHTML;
      btn.classList.add('is-added');
      btn.innerHTML = '<span>ADDED TO BAG</span><b>✓</b>';
      setTimeout(() => {
        btn.classList.remove('is-added');
        btn.innerHTML = old;
      }, 1300);
    }
  };

  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      add(addBtn.getAttribute('data-add-cart'), addBtn);
      return;
    }
    if (e.target.closest('[data-cart-open]')) {
      e.preventDefault();
      open();
      return;
    }
    if (e.target.closest('[data-cart-close]')) {
      e.preventDefault();
      close();
      return;
    }
    const inc = e.target.closest('[data-cart-inc]');
    if (inc) {
      const s = inc.getAttribute('data-cart-inc');
      bag[s] = (Number(bag[s]) || 0) + 1;
      save();
      render();
      return;
    }
    const dec = e.target.closest('[data-cart-dec]');
    if (dec) {
      const s = dec.getAttribute('data-cart-dec');
      bag[s] = Math.max(0, (Number(bag[s]) || 0) - 1);
      if (!bag[s]) delete bag[s];
      save();
      render();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });

  render();
})();
