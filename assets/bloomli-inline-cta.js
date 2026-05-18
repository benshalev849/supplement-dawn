(function () {
  if (window.bloomliInlineCtaScriptLoaded) return;
  window.bloomliInlineCtaScriptLoaded = true;

  function getHeaderStackHeight() {
    var value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bloomli-header-stack-height'));
    return Number.isFinite(value) ? value : 0;
  }

  function getSelectorTarget(button) {
    var selector = button.getAttribute('data-bloomli-inline-cta-selector');
    if (!selector) return null;

    try {
      var localRoot = button.closest('product-info') || document;
      return localRoot.querySelector(selector) || document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function initInlineCtas(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var buttons = [];

    if (root.matches && root.matches('[data-bloomli-inline-cta-selector]')) {
      buttons.push(root);
    }

    root.querySelectorAll('[data-bloomli-inline-cta-selector]').forEach(function (button) {
      buttons.push(button);
    });

    buttons.forEach(function (button) {
      if (button.dataset.bloomliInlineCtaReady === 'true') return;

      button.dataset.bloomliInlineCtaReady = 'true';
      button.addEventListener('click', function (event) {
        event.preventDefault();

        var target = getSelectorTarget(button);
        if (!target) return;

        var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderStackHeight() - 12;

        window.scrollTo({
          top: Math.max(top, 0),
          behavior: 'smooth',
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initInlineCtas(document);
    });
  } else {
    initInlineCtas(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initInlineCtas(event.target);
  });
})();
