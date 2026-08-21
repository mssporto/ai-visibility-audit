// @ts-check
import { defineConfig } from 'astro/config';
import { SITE_URL } from './src/consts.ts';

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
});
