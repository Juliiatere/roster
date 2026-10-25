// Pricing page: Growth price in the table header follows the Monthly / Annually toggle; sticky header sits under the navbar
(() => {
  const set = () => document.documentElement.style.setProperty('--ct-top', navbar.offsetHeight + 'px');
  set(); addEventListener('resize', set);
  const em = document.querySelector('.ct__plan em[data-monthly]');
  document.querySelectorAll('.toggle button').forEach(b => b.addEventListener('click', () => { if (em) em.textContent = em.dataset[b.dataset.period]; }));
})();
