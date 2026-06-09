(() => {
  if (window.bloomliSignupFormsLoaded) return;
  window.bloomliSignupFormsLoaded = true;

  const STORAGE_PREFIX = 'bloomliSignupPopup';
  const SELECTED_CONCERN_KEY = `${STORAGE_PREFIX}:selectedConcern`;
  const CLOSED_UNTIL_KEY = `${STORAGE_PREFIX}:closedUntil`;
  const SUBMITTED_KEY = `${STORAGE_PREFIX}:submitted`;
  const LEGACY_SUBMITTED_UNTIL_KEY = `${STORAGE_PREFIX}:submittedUntil`;
  const LAUNCHER_HIDDEN_UNTIL_KEY = `${STORAGE_PREFIX}:launcherHiddenUntil`;
  const PENDING_SUBMISSION_KEY = `${STORAGE_PREFIX}:pendingSubmission`;
  const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
  const GENERIC_ERROR_MESSAGE = 'We could not sign you up. Please try again.';
  const GENERIC_SUCCESS_MESSAGE = 'Thanks for subscribing!';

  const readStorage = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  };

  const writeStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  };

  const removeStorage = (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (_error) {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  };

  const readSessionStorage = (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  };

  const writeSessionStorage = (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_error) {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  };

  const removeSessionStorage = (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_error) {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  };

  const markSubscribed = () => {
    writeStorage(SUBMITTED_KEY, 'true');
    removeStorage(CLOSED_UNTIL_KEY);
    removeStorage(LAUNCHER_HIDDEN_UNTIL_KEY);
  };

  const getPendingSubmission = () => {
    const pendingSubmission = readSessionStorage(PENDING_SUBMISSION_KEY);
    if (!pendingSubmission) return null;
    if (pendingSubmission === 'true') return {};

    try {
      return JSON.parse(pendingSubmission);
    } catch (_error) {
      return {};
    }
  };

  const rememberSubmissionAttempt = (source) => {
    const submission = {
      source,
      returnUrl: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      scrollY: Math.round(window.scrollY),
    };

    writeSessionStorage(PENDING_SUBMISSION_KEY, JSON.stringify(submission));
  };

  const nativeFormSubmit = (form, source) => {
    rememberSubmissionAttempt(source);
    HTMLFormElement.prototype.submit.call(form);
  };

  const restoreScrollPosition = (scrollY) => {
    if (!Number.isFinite(scrollY)) return;

    const restoreScroll = () => window.scrollTo(0, scrollY);
    [0, 100, 300, 700].forEach((delay) => {
      window.setTimeout(restoreScroll, delay);
    });
    window.addEventListener('load', restoreScroll, { once: true });
    window.addEventListener('pageshow', restoreScroll, { once: true });
  };

  const restoreSubmissionLocation = (pendingSubmission) => {
    const locationUrl = new URL(window.location.href);
    locationUrl.searchParams.delete('customer_posted');

    if (/^#(?:contact_form|BloomliSignupPopupForm-|ContactFooter|NewsletterForm--)/.test(locationUrl.hash)) {
      locationUrl.hash = '';
    }

    const returnUrl = pendingSubmission.returnUrl || `${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`;
    window.history.replaceState({}, '', returnUrl);

    restoreScrollPosition(pendingSubmission.scrollY);
  };

  // Posts a native `form_type=customer` form to /contact without reloading.
  // Shopify redirects to `return_to` with `customer_posted=true` on success and
  // to /challenge when it requires an interactive CAPTCHA; errors re-render the
  // origin page with the form errors in the section markup.
  const submitCustomerForm = async (form) => {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });

    const responseUrl = new URL(response.url, window.location.origin);
    if (responseUrl.pathname.endsWith('/challenge')) return { state: 'challenge' };
    if (!response.ok) return { state: 'fallback' };

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (responseUrl.searchParams.get('customer_posted') === 'true' || response.redirected) {
      return { state: 'success', doc };
    }

    return { state: 'error', doc };
  };

  const findSectionScopedElement = (form, doc, selector) => {
    const sectionId = form.closest('.shopify-section')?.id;
    const scope = (sectionId && doc.getElementById(sectionId)) || doc;
    return scope.querySelector(selector);
  };

  const extractErrorMessage = (form, doc) => {
    if (!doc) return GENERIC_ERROR_MESSAGE;

    const message = findSectionScopedElement(
      form,
      doc,
      '.newsletter-form__message:not(.newsletter-form__message--success), [data-bloomli-popup-error]:not([hidden])'
    );
    return message?.textContent.replace(/\s+/g, ' ').trim() || GENERIC_ERROR_MESSAGE;
  };

  const clearNewsletterMessages = (form) => {
    form.querySelectorAll('.newsletter-form__message').forEach((message) => message.remove());
    form.querySelector('input[type="email"]')?.removeAttribute('aria-invalid');
  };

  const showNewsletterMessage = (form, success, doc) => {
    clearNewsletterMessages(form);

    const selector = success
      ? '.newsletter-form__message--success'
      : '.newsletter-form__message:not(.newsletter-form__message--success)';
    const responseMessage = doc && findSectionScopedElement(form, doc, selector);

    let message;
    if (responseMessage) {
      message = document.importNode(responseMessage, true);
      message.removeAttribute('autofocus');
    } else {
      message = document.createElement(success ? 'h3' : 'small');
      message.className = `newsletter-form__message form__message${success ? ' newsletter-form__message--success' : ''}`;
      message.textContent = success
        ? form.dataset.successMessage || GENERIC_SUCCESS_MESSAGE
        : GENERIC_ERROR_MESSAGE;
    }

    message.setAttribute('role', success ? 'status' : 'alert');
    const wrapper = form.querySelector('.newsletter-form__field-wrapper') || form;
    wrapper.append(message);

    if (!success) form.querySelector('input[type="email"]')?.setAttribute('aria-invalid', 'true');
  };

  const setNewsletterPending = (form, isPending) => {
    form.dataset.bloomliPending = String(isPending);
    form.setAttribute('aria-busy', String(isPending));
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = isPending;
  };

  const handleNewsletterSubmit = async (event, form, onSuccess) => {
    event.preventDefault();
    if (form.dataset.bloomliPending === 'true' || !form.checkValidity()) return;

    clearNewsletterMessages(form);
    setNewsletterPending(form, true);

    let result;
    try {
      result = await submitCustomerForm(form);
    } catch (_error) {
      nativeFormSubmit(form, 'footer');
      return;
    }

    if (result.state === 'challenge' || result.state === 'fallback') {
      nativeFormSubmit(form, 'footer');
      return;
    }

    setNewsletterPending(form, false);

    if (result.state === 'success') {
      form.reset();
      showNewsletterMessage(form, true, result.doc);
      onSuccess?.();
      return;
    }

    showNewsletterMessage(form, false, result.doc);
  };

  const bindNewsletterForm = (form, onSuccess) => {
    if (!form || form.dataset.bloomliSignupBound === 'true') return;

    form.dataset.bloomliSignupBound = 'true';
    form.addEventListener('submit', (event) => handleNewsletterSubmit(event, form, onSuccess));
  };

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
      this.submitButton = root.querySelector('[data-bloomli-popup-submit]');
      this.formError = root.querySelector('[data-bloomli-popup-error]');
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
      this.isSubmitting = false;
      this.isDesignMode = Boolean(window.Shopify && window.Shopify.designMode);
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.delay = this.numberSetting('delaySeconds', 7) * 1000;
      this.closeDays = this.numberSetting('closeCooldownDays', 7);
      this.showLauncherAfterClose = root.dataset.showLauncher === 'true';
      this.customerAcceptsMarketing = root.dataset.customerMarketing === 'true';
      this.submitLoadingLabel = root.dataset.submitLoadingLabel || 'Signing you up...';
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    init() {
      this.applySettings();
      this.bindFooterForms();

      const pendingSubmission = getPendingSubmission();
      if (pendingSubmission && this.isSuccessfulSubmissionReturn(pendingSubmission)) {
        removeSessionStorage(PENDING_SUBMISSION_KEY);
        restoreSubmissionLocation(pendingSubmission);
        this.recordSubmission();
        if (pendingSubmission.source === 'popup') {
          this.hideThemeNewsletterSuccess();
          this.showSuccess();
        }
        return;
      }

      if (pendingSubmission?.source === 'footer' && this.hasNewsletterError()) {
        removeSessionStorage(PENDING_SUBMISSION_KEY);
        restoreSubmissionLocation(pendingSubmission);
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

      if (this.formState === 'error' && pendingSubmission?.source === 'popup') {
        removeSessionStorage(PENDING_SUBMISSION_KEY);
        restoreSubmissionLocation(pendingSubmission);
        this.goToStepTwo(false);
        this.open();
        return;
      }

      removeSessionStorage(PENDING_SUBMISSION_KEY);

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
          this.selectConcern(option.dataset.concernTag, option.dataset.concernValue);
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
        const closedUntil = readStorage(CLOSED_UNTIL_KEY);
        writeStorage(
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

    selectConcern(tag, value) {
      if (!tag) return;

      this.selectedConcern = tag;
      this.options.forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.concernTag === tag));
      });
      this.tags.value = `newsletter,bloomli-email-popup,${tag}`;
      writeStorage(SELECTED_CONCERN_KEY, tag);
    }

    restoreSelectedConcern() {
      const tag = readStorage(SELECTED_CONCERN_KEY);
      if (!tag) return;

      const matchingOption = this.options.find((option) => option.dataset.concernTag === tag);
      if (matchingOption) this.selectConcern(tag, matchingOption.dataset.concernValue);
    }

    bindSignupForm(form) {
      if (!form || form.dataset.bloomliSignupBound === 'true') return;

      form.dataset.bloomliSignupBound = 'true';
      form.addEventListener('submit', (event) => this.submitForm(event));
    }

    async submitForm(event) {
      event.preventDefault();
      if (this.isSubmitting || !this.form?.checkValidity()) return;

      this.clearFormError();
      this.setFormPending(true);

      let result;
      try {
        result = await submitCustomerForm(this.form);
      } catch (_error) {
        this.submitNativeFallback();
        return;
      }

      if (result.state === 'challenge' || result.state === 'fallback') {
        this.submitNativeFallback();
        return;
      }

      this.setFormPending(false);

      if (result.state === 'success') {
        this.form.reset();
        this.recordSubmission();
        this.showSuccess();
        return;
      }

      this.showFormError(extractErrorMessage(this.form, result.doc));
    }

    setFormPending(isPending) {
      this.isSubmitting = isPending;
      this.form?.setAttribute('aria-busy', String(isPending));
      if (!this.submitButton) return;

      if (!this.submitButton.dataset.defaultLabel) {
        this.submitButton.dataset.defaultLabel = this.submitButton.textContent.trim();
      }
      this.submitButton.disabled = isPending;
      this.submitButton.textContent = isPending
        ? this.submitLoadingLabel
        : this.submitButton.dataset.defaultLabel;
    }

    clearFormError() {
      if (!this.formError) return;

      this.formError.hidden = true;
      this.formError.textContent = '';
      this.email?.removeAttribute('aria-invalid');
      this.email?.removeAttribute('aria-describedby');
    }

    showFormError(message) {
      if (!this.formError) return;

      this.formError.textContent = message;
      this.formError.hidden = false;
      this.email?.setAttribute('aria-invalid', 'true');
      this.email?.setAttribute('aria-describedby', this.formError.id);
    }

    submitNativeFallback() {
      this.setFormPending(false);
      nativeFormSubmit(this.form, 'popup');
    }

    bindFooterForms() {
      this.footerForms.forEach((form) => {
        bindNewsletterForm(form, () => this.recordSubmission());
      });
    }

    isSuccessfulSubmissionReturn(pendingSubmission) {
      const postedSuccessfully = new URLSearchParams(window.location.search).get('customer_posted') === 'true';
      if (postedSuccessfully) return true;
      if (pendingSubmission.source === 'popup') return this.formState === 'success';

      return Boolean(
        Array.from(document.querySelectorAll('.newsletter-form__message--success')).find(
          (message) => !this.root.contains(message)
        )
      );
    }

    hasNewsletterError() {
      return Boolean(
        document.querySelector(
          '.newsletter-form__message:not(.newsletter-form__message--success), .newsletter-form [aria-invalid="true"]'
        )
      );
    }

    recordSubmission() {
      window.clearTimeout(this.openTimer);
      markSubscribed();
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
      return readStorage(SUBMITTED_KEY) === 'true' || this.hasActiveCooldown(LEGACY_SUBMITTED_UNTIL_KEY);
    }

    hasActiveCooldown(key) {
      const until = Number(readStorage(key));
      if (!until) return false;
      if (until <= Date.now()) {
        removeStorage(key);
        return false;
      }
      return true;
    }

    setCooldown(key, days) {
      writeStorage(key, String(Date.now() + days * DAY_IN_MILLISECONDS));
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

  // Pages without the popup section (e.g. the password page banner) still get
  // no-reload signups and a clean return from the /challenge fallback.
  const initStandaloneForms = () => {
    if (document.querySelector('[data-bloomli-signup-popup]')) return;

    const pendingSubmission = getPendingSubmission();
    if (pendingSubmission) {
      removeSessionStorage(PENDING_SUBMISSION_KEY);
      if (new URLSearchParams(window.location.search).get('customer_posted') === 'true') {
        markSubscribed();
      }
      restoreSubmissionLocation(pendingSubmission);
    }

    document.querySelectorAll('form.newsletter-form').forEach((form) => {
      bindNewsletterForm(form, markSubscribed);
    });
  };

  initPopups();
  initStandaloneForms();

  document.addEventListener('shopify:section:load', (event) => {
    initPopups(event.target);
    event.target.querySelectorAll?.('form.newsletter-form').forEach((form) => {
      bindNewsletterForm(form, markSubscribed);
    });
  });
})();
