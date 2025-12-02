// registry-frontend/svelte.config.js
import adapter from '@sveltejs/adapter-node'; // adapter-node, instead of adapter-auto
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-node creates a standalone Node server in build/
		adapter: adapter()
	}
};

export default config;
