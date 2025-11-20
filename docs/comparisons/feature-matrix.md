---
title: Database Engine Feature Matrix
description: Comprehensive feature comparison across major SQL database engines including PostgreSQL, MySQL, SQL Server, Oracle, SQLite, and cloud databases
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, BigQuery, Snowflake, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [comparison, features, databases, migration, engines]
---

# Database Engine Feature Matrix

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Overview

This comprehensive feature matrix compares capabilities across major SQL database engines. Use this guide to understand feature support when choosing a database, planning migrations, or writing cross-platform applications.

**Covered Engines:**
- **PostgreSQL** - Advanced open-source relational database
- **MySQL** - Popular open-source database
- **SQL Server** - Microsoft's enterprise database
- **Oracle** - Enterprise-grade commercial database
- **SQLite** - Embedded lightweight database
- **BigQuery** - Google's serverless data warehouse
- **Snowflake** - Cloud data platform
- **DuckDB** - In-process analytical database
- **Databricks** - Lakehouse platform (Delta Lake)
- **Spark SQL** - Distributed SQL engine

## Quick Reference

| Feature Category | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|-----------------|------------|-------|------------|--------|--------|----------|-----------|
| **ACID Compliance** | ✅ Full | ✅ Full (InnoDB) | ✅ Full | ✅ Full | ✅ Full | ⚠️ Eventually | ✅ Full |
| **Window Functions** | ✅ | ✅ (8.0+) | ✅ | ✅ | ✅ (3.25+) | ✅ | ✅ |
| **CTEs (WITH)** | ✅ | ✅ (8.0+) | ✅ | ✅ | ✅ (3.8+) | ✅ | ✅ |
| **Recursive CTEs** | ✅ | ✅ (8.0+) | ✅ | ✅ | ✅ (3.8+) | ✅ | ✅ |
| **JSON Support** | ✅ Native | ✅ Limited | ✅ Good | ✅ Good | ✅ (3.38+) | ✅ Excellent | ✅ Good |
| **Full-Text Search** | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ FTS5 | ❌ | ❌ |
| **Geospatial** | ✅ PostGIS | ✅ Limited | ✅ Good | ✅ Spatial | ❌ | ✅ Geography | ✅ Geography |
| **Array Types** | ✅ | ❌ | ❌ | ✅ (VARRAY) | ❌ | ✅ | ✅ |
| **Materialized Views** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Partitioning** | ✅ Declarative | ✅ (8.0+) | ✅ | ✅ | ❌ | ✅ Auto | ✅ Auto |

## Data Types

### Numeric Types

| Type Category | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|--------------|------------|-------|------------|--------|--------|----------|-----------|
| **Integer (Small)** | SMALLINT | SMALLINT, TINYINT | SMALLINT, TINYINT | NUMBER | INTEGER | INT64 | SMALLINT |
| **Integer (Standard)** | INTEGER | INT, INTEGER | INT, INTEGER | NUMBER | INTEGER | INT64 | INTEGER |
| **Integer (Big)** | BIGINT | BIGINT | BIGINT | NUMBER | INTEGER | INT64 | BIGINT |
| **Auto-Increment** | SERIAL, IDENTITY | AUTO_INCREMENT | IDENTITY | SEQUENCE | AUTOINCREMENT | No built-in | AUTOINCREMENT |
| **Decimal/Numeric** | NUMERIC, DECIMAL | DECIMAL, NUMERIC | DECIMAL, NUMERIC | NUMBER | REAL | NUMERIC, DECIMAL | NUMBER |
| **Float** | REAL | FLOAT | REAL, FLOAT | BINARY_FLOAT | REAL | FLOAT64 | FLOAT, DOUBLE |
| **Double** | DOUBLE PRECISION | DOUBLE | FLOAT(53) | BINARY_DOUBLE | REAL | FLOAT64 | DOUBLE |
| **Money** | MONEY | DECIMAL | MONEY, SMALLMONEY | NUMBER | - | NUMERIC | NUMBER |
| **Boolean** | BOOLEAN | TINYINT(1) | BIT | NUMBER(1) | INTEGER | BOOL | BOOLEAN |

