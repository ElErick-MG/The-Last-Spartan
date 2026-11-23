/**
 * Utilidades de accesibilidad reutilizables por cualquier componente modal.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isFocusable(element) {
  return !element.hasAttribute('hidden') && element.offsetParent !== null;
}

export function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isFocusable);
}

/**
 * Mantiene el foco dentro de `container` mientras el diálogo está abierto.
 * Devuelve la función de limpieza.
 */
export function trapFocus(container) {
  function handleKeydown(event) {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(container);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handleKeydown);

  return () => container.removeEventListener('keydown', handleKeydown);
}
