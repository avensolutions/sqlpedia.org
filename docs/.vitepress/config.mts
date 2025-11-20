import { defineConfig } from 'vitepress'
import { buildTagDrivenNavigation, buildTagDrivenSidebar } from './buildNavigation'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsDir = join(__dirname, '..')

// Build navigation from tags
const nav = buildTagDrivenNavigation(docsDir)
const sidebar = buildTagDrivenSidebar(docsDir)

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "SQLpedia",
  description: "A comprehensive, Wikipedia-style SQL knowledge resource",
  lang: 'en-US',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
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
      pattern: 'https://github.com/stackql/sqlpedia.org/edit/main/docs/:path',
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
    hostname: 'https://sqlpedia.org'
  },

  // Performance
  cleanUrls: true,

  // Vue configuration
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.includes('-')
      }
    }
  }
})
