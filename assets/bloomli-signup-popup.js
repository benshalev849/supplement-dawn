(() => {
  const STORAGE_PREFIX = 'bloomliSignupPopup';
  const SELECTED_CONCERN_KEY = `${STORAGE_PREFIX}:selectedConcern`;
  const CLOSED_UNTIL_KEY = `${STORAGE_PREFIX}:closedUntil`;
  const SUBMITTED_KEY = `${STORAGE_PREFIX}:submitted`;
  const LEGACY_SUBMITTED_UNTIL_KEY = `${STORAGE_PREFIX}:submittedUntil`;
  const LAUNCHER_HIDDEN_UNTIL_KEY = `${STORAGE_PREFIX}:launcherHiddenUntil`;
  const PENDING_SUBMISSION_KEY = `${STORAGE_PREFIX}:pendingSubmission`;
  const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
  const SHOPIFY_FORMS_ENDPOINT = 'https://forms.shopifyapps.com/api/v2/form_submission';
  const SHOPIFY_FORMS_HCAPTCHA_SITEKEY = '2e7f6342-57df-422a-8431-ddd86df296bc';
  const HCAPTCHA_SCRIPT_ID = 'bloomli-shopify-forms-hcaptcha';
  const HCAPTCHA_ONLOAD_CALLBACK = 'bloomliShopifyFormsCaptchaReady';
  let hCaptchaScriptPromise;

  const loadHCaptcha = () => {
    if (window.hcaptcha) return Promise.resolve(window.hcaptcha);
    if (hCaptchaScriptPromise) return hCaptchaScriptPromise;

    hCaptchaScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(HCAPTCHA_SCRIPT_ID);
      const timeout = window.setTimeout(() => reject(new Error('CAPTCHA timed out.')), 15000);

      window[HCAPTCHA_ONLOAD_CALLBACK] = () => {
        window.clearTimeout(timeout);
        if (window.hcaptcha) {
          resolve(window.hcaptcha);
        } else {
          reject(new Error('CAPTCHA could not be initialized.'));
        }
      };

      if (existingScript) {
        existingScript.addEventListener('error', () => {
          window.clearTimeout(timeout);
          reject(new Error('CAPTCHA could not be loaded.'));
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = HCAPTCHA_SCRIPT_ID;
      script.src = `https://js.hcaptcha.com/1/api.js?onload=${HCAPTCHA_ONLOAD_CALLBACK}&render=explicit&recaptchacompat=off`;
      script.async = true;
      script.defer = true;
      script.addEventListener('error', () => {
        window.clearTimeout(timeout);
        reject(new Error('CAPTCHA could not be loaded.'));
      }, { once: true });
      document.head.append(script);
    });

    hCaptchaScriptPromise = hCaptchaScriptPromise.catch((error) => {
      hCaptchaScriptPromise = null;
      throw error;
    });

    return hCaptchaScriptPromise;
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
      this.captchaContainer = root.querySelector('[data-bloomli-popup-captcha]');
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
      this.selectedConcernValue = null;
      this.captchaWidgetId = null;
      this.captchaChallengeOpen = false;
      this.isSubmitting = false;
      this.isDesignMode = Boolean(window.Shopify && window.Shopify.designMode);
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.delay = this.numberSetting('delaySeconds', 7) * 1000;
      this.closeDays = this.numberSetting('closeCooldownDays', 7);
      this.showLauncherAfterClose = root.dataset.showLauncher === 'true';
      this.customerAcceptsMarketing = root.dataset.customerMarketing === 'true';
      this.shopifyFormsId = Number(root.dataset.shopifyFormsId);
      this.shopifyFormsEnabled =
        root.dataset.shopifyFormsEnabled === 'true' &&
        Number.isInteger(this.shopifyFormsId) &&
        this.shopifyFormsId > 0 &&
        Boolean(root.dataset.shopifyDomain);
      this.shopifyFormsConcernField = root.dataset.shopifyFormsConcernField || 'primary_hair_concern';
      this.shopifyDomain = root.dataset.shopifyDomain;
      this.submitLoadingLabel = root.dataset.submitLoadingLabel || 'Signing you up...';
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    init() {
      this.applySettings();
      this.bindFooterForms();

      const pendingSubmission = this.getPendingSubmission();
      if (pendingSubmission && this.isSuccessfulSubmissionReturn(pendingSubmission)) {
        this.removeSessionStorage(PENDING_SUBMISSION_KEY);
        this.restoreSubmissionLocation(pendingSubmission);
        this.recordSubmission();
        if (pendingSubmission.source === 'popup') {
          this.hideThemeNewsletterSuccess();
          this.showSuccess();
        }
        return;
      }

      if (pendingSubmission?.source === 'footer' && this.hasNewsletterError()) {
        this.removeSessionStorage(PENDING_SUBMISSION_KEY);
        this.restoreSubmissionLocation(pendingSubmission);
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
        this.removeSessionStorage(PENDING_SUBMISSION_KEY);
        this.restoreSubmissionLocation(pendingSubmission);
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

    selectConcern(tag, value) {
      if (!tag) return;

      this.selectedConcern = tag;
      this.selectedConcernValue = value || tag;
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
      if (matchingOption) this.selectConcern(tag, matchingOption.dataset.concernValue);
    }

    bindSignupForm(form) {
      if (!form || form.dataset.bloomliSignupBound === 'true') return;

      form.dataset.bloomliSignupBound = 'true';
      if (form === this.form && this.shopifyFormsEnabled) {
        form.addEventListener('submit', (event) => this.submitWithShopifyForms(event));
        return;
      }

      form.addEventListener('submit', () => this.rememberSubmissionAttempt(form), true);
    }

    async submitWithShopifyForms(event) {
      event.preventDefault();
      if (this.isSubmitting || !this.form?.checkValidity()) return;

      this.clearFormError();
      this.setFormPending(true);

      try {
        const hCaptchaResponse = await this.getHCaptchaResponse();
        const payload = {
          shopify_domain: this.shopifyDomain,
          h_captcha_response: hCaptchaResponse,
          form_instance_id: this.shopifyFormsId,
          email: this.email.value.trim(),
          customer_consented_to_email_marketing: true,
          customer_consented_to_sms_marketing: false,
        };

        if (this.selectedConcernValue && this.shopifyFormsConcernField) {
          payload[`custom#${this.shopifyFormsConcernField}`] = this.selectedConcernValue;
        }

        let response;
        try {
          response = await fetch(SHOPIFY_FORMS_ENDPOINT, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          if (error && typeof error === 'object') {
            error.useNativeFallback = true;
          } else {
            const fallbackError = new Error(errorCode);
            fallbackError.useNativeFallback = true;
            error = fallbackError;
          }
          throw error;
        }

        const responseData = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(this.getShopifyFormsError(responseData));
          error.useNativeFallback = response.status === 404 || response.status >= 500;
          throw error;
        }

        this.setFormPending(false);
        this.form.reset();
        this.recordSubmission();
        this.showSuccess();
      } catch (error) {
        const errorCode = typeof error === 'string' ? error : error?.message;
        if (
          errorCode === 'network-error' ||
          errorCode === 'script-error' ||
          errorCode === 'invalid-data' ||
          errorCode === 'invalid-captcha-id' ||
          errorCode === 'missing-captcha' ||
          /CAPTCHA (?:could not|timed out)/.test(errorCode || '')
        ) {
          error.useNativeFallback = true;
        }

        if (error?.useNativeFallback) {
          this.submitNativeFallback();
          return;
        }

        this.setFormPending(false);
        this.resetCaptcha();
        this.showFormError(this.getCaptchaError(error));
      }
    }

    async getHCaptchaResponse() {
      const hCaptcha = await loadHCaptcha();

      if (this.captchaWidgetId === null) {
        this.captchaWidgetId = hCaptcha.render(this.captchaContainer, {
          sitekey: SHOPIFY_FORMS_HCAPTCHA_SITEKEY,
          size: 'invisible',
          'open-callback': () => {
            this.captchaChallengeOpen = true;
          },
          'close-callback': () => {
            this.captchaChallengeOpen = false;
          },
          'expired-callback': () => this.resetCaptcha(),
        });
      }

      const result = await hCaptcha.execute(this.captchaWidgetId, { async: true });
      this.captchaChallengeOpen = false;
      if (!result?.response) throw new Error('CAPTCHA verification failed.');
      return result.response;
    }

    resetCaptcha() {
      this.captchaChallengeOpen = false;
      if (this.captchaWidgetId === null || !window.hcaptcha) return;

      window.hcaptcha.reset(this.captchaWidgetId);
    }

    getCaptchaError(error) {
      const code = typeof error === 'string' ? error : error?.message;
      if (code === 'challenge-closed') return 'Please complete the verification to sign up.';
      if (code === 'challenge-expired') return 'The verification expired. Please try again.';
      if (code === 'rate-limited') return 'Too many signup attempts. Please wait and try again.';
      return code || 'We could not sign you up. Please try again.';
    }

    getShopifyFormsError(responseData) {
      const errors = responseData?.errors;
      if (typeof errors === 'string') return errors;
      if (errors?.message) return errors.message;
      if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat().find(Boolean);
        if (firstError) return String(firstError);
      }
      return responseData?.message || 'We could not sign you up. Please try again.';
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
      this.rememberSubmissionAttempt(this.form);
      HTMLFormElement.prototype.submit.call(this.form);
    }

    restoreScrollPosition(scrollY) {
      if (!Number.isFinite(scrollY)) return;

      const restoreScroll = () => window.scrollTo(0, scrollY);
      [0, 100, 300, 700].forEach((delay) => {
        window.setTimeout(restoreScroll, delay);
      });
      window.addEventListener('load', restoreScroll, { once: true });
      window.addEventListener('pageshow', restoreScroll, { once: true });
    }

    rememberSubmissionAttempt(form) {
      const isPopupForm = form === this.form;
      const submission = {
        source: isPopupForm ? 'popup' : 'footer',
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

      if (/^#(?:contact_form|BloomliSignupPopupForm-|ContactFooter|NewsletterForm--)/.test(locationUrl.hash)) {
        locationUrl.hash = '';
      }

      const returnUrl = pendingSubmission.returnUrl || `${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`;
      window.history.replaceState({}, '', returnUrl);

      this.restoreScrollPosition(pendingSubmission.scrollY);
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
      if (event.key === 'Escape' && !this.captchaChallengeOpen) this.dismiss();
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
