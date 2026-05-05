(function () {
  if (window.BloomliJourneyTimeline) {
    window.BloomliJourneyTimeline.refresh();
    return;
  }

  var selector = '[data-bloomli-journey]';
  var ticking = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileMedia = window.matchMedia('(max-width: 749px)');
  var lastScrollY = window.scrollY || window.pageYOffset || 0;

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function update() {
    ticking = false;
    var currentScrollY = window.scrollY || window.pageYOffset || 0;
    var isScrollingDown = currentScrollY >= lastScrollY;

    document.querySelectorAll(selector).forEach(function (section) {
      if (reducedMotion.matches) {
        section.style.setProperty('--journey-progress', '100%');
        setReachedSteps(section, 1);
        return;
      }

      var rect = section.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      var isMobile = mobileMedia.matches;

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

      var progress = isMobile ? getMobileProgress(section, viewportHeight) : getDesktopProgress(section, viewportHeight, isScrollingDown);

      section.style.setProperty('--journey-progress', progress * 100 + '%');
      if (isMobile) {
        setReachedStepsFromLine(section, progress);
      } else {
        setReachedSteps(section, progress);
      }
    });

    lastScrollY = currentScrollY;
  }

  function getMobileProgress(section, viewportHeight) {
    var progressTarget = section.querySelector('.bloomli-timeline__grid') || section;
    var progressRect = progressTarget.getBoundingClientRect();
    var start = viewportHeight * 0.9;
    var end = viewportHeight * 0.42 - progressRect.height;

    return clamp((start - progressRect.top) / (start - end));
  }

  function getDesktopProgress(section, viewportHeight, isScrollingDown) {
    var progressTarget = section.querySelector('.bloomli-timeline__grid') || section;
    var progressRect = progressTarget.getBoundingClientRect();
    var start = viewportHeight * 0.78;
    var endRatio = isScrollingDown ? 0.78 : 0.58;
    var end = viewportHeight * endRatio - progressRect.height;

    return clamp((start - progressRect.top) / (start - end));
  }

  function setReachedStepsFromLine(section, progress) {
    var track = section.querySelector('.bloomli-journey__track');
    var steps = section.querySelectorAll('.bloomli-journey__step');

    if (!track || !steps.length) {
      setReachedSteps(section, progress);
      return;
    }

    var trackRect = track.getBoundingClientRect();
    var filledTo = trackRect.top + (trackRect.height || 1) * progress;

    steps.forEach(function (step) {
      var label = step.querySelector('.bloomli-timeline__range');
      var target = label || step;
      var targetRect = target.getBoundingClientRect();
      var targetMiddle = targetRect.top + targetRect.height / 2;
      step.classList.toggle('is-reached', filledTo + 8 >= targetMiddle);
    });
  }

  function setReachedSteps(section, progress) {
    var steps = section.querySelectorAll('.bloomli-journey__step');
    var lastIndex = Math.max(steps.length - 1, 1);
    if (progress <= 0.001) {
      steps.forEach(function (step) {
        step.classList.remove('is-reached');
      });
      return;
    }

    steps.forEach(function (step, index) {
      var threshold = index / lastIndex;

      if (index === 0) {
        threshold = 0.015;
      } else if (index === lastIndex) {
        threshold = 0.84;
      }

      step.classList.toggle('is-reached', progress >= threshold);
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

  if (mobileMedia.addEventListener) {
    mobileMedia.addEventListener('change', requestUpdate);
  } else if (mobileMedia.addListener) {
    mobileMedia.addListener(requestUpdate);
  }

  requestUpdate();
})();