**Notes:**
- SQLite uses dynamic typing with type affinity
- Oracle uses NUMBER for most numeric types
- BigQuery and Snowflake use INT64/FLOAT64 naming

### String Types

| Type Category | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|--------------|------------|-------|------------|--------|--------|----------|-----------|
| **Fixed Length** | CHAR(n) | CHAR(n) | CHAR(n) | CHAR(n) | TEXT | STRING | CHAR(n) |
| **Variable Length** | VARCHAR(n) | VARCHAR(n) | VARCHAR(n) | VARCHAR2(n) | TEXT | STRING | VARCHAR(n) |
| **Unlimited Text** | TEXT | TEXT, LONGTEXT | VARCHAR(MAX), TEXT | CLOB | TEXT | STRING | TEXT, VARCHAR |
| **Unicode** | All are UTF-8 | NCHAR, NVARCHAR | NCHAR, NVARCHAR | NCHAR, NVARCHAR2 | TEXT | STRING (UTF-8) | All are UTF-8 |
| **Binary** | BYTEA | BINARY, VARBINARY, BLOB | BINARY, VARBINARY | BLOB, RAW | BLOB | BYTES | BINARY, VARBINARY |
| **Max Size** | 1GB | 4GB (LONGTEXT) | 2GB | 4GB | 2GB | 2MB (display), no limit stored | 16MB |

**Key Differences:**
- PostgreSQL: All strings are UTF-8 by default
- MySQL: Requires explicit character set specification
- SQL Server: N prefix for Unicode (NVARCHAR)
- Oracle: Uses VARCHAR2 instead of VARCHAR
- BigQuery: Single STRING type for all text
- Snowflake: Native UTF-8 support

### Date and Time Types

| Type Category | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|--------------|------------|-------|------------|--------|--------|----------|-----------|
| **Date** | DATE | DATE | DATE | DATE | TEXT/INTEGER | DATE | DATE |
| **Time** | TIME | TIME | TIME | - | TEXT | TIME | TIME |
| **Timestamp** | TIMESTAMP | DATETIME, TIMESTAMP | DATETIME, DATETIME2 | TIMESTAMP | TEXT/INTEGER | TIMESTAMP | TIMESTAMP |
| **Timestamp w/ TZ** | TIMESTAMPTZ | TIMESTAMP | DATETIMEOFFSET | TIMESTAMP WITH TIME ZONE | TEXT | TIMESTAMP | TIMESTAMP_TZ |
| **Interval** | INTERVAL | - | - | INTERVAL | - | INTERVAL | - |
| **Date Range** | 4713 BC - 294276 AD | 1000-01-01 - 9999-12-31 | 0001-01-01 - 9999-12-31 | 4712 BC - 9999 AD | Unlimited | 0001-01-01 - 9999-12-31 | 1582-10-15 - 9999-12-31 |
| **Time Precision** | Microseconds | Microseconds | 100 nanoseconds | Nanoseconds | Milliseconds | Microseconds | Nanoseconds |

**Important Notes:**
- SQLite stores dates as TEXT (ISO8601), REAL (Julian days), or INTEGER (Unix time)
- MySQL TIMESTAMP limited to 1970-2038 (use DATETIME instead)
- PostgreSQL TIMESTAMPTZ stores UTC, displays in session timezone
- BigQuery TIMESTAMP always in UTC
- Snowflake supports both TIMESTAMP_NTZ (no timezone) and TIMESTAMP_TZ

### JSON and Semi-Structured Data

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **JSON Type** | JSON, JSONB | JSON | NVARCHAR with JSON check | JSON, BLOB | JSON (3.38+), TEXT | JSON | VARIANT |
| **Binary Format** | JSONB (indexed) | Binary | - | OSON (21c) | - | Columnar | - |
| **JSON Path** | jsonb_path_query | JSON_EXTRACT, ->, ->> | JSON_VALUE, JSON_QUERY | JSON_VALUE, JSON_QUERY | json_extract, ->, ->> | JSON_EXTRACT, JSON_VALUE | GET, GET_PATH |
| **JSON Array** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **JSON Objects** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Indexing JSON** | GIN, GiST indexes | Generated columns + index | Computed columns + index | JSON search index | Expression index | Automatic | Automatic |
| **Schema Validation** | JSON Schema extension | - | - | IS JSON constraint | - | - | - |
| **XML Type** | XML | - | XML | XMLType | - | - | - |
| **Array Type** | ARRAY[] | - | - | VARRAY, TABLE | - | ARRAY<type> | ARRAY |
| **Map/Object** | HSTORE | - | - | - | - | STRUCT | OBJECT |

