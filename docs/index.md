---
layout: home

hero:
  name: "SQLpedia"
  text: "The SQL Knowledge Resource"
  tagline: "A comprehensive, Wikipedia-style SQL knowledge resource for developers, data engineers, and database administrators"
  image:
    src: /logo.svg
    alt: SQLpedia
  actions:
    - theme: brand
      text: Get Started
      link: /concepts/basics/
    - theme: alt
      text: View on GitHub
      link: https://github.com/stackql/sqlpedia.org

features:
  - icon: 📖
    title: Learn SQL Fundamentals
    details: Start with the basics and build a strong foundation in SQL.
    link: /concepts/basics/
    linkText: Explore Concepts

  - icon: 🗄️
    title: Browse by Database
    details: Find database-specific documentation and examples.
    link: /databases/postgresql/
    linkText: View Databases

  - icon: 🎯
    title: Common Patterns
    details: Discover proven SQL patterns for real-world scenarios.
    link: /patterns/analytics/
    linkText: See Patterns

  - icon: 🔄
    title: Compare Dialects
    details: Compare SQL syntax across different database systems.
    link: /comparisons/
    linkText: View Comparisons
---

## Try the AI Assistant

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## Popular Topics

### Window Functions

Window functions are powerful tools for analytics and reporting. Learn how to use them across different SQL dialects.

[Learn More →](/concepts/window-functions/)

### Common Table Expressions (CTEs)

CTEs make complex queries more readable and maintainable. Discover best practices and patterns.

[Learn More →](/concepts/ctes/)

### Query Optimization

Learn techniques to improve query performance across different database systems.

[Learn More →](/concepts/performance/)

### Database Migrations

Planning to migrate from one database to another? Check our comprehensive migration guides.

[Learn More →](/comparisons/migration-guides)

## About SQLpedia

SQLpedia is an open-source, community-driven SQL knowledge resource inspired by Wikipedia. It provides comprehensive documentation, examples, and comparisons for multiple SQL dialects, along with AI-powered tools to help you generate, understand, and optimize SQL queries.

### Why SQLpedia?

- **Comprehensive**: Coverage of all major SQL databases and concepts
- **Practical**: Real-world examples and patterns from 35+ years of experience
- **Cross-Platform**: Easy comparison of SQL dialects side-by-side
- **AI-Enhanced**: Built-in AI assistance for query generation and optimization
- **Open Source**: Community contributions welcome via GitHub

### Contributing

SQLpedia is open source and welcomes contributions! You can:

- Edit any page directly on GitHub
- Submit new content via pull requests
- Report issues or suggest improvements
- Share your SQL knowledge with the community

[View Contributing Guidelines →](https://github.com/stackql/sqlpedia.org/blob/main/CONTRIBUTING.md)

## Featured Databases

<div class="database-grid">

- **[PostgreSQL](/databases/postgresql/)** - The world's most advanced open source database
- **[MySQL](/databases/mysql/)** - The world's most popular open source database
- **[SQL Server](/databases/sqlserver/)** - Microsoft's enterprise database platform
- **[Oracle](/databases/oracle/)** - Industry-leading enterprise database
- **[SQLite](/databases/sqlite/)** - Self-contained, serverless database engine
- **[BigQuery](/databases/bigquery/)** - Google's serverless data warehouse
- **[Snowflake](/databases/snowflake/)** - Cloud data platform
- **[DuckDB](/databases/duckdb/)** - In-process analytical database
- **[ClickHouse](/databases/clickhouse/)** - Column-oriented database for real-time analytics

</div>

<style scoped>
.database-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.database-grid li {
  list-style: none;
  background-color: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}
</style>
