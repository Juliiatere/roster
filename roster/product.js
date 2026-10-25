// Product page only (needs main.js loaded first: navbar, reduce)
(() => {
  // --nav-h for sticky offsets
  const setNavH = () => document.documentElement.style.setProperty('--nav-h', navbar.offsetHeight + 'px');
  setNavH(); addEventListener('resize', setNavH);

  // window drifts slightly on scroll (parallax), like the home hero
  const win = document.getElementById('pwindow');
  // anchor chips: stuck state + active section
  const nav = document.getElementById('anchors') || document.createElement('nav');
  const chips = [...nav.querySelectorAll('.anchors__chip')];
  const targets = chips.map(c => document.querySelector(c.getAttribute('href')));
  const layers = [...document.querySelectorAll('.mod__layer')].filter(l => +l.dataset.speed);
  let ticking = false;
  function update(){
    if (!reduce) {
      if (win) win.style.setProperty('--py', Math.min(scrollY * .1, 40).toFixed(1) + 'px');
      // module layers drift at different speeds while their section crosses the viewport
      layers.forEach(l => { const r = l.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
        const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        l.style.setProperty('--py', (k * l.dataset.speed * 400).toFixed(1) + 'px'); });
    }
    const stickTop = navbar.offsetHeight + 12;
    // bottom bar: visible between the end of the hero and the CTA
    const stage = document.querySelector('.pshow'), cta = document.querySelector('.cta');
    const after = stage ? stage.getBoundingClientRect().bottom < innerHeight * .6 : scrollY > 400;
    const before = cta ? cta.getBoundingClientRect().top > innerHeight * .8 : true;
    nav.classList.toggle('is-shown', after && before);
    // active = last section whose top passed the line under the chips
    const line = Math.max(stickTop + 80, innerHeight * .45);
    let on = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) on = i; });
    // inside the deck the chip follows the card that holds the active border
    if (on > -1 && targets[on] && targets[on].classList.contains('pcard')) {
      let best = on, bestA = -1;
      targets.forEach((t, i) => { if (t && t.classList.contains('pcard')) { const v = +t.style.getPropertyValue('--a') || 0; if (v > bestA) { bestA = v; best = i; } } });
      if (bestA > .01) on = best;
    }
    if (scrollY < 200) on = -1;
    chips.forEach((c, i) => c.classList.toggle('is-on', i === on));
    // keep the active chip visible in the scrollable row (mobile)
    if (on > -1 && innerWidth <= 760) {
      const row = nav.querySelector('.anchors__in'), c = chips[on];
      const want = c.offsetLeft - (row.clientWidth - c.offsetWidth) / 2;
      if (Math.abs(row.scrollLeft - want) > 4) row.scrollTo({ left: want, behavior: 'smooth' });
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

// ===== Feature deck: cards pin under the chips; the next one lands on top, the ones underneath step back =====
(() => {
  const deck = document.getElementById('pdeck'); if (!deck) return;
  const cards = [...deck.querySelectorAll('.pcard')];
  const chipsRow = document.querySelector('.anchors__in');
  let top = 160, step = 16, gap = 32, flat = false;
  const stickTop = j => top + j * step;
  function layout(){
    const mobile = innerWidth <= 760;
    step = mobile ? 10 : 16;
    gap = parseFloat(getComputedStyle(cards[1]).marginTop) || 32;
    top = navbar.offsetHeight + (mobile ? 12 : 24);
    deck.style.setProperty('--deck-top', top + 'px');
    // if a card can't fit on screen while pinned, fall back to normal flow (short phones / landscape)
    const tallest = Math.max(...cards.map(c => c.offsetHeight));
    flat = reduce || stickTop(cards.length - 1) + tallest > innerHeight + 8;
    deck.classList.toggle('is-flat', flat);
    deck.style.setProperty('--deck-tail', flat ? '0px' : '120px');
  }
  // flow top of card j relative to the deck (sticky does not change layout, so sum the heights)
  const flowTop = j => cards.slice(0, j).reduce((s, c) => s + c.offsetHeight + gap, 0);
  function update(){
    const n = cards.length;
    if (flat) {
      // normal flow: border lights up on the card in the middle of the screen
      let act = 0; cards.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .55) act = i; });
      cards.forEach((c, i) => { c.style.setProperty('--a', i === act ? 1 : 0); c.style.setProperty('--u', 0); c.classList.remove('is-under'); });
      return;
    }
    const raw = cards.map((c, j) => { if (!j) return 1;
      const start = stickTop(j - 1) + cards[j - 1].offsetHeight + gap, end = stickTop(j);
      return Math.min(Math.max((start - c.getBoundingClientRect().top) / (start - end), 0), 1); });
    cards.forEach((c, i) => {
      let depth = 0; for (let j = i + 1; j < n; j++) depth += raw[j];
      c.style.transform = depth > .001 ? 'scale(' + (1 - depth * .04).toFixed(4) + ')' : '';
      c.style.filter = depth > .001 ? 'brightness(' + (1 - Math.min(depth, 2) * .12).toFixed(3) + ') blur(' + Math.min(depth * .6, 1.2).toFixed(2) + 'px)' : '';
      c.style.setProperty('--u', Math.min(depth, 1).toFixed(3));
      c.classList.toggle('is-under', depth > .5);
      // active border hands over during the second half of the next card's approach
      const next = i + 1 < n ? Math.min(Math.max((raw[i + 1] - .5) / .5, 0), 1) : 0;
      const mine = i ? Math.min(Math.max((raw[i] - .5) / .5, 0), 1) : 1;
      c.style.setProperty('--a', Math.min(mine, 1 - next).toFixed(3));
    });
  }
  // chips that point into the deck scroll to where that card has just landed
  document.querySelectorAll('.anchors__chip').forEach(ch => {
    const j = cards.findIndex(c => '#' + c.id === ch.getAttribute('href')); if (j < 0) return;
    ch.addEventListener('click', e => {
      if (flat) return; e.preventDefault();
      const y = deck.getBoundingClientRect().top + scrollY + flowTop(j) - stickTop(j) + (j ? 2 : -8);
      scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', ch.getAttribute('href'));
    });
  });
  layout(); update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', () => { layout(); update(); });
  document.fonts && document.fonts.ready.then(() => { layout(); update(); });
  addEventListener('load', () => {
    layout(); update();
    const j = cards.findIndex(c => '#' + c.id === location.hash);
    if (j > -1 && !flat) scrollTo({ top: deck.getBoundingClientRect().top + scrollY + flowTop(j) - stickTop(j) + (j ? 2 : -8), behavior: 'auto' });
  });
})();

