(function () {
  function setHeaderStackHeight() {
    var bar = document.querySelector('.announcement-bar-section.shopify-section-group-header-group');
    var header = document.querySelector('.section-header.shopify-section-group-header-group');
    var barHeight = bar ? bar.offsetHeight : 0;
    var headerHeight = header ? header.offsetHeight : 0;

    document.documentElement.style.setProperty('--bloomli-announcement-height', barHeight + 'px');
    document.documentElement.style.setProperty('--bloomli-header-stack-height', barHeight + headerHeight + 'px');
  }

  setHeaderStackHeight();
  window.addEventListener('load', setHeaderStackHeight);
  window.addEventListener('resize', setHeaderStackHeight);
  document.addEventListener('shopify:section:load', setHeaderStackHeight);
  document.addEventListener('shopify:section:unload', setHeaderStackHeight);

  function initAccordions(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var accordions = root.querySelectorAll('.product__accordion.accordion details, .collapsible-content .accordion details');
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    accordions.forEach(function (details) {
      if (details.dataset.bloomliAccordionReady === 'true') return;

      var accordion = details.closest('.accordion');
      var summary = details.querySelector('summary');
      var content = details.querySelector('.accordion__content');
      if (!accordion || !summary || !content) return;

      accordion.classList.add('is-bloomli-animated');
      details.dataset.bloomliAccordionReady = 'true';

      if (details.open) {
        content.style.height = 'auto';
        content.style.opacity = '1';
      } else {
        content.style.height = '0px';
      }

      if (prefersReducedMotion) return;

      summary.addEventListener('click', function (event) {
        event.preventDefault();

        if (details.dataset.bloomliAnimating === 'true') return;

        if (details.open) {
          closeAccordion(details, content);
        } else {
          openAccordion(details, content);
        }
      });
    });
  }

  function openAccordion(details, content) {
    details.dataset.bloomliAnimating = 'true';
    details.open = true;
    content.style.height = '0px';
    content.style.opacity = '0';

    requestAnimationFrame(function () {
      content.style.height = content.scrollHeight + 'px';
      content.style.opacity = '1';
    });

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      content.removeEventListener('transitionend', onTransitionEnd);
      content.style.height = 'auto';
      delete details.dataset.bloomliAnimating;
    }

    function onTransitionEnd(event) {
      if (event.propertyName !== 'height') return;
      finish();
    }

    content.addEventListener('transitionend', onTransitionEnd);
    window.setTimeout(finish, 500);
  }

  function closeAccordion(details, content) {
    details.dataset.bloomliAnimating = 'true';
    content.style.height = content.scrollHeight + 'px';
    content.style.opacity = '1';

    requestAnimationFrame(function () {
      content.style.height = '0px';
      content.style.opacity = '0';
    });

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      content.removeEventListener('transitionend', onTransitionEnd);
      details.open = false;
      delete details.dataset.bloomliAnimating;
    }

    function onTransitionEnd(event) {
      if (event.propertyName !== 'height') return;
      finish();
    }

    content.addEventListener('transitionend', onTransitionEnd);
    window.setTimeout(finish, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAccordions(document);
    });
  } else {
    initAccordions(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initAccordions(event.target);
  });
})();
