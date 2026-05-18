(function () {
  function initBrandDifference(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var wraps = root.querySelectorAll('.bloomli-brand-difference__table-wrap');

    wraps.forEach(function (wrap) {
      if (wrap.dataset.bloomliBrandDifferenceReady === 'true') return;

      wrap.dataset.bloomliBrandDifferenceReady = 'true';
      var hideTimer;

      wrap.addEventListener(
        'scroll',
        function () {
          if (!window.matchMedia('(max-width: 768px)').matches) return;

          wrap.classList.add('is-scrolling');
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(function () {
            wrap.classList.remove('is-scrolling');
          }, 700);
        },
        { passive: true }
      );
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initBrandDifference(document);
    });
  } else {
    initBrandDifference(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initBrandDifference(event.target);
  });
})();
