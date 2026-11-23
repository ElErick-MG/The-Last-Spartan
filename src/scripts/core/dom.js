/**
 * Utilidades mínimas de DOM compartidas por las features.
 * Ninguna conoce lógica de negocio: sólo lectura de nodos y eventos.
 */

export function query(selector, scope = document) {
  return scope.querySelector(selector);
}

export function queryAll(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Igual que `query`, pero falla de forma explícita cuando el marcado
 * obligatorio no existe: es un error de integración, no un caso de uso.
 */
export function queryRequired(selector, scope = document) {
  const node = query(selector, scope);

  if (!node) {
    throw new Error(`[dom] Elemento requerido no encontrado: ${selector}`);
  }

  return node;
}

/**
 * Suscripción a eventos que devuelve su propia función de limpieza.
 */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);

  return () => target.removeEventListener(type, handler, options);
}

/**
 * Envuelve un grupo de limpiadores en una única función `destroy`.
 */
export function combineDisposers(disposers) {
  return () => disposers.forEach((dispose) => dispose());
}
