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

// ── FAQ accordion slide animation (CSS grid trick, cross-browser) ──────────
(function () {
  // Inject an inner wrapper so padding lives inside the overflow-clip div,
  // keeping .accordion__content padding-free for a clean 0fr collapse.
  function wrapContent(content) {
    if (content.dataset.bloomliWrapped) return;
    content.dataset.bloomliWrapped = '1';
    var inner = document.createElement('div');
    inner.className = 'accordion__content__inner';
    while (content.firstChild) inner.appendChild(content.firstChild);
    content.appendChild(inner);
  }

  function initAccordions(root) {
    var scope = root || document;
    scope.querySelectorAll('.collapsible-row-layout details').forEach(function (details) {
      var content = details.querySelector('.accordion__content');
      if (!content || content.dataset.bloomliAnim) return;
      content.dataset.bloomliAnim = '1';

      wrapContent(content);

      // Sync icon state for any server-rendered open accordion
      if (details.open) details.classList.add('is-open');

      details.querySelector('summary').addEventListener('click', function (e) {
        e.preventDefault();

        if (details.open) {
          // ── Closing ──────────────────────────────────────────────────
          // Remove is-open → CSS transitions grid-template-rows 1fr → 0fr
          details.classList.remove('is-open');

          // Wait for the CSS transition to finish, then remove [open] so the
          // native <details> state matches the visual state.
          content.addEventListener('transitionend', function handler(ev) {
            if (ev.propertyName !== 'grid-template-rows') return;
            content.removeEventListener('transitionend', handler);
            details.removeAttribute('open');
          });

        } else {
          // ── Opening ──────────────────────────────────────────────────
          // Add [open] first so the browser puts the content in the DOM.
          // display:grid !important (CSS) keeps it rendered; grid-template-rows
          // starts at 0fr. One rAF lets the browser commit that initial state,
          // then adding is-open triggers the CSS 0fr → 1fr transition.
          details.setAttribute('open', '');

          requestAnimationFrame(function () {
            details.classList.add('is-open');
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
