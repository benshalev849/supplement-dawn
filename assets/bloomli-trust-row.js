(() => {
  const selector = '[data-bloomli-trust-gallery]';

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getCards = (viewport) => Array.from(viewport.querySelectorAll('.bloomli-trust__card'));

  const getMaxScroll = (viewport) => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  const getStep = (viewport) => {
    const firstCard = viewport.querySelector('.bloomli-trust__card');
    if (!firstCard) return viewport.clientWidth;

    const styles = window.getComputedStyle(viewport.querySelector('[data-bloomli-trust-track]'));
    const gap = parseFloat(styles.columnGap || styles.gap || 0);

    return firstCard.getBoundingClientRect().width + (Number.isNaN(gap) ? 0 : gap);
  };

  const getCardScrollLeft = (viewport, index) => {
    const track = viewport.querySelector('[data-bloomli-trust-track]');
    const cards = getCards(viewport);
    const card = cards[index];
    if (!track || !card) return 0;

    return clamp(card.offsetLeft - track.offsetLeft, 0, getMaxScroll(viewport));
  };

  const getActiveIndex = (viewport) => {
    const cards = getCards(viewport);
    const maxScroll = getMaxScroll(viewport);
    if (!cards.length || maxScroll <= 1) return 0;

    return cards.reduce(
      (closest, card, index) => {
        const distance = Math.abs(viewport.scrollLeft - getCardScrollLeft(viewport, index));

        if (distance <= closest.distance + 0.5) {
          return { index, distance };
        }

        return closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY }
    ).index;
  };

  const setActiveDot = (dots, activeIndex) => {
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;

      dot.classList.toggle('slider-counter__link--active', isActive);

      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  };

  const updateControls = (section) => {
    const viewport = section.querySelector('[data-bloomli-trust-viewport]');
    const prev = section.querySelector('[data-bloomli-trust-prev]');
    const next = section.querySelector('[data-bloomli-trust-next]');
    const dots = Array.from(section.querySelectorAll('[data-bloomli-trust-dot]'));
    if (!viewport) return;

    const maxScroll = Math.max(0, getMaxScroll(viewport) - 1);
    const activeIndex = getActiveIndex(viewport);

    if (prev) prev.disabled = viewport.scrollLeft <= 1;
    if (next) next.disabled = viewport.scrollLeft >= maxScroll;
    setActiveDot(dots, activeIndex);
  };

  const initSection = (section) => {
    if (section.dataset.bloomliTrustReady === 'true') return;

    const viewport = section.querySelector('[data-bloomli-trust-viewport]');
    const prev = section.querySelector('[data-bloomli-trust-prev]');
    const next = section.querySelector('[data-bloomli-trust-next]');
    const dots = Array.from(section.querySelectorAll('[data-bloomli-trust-dot]'));
    if (!viewport) return;

    if (prev) {
      prev.addEventListener('click', () => {
        viewport.scrollBy({ left: -getStep(viewport), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        viewport.scrollBy({ left: getStep(viewport), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = Number(dot.dataset.bloomliTrustIndex);
        if (Number.isNaN(index)) return;

        viewport.scrollTo({
          left: getCardScrollLeft(viewport, index),
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });

        setActiveDot(dots, index);
      });
    });

    viewport.addEventListener('scroll', () => updateControls(section), { passive: true });
    window.addEventListener('resize', () => updateControls(section), { passive: true });

    updateControls(section);
    requestAnimationFrame(() => updateControls(section));
    section.dataset.bloomliTrustReady = 'true';
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
