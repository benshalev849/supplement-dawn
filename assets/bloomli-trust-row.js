(() => {
  const selector = '[data-bloomli-trust-gallery]';

  const getStep = (viewport) => {
    const firstCard = viewport.querySelector('.bloomli-trust__card');
    if (!firstCard) return viewport.clientWidth;

    const styles = window.getComputedStyle(viewport.querySelector('[data-bloomli-trust-track]'));
    const gap = parseFloat(styles.columnGap || styles.gap || 0);

    return firstCard.getBoundingClientRect().width + (Number.isNaN(gap) ? 0 : gap);
  };

  const updateControls = (section) => {
    const viewport = section.querySelector('[data-bloomli-trust-viewport]');
    const prev = section.querySelector('[data-bloomli-trust-prev]');
    const next = section.querySelector('[data-bloomli-trust-next]');
    const progress = section.querySelector('[data-bloomli-trust-progress]');
    if (!viewport) return;

    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 1);
    const progressRatio = maxScroll > 0 ? viewport.scrollLeft / maxScroll : 1;

    if (prev) prev.disabled = viewport.scrollLeft <= 1;
    if (next) next.disabled = viewport.scrollLeft >= maxScroll;
    if (progress) progress.style.transform = `scaleX(${Math.max(0, Math.min(progressRatio, 1))})`;
  };

  const initSection = (section) => {
    if (section.dataset.bloomliTrustReady === 'true') return;

    const viewport = section.querySelector('[data-bloomli-trust-viewport]');
    const prev = section.querySelector('[data-bloomli-trust-prev]');
    const next = section.querySelector('[data-bloomli-trust-next]');
    if (!viewport) return;

    if (prev) {
      prev.addEventListener('click', () => {
        viewport.scrollBy({ left: -getStep(viewport), behavior: 'smooth' });
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        viewport.scrollBy({ left: getStep(viewport), behavior: 'smooth' });
      });
    }

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
