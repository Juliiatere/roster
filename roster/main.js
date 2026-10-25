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

