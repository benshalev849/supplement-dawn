(() => {
  const selector = '[data-bloomli-trust-gallery]';
  const snapTolerance = 2;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getCards = (viewport) => Array.from(viewport.querySelectorAll('.bloomli-trust__card'));

  const getTrack = (viewport) => viewport.querySelector('[data-bloomli-trust-track]');

  const getMaxScroll = (viewport) => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  const getCardScrollLeft = (viewport, index) => {
    const track = getTrack(viewport);
    const cards = getCards(viewport);
    const card = cards[index];
    if (!track || !card) return 0;

    return clamp(card.offsetLeft - track.offsetLeft, 0, getMaxScroll(viewport));
  };

  const getSnapPoints = (viewport) => {
    const cards = getCards(viewport);
    const maxScroll = getMaxScroll(viewport);
    if (!cards.length || maxScroll <= 1) return [0];

    const points = cards.map((card, index) => getCardScrollLeft(viewport, index));
    points.push(maxScroll);

    return points
      .sort((a, b) => a - b)
      .reduce((uniquePoints, point) => {
        const lastPoint = uniquePoints[uniquePoints.length - 1];

        if (lastPoint === undefined || Math.abs(point - lastPoint) > snapTolerance) {
          uniquePoints.push(point);
        }

        return uniquePoints;
      }, []);
  };

  const getActiveSnapIndex = (viewport, snapPoints = getSnapPoints(viewport)) => {
    if (!snapPoints.length) return 0;

    return snapPoints.reduce(
      (closest, point, index) => {
        const distance = Math.abs(viewport.scrollLeft - point);

        if (distance <= closest.distance + 0.5) {
          return { index, distance };
        }

        return closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY }
    ).index;
  };

  const getAdjacentSnapIndex = (viewport, direction, snapPoints) => {
    const currentLeft = viewport.scrollLeft;

    if (direction > 0) {
      const nextIndex = snapPoints.findIndex((point) => point > currentLeft + snapTolerance);
      return nextIndex === -1 ? snapPoints.length - 1 : nextIndex;
    }

    for (let index = snapPoints.length - 1; index >= 0; index -= 1) {
      if (snapPoints[index] < currentLeft - snapTolerance) return index;
    }

    return 0;
  };

  const scrollToSnap = (viewport, snapPoints, index) => {
    const targetIndex = clamp(index, 0, snapPoints.length - 1);

    viewport.scrollTo({
      left: snapPoints[targetIndex],
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const syncDots = (dots, snapPoints, activeIndex) => {
    dots.forEach((dot, index) => {
      const isVisible = index < snapPoints.length;
      const isActive = isVisible && index === activeIndex;

      dot.hidden = !isVisible;
      dot.classList.toggle('slider-counter__link--active', isActive);
      dot.dataset.bloomliTrustSnapIndex = String(index);

      if (isVisible) {
        dot.setAttribute('aria-label', `Go to proof slide ${index + 1} of ${snapPoints.length}`);
      }

      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  };

  const updateControls = (section) => {
    const viewport = section.querySelector('[data-bloomli-trust-viewport]');
    const prev = section.querySelector('[data-bloomli-trust-prev]');
    const next = section.querySelector('[data-bloomli-trust-next]');
    const dots = Array.from(section.querySelectorAll('[data-bloomli-trust-dot]'));
    if (!viewport) return;

    const snapPoints = getSnapPoints(viewport);
    const activeIndex = getActiveSnapIndex(viewport, snapPoints);

    if (prev) prev.disabled = activeIndex <= 0;
    if (next) next.disabled = activeIndex >= snapPoints.length - 1;
    syncDots(dots, snapPoints, activeIndex);
  };

  const initSection = (section) => {
    if (section.dataset.bloomliTrustReady === 'true') return;

    const viewport = section.querySelector('[data-bloomli-trust-viewport]');
    const prev = section.querySelector('[data-bloomli-trust-prev]');
    const next = section.querySelector('[data-bloomli-trust-next]');
    const dots = Array.from(section.querySelectorAll('[data-bloomli-trust-dot]'));
    if (!viewport) return;

    if (prev) {
      prev.addEventListener('click', () => {
        const snapPoints = getSnapPoints(viewport);
        scrollToSnap(viewport, snapPoints, getAdjacentSnapIndex(viewport, -1, snapPoints));
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        const snapPoints = getSnapPoints(viewport);
        scrollToSnap(viewport, snapPoints, getAdjacentSnapIndex(viewport, 1, snapPoints));
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const snapPoints = getSnapPoints(viewport);
        const index = Number(dot.dataset.bloomliTrustSnapIndex);
        if (Number.isNaN(index)) return;

        scrollToSnap(viewport, snapPoints, index);
        syncDots(dots, snapPoints, index);
      });
    });

    viewport.addEventListener('scroll', () => updateControls(section), { passive: true });
    window.addEventListener('resize', () => updateControls(section), { passive: true });

    updateControls(section);
    requestAnimationFrame(() => updateControls(section));
    section.dataset.bloomliTrustReady = 'true';
  };

  const initAll = (root = document) => {
    root.querySelectorAll(selector).forEach(initSection);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(), { once: true });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
