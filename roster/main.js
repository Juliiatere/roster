// Shared across all pages: load-in, navbar state, in-view reveals, newsletter
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('is-loaded')));
const navbar = document.getElementById('navbar');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const setNav = () => navbar.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', setNav, {passive:true}); setNav();

// ===== generic in-view reveal =====
const io2 = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in-view'); io2.unobserve(e.target); } }), {threshold:0, rootMargin:'0px 0px -20% 0px'});
document.querySelectorAll('[data-observe]').forEach(el => io2.observe(el));

// ===== FAQ accordion (one open at a time) =====
document.querySelectorAll('.qa__q').forEach(b => b.addEventListener('click', () => {
  const item = b.closest('.qa'), open = !item.classList.contains('is-open');
  item.parentElement.querySelectorAll('.qa.is-open').forEach(x => { x.classList.remove('is-open'); x.querySelector('.qa__q').setAttribute('aria-expanded','false'); });
  if (open) { item.classList.add('is-open'); b.setAttribute('aria-expanded','true'); }
}));

// ===== Newsletter (front-end only: validates, shows a message; no backend wired) =====
(() => {
  const f = document.querySelector('.news__form'); if (!f) return;
  const msg = document.querySelector('.news__msg'), inp = f.querySelector('input');
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (!inp.checkValidity() || !inp.value) { msg.textContent = 'Please enter a valid work email.'; inp.focus(); return; }
    msg.textContent = "Thanks! You're on the list."; inp.value = '';
  });
})();


// ===== Solutions dropdown: hover (with a short close delay) on desktop, click/tap, Esc and outside click close it =====
(() => {
  const dd = document.getElementById('solDd'); if (!dd) return;
  const btn = dd.querySelector('button'), items = [...dd.querySelectorAll('.nav__menu-item')];
  let t;
  const set = open => { dd.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open); };
  const canHover = matchMedia('(hover: hover)').matches;
  if (canHover) {
    dd.addEventListener('mouseenter', () => { clearTimeout(t); set(true); });
    dd.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 180); });
  }
  btn.addEventListener('click', () => set(!dd.classList.contains('is-open')));
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); set(true); items[0].focus(); } });
  dd.addEventListener('keydown', e => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { set(false); btn.focus(); }
    else if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) set(false); });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
})();

// ===== Loved by teams: quote words stagger in, KPIs count up =====
(() => {
  const q = document.getElementById('lovedQuote'); if (!q) return; let i = 0;
  q.setAttribute('aria-label', q.textContent);
  const wrap = node => [...node.childNodes].map(n => n.nodeType === 3
    ? n.textContent.split(/(\s+)/).map(w => /\s/.test(w) || !w ? w : '<span class="w" aria-hidden="true" style="--i:' + (i++) + '">' + w + '</span>').join('')
    : '<mark>' + wrap(n) + '</mark>').join('');
  q.innerHTML = wrap(q);
  const sec = q.closest('.loved');
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return; o.disconnect();
    if (reduce) return;
    sec.querySelectorAll('[data-count]').forEach((el, k) => {
      const to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', dur = 1300, t0 = performance.now() + 400 + k * 100;
      el.textContent = pre + 0 + suf;
      const step = now => { const t = Math.min(Math.max((now - t0) / dur, 0), 1);
        el.textContent = pre + Math.round(to * (1 - Math.pow(1 - t, 3))) + suf; if (t < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }), {threshold:.3}).observe(sec);
})();

// ===== Pricing: billing toggle (pill slides, prices flip) =====
(() => {
  const t = document.querySelector('.toggle'); if (!t) return;
  const btns = [...t.querySelectorAll('button')], pill = t.querySelector('.toggle__pill');
  const prices = [...document.querySelectorAll('.plan__price b[data-monthly]')];
  const place = b => { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; };
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
    place(b);
    document.querySelector('.pricing').classList.toggle('is-annual', b.dataset.period === 'annual');
    prices.forEach(p => { const v = p.dataset[b.dataset.period]; if (p.textContent !== v) { p.textContent = v; p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip'); } });
  }));
  place(btns[0]); addEventListener('resize', () => place(btns.find(b => b.classList.contains('is-on'))));
  document.fonts && document.fonts.ready.then(() => place(btns.find(b => b.classList.contains('is-on'))));
})();


// ===== Mobile / tablet menu: burger → circle reveal, built from the desktop nav =====
(() => {
  const bar = document.querySelector('.navbar__actions'), nav = document.querySelector('.nav'); if (!bar || !nav) return;
  const chev = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const arr = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M8.5 7H17v8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const items = []; let k = 0;
  [...nav.children].forEach(el => {
    if (el.classList.contains('nav__dd')) {
      const label = el.querySelector('button span').textContent.trim();
      const subs = [...el.querySelectorAll('.nav__menu-item')].map(a => `<a href="${a.getAttribute('href')}"${a.getAttribute('aria-current') ? ' aria-current="page"' : ''}><b>${a.querySelector('b').innerHTML}</b><small>${a.querySelector('small').innerHTML}</small></a>`).join('');
      const cur = el.querySelector('[aria-current="page"]') ? ' is-current' : '';
      items.push(`<li style="--k:${k++}"><button class="mmenu__link mmenu__acc${cur}" type="button" aria-expanded="${cur ? 'true' : 'false'}">${label}${chev}</button><div class="mmenu__sub"><div>${subs}</div></div></li>`);
    } else if (el.tagName === 'A') {
      const cur = el.classList.contains('is-current') ? ' is-current' : '';
      items.push(`<li style="--k:${k++}"><a class="mmenu__link${cur}" href="${el.getAttribute('href')}">${el.querySelector('span').textContent.trim()}${arr}</a></li>`);
    }
  });
  const login = bar.querySelector('.navbar__login'), trial = bar.querySelector('.btn');
  const menu = document.createElement('div');
  menu.className = 'mmenu'; menu.id = 'mmenu'; menu.setAttribute('aria-label', 'Menu'); menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true');
  menu.innerHTML = `<ul class="mmenu__list">${items.join('')}</ul>
    <div class="mmenu__cta">
      <a class="btn btn--secondary btn--md" style="--k:${k}" href="${login ? login.getAttribute('href') : 'auth.html?mode=login'}">Log in</a>
      <a class="btn btn--primary btn--md" style="--k:${k + 1}" href="${trial ? trial.getAttribute('href') : 'auth.html'}">Start Free Trial</a>
      <a class="mmenu__demo" style="--k:${k + 2}" href="demo.html">or book a 30-min demo ↗</a>
    </div>`;
  document.body.appendChild(menu);
  const btn = document.createElement('button');
  btn.className = 'burger'; btn.type = 'button'; btn.setAttribute('aria-label', 'Open menu'); btn.setAttribute('aria-controls', 'mmenu'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  bar.appendChild(btn);
  const root = document.documentElement;
  const set = open => {
    if (open) { const r = btn.getBoundingClientRect(); menu.style.setProperty('--mx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--my', (r.top + r.height / 2) + 'px'); }
    root.classList.toggle('menu-open', open); document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) setTimeout(() => menu.querySelector('.mmenu__link').focus({ preventScroll: true }), 350);
  };
  btn.addEventListener('click', () => set(!root.classList.contains('menu-open')));
  menu.addEventListener('click', e => {
    const acc = e.target.closest('.mmenu__acc');
    if (acc) { acc.setAttribute('aria-expanded', acc.getAttribute('aria-expanded') !== 'true'); return; }
    if (e.target.closest('a')) set(false);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { set(false); btn.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1100 && root.classList.contains('menu-open')) set(false); });
})();