**Best for JSON:**
1. **PostgreSQL JSONB**: Best indexing and query performance
2. **BigQuery**: Best for analytics on JSON data
3. **Snowflake VARIANT**: Flexible semi-structured data
4. **MySQL 8.0+**: Improved JSON support with generated columns

### Advanced Types

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **UUID/GUID** | UUID | BINARY(16), CHAR(36) | UNIQUEIDENTIFIER | RAW(16) | TEXT, BLOB | STRING | VARCHAR |
| **IP Address** | INET, CIDR | VARBINARY | VARBINARY | - | TEXT | STRING | VARCHAR |
| **MAC Address** | MACADDR | - | - | - | TEXT | - | - |
| **Geographic** | PostGIS (GEOMETRY, GEOGRAPHY) | GEOMETRY, POINT | GEOMETRY, GEOGRAPHY | SDO_GEOMETRY | - | GEOGRAPHY, GEOMETRY | GEOGRAPHY |
| **Range Types** | INT4RANGE, TSRANGE, etc. | - | - | - | - | - | - |
| **Enum** | ENUM | ENUM | - | - | - | - | - |
| **Composite** | CREATE TYPE (composite) | - | User-defined types | OBJECT types | - | STRUCT | OBJECT |
| **Vector** | vector (pgvector ext.) | - | - | VECTOR (23c) | - | - | - |

## SQL Standard Compliance

### Core SQL Features

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **SQL Standard Version** | SQL:2016 | SQL:2016 (partial) | SQL:2016 (partial) | SQL:2016 | SQL-92 mostly | SQL:2011 | SQL:2016 |
| **Compliance Level** | Very High | Medium | High | Very High | Medium | Medium-High | High |
| **Standard Joins** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Most | ✅ All | ✅ All |
| **Subqueries** | ✅ All types | ✅ All types | ✅ All types | ✅ All types | ✅ Most | ✅ All types | ✅ All types |
| **Correlated Subqueries** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Common Table Expressions** | ✅ | ✅ (8.0+) | ✅ | ✅ | ✅ (3.8+) | ✅ | ✅ |
| **Recursive CTEs** | ✅ | ✅ (8.0+) | ✅ | ✅ | ✅ (3.8+) | ✅ | ✅ |
| **Window Functions** | ✅ All | ✅ All (8.0+) | ✅ All | ✅ All | ✅ Most (3.25+) | ✅ All | ✅ All |
| **LATERAL Joins** | ✅ | ✅ (8.0.14+) | ✅ CROSS APPLY | ✅ LATERAL | ❌ | ✅ | ✅ |
| **MERGE Statement** | ⚠️ INSERT ON CONFLICT | ❌ (use REPLACE/INSERT ON DUPLICATE KEY UPDATE) | ✅ | ✅ | ⚠️ INSERT OR REPLACE | ✅ | ✅ MERGE |
| **INTERSECT/EXCEPT** | ✅ | ❌ (use IN/NOT IN) | ✅ INTERSECT/EXCEPT | ✅ INTERSECT/MINUS | ✅ | ✅ | ✅ |

### Window Functions Support

| Window Function | PostgreSQL | MySQL 8.0+ | SQL Server | Oracle | SQLite 3.25+ | BigQuery | Snowflake |
|----------------|------------|------------|------------|--------|--------------|----------|-----------|
| **ROW_NUMBER()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **RANK()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DENSE_RANK()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **NTILE()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **LAG()/LEAD()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **FIRST_VALUE()/LAST_VALUE()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **NTH_VALUE()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PERCENT_RANK()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CUME_DIST()** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Frame Clause (ROWS/RANGE)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ ROWS only | ✅ Full | ✅ Full |
| **GROUPS Frame** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **EXCLUDE Clause** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Constraints and Indexes

