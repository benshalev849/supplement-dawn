(() => {
  if (window.BloomliReviewsScriptLoaded) return;
  window.BloomliReviewsScriptLoaded = true;

  const AUTOPLAY_SPEED = 18;

  function initReviews(root) {
    root.querySelectorAll('.bloomli-reviews').forEach((section) => {
      if (section.dataset.bloomliReviewsReady === 'true') return;

      const track = section.querySelector('[data-bloomli-reviews-track]');
      const prev = section.querySelector('[data-bloomli-reviews-prev]');
      const next = section.querySelector('[data-bloomli-reviews-next]');
      if (!track) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const originalCards = Array.from(track.querySelectorAll('.bloomli-reviews__card'));
      let animationFrame = null;
      let lastFrameTime = null;
      let loopWidth = 0;

      const scrollByCard = (direction) => {
        const firstCard = originalCards[0] || track.querySelector('.bloomli-reviews__card');
        const gap = parseFloat(getComputedStyle(track).columnGap || 0);
        const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth;

        if (direction < 0 && track.scrollLeft <= 2 && loopWidth > 0) {
          track.scrollLeft = loopWidth;
        }

        track.scrollBy({ left: distance * direction, behavior: 'smooth' });
      };

      const measureLoop = () => {
        const firstClone = track.querySelector('[data-bloomli-review-clone="true"]');
        loopWidth = firstClone ? firstClone.offsetLeft : 0;
      };

      const cloneCards = () => {
        if (originalCards.length < 2 || track.querySelector('[data-bloomli-review-clone="true"]')) return;

        originalCards.forEach((card) => {
          const clone = card.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.setAttribute('data-bloomli-review-clone', 'true');
          clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
          track.appendChild(clone);
        });

        measureLoop();
      };

      const tick = (timestamp) => {
        if (!track.isConnected) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
          return;
        }

        if (lastFrameTime !== null && loopWidth > 0) {
          const elapsed = timestamp - lastFrameTime;
          track.scrollLeft += (AUTOPLAY_SPEED * elapsed) / 1000;

          if (track.scrollLeft >= loopWidth) {
            track.scrollLeft -= loopWidth;
          }
        }

        lastFrameTime = timestamp;
        animationFrame = window.requestAnimationFrame(tick);
      };

      const stopAutoplay = () => {
        if (!animationFrame) return;
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
        lastFrameTime = null;
      };

      const startAutoplay = () => {
        if (prefersReducedMotion || animationFrame || loopWidth <= 0) return;
        animationFrame = window.requestAnimationFrame(tick);
      };

      const restartAutoplay = () => {
        stopAutoplay();
        startAutoplay();
      };

      if (prev) {
        prev.addEventListener('click', () => {
          scrollByCard(-1);
          restartAutoplay();
        });
      }

      if (next) {
        next.addEventListener('click', () => {
          scrollByCard(1);
          restartAutoplay();
        });
      }

      section.addEventListener('mouseenter', stopAutoplay);
      section.addEventListener('mouseleave', startAutoplay);
      section.addEventListener('focusin', stopAutoplay);
      section.addEventListener('focusout', startAutoplay);
      window.addEventListener('resize', measureLoop);

      cloneCards();
      startAutoplay();
      section.dataset.bloomliReviewsReady = 'true';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initReviews(document));
  } else {
    initReviews(document);
  }

  document.addEventListener('shopify:section:load', (event) => initReviews(event.target));
})();
