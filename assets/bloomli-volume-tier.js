(function () {
  if (window.BloomliVolumeTier) {
    window.BloomliVolumeTier.init(document);
    return;
  }

  function formatMoney(cents, moneyFormat) {
    if (window.Shopify && window.Shopify.formatMoney) {
      try {
        return window.Shopify.formatMoney(cents, moneyFormat);
      } catch (error) {
        return (cents / 100).toFixed(2);
      }
    }

    return (cents / 100).toFixed(2);
  }

  // Volume and subscription discounts compound because each discount reduces
  // the remaining price, rather than adding percentages together directly.
  function getCompoundedDiscount(volumeDiscount, subscriptionDiscount) {
    const volumeMultiplier = 1 - volumeDiscount / 100;
    const subscriptionMultiplier = 1 - subscriptionDiscount / 100;
    return (1 - volumeMultiplier * subscriptionMultiplier) * 100;
  }

  function formatDiscount(percent) {
    return String(Math.round(percent || 0));
  }

  function formatTemplate(template, replacements) {
    return Object.keys(replacements).reduce(function (label, key) {
      return label.split('[' + key + ']').join(replacements[key]);
    }, template || '');
  }

  function initRoot(root) {
    if (!root || root.dataset.bloomliVtInitialized === 'true') return;
    root.dataset.bloomliVtInitialized = 'true';

    const sizes = root.querySelectorAll('[data-vt-size]');
    const modes = root.querySelectorAll('[data-vt-mode]');
    const qtyInput = root.querySelector('[data-vt-qty-input]');
    const spInput = root.querySelector('[data-vt-sp-input]');
    const totalEl = root.querySelector('[data-vt-total]');
    const compareEl = root.querySelector('[data-vt-compare]');
    const oneTimePriceEl = root.querySelector('[data-vt-onetime-price]');
    const subscribePriceEl = root.querySelector('[data-vt-subscribe-price]');
    const subSavingsEl = root.querySelector('[data-vt-sub-savings]');

    const moneyFormat = root.dataset.moneyFormat || '${{amount}}';
    const discountBadgeTemplate = root.dataset.discountBadgeTemplate || 'SAVE [percent]%';
    const subscriptionExtraTemplate = root.dataset.subscriptionExtraTemplate || 'an extra [percent]%';
    const subscriptionDiscount = parseFloat(root.dataset.subscriptionDiscountPct) || 0;
    const productFormId = root.dataset.formId;
    const quantitySelector = productFormId
      ? Array.from(document.querySelectorAll('input[name="quantity"]')).find(function (input) {
          return input !== qtyInput && input.getAttribute('form') === productFormId;
        })
      : null;

    function getSelectedSize() {
      return root.querySelector('[data-vt-size].is-selected') || sizes[0];
    }

    function getSelectedMode() {
      const mode = root.querySelector('[data-vt-mode].is-selected');
      return mode ? mode.dataset.mode : 'onetime';
    }

    function setMode(modeToSelect) {
      modes.forEach(function (mode) {
        const selected = mode.dataset.mode === modeToSelect;
        mode.classList.toggle('is-selected', selected);

        const radio = mode.querySelector('.bloomli-vt__radio-native');
        if (radio) radio.checked = selected;
      });
    }

    function updateState() {
      const size = getSelectedSize();
      if (!size) return;

      const qty = parseInt(size.dataset.quantity, 10) || 1;
      const planId = size.dataset.planId || '';
      const mode = getSelectedMode();
      const oneTimeCents = parseInt(size.dataset.oneTimeCents, 10) || 0;
      const subscribeCents = parseInt(size.dataset.subscribeCents, 10) || oneTimeCents;
      const lineCompareCents = parseInt(size.dataset.lineCompareCents, 10) || oneTimeCents;
      const subPct = parseFloat(size.dataset.subDiscountPct) || subscriptionDiscount;

      if (oneTimePriceEl) oneTimePriceEl.textContent = formatMoney(oneTimeCents, moneyFormat);
      if (subscribePriceEl) subscribePriceEl.textContent = formatMoney(subscribeCents, moneyFormat);

      if (subSavingsEl) {
        if (subPct > 0) {
          subSavingsEl.textContent = formatTemplate(subscriptionExtraTemplate, {
            percent: formatDiscount(subPct),
          });
        } else {
          subSavingsEl.textContent = '';
        }
      }

      if (mode === 'subscribe' && !planId) {
        setMode('onetime');
      }

      const effectiveMode = getSelectedMode();
      const displayCents = effectiveMode === 'subscribe' && planId ? subscribeCents : oneTimeCents;

      if (quantitySelector) {
        quantitySelector.value = String(qty);
        if (qtyInput) qtyInput.disabled = true;
      } else if (qtyInput) {
        qtyInput.value = String(qty);
        qtyInput.disabled = false;
      }

      if (effectiveMode === 'subscribe' && planId) {
        if (spInput) {
          spInput.value = String(planId);
          spInput.disabled = false;
        }
      } else if (spInput) {
        spInput.value = '';
        spInput.disabled = true;
      }

      if (totalEl) totalEl.textContent = formatMoney(displayCents, moneyFormat);

      if (compareEl) {
        if (effectiveMode === 'subscribe' && planId && subscribeCents < oneTimeCents) {
          compareEl.textContent = formatMoney(oneTimeCents, moneyFormat);
        } else if (lineCompareCents > displayCents) {
          compareEl.textContent = formatMoney(lineCompareCents, moneyFormat);
        } else {
          compareEl.textContent = '';
        }
      }

      sizes.forEach(function (sizeOption) {
        const badge = sizeOption.querySelector('[data-vt-discount-badge]');
        if (!badge) return;

        const qtyForLabel = parseInt(sizeOption.dataset.quantity, 10) || 1;
        const volumeDiscount = parseFloat(sizeOption.dataset.discountPct) || 0;
        const manualBadge = badge.dataset.manualBadge || '';
        const displayDiscount =
          effectiveMode === 'subscribe' && sizeOption.dataset.planId
            ? getCompoundedDiscount(volumeDiscount, subPct)
            : volumeDiscount;

        if (displayDiscount > 0) {
          badge.textContent = formatTemplate(discountBadgeTemplate, {
            qty: String(qtyForLabel),
            percent: formatDiscount(displayDiscount),
          });
        } else {
          badge.textContent = manualBadge;
        }
      });

      modes.forEach(function (modeOption) {
        if (modeOption.dataset.mode !== 'subscribe') return;

        if (!planId) {
          modeOption.setAttribute('aria-disabled', 'true');
          modeOption.classList.add('is-disabled');
        } else {
          modeOption.removeAttribute('aria-disabled');
          modeOption.classList.remove('is-disabled');
        }
      });
    }

    sizes.forEach(function (size) {
      size.addEventListener('click', function () {
        sizes.forEach(function (sizeOption) {
          sizeOption.classList.remove('is-selected');

          const radio = sizeOption.querySelector('.bloomli-vt__radio-native');
          if (radio) radio.checked = false;
        });

        size.classList.add('is-selected');

        const radio = size.querySelector('.bloomli-vt__radio-native');
        if (radio) radio.checked = true;

        updateState();
      });
    });

    modes.forEach(function (mode) {
      mode.addEventListener('click', function () {
        if (mode.getAttribute('aria-disabled') === 'true') return;

        setMode(mode.dataset.mode);
        updateState();
      });
    });

    if (!root.querySelector('[data-vt-size].is-selected') && sizes[0]) {
      sizes[0].classList.add('is-selected');

      const radio = sizes[0].querySelector('.bloomli-vt__radio-native');
      if (radio) radio.checked = true;
    }

    if (!root.querySelector('[data-vt-mode].is-selected') && modes[0]) {
      setMode(modes[0].dataset.mode);
    }

    updateState();
  }

  function init(scope) {
    const root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('[data-bloomli-vt]').forEach(initRoot);
  }

  window.BloomliVolumeTier = {
    init: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
