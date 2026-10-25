// Book a demo: details → pick a time → booked. Front-end only, nothing is sent.
(() => {
  const body = document.body;
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('is-ready')));
  const panes = [...document.querySelectorAll('.demo__pane')];
  const go = n => { body.dataset.step = n; panes.forEach(p => p.hidden = p.dataset.pane != n); const f = panes[n - 1].querySelector('input,button'); f && f.focus({ preventScroll: true }); };
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));

  // step 1: name + valid work email are required
  const form = document.getElementById('demoDetails'), err = document.getElementById('demoErr');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), mail = form.email;
    form.querySelectorAll('.auth__field').forEach(l => l.classList.remove('is-bad'));
    let msg = '';
    if (!name) { form.name.closest('label').classList.add('is-bad'); msg = 'Please add your name.'; }
    if (!mail.value || !mail.checkValidity()) { mail.closest('label').classList.add('is-bad'); msg = msg ? 'Please add your name and a valid work email.' : 'Please enter a valid work email.'; }
    err.textContent = msg;
    if (!msg) { document.getElementById('demoMail').textContent = mail.value; go(2); }
  });

  // step 2: next 5 weekdays, a few 30-min slots each
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
  document.getElementById('demoTz').textContent = tz.replace(/_/g, ' ');
  const daysEl = document.getElementById('demoDays'), slotsEl = document.getElementById('demoSlots'), confirm = document.getElementById('demoConfirm');
  const SLOTS = ['09:00', '09:30', '10:30', '11:00', '13:00', '14:30', '15:30', '16:00'];
  const days = []; const d = new Date(); d.setHours(0, 0, 0, 0);
  while (days.length < 5) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) days.push(new Date(d)); }
  let pickDay = null, pickTime = null;
  const fmt = (o) => new Intl.DateTimeFormat('en-GB', o);
  days.forEach((day, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'demo__day'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.innerHTML = '<small>' + fmt({ weekday: 'short' }).format(day) + '</small><b>' + day.getDate() + '</b><small>' + fmt({ month: 'short' }).format(day) + '</small>';
    b.addEventListener('click', () => selectDay(i));
    daysEl.appendChild(b);
  });
  function selectDay(i){
    pickDay = days[i]; pickTime = null; confirm.disabled = true;
    [...daysEl.children].forEach((b, k) => b.setAttribute('aria-checked', k === i));
    slotsEl.innerHTML = '';
    SLOTS.forEach((t, k) => {
      const s = document.createElement('button');
      s.type = 'button'; s.className = 'demo__slot'; s.textContent = t; s.style.setProperty('--k', k);
      s.setAttribute('role', 'radio'); s.setAttribute('aria-checked', 'false');
      s.disabled = (k * 7 + i * 3) % 5 === 0;            // a few slots already taken, varies by day
      s.addEventListener('click', () => { pickTime = t; confirm.disabled = false; [...slotsEl.children].forEach(x => x.setAttribute('aria-checked', x === s)); });
      slotsEl.appendChild(s);
    });
  }
  selectDay(0);
  confirm.addEventListener('click', () => {
    if (!pickDay || !pickTime) return;
    document.getElementById('demoWhen').textContent = fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(pickDay) + ' at ' + pickTime + ' · 30 min';
    go(3);
  });
})();
