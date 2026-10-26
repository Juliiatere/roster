// Integrations: category filter for the grid
(() => {
  const chips = [...document.querySelectorAll('.ig-chip')], cards = [...document.querySelectorAll('.ig-card')];
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); });
    const f = c.dataset.f;
    cards.forEach(card => card.classList.toggle('is-hidden', f !== 'all' && card.dataset.cat !== f));
  }));
})();
