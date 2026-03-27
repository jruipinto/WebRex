import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WebRex documentation',
  description: 'WebRex documentation',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  srcDir: '../', // Ensure root is correct
  rewrites: {
    'README.md': 'index.md'
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    outline: {
      level: [2, 3], // Shows H2 and H3
      label: 'On this page'
    },

    socialLinks: [
      // { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],
  },
});
