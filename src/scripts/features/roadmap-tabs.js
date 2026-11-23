/**
 * Pestañas del roadmap (patrón ARIA tablist con navegación por teclado).
 *
 * Las pestañas y sus paneles se generan en tiempo de build; este módulo
 * sólo gestiona la selección, el foco y la visibilidad.
 */
import { combineDisposers, on, queryAll } from '../core/dom.js';

const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp'];

export function mountRoadmapTabs(tablist, panelsRoot) {
  const tabs = queryAll('[role="tab"]', tablist);
  const panels = queryAll('[role="tabpanel"]', panelsRoot);

  if (tabs.length === 0 || panels.length === 0) {
    return null;
  }

  function activate(index, { moveFocus = false } = {}) {
    if (!tabs[index]) {
      return;
    }

    tabs.forEach((tab, tabIndex) => {
      const isSelected = tabIndex === index;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });

    panels.forEach((panel, panelIndex) => {
      panel.hidden = panelIndex !== index;
    });

    if (moveFocus) {
      tabs[index].focus();
    }
  }

  function handleKeydown(event) {
    const currentIndex = tabs.indexOf(document.activeElement);

    if (currentIndex === -1) {
      return;
    }

    if (NEXT_KEYS.includes(event.key)) {
      event.preventDefault();
      activate((currentIndex + 1) % tabs.length, { moveFocus: true });
      return;
    }

    if (PREVIOUS_KEYS.includes(event.key)) {
      event.preventDefault();
      activate((currentIndex - 1 + tabs.length) % tabs.length, { moveFocus: true });
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      activate(0, { moveFocus: true });
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      activate(tabs.length - 1, { moveFocus: true });
    }
  }

  const dispose = combineDisposers([
    on(tablist, 'keydown', handleKeydown),
    ...tabs.map((tab, index) => on(tab, 'click', () => activate(index))),
  ]);

  activate(0);

  return { activate, destroy: dispose };
}
