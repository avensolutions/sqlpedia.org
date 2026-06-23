// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

// Import custom components
import SQLAssistant from './components/SQLAssistant.vue'
import SQLComparison from './components/SQLComparison.vue'
import CodePlayground from './components/CodePlayground.vue'
import AiAssistantButton from './components/AiAssistantButton.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      // Render the AI assistant CTA at the right of the navbar.
      'nav-bar-content-after': () => h(AiAssistantButton)
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Register custom global components
    app.component('SQLAssistant', SQLAssistant)
    app.component('SQLComparison', SQLComparison)
    app.component('CodePlayground', CodePlayground)
  }
} satisfies Theme
