(function () {
  function initFaq(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('[data-bloomli-faq]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sections.forEach(function (section) {
      if (section.dataset.bloomliFaqReady === 'true') return;

      section.dataset.bloomliFaqReady = 'true';
      section.querySelectorAll('[data-bloomli-faq-button]').forEach(function (button) {
        var panel = document.getElementById(button.getAttribute('aria-controls'));
        if (!panel) return;

        var isOpen = button.getAttribute('aria-expanded') === 'true';
        setPanelState(button, panel, isOpen, true);

        button.addEventListener('click', function () {
          var shouldOpen = button.getAttribute('aria-expanded') !== 'true';
          setPanelState(button, panel, shouldOpen, reducedMotion);
        });
      });
    });
  }

  function setPanelState(button, panel, open, skipAnimation) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (skipAnimation) {
      panel.hidden = !open;
      panel.style.height = open ? 'auto' : '0px';
      panel.style.opacity = open ? '1' : '0';
      return;
    }

    if (open) {
      panel.hidden = false;
      panel.style.height = '0px';
      panel.style.opacity = '0';

      requestAnimationFrame(function () {
        panel.style.height = panel.scrollHeight + 'px';
        panel.style.opacity = '1';
      });

      finishAfterTransition(panel, function () {
        panel.style.height = 'auto';
      });
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      panel.style.opacity = '1';

      requestAnimationFrame(function () {
        panel.style.height = '0px';
        panel.style.opacity = '0';
      });

      finishAfterTransition(panel, function () {
        panel.hidden = true;
      });
    }
  }

  function finishAfterTransition(panel, callback) {
    var complete = false;

    function finish() {
      if (complete) return;
      complete = true;
      panel.removeEventListener('transitionend', onTransitionEnd);
      callback();
    }

    function onTransitionEnd(event) {
      if (event.propertyName !== 'height') return;
      finish();
    }

    panel.addEventListener('transitionend', onTransitionEnd);
    window.setTimeout(finish, 360);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initFaq(document);
    });
  } else {
    initFaq(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initFaq(event.target);
  });
})();
