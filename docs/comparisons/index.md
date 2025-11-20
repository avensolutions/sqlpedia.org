---
title: SQL Dialect Comparisons
description: Compare SQL syntax and features across different database systems
---

# SQL Dialect Comparisons

SQL is standardized, but each database system implements its own extensions and variations. This section helps you understand the differences and migrate between database systems.

## Quick Navigation

### [Dialect Differences](/comparisons/dialect-differences)

Side-by-side comparison of SQL syntax across popular databases for common operations.

### [Migration Guides](/comparisons/migration-guides)

Step-by-step guides for migrating from one database to another.

### [Feature Matrix](/comparisons/feature-matrix)

Comprehensive feature comparison across database systems including data types, SQL compliance, transactions, performance features, and cloud capabilities.

### [DML & DDL Differences](/comparisons/dml-ddl-differences)

Detailed comparison of Data Manipulation Language (DML) and Data Definition Language (DDL) syntax across major SQL databases.

## Interactive Comparison

<SQLComparison :dialects="['postgresql', 'mysql', 'sqlserver']" />

## Common Differences by Topic

### String Concatenation

| Database   | Syntax              | Example                         |
| ---------- | ------------------- | ------------------------------- |
| PostgreSQL | `\|\|` operator     | `'Hello' \|\| ' ' \|\| 'World'` |
| MySQL      | `CONCAT()` function | `CONCAT('Hello', ' ', 'World')` |
| SQL Server | `+` operator        | `'Hello' + ' ' + 'World'`       |
| Oracle     | `\|\|` operator     | `'Hello' \|\| ' ' \|\| 'World'` |
| SQLite     | `\|\|` operator     | `'Hello' \|\| ' ' \|\| 'World'` |

### Auto-Increment

| Database   | Syntax                 |
| ---------- | ---------------------- |
| PostgreSQL | `SERIAL` or `IDENTITY` |
| MySQL      | `AUTO_INCREMENT`       |
| SQL Server | `IDENTITY(1,1)`        |
| Oracle     | `SEQUENCE` and trigger |
| SQLite     | `AUTOINCREMENT`        |

### LIMIT / TOP

| Database   | Syntax                                            |
| ---------- | ------------------------------------------------- |
| PostgreSQL | `LIMIT n OFFSET m`                                |
| MySQL      | `LIMIT n OFFSET m`                                |
| SQL Server | `TOP n` or `OFFSET m ROWS FETCH NEXT n ROWS ONLY` |
| Oracle     | `FETCH FIRST n ROWS ONLY` or `ROWNUM <= n`        |
| SQLite     | `LIMIT n OFFSET m`                                |

### Date Functions

| Operation         | PostgreSQL                | MySQL                            | SQL Server                    |
| ----------------- | ------------------------- | -------------------------------- | ----------------------------- |
| Current Date      | `CURRENT_DATE`            | `CURDATE()`                      | `GETDATE()`                   |
| Current Timestamp | `NOW()`                   | `NOW()`                          | `GETDATE()`                   |
| Date Add          | `date + INTERVAL '1 day'` | `DATE_ADD(date, INTERVAL 1 DAY)` | `DATEADD(day, 1, date)`       |
| Date Diff         | `date1 - date2`           | `DATEDIFF(date1, date2)`         | `DATEDIFF(day, date1, date2)` |
| Extract Year      | `EXTRACT(YEAR FROM date)` | `YEAR(date)`                     | `YEAR(date)`                  |

### String Functions

| Operation  | PostgreSQL                          | MySQL                           | SQL Server                      |
| ---------- | ----------------------------------- | ------------------------------- | ------------------------------- |
| Length     | `LENGTH(str)` or `CHAR_LENGTH(str)` | `LENGTH(str)`                   | `LEN(str)`                      |
| Substring  | `SUBSTRING(str, start, length)`     | `SUBSTRING(str, start, length)` | `SUBSTRING(str, start, length)` |
| Upper Case | `UPPER(str)`                        | `UPPER(str)`                    | `UPPER(str)`                    |
| Lower Case | `LOWER(str)`                        | `LOWER(str)`                    | `LOWER(str)`                    |
| Trim       | `TRIM(str)`                         | `TRIM(str)`                     | `TRIM(str)`                     |

## Popular Migration Paths

### MySQL → PostgreSQL

PostgreSQL offers more advanced features and better standards compliance. Common reasons to migrate:

- Better support for complex queries
- Advanced data types (arrays, JSON, etc.)
- Stronger ACID guarantees
- More flexible licensing

[View Migration Guide →](/comparisons/migration-guides#mysql-to-postgresql)

### Oracle → PostgreSQL

Cost reduction is often a primary driver:

- Open source and free
- Similar feature set for most use cases
- Strong community support
- Active development

[View Migration Guide →](/comparisons/migration-guides#oracle-to-postgresql)

### SQL Server → PostgreSQL

Common in cloud migrations:

- Lower licensing costs
- Better Linux support
- Cross-platform compatibility
- Modern features

[View Migration Guide →](/comparisons/migration-guides#sql-server-to-postgresql)

## Tools for Comparison

### AI-Powered Translation

Use our AI assistant to translate queries between dialects:

<SQLAssistant mode="translate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/)
- [MySQL](/databases/mysql/)
- [SQL Server](/databases/sqlserver/)
- [Oracle](/databases/oracle/)
