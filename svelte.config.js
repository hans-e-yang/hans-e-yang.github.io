import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

import remarkHeadingId from 'remark-heading-id';
import remarkToc from 'remark-toc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      remarkPlugins: [
        [remarkHeadingId, {defaults: true}],
        [remarkToc, {ordered: true}]
      ],
      rehypePlugins: [
        [rehypeAutolinkHeadings, {
          properties: {
            'aria-hidden': undefined
          }
        }]
      ]
      // layout: {
      //   blog: "./src/routes/blogs/layout.svelte"
      // }
    }),
  ],
  extensions: ['.svelte', '.md'],

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
      strict: false
    }),
    alias: {
      '$components': "src/lib/components"
    },
    prerender: {
      handleMissingId: 'warn'
    }
	}
};

export default config;
