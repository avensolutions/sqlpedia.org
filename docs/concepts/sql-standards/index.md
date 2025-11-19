---
title: SQL Standards
description: Comprehensive guide to SQL standards from SQL-92 through SQL-2016, covering features, syntax evolution, and database implementation
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, Snowflake, BigQuery, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [sql-standards, ansi, iso, sql-92, sql-99, sql-2003, sql-2011, sql-2016, standardization, compliance]
---

# SQL Standards

<div class="difficulty-badge intermediate">Intermediate</div>

## Overview

SQL (Structured Query Language) is standardized by both ANSI (American National Standards Institute) and ISO (International Organization for Standardization). The SQL standard has evolved significantly since its inception, with major revisions introducing new features, improving syntax consistency, and expanding the language's capabilities.

This guide covers the major SQL standards that have shaped modern database systems:

- **[SQL-92](#sql-92-sql1992)** (SQL:1992) - First major widely-adopted standard
- **[SQL-99](#sql-99-sql1999)** (SQL:1999) - Added recursion, triggers, and object-relational features
- **[SQL-2003](#sql-2003)** (SQL:2003) - Introduced window functions and XML support
- **[SQL-2011](#sql-2011)** (SQL:2011) - Added temporal databases and enhanced OLAP features
- **[SQL-2016](#sql-2016)** (SQL:2016) - Brought JSON support and pattern matching

## Why SQL Standards Matter

### Portability
Standards enable code portability across different database management systems. SQL written according to standard syntax is more likely to work across multiple platforms with minimal modifications.

### Vendor Independence
Understanding SQL standards helps you write database-agnostic code and reduces vendor lock-in. Applications can migrate between database systems more easily when adhering to standard SQL.

### Feature Discovery
Each standard introduces new capabilities. Knowing which standard introduced a feature helps you understand:
- When a feature became available
- Which databases are likely to support it
- Alternative approaches for older systems

### Compliance Levels
Most databases implement standards partially. Understanding standards helps you:
- Evaluate database capabilities
- Plan migrations
- Make informed technology choices

## Standard Evolution Timeline

```
1986: SQL-86 (First ANSI standard)
1989: SQL-89 (Minor revision)
1992: SQL-92 (Entry, Intermediate, Full)
1999: SQL-99 (Core SQL:1999)
2003: SQL:2003 (Core + Optional features)
2006: SQL:2006 (XML updates)
2008: SQL:2008 (Enhancements)
2011: SQL:2011 (Temporal data)
2016: SQL:2016 (JSON, Pattern matching)
2019: SQL:2019 (Arrays, multi-dimensional)
2023: SQL:2023 (Property graphs, JSON enhancements)
```

## Conformance Levels

SQL standards define conformance levels to accommodate incremental adoption:

### SQL-92 Levels
- **Entry SQL** - Minimal features, closest to SQL-89
- **Intermediate SQL** - Moderate feature set
- **Full SQL** - Complete standard implementation

### SQL-99 and Later
- **Core SQL** - Essential features all implementations should support
- **Enhanced SQL** - Optional feature packages (e.g., OLAP, temporal, XML)

Most modern databases support Core SQL:1999 and many SQL:2003 features, with varying support for later standards.

## Implementation Across Major Databases

| Database | Core Standard | Notable Extensions | Standards Compliance |
|----------|--------------|-------------------|---------------------|
| PostgreSQL | SQL:2016 | Strong standards adherence, full SQL:2011 temporal | High |
| Oracle | SQL:2016 | Many proprietary extensions | High (with extensions) |
| SQL Server | SQL:2016 | T-SQL extensions | High (with T-SQL) |
| MySQL | SQL:2003 | Some non-standard behavior | Moderate |
| SQLite | SQL-92 | Minimal extensions | Moderate (subset) |
| Snowflake | SQL:2016 | Cloud-native extensions | High |
| BigQuery | SQL:2011 | Google-specific syntax | Moderate to High |
| DuckDB | SQL:2016 | Analytics-focused | High |

## Major Features by Standard

### SQL-92 (SQL:1992)
The foundation of modern SQL:
- Basic SELECT, INSERT, UPDATE, DELETE
- JOINs (INNER, LEFT, RIGHT, FULL OUTER)
- Subqueries (scalar, row, table)
- Basic constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK)
- Transaction control (COMMIT, ROLLBACK)
- Schema objects (CREATE TABLE, VIEW, INDEX)
- Data types (INTEGER, CHAR, VARCHAR, DATE, TIME, TIMESTAMP)
- Basic aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- GROUP BY and HAVING clauses

### SQL-99 (SQL:1999)
Major expansion of capabilities:
- Common Table Expressions (WITH clause)
- Recursive queries (WITH RECURSIVE)
- CASE expressions
- Triggers (CREATE TRIGGER)
- User-defined functions and procedures
- Object-relational features (structured types, reference types)
- SIMILAR TO pattern matching
- Boolean data type
- Large object types (BLOB, CLOB)
- Role-based access control (GRANT ROLE)

### SQL:2003
Enhanced analytics and data handling:
- Window functions (ROW_NUMBER, RANK, DENSE_RANK)
- OVER clause for analytical queries
- XML data type and operations (XMLELEMENT, XMLAGG)
- MERGE statement (upserts)
- Sequences (CREATE SEQUENCE)
- Identity columns (GENERATED AS IDENTITY)
- Enhanced CREATE TABLE options
- TABLESAMPLE for sampling
- MULTISET data type

### SQL:2011
Focus on temporal data and analytics:
- Temporal tables (system-versioned tables)
- Application-time period tables
- Bitemporal tables
- Enhanced window functions (LEAD, LAG, FIRST_VALUE, LAST_VALUE)
- FETCH FIRST / OFFSET pagination
- Pipelined table functions
- Enhanced OLAP features
- Enhanced recursive queries

### SQL:2016
Modern data formats:
- JSON data type
- JSON functions (JSON_VALUE, JSON_QUERY, JSON_TABLE)
- JSON path expressions
- Row pattern matching (MATCH_RECOGNIZE)
- Polymorphic table functions
- LISTAGG aggregate function
- Session and system variables
- Enhanced temporal features

## Standards Documentation

Official SQL standards are published by ISO/IEC:
- **ISO/IEC 9075** - Database languages - SQL
- Available parts: Framework, Foundation, CLI, PSM, Management, Object Language Bindings, Information/Definition Schemas, SQL/Routine Invocation, SQL/MED, SQL/OLB, SQL/Schemata, SQL/JRT, SQL/XML, and SQL/PGQ

Standards documents are typically available for purchase from ISO or national standards bodies. However, many database vendors publish implementation notes and compatibility guides freely.

## Practical Implications

### Writing Portable SQL

To maximize portability:

```sql
-- Use standard SQL-92 syntax for basic queries
SELECT e.employee_id, e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE e.salary > 50000
ORDER BY e.name;

-- Use SQL-99 CTEs for clarity
WITH high_earners AS (
  SELECT employee_id, name, salary, department_id
  FROM employees
  WHERE salary > 100000
)
SELECT he.name, d.department_name, he.salary
FROM high_earners he
JOIN departments d ON he.department_id = d.department_id;

-- Use SQL:2003 window functions for analytics
SELECT
  employee_id,
  name,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank_in_dept
FROM employees;
```

### Avoiding Non-Standard Features

Be aware of vendor-specific syntax:

```sql
-- MySQL-specific (LIMIT)
SELECT * FROM employees LIMIT 10;

-- SQL Server-specific (TOP)
SELECT TOP 10 * FROM employees;

-- Oracle-specific (ROWNUM)
SELECT * FROM employees WHERE ROWNUM <= 10;

-- Standard SQL:2011 (FETCH FIRST)
SELECT * FROM employees
FETCH FIRST 10 ROWS ONLY;
```

### Feature Detection

Check database version and capabilities:

```sql
-- PostgreSQL: Check version and features
SELECT version();

-- SQL Server: Check version
SELECT @@VERSION;

-- MySQL: Check version
SELECT VERSION();

-- Check specific feature support through documentation or testing
```

## Best Practices

1. **Know Your Target Databases** - Understand which standards they support
2. **Use Core Features First** - Start with widely-supported SQL-92 and SQL-99 features
3. **Document Standard Compliance** - Note which SQL standard features you're using
4. **Test Across Platforms** - Verify SQL works on all target databases
5. **Use Abstraction Layers** - ORMs and query builders can help with portability
6. **Read Vendor Documentation** - Understand each database's standard implementation
7. **Plan for Differences** - Use database-specific optimizations when necessary
8. **Stay Current** - Learn new standard features that improve code quality

## Feature Availability Quick Reference

| Feature | SQL-92 | SQL-99 | SQL:2003 | SQL:2011 | SQL:2016 |
|---------|--------|--------|----------|----------|----------|
| Basic SELECT/FROM/WHERE | ✓ | ✓ | ✓ | ✓ | ✓ |
| JOINs | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subqueries | ✓ | ✓ | ✓ | ✓ | ✓ |
| CASE expressions | - | ✓ | ✓ | ✓ | ✓ |
| CTEs (WITH) | - | ✓ | ✓ | ✓ | ✓ |
| Recursive CTEs | - | ✓ | ✓ | ✓ | ✓ |
| Window functions | - | - | ✓ | ✓ | ✓ |
| MERGE statement | - | - | ✓ | ✓ | ✓ |
| Temporal tables | - | - | - | ✓ | ✓ |
| JSON support | - | - | - | - | ✓ |
| Row pattern matching | - | - | - | - | ✓ |

## Learning Path

For those new to SQL standards:

1. **Start with SQL-92** - Master the fundamentals that all databases support
2. **Learn SQL-99 CTEs** - Improve query readability and maintainability
3. **Adopt SQL:2003 Window Functions** - Essential for analytics
4. **Explore SQL:2011 Pagination** - Modern data retrieval patterns
5. **Use SQL:2016 JSON** - Handle modern data formats

## See Also

- [SQL-92 Standard Details](./sql-1992/) - Detailed coverage of SQL-92 features
- [SQL-99 Standard Details](./sql-1999/) - SQL:1999 features and syntax
- [SQL:2003 Standard Details](./sql-2003/) - Window functions and analytics
- [SQL:2011 Standard Details](./sql-2011/) - Temporal data and pagination
- [SQL:2016 Standard Details](./sql-2016/) - JSON and pattern matching
- [SQL Basics](../basics/) - Fundamental SQL concepts
- [Dialect Differences](/comparisons/dialect-differences/) - Database-specific variations
- [Migration Guides](/comparisons/migration/) - Moving between databases

## External Resources

- [ISO/IEC 9075 (SQL) Standards](https://www.iso.org/standard/76583.html)
- [Modern SQL](https://modern-sql.com/) - SQL standard features explained
- Database vendor documentation for standards compliance:
  - [PostgreSQL SQL Conformance](https://www.postgresql.org/docs/current/features.html)
  - [MySQL SQL Standards](https://dev.mysql.com/doc/refman/8.0/en/compatibility.html)
  - [Oracle SQL Compliance](https://docs.oracle.com/en/database/oracle/oracle-database/)
  - [SQL Server Standards](https://learn.microsoft.com/en-us/sql/)
