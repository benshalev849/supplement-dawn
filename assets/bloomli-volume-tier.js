(function () {
  if (window.BloomliVolumeTier) {
    window.BloomliVolumeTier.init(document);
    return;
  }

  const MOBILE_LAYOUT_FIX_CSS = `
    @media (max-width: 749px) {
      .bloomli-vt__modes {
        gap: 10px;
      }

      .bloomli-vt__mode-inner {
        padding: 18px 18px 18px;
      }

      .bloomli-vt__mode--subscribe .bloomli-vt__mode-inner {
        padding-bottom: 18px;
      }

      .bloomli-vt__mode-row {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) auto;
        column-gap: 12px;
        align-items: start;
      }

      .bloomli-vt__mode .bloomli-vt__radio-visual {
        grid-column: 1;
        grid-row: 1;
        width: 20px;
        height: 20px;
        margin-top: 4px !important;
      }

      .bloomli-vt__mode-title-stack {
        grid-column: 2;
        grid-row: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .bloomli-vt__mode-title {
        grid-column: 2;
        grid-row: 1;
        min-width: 0;
        white-space: nowrap;
        font-size: 18px;
        line-height: 1.15;
        font-weight: 800;
      }

      .bloomli-vt__mode--subscribe .bloomli-vt__mode-title {
        font-size: 20px;
      }

      .bloomli-vt__mode-prices {
        grid-column: 3;
        grid-row: 1;
        align-self: start;
        gap: 4px;
        padding-top: 0;
      }

      .bloomli-vt__mode-price {
        font-size: 18px;
        font-weight: 800;
        line-height: 1.15;
      }

      .bloomli-vt__mode-compare {
        font-size: 13px;
      }

      .bloomli-vt__mode-savings-text {
        font-size: 13px;
        margin-top: 6px;
        line-height: 1.15;
      }

      .bloomli-vt__mode-info-line {
        margin-left: 34px;
        margin-top: 7px;
        font-size: 14px;
        line-height: 1.25;
        color: rgba(42, 38, 34, 0.78);
      }

      .bloomli-vt__mode-title-stack .bloomli-vt__mode-info-line {
        margin-left: 0;
        margin-top: 0;
      }

      .bloomli-vt__mode-info-line strong {
        color: var(--charcoal, #2A2622);
        font-weight: 800;
      }

      .bloomli-vt__mode-perks {
        margin: 18px 0 0 34px;
        gap: 14px;
        overflow: hidden;
        max-height: 320px;
        opacity: 1;
        transition: max-height 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease, margin-top 180ms ease;
      }

      .bloomli-vt__mode--subscribe:not(.is-selected) .bloomli-vt__mode-perks {
        max-height: 0;
        opacity: 0;
        margin-top: 0;
      }

      .bloomli-vt__mode-perk,
      .bloomli-vt__onetime-caveat {
        font-size: 16px;
        line-height: 1.35;
        gap: 10px;
        color: rgba(42, 38, 34, 0.82);
      }

      .bloomli-vt__mode-perk::before,
      .bloomli-vt__onetime-caveat::before {
        width: 17px;
        height: 17px;
      }

      .bloomli-vt__onetime-caveats {
        margin-left: 34px;
        padding: 14px 0 2px;
        gap: 14px;
      }

      .bloomli-vt__mobile-atc-slot.has-button {
        display: block;
        margin-top: 20px;
        padding-top: 0;
      }

      .bloomli-vt__mobile-atc-slot.has-button .bloomli-vt__product-form {
        display: block;
        width: 100%;
      }

      .bloomli-vt__mobile-atc-slot.has-button .bloomli-vt__custom-submit {
        margin-top: 0;
        width: 100%;
      }

      .bloomli-vt__custom-submit {
        min-height: 4.8rem;
        margin: 0;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 500;
      }

      .bloomli-vt__size-badge {
        font-size: 12px;
        padding: 6px 13px;
        top: -14px;
        left: 14px;
        border-radius: 5px;
      }

      .bloomli-vt__size-tag {
        font-size: 10px;
        padding: 5px 10px;
        bottom: -11px;
        right: 10px;
        border-radius: 5px;
        font-weight: 800;
      }
    }
  `;

  function injectMobileLayoutFixStyles() {
    if (document.getElementById('bloomli-vt-mobile-layout-fixes')) return;

    const style = document.createElement('style');
    style.id = 'bloomli-vt-mobile-layout-fixes';
    style.textContent = MOBILE_LAYOUT_FIX_CSS;
    document.head.appendChild(style);
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
    const barEl = root.querySelector('[data-vt-mode-bar]');
    const modeSubInfoEl = root.querySelector('[data-vt-mode-sub-info]');
    const modeOnetimeInfoEl = root.querySelector('[data-vt-mode-onetime-info]');
    const modeSubCompareEl = root.querySelector('[data-vt-mode-subscribe-compare]');
    const modeSubSavingsEl = root.querySelector('[data-vt-mode-subscribe-savings]');
    const modeOnetimeCompareEl = root.querySelector('[data-vt-mode-onetime-compare]');
    const modeOnetimeSavingsEl = root.querySelector('[data-vt-mode-onetime-savings]');
    const atc = root.querySelector('[data-vt-atc]');
    const atcHome = root.querySelector('[data-vt-atc-home]');
    const mobileAtcSlots = root.querySelectorAll('[data-vt-mobile-atc-slot]');
    const mobileMedia = window.matchMedia ? window.matchMedia('(max-width: 749px)') : null;

    const moneyFormat = root.dataset.moneyFormat || '${{amount}}';
    const discountBadgeTemplate = root.dataset.discountBadgeTemplate || 'SAVE [percent]%';
    const subscriptionDiscount = parseFloat(root.dataset.subscriptionDiscountPct) || 0;
    const savingsPrefix = root.dataset.savingsPrefix || "You're saving ";
    const savingsSuffix = root.dataset.savingsSuffix || '$';
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

    function placeAddToCart() {
      if (!atc || !atcHome) return;

      const isMobile = mobileMedia ? mobileMedia.matches : window.innerWidth < 750;
      mobileAtcSlots.forEach(function (slot) {
        slot.classList.remove('has-button');
      });

      if (!isMobile) {
        if (atc.previousElementSibling !== atcHome) {
          atcHome.after(atc);
        }
        return;
      }

      const selectedMode = getSelectedMode();
      const slot = root.querySelector('[data-vt-mobile-atc-slot="' + selectedMode + '"]');

      if (slot && atc.parentNode !== slot) {
        slot.appendChild(atc);
      }

      if (slot) {
        slot.classList.add('has-button');
      }
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

      const sizeDaily = size.querySelector('[data-vt-daily]');
      const sizeLabel = size.dataset.sizeLabel || '';
      const sizeCount = size.dataset.sizeCount || '';

      const subDailyStr = sizeDaily ? (sizeDaily.dataset.subscribeDaily || '') : '';
      const onetimeDailyStr = sizeDaily ? (sizeDaily.dataset.onetimeDaily || '') : '';

      const subInfoHTML = sizeLabel
        ? '<strong>' + sizeLabel + '</strong>'
          + (sizeCount ? ' · ' + sizeCount : '')
          + (subDailyStr ? ' · ' + subDailyStr : '')
        : sizeCount + (subDailyStr ? ' · ' + subDailyStr : '');
      if (modeSubInfoEl) modeSubInfoEl.innerHTML = subInfoHTML;

      const onetimeInfoHTML = sizeLabel
        ? '<strong>' + sizeLabel + '</strong>'
          + (sizeCount ? ' · ' + sizeCount : '')
          + (onetimeDailyStr ? ' · ' + onetimeDailyStr : '')
        : sizeCount + (onetimeDailyStr ? ' · ' + onetimeDailyStr : '');
      if (modeOnetimeInfoEl) modeOnetimeInfoEl.innerHTML = onetimeInfoHTML;

      function savingsText(savingsCents) {
        if (savingsCents <= 50) return '';
        const dollars = Math.round(savingsCents / 100);
        return savingsPrefix + dollars + savingsSuffix;
      }

      if (lineCompareCents > subscribeCents) {
        if (modeSubCompareEl) modeSubCompareEl.textContent = formatMoney(lineCompareCents, moneyFormat);
        if (modeSubSavingsEl) modeSubSavingsEl.textContent = savingsText(lineCompareCents - subscribeCents);
      } else {
        if (modeSubCompareEl) modeSubCompareEl.textContent = '';
        if (modeSubSavingsEl) modeSubSavingsEl.textContent = '';
      }

      if (lineCompareCents > oneTimeCents) {
        if (modeOnetimeCompareEl) modeOnetimeCompareEl.textContent = formatMoney(lineCompareCents, moneyFormat);
      } else if (modeOnetimeCompareEl) {
        modeOnetimeCompareEl.textContent = '';
      }
      if (modeOnetimeSavingsEl) modeOnetimeSavingsEl.textContent = '';

      if (barEl) {
        const barTemplate = barEl.dataset.barTemplate || '';
        if (lineCompareCents > subscribeCents && lineCompareCents > 0) {
          const subPct = Math.round((lineCompareCents - subscribeCents) / lineCompareCents * 100);
          if (subPct > 0) {
            barEl.textContent = formatTemplate(barTemplate, { percent: String(subPct) });
          }
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

        let displayDiscount = volumeDiscount;
        if (effectiveMode === 'subscribe' && sizeOption.dataset.planId) {
          const sizeSubscribeCents = parseInt(sizeOption.dataset.subscribeCents, 10) || 0;
          const sizeLineCompareCents = parseInt(sizeOption.dataset.lineCompareCents, 10) || 0;
          if (sizeLineCompareCents > sizeSubscribeCents && sizeLineCompareCents > 0) {
            displayDiscount = (sizeLineCompareCents - sizeSubscribeCents) / sizeLineCompareCents * 100;
          }
        }

        if (displayDiscount > 0) {
          badge.textContent = formatTemplate(discountBadgeTemplate, {
            qty: String(qtyForLabel),
            percent: formatDiscount(displayDiscount),
          });
        } else {
          badge.textContent = manualBadge;
        }
      });

      sizes.forEach(function (sizeOption) {
        const daily = sizeOption.querySelector('[data-vt-daily]');
        if (!daily) return;

        const nextDaily =
          effectiveMode === 'subscribe' && sizeOption.dataset.planId
            ? daily.dataset.subscribeDaily
            : daily.dataset.onetimeDaily;

        if (nextDaily) daily.textContent = nextDaily;
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

      placeAddToCart();
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
      mode.addEventListener('click', function (event) {
        if (event.target.closest('[data-vt-atc]')) return;
        if (mode.getAttribute('aria-disabled') === 'true') return;

        setMode(mode.dataset.mode);
        updateState();
      });
    });

    if (mobileMedia) {
      if (mobileMedia.addEventListener) {
        mobileMedia.addEventListener('change', placeAddToCart);
      } else if (mobileMedia.addListener) {
        mobileMedia.addListener(placeAddToCart);
      }
    } else {
      window.addEventListener('resize', placeAddToCart);
    }

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
    injectMobileLayoutFixStyles();
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
