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
})();
