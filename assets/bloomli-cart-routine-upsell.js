(function () {
  if (window.BloomliCartRoutineUpsellInitialized) return;
  window.BloomliCartRoutineUpsellInitialized = true;

  function getRequestedSections() {
    var sections = ['cart-icon-bubble'];
    if (document.getElementById('CartDrawer')) sections.push('cart-drawer');
    return sections;
  }

  function getSectionInnerHTML(html, selector) {
    var parsed = new DOMParser().parseFromString(html, 'text/html');
    var el = selector ? parsed.querySelector(selector) : parsed.querySelector('.shopify-section');
    return el ? el.innerHTML : '';
  }

  function replaceCartSections(parsedState) {
    if (!parsedState.sections) return;

    var cartDrawerHtml = parsedState.sections['cart-drawer'];
    if (cartDrawerHtml) {
      var html = new DOMParser().parseFromString(cartDrawerHtml, 'text/html');
      [
        ['.drawer__header',             '.drawer__header'],
        ['[data-bloomli-cart-shipping]','[data-bloomli-cart-shipping]'],
        ['cart-drawer-items',           'cart-drawer-items'],
        ['.drawer__footer',             '.drawer__footer'],
      ].forEach(function (pair) {
        var target = document.querySelector(pair[0]);
        var source = html.querySelector(pair[1]);
        if (target && source) {
          target.replaceWith(source);
        } else if (target && !source && pair[0] === '[data-bloomli-cart-shipping]') {
          target.remove();
        }
      });

      var cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) cartDrawer.classList.toggle('is-empty', parsedState.item_count === 0);
    }

    var cartIconHtml = parsedState.sections['cart-icon-bubble'];
    if (cartIconHtml) {
      var cartIcon = document.getElementById('cart-icon-bubble');
      if (cartIcon) cartIcon.innerHTML = getSectionInnerHTML(cartIconHtml);
    }
  }

  function showError() {
    var errors = document.getElementById('CartDrawer-CartErrors') || document.getElementById('cart-errors');
    if (errors && window.cartStrings) errors.textContent = window.cartStrings.error;
  }

  function setLoading(btn, loading) {
    var spinner = btn.querySelector('.bloomli-routine-upsell__spinner');
    btn.disabled = loading;
    btn.classList.toggle('is-loading', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
  }

  function addToCart(btn) {
    var variantId = parseInt(btn.dataset.variantId, 10);
    if (!variantId) return;

    setLoading(btn, true);

    var body = JSON.stringify({
      items: [{ id: variantId, quantity: 1 }],
      sections: getRequestedSections(),
      sections_url: window.location.pathname,
    });

    fetch(routes.cart_add_url, Object.assign({}, fetchConfig(), { body: body }))
      .then(function (response) { return response.text(); })
      .then(function (state) {
        var parsedState = JSON.parse(state);
        if (parsedState.status === 422 || parsedState.errors) {
          showError();
          return;
        }
        replaceCartSections(parsedState);
      })
      .catch(showError)
      .finally(function () {
        if (document.body.contains(btn)) setLoading(btn, false);
      });
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-bloomli-routine-upsell-btn]');
    if (!btn) return;
    event.preventDefault();
    addToCart(btn);
  });
})();
