(function () {
  if (window.BloomliJourneyTimeline) {
    window.BloomliJourneyTimeline.refresh();
    return;
  }

  var selector = '[data-bloomli-journey]';
  var ticking = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function update() {
    ticking = false;

    document.querySelectorAll(selector).forEach(function (section) {
      if (reducedMotion.matches) {
        section.style.setProperty('--journey-progress', '100%');
        return;
      }

      var rect = section.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

      if (rect.top >= viewportHeight) {
        section.style.setProperty('--journey-progress', '0%');
        return;
      }

      if (rect.bottom <= 0) {
        section.style.setProperty('--journey-progress', '100%');
        return;
      }

      var start = viewportHeight * 0.75;
      var end = viewportHeight * 0.25 - rect.height;
      var progress = clamp((start - rect.top) / (start - end));

      section.style.setProperty('--journey-progress', progress * 100 + '%');
    });
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.BloomliJourneyTimeline = {
    refresh: requestUpdate
  };

  document.addEventListener('DOMContentLoaded', requestUpdate);
  document.addEventListener('shopify:section:load', requestUpdate);
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', requestUpdate);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(requestUpdate);
  }

  requestUpdate();
})();
