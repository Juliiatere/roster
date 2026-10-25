// Home page only (needs main.js loaded first: navbar, reduce)
const win = document.getElementById('window');
const winMobile = document.querySelector('.showcase__mobile');
const floats = [...document.querySelectorAll('.float')];
let ticking = false;
function onScroll(){
if(!reduce){
  // at scroll 0 the window sits exactly as in Figma; on scroll it drifts slightly (parallax)
  win.style.setProperty('--win-y', Math.min(scrollY * 0.12, 48).toFixed(1) + 'px');
  winMobile.style.setProperty('--win-y', Math.min(scrollY * 0.05, 12).toFixed(1) + 'px');
  floats.forEach(f => f.style.setProperty('--py', (-Math.min(scrollY, 700) * f.dataset.speed).toFixed(1) + 'px'));
}
fillText();
playStmt();
ticking = false;
}
// ===== Trustbadg: pinned while the text fills on scroll =====
const trust = document.getElementById('trust');
const trustPin = document.getElementById('trustPin');
const tText = document.getElementById('trustText');
tText.setAttribute('aria-label', tText.textContent);
const splitWords = (str, hl) => str.split(/(\s+)/).map(w => /\s/.test(w) ? w :
  '<span style="white-space:nowrap" aria-hidden="true">' + [...w].map(c => '<span class="ch' + (hl ? ' ch--hl' : '') + '">' + c + '</span>').join('') + '</span>').join('');
tText.innerHTML = [...tText.childNodes].map(n => n.nodeType === 3 ? splitWords(n.textContent, false)
  : '<em class="hl">' + splitWords(n.textContent, true) + '</em>').join('');
