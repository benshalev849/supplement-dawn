(function () {
  function initBeneathSurface(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('[data-bloomli-beneath-surface]');

    sections.forEach(function (section) {
      if (section.dataset.bloomliBeneathSurfaceReady === 'true') return;

      section.dataset.bloomliBeneathSurfaceReady = 'true';
      var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-bbs-tab]'));
      var panels = Array.prototype.slice.call(section.querySelectorAll('[data-bbs-panel]'));

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          setActive(section, Number(tab.dataset.bbsIndex));
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
          setActive(section, nextIndex);
        });
      });

      if (tabs.length && panels.length) setActive(section, getInitialIndex(tabs));
    });
  }

  function getInitialIndex(tabs) {
    var selected = tabs.find(function (tab) {
      return tab.getAttribute('aria-selected') === 'true';
    });

    return selected ? Number(selected.dataset.bbsIndex) : 0;
  }

  function setActive(section, activeIndex) {
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
