(function () {
  var NUMBER_PATTERN = /([\d][\d,]*(?:\.\d+)?)/;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function countUp(el) {
    var original = el.textContent;
    var match = original.match(NUMBER_PATTERN);
    if (!match) return;

    var target = parseFloat(match[1].replace(/,/g, ''));
    if (!isFinite(target)) return;

    var decimals = (match[1].split('.')[1] || '').length;
    var prefix = original.slice(0, match.index);
    var suffix = original.slice(match.index + match[1].length);
    var duration = 1000;
    var start;

    function frame(now) {
      if (start === undefined) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var value = target * easeOutCubic(progress);
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        el.textContent = original;
      }
    }

    window.requestAnimationFrame(frame);
  }

  function initWhatToExpect(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = root.querySelectorAll('.bloomli-wte[data-wte-animate="true"]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sections.forEach(function (section) {
      if (section.dataset.wteReady === 'true') return;
      section.dataset.wteReady = 'true';

      if (reducedMotion || !('IntersectionObserver' in window)) return;

      var rows = section.querySelectorAll('.bloomli-wte__row');
      rows.forEach(function (row, index) {
        row.style.setProperty('--wte-delay', index * 90 + 'ms');
      });
      section.classList.add('wte-armed');

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var row = entry.target;
            observer.unobserve(row);
            row.classList.add('is-inview');
            var stat = row.querySelector('[data-wte-count]');
            if (stat) countUp(stat);
          });
        },
        { threshold: 0.4 }
      );

      rows.forEach(function (row) {
        observer.observe(row);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initWhatToExpect(document);
    });
  } else {
    initWhatToExpect(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initWhatToExpect(event.target);
  });
})();
