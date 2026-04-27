(function () {
  function getSections() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  function getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  function replaceCartSections(parsedState) {
    getSections().forEach(function (section) {
      const target = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      if (!target || !parsedState.sections[section.id]) return;

      target.innerHTML = getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    const cartDrawer = document.querySelector('cart-drawer');
    const overlay = document.getElementById('CartDrawer-Overlay');
    if (cartDrawer && overlay) {
      overlay.addEventListener('click', cartDrawer.close.bind(cartDrawer));
    }
  }

  function updateFrequency(select) {
    const wrapper = select.closest('[data-bloomli-cart-frequency]');
    const sellingPlan = select.value;
    const line = parseInt(select.dataset.line, 10);
    const quantity = parseInt(select.dataset.quantity, 10);
    const previousValue = select.dataset.previousValue || select.defaultValue;

    if (!sellingPlan || !line || !quantity) return;

    if (wrapper) wrapper.classList.add('is-loading');
    select.disabled = true;

    const body = JSON.stringify({
      line: line,
      quantity: quantity,
      selling_plan: sellingPlan,
      sections: getSections().map(function (section) {
        return section.id;
      }),
      sections_url: window.location.pathname,
    });

    fetch(routes.cart_change_url, { ...fetchConfig(), ...{ body } })
      .then(function (response) {
        return response.text();
      })
      .then(function (state) {
        const parsedState = JSON.parse(state);

        if (parsedState.errors) {
          select.value = previousValue;
          return;
        }

        replaceCartSections(parsedState);
      })
      .catch(function () {
        select.value = previousValue;
        const errors = document.getElementById('CartDrawer-CartErrors');
        if (errors && window.cartStrings) errors.textContent = window.cartStrings.error;
      })
      .finally(function () {
        if (document.body.contains(select)) {
          select.disabled = false;
          if (wrapper) wrapper.classList.remove('is-loading');
        }
      });
  }

  document.addEventListener(
    'change',
    function (event) {
      const select = event.target.closest('[data-bloomli-frequency-select]');
      if (!select) return;

      event.preventDefault();
      event.stopPropagation();
      updateFrequency(select);
    },
    true
  );

  document.addEventListener(
    'focusin',
    function (event) {
      const select = event.target.closest('[data-bloomli-frequency-select]');
      if (!select) return;

      select.dataset.previousValue = select.value;
    },
    true
  );
})();
