(() => {
  const selector = '[data-bloomli-reviews-carousel]';

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getCards = (carousel) => Array.from(carousel.querySelectorAll('.bloomli-reviews__card'));

  const getViewport = (carousel) => carousel.querySelector('[data-bloomli-reviews-viewport]');

  const getMaxScroll = (viewport) => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  const getStep = (carousel, viewport) => {
    const cards = getCards(carousel);
    const first = cards[0];
    const second = cards[1];

    if (!first) return viewport.clientWidth;
    if (!second) return first.getBoundingClientRect().width;

    return second.offsetLeft - first.offsetLeft;
  };

  const updateControls = (carousel) => {
    const viewport = getViewport(carousel);
    const prev = carousel.querySelector('[data-bloomli-reviews-prev]');
    const next = carousel.querySelector('[data-bloomli-reviews-next]');

    if (!viewport) return;

    const maxScroll = getMaxScroll(viewport);
    const atStart = viewport.scrollLeft <= 2;
    const atEnd = viewport.scrollLeft >= maxScroll - 2;

    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd || maxScroll <= 2;
  };

  const scrollCarousel = (carousel, direction) => {
    const viewport = getViewport(carousel);
    if (!viewport) return;

    viewport.scrollBy({
      left: getStep(carousel, viewport) * direction,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const initCarousel = (carousel) => {
    if (carousel.dataset.bloomliReviewsReady === 'true') return;

    const viewport = getViewport(carousel);
    const prev = carousel.querySelector('[data-bloomli-reviews-prev]');
    const next = carousel.querySelector('[data-bloomli-reviews-next]');

    if (!viewport) return;

    if (prev) {
      prev.addEventListener('click', () => scrollCarousel(carousel, -1));
    }

    if (next) {
      next.addEventListener('click', () => scrollCarousel(carousel, 1));
    }

    viewport.addEventListener('scroll', () => updateControls(carousel), { passive: true });
    window.addEventListener('resize', () => updateControls(carousel), { passive: true });

    updateControls(carousel);
    requestAnimationFrame(() => updateControls(carousel));
    carousel.dataset.bloomliReviewsReady = 'true';
  };

  const initAll = (root = document) => {
    root.querySelectorAll(selector).forEach(initCarousel);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(), { once: true });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
