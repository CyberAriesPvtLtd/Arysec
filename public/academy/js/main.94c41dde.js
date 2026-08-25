/**
 * Arysec Technologies LLP — site interactions.
 *
 * No dependencies, no inline script (the site runs under a CSP without
 * 'unsafe-inline'), and every enhancement degrades gracefully: with JavaScript
 * disabled the content is still readable and the forms still submit natively.
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  // -------------------------------------------------------------------------
  // Sticky header
  // -------------------------------------------------------------------------
  var header = $('#siteHeader');
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }

  // -------------------------------------------------------------------------
  // Navigation: mobile drawer + desktop dropdown / mega panels
  // -------------------------------------------------------------------------
  var navToggle = $('#navToggle');
  var mainNav = $('#mainNav');
  var triggers = $$('.nav-trigger');

  function closeAllPanels(except) {
    triggers.forEach(function (trigger) {
      if (trigger === except) return;
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    });
  }

  function closeMobileNav() {
    if (!mainNav || !navToggle) return;
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('nav-open');
    closeAllPanels();
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = !mainNav.classList.contains('open');
      mainNav.classList.toggle('open', open);
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('nav-open', open);
      if (!open) closeAllPanels();
    });
  }

  /**
   * Desktop pointer devices open panels on hover and on keyboard focus, so a click
   * on the trigger navigates to that section's own page instead of toggling — which
   * would otherwise just close the panel hover had already opened.
   * Touch and narrow viewports have no hover, so there a click toggles the panel.
   */
  var hoverNav = window.matchMedia('(hover: hover) and (min-width: 1025px)');

  function openPanel(trigger, panel) {
    closeAllPanels(trigger);
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
  }

  function closePanel(trigger, panel) {
    trigger.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  }

  triggers.forEach(function (trigger) {
    var panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var href = trigger.getAttribute('data-href');
      if (hoverNav.matches && href) {
        window.location.href = href;
        return;
      }
      if (trigger.getAttribute('aria-expanded') === 'true') closePanel(trigger, panel);
      else openPanel(trigger, panel);
    });
  });

  $$('.has-panel').forEach(function (item) {
    var trigger = $('.nav-trigger', item);
    var panel = trigger && document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    var timer;

    item.addEventListener('mouseenter', function () {
      if (!hoverNav.matches) return;
      clearTimeout(timer);
      openPanel(trigger, panel);
    });
    item.addEventListener('mouseleave', function () {
      if (!hoverNav.matches) return;
      timer = setTimeout(function () {
        closePanel(trigger, panel);
      }, 140);
    });

    // Keyboard: entering the item opens the panel so its links are reachable by Tab.
    item.addEventListener('focusin', function () {
      if (!hoverNav.matches) return;
      clearTimeout(timer);
      openPanel(trigger, panel);
    });
    item.addEventListener('focusout', function (e) {
      if (!hoverNav.matches) return;
      if (item.contains(e.relatedTarget)) return;
      closePanel(trigger, panel);
    });
  });

  document.addEventListener('click', function (e) {
    if (mainNav && !mainNav.contains(e.target) && navToggle && !navToggle.contains(e.target)) {
      closeAllPanels();
      if (mainNav.classList.contains('open')) closeMobileNav();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openTrigger = triggers.filter(function (t) {
      return t.getAttribute('aria-expanded') === 'true';
    })[0];
    if (openTrigger) {
      closeAllPanels();
      openTrigger.focus();
    } else if (mainNav && mainNav.classList.contains('open')) {
      closeMobileNav();
      navToggle.focus();
    }
  });

  if (mainNav) {
    mainNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMobileNav();
    });
  }

  // -------------------------------------------------------------------------
  // Scroll reveal
  // -------------------------------------------------------------------------
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // -------------------------------------------------------------------------
  // Animated counters
  // -------------------------------------------------------------------------
  var counters = $$('.stat-number');

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!Number.isFinite(target)) return;
    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (counters.length && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
  }

  // -------------------------------------------------------------------------
  // Disclosure widgets: FAQ accordions and career role panels
  // -------------------------------------------------------------------------
  function setupDisclosure(itemSelector, buttonSelector, panelSelector, openClass) {
    var items = $$(itemSelector);
    items.forEach(function (item) {
      var button = $(buttonSelector, item);
      var panel = $(panelSelector, item);
      if (!button || !panel) return;

      button.addEventListener('click', function () {
        var isOpen = item.classList.contains(openClass);

        items.forEach(function (other) {
          if (other === item) return;
          other.classList.remove(openClass);
          var b = $(buttonSelector, other);
          var p = $(panelSelector, other);
          if (b) b.setAttribute('aria-expanded', 'false');
          if (p) p.style.maxHeight = null;
        });

        item.classList.toggle(openClass, !isOpen);
        button.setAttribute('aria-expanded', String(!isOpen));
        panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
      });
    });

    // Keep an open panel correctly sized when the viewport reflows the text.
    window.addEventListener(
      'resize',
      debounce(function () {
        $$(itemSelector + '.' + openClass).forEach(function (item) {
          var panel = $(panelSelector, item);
          if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
        });
      }, 150)
    );
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  setupDisclosure('.faq-item', '.faq-question', '.faq-answer', 'open');
  setupDisclosure('.role-item', '.role-summary', '.role-body', 'open');

  // -------------------------------------------------------------------------
  // Resource request shortcuts
  // -------------------------------------------------------------------------
  $$('.resource-request-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var select = $('#resource');
      var target = $('#request');
      if (select) select.value = button.getAttribute('data-resource') || '';
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        setTimeout(function () {
          var nameField = $('#r-name');
          if (nameField) nameField.focus({ preventScroll: true });
        }, prefersReducedMotion ? 0 : 500);
      }
    });
  });

  $$('.role-apply').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = $('#c-role');
      if (select) select.value = link.getAttribute('data-role') || '';
    });
  });

  // -------------------------------------------------------------------------
  // Forms
  // -------------------------------------------------------------------------
  var forms = $$('form[data-endpoint]');

  forms.forEach(function (form) {
    // Stamp the render time so the server can reject instant (bot) submissions.
    var stamp = form.querySelector('input[name="formLoadedAt"]');
    if (stamp) stamp.value = String(Date.now());

    var status = $('[data-form-status]', form);
    var submitButton = form.querySelector('button[type="submit"]');
    var originalLabel = submitButton ? submitButton.textContent : '';

    function clearErrors() {
      $$('.field-error', form).forEach(function (el) {
        el.textContent = '';
      });
      $$('.has-error', form).forEach(function (el) {
        el.classList.remove('has-error');
      });
      $$('[aria-invalid="true"]', form).forEach(function (el) {
        el.removeAttribute('aria-invalid');
      });
    }

    function showErrors(errors) {
      var firstField = null;
      Object.keys(errors || {}).forEach(function (field) {
        var slot = form.querySelector('[data-error-for="' + field + '"]');
        var input = form.querySelector('[name="' + field + '"]');
        if (slot) slot.textContent = errors[field];
        if (input) {
          input.setAttribute('aria-invalid', 'true');
          var wrapper = input.closest('.form-field');
          if (wrapper) wrapper.classList.add('has-error');
          if (!firstField) firstField = input;
        }
      });
      if (firstField) firstField.focus();
    }

    function setStatus(message, kind) {
      if (!status) return;
      status.textContent = message;
      status.classList.remove('is-error', 'is-success');
      if (kind) status.classList.add(kind === 'error' ? 'is-error' : 'is-success');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var endpoint = form.getAttribute('data-endpoint');
      var hasFile = Boolean(form.querySelector('input[type="file"]'));
      var body;
      var headers = { Accept: 'application/json' };

      if (hasFile) {
        // Multipart, so the browser sets the boundary itself.
        body = new FormData(form);
      } else {
        var data = {};
        new FormData(form).forEach(function (value, key) {
          data[key] = value;
        });
        body = JSON.stringify(data);
        headers['Content-Type'] = 'application/json';
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending…';
      }
      setStatus('Sending your message…');

      fetch(endpoint, { method: 'POST', headers: headers, body: body, credentials: 'same-origin' })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return { ok: false, error: 'Unexpected response from the server.' };
            })
            .then(function (payload) {
              return { status: response.status, payload: payload };
            });
        })
        .then(function (result) {
          if (result.payload && result.payload.ok) {
            var successMessage =
              form.getAttribute('data-success') || result.payload.message || 'Thank you.';
            form.reset();
            if (stamp) stamp.value = String(Date.now());
            setStatus(successMessage, 'success');
            return;
          }

          if (result.payload && result.payload.errors) showErrors(result.payload.errors);
          setStatus(
            (result.payload && result.payload.error) ||
              'Something went wrong. Please try again, or email us directly.',
            'error'
          );
        })
        .catch(function () {
          setStatus(
            'We could not reach the server. Please check your connection, or email us at info@arysec.in.',
            'error'
          );
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
          }
        });
    });
  });

  // -------------------------------------------------------------------------
  // Cookie consent
  // -------------------------------------------------------------------------
  var CONSENT_KEY = 'arysec.cookieConsent';
  var banner = $('#cookieBanner');

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (err) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (err) {
      /* storage unavailable — the banner simply reappears next visit */
    }
  }

  if (banner) {
    if (!readConsent()) {
      banner.hidden = false;
      requestAnimationFrame(function () {
        banner.classList.add('visible');
      });
    }

    $$('[data-cookie-choice]', banner).forEach(function (button) {
      button.addEventListener('click', function () {
        writeConsent(button.getAttribute('data-cookie-choice'));
        banner.classList.remove('visible');
        setTimeout(function () {
          banner.hidden = true;
        }, prefersReducedMotion ? 0 : 300);
        // Analytics would be initialised here when consent is 'all'. The site ships
        // with no analytics provider, so there is nothing to start.
      });
    });
  }

  // -------------------------------------------------------------------------
  // Footer year
  // -------------------------------------------------------------------------
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
