import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'
import matter from 'gray-matter'

interface PageData {
  path: string
  title: string
  tags: string[]
  link: string
}

interface NavItem {
  text: string
  link?: string
  items?: NavItem[]
}

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

/**
 * Recursively scan directory for markdown files
 */
function scanMarkdownFiles(dir: string, baseDir: string): PageData[] {
  const pages: PageData[] = []

  try {
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip hidden directories and vitepress dirs
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }
        pages.push(...scanMarkdownFiles(fullPath, baseDir))
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const content = readFileSync(fullPath, 'utf-8')
          const { data } = matter(content)

          // Only process files with tags
          if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
            // Generate clean link from file path
            const relativePath = relative(baseDir, fullPath)
            let link = '/' + relativePath.replace(/\\/g, '/')

            // Convert index.md to directory link
            if (link.endsWith('/index.md')) {
              link = link.replace('/index.md', '/')
            } else if (link.endsWith('.md')) {
              link = link.replace('.md', '')
            }

            pages.push({
              path: fullPath,
              title: data.title || entry.name.replace('.md', ''),
              tags: data.tags,
              link: link
            })
          }
        } catch (error) {
          console.warn(`Warning: Could not parse ${fullPath}:`, error)
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error)
  }

  return pages
}

/**
 * Normalize tag to display format
 */
function formatTagDisplay(tag: string): string {
  // Convert kebab-case or snake_case to Title Case
  return tag
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Build navigation structure from page tags
 * First tag = top level, second tag = nested category
 * Only known category tags are used as top-level items
 * Tags are processed in pairs, but only if the first of the pair is a known category
 */
export function buildTagDrivenNavigation(docsDir: string) {
  const pages = scanMarkdownFiles(docsDir, docsDir)

  // Known top-level categories
  const knownCategories = new Set([
    'databases',
    'concepts',
    'patterns',
    'architectures',
    'comparisons',
    'stackql'
  ])

  // Map to store navigation items by category
  const navMap = new Map<string, Map<string, PageData[]>>()

  // Group pages by tag pairs (first tag = top level, second tag = nested)
  for (const page of pages) {
    if (page.tags.length === 0) continue

    // Process tags in pairs, but only if the first tag is a known category
    for (let i = 0; i < page.tags.length - 1; i += 2) {
      const topLevelTag = page.tags[i]
      const nestedTag = page.tags[i + 1]

      // Only process if this is a known top-level category
      if (!knownCategories.has(topLevelTag)) {
        continue
      }

      if (!navMap.has(topLevelTag)) {
        navMap.set(topLevelTag, new Map())
      }

      const categoryMap = navMap.get(topLevelTag)!
      if (!categoryMap.has(nestedTag)) {
        categoryMap.set(nestedTag, [])
      }

      // Only add if not already present (avoid duplicates)
      const existingPages = categoryMap.get(nestedTag)!
      if (!existingPages.some(p => p.link === page.link)) {
        categoryMap.get(nestedTag)!.push(page)
      }
    }
  }

  // Build nav array
  const nav: NavItem[] = [
    { text: 'Home', link: '/' }
  ]

  // Sort top-level categories
  const sortedCategories = Array.from(navMap.keys()).sort()

  for (const category of sortedCategories) {
    const categoryMap = navMap.get(category)!
    const nestedItems: NavItem[] = []

    // Sort nested categories
    const sortedNested = Array.from(categoryMap.keys()).sort()

    for (const nestedCategory of sortedNested) {
      const pagesInCategory = categoryMap.get(nestedCategory)!

      // Sort pages by title
      pagesInCategory.sort((a, b) => a.title.localeCompare(b.title))

      // If there's only one page in this nested category, link directly to it
      if (pagesInCategory.length === 1) {
        nestedItems.push({
          text: pagesInCategory[0].title,
          link: pagesInCategory[0].link
        })
      } else {
        // Multiple pages - create a submenu
        nestedItems.push({
          text: formatTagDisplay(nestedCategory),
          items: pagesInCategory.map(p => ({
            text: p.title,
            link: p.link
          }))
        })
      }
    }

    // Add to main nav
    nav.push({
      text: formatTagDisplay(category),
      items: nestedItems
    })
  }

  return nav
}

/**
 * Build sidebar configuration from tags
 * Only known category tags are used as top-level items
 */
export function buildTagDrivenSidebar(docsDir: string) {
  const pages = scanMarkdownFiles(docsDir, docsDir)

  // Known top-level categories
  const knownCategories = new Set([
    'databases',
    'concepts',
    'patterns',
    'architectures',
    'comparisons',
    'stackql'
  ])

  // Map to store sidebar items by path prefix
  const sidebarMap = new Map<string, Map<string, PageData[]>>()

  // Group pages for sidebar (by tag pairs)
  for (const page of pages) {
    if (page.tags.length === 0) continue

    // Process tags in pairs, but only if the first tag is a known category
    for (let i = 0; i < page.tags.length - 1; i += 2) {
      const topLevelTag = page.tags[i]
      const nestedTag = page.tags[i + 1]

      // Only process if this is a known top-level category
      if (!knownCategories.has(topLevelTag)) {
        continue
      }

      // Create sidebar key from top-level tag
      const sidebarKey = `/${topLevelTag}/`

      if (!sidebarMap.has(sidebarKey)) {
        sidebarMap.set(sidebarKey, new Map())
      }

      const categoryMap = sidebarMap.get(sidebarKey)!
      if (!categoryMap.has(nestedTag)) {
        categoryMap.set(nestedTag, [])
      }

      // Only add if not already present (avoid duplicates)
      const existingPages = categoryMap.get(nestedTag)!
      if (!existingPages.some(p => p.link === page.link)) {
        categoryMap.get(nestedTag)!.push(page)
      }
    }
  }

  // Build sidebar object
  const sidebar: Record<string, SidebarItem[]> = {}

  for (const [sidebarKey, categoryMap] of sidebarMap.entries()) {
    const items: SidebarItem[] = []

    // Sort nested categories
    const sortedNested = Array.from(categoryMap.keys()).sort()

    for (const nestedCategory of sortedNested) {
      const pagesInCategory = categoryMap.get(nestedCategory)!

      // Sort pages by title
      pagesInCategory.sort((a, b) => a.title.localeCompare(b.title))

      items.push({
        text: formatTagDisplay(nestedCategory),
        collapsed: false,
        items: pagesInCategory.map(p => ({
          text: p.title,
          link: p.link
        }))
      })
    }

    sidebar[sidebarKey] = [{
      text: formatTagDisplay(sidebarKey.replace(/\//g, '')),
      items: items
    }]
  }

  return sidebar
}
