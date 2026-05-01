(() => {
  const selector = '[data-bloomli-before-after]';

  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 50));

  const update = (section, input) => {
    section.style.setProperty('--bba-position', `${clamp(input.value)}%`);
  };

  const updateFromPointer = (section, input, event) => {
    const frame = section.querySelector('[data-bloomli-before-after-frame]');
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    if (!rect.width) return;

    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    input.value = String(clamp(percent));
    update(section, input);
  };

  const initSection = (section) => {
    if (section.dataset.bloomliBeforeAfterReady === 'true') return;

    const input = section.querySelector('[data-bloomli-before-after-range]');
    const frame = section.querySelector('[data-bloomli-before-after-frame]');
    if (!input) return;

    update(section, input);
    input.addEventListener('input', () => update(section, input), { passive: true });

    if (frame) {
      frame.addEventListener('pointerdown', (event) => {
        updateFromPointer(section, input, event);
        frame.setPointerCapture(event.pointerId);
      });

      frame.addEventListener('pointermove', (event) => {
        if (event.buttons !== 1) return;
        updateFromPointer(section, input, event);
      });
    }

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
