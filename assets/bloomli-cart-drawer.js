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
    const cartDrawerSection = parsedState.sections['cart-drawer'];
    if (cartDrawerSection) {
      const html = new DOMParser().parseFromString(cartDrawerSection, 'text/html');
      const replacements = [
        ['.drawer__header', '.drawer__header'],
        ['[data-bloomli-cart-shipping]', '[data-bloomli-cart-shipping]'],
        ['cart-drawer-items', 'cart-drawer-items'],
        ['.drawer__footer', '.drawer__footer'],
      ];

      replacements.forEach(function (pair) {
        const target = document.querySelector(pair[0]);
        const source = html.querySelector(pair[1]);

        if (target && source) {
          target.replaceWith(source);
        } else if (target && !source && pair[0] === '[data-bloomli-cart-shipping]') {
          target.remove();
        }
      });
    }

    const cartIconSection = parsedState.sections['cart-icon-bubble'];
    const cartIcon = document.getElementById('cart-icon-bubble');
    if (cartIconSection && cartIcon) {
      cartIcon.innerHTML = getSectionInnerHTML(cartIconSection);
    }
  }

  function setFrequencyDisplay(select, option) {
    const wrapper = select.closest('[data-bloomli-cart-frequency]');
    if (!wrapper || !option) return;

    const label = wrapper.querySelector('.bloomli-cart-frequency__label');
    const saving = wrapper.querySelector('.bloomli-cart-frequency__saving');
    const optionLabel = option.dataset.label || option.textContent.trim();
    const optionSaving = option.dataset.saving || '';

    if (label) label.textContent = optionLabel;

    if (optionSaving) {
      if (saving) {
        saving.textContent = optionSaving;
      } else {
        const savingEl = document.createElement('span');
        savingEl.className = 'bloomli-cart-frequency__saving';
        savingEl.textContent = optionSaving;
        const chevron = wrapper.querySelector('.bloomli-cart-frequency__chevron');
        if (chevron) chevron.before(savingEl);
      }
    } else if (saving) {
      saving.remove();
    }
  }

  function setMenuOpen(wrapper, open) {
    if (!wrapper) return;

    const toggle = wrapper.querySelector('[data-bloomli-frequency-toggle]');
    const menu = wrapper.querySelector('[data-bloomli-frequency-menu]');

    wrapper.classList.toggle('is-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (menu) menu.hidden = !open;
  }

  function closeFrequencyMenus(exceptWrapper) {
    document.querySelectorAll('[data-bloomli-cart-frequency].is-open').forEach(function (wrapper) {
      if (wrapper !== exceptWrapper) setMenuOpen(wrapper, false);
    });
  }

  function updateFrequency(select, selectedOptionOverride) {
    const wrapper = select.closest('[data-bloomli-cart-frequency]');
    const item = select.closest('.cart-item');
    const sellingPlan = select.value;
    const line = parseInt(select.dataset.line, 10);
    const quantity = parseInt(select.dataset.quantity, 10);
    const previousValue = select.dataset.previousValue || select.defaultValue;
    const previousOption = Array.from(select.options).find(function (option) {
      return option.value === previousValue;
    });
    const selectedOption = selectedOptionOverride || select.options[select.selectedIndex];

    if (!sellingPlan || !line || !quantity) return;

    if (wrapper) wrapper.classList.add('is-updating');
    if (item) item.classList.add('is-updating');
    setFrequencyDisplay(select, selectedOption);
    select.disabled = true;
    closeFrequencyMenus();

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
          setFrequencyDisplay(select, previousOption);
          return;
        }

        replaceCartSections(parsedState);
      })
      .catch(function () {
        select.value = previousValue;
        setFrequencyDisplay(select, previousOption);
        const errors = document.getElementById('CartDrawer-CartErrors');
        if (errors && window.cartStrings) errors.textContent = window.cartStrings.error;
      })
      .finally(function () {
        if (document.body.contains(select)) {
          select.disabled = false;
          if (wrapper) wrapper.classList.remove('is-updating');
          if (item) item.classList.remove('is-updating');
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

  document.addEventListener('click', function (event) {
    const toggle = event.target.closest('[data-bloomli-frequency-toggle]');
    const option = event.target.closest('[data-bloomli-frequency-option]');

    if (toggle) {
      const wrapper = toggle.closest('[data-bloomli-cart-frequency]');
      const shouldOpen = !wrapper.classList.contains('is-open');

      event.preventDefault();
      closeFrequencyMenus(wrapper);
      setMenuOpen(wrapper, shouldOpen);
      return;
    }

    if (option) {
      const wrapper = option.closest('[data-bloomli-cart-frequency]');
      const select = wrapper ? wrapper.querySelector('[data-bloomli-frequency-select]') : null;
      if (!select) return;

      event.preventDefault();

      select.dataset.previousValue = select.value;
      select.value = option.dataset.sellingPlan;

      wrapper.querySelectorAll('[data-bloomli-frequency-option]').forEach(function (button) {
        button.classList.toggle('is-selected', button === option);
      });

      updateFrequency(select, option);
      return;
    }

    if (!event.target.closest('[data-bloomli-cart-frequency]')) {
      closeFrequencyMenus();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeFrequencyMenus();
  });

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
