/**
 * Aparición progresiva de bloques al hacer scroll.
 * Si el navegador no soporta IntersectionObserver, muestra todo.
 */
const VISIBLE_CLASS = 'is-visible';
const OBSERVER_THRESHOLD = 0.15;

export function mountScrollReveal(elements) {
  if (elements.length === 0) {
    return null;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add(VISIBLE_CLASS));
    return { destroy() {} };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add(VISIBLE_CLASS);
        observer.unobserve(entry.target);
      });
    },
    { threshold: OBSERVER_THRESHOLD },
  );

  elements.forEach((element) => observer.observe(element));

  return { destroy: () => observer.disconnect() };
}
