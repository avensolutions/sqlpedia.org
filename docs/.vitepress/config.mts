import { defineConfig } from 'vitepress'
import { buildTagDrivenNavigation, buildTagDrivenSidebar } from './buildNavigation'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsDir = join(__dirname, '..')

// Build navigation from tags
const nav = buildTagDrivenNavigation(docsDir)
const sidebar = buildTagDrivenSidebar(docsDir)

// Note: the "AI SQL Assistant" entry is rendered as a button in the navbar via
// a theme Layout slot (see theme/index.ts + theme/components/AiAssistantButton.vue),
// not as a regular nav menu item, so it can sit at the right next to the toggle.

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "SQLpedia",
  description: "A comprehensive, Wikipedia-style SQL knowledge resource",
  lang: 'en-US',

  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#3c8772' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    ['meta', { name: 'msapplication-TileColor', content: '#3c8772' }],
    ['meta', { name: 'msapplication-config', content: '/browserconfig.xml' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'SQLpedia | The SQL Knowledge Resource' }],
    ['meta', { property: 'og:site_name', content: 'SQLpedia' }],
    ['meta', { property: 'og:url', content: 'https://sqlpedia.org/' }],
  ],

  // Theme configuration
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'SQLpedia',

    // Navigation - dynamically built from post tags
    nav,

    // Sidebar configuration - dynamically built from post tags
    sidebar,

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/stackql/sqlpedia.org' }
    ],

    // Search
    search: {
      provider: 'local',
      options: {
        detailedView: true
      }
    },

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present SQLpedia Contributors'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/avensolutions/sqlpedia.org/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Last updated
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    }
  },

  // Markdown configuration
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true,
    // Map languages Shiki does not bundle to a close-enough grammar so code
    // fences highlight instead of falling back to plain text with a warning.
    // AQL = ArangoDB Query Language (not in Shiki); SQL keywords overlap enough.
    languageAlias: {
      aql: 'sql'
    },
    config: (md) => {
      // Custom markdown-it plugins can be added here
    }
  },

  // Build configuration
  srcDir: '.',
  outDir: './.vitepress/dist',
  cacheDir: './.vitepress/cache',

  // SEO
  sitemap: {
    hostname: 'https://sqlpedia.org',
    // STEALTH MODE: keep StackQL pages out of the sitemap for now.
    // Re-enable by removing this transformItems filter.
    transformItems: (items) =>
      items.filter((item) => !item.url.includes('stackql'))
  },

  // Performance
  cleanUrls: true,

  // This is a community-edited wiki where pages are often cross-linked before
  // they are written. Don't fail the build on links to not-yet-created pages.
  ignoreDeadLinks: true,

  // Vue configuration
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.includes('-')
      }
    }
  }
})
