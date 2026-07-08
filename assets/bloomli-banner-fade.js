(function () {
  function initBannerFade(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;

    root.querySelectorAll('.banner--fade-media').forEach(function (banner) {
      if (banner.dataset.fadeReady === 'true') return;
      banner.dataset.fadeReady = 'true';

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      var img = banner.querySelector('.banner__media img');
      if (!img) return;

      // Already rendered (cache hit) — leave it visible, nothing to animate
      if (img.complete && img.naturalWidth > 0) return;

      function reveal() {
        img.classList.add('fade-media-loaded');
      }

      banner.classList.add('fade-media-armed');
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
      // Covers a load that finished between the checks above
      if (img.complete) reveal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initBannerFade(document);
    });
  } else {
    initBannerFade(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initBannerFade(event.target);
  });
})();
