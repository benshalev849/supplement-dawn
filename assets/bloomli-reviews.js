(() => {
  if (window.BloomliReviewsScriptLoaded) return;
  window.BloomliReviewsScriptLoaded = true;

  function initReviews(root) {
    root.querySelectorAll('.bloomli-reviews').forEach((section) => {
      if (section.dataset.bloomliReviewsReady === 'true') return;

      const track = section.querySelector('[data-bloomli-reviews-track]');
      const prev = section.querySelector('[data-bloomli-reviews-prev]');
      const next = section.querySelector('[data-bloomli-reviews-next]');
      if (!track || !prev || !next) return;

      const scrollByCard = (direction) => {
        const firstCard = track.querySelector('.bloomli-reviews__card');
        const gap = parseFloat(getComputedStyle(track).columnGap || 0);
        const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth;
        track.scrollBy({ left: distance * direction, behavior: 'smooth' });
      };

      prev.addEventListener('click', () => scrollByCard(-1));
      next.addEventListener('click', () => scrollByCard(1));
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