// ===== AI screening: stat numbers count up once =====
(() => {
  const sec = document.getElementById('ai'); if (!sec || reduce) return;
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return; o.disconnect();
    sec.querySelectorAll('[data-count]').forEach((el, k) => {
      const to = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now() + 350 + k * 150, dur = 1300;
      el.textContent = (0).toFixed(dec);
      const tick = now => { const t = Math.min(Math.max((now - t0) / dur, 0), 1);
        el.textContent = (to * (1 - Math.pow(1 - t, 3))).toFixed(dec); if (t < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }), { threshold: .35 }).observe(sec);
})();

// ===== Even more inside: the section pins; while it holds, the steps grow one after another =====
(() => {
  const pin = document.getElementById('morePin'); if (!pin) return;
  const sec = pin.querySelector('.more'), list = sec.querySelector('.stairs'), space = pin.querySelector('.more-pin__space');
  const steps = [...list.querySelectorAll('.stair')], n = steps.length;
  const ease = t => 1 - Math.pow(1 - t, 3);
  // step i grows during [i*a, i*a + d] of the pinned scroll, slight overlap, last one ends at 92%
  const d = 1.5 / (n - 1 + 1.5) * .92, a = (.92 - d) / (n - 1);
  let top = 100, dist = 1, flat = false, ticking = false;
  function layout(){
    const navH = navbar.offsetHeight, vh = innerHeight, mobile = innerWidth <= 760;
    // full-height measure: grow everything to read the section's final size
    steps.forEach(s => s.style.setProperty('--k', 1));
    const h = sec.offsetHeight;
    flat = reduce || h > vh - navH - 8;
    top = flat ? navH : navH + Math.max(0, (vh - navH - h) / 2);
    dist = flat ? 0 : (mobile ? 140 : 170) * n;
    pin.style.setProperty('--more-top', top.toFixed(0) + 'px');
    pin.style.setProperty('--more-space', dist + 'px');
    sec.style.position = flat ? 'relative' : '';
    sec.style.top = flat ? 'auto' : '';
    update();
  }
  function update(){
    ticking = false;
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    sec.classList.toggle('is-on', r.top < vh * .95);
    let p;
    if (reduce) p = 1;
    else if (flat) { const L = list.getBoundingClientRect(); p = Math.min(Math.max((vh * .95 - L.top) / (vh * .65), 0), 1); }
    else p = Math.min(Math.max((top - pin.getBoundingClientRect().top) / dist, 0), 1);
    steps.forEach((s, i) => s.style.setProperty('--k', ease(Math.min(Math.max((p - i * a) / d, 0), 1)).toFixed(4)));
    list.classList.toggle('is-done', p >= .92);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', layout);
  document.fonts && document.fonts.ready.then(layout);
  layout();
})();

// ===== How a hire moves / Why founders: steps grow in from the left, one by one, scrubbed by scroll =====
(() => {
  const list = document.querySelector('.flow__steps'); if (!list) return;
  const steps = [...list.querySelectorAll('.step')], n = steps.length;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const d = 1.6 / (n - 1 + 1.6), a = (1 - d) / (n - 1);
  let ticking = false;
  function update(){
    ticking = false;
    if (reduce) { steps.forEach(s => s.style.setProperty('--k', 1)); return; }
    const r = list.getBoundingClientRect(), vh = innerHeight;
    // starts when the row enters the lower part of the screen, done when it sits a bit above the middle
    const p = Math.min(Math.max((vh * .92 - r.top) / (vh * .55), 0), 1);
    steps.forEach((s, i) => s.style.setProperty('--k', ease(Math.min(Math.max((p - i * a) / d, 0), 1)).toFixed(4)));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