### Constraint Support

| Constraint Type | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|----------------|------------|-------|------------|--------|--------|----------|-----------|
| **PRIMARY KEY** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Not enforced | ⚠️ Not enforced |
| **FOREIGN KEY** | ✅ Enforced | ✅ Enforced (InnoDB) | ✅ Enforced | ✅ Enforced | ✅ Enforced (if enabled) | ⚠️ Not enforced | ⚠️ Not enforced |
| **UNIQUE** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Not enforced | ⚠️ Not enforced |
| **CHECK** | ✅ | ✅ (8.0.16+) | ✅ | ✅ | ✅ | ⚠️ Not enforced | ✅ |
| **NOT NULL** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Not enforced | ✅ |
| **DEFAULT** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Exclusion Constraints** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Deferrable Constraints** | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

**Note:** BigQuery and Snowflake constraints are primarily metadata for query optimization, not enforcement.

### Index Types

| Index Type | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|-----------|------------|-------|------------|--------|--------|----------|-----------|
| **B-Tree** | ✅ Default | ✅ Default | ✅ Clustered/Non-clustered | ✅ Default | ✅ Default | ⚠️ Auto | ⚠️ Auto |
| **Hash** | ✅ | ✅ (MEMORY engine) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **GiST (Generalized)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GIN (Inverted)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **BRIN (Block Range)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SP-GiST** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Bitmap** | ⚠️ Dynamically created | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Full-Text** | ✅ GIN/GiST | ✅ FULLTEXT | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Spatial** | ✅ GiST (PostGIS) | ✅ SPATIAL | ✅ | ✅ | ❌ | ✅ Auto | ✅ Auto |
| **Partial/Filtered** | ✅ WHERE clause | ❌ | ✅ WHERE clause | ❌ | ✅ WHERE clause | ❌ | ❌ |
| **Expression/Functional** | ✅ | ✅ (generated columns) | ✅ Computed columns | ✅ Function-based | ✅ | ❌ | ❌ |
| **Covering/Include** | ✅ INCLUDE | ❌ (implicit) | ✅ INCLUDE | ✅ (implicit) | ❌ | ❌ | ❌ |
| **Columnstore** | ❌ (use cstore_fdw) | ❌ | ✅ | ❌ | ❌ | ✅ Native | ✅ Native |

## Transactions and Concurrency

### Transaction Support

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **ACID Compliance** | ✅ Full | ✅ InnoDB (⚠️ MyISAM no) | ✅ Full | ✅ Full | ✅ Full | ⚠️ Eventually consistent | ✅ Full |
| **Isolation Levels** | 4 levels | 4 levels | 5 levels (+ snapshot) | 4 levels | 3 levels | Snapshot | Snapshot, Read Committed |
| **READ UNCOMMITTED** | ⚠️ Becomes READ COMMITTED | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **READ COMMITTED** | ✅ Default | ✅ | ✅ | ✅ Default | ❌ | ❌ | ✅ |
| **REPEATABLE READ** | ✅ | ✅ Default | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SERIALIZABLE** | ✅ SSI | ✅ | ✅ | ✅ | ✅ Default | ❌ | ✅ |
| **Snapshot Isolation** | ⚠️ REPEATABLE READ | ⚠️ REPEATABLE READ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **MVCC** | ✅ | ✅ (InnoDB) | ✅ (row versioning) | ✅ | ✅ (v3.7+) | ✅ | ✅ |
| **Savepoints** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Two-Phase Commit** | ✅ | ✅ (XA) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Autonomous Transactions** | ❌ (use dblink) | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Locking Mechanisms

