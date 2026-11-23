/**
 * Módulo de Seguridad, Integridad y Validación Profunda de Correos.
 * Protege contra spam, bots, estafas, inyecciones de cabeceras (CRLF),
 * correos temporales/desechables y dominios falsos.
 */

// Lista exhaustiva de proveedores de correos temporales, desechables y 'burner mail'
export const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'dispostable.com',
  'throwawaymail.com',
  'getairmail.com',
  'generator.email',
  'fakemailgenerator.com',
  'nada.ltd',
  'mohmal.com',
  'crazymailing.com',
  'tempr.email',
  'inboxkitten.com',
  'burnermail.io',
  'dropmail.me',
  'mytemp.email',
  'harakirimail.com',
  'mailnesia.com',
  'maildrop.cc',
  'disposablemail.com',
  'tempail.com',
  'mytempmail.com',
  'emailondeck.com',
  'getnada.com',
  'zillamail.com',
  'dayrep.com',
  'armyspy.com',
  'cuvox.de',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'trbvm.com',
  'byom.de',
  'trash-mail.com',
  '0-mail.com',
  'discard.email',
  'discardmail.com',
  'spamgourmet.com',
  'mintemail.com',
  'mytempemail.com',
  'tempinbox.com',
  'spambox.us',
  'meltmail.com',
  'fakeinbox.com',
  'spam4.me',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailinater.com',
  'safetymail.info',
  'trashymail.com',
  'wegwerfmail.de',
  'wegwerfemail.de',
  'trashmail.me',
  'trashmail.at',
  'kasmail.com',
  'filzmail.com',
  'spamevader.com',
  'inboxbear.com',
  'mailcatch.com',
  'trashinbox.com',
]);

// Dominios ficticios, de prueba o no válidos
export const FAKE_DOMAINS = new Set([
  'test.com',
  'example.com',
  'example.org',
  'example.net',
  'sample.com',
  'fake.com',
  'asdf.com',
  'domain.com',
  'correo.com',
  'algo.com',
  'email.com',
  'prueba.com',
  'demo.com',
  'temp.com',
  'testing.com',
  'invalid.com',
  'test.es',
  'prueba.es',
]);

// Detección y sugerencia de errores tipográficos en dominios populares
export const COMMON_TYPOS = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'icoud.com': 'icloud.com',
  'protom.me': 'proton.me',
  'protonmai.com': 'protonmail.com',
};

// Nombres de usuario comúnmente utilizados en envíos masivos o bots
const DUMMY_USERNAMES = new Set([
  'test',
  'prueba',
  'admin',
  'administrator',
  'asdf',
  'fake',
  'dummy',
  'spam',
  'root',
  'null',
  'user',
  'usuario',
  'nadie',
]);

// Patrones sospechosos de phishing, spam, enlaces externos o estafas
const SPAM_PATTERNS = [
  /\b(crypto|bitcoin|btc|eth|ethereum|solana|binance|metamask)\b/i,
  /\b(casino|betting|poker|slots|gambling)\b/i,
  /\b(viagra|cialis|pharmacy|pills)\b/i,
  /\b(forex|loans?|préstamos?|invertir|investment|invest\s+now)\b/i,
  /\b(free\s+followers|seo\s+ranking|earn\s+money|ganar\s+dinero|passive\s+income)\b/i,
  /\b(telegram|whatsapp|wa\.me|t\.me)\b/i,
  /https?:\/\/|www\./i, // Prohibir URLs en el nombre
];

// RFC 5322 simplificado pero riguroso para la estructura básica del email
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Sanitiza cualquier texto de entrada:
 * - Previene inyección de cabeceras de correo (CRLF \r\n, %0a, %0d)
 * - Remueve tags HTML y scripts
 * - Normaliza espacios en blanco
 */
export function sanitizeInput(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\r\n\x00-\x1F\x7F]+/g, ' ')
    .replace(/%0[ad]/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Valida el nombre del solicitante asegurando integridad y previniendo spam.
 */
export function validateName(rawName) {
  const name = sanitizeInput(rawName);

  if (name.length < 2) {
    return 'Escribe tu nombre (mínimo 2 letras).';
  }

  if (name.length > 50) {
    return 'El nombre no debe superar los 50 caracteres.';
  }

  // Comprobar patrones de spam, URLs o estafas
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(name)) {
      return 'El nombre contiene caracteres o términos sospechosos no permitidos.';
    }
  }

  // Debe contener al menos caracteres alfabéticos válidos (soporta acentos y ñ)
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(name)) {
    return 'Por favor escribe un nombre real válido.';
  }

  return null;
}

