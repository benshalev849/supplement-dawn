(() => {
  const selector = '[data-bloomli-before-after]';

  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 50));

  const update = (section, input) => {
    section.style.setProperty('--bba-position', `${clamp(input.value)}%`);
  };

  const updateFromPointer = (section, input, frame, event) => {
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const direction = section.dataset.bloomliBeforeAfterDirection || 'horizontal';
    const percent = direction === 'vertical'
      ? ((event.clientY - rect.top) / rect.height) * 100
      : ((event.clientX - rect.left) / rect.width) * 100;

    input.value = String(clamp(percent));
    update(section, input);
  };

  const initSection = (section) => {
    if (section.dataset.bloomliBeforeAfterReady === 'true') return;

    const input = section.querySelector('[data-bloomli-before-after-range]');
    const frame = section.querySelector('[data-bloomli-before-after-frame]');
    if (!input || !frame) return;

    const direction = section.dataset.bloomliBeforeAfterDirection || 'horizontal';

    update(section, input);

    if (direction === 'horizontal') {
      // Horizontal: native range input drives everything — reliable cross-browser.
      input.addEventListener('input', () => update(section, input), { passive: true });
    } else {
      // Vertical: native range is horizontal so it can't track Y.
      // Frame pointer events own the whole interaction (range has pointer-events:none in CSS).
      let active = false;

      frame.addEventListener('pointerdown', (event) => {
        active = true;
        frame.setPointerCapture(event.pointerId);
        updateFromPointer(section, input, frame, event);
      });

      frame.addEventListener('pointermove', (event) => {
        if (!active) return;
        updateFromPointer(section, input, frame, event);
      }, { passive: true });

      frame.addEventListener('pointerup', () => { active = false; });
      frame.addEventListener('pointercancel', () => { active = false; });
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
