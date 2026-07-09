(function () {
  function initReviewBar(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('.bloomli-review-bar--carousel');

    sections.forEach(function (section) {
      if (section.dataset.rbReady === 'true') return;
      section.dataset.rbReady = 'true';

      var viewport = section.querySelector('[data-rb-viewport]');
      var strip = section.querySelector('[data-rb-strip]');
      if (!viewport || !strip || strip.children.length < 2) return;

      var realCount = strip.children.length;
      var dots = section.querySelectorAll('[data-rb-dot]');
      var prev = section.querySelector('[data-rb-prev]');
      var next = section.querySelector('[data-rb-next]');
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var autoplay = section.dataset.rbAutoplay === 'true' && !reducedMotion;
      var intervalMs = (parseInt(section.dataset.rbInterval, 10) || 5) * 1000;
      var EASE = 'transform 0.45s cubic-bezier(0.25, 0.8, 0.35, 1)';
      var timer = null;
      var inView = true;

      section.classList.add('is-enhanced');

      // Clone the edges so the strip wraps: [last*, 1..n, first*].
      // Landing on a clone swaps (same frame, invisible) to its real card.
      var firstClone = strip.children[0].cloneNode(true);
      var lastClone = strip.children[realCount - 1].cloneNode(true);
      [firstClone, lastClone].forEach(function (clone) {
        clone.classList.remove('is-current');
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('data-shopify-editor-block');
      });
      strip.insertBefore(lastClone, strip.children[0]);
      strip.appendChild(firstClone);

      var cards = strip.children;
      var pos = 1;
      var x = 0;

      function setX(nx) {
        x = nx;
        strip.style.transform = 'translate3d(' + nx + 'px, 0, 0)';
      }

      // Where the strip must sit so card p is centered in the viewport.
      // offsetLeft is transform-independent, so this is safe mid-animation.
      function targetX(p) {
        var card = cards[p];
        return (viewport.clientWidth - card.offsetWidth) / 2 - strip.offsetLeft - card.offsetLeft;
      }

      function renderedX() {
        var t = window.getComputedStyle(strip).transform;
        if (!t || t === 'none') return 0;
        if (typeof DOMMatrixReadOnly === 'function') return new DOMMatrixReadOnly(t).m41;
        var parts = t.match(/-?[\d.]+/g);
        return parts && parts.length >= 6 ? parseFloat(parts[4]) : 0;
      }

      function updateUI() {
        var li = (((pos - 1) % realCount) + realCount) % realCount;
        // A clone and the real card it mirrors highlight together, so the
        // edge swap lands on a card that already looks "current"
        var twin = -1;
        if (pos === 0) twin = realCount;
        else if (pos === cards.length - 1) twin = 1;
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === li);
        });
        Array.prototype.forEach.call(cards, function (card, i) {
          card.classList.toggle('is-current', i === pos || i === twin);
        });
      }

      function position(p, animate) {
        pos = p;
        strip.style.transition = animate && !reducedMotion ? EASE : 'none';
        setX(targetX(p));
        updateUI();
      }

      // If we're resting on a clone, swap to the real card it mirrors
      function settle() {
        if (pos === 0) position(realCount, false);
        else if (pos === cards.length - 1) position(1, false);
      }

      strip.addEventListener('transitionend', function (e) {
        if (e.target === strip && e.propertyName === 'transform') settle();
      });

      function stepBy(delta) {
        settle();
        position(pos + delta, true);
        if (reducedMotion) settle();
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
          stepBy(1);
        }, intervalMs);
      }

      // Swipe / drag — freeze the strip where it visually is, follow the
      // pointer, then advance if the drag passed the threshold
      var dragging = false;
      var dragStartX = 0;
      var dragBaseX = 0;
      var dragDx = 0;

      viewport.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stopAuto();
        dragging = true;
        dragStartX = e.clientX;
        dragDx = 0;
        dragBaseX = renderedX();
        strip.style.transition = 'none';
        setX(dragBaseX);
        viewport.classList.add('is-dragging');
        if (viewport.setPointerCapture) {
          try {
            viewport.setPointerCapture(e.pointerId);
          } catch (err) {
            /* no-op */
          }
        }
      });

      viewport.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        dragDx = e.clientX - dragStartX;
        setX(dragBaseX + dragDx);
      });

      function endDrag() {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove('is-dragging');
        var threshold = Math.min(60, cards[pos].offsetWidth * 0.18);
        if (dragDx <= -threshold) {
          stepBy(1);
        } else if (dragDx >= threshold) {
          stepBy(-1);
        } else {
          position(pos, true);
        }
      }

      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);

      // Horizontal trackpad swipes on desktop
      var wheelLock = 0;
      viewport.addEventListener(
        'wheel',
        function (e) {
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 8) return;
          e.preventDefault();
          stopAuto();
          var now = Date.now();
          if (now - wheelLock < 500) return;
          wheelLock = now;
          stepBy(e.deltaX > 0 ? 1 : -1);
        },
        { passive: false }
      );

      viewport.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          stopAuto();
          stepBy(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stopAuto();
          stepBy(-1);
        }
      });

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          stopAuto();
          settle();
          position(i + 1, true);
        });
      });

      if (prev) {
        prev.addEventListener('click', function () {
          stopAuto();
          stepBy(-1);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          stopAuto();
          stepBy(1);
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

      var resizeTimer = null;
      window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          settle();
          position(pos, false);
        }, 120);
      });

      position(1, false);
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
