(() => {
  const revealAll = (items) => items.forEach((item) => item.classList.add('is-visible'));

  const initialize = (root) => {
    if (!root || root.dataset.revealInitialized === 'true') return;
    root.dataset.revealInitialized = 'true';

    const items = root.querySelectorAll('[data-bloomli-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealAll(items);
      return;
    }

    root.classList.add('is-reveal-ready');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px 12% 0px', threshold: 0.04 }
    );

    items.forEach((item) => observer.observe(item));
    window.setTimeout(() => {
      revealAll(items);
      observer.disconnect();
    }, 1800);
  };

  const initializeAll = (scope = document) => {
    scope.querySelectorAll('[data-bloomli-glp1-listicle]').forEach(initialize);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeAll(), { once: true });
  } else {
    initializeAll();
  }

  document.addEventListener('shopify:section:load', (event) => initializeAll(event.target));
})();
