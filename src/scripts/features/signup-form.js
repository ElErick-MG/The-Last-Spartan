/**
 * Formulario de acceso anticipado: integración funcional, validación profunda,
 * protección anti-spam/bots y envío seguro a erickdevlml@gmail.com.
 */
import { combineDisposers, on, queryRequired } from '../core/dom.js';
import {
  checkRateLimit,
  recordSuccessfulSubmission,
  sanitizeInput,
  validateEmail,
  validateName,
} from './email-security.js';

export { validateName, validateEmail };

const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/erickdevlml@gmail.com';
const REQUEST_FIELD_NAME = 'request';
const PRESS_KIT_VALUE = 'gdd';
const MIN_FILL_TIME_MS = 2000; // Defensa anti-bot: tiempo mínimo humano para rellenar

export function mountSignupForm(region) {
  const form = region?.querySelector('[data-signup-form]');

  if (!region || !form) {
    return null;
  }

  const successBox = queryRequired('[data-signup-success]', region);
  const successBody = region.querySelector('[data-signup-success-body]');
  const resetBtn = region.querySelector('[data-signup-reset]');
  const generalError = region.querySelector('[data-signup-general-error]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const gotchaInput = form.querySelector('input[name="_gotcha"]');
  const honeyInput = form.querySelector('input[name="_honey"]');

  let mountTimestamp = Date.now();

  const fields = [
    {
      input: queryRequired('[data-signup-name]', form),
      error: queryRequired('[data-signup-name-error]', form),
      validate: validateName,
    },
    {
      input: queryRequired('[data-signup-email]', form),
      error: queryRequired('[data-signup-email-error]', form),
      validate: validateEmail,
    },
  ];

  function clearGeneralError() {
    if (generalError) {
      generalError.textContent = '';
      generalError.hidden = true;
    }
  }

  function setGeneralError(message) {
    if (generalError) {
      generalError.textContent = message;
      generalError.hidden = !message;
    }
  }

  function setFieldError(field, message) {
    field.error.textContent = message ?? '';
    field.input.setAttribute('aria-invalid', String(Boolean(message)));
  }

  function validateField(field) {
    const message = field.validate(field.input.value);
    setFieldError(field, message);
    return message;
  }

  function validateAll() {
    const invalidFields = fields.filter((field) => validateField(field));

    return {
      isValid: invalidFields.length === 0,
      firstInvalidInput: invalidFields[0]?.input ?? null,
    };
  }

  function showSuccess(name, email, requestLabel) {
    form.hidden = true;
    successBox.hidden = false;

    if (successBody) {
      successBody.innerHTML = `Gracias, <strong>${name}</strong>. Tu interés en <strong>${requestLabel}</strong> ha sido registrado con éxito. Te hemos reservado un lugar con la dirección <strong>${email}</strong> y nos pondremos en contacto contigo.`;
    } else {
      successBox.textContent = `Gracias, ${name}. Solicitud recibida con éxito para ${requestLabel}.`;
    }
  }

  function resetForm() {
    form.reset();
    fields.forEach((field) => setFieldError(field, null));
    clearGeneralError();
    form.hidden = false;
    successBox.hidden = true;
    mountTimestamp = Date.now();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearGeneralError();

    // 1. Detección de Bot vía Honeypot invisible
    const isHoneyFilled =
      (gotchaInput && gotchaInput.value.trim().length > 0) ||
      (honeyInput && honeyInput.value.trim().length > 0);

    if (isHoneyFilled) {
      // Simular éxito silencioso para neutralizar y descartar al bot sin alertarlo
      showSuccess('Guerrero', 'usuario@dominio.com', 'el Playtest');
      return;
    }

    // 2. Detección de envío ultra-rápido (Trampa temporal anti-script)
    if (Date.now() - mountTimestamp < MIN_FILL_TIME_MS) {
      setGeneralError('Por favor verifica tus datos antes de enviar.');
      return;
    }

    // 3. Validación de campos (nombre, correo real, sintaxis, dominios desechables)
    const { isValid, firstInvalidInput } = validateAll();
    if (!isValid) {
      firstInvalidInput?.focus();
      return;
    }

    // 4. Rate Limiting (control de frecuencia y saturación de bandeja de entrada)
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setGeneralError(rateLimit.reason);
      return;
    }

    // 5. Preparar datos sanitizados
    const sanitizedName = sanitizeInput(fields[0].input.value);
    const sanitizedEmail = sanitizeInput(fields[1].input.value);
    const requestItem = form.elements.namedItem(REQUEST_FIELD_NAME);
    const isPressKit = requestItem?.value === PRESS_KIT_VALUE;
    const requestLabel = isPressKit
      ? 'Press Kit y GDD Oficial'
      : 'Playtest Beta de la Parte 1';

    const payload = {
      name: sanitizedName,
      email: sanitizedEmail,
      solicitud: requestLabel,
      _subject: `[The Last Spartan] ${isPressKit ? 'Petición Press Kit / GDD' : 'Nuevo Guerrero para Playtest'} - ${sanitizedName}`,
      _template: 'table',
      _captcha: 'false',
      seguridad: 'Verificación de integridad y validación de correo real superada',
      fecha: new Date().toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
    };

    // 6. Estado de carga visual
    const originalBtnText = submitBtn?.textContent || 'Enviar solicitud';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando y enviando...';
    }

    try {
      const response = await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (
        response.ok &&
        (data.success === 'true' || data.success === true || response.status === 200)
      ) {
        recordSuccessfulSubmission();
        showSuccess(sanitizedName, sanitizedEmail, requestLabel);
      } else {
        const errorText =
          data.message ||
          'No se pudo completar el envío en este momento. Inténtalo de nuevo más tarde.';
        setGeneralError(errorText);
      }
    } catch {
      setGeneralError(
        'Hubo un problema de conexión al enviar la solicitud. Por favor comprueba tu conexión a internet e inténtalo de nuevo.',
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  }

  function clearErrorOnInput(field) {
    if (field.input.getAttribute('aria-invalid') !== 'true') {
      return;
    }

    if (field.validate(field.input.value) === null) {
      setFieldError(field, null);
    }
  }

  const disposers = [
    on(form, 'submit', handleSubmit),
    ...fields.map((field) =>
      on(field.input, 'input', () => clearErrorOnInput(field)),
    ),
  ];

  if (resetBtn) {
    disposers.push(on(resetBtn, 'click', resetForm));
  }

  const dispose = combineDisposers(disposers);

  return { destroy: dispose };
}
