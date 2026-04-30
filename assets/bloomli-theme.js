(function () {
  function setHeaderStackHeight() {
    var bar = document.querySelector('.announcement-bar-section.shopify-section-group-header-group');
    var header = document.querySelector('.section-header.shopify-section-group-header-group');
    var barHeight = bar ? bar.offsetHeight : 0;
    var headerHeight = header ? header.offsetHeight : 0;

    document.documentElement.style.setProperty('--bloomli-announcement-height', barHeight + 'px');
    document.documentElement.style.setProperty('--bloomli-header-stack-height', barHeight + headerHeight + 'px');
  }

  setHeaderStackHeight();
  window.addEventListener('load', setHeaderStackHeight);
  window.addEventListener('resize', setHeaderStackHeight);
  document.addEventListener('shopify:section:load', setHeaderStackHeight);
  document.addEventListener('shopify:section:unload', setHeaderStackHeight);
})();

// ── FAQ accordion slide animation ──────────────────────────────────────────
(function () {
  function initAccordions(root) {
    var scope = root || document;
    scope.querySelectorAll('.collapsible-row-layout details').forEach(function (details) {
      var content = details.querySelector('.accordion__content');
      if (!content || content.dataset.bloomliAnim) return;
      content.dataset.bloomliAnim = '1';

      // Sync icon class with any server-rendered open state
      if (details.open) details.classList.add('is-open');

      details.querySelector('summary').addEventListener('click', function (e) {
        e.preventDefault();

        if (details.open) {
          // ── Closing ──────────────────────────────────────────────────
          // Toggle icon immediately — not after animation
          details.classList.remove('is-open');

          // Pin height at current measured value, then force reflow so
          // browser commits it before we start the transition to 0.
          content.style.height = content.scrollHeight + 'px';
          content.style.overflow = 'hidden';
          content.getBoundingClientRect(); // sync reflow — no rAF lag

          content.style.transition = 'height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease';
          content.style.height = '0';
          content.style.opacity = '0';

          content.addEventListener('transitionend', function handler(ev) {
            if (ev.propertyName !== 'height') return;
            content.removeEventListener('transitionend', handler);
            details.removeAttribute('open');
            content.style.cssText = '';
          });

        } else {
          // ── Opening ──────────────────────────────────────────────────
          details.classList.add('is-open'); // icon starts rotating immediately

          details.setAttribute('open', '');
          var targetH = content.scrollHeight;

          content.style.height = '0';
          content.style.opacity = '0';
          content.style.overflow = 'hidden';
          content.getBoundingClientRect(); // sync reflow

          content.style.transition = 'height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease';
          content.style.height = targetH + 'px';
          content.style.opacity = '1';

          content.addEventListener('transitionend', function handler(ev) {
            if (ev.propertyName !== 'height') return;
            content.removeEventListener('transitionend', handler);
            content.style.cssText = '';
          });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAccordions(); });
  } else {
    initAccordions();
  }
  document.addEventListener('shopify:section:load', function (e) { initAccordions(e.target); });
})();
