// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://northmeckinsights.org',
  base: '/',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
