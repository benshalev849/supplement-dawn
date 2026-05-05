(function () {
  if (window.BloomliCartSubscriptionUpsellInitialized) return;
  window.BloomliCartSubscriptionUpsellInitialized = true;

  function getSectionInnerHTML(html, selector) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const element = selector ? parsed.querySelector(selector) : parsed.querySelector('.shopify-section');
    return element ? element.innerHTML : '';
  }

  function getRequestedSections() {
    const sections = ['cart-icon-bubble'];
    const mainCartItems = document.getElementById('main-cart-items');
    const mainCartFooter = document.getElementById('main-cart-footer');

    if (document.getElementById('CartDrawer')) sections.push('cart-drawer');
    if (mainCartItems && mainCartItems.dataset.id) sections.push(mainCartItems.dataset.id);
    if (mainCartFooter && mainCartFooter.dataset.id) sections.push(mainCartFooter.dataset.id);
    if (document.getElementById('cart-live-region-text')) sections.push('cart-live-region-text');

    return sections.filter(function (section, index) {
      return section && sections.indexOf(section) === index;
    });
  }

  function replaceCartDrawerSections(parsedState) {
    if (!parsedState.sections || !parsedState.sections['cart-drawer']) return;

    const html = new DOMParser().parseFromString(parsedState.sections['cart-drawer'], 'text/html');
    [
      ['.drawer__header', '.drawer__header'],
      ['[data-bloomli-cart-shipping]', '[data-bloomli-cart-shipping]'],
      ['cart-drawer-items', 'cart-drawer-items'],
      ['.drawer__footer', '.drawer__footer'],
    ].forEach(function (pair) {
      const target = document.querySelector(pair[0]);
      const source = html.querySelector(pair[1]);

      if (target && source) {
        target.replaceWith(source);
      } else if (target && !source && pair[0] === '[data-bloomli-cart-shipping]') {
        target.remove();
      }
    });

    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer) cartDrawer.classList.toggle('is-empty', parsedState.item_count === 0);
  }

  function replaceMainCartSections(parsedState) {
    if (!parsedState.sections) return;

    const mainCartItems = document.getElementById('main-cart-items');
    const mainCartFooter = document.getElementById('main-cart-footer');

    if (mainCartItems && mainCartItems.dataset.id && parsedState.sections[mainCartItems.dataset.id]) {
      const target = mainCartItems.querySelector('.js-contents') || mainCartItems;
      target.innerHTML = getSectionInnerHTML(parsedState.sections[mainCartItems.dataset.id], '.js-contents');
      mainCartItems.closest('cart-items')?.classList.toggle('is-empty', parsedState.item_count === 0);
    }

    if (mainCartFooter && mainCartFooter.dataset.id && parsedState.sections[mainCartFooter.dataset.id]) {
      const target = mainCartFooter.querySelector('.js-contents') || mainCartFooter;
      target.innerHTML = getSectionInnerHTML(parsedState.sections[mainCartFooter.dataset.id], '.js-contents');
      mainCartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
    }

    if (parsedState.sections['cart-live-region-text']) {
      const liveRegion = document.getElementById('cart-live-region-text');
      if (liveRegion) liveRegion.innerHTML = getSectionInnerHTML(parsedState.sections['cart-live-region-text']);
    }
  }

  function replaceCartIcon(parsedState) {
    if (!parsedState.sections || !parsedState.sections['cart-icon-bubble']) return;

    const cartIcon = document.getElementById('cart-icon-bubble');
    if (cartIcon) cartIcon.innerHTML = getSectionInnerHTML(parsedState.sections['cart-icon-bubble']);
  }

  function showCartError() {
    const errors = document.getElementById('CartDrawer-CartErrors') || document.getElementById('cart-errors');
    if (errors && window.cartStrings) errors.textContent = window.cartStrings.error;
  }

  function setLoading(button, loading) {
    const card = button.closest('[data-bloomli-cart-subscription-upsell]');
    const lineItem = card
      ? card.closest('.bloomli-cart-line-upsell-row')?.previousElementSibling
      : button.closest('.cart-item');
    const spinner = button.querySelector('.loading__spinner');

    button.disabled = loading;
    button.classList.toggle('is-loading', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
    if (lineItem) lineItem.classList.toggle('is-updating', loading);
  }

  function upgradeLine(button) {
    const line = parseInt(button.dataset.line, 10);
    const quantity = parseInt(button.dataset.quantity, 10);
    const sellingPlan = button.dataset.sellingPlan || '';

    if (!line || !quantity || !sellingPlan) return;

    setLoading(button, true);

    const body = JSON.stringify({
      line: line,
      quantity: quantity,
      selling_plan: sellingPlan,
      sections: getRequestedSections(),
      sections_url: window.location.pathname,
    });

    fetch(routes.cart_change_url, { ...fetchConfig(), ...{ body } })
      .then(function (response) {
        return response.text();
      })
      .then(function (state) {
        const parsedState = JSON.parse(state);

        if (parsedState.errors) {
          showCartError();
          return;
        }

        replaceCartDrawerSections(parsedState);
        replaceMainCartSections(parsedState);
        replaceCartIcon(parsedState);
      })
      .catch(showCartError)
      .finally(function () {
        if (document.body.contains(button)) setLoading(button, false);
      });
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-bloomli-cart-subscription-upsell-cta]');
    if (!button) return;

    event.preventDefault();
    upgradeLine(button);
  });
})();
