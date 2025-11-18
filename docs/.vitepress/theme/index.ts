// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

// Import custom components
import SQLAssistant from './components/SQLAssistant.vue'
import SQLComparison from './components/SQLComparison.vue'
import CodePlayground from './components/CodePlayground.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Register custom global components
    app.component('SQLAssistant', SQLAssistant)
    app.component('SQLComparison', SQLComparison)
    app.component('CodePlayground', CodePlayground)
  }
} satisfies Theme