| Locking Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|----------------|------------|-------|------------|--------|--------|----------|-----------|
| **Row-Level Locks** | ✅ | ✅ (InnoDB) | ✅ | ✅ | ❌ DB-level | ✅ | ✅ |
| **Table-Level Locks** | ✅ 8 modes | ✅ | ✅ | ✅ | ✅ 5 modes | ✅ | ✅ |
| **Advisory Locks** | ✅ | ✅ GET_LOCK() | ✅ sp_getapplock | ✅ DBMS_LOCK | ❌ | ❌ | ✅ |
| **Lock Timeout** | ✅ | ✅ innodb_lock_wait_timeout | ✅ LOCK_TIMEOUT | ✅ | ✅ busy_timeout | ✅ | ✅ |
| **Deadlock Detection** | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Timeout | ✅ | ✅ |
| **SELECT FOR UPDATE** | ✅ | ✅ | ✅ (holdlock) | ✅ | ❌ | ❌ | ✅ |
| **SELECT FOR SHARE** | ✅ | ✅ (LOCK IN SHARE MODE) | ✅ (rowlock) | ✅ (FOR SHARE) | ❌ | ❌ | ❌ |
| **NOWAIT** | ✅ | ✅ (8.0+) | ❌ | ✅ | ❌ | ❌ | ❌ |
| **SKIP LOCKED** | ✅ | ✅ (8.0+) | ❌ | ✅ | ❌ | ❌ | ❌ |

## Performance and Scalability

### Partitioning

| Partitioning Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------------------|------------|-------|------------|--------|--------|----------|-----------|
| **Declarative Partitioning** | ✅ (10+) | ✅ (8.0+) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Range Partitioning** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ Date/timestamp | ✅ |
| **List Partitioning** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Hash Partitioning** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ Integer | ✅ |
| **Composite Partitioning** | ✅ Sub-partitions | ✅ Sub-partitions | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Automatic Partitioning** | ❌ (use pg_partman) | ❌ | ❌ | ✅ Interval | ❌ | ✅ | ✅ Clustering |
| **Partition Pruning** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ Auto | ✅ Auto |
| **Partition-wise Joins** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Online Partition Ops** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

### Replication and High Availability

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **Streaming Replication** | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Data Guard | ❌ | ✅ Multi-region | ✅ Multi-region |
| **Logical Replication** | ✅ (10+) | ✅ Binlog | ✅ | ✅ GoldenGate | ❌ | ✅ | ✅ Replication |
| **Multi-Master** | ⚠️ Extensions (BDR, Bucardo) | ✅ Group Replication | ✅ Always On | ✅ RAC | ❌ | ❌ | ❌ |
| **Cascading Replication** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Synchronous Replication** | ✅ | ✅ (semi-sync) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Read Replicas** | ✅ | ✅ | ✅ | ✅ Active Data Guard | ❌ | ❌ (use BI Engine) | ✅ |
| **Automatic Failover** | ⚠️ Use Patroni/repmgr | ✅ Group Replication | ✅ Always On | ✅ Data Guard | ❌ | ✅ | ✅ |
| **Point-in-Time Recovery** | ✅ WAL | ✅ Binlog | ✅ | ✅ | ❌ (use backup) | ✅ Time travel | ✅ Time Travel |

### Parallel Execution

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **Parallel Query** | ✅ (9.6+) | ❌ Limited | ✅ | ✅ | ❌ | ✅ Massive | ✅ Auto |
| **Parallel Seq Scan** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Parallel Index Scan** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Parallel Aggregation** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Parallel Join** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Parallel Index Build** | ✅ | ✅ (8.0+) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Parallel DML** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Max Parallelism** | Configurable | - | Configurable | Configurable | - | Auto-scaled | Auto-scaled |

## Advanced Features

### Stored Procedures and Functions

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **Stored Procedures** | ✅ (11+) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Functions (UDF)** | ✅ | ✅ | ✅ | ✅ | ✅ (limited) | ✅ SQL/JavaScript | ✅ SQL/JavaScript/Python/Java |
| **Procedural Language** | PL/pgSQL | SQL/PSM | T-SQL | PL/SQL | - | - | Snowflake Scripting |
| **Multiple Languages** | ✅ PL/Python, PL/Perl, PL/Tcl, PL/V8 | ❌ | ✅ CLR (.NET) | ✅ Java | ❌ | ✅ JavaScript | ✅ JavaScript, Python, Java |
| **Table Functions** | ✅ RETURNS TABLE | ✅ (limited) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Trigger Support** | ✅ Row/Statement, Before/After/Instead Of | ✅ Row, Before/After | ✅ Row/Statement, After/Instead Of | ✅ Row/Statement, Before/After/Instead Of | ✅ Row, Before/After/Instead Of | ❌ | ✅ |
| **Recursive Functions** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Exception Handling** | ✅ | ✅ | ✅ TRY/CATCH | ✅ | ❌ | ✅ | ✅ |

