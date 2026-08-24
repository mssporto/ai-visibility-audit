// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/consts.ts';
import { isNoindexRoute } from './src/utils/seo.ts';

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	integrations: [
		sitemap({
			// Keep the sitemap in sync with NOINDEX_ROUTES/isNoindexRoute, the
			// same list BaseHead uses for the meta-tag form of noindex.
			filter: (page) => !isNoindexRoute(new URL(page).pathname),
		}),
	],
	security: {
		// Astro emits a <meta http-equiv="content-security-policy"> with hashes
		// for every script/style it bundles. GTM injects gtm.js itself, so it
		// needs an explicit allow-list entry alongside those auto-generated
		// hashes for our own bundled scripts.
		csp: {
			scriptDirective: {
				resources: ["'self'", "https://www.googletagmanager.com"],
			},
			directives: [
				"default-src 'self'",
				"img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
				"font-src 'self'",
				"connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
				"frame-src https://www.googletagmanager.com",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'none'",
			],
		},
	},
});
