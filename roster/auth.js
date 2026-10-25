// Sign up / Log in demo: one screen, two modes (?mode=login). Nothing is submitted anywhere.
(() => {
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const apply = mode => {
    body.dataset.mode = mode;
    document.title = (mode === 'login' ? 'Log in' : 'Sign up') + ' — Roster';
    document.querySelectorAll('[data-signup]').forEach(el => {
      const v = el.dataset[mode];
      if (el.tagName === 'IMG') el.src = v;
      else if (el.tagName === 'BLOCKQUOTE') el.innerHTML = v;
      else el.textContent = v;
    });
    const t = document.getElementById('authToggle');
    t.href = mode === 'login' ? 'auth.html' : 'auth.html?mode=login';
    document.querySelector('[name=password]').closest('label').querySelector('input').required = mode === 'login';
  };
  apply(new URLSearchParams(location.search).get('mode') === 'login' ? 'login' : 'signup');
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('is-ready')));

  // switch modes in place (no reload), with a short crossfade
  document.getElementById('authToggle').addEventListener('click', e => {
    e.preventDefault();
    const next = body.dataset.mode === 'login' ? 'signup' : 'login';
    history.replaceState(null, '', next === 'login' ? '?mode=login' : location.pathname);
    if (reduce) { apply(next); return; }
    body.classList.add('is-swapping');
    setTimeout(() => { apply(next); body.classList.remove('is-swapping'); }, 260);
  });

  // demo: buttons and form do nothing
  document.getElementById('authForm').addEventListener('submit', e => e.preventDefault());
})();
