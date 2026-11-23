/**
 * Visor de viñetas de cómic.
 *
 * Los paneles, los puntos y el texto que anuncia el estado se generan en
 * tiempo de build; este módulo sólo alterna qué viñeta está visible.
 */
import { combineDisposers, on, queryAll, queryRequired } from '../core/dom.js';

const ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = 'ArrowRight';

export function mountComicViewer(root) {
  const slides = queryAll('[data-comic-slide]', root);

  if (slides.length === 0) {
    return null;
  }

  const dots = queryAll('[data-comic-dot]', root);
  const previousButton = queryRequired('[data-comic-prev]', root);
  const nextButton = queryRequired('[data-comic-next]', root);
  const status = queryRequired('[data-comic-status]', root);

  let activeIndex = Math.max(
    0,
    slides.findIndex((slide) => !slide.hidden),
  );

  function render(index) {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== activeIndex;
    });

    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-current', String(dotIndex === activeIndex));
    });

    const title = slides[activeIndex].dataset.title ?? '';

    status.textContent = `Viñeta ${activeIndex + 1} de ${slides.length}: ${title}`;
  }

  function show(index) {
    render(index);
  }

  function handleKeydown(event) {
    if (event.key === ARROW_LEFT) {
      event.preventDefault();
      show(activeIndex - 1);
    }

    if (event.key === ARROW_RIGHT) {
      event.preventDefault();
      show(activeIndex + 1);
    }
  }

  const dispose = combineDisposers([
    on(previousButton, 'click', () => show(activeIndex - 1)),
    on(nextButton, 'click', () => show(activeIndex + 1)),
    on(root, 'keydown', handleKeydown),
    ...dots.map((dot, index) => on(dot, 'click', () => show(index))),
  ]);

  render(activeIndex);

  return { show, destroy: dispose };
}
