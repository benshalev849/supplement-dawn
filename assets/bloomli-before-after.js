(() => {
  const selector = '[data-bloomli-results-gallery][data-bloomli-results-gallery-carousel="true"]';

  const getStep = (viewport) => {
    const firstCard = viewport.querySelector('.bloomli-before-after__card');
    if (!firstCard) return viewport.clientWidth;

    const styles = window.getComputedStyle(viewport.querySelector('[data-bloomli-results-track]'));
    const gap = parseFloat(styles.columnGap || styles.gap || 0);

    return firstCard.getBoundingClientRect().width + (Number.isNaN(gap) ? 0 : gap);
  };

  const updateControls = (section) => {
    const viewport = section.querySelector('[data-bloomli-results-viewport]');
    const prev = section.querySelector('[data-bloomli-results-prev]');
    const next = section.querySelector('[data-bloomli-results-next]');
    if (!viewport || !prev || !next) return;

    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 1);
    prev.disabled = viewport.scrollLeft <= 1;
    next.disabled = viewport.scrollLeft >= maxScroll;
  };

  const initSection = (section) => {
    if (section.dataset.bloomliResultsReady === 'true') return;

    const viewport = section.querySelector('[data-bloomli-results-viewport]');
    const prev = section.querySelector('[data-bloomli-results-prev]');
    const next = section.querySelector('[data-bloomli-results-next]');
    if (!viewport || !prev || !next) return;

    prev.addEventListener('click', () => {
      viewport.scrollBy({ left: -getStep(viewport), behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
      viewport.scrollBy({ left: getStep(viewport), behavior: 'smooth' });
    });

    viewport.addEventListener('scroll', () => updateControls(section), { passive: true });
    window.addEventListener('resize', () => updateControls(section), { passive: true });

    updateControls(section);
    section.dataset.bloomliResultsReady = 'true';
  };

  const initAll = (root = document) => {
    root.querySelectorAll(selector).forEach(initSection);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(), { once: true });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
