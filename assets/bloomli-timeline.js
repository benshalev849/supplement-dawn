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
        setReachedSteps(section, 1);
        return;
      }

      var rect = section.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

      if (rect.top >= viewportHeight) {
        section.style.setProperty('--journey-progress', '0%');
        setReachedSteps(section, 0);
        return;
      }

      if (rect.bottom <= 0) {
        section.style.setProperty('--journey-progress', '100%');
        setReachedSteps(section, 1);
        return;
      }

      var start = viewportHeight * 0.95;
      var end = viewportHeight * 0.82 - rect.height;
      var progress = clamp((start - rect.top) / (start - end));

      section.style.setProperty('--journey-progress', progress * 100 + '%');
      setReachedSteps(section, progress);
    });
  }

  function setReachedSteps(section, progress) {
    var steps = section.querySelectorAll('.bloomli-journey__step');
    var lastIndex = Math.max(steps.length - 1, 1);
    var reachOffset = steps.length > 2 ? 0.08 : 0.025;

    steps.forEach(function (step, index) {
      var threshold = index / lastIndex;
      step.classList.toggle('is-reached', progress + reachOffset >= threshold);
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
