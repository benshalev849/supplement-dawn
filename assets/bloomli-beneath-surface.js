(function () {
  function initBeneathSurface(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('[data-bloomli-beneath-surface]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sections.forEach(function (section) {
      if (section.dataset.bloomliBeneathSurfaceReady === 'true') return;

      section.dataset.bloomliBeneathSurfaceReady = 'true';
      var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-bbs-tab]'));
      var panels = Array.prototype.slice.call(section.querySelectorAll('[data-bbs-panel]'));
      var accordionButtons = Array.prototype.slice.call(section.querySelectorAll('[data-bbs-accordion-button]'));

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          setActive(section, Number(tab.dataset.bbsIndex), reducedMotion);
        });

        tab.addEventListener('keydown', function (event) {
          var currentIndex = tabs.indexOf(tab);
          var nextIndex = currentIndex;

          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = currentIndex + 1;
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = currentIndex - 1;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = tabs.length - 1;
          if (nextIndex === currentIndex) return;

          event.preventDefault();
          if (nextIndex < 0) nextIndex = tabs.length - 1;
          if (nextIndex >= tabs.length) nextIndex = 0;
          tabs[nextIndex].focus();
          setActive(section, nextIndex, reducedMotion);
        });
      });

      accordionButtons.forEach(function (button) {
        var panel = document.getElementById(button.getAttribute('aria-controls'));
        if (!panel) return;

        setAccordionState(button, panel, button.getAttribute('aria-expanded') === 'true', true);

        button.addEventListener('click', function () {
          var shouldOpen = button.getAttribute('aria-expanded') !== 'true';

          if (shouldOpen) {
            setActive(section, Number(button.dataset.bbsIndex), reducedMotion);
          } else {
            setAccordionState(button, panel, false, reducedMotion);
          }
        });
      });

      if (tabs.length && panels.length) setActive(section, getInitialIndex(tabs), true);
    });
  }

  function getInitialIndex(tabs) {
    var selected = tabs.find(function (tab) {
      return tab.getAttribute('aria-selected') === 'true';
    });

    return selected ? Number(selected.dataset.bbsIndex) : 0;
  }

  function setActive(section, activeIndex, skipAnimation) {
    section.querySelectorAll('[data-bbs-tab]').forEach(function (tab) {
      var isActive = Number(tab.dataset.bbsIndex) === activeIndex;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    section.querySelectorAll('[data-bbs-panel]').forEach(function (panel) {
      var isActive = Number(panel.dataset.bbsIndex) === activeIndex;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });

    section.querySelectorAll('[data-bbs-accordion-button]').forEach(function (button) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;

      setAccordionState(button, panel, Number(button.dataset.bbsIndex) === activeIndex, skipAnimation);
    });
  }

  function setAccordionState(button, panel, open, skipAnimation) {
    var item = button.closest('[data-bbs-accordion-item]');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (item) item.classList.toggle('is-open', open);

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
    window.setTimeout(finish, 340);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initBeneathSurface(document);
    });
  } else {
    initBeneathSurface(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initBeneathSurface(event.target);
  });
})();
