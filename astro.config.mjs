import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://thedressedit.co.uk',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});
