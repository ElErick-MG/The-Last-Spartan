/**
 * Modal de tráiler/demo.
 * Responsabilidades: apertura/cierre, foco (trampa + restauración),
 * cierre con Escape o clic en el fondo, y bloqueo del scroll de fondo.
 */
import { combineDisposers, on, queryRequired } from '../core/dom.js';
import { trapFocus } from '../core/a11y.js';

export function mountTrailerModal({ modal, openers = [] }) {
  if (!modal || openers.length === 0) {
    return null;
  }

  const dialog = queryRequired('[data-modal-dialog]', modal);
  const closeButton = queryRequired('[data-modal-close]', modal);

  let lastFocusedElement = null;
  let releaseFocusTrap = null;

  const isOpen = () => !modal.hidden;

  function open() {
    if (isOpen()) {
      return;
    }

    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('has-modal');
    releaseFocusTrap = trapFocus(dialog);
    closeButton.focus();
  }

  function close() {
    if (!isOpen()) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove('has-modal');
    releaseFocusTrap?.();
    releaseFocusTrap = null;

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === modal) {
      close();
    }
  }

  const dispose = combineDisposers([
    on(modal, 'keydown', handleKeydown),
    on(modal, 'click', handleBackdropClick),
    on(closeButton, 'click', close),
    ...openers.map((opener) => on(opener, 'click', open)),
  ]);

  return { open, close, destroy: dispose };
}