/**
 * Valida minuciosamente el correo electrónico:
 * - Sintaxis RFC y límites de longitud
 * - Detección de puntos consecutivos sospechosos
 * - Validación de TLD (extensión del dominio)
 * - Bloqueo de correos desechables / burner emails
 * - Bloqueo de dominios de prueba o ficticios
 * - Detección de errores ortográficos comunes
 * - Bloqueo de nombres de usuario bot o dummy
 */
export function validateEmail(rawEmail) {
  const email = sanitizeInput(rawEmail).toLowerCase();

  if (!email) {
    return 'Escribe tu correo electrónico.';
  }

  if (email.length < 6) {
    return 'El correo es demasiado corto.';
  }

  if (email.length > 80) {
    return 'El correo no debe superar los 80 caracteres.';
  }

  // Prevenir inyección de cabeceras explícitas
  if (/[\r\n]|%0a|%0d|bcc:|cc:|to:/i.test(rawEmail)) {
    return 'El correo contiene caracteres no permitidos.';
  }

  // Prevenir puntos consecutivos (ej: usuario..nombre@...)
  if (email.includes('..')) {
    return 'El correo contiene puntos consecutivos no válidos.';
  }

  // Validación de sintaxis
  if (!EMAIL_REGEX.test(email)) {
    return 'Escribe un correo electrónico válido (ejemplo: nombre@dominio.com).';
  }

  const atIndex = email.lastIndexOf('@');
  const user = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // Validar partes del dominio y su TLD
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return 'El dominio del correo tiene una terminación inválida.';
  }

  // Bloqueo de correos desechables / temporales
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'No se aceptan correos temporales ni desechables. Por favor usa tu correo real.';
  }

  // Bloqueo de dominios falsos o de prueba
  if (FAKE_DOMAINS.has(domain)) {
    return 'Por favor ingresa un correo electrónico real de contacto.';
  }

  // Detección de errores tipográficos en dominios populares
  if (COMMON_TYPOS[domain]) {
    const suggested = `${user}@${COMMON_TYPOS[domain]}`;
    return `¿Quisiste escribir ${suggested}? Corrige el dominio antes de continuar.`;
  }

  // Bloqueo de nombres de usuario bot o genéricos de prueba
  if (DUMMY_USERNAMES.has(user)) {
    return 'Por favor ingresa tu correo personal o profesional real.';
  }

  return null;
}

/**
 * Control de frecuencia (Rate Limiting) y defensa anti-DDoS en el navegador.
 */
const STORAGE_KEY = 'tls_signup_meta_v1';
const COOLDOWN_SECONDS = 45; // Espera mínima entre envíos
const MAX_PER_HOUR = 3; // Máximo de envíos por hora

export function checkRateLimit() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { allowed: true };

    const data = JSON.parse(raw);
    const now = Date.now();

    // Comprobar cooldown entre solicitudes
    if (data.lastSubmission && now - data.lastSubmission < COOLDOWN_SECONDS * 1000) {
      const waitRemaining = Math.ceil(
        (COOLDOWN_SECONDS * 1000 - (now - data.lastSubmission)) / 1000,
      );
      return {
        allowed: false,
        reason: `Por favor espera ${waitRemaining} segundos antes de enviar otra solicitud.`,
      };
    }

    // Comprobar límite de envíos por hora
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentSubmissions = (data.timestamps || []).filter((t) => t > oneHourAgo);

    if (recentSubmissions.length >= MAX_PER_HOUR) {
      return {
        allowed: false,
        reason:
          'Has alcanzado el límite de solicitudes por ahora. Intenta de nuevo más tarde.',
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export function recordSuccessfulSubmission() {
  try {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { timestamps: [] };
    const oneHourAgo = now - 60 * 60 * 1000;
    const recent = (data.timestamps || []).filter((t) => t > oneHourAgo);
    recent.push(now);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lastSubmission: now,
        timestamps: recent,
      }),
    );
  } catch {
    // Modo privado o almacenamiento restringido: continuar de forma segura
  }
}