### Views and Materialized Views

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **Standard Views** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Updatable Views** | ✅ Auto + triggers | ✅ Limited | ✅ | ✅ | ✅ triggers | ❌ | ❌ |
| **Materialized Views** | ✅ | ❌ | ✅ Indexed views | ✅ | ❌ | ✅ | ✅ |
| **Automatic Refresh** | ❌ (use triggers/cron) | - | ❌ | ✅ | - | ❌ | ✅ |
| **Incremental Refresh** | ❌ | - | ✅ | ✅ | - | ❌ | ✅ |
| **Query Rewrite** | ❌ | - | ✅ Auto (indexed views) | ✅ | - | ✅ | ✅ |
| **Recursive Views** | ✅ | ✅ (8.0+) | ✅ | ✅ | ✅ (3.8+) | ✅ | ✅ |

### Full-Text Search

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **Built-in FTS** | ✅ | ✅ | ✅ | ✅ Oracle Text | ✅ FTS5 | ❌ | ❌ |
| **Multiple Languages** | ✅ 20+ languages | ✅ Multiple | ✅ 50+ languages | ✅ | ✅ | - | - |
| **Phrase Search** | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| **Proximity Search** | ✅ <-> operator | ❌ | ✅ NEAR | ✅ | ❌ | - | - |
| **Boolean Operators** | ✅ &, \|, ! | ✅ +, -, * | ✅ AND, OR, NOT | ✅ | ✅ AND, OR, NOT | - | - |
| **Ranking/Scoring** | ✅ ts_rank | ✅ | ✅ | ✅ | ✅ | - | - |
| **Stemming** | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| **Synonyms** | ✅ Thesaurus | ❌ | ✅ | ✅ | ❌ | - | - |
| **Fuzzy Search** | ✅ Extensions | ❌ | ❌ | ✅ | ❌ | - | - |

### Security Features

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|---------|------------|-------|------------|--------|--------|----------|-----------|
| **Authentication** | Multiple methods | Multiple methods | Windows/SQL/Azure AD | Multiple methods | File-based | IAM | SSO, OAuth, MFA |
| **Row-Level Security** | ✅ Policies | ❌ (use views) | ✅ Predicates | ✅ VPD | ❌ | ✅ | ✅ |
| **Column-Level Security** | ✅ GRANT | ✅ GRANT | ✅ GRANT | ✅ GRANT | ❌ | ✅ | ✅ |
| **Data Masking** | ⚠️ Extensions | ❌ | ✅ Dynamic | ✅ | ❌ | ✅ | ✅ |
| **Encryption at Rest** | ✅ (file system/ext) | ✅ | ✅ TDE | ✅ TDE | ✅ SEE/SQLCipher | ✅ | ✅ |
| **Encryption in Transit** | ✅ SSL/TLS | ✅ SSL/TLS | ✅ SSL/TLS | ✅ SSL/TLS | - | ✅ TLS | ✅ TLS |
| **Audit Logging** | ✅ pgaudit | ✅ Enterprise | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Fine-grained Access** | ✅ RLS | ❌ | ✅ | ✅ VPD | ❌ | ✅ | ✅ |

## Cloud and Platform Features

### Cloud-Native Capabilities

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | BigQuery | Snowflake | Databricks |
|---------|------------|-------|------------|--------|----------|-----------|------------|
| **Serverless Option** | ✅ Aurora Serverless, Neon | ✅ Aurora Serverless | ✅ Azure SQL Serverless | ✅ Autonomous | ✅ Native | ✅ Native | ✅ SQL Warehouses |
| **Auto-Scaling** | ✅ Cloud providers | ✅ Cloud providers | ✅ Azure | ✅ Autonomous | ✅ | ✅ | ✅ |
| **Separation of Compute/Storage** | ⚠️ Cloud only | ⚠️ Cloud only | ✅ Azure | ✅ Cloud | ✅ | ✅ | ✅ |
| **Multi-Cloud** | ✅ | ✅ | ❌ Azure only | ✅ | ❌ GCP only | ✅ AWS/Azure/GCP | ✅ AWS/Azure/GCP |
| **Time Travel** | ❌ | ❌ | ❌ | ✅ Flashback | ✅ 7 days | ✅ 90 days | ✅ 30 days |
| **Zero-Copy Cloning** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **External Tables** | ✅ FDW | ✅ FEDERATED | ✅ PolyBase | ✅ External Tables | ✅ | ✅ | ✅ |
| **Data Sharing** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ Secure sharing | ✅ Delta Sharing |

