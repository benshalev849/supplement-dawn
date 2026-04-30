(() => {
  if (window.BloomliReviewsScriptLoaded) return;
  window.BloomliReviewsScriptLoaded = true;

  const AUTOPLAY_DELAY = 6500;

  function initReviews(root) {
    root.querySelectorAll('.bloomli-reviews').forEach((section) => {
      if (section.dataset.bloomliReviewsReady === 'true') return;

      const track = section.querySelector('[data-bloomli-reviews-track]');
      const prev = section.querySelector('[data-bloomli-reviews-prev]');
      const next = section.querySelector('[data-bloomli-reviews-next]');
      if (!track || !prev || !next) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let autoplayTimer = null;

      const scrollByCard = (direction) => {
        const firstCard = track.querySelector('.bloomli-reviews__card');
        const gap = parseFloat(getComputedStyle(track).columnGap || 0);
        const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth;
        track.scrollBy({ left: distance * direction, behavior: 'smooth' });
      };

      const scrollNext = () => {
        if (!track.isConnected) {
          window.clearInterval(autoplayTimer);
          autoplayTimer = null;
          return;
        }

        const remainingScroll = track.scrollWidth - track.clientWidth - track.scrollLeft;
        if (remainingScroll <= 4) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
          return;
        }

        scrollByCard(1);
      };

      const stopAutoplay = () => {
        if (!autoplayTimer) return;
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      };

      const startAutoplay = () => {
        if (prefersReducedMotion || autoplayTimer || track.scrollWidth <= track.clientWidth) return;
        autoplayTimer = window.setInterval(scrollNext, AUTOPLAY_DELAY);
      };

      const restartAutoplay = () => {
        stopAutoplay();
        startAutoplay();
      };

      prev.addEventListener('click', () => {
        scrollByCard(-1);
        restartAutoplay();
      });
      next.addEventListener('click', () => {
        scrollByCard(1);
        restartAutoplay();
      });

      section.addEventListener('mouseenter', stopAutoplay);
      section.addEventListener('mouseleave', startAutoplay);
      section.addEventListener('focusin', stopAutoplay);
      section.addEventListener('focusout', startAutoplay);

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