const chars = [...tText.querySelectorAll('.ch')];
const hlChars = chars.filter(c => c.classList.contains('ch--hl'));
let pinTop = 84, pinDist = 1;
function layoutTrust(){
  // gradient spans the paragraph width: each highlighted glyph shows its own slice
  const pr = tText.getBoundingClientRect();
  tText.style.setProperty('--gw', pr.width.toFixed(1) + 'px');
  hlChars.forEach(c => c.style.setProperty('--gx', (pr.left - c.getBoundingClientRect().left).toFixed(1) + 'px'));
  // where the section sticks: centred under the navbar if it fits, otherwise keep the text visible
  const navH = navbar.offsetHeight, h = trust.offsetHeight, vh = innerHeight;
  pinTop = h <= vh - navH ? navH + (vh - navH - h) / 2 : Math.max(vh - h, navH + 12 - tText.offsetTop);
  trust.style.setProperty('--pin-top', pinTop.toFixed(1) + 'px');
  pinDist = trustPin.querySelector('.trust-pin__space').offsetHeight || 1;
}
const SOFT = 8; // how many characters the fill edge is spread over
function fillText(){
  let prog;
  if (reduce) prog = 1;
  else {
    // starts filling as the block scrolls in, finishes at ~85% of the pinned distance, then the page moves on
    const top = trustPin.getBoundingClientRect().top;
    const from = pinTop + innerHeight * .35, to = pinTop - pinDist * .85;
    prog = Math.min(Math.max((from - top) / (from - to), 0), 1);
  }
  const lit = prog * (chars.length + SOFT);
  chars.forEach((c, i) => c.style.setProperty('--p', Math.min(Math.max((lit - i) / SOFT, 0), 1).toFixed(3)));
}
layoutTrust();
addEventListener('resize', () => { layoutTrust(); fillText(); });
document.fonts && document.fonts.ready.then(() => { layoutTrust(); fillText(); });
// ===== Trustbadg: reveal + count-up =====
const io = new IntersectionObserver(es => es.forEach(e => {
  if(!e.isIntersecting) return;
  trust.classList.add('in-view');
  if(!reduce) trust.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
    const step = now => { const k = Math.min((now - t0) / dur, 1), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
      el.textContent = pre + v + suf; if(k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  io.disconnect();
}), {threshold:.35});
io.observe(trust);

// ===== Scroll statement: pinned, A appears word by word → A fades (highlight stays) → B appears =====
const stmt = document.getElementById('stmt'), stmtPin = document.getElementById('stmtPin');
const stmtBg = stmt.querySelector('.stmt__bg');
const prep = el => {
  el.setAttribute('aria-label', el.textContent);
  el.innerHTML = [...el.childNodes].map(n => n.textContent.trim().split(/\s+/).filter(Boolean)
    .map(w => '<span class="w' + (n.nodeType === 1 ? ' w--hl' : '') + '" aria-hidden="true">' + w + '</span>').join(' ')).join(' ');
  const words = [...el.querySelectorAll('.w')];
  return { el, words, hl: words.filter(w => w.classList.contains('w--hl')), plain: words.filter(w => !w.classList.contains('w--hl')) };
};
const A = prep(document.getElementById('stmtA')), B = prep(document.getElementById('stmtB'));
let stmtTop = 84, stmtDist = 1;
function layoutStmt(){
  [A, B].forEach(S => { const r = S.el.getBoundingClientRect();
    S.el.style.setProperty('--gw', r.width.toFixed(1) + 'px');
    S.hl.forEach(w => w.style.setProperty('--gx', (r.left - w.getBoundingClientRect().left).toFixed(1) + 'px')); });
  const navH = navbar.offsetHeight, h = stmt.offsetHeight;
  stmtTop = Math.max(navH, navH + (innerHeight - navH - h) / 2);
  stmt.style.setProperty('--stmt-top', stmtTop.toFixed(1) + 'px');
  stmtDist = stmtPin.querySelector('.stmt-pin__space').offsetHeight || 1;
}
const seg = (t, a, b) => Math.min(Math.max((t - a) / (b - a), 0), 1);
const W_SOFT = 5; // trailing words: 1 → .8 → .6 … → .06, like state 1 in Figma
const reveal = (S, k) => { const lit = k * (S.words.length + W_SOFT);
  S.words.forEach((w, i) => w.style.setProperty('--o', (0.06 + 0.94 * Math.min(Math.max((lit - i) / W_SOFT, 0), 1)).toFixed(3))); };
function playStmt(){
  let t;
  if (reduce) t = 0.35;
  else { const top = stmtPin.getBoundingClientRect().top, from = stmtTop + innerHeight * .4, to = stmtTop - stmtDist;
    t = seg(top, from, to); }
  // 1–2 · A appears word by word
  reveal(A, seg(t, 0, .3));
  // 3 · A fades from the highlight backwards, highlight stays
  const f = seg(t, .38, .52), n = A.plain.length, K = 4;
  if (f > 0) A.plain.forEach((w, i) => { const j = n - 1 - i; const k = Math.min(Math.max((f * (n + K) - j) / K, 0), 1);
    w.style.setProperty('--o', (1 - 0.91 * k).toFixed(3)); });
  // A leaves, B comes in
  const swap = t >= .58;
  A.el.classList.toggle('is-out', swap);
  B.el.classList.toggle('is-wait', !swap);
  // 4–5 · B appears word by word
  reveal(B, seg(t, .62, .92));
  stmt.classList.toggle('has-btn', t >= .26 || reduce);
  if (!reduce) stmtBg.style.setProperty('--bg-s', (1.06 - 0.06 * t).toFixed(4));
}
layoutStmt();
addEventListener('resize', () => { layoutStmt(); playStmt(); });
document.fonts && document.fonts.ready.then(() => { layoutStmt(); playStmt(); });

// ===== One tool. Every hire.: sticky stack — next card covers, previous shrinks + blurs, active border passes on =====
(() => {
  const wrap = document.getElementById('tstack'); if (!wrap) return;
  const cards = [...wrap.querySelectorAll('.tcard')];
  const tabs = [...document.querySelectorAll('#prTabs .pr__tab')], pill = document.querySelector('#prTabs .pr__pill');
  const movePill = el => { pill.style.width = el.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (el.offsetLeft - 4) + 'px)'; };
  let tabI = 0;
  if (tabs.length) { movePill(tabs[0]);
    if (!reduce) setInterval(() => { if (!cards[0].matches('.is-active')) return; tabs[tabI].classList.remove('is-on'); tabI = (tabI + 1) % 3; tabs[tabI].classList.add('is-on'); movePill(tabs[tabI]); }, 2600); }
  let baseTop = 124, step = 18, gap = 32, h = 280;
  const sec = wrap.closest('.tools');
  function layout(){
    const navH = navbar.offsetHeight, mobile = innerWidth <= 760;
    step = mobile ? 12 : 18;
    gap = parseFloat(getComputedStyle(cards[1]).marginTop) || 32;
    h = cards[0].offsetHeight;
    // pin near the top: room above for the stepped edges of the cards underneath
    baseTop = navH + (mobile ? 16 : 32);
    wrap.style.setProperty('--stack-top', baseTop + 'px');
    // after the last card lands, hold the whole deck briefly; if nothing follows yet, leave room to reach it
    const lastStick = baseTop + (cards.length - 1) * step;
    const tail = sec.nextElementSibling ? 160 : Math.max(160, innerHeight - lastStick - cards[cards.length - 1].offsetHeight - 48);
    wrap.style.setProperty('--stack-tail', tail.toFixed(0) + 'px');
    if (tabs.length) movePill(tabs[tabI]);
    const col = wrap.querySelector('.collab');
    if (col) col.style.setProperty('--cs', mobile ? Math.min(1, (cards[3].clientWidth - 48) / 453).toFixed(3) : 1);
  }
  function update(){
    const n = cards.length;
    // raw[j]: 0 when card j sits in the flow right below card j-1, 1 when it has landed on top of it
    const raw = cards.map((c, j) => { if (!j) return 1;
      const stick = baseTop + j * step, start = baseTop + (j - 1) * step + cards[j - 1].offsetHeight + gap;
      return Math.min(Math.max((start - c.getBoundingClientRect().top) / (start - stick), 0), 1); });
    let active = 0;
    cards.forEach((c, i) => {
      // depth = how many cards (fractionally) now lie on top of this one
      let depth = 0; for (let j = i + 1; j < n; j++) depth += raw[j];
      const s = reduce ? 1 : 1 - depth * 0.045;               // deck: each card underneath a bit narrower
      c.style.transform = depth > .001 && !reduce ? 'scale(' + s.toFixed(4) + ')' : '';
      c.style.filter = depth > .001 && !reduce ? 'brightness(' + (1 - Math.min(depth, 2) * .1).toFixed(3) + ') blur(' + Math.min(depth * .6, 1.2).toFixed(2) + 'px)' : '';
      c.style.setProperty('--u', Math.min(depth, 1).toFixed(3));
      c.classList.toggle('is-under', depth > .5);
      // active gradient border hands over during the second half of the next card's approach
      const next = i + 1 < n ? Math.min(Math.max((raw[i + 1] - .5) / .5, 0), 1) : 0;
      const mine = i ? Math.min(Math.max((raw[i] - .5) / .5, 0), 1) : 1;
      const a = Math.min(mine, 1 - next);
      c.style.setProperty('--a', a.toFixed(3));
      if (a > .5) active = i;
    });
    cards.forEach((c, i) => c.classList.toggle('is-active', i === active));
  }
  layout(); update();
  addEventListener('scroll', update, {passive:true});
  addEventListener('resize', () => { layout(); update(); });
  document.fonts && document.fonts.ready.then(() => { layout(); update(); });
})();

// ===== Built for the people…: block pins, each tab owns a stretch of scroll; the right screen follows =====
(() => {
  const track = document.getElementById('rolesTrack'); if (!track) return;
  const pin = track.querySelector('.roles__pin');
  const items = [...track.querySelectorAll('.role')], shots = [...track.querySelectorAll('.roles__screen img')];
  let STEP = 420, cur = -1;
  function setActive(i){
    if (i === cur) return; cur = i;
    items.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.setAttribute('aria-pressed', k === i); });
    shots.forEach((el, k) => el.classList.toggle('is-on', k === i));
  }
  function setup(){
    const mobile = innerWidth <= 760;
    STEP = mobile ? 360 : 420;
    const navH = navbar.offsetHeight;
    track.style.setProperty('--roles-top', (navH + (mobile ? 16 : 24)) + 'px');
    track.style.height = reduce ? 'auto' : (items.length * STEP + pin.offsetHeight) + 'px';
  }
  function update(){
    if (reduce) return;
    const top = parseFloat(getComputedStyle(track).getPropertyValue('--roles-top')) || 108;
    const scrolled = top - track.getBoundingClientRect().top;
    const p = Math.min(Math.max(scrolled / (items.length * STEP), 0), .9999);
    const idx = Math.floor(p * items.length);
    setActive(idx);
    // the active tab's left bar fills as you scroll through its stretch
    items.forEach((el, k) => el.style.setProperty('--fill', k < idx ? 1 : k > idx ? 0 : (p * items.length - idx).toFixed(3)));
  }
  // clicking a tab scrolls to its stretch
  items.forEach((el, k) => el.addEventListener('click', () => {
    if (reduce) { setActive(k); return; }
    const top = parseFloat(getComputedStyle(track).getPropertyValue('--roles-top')) || 108;
    scrollTo({ top: track.getBoundingClientRect().top + scrollY - top + k * STEP + STEP * .3, behavior: 'smooth' });
  }));
  setActive(0); setup(); update();
  addEventListener('scroll', update, {passive:true});
  addEventListener('resize', () => { setup(); update(); });
  document.fonts && document.fonts.ready.then(() => { setup(); update(); });
})();

addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
onScroll();
