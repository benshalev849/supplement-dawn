/* Review carousel wiring — the sliding/looping itself is Embla Carousel
   (same library Grüns uses), loaded as embla-carousel.umd.js. */
(function () {
  function initReviewBar(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('.bloomli-review-bar--carousel');

    sections.forEach(function (section) {
      if (section.dataset.rbReady === 'true') return;
      if (typeof window.EmblaCarousel !== 'function') return;

      var viewport = section.querySelector('[data-rb-viewport]');
      var strip = section.querySelector('[data-rb-strip]');
      if (!viewport || !strip || strip.children.length < 2) return;

      section.dataset.rbReady = 'true';
      section.classList.add('is-enhanced');

      var dots = section.querySelectorAll('[data-rb-dot]');
      var prev = section.querySelector('[data-rb-prev]');
      var next = section.querySelector('[data-rb-next]');
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var autoplayOn = section.dataset.rbAutoplay === 'true' && !reducedMotion;
      var delayMs = (parseInt(section.dataset.rbInterval, 10) || 5) * 1000;

      var plugins = [];
      if (autoplayOn && typeof window.EmblaCarouselAutoplay === 'function') {
        plugins.push(
          window.EmblaCarouselAutoplay({
            delay: delayMs,
            stopOnInteraction: true
          })
        );
      }

      var embla = window.EmblaCarousel(
        viewport,
        {
          loop: true,
          align: 'center',
          containScroll: false,
          skipSnaps: false
        },
        plugins
      );

      var slides = embla.slideNodes();

      function stopAuto() {
        var auto = embla.plugins().autoplay;
        if (auto) auto.stop();
      }

      function update() {
        var idx = embla.selectedScrollSnap();
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === idx);
        });
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-current', i === idx);
        });
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          stopAuto();
          embla.scrollTo(i, reducedMotion);
        });
      });

      if (prev) {
        prev.addEventListener('click', function () {
          stopAuto();
          embla.scrollPrev(reducedMotion);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          stopAuto();
          embla.scrollNext(reducedMotion);
        });
      }

      viewport.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          stopAuto();
          embla.scrollNext(reducedMotion);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stopAuto();
          embla.scrollPrev(reducedMotion);
        }
      });

      embla.on('select', update);
      embla.on('pointerDown', function () {
        viewport.classList.add('is-dragging');
      });
      embla.on('pointerUp', function () {
        viewport.classList.remove('is-dragging');
      });

      update();
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
