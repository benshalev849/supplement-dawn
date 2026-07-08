(function () {
  function initReviewBar(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('.bloomli-review-bar--carousel');

    sections.forEach(function (section) {
      if (section.dataset.rbReady === 'true') return;
      section.dataset.rbReady = 'true';

      var viewport = section.querySelector('[data-rb-viewport]');
      if (!viewport || viewport.children.length < 2) return;

      var cards = viewport.children;
      var dots = section.querySelectorAll('[data-rb-dot]');
      var prev = section.querySelector('[data-rb-prev]');
      var next = section.querySelector('[data-rb-next]');
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var autoplay = section.dataset.rbAutoplay === 'true' && !reducedMotion;
      var intervalMs = (parseInt(section.dataset.rbInterval, 10) || 5) * 1000;
      var timer = null;
      var inView = true;

      function cardStep() {
        return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : viewport.clientWidth;
      }

      function currentIndex() {
        var step = cardStep();
        return step > 0 ? Math.round(viewport.scrollLeft / step) : 0;
      }

      function updateDots() {
        var ci = currentIndex();
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === ci);
        });
        Array.prototype.forEach.call(cards, function (card, i) {
          card.classList.toggle('is-current', i === ci);
        });
      }

      function goTo(index) {
        viewport.scrollTo({ left: index * cardStep(), behavior: 'smooth' });
      }

      function stopAuto() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      function startAuto() {
        if (!autoplay || timer) return;
        timer = setInterval(function () {
          if (!inView) return;
          var maxScroll = viewport.scrollWidth - viewport.clientWidth;
          if (viewport.scrollLeft >= maxScroll - 10) {
            goTo(0);
          } else {
            viewport.scrollBy({ left: cardStep(), behavior: 'smooth' });
          }
        }, intervalMs);
      }

      var scrollScheduled = false;
      viewport.addEventListener('scroll', function () {
        if (scrollScheduled) return;
        scrollScheduled = true;
        window.requestAnimationFrame(function () {
          scrollScheduled = false;
          updateDots();
        });
      });

      // Any deliberate interaction cancels autoplay for good
      ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) {
        viewport.addEventListener(ev, stopAuto, { passive: true });
      });

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          stopAuto();
          goTo(i);
        });
      });

      if (prev) {
        prev.addEventListener('click', function () {
          stopAuto();
          viewport.scrollBy({ left: -cardStep(), behavior: 'smooth' });
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          stopAuto();
          viewport.scrollBy({ left: cardStep(), behavior: 'smooth' });
        });
      }

      // Only advance while the section is actually on screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              inView = entry.isIntersecting;
            });
          },
          { threshold: 0.3 }
        ).observe(section);
      }

      updateDots();
      startAuto();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initReviewBar(document);
    });
  } else {
    initReviewBar(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initReviewBar(event.target);
  });
})();
