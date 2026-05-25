(() => {
  const STORAGE_PREFIX = 'bloomliSignupPopup';
  const SELECTED_CONCERN_KEY = `${STORAGE_PREFIX}:selectedConcern`;
  const CLOSED_UNTIL_KEY = `${STORAGE_PREFIX}:closedUntil`;
  const LEGACY_SUBMITTED_UNTIL_KEY = `${STORAGE_PREFIX}:submittedUntil`;
  const LAUNCHER_HIDDEN_UNTIL_KEY = `${STORAGE_PREFIX}:launcherHiddenUntil`;
  const PENDING_SUBMISSION_KEY = `${STORAGE_PREFIX}:pendingSubmission`;
  const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

  class BloomliSignupPopup {
    constructor(root) {
      this.root = root;
      this.modal = root.querySelector('[data-bloomli-popup-modal]');
      this.dialog = root.querySelector('.bloomli-signup-popup__dialog');
      this.steps = root.querySelector('[data-bloomli-popup-steps]');
      this.titleLines = Array.from(root.querySelectorAll('[data-bloomli-popup-title-line]'));
      this.options = Array.from(root.querySelectorAll('[data-bloomli-popup-option]'));
      this.email = root.querySelector('[data-bloomli-popup-email]');
      this.tags = root.querySelector('[data-bloomli-popup-tags]');
      this.form = root.querySelector('.bloomli-signup-popup__form');
      this.formState = root.querySelector('[data-bloomli-popup-form-state]')?.dataset.bloomliPopupFormState || 'idle';
      this.launcher = root.querySelector('[data-bloomli-popup-launcher]');
      this.success = root.querySelector('[data-bloomli-popup-success]');
      this.closeButtons = Array.from(root.querySelectorAll('[data-bloomli-popup-close], [data-bloomli-popup-decline]'));
      this.reopenButton = root.querySelector('[data-bloomli-popup-reopen]');
      this.launcherCloseButton = root.querySelector('[data-bloomli-popup-launcher-close]');
      this.isOpen = false;
      this.openTimer = null;
      this.hideTimer = null;
      this.previouslyFocused = null;
      this.selectedConcern = null;
      this.isDesignMode = Boolean(window.Shopify && window.Shopify.designMode);
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.closeDays = this.numberSetting('closeCooldownDays', 7);
      this.showLauncherAfterClose = root.dataset.showLauncher === 'true';
      this.customerAcceptsMarketing = root.dataset.customerMarketing === 'true';
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    init() {
      if (!this.modal || !this.steps || !this.tags) return;

      this.applySettings();
      this.bindEvents();
      this.restoreSelectedConcern();
      this.removeStorage(LEGACY_SUBMITTED_UNTIL_KEY);

      if (this.isDesignMode) {
        this.open();
        return;
      }

      const pendingSubmission = this.readSessionStorage(PENDING_SUBMISSION_KEY) === 'true';
      if (this.formState === 'success' && pendingSubmission) {
        this.removeSessionStorage(PENDING_SUBMISSION_KEY);
        this.recordSubmission();
        this.showSuccess();
        return;
      }

      if (this.customerAcceptsMarketing) return;

      if (this.formState === 'error' && pendingSubmission) {
        this.removeSessionStorage(PENDING_SUBMISSION_KEY);
        this.goToStepTwo(false);
        this.open();
        return;
      }

      this.removeSessionStorage(PENDING_SUBMISSION_KEY);

      if (this.hasActiveCooldown(CLOSED_UNTIL_KEY)) {
        this.showLauncher();
        return;
      }

      this.open();
    }

    numberSetting(setting, fallback) {
      const value = Number(this.root.dataset[setting]);
      return Number.isFinite(value) ? value : fallback;
    }

    applySettings() {
      const values = {
        '--bsp-padding-mobile': `${this.numberSetting('paddingMobile', 28) / 10}rem`,
        '--bsp-padding-desktop': `${this.numberSetting('paddingDesktop', 64) / 10}rem`,
      };

      if (this.root.dataset.customColors === 'true') {
        values['--bsp-background'] = this.root.dataset.popupBackground;
        values['--bsp-text'] = this.root.dataset.popupText;
        values['--bsp-button-background'] = this.root.dataset.optionBackground;
        values['--bsp-button-text'] = this.root.dataset.optionText;
      }

      Object.entries(values).forEach(([property, value]) => {
        if (value) this.root.style.setProperty(property, value);
      });
    }

    bindEvents() {
      this.options.forEach((option) => {
        option.addEventListener('click', () => {
          this.selectConcern(option.dataset.concernHandle);
          this.goToStepTwo(true);
        });
      });

      this.closeButtons.forEach((button) => {
        button.addEventListener('click', () => this.dismiss());
      });

      this.reopenButton?.addEventListener('click', () => {
        this.hideLauncher();
        this.open();
      });

      this.launcherCloseButton?.addEventListener('click', () => {
        const closedUntil = this.readStorage(CLOSED_UNTIL_KEY);
        this.writeStorage(
          LAUNCHER_HIDDEN_UNTIL_KEY,
          closedUntil || String(Date.now() + this.closeDays * DAY_IN_MILLISECONDS)
        );
        this.hideLauncher();
      });

      this.form?.addEventListener('submit', () => {
        this.writeSessionStorage(PENDING_SUBMISSION_KEY, 'true');
      });

      if (this.isDesignMode) {
        document.addEventListener('shopify:section:select', (event) => {
          if (event.detail.sectionId === this.root.closest('.shopify-section')?.id.replace('shopify-section-', '')) {
            this.open();
          }
        });
      }
    }

    open() {
      window.clearTimeout(this.openTimer);
      window.clearTimeout(this.hideTimer);
      if (this.isOpen) return;

      this.previouslyFocused = document.activeElement;
      this.modal.hidden = false;
      this.hideLauncher();
      this.isOpen = true;
      document.body.classList.add('overflow-hidden');
      window.requestAnimationFrame(() => this.modal.classList.add('is-open'));
      document.addEventListener('keydown', this.handleKeydown);

      const firstFocus = this.steps.classList.contains('is-step-two') ? this.email : this.options[0];
      if (typeof trapFocus === 'function') {
        trapFocus(this.dialog, firstFocus || this.dialog);
      } else {
        (firstFocus || this.dialog).focus();
      }
    }

    close() {
      if (!this.isOpen) return;

      this.isOpen = false;
      this.modal.classList.remove('is-open');
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', this.handleKeydown);

      if (typeof removeTrapFocus === 'function') {
        removeTrapFocus(this.previouslyFocused);
      } else {
        this.previouslyFocused?.focus();
      }

      const hideDelay = this.reducedMotion ? 0 : 280;
      this.hideTimer = window.setTimeout(() => {
        if (!this.isOpen) this.modal.hidden = true;
      }, hideDelay);
    }

    dismiss() {
      if (!this.isDesignMode) {
        this.setCooldown(CLOSED_UNTIL_KEY, this.closeDays);
      }
      this.close();
      this.showLauncher();
    }

    goToStepTwo(moveFocus) {
      this.steps.classList.add('is-step-two');
      this.titleLines.forEach((line) => {
        if (line.dataset.titleStepTwo) line.textContent = line.dataset.titleStepTwo;
      });
      this.steps.querySelector('[data-bloomli-popup-step="1"]')?.setAttribute('aria-hidden', 'true');
      this.steps.querySelector('[data-bloomli-popup-step="2"]')?.setAttribute('aria-hidden', 'false');

      if (moveFocus && this.email) {
        window.setTimeout(() => this.email.focus(), this.reducedMotion ? 0 : 220);
      }
    }

    selectConcern(handle) {
      if (!handle) return;

      this.selectedConcern = handle;
      this.options.forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.concernHandle === handle));
      });
      this.tags.value = `newsletter,bloomli-popup,concern-${handle}`;
      this.writeStorage(SELECTED_CONCERN_KEY, handle);
    }

    restoreSelectedConcern() {
      const handle = this.readStorage(SELECTED_CONCERN_KEY);
      if (!handle) return;

      const matchingOption = this.options.find((option) => option.dataset.concernHandle === handle);
      if (matchingOption) this.selectConcern(handle);
    }

    recordSubmission() {
      this.removeStorage(CLOSED_UNTIL_KEY);
      this.removeStorage(LAUNCHER_HIDDEN_UNTIL_KEY);
      this.close();
      this.hideLauncher();
    }

    showSuccess() {
      if (!this.success) return;
      this.success.hidden = false;
      window.setTimeout(() => {
        this.success.hidden = true;
      }, 4500);
    }

    showLauncher() {
      if (
        !this.showLauncherAfterClose ||
        this.hasActiveCooldown(LAUNCHER_HIDDEN_UNTIL_KEY)
      ) {
        return;
      }
      this.launcher.hidden = false;
    }

    hideLauncher() {
      if (this.launcher) this.launcher.hidden = true;
    }

    handleKeydown(event) {
      if (event.key === 'Escape') this.dismiss();
    }

    hasActiveCooldown(key) {
      const until = Number(this.readStorage(key));
      if (!until) return false;
      if (until <= Date.now()) {
        this.removeStorage(key);
        return false;
      }
      return true;
    }

    setCooldown(key, days) {
      this.writeStorage(key, String(Date.now() + days * DAY_IN_MILLISECONDS));
    }

    readStorage(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (_error) {
        return null;
      }
    }

    writeStorage(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (_error) {
        // Storage can be unavailable in privacy-restricted browser contexts.
      }
    }

    removeStorage(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (_error) {
        // Storage can be unavailable in privacy-restricted browser contexts.
      }
    }

    readSessionStorage(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (_error) {
        return null;
      }
    }

    writeSessionStorage(key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (_error) {
        // Storage can be unavailable in privacy-restricted browser contexts.
      }
    }

    removeSessionStorage(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (_error) {
        // Storage can be unavailable in privacy-restricted browser contexts.
      }
    }
  }

  document.querySelectorAll('[data-bloomli-signup-popup]').forEach((root) => {
    new BloomliSignupPopup(root).init();
  });
})();
