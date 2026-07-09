(function () {
  function initReviewBar(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('.bloomli-review-bar--carousel');

    sections.forEach(function (section) {
      if (section.dataset.rbReady === 'true') return;
      section.dataset.rbReady = 'true';

      var viewport = section.querySelector('[data-rb-viewport]');
      if (!viewport || viewport.children.length < 2) return;

      var realCount = viewport.children.length;
      var dots = section.querySelectorAll('[data-rb-dot]');
      var prev = section.querySelector('[data-rb-prev]');
      var next = section.querySelector('[data-rb-next]');
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var autoplay = section.dataset.rbAutoplay === 'true' && !reducedMotion;
      var intervalMs = (parseInt(section.dataset.rbInterval, 10) || 5) * 1000;
      var timer = null;
      var inView = true;

      // Clone the edges so the strip wraps: [last*, 1..n, first*].
      // Resting on a clone teleports (instantly) to its real card.
      var firstClone = viewport.children[0].cloneNode(true);
      var lastClone = viewport.children[realCount - 1].cloneNode(true);
      [firstClone, lastClone].forEach(function (clone) {
        clone.classList.remove('is-current');
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('data-shopify-editor-block');
      });
      viewport.insertBefore(lastClone, viewport.children[0]);
      viewport.appendChild(firstClone);

      var cards = viewport.children;

      function cardStep() {
        return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : viewport.clientWidth;
      }

      function domIndex() {
        var step = cardStep();
        return step > 0 ? Math.round(viewport.scrollLeft / step) : 0;
      }

      function logicalIndex(di) {
        return (((di - 1) % realCount) + realCount) % realCount;
      }

      function updateDots() {
        var di = domIndex();
        var li = logicalIndex(di);
        // A clone and the real card it mirrors must highlight together, so the
        // edge teleport lands on a card that already looks "current" (no shake)
        var twin = -1;
        if (di === 0) twin = realCount;
        else if (di === cards.length - 1) twin = 1;
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === li);
        });
        Array.prototype.forEach.call(cards, function (card, i) {
          card.classList.toggle('is-current', i === di || i === twin);
        });
      }

      function jumpTo(di) {
        viewport.scrollTo({ left: di * cardStep(), behavior: 'auto' });
      }

      function goTo(di) {
        viewport.scrollTo({ left: di * cardStep(), behavior: 'smooth' });
      }

      // Once scrolling settles on a clone, swap to the real card it mirrors
      function settle() {
        var di = domIndex();
        if (di === 0) {
          jumpTo(realCount);
        } else if (di === cards.length - 1) {
          jumpTo(1);
        }
      }

      if ('onscrollend' in viewport) {
        viewport.addEventListener('scrollend', settle);
      } else {
        var settleTimer = null;
        viewport.addEventListener(
          'scroll',
          function () {
            if (settleTimer) clearTimeout(settleTimer);
            settleTimer = setTimeout(settle, 140);
          },
          { passive: true }
        );
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
          viewport.scrollBy({ left: cardStep(), behavior: 'smooth' });
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
          goTo(i + 1);
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

      // Start on the real first card, with the last card's clone peeking left
      jumpTo(1);
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