### Analytics and BI

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | BigQuery | Snowflake | Databricks |
|---------|------------|-------|------------|--------|----------|-----------|------------|
| **OLAP Optimized** | ⚠️ With extensions | ❌ | ⚠️ Columnstore | ✅ | ✅ | ✅ | ✅ |
| **Columnar Storage** | ⚠️ cstore_fdw | ❌ | ✅ | ✅ In-Memory | ✅ | ✅ | ✅ (Delta/Parquet) |
| **Query Caching** | ✅ | ✅ | ✅ | ✅ | ✅ BI Engine | ✅ | ✅ |
| **BI Tool Integration** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Machine Learning** | ✅ Extensions (MADlib) | ❌ | ✅ ML Services | ✅ | ✅ BQML | ✅ Snowpark ML | ✅ MLflow |
| **Graph Queries** | ✅ Extensions (AGE) | ❌ | ✅ (limited) | ✅ | ❌ | ❌ | ❌ |
| **Array/Nested Data** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

## Licensing and Cost

| Aspect | PostgreSQL | MySQL | SQL Server | Oracle | SQLite | BigQuery | Snowflake |
|--------|------------|-------|------------|--------|--------|----------|-----------|
| **License** | PostgreSQL (MIT-like) | GPL v2 / Commercial | Commercial / Express free | Commercial | Public Domain | Commercial (pay-per-use) | Commercial (pay-per-use) |
| **Cost** | Free | Free / Enterprise paid | Free (Express) / Paid | Expensive | Free | Pay per query | Pay per compute/storage |
| **Open Source** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Commercial Support** | ✅ Multiple vendors | ✅ Oracle | ✅ Microsoft | ✅ Oracle | ⚠️ Limited | ✅ Google | ✅ Snowflake |
| **Vendor Lock-in** | Low | Low | Medium | High | None | High | Medium |

## Migration Considerations

### Ease of Migration Between Engines

| From → To | PostgreSQL | MySQL | SQL Server | Oracle |
|-----------|------------|-------|------------|--------|
| **MySQL** | Medium | - | Medium | Medium |
| **PostgreSQL** | - | Medium-Hard | Medium | Hard |
| **SQL Server** | Medium | Medium | - | Medium |
| **Oracle** | Medium-Hard | Hard | Hard | - |
| **SQLite** | Easy | Easy | Easy | Medium |

**Difficulty Factors:**
- **Easy**: Mostly syntax differences, minimal feature gaps
- **Medium**: Some feature rewrites needed, type mapping required
- **Hard**: Significant refactoring, proprietary features hard to replace
- **Medium-Hard**: Between medium and hard

### Common Migration Challenges

**MySQL → PostgreSQL:**
- AUTO_INCREMENT → SERIAL/IDENTITY
- ENUM types (different implementation)
- String comparison (case sensitivity)
- Date functions differ
- LIMIT syntax same (easy)

**SQL Server → PostgreSQL:**
- T-SQL → PL/pgSQL (significant rewrite)
- TOP N → LIMIT (syntax change)
- IDENTITY → SERIAL/IDENTITY
- DateTime functions differ
- Schema ownership model differs

**Oracle → PostgreSQL:**
- PL/SQL → PL/pgSQL (major rewrite)
- Packages → Schemas + Functions
- SEQUENCE usage differs
- Date arithmetic differs
- DUAL table not needed
- NVL → COALESCE

**PostgreSQL → Cloud (BigQuery/Snowflake):**
- Need to handle lack of constraint enforcement
- Rewrite stored procedures
- Different cost optimization strategies
- Leverage cloud-native features (partitioning, clustering)

