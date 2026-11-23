/**
 * Preferencias de movimiento del usuario.
 */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Notifica cambios en la preferencia de movimiento.
 * Devuelve la función para dejar de escuchar.
 */
export function onReducedMotionChange(callback) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  const handler = (event) => callback(event.matches);

  mediaQuery.addEventListener('change', handler);

  return () => mediaQuery.removeEventListener('change', handler);
}
