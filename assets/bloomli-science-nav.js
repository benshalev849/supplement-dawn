(function () {
  var navs = document.querySelectorAll('[data-bloomli-science-nav]');

  if (!navs.length) return;

  navs.forEach(function (nav) {
    nav.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      var target = document.querySelector(hash);
      if (!target && hash.length > 1) {
        target = document.querySelector('[id$="__' + hash.slice(1) + '"]');
      }
      if (!target) return;

      event.preventDefault();
      var headerOffset = 90;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.pushState(null, '', hash);
    });
  });
})();
