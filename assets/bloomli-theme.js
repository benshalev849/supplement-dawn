(function () {
  function measureElementHeight(element) {
    return element ? Math.round(element.getBoundingClientRect().height * 100) / 100 : 0;
  }

  function setHeaderStackHeight() {
    var bar = document.querySelector('.announcement-bar-section.shopify-section-group-header-group');
    var header = document.querySelector('.section-header.shopify-section-group-header-group');
    var barHeight = measureElementHeight(bar);
    var headerHeight = measureElementHeight(header);

    document.documentElement.style.setProperty('--bloomli-announcement-height', barHeight + 'px');
    document.documentElement.style.setProperty('--bloomli-header-stack-height', barHeight + headerHeight + 'px');
  }

  function refreshHeaderStackHeight() {
    setHeaderStackHeight();
    requestAnimationFrame(setHeaderStackHeight);
  }

  function getHeaderStackHeight() {
    var value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bloomli-header-stack-height'));
    return Number.isFinite(value) ? value : 0;
  }

  function getFloatingCtaTarget(button) {
    var productInfo = button.closest('product-info') || document;
    var fallbackSelector = button.getAttribute('data-product-info-target');
    var selectors = ['.bloomli-vt', '.product-form'];

    if (fallbackSelector) {
      selectors.push(fallbackSelector);
    }

    for (var index = 0; index < selectors.length; index += 1) {
      var target = productInfo.querySelector(selectors[index]) || document.querySelector(selectors[index]);
      if (target) return target;
    }

    return null;
  }

  function isTargetVisible(target) {
    if (!target) return false;

    var rect = target.getBoundingClientRect();
    var headerOffset = getHeaderStackHeight();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    return rect.bottom > headerOffset && rect.top < viewportHeight;
  }

  function getScrollProgress() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    return (scrollTop / scrollable) * 100;
  }

  function initFloatingCtas(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var buttons = [];

    if (root.matches && root.matches('[data-bloomli-floating-cta]')) {
      buttons.push(root);
    }

    root.querySelectorAll('[data-bloomli-floating-cta]').forEach(function (button) {
      buttons.push(button);
    });

    buttons.forEach(function (button) {
      if (button.dataset.bloomliFloatingCtaReady === 'true') return;

      var threshold = parseFloat(button.getAttribute('data-scroll-threshold'));
      if (!Number.isFinite(threshold)) threshold = 50;

      var target = getFloatingCtaTarget(button);
      var ticking = false;

      button.dataset.bloomliFloatingCtaReady = 'true';
      button.setAttribute('aria-hidden', 'true');
      button.setAttribute('tabindex', '-1');

      function setVisible(isVisible) {
        button.classList.toggle('is-visible', isVisible);
        button.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

        if (isVisible) {
          button.removeAttribute('tabindex');
        } else {
          button.setAttribute('tabindex', '-1');
        }
      }

      function update() {
        ticking = false;

        target = target || getFloatingCtaTarget(button);
        setVisible(getScrollProgress() >= threshold && !isTargetVisible(target));
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }

      button.addEventListener('click', function () {
        target = getFloatingCtaTarget(button);
        if (!target) return;

        var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderStackHeight() - 12;

        window.scrollTo({
          top: Math.max(top, 0),
          behavior: 'smooth',
        });
      });

      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
      document.addEventListener('shopify:section:load', requestUpdate);
      document.addEventListener('shopify:section:unload', requestUpdate);

      update();
    });
  }

  setHeaderStackHeight();
  requestAnimationFrame(setHeaderStackHeight);

  document.addEventListener('DOMContentLoaded', refreshHeaderStackHeight);

  if (document.readyState !== 'loading') {
    refreshHeaderStackHeight();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshHeaderStackHeight);
  }

  window.addEventListener('load', refreshHeaderStackHeight);
  window.addEventListener('resize', refreshHeaderStackHeight);
  document.addEventListener('shopify:section:load', refreshHeaderStackHeight);
  document.addEventListener('shopify:section:unload', refreshHeaderStackHeight);

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
      initFloatingCtas(document);
    });
  } else {
    initAccordions(document);
    initFloatingCtas(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initAccordions(event.target);
    initFloatingCtas(event.target);
  });
})();
