/**
 * Aísla el fallo de un componente: si un bloque cambia de marcado,
 * el resto de la página sigue funcionando.
 */
export function mountSafely(name, init) {
  try {
    return init();
  } catch (error) {
    console.error(`[${name}] No se pudo inicializar el componente:`, error);
    return null;
  }
}
