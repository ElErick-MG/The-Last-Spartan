// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Astro 7 usa reglas JSX por defecto y elimina espacios entre elementos
  // inline; `true` conserva la compresión basada en HTML.
  compressHTML: true,
});
