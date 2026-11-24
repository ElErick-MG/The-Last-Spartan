import { combineDisposers, on, queryRequired } from '../core/dom.js';
import { trapFocus } from '../core/a11y.js';

/**
 * Modal de avance / tráiler de The Last Spartan.
 * Gestiona apertura/cierre, control del reproductor de video HTML5,
 * trampa de foco accesible y revelación del enlace del juego tras finalizar el video.
 *
 * @param {object} options
 * @param {Element | null} options.modal
 * @param {Element[]} [options.openers]
 */
export function mountTrailerModal({ modal, openers = [] }) {
  if (!modal || openers.length === 0) {
    return null;
  }

  const dialog = queryRequired('[data-modal-dialog]', modal);
  const closeButton = queryRequired('[data-modal-close]', modal);
  const video = modal.querySelector('[data-modal-video]');
  const endscreen = modal.querySelector('[data-modal-endscreen]');
  const replayBtn = modal.querySelector('[data-modal-replay]');
  const ctaBar = modal.querySelector('[data-modal-cta]');

  let lastFocusedElement = null;
  let releaseFocusTrap = null;

  const isOpen = () => !modal.hidden;

  function showEndscreen() {
    if (endscreen) {
      endscreen.hidden = false;
      endscreen.classList.add('is-active');
    }
    if (ctaBar) {
      ctaBar.classList.add('is-highlighted');
    }
  }

  function hideEndscreen() {
    if (endscreen) {
      endscreen.hidden = true;
      endscreen.classList.remove('is-active');
    }
  }

  function handleVideoEnded() {
    showEndscreen();
  }

  function handleReplay() {
    hideEndscreen();
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }

  function open() {
    if (isOpen()) {
      return;
    }

    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('has-modal');
    releaseFocusTrap = trapFocus(dialog);
    closeButton.focus();

    hideEndscreen();
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        // En navegadores con políticas estrictas de autoplay el usuario usará los controles
      });
    }
  }

  function close() {
    if (!isOpen()) {
      return;
    }

    if (video) {
      video.pause();
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

  const disposers = [
    on(modal, 'keydown', handleKeydown),
    on(modal, 'click', handleBackdropClick),
    on(closeButton, 'click', close),
    ...openers.map((opener) => on(opener, 'click', open)),
  ];

  if (video) {
    disposers.push(on(video, 'ended', handleVideoEnded));
  }

  if (replayBtn) {
    disposers.push(on(replayBtn, 'click', handleReplay));
  }

  const dispose = combineDisposers(disposers);

  return { open, close, destroy: dispose };
}
