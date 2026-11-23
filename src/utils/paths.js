/**
 * Resuelve rutas de recursos estáticos respetando la configuración `base` de Astro.
 * Necesario para despliegues en GitHub Pages u otros subdirectorios.
 *
 * @param {string} path Ruta relativa o absoluta al recurso (ej: '/images/hero.webp')
 * @returns {string} Ruta con el prefijo base aplicado
 */
export function withBase(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.replace(/^\//, '');

  return `${cleanBase}${cleanPath}`;
}
