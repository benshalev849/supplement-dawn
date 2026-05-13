(function () {
  function initTrustRows(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('[data-bloomli-trust-row]');

    sections.forEach(function (section) {
      if (section.dataset.bloomliTrustReady === 'true') return;

      var track = section.querySelector('[data-bloomli-trust-track]');
      var progress = section.querySelector('[data-bloomli-trust-progress]');
      var prev = section.querySelector('[data-bloomli-trust-prev]');
      var next = section.querySelector('[data-bloomli-trust-next]');
      if (!track || !progress) return;

      section.dataset.bloomliTrustReady = 'true';

      function getMaxScroll() {
        return Math.max(track.scrollWidth - track.clientWidth, 0);
      }

      function getStep() {
        var firstCard = track.querySelector('.bloomli-trust__card');
        if (!firstCard) return track.clientWidth;

        var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap);
        if (!Number.isFinite(gap)) gap = 0;

        return firstCard.getBoundingClientRect().width + gap;
      }

      function update() {
        var maxScroll = getMaxScroll();
        var ratio = maxScroll > 0 ? track.scrollLeft / maxScroll : 1;
        ratio = Math.max(0, Math.min(ratio, 1));

        progress.style.transform = 'scaleX(' + ratio + ')';

        if (prev) prev.disabled = track.scrollLeft <= 1;
        if (next) next.disabled = track.scrollLeft >= maxScroll - 1;
        section.classList.toggle('is-scrollable', maxScroll > 1);
      }

      function scrollByDirection(direction) {
        track.scrollBy({
          left: getStep() * direction,
          behavior: 'smooth',
        });
      }

      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);

      if (prev) {
        prev.addEventListener('click', function () {
          scrollByDirection(-1);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          scrollByDirection(1);
        });
      }

      update();
      requestAnimationFrame(update);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initTrustRows(document);
    });
  } else {
    initTrustRows(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initTrustRows(event.target);
  });
})();
