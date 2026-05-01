(() => {
  const selector = '[data-bloomli-before-after]';

  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 50));

  const update = (section, input) => {
    section.style.setProperty('--bba-position', `${clamp(input.value)}%`);
  };

  const initSection = (section) => {
    if (section.dataset.bloomliBeforeAfterReady === 'true') return;

    const input = section.querySelector('[data-bloomli-before-after-range]');
    if (!input) return;

    update(section, input);
    input.addEventListener('input', () => update(section, input), { passive: true });
    section.dataset.bloomliBeforeAfterReady = 'true';
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