## Use Case Recommendations

### Best Choice By Use Case

| Use Case | Best Options | Why |
|----------|-------------|-----|
| **Web Application (OLTP)** | PostgreSQL, MySQL | High concurrency, ACID, mature ecosystems |
| **Enterprise Application** | SQL Server, Oracle | Enterprise features, support, integration |
| **Analytics / Data Warehouse** | BigQuery, Snowflake, Databricks | Massive scalability, columnar storage, separation of compute/storage |
| **Embedded Database** | SQLite, DuckDB | No server, single file, lightweight |
| **Geospatial** | PostgreSQL (PostGIS) | Best geospatial support and performance |
| **Time-Series** | PostgreSQL (TimescaleDB), ClickHouse | Optimized for time-series workloads |
| **Real-time Analytics** | DuckDB, ClickHouse | Fast analytical queries on fresh data |
| **JSON/Document Heavy** | PostgreSQL, MongoDB | Rich JSON support, indexing |
| **Graph Data** | PostgreSQL (AGE), Neo4j | Graph query capabilities |
| **Machine Learning** | BigQuery (BQML), Snowflake (Snowpark), Databricks | Integrated ML capabilities |
| **Small Projects / Prototyping** | SQLite, PostgreSQL | Easy setup, no configuration |
| **Multi-Cloud** | Snowflake, Databricks | Native multi-cloud support |

## Performance Comparison

### Benchmark Characteristics

| Database | OLTP (Transactions/sec) | OLAP (Query Speed) | Scalability | Concurrency |
|----------|------------------------|-------------------|-------------|-------------|
| **PostgreSQL** | High | Medium | Vertical++ | Excellent |
| **MySQL** | Very High | Medium | Vertical++ | Excellent |
| **SQL Server** | High | High | Vertical+++ | Excellent |
| **Oracle** | Very High | High | Both | Excellent |
| **SQLite** | Medium | Low-Medium | Single-user | Poor (write) |
| **BigQuery** | Low | Very High | Massive | Excellent |
| **Snowflake** | Medium | Very High | Massive | Excellent |
| **DuckDB** | High | Very High | Single-node | Good |
| **Databricks** | Medium-High | Very High | Massive | Excellent |

**Notes:**
- OLTP: Optimized for transactional workloads (many small writes)
- OLAP: Optimized for analytical queries (complex reads, aggregations)
- Scalability: Vertical (bigger server) vs Horizontal (more servers)
- Actual performance depends heavily on workload, data size, configuration

## Summary Table: Quick Decision Matrix

| Need | Choose | Alternative |
|------|--------|-------------|
| **Most SQL-standard compliant** | PostgreSQL | Oracle |
| **Fastest simple queries** | MySQL | PostgreSQL |
| **Best for Windows/.NET** | SQL Server | PostgreSQL |
| **Most features** | Oracle | PostgreSQL |
| **Simplest deployment** | SQLite | DuckDB |
| **Best for analytics** | BigQuery | Snowflake |
| **Best JSON support** | PostgreSQL | BigQuery |
| **Best geospatial** | PostgreSQL + PostGIS | SQL Server |
| **Lowest cost** | PostgreSQL/MySQL/SQLite | - |
| **Best cloud-native** | Snowflake | BigQuery |
| **Best for data science** | Databricks | Snowflake |
| **Best full-text search** | PostgreSQL | SQL Server |

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="true" />

## See Also

- [DML & DDL Differences](/comparisons/dml-ddl-differences/) - Syntax differences across engines
- [Dialect Differences](/comparisons/dialect-differences/) - Side-by-side SQL comparisons
- [Migration Guides](/comparisons/migration-guides/) - Step-by-step migration instructions
- [PostgreSQL](/databases/postgresql/) - PostgreSQL documentation
- [MySQL](/databases/mysql/) - MySQL documentation
- [SQL Server](/databases/sqlserver/) - SQL Server documentation
- [Oracle](/databases/oracle/) - Oracle documentation
- [BigQuery](/databases/bigquery/) - BigQuery documentation
- [Snowflake](/databases/snowflake/) - Snowflake documentation
