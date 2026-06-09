(() => {
  const STORAGE_PREFIX = 'bloomliSignupPopup';
  const SELECTED_CONCERN_KEY = `${STORAGE_PREFIX}:selectedConcern`;
  const CLOSED_UNTIL_KEY = `${STORAGE_PREFIX}:closedUntil`;
  const SUBMITTED_KEY = `${STORAGE_PREFIX}:submitted`;
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
      this.footerForms = Array.from(document.querySelectorAll('form.newsletter-form')).filter((form) => !root.contains(form));
      this.formState = root.querySelector('[data-bloomli-popup-form-state]')?.dataset.bloomliPopupFormState || 'idle';
      this.launcher = root.querySelector('[data-bloomli-popup-launcher]');
      this.success = root.querySelector('[data-bloomli-popup-success]');
      this.closeButtons = Array.from(root.querySelectorAll('[data-bloomli-popup-close], [data-bloomli-popup-decline]'));
      this.reopenButton = root.querySelector('[data-bloomli-popup-reopen]');
      this.launcherCloseButton = root.querySelector('[data-bloomli-popup-launcher-close]');
      this.enabled = root.dataset.enabled !== 'false';
      this.isOpen = false;
      this.openTimer = null;
      this.hideTimer = null;
      this.previouslyFocused = null;
      this.selectedConcern = null;
      this.isDesignMode = Boolean(window.Shopify && window.Shopify.designMode);
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.delay = this.numberSetting('delaySeconds', 7) * 1000;
      this.closeDays = this.numberSetting('closeCooldownDays', 7);
      this.showLauncherAfterClose = root.dataset.showLauncher === 'true';
      this.customerAcceptsMarketing = root.dataset.customerMarketing === 'true';
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    init() {
      this.applySettings();
      this.bindFooterForms();

      const pendingSubmission = this.getPendingSubmission();
      if (pendingSubmission && this.isSuccessfulSubmissionReturn()) {
        this.removeSessionStorage(PENDING_SUBMISSION_KEY);
        this.restoreSubmissionLocation(pendingSubmission);
        this.hideThemeNewsletterSuccess();
        this.recordSubmission();
        this.showSuccess();
        return;
      }

      if (!this.enabled || !this.modal || !this.steps || !this.tags) return;

      this.bindEvents();
      this.restoreSelectedConcern();

      if (this.isDesignMode) {
        this.open();
        return;
      }

      if (this.customerAcceptsMarketing || this.hasSubmitted()) return;

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

      this.openTimer = window.setTimeout(() => this.open(), this.delay);
    }

    numberSetting(setting, fallback) {
      const value = Number(this.root.dataset[setting]);
      return Number.isFinite(value) ? value : fallback;
    }

    applySettings() {
      const values = {
        '--bsp-padding-mobile': `${this.numberSetting('paddingMobile', 28) / 10}rem`,
        '--bsp-padding-desktop': `${this.numberSetting('paddingDesktop', 64) / 10}rem`,
        '--bsp-pill-radius': `${this.numberSetting('pillRadius', 50)}px`,
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
          this.selectConcern(option.dataset.concernTag);
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

      this.bindSignupForm(this.form);
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

    selectConcern(tag) {
      if (!tag) return;

      this.selectedConcern = tag;
      this.options.forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.concernTag === tag));
      });
      this.tags.value = `newsletter,bloomli-email-popup,${tag}`;
      this.writeStorage(SELECTED_CONCERN_KEY, tag);
    }

    restoreSelectedConcern() {
      const tag = this.readStorage(SELECTED_CONCERN_KEY);
      if (!tag) return;

      const matchingOption = this.options.find((option) => option.dataset.concernTag === tag);
      if (matchingOption) this.selectConcern(tag);
    }

    bindSignupForm(form) {
      if (!form) return;

      form.addEventListener('submit', () => this.rememberSubmissionAttempt(form), true);
    }

    rememberSubmissionAttempt(form) {
      const submission = {
        source: form === this.form ? 'popup' : 'footer',
        returnUrl: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        scrollY: Math.round(window.scrollY),
      };

      this.writeSessionStorage(PENDING_SUBMISSION_KEY, JSON.stringify(submission));
    }

    bindFooterForms() {
      this.footerForms.forEach((form) => {
        this.bindSignupForm(form);
      });
    }

    isSuccessfulSubmissionReturn() {
      const postedSuccessfully = new URLSearchParams(window.location.search).get('customer_posted') === 'true';
      return this.formState === 'success' || postedSuccessfully;
    }

    getPendingSubmission() {
      const pendingSubmission = this.readSessionStorage(PENDING_SUBMISSION_KEY);
      if (!pendingSubmission) return null;
      if (pendingSubmission === 'true') return {};

      try {
        return JSON.parse(pendingSubmission);
      } catch (_error) {
        return {};
      }
    }

    restoreSubmissionLocation(pendingSubmission) {
      const locationUrl = new URL(window.location.href);
      locationUrl.searchParams.delete('customer_posted');

      if (/^#(?:BloomliSignupPopupForm-|ContactFooter|NewsletterForm--)/.test(locationUrl.hash)) {
        locationUrl.hash = '';
      }

      const returnUrl = pendingSubmission.returnUrl || `${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`;
      window.history.replaceState({}, '', returnUrl);

      if (Number.isFinite(pendingSubmission.scrollY)) {
        window.requestAnimationFrame(() => window.scrollTo(0, pendingSubmission.scrollY));
      }
    }

    recordSubmission() {
      window.clearTimeout(this.openTimer);
      this.writeStorage(SUBMITTED_KEY, 'true');
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
      }, 9500);
    }

    hideThemeNewsletterSuccess() {
      document.querySelectorAll('.newsletter-form__message--success').forEach((message) => {
        if (this.root.contains(message)) return;

        message.hidden = true;
        message.removeAttribute('autofocus');
        document.querySelectorAll(`[aria-describedby="${message.id}"]`).forEach((field) => {
          field.removeAttribute('aria-describedby');
        });
      });
    }

    showLauncher() {
      if (
        !this.showLauncherAfterClose ||
        this.hasSubmitted() ||
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

    hasSubmitted() {
      return this.readStorage(SUBMITTED_KEY) === 'true' || this.hasActiveCooldown(LEGACY_SUBMITTED_UNTIL_KEY);
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

  const initPopup = (root) => {
    if (!root || root.dataset.bloomliPopupInitialized === 'true') return;

    root.dataset.bloomliPopupInitialized = 'true';
    new BloomliSignupPopup(root).init();
  };

  const initPopups = (container = document) => {
    if (container.matches?.('[data-bloomli-signup-popup]')) initPopup(container);
    container.querySelectorAll?.('[data-bloomli-signup-popup]').forEach(initPopup);
  };

  initPopups();

  document.addEventListener('shopify:section:load', (event) => {
    initPopups(event.target);
  });
})();
