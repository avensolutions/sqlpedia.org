import { defineConfig } from 'vitepress'

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

    // Navigation
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'By Database',
        items: [
          { text: 'PostgreSQL', link: '/databases/postgresql/' },
          { text: 'MySQL', link: '/databases/mysql/' },
          { text: 'SQL Server', link: '/databases/sqlserver/' },
          { text: 'Oracle', link: '/databases/oracle/' },
          { text: 'SQLite', link: '/databases/sqlite/' },
          { text: 'Spark SQL', link: '/databases/spark-sql/' },
          { text: 'Snowflake', link: '/databases/snowflake/' },
          { text: 'Databricks', link: '/databases/databricks/' },
          { text: 'BigQuery', link: '/databases/bigquery/' },
          { text: 'DuckDB', link: '/databases/duckdb/' },
        ]
      },
      {
        text: 'By Concept',
        items: [
          { text: 'Basics', link: '/concepts/basics/' },
          { text: 'Data Types', link: '/concepts/data-types/' },
          { text: 'Joins', link: '/concepts/joins/' },
          { text: 'Aggregations', link: '/concepts/aggregations/' },
          { text: 'PIVOT/UNPIVOT', link: '/concepts/pivot-unpivot/' },
          { text: 'Window Functions', link: '/concepts/window-functions/' },
          { text: 'CTEs', link: '/concepts/ctes/' },
          { text: 'Subqueries', link: '/concepts/subqueries/' },
          { text: 'Indexes', link: '/concepts/indexes/' },
          { text: 'Performance', link: '/concepts/performance/' },
          { text: 'Transactions', link: '/concepts/transactions/' },
          { text: 'Security', link: '/concepts/security/' },
          { text: 'SQL Standards', link: '/concepts/sql-standards/' },
          { text: 'NoSQL Databases', link: '/concepts/nosql-databases/' },
          { text: 'Graph Databases', link: '/concepts/graph-databases/' },
          { text: 'Vector Databases', link: '/concepts/vector-databases/' },
        ]
      },
      {
        text: 'Patterns',
        items: [
          { text: 'Analytics', link: '/patterns/analytics/' },
          { text: 'ETL', link: '/patterns/etl/' },
          { text: 'Reporting', link: '/patterns/reporting/' },
          { text: 'Migrations', link: '/patterns/migrations/' },
          { text: 'Optimization', link: '/patterns/optimization/' },
        ]
      },
      {
        text: 'Architectures',
        items: [
          { text: 'Inmon', link: '/architectures/inmon/' },
          { text: 'Kimball', link: '/architectures/kimball/' },
        ]
      },
      {
        text: 'Comparisons',
        link: '/comparisons/'
      },
      {
        text: 'StackQL',
        link: '/stackql/'
      },
    ],

    // Sidebar configuration - auto-generated from directory structure
    sidebar: {
      '/databases/': [
        {
          text: 'Databases',
          items: [
            { text: 'PostgreSQL', link: '/databases/postgresql/' },
            { text: 'MySQL', link: '/databases/mysql/' },
            { text: 'SQL Server', link: '/databases/sqlserver/' },
            { text: 'Oracle', link: '/databases/oracle/' },
            { text: 'SQLite', link: '/databases/sqlite/' },
            { text: 'Spark SQL', link: '/databases/spark-sql/' },
            { text: 'Snowflake', link: '/databases/snowflake/' },
            { text: 'Databricks', link: '/databases/databricks/' },
            { text: 'BigQuery', link: '/databases/bigquery/' },
            { text: 'DuckDB', link: '/databases/duckdb/' },
          ]
        }
      ],
      '/concepts/': [
        {
          text: 'SQL Concepts',
          items: [
            { text: 'Basics', link: '/concepts/basics/' },
            { text: 'Data Types', link: '/concepts/data-types/' },
            { text: 'Joins', link: '/concepts/joins/' },
            { text: 'Aggregations', link: '/concepts/aggregations/' },
            { text: 'PIVOT/UNPIVOT', link: '/concepts/pivot-unpivot/' },
            { text: 'Window Functions', link: '/concepts/window-functions/' },
            { text: 'CTEs', link: '/concepts/ctes/' },
            { text: 'Subqueries', link: '/concepts/subqueries/' },
            { text: 'Indexes', link: '/concepts/indexes/' },
            { text: 'Performance', link: '/concepts/performance/' },
            { text: 'Transactions', link: '/concepts/transactions/' },
            { text: 'Security', link: '/concepts/security/' },
            {
              text: 'SQL Standards',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/concepts/sql-standards/' },
                { text: 'SQL-92', link: '/concepts/sql-standards/sql-1992/' },
                { text: 'SQL-99', link: '/concepts/sql-standards/sql-1999/' },
                { text: 'SQL:2003', link: '/concepts/sql-standards/sql-2003/' },
                { text: 'SQL:2011', link: '/concepts/sql-standards/sql-2011/' },
                { text: 'SQL:2016', link: '/concepts/sql-standards/sql-2016/' },
              ]
            },
            { text: 'NoSQL Databases', link: '/concepts/nosql-databases/' },
            { text: 'Graph Databases', link: '/concepts/graph-databases/' },
            { text: 'Vector Databases', link: '/concepts/vector-databases/' },
          ]
        }
      ],
      '/patterns/': [
        {
          text: 'SQL Patterns',
          items: [
            { text: 'Analytics', link: '/patterns/analytics/' },
            { text: 'ETL', link: '/patterns/etl/' },
            { text: 'Reporting', link: '/patterns/reporting/' },
            { text: 'Migrations', link: '/patterns/migrations/' },
            { text: 'Optimization', link: '/patterns/optimization/' },
          ]
        }
      ],
      '/architectures/': [
        {
          text: 'Data Warehouse Architectures',
          items: [
            { text: 'Inmon', link: '/architectures/inmon/' },
            { text: 'Kimball', link: '/architectures/kimball/' },
          ]
        }
      ],
      '/comparisons/': [
        {
          text: 'Comparisons',
          items: [
            { text: 'Dialect Differences', link: '/comparisons/dialect-differences' },
            { text: 'Migration Guides', link: '/comparisons/migration-guides' },
            { text: 'Feature Matrix', link: '/comparisons/feature-matrix' },
          ]
        }
      ],
      '/stackql/': [
        {
          text: 'StackQL',
          items: [
            { text: 'Introduction', link: '/stackql/' },
            { text: 'Cloud APIs', link: '/stackql/cloud-apis' },
            { text: 'Infrastructure', link: '/stackql/infrastructure' },
            { text: 'Examples', link: '/stackql/examples' },
          ]
        }
      ]
    },

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
