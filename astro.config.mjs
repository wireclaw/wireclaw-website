// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://wireclaw.ai',
  integrations: [
    starlight({
      title: 'Wireclaw Docs',
      components: {
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
      },
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/wireclaw' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/wireclaw' },
        { icon: 'x.com', label: 'Twitter', href: 'https://x.com/wireclaw' },
      ],
      customCss: ['./src/styles/starlight-custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Quick Start', slug: 'docs/getting-started/quickstart' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Connect Telegram', slug: 'docs/guides/connect-telegram' },
            { label: 'Connect Discord', slug: 'docs/guides/connect-discord' },
            { label: 'Connect Slack', slug: 'docs/guides/connect-slack' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Agent Config (TOML)', slug: 'docs/reference/agent-config' },
            { label: 'Built-in Tools', slug: 'docs/reference/built-in-tools' },
            { label: 'Supported Models', slug: 'docs/reference/supported-models' },
            { label: 'Billing & Cost Limits', slug: 'docs/reference/billing' },
          ],
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/wireclaw/wireclaw-marketing/edit/main/wireclaw-website/',
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
