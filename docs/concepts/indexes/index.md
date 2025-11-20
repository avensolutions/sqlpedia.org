---
title: Indexes
description: >-
  Comprehensive guide to database indexes - B-trees, bitmap indexes, clustered
  vs nonclustered, specialized indexes, and cardinality estimation
databases:
  - PostgreSQL
  - MySQL
  - SQL Server
  - Oracle
  - SQLite
  - BigQuery
  - Snowflake
  - DuckDB
difficulty: intermediate
tags:
  - concepts
  - indexes
  - b-tree
  - bitmap
  - clustered
  - performance
  - optimization
  - cardinality
---

# Indexes

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Basic B-tree index (most common)
CREATE INDEX idx_users_email ON users(email);

-- Unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Composite index
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Partial/filtered index (PostgreSQL, SQL Server)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- Covering index
CREATE INDEX idx_orders_covering ON orders(customer_id, order_date) INCLUDE (amount, status);

-- Bitmap index (Oracle)
CREATE BITMAP INDEX idx_products_category ON products(category);

-- GIN index for full-text search (PostgreSQL)
CREATE INDEX idx_documents_content ON documents USING GIN(to_tsvector('english', content));

-- BRIN index for large tables (PostgreSQL)
CREATE INDEX idx_logs_timestamp ON logs USING BRIN(timestamp);
```

## Overview

Database indexes are data structures that improve the speed of data retrieval operations on database tables. Like an index in a book, a database index allows the database engine to quickly locate data without scanning every row.

**Key Benefits**:

- **Faster queries**: Dramatically reduce query execution time
- **Efficient sorting**: Speed up ORDER BY operations
- **Constraint enforcement**: Support UNIQUE and PRIMARY KEY constraints
- **Join optimization**: Improve performance of JOIN operations

**Trade-offs**:

- **Storage overhead**: Indexes consume additional disk space
- **Write performance**: INSERT, UPDATE, DELETE operations become slower
- **Maintenance**: Indexes need to be maintained and occasionally rebuilt

## Indexing Approaches

### B-Tree Indexes

B-tree (Balanced Tree) indexes are the default and most versatile index type across all major database systems. They maintain sorted data in a tree structure, enabling efficient lookups, range scans, and ordered retrievals.

#### How B-Trees Work

```
                    [Page 50-100]
                    /           \
            [Page 1-50]      [Page 100-200]
            /        \          /         \
      [1-25]    [26-50]   [100-150]  [151-200]
        |          |          |           |
    [Data Rows] [Data Rows] [Data Rows] [Data Rows]
```

**Structure**:

- **Root node**: Top of the tree, starting point for searches
- **Internal nodes**: Guide searches to correct branches
- **Leaf nodes**: Contain actual data or pointers to data
- **Balanced**: All leaf nodes at the same depth

**Operations Complexity**:

- **Search**: O(log n)
- **Insert**: O(log n)
- **Delete**: O(log n)
- **Range scan**: O(log n + k) where k is result size

#### Creating B-Tree Indexes

```sql
-- Simple single-column index
CREATE INDEX idx_employees_last_name ON employees(last_name);

-- Composite (multi-column) index
CREATE INDEX idx_employees_dept_salary
ON employees(department_id, salary);

-- Unique index
CREATE UNIQUE INDEX idx_employees_email
ON employees(email);

-- Index with specific order
CREATE INDEX idx_employees_hire_date
ON employees(hire_date DESC);

-- Composite with mixed ordering
CREATE INDEX idx_sales_date_amount
ON sales(sale_date DESC, amount ASC);
```

#### When B-Trees Excel

```sql
-- Equality searches
SELECT * FROM employees WHERE employee_id = 12345;
-- Index: idx_employees_id

-- Range queries
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
-- Index: idx_orders_date

-- Sorting
SELECT * FROM products ORDER BY price DESC;
-- Index: idx_products_price

-- Prefix matching
SELECT * FROM customers WHERE email LIKE 'john%';
-- Index: idx_customers_email

-- IN lists (small to medium)
SELECT * FROM products WHERE category_id IN (1, 2, 3);
-- Index: idx_products_category
```

#### Composite Index Column Order

The order of columns in a composite index matters significantly:

```sql
-- Create index: (department_id, salary)
CREATE INDEX idx_emp_dept_sal ON employees(department_id, salary);

-- ✅ Can use index fully
SELECT * FROM employees
WHERE department_id = 5 AND salary > 50000;

-- ✅ Can use index partially (only department_id)
SELECT * FROM employees
WHERE department_id = 5;

-- ❌ Cannot use index efficiently
SELECT * FROM employees
WHERE salary > 50000;

-- ✅ Can use index for sorting
SELECT * FROM employees
WHERE department_id = 5
ORDER BY salary;

-- ❌ Cannot use index for sorting
SELECT * FROM employees
ORDER BY salary;
```

**Leftmost Prefix Rule**:

- Index can be used if query filters/sorts start with leftmost columns
- Missing leftmost columns = index not usable
- Order: (A, B, C) → can use for A, (A,B), (A,B,C) but not B, C, or (B,C)

#### B-Tree Performance Tips

```sql
-- ❌ Bad: Function on indexed column prevents index use
SELECT * FROM orders
WHERE YEAR(order_date) = 2024;

-- ✅ Good: Rewrite to use index
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
  AND order_date < '2025-01-01';

-- ❌ Bad: Expression on indexed column
SELECT * FROM products
WHERE price * 1.1 > 100;

-- ✅ Good: Isolate indexed column
SELECT * FROM products
WHERE price > 100 / 1.1;

-- Consider functional index for unavoidable functions
CREATE INDEX idx_orders_year ON orders(YEAR(order_date));
```

### Bitmap Indexes

Bitmap indexes use bit arrays (bitmaps) to represent the presence or absence of values. Each distinct value gets a bitmap where 1 indicates the row has that value and 0 indicates it doesn't.

**Best for**:

- Low cardinality columns (few distinct values)
- Read-heavy workloads with minimal updates
- Data warehousing and analytics
- Complex queries with multiple AND/OR conditions

**Not suitable for**:

- High cardinality columns (many unique values)
- OLTP systems with frequent updates
- Columns with frequent modifications

#### Oracle Bitmap Indexes

Oracle has the most mature bitmap index implementation:

```sql
-- Create bitmap index
CREATE BITMAP INDEX idx_products_category
ON products(category);

CREATE BITMAP INDEX idx_products_status
ON products(status);

CREATE BITMAP INDEX idx_products_in_stock
ON products(in_stock);

-- Bitmap indexes excel with multiple conditions
SELECT * FROM products
WHERE category = 'Electronics'
  AND status = 'Active'
  AND in_stock = 'Y';
-- Oracle efficiently combines bitmaps using bitwise operations

-- Bitmap join index (Oracle)
CREATE BITMAP INDEX idx_orders_customer_region
ON orders(customers.region)
FROM orders, customers
WHERE orders.customer_id = customers.customer_id;
```

**How Bitmap Indexes Work**:

```
Table: products
id  category     status
1   Electronics  Active
2   Books       Active
3   Electronics  Inactive
4   Books       Active
5   Clothing    Active

Bitmap for category='Electronics': [1,0,1,0,0]
Bitmap for category='Books':       [0,1,0,1,0]
Bitmap for category='Clothing':    [0,0,0,0,1]

Bitmap for status='Active':        [1,1,0,1,1]
Bitmap for status='Inactive':      [0,0,1,0,0]

Query: WHERE category='Electronics' AND status='Active'
Result: [1,0,1,0,0] AND [1,1,0,1,1] = [1,0,0,0,0]
        → Row 1 matches
```

**Advantages**:

- Extremely space-efficient for low-cardinality columns
- Fast bitwise operations for complex conditions
- Excellent for combining multiple predicates
- Great compression ratios

**Disadvantages**:

- Locking issues in OLTP (whole bitmap segments may lock)
- Slow for high-cardinality columns
- Poor performance with frequent DML operations
- Not supported in many databases (PostgreSQL, MySQL)

#### PostgreSQL Bitmap Scans

PostgreSQL doesn't have bitmap indexes as a storage structure, but creates them dynamically:

```sql
-- PostgreSQL creates bitmap in memory during query execution
-- Using regular B-tree indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);

-- PostgreSQL automatically uses bitmap scan
EXPLAIN SELECT * FROM products
WHERE category = 'Electronics' AND status = 'Active';

/*
Output might show:
Bitmap Heap Scan on products
  Recheck Cond: ((category = 'Electronics') AND (status = 'Active'))
  ->  BitmapAnd
        ->  Bitmap Index Scan on idx_products_category
        ->  Bitmap Index Scan on idx_products_status
*/
```

### Clustered vs Nonclustered Indexes (SQL Server)

#### Clustered Indexes

A clustered index determines the physical order of data in a table. The table data is stored in the order of the clustered index key.

**Key Characteristics**:

- Only ONE clustered index per table
- Leaf nodes contain the actual table data
- Table rows are physically sorted by the index key
- Primary key creates clustered index by default (SQL Server)

```sql
-- SQL Server: Create clustered index
CREATE CLUSTERED INDEX idx_orders_order_date
ON orders(order_date);

-- Or specify during table creation
CREATE TABLE orders (
    order_id INT PRIMARY KEY CLUSTERED,
    customer_id INT,
    order_date DATE
);

-- Change clustering key
DROP INDEX idx_orders_order_date ON orders;
CREATE CLUSTERED INDEX idx_orders_customer_date
ON orders(customer_id, order_date);
```

**Clustered Index Structure**:

```
Root Level:     [Pointers to intermediate pages]
                /                              \
Intermediate:  [Pointers to leaf pages]    [Pointers to leaf pages]
              /                           \
Leaf Level:  [Actual Data Rows]          [Actual Data Rows]
             Sorted by index key          Sorted by index key
```

#### Nonclustered Indexes

Nonclustered indexes have a structure separate from the data rows. The leaf level contains index keys and row locators (either RID or clustered index key).

**Key Characteristics**:

- Multiple nonclustered indexes per table (typically up to 999 in SQL Server)
- Leaf nodes contain pointers to data, not data itself
- Separate structure from table data
- Requires bookmark lookup to get full row data

```sql
-- SQL Server: Nonclustered index
CREATE NONCLUSTERED INDEX idx_customers_email
ON customers(email);

-- With included columns (covering index)
CREATE NONCLUSTERED INDEX idx_customers_email_covering
ON customers(email)
INCLUDE (first_name, last_name, phone);

-- Filtered nonclustered index
CREATE NONCLUSTERED INDEX idx_orders_pending
ON orders(order_date)
WHERE status = 'Pending';
```

**Nonclustered Index Structure**:

```
Root Level:     [Index Key Values + Pointers]
                /                              \
Intermediate:  [Index Key Values + Pointers]  [Index Key Values + Pointers]
              /                              \
Leaf Level:  [Index Keys + Row Locators]    [Index Keys + Row Locators]
                      ↓                               ↓
                [Table Data (Heap or Clustered)]
```

#### Clustered vs Nonclustered Comparison

```sql
-- Example table
CREATE TABLE employees (
    employee_id INT PRIMARY KEY CLUSTERED,  -- Clustered
    email VARCHAR(255),
    department_id INT,
    salary DECIMAL(10,2),
    hire_date DATE
);

-- Nonclustered indexes
CREATE NONCLUSTERED INDEX idx_emp_email ON employees(email);
CREATE NONCLUSTERED INDEX idx_emp_dept ON employees(department_id);
CREATE NONCLUSTERED INDEX idx_emp_hire ON employees(hire_date);

-- Query using clustered index (fastest - direct data access)
SELECT * FROM employees WHERE employee_id = 12345;

-- Query using nonclustered index (requires lookup to clustered index)
SELECT * FROM employees WHERE email = 'john@example.com';
-- Process:
-- 1. Search idx_emp_email to find employee_id
-- 2. Use employee_id to lookup in clustered index
-- 3. Return full row

-- Covering query (no lookup needed)
CREATE NONCLUSTERED INDEX idx_emp_email_name
ON employees(email)
INCLUDE (first_name, last_name);

SELECT first_name, last_name
FROM employees
WHERE email = 'john@example.com';
-- Process: All data in index, no lookup needed
```

| Aspect                    | Clustered                  | Nonclustered                       |
| ------------------------- | -------------------------- | ---------------------------------- |
| Quantity per table        | One only                   | Multiple (up to 999 in SQL Server) |
| Storage                   | Data stored in index order | Separate from data                 |
| Leaf nodes                | Actual data rows           | Pointers + index keys              |
| Speed for covered queries | Fastest                    | Fast (if covering)                 |
| Impact on inserts         | Can cause page splits      | Less impact                        |
| Best for                  | Primary key, range queries | Lookups, covering queries          |
| Storage overhead          | None (data is the index)   | Additional storage                 |

#### Choosing Clustered Index Key

```sql
-- ❌ Bad clustered index: GUID (random)
CREATE TABLE orders (
    order_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY CLUSTERED,
    customer_id INT,
    order_date DATE
);
-- Problem: Random inserts cause page splits and fragmentation

-- ✅ Good clustered index: Sequential values
CREATE TABLE orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    customer_id INT,
    order_date DATE
);
-- Benefit: Inserts go to end, minimal page splits

-- ✅ Good for range queries: Date-based
CREATE TABLE logs (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
    log_date DATETIME,
    message VARCHAR(MAX),
    INDEX idx_clustered_date CLUSTERED (log_date)
);
-- Benefit: Range queries on log_date are extremely efficient
```

**Best Practices**:

1. Choose narrow keys (fewer bytes = more entries per page)
2. Prefer sequential values (IDENTITY, dates) over random (GUIDs)
3. Consider query patterns (what you search/range query on most)
4. Keep it unique or nearly unique
5. Avoid frequently updated columns

### Z-Order Clustering

Z-order (or space-filling curve) clustering is a multi-dimensional clustering technique that improves query performance for multi-column filters. Popular in modern cloud data warehouses.

**How It Works**:
Instead of sorting by one column, Z-order interleaves bits from multiple columns to create a single sort key that preserves locality in multiple dimensions.

**Supported By**:

- Databricks (Delta Lake)
- Apache Iceberg
- Apache Hudi
- Limited support in some other systems

```sql
-- Databricks: OPTIMIZE with Z-ORDER
OPTIMIZE events
ZORDER BY (user_id, event_date, event_type);

-- This improves queries filtering on any combination:
-- 1. WHERE user_id = 123
-- 2. WHERE event_date = '2024-01-01'
-- 3. WHERE user_id = 123 AND event_date = '2024-01-01'
-- 4. WHERE user_id = 123 AND event_type = 'click'
-- 5. WHERE event_date = '2024-01-01' AND event_type = 'click'
```

#### Z-Order vs Traditional Clustering

```sql
-- Traditional clustered index (SQL Server)
-- Good for: WHERE customer_id = X
-- Poor for: WHERE order_date = Y
CREATE CLUSTERED INDEX idx_orders_customer
ON orders(customer_id, order_date);

-- Z-Order clustering (Databricks)
-- Good for both WHERE customer_id = X AND WHERE order_date = Y
OPTIMIZE orders
ZORDER BY (customer_id, order_date);
```

**Visual Comparison**:

Traditional sorting (customer_id, order_date):

```
customer_id | order_date | ...
1          | 2024-01-01 |
1          | 2024-01-15 |
1          | 2024-02-01 |
2          | 2024-01-01 |
2          | 2024-01-20 |
3          | 2024-01-05 |
```

- Fast for: customer_id queries
- Slow for: order_date queries (must scan all customers)

Z-Order clustering:

```
Interleaved bits create groupings that preserve locality in BOTH dimensions
- customer_id=1, date=2024-01-01
- customer_id=2, date=2024-01-01
- customer_id=1, date=2024-01-15
- customer_id=3, date=2024-01-05
...
```

- Good for: customer_id queries
- Good for: order_date queries
- Great for: Combined filters

#### Use Cases for Z-Order

```sql
-- Event analytics table (Databricks)
CREATE TABLE events (
    event_id BIGINT,
    user_id BIGINT,
    session_id STRING,
    event_type STRING,
    event_timestamp TIMESTAMP,
    country STRING,
    device STRING
) USING DELTA;

-- Z-order by common filter columns
OPTIMIZE events
ZORDER BY (user_id, event_timestamp, event_type);

-- All these queries benefit:
SELECT * FROM events WHERE user_id = 12345;
SELECT * FROM events WHERE event_timestamp >= '2024-01-01';
SELECT * FROM events WHERE event_type = 'purchase';
SELECT * FROM events
WHERE user_id = 12345 AND event_timestamp >= '2024-01-01';

-- IoT sensor data
OPTIMIZE sensor_readings
ZORDER BY (device_id, timestamp, sensor_type);

-- Multi-tenant SaaS
OPTIMIZE customer_data
ZORDER BY (tenant_id, created_date, status);
```

**When to Use Z-Order**:

- ✅ Large analytical tables (data lakes/warehouses)
- ✅ Multiple common filter columns
- ✅ No clear dominant query pattern
- ✅ Read-heavy workloads
- ❌ OLTP databases
- ❌ Frequently updated tables
- ❌ Single primary filter column

### Specialized Search Indexes

#### PostgreSQL GIN (Generalized Inverted Index)

GIN indexes are designed for indexing composite values where queries search for element values within composites. Perfect for full-text search, arrays, JSON, and more.

```sql
-- Full-text search
CREATE INDEX idx_documents_fts
ON documents
USING GIN(to_tsvector('english', content));

SELECT * FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'database & indexing');

-- Array searches
CREATE TABLE products (
    product_id INT,
    tags TEXT[]
);

CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Find products with specific tags
SELECT * FROM products WHERE tags @> ARRAY['electronics', 'sale'];
SELECT * FROM products WHERE tags && ARRAY['laptop', 'computer'];

-- JSONB indexing
CREATE TABLE events (
    event_id BIGINT,
    data JSONB
);

CREATE INDEX idx_events_data ON events USING GIN(data);

-- Query JSON fields efficiently
SELECT * FROM events WHERE data @> '{"user_type": "premium"}';
SELECT * FROM events WHERE data ? 'purchase_amount';
SELECT * FROM events WHERE data @@ '$.items[*].category == "electronics"';

-- Specific JSONB paths (more efficient)
CREATE INDEX idx_events_user_type ON events USING GIN((data -> 'user_type'));
```

**GIN Index Characteristics**:

- **Structure**: Inverted index (value → list of row references)
- **Size**: Often larger than B-tree indexes
- **Build time**: Slower to create
- **Update cost**: Higher than B-tree
- **Search speed**: Very fast for containment queries
- **Best for**: Full-text search, array operations, JSONB queries

#### PostgreSQL BRIN (Block Range Index)

BRIN indexes store summary information about ranges of table blocks. Extremely space-efficient for large tables with natural correlation between physical storage and column values.

```sql
-- Time-series data (append-only logs)
CREATE TABLE server_logs (
    log_id BIGSERIAL,
    timestamp TIMESTAMPTZ,
    server_id INT,
    message TEXT
);

-- BRIN index: tiny index, huge table
CREATE INDEX idx_logs_timestamp ON server_logs USING BRIN(timestamp);

-- Query with range filter
SELECT * FROM server_logs
WHERE timestamp >= '2024-01-01'
  AND timestamp < '2024-02-01';

-- BRIN with custom pages_per_range
CREATE INDEX idx_logs_timestamp_128
ON server_logs
USING BRIN(timestamp) WITH (pages_per_range = 128);

-- Sensor data
CREATE TABLE sensor_data (
    reading_id BIGSERIAL,
    sensor_id INT,
    reading_time TIMESTAMPTZ,
    temperature DECIMAL,
    humidity DECIMAL
);

CREATE INDEX idx_sensor_time USING BRIN(reading_time);
CREATE INDEX idx_sensor_temp USING BRIN(temperature);
```

**BRIN Index Example**:

```
Table blocks:    1-100  101-200  201-300  301-400
timestamp min:   Jan 1  Jan 11   Jan 21   Feb 1
timestamp max:   Jan 10 Jan 20   Jan 31   Feb 10

Query: WHERE timestamp >= 'Jan 15' AND timestamp < 'Jan 25'
BRIN determines to scan only blocks 101-300
```

**BRIN Characteristics**:

- **Size**: Tiny (thousands of times smaller than B-tree)
- **Speed**: Slower than B-tree but still fast
- **Best for**: Large tables (100GB+) with physical correlation
- **Perfect for**: Time-series, append-only, sequential data
- **Not for**: Random data, small tables, exact lookups

**When to Use BRIN**:

```sql
-- ✅ Good: Time-series with correlation
CREATE TABLE metrics (
    metric_id BIGSERIAL,
    collected_at TIMESTAMPTZ,  -- Naturally ordered
    value DOUBLE PRECISION
);
CREATE INDEX idx_metrics_time USING BRIN(collected_at);

-- ❌ Bad: Random data
CREATE TABLE users (
    user_id UUID DEFAULT gen_random_uuid(),  -- Random
    email VARCHAR
);
-- Don't use BRIN on user_id or email (no correlation)
```

#### MySQL Full-Text Indexes

MySQL provides FULLTEXT indexes for full-text searching on TEXT and VARCHAR columns.

```sql
-- Create FULLTEXT index (MySQL)
CREATE TABLE articles (
    article_id INT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    FULLTEXT KEY idx_fulltext_content (content),
    FULLTEXT KEY idx_fulltext_title_content (title, content)
);

-- Or add later
CREATE FULLTEXT INDEX idx_articles_content ON articles(content);

-- Natural language search
SELECT article_id, title,
       MATCH(content) AGAINST ('database indexing') as relevance
FROM articles
WHERE MATCH(content) AGAINST ('database indexing' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC;

-- Boolean mode (with operators)
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST ('+database +indexing -mysql' IN BOOLEAN MODE);

-- Query expansion (finds related terms)
SELECT * FROM articles
WHERE MATCH(content) AGAINST ('database' WITH QUERY EXPANSION);
```

**MySQL Full-Text Features**:

- `+word`: Must include
- `-word`: Must not include
- `word*`: Wildcard
- `"phrase"`: Exact phrase
- `>word`: Increase relevance
- `<word`: Decrease relevance

#### SQL Server Full-Text Indexes

```sql
-- Enable full-text search
CREATE FULLTEXT CATALOG ft_catalog;

CREATE FULLTEXT INDEX ON documents(content)
KEY INDEX PK_documents
ON ft_catalog;

-- Full-text queries
SELECT * FROM documents
WHERE CONTAINS(content, 'database');

SELECT * FROM documents
WHERE CONTAINS(content, '"database indexing"');

SELECT * FROM documents
WHERE CONTAINS(content, 'database AND indexing');

SELECT * FROM documents
WHERE CONTAINS(content, 'NEAR((database, indexing), 10)');

-- FREETEXT (less precise, more forgiving)
SELECT * FROM documents
WHERE FREETEXT(content, 'databases indexing performance');
```

### Hash Indexes

Hash indexes use hash tables for equality lookups. Very fast for exact matches but cannot support range queries.

```sql
-- PostgreSQL hash index
CREATE INDEX idx_users_email_hash ON users USING HASH(email);

-- Good for: Exact matches only
SELECT * FROM users WHERE email = 'user@example.com';

-- Cannot use for:
-- - Range queries: WHERE email > 'a'
-- - Pattern matching: WHERE email LIKE '%@example.com'
-- - Sorting: ORDER BY email
```

**Hash Index Characteristics**:

- **Speed**: O(1) for exact match lookups
- **Size**: Comparable to B-tree
- **Limitations**: Equality only, no range queries, no sorting
- **Support**: PostgreSQL, MySQL (memory tables), Oracle
- **Recommendation**: Usually B-tree is better (more versatile)

**When to Use Hash Indexes**:

- ❌ Almost never (B-tree works well for equality too)
- ✅ Maybe: In-memory tables with only equality queries
- ✅ Maybe: Extremely high-performance equality lookups

## Cardinality Estimation

Cardinality refers to the number of distinct values in a column or set of columns. The database query optimizer uses cardinality estimates to choose efficient query execution plans.

### What is Cardinality?

```sql
-- Example table
SELECT * FROM employees;
-- 10,000 total rows

-- Low cardinality: Few distinct values
SELECT COUNT(DISTINCT department) FROM employees;
-- Result: 5 departments (cardinality = 5)

-- High cardinality: Many distinct values
SELECT COUNT(DISTINCT employee_id) FROM employees;
-- Result: 10,000 unique IDs (cardinality = 10,000)

-- Medium cardinality
SELECT COUNT(DISTINCT job_title) FROM employees;
-- Result: 150 job titles (cardinality = 150)
```

**Cardinality Categories**:

- **Low**: < 1% of rows (e.g., gender, status, category)
- **Medium**: 1-50% of rows (e.g., city, job_title, product_type)
- **High**: > 50% of rows (e.g., email, phone, transaction_id)
- **Unique**: 100% (primary keys, unique constraints)

### Why Cardinality Matters

The query optimizer uses cardinality to estimate:

1. Number of rows returned by filters
2. Whether to use an index or table scan
3. Which index to use (if multiple available)
4. Join order and join algorithms
5. Memory allocation for sorts and aggregations

```sql
-- Low cardinality: Table scan might be faster
SELECT * FROM employees WHERE gender = 'M';
-- Estimated: 50% of rows = 5,000 rows
-- Optimizer: Likely chooses table scan over index

-- High cardinality: Index is beneficial
SELECT * FROM employees WHERE email = 'john@example.com';
-- Estimated: 1 row (unique email)
-- Optimizer: Uses index for fast lookup

-- Composite cardinality
SELECT * FROM orders
WHERE customer_id = 123 AND order_date = '2024-01-15';
-- Optimizer estimates selectivity of combined predicates
```

### Database Statistics

Databases maintain statistics about data distribution to estimate cardinality:

#### PostgreSQL Statistics

```sql
-- Update statistics
ANALYZE employees;
ANALYZE VERBOSE employees;

-- View statistics
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'employees';

-- View column statistics
SELECT attname, n_distinct, most_common_vals, most_common_freqs
FROM pg_stats
WHERE tablename = 'employees' AND attname = 'department';

-- Adjust statistics target (more accurate, slower)
ALTER TABLE employees ALTER COLUMN department SET STATISTICS 1000;
ANALYZE employees;

-- View query plan with cardinality estimates
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM employees WHERE department = 'Engineering';
```

#### SQL Server Statistics

```sql
-- Update statistics
UPDATE STATISTICS employees;
UPDATE STATISTICS employees idx_employees_department;

-- Update with full scan (most accurate)
UPDATE STATISTICS employees WITH FULLSCAN;

-- View statistics info
DBCC SHOW_STATISTICS('employees', 'idx_employees_department');

-- Enable auto-update statistics (default)
ALTER DATABASE MyDatabase SET AUTO_UPDATE_STATISTICS ON;

-- Create statistics manually
CREATE STATISTICS stat_emp_hire_date ON employees(hire_date);

-- View estimated vs actual rows
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
```

#### MySQL Statistics

```sql
-- Update statistics
ANALYZE TABLE employees;

-- View statistics
SHOW INDEX FROM employees;

-- View cardinality estimates
SELECT TABLE_NAME, COLUMN_NAME, CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_NAME = 'employees';

-- MySQL 8.0+: Histograms for better estimates
ANALYZE TABLE employees UPDATE HISTOGRAM ON department, salary;

-- View histogram
SELECT * FROM INFORMATION_SCHEMA.COLUMN_STATISTICS
WHERE TABLE_NAME = 'employees';

-- Drop histogram
ANALYZE TABLE employees DROP HISTOGRAM ON department;
```

#### Oracle Statistics

```sql
-- Gather statistics (entire table)
EXEC DBMS_STATS.GATHER_TABLE_STATS('schema_name', 'employees');

-- Gather with specific options
EXEC DBMS_STATS.GATHER_TABLE_STATS(
  ownname => 'HR',
  tabname => 'EMPLOYEES',
  estimate_percent => 100,
  cascade => TRUE,
  method_opt => 'FOR ALL COLUMNS SIZE AUTO'
);

-- View statistics
SELECT NUM_ROWS, BLOCKS, AVG_ROW_LEN, LAST_ANALYZED
FROM USER_TABLES
WHERE TABLE_NAME = 'EMPLOYEES';

-- Column statistics
SELECT COLUMN_NAME, NUM_DISTINCT, DENSITY
FROM USER_TAB_COL_STATISTICS
WHERE TABLE_NAME = 'EMPLOYEES';

-- Delete statistics
EXEC DBMS_STATS.DELETE_TABLE_STATS('HR', 'EMPLOYEES');
```

### Selectivity and Cardinality

**Selectivity** = (Rows matching condition) / (Total rows)

```sql
-- Example calculations
-- Table: employees (10,000 rows)

-- Query 1: WHERE department = 'Engineering'
-- 2,000 engineering employees
-- Selectivity = 2,000 / 10,000 = 0.2 (20%)

-- Query 2: WHERE employee_id = 12345
-- 1 matching row
-- Selectivity = 1 / 10,000 = 0.0001 (0.01%)

-- Query 3: WHERE salary > 50000
-- 7,000 employees with salary > 50k
-- Selectivity = 7,000 / 10,000 = 0.7 (70%)
```

**Impact on Index Usage**:

```sql
-- High selectivity (< 5% of rows) → Use index
SELECT * FROM employees WHERE employee_id = 12345;
-- Selectivity: 0.01% → Index scan

-- Low selectivity (> 20% of rows) → Table scan
SELECT * FROM employees WHERE department = 'Engineering';
-- Selectivity: 20% → Likely table scan

-- Moderate selectivity (5-20%) → Depends
SELECT * FROM employees WHERE salary > 150000;
-- Selectivity: 8% → Index scan probably
```

### Multi-Column Cardinality

```sql
-- Individual cardinalities
SELECT COUNT(DISTINCT country) FROM customers;  -- 50 countries
SELECT COUNT(DISTINCT state) FROM customers;    -- 300 states
SELECT COUNT(DISTINCT city) FROM customers;     -- 5,000 cities

-- Combined cardinality
SELECT COUNT(DISTINCT country, state, city) FROM customers;
-- Result: 8,000 unique combinations

-- This affects composite index decisions
CREATE INDEX idx_customers_location
ON customers(country, state, city);
```

### Cardinality Problems and Solutions

#### Problem 1: Stale Statistics

```sql
-- Table has grown from 1M to 10M rows, but stats not updated
-- Optimizer thinks: "Only 1M rows, table scan is fine"
-- Reality: 10M rows, table scan is slow

-- Solution: Update statistics
ANALYZE employees;  -- PostgreSQL
UPDATE STATISTICS employees WITH FULLSCAN;  -- SQL Server
ANALYZE TABLE employees;  -- MySQL
EXEC DBMS_STATS.GATHER_TABLE_STATS('schema', 'employees');  -- Oracle
```

#### Problem 2: Data Skew

```sql
-- Uniform distribution assumption fails
-- Table: 1,000,000 customers
-- Country distribution:
--   'US': 900,000 (90%)
--   'UK': 50,000 (5%)
--   'Others': 50,000 (5%)

-- Query optimizer assumes even distribution (50 countries = 20,000 each)
SELECT * FROM customers WHERE country = 'US';
-- Estimate: 20,000 rows
-- Actual: 900,000 rows
-- Result: Wrong plan (index instead of table scan)

-- Solution: Histograms (MySQL 8.0+, SQL Server, Oracle, PostgreSQL)
ANALYZE TABLE customers UPDATE HISTOGRAM ON country;
```

#### Problem 3: Correlation Between Columns

```sql
-- Created_date and user_id are correlated
-- New users → recent dates
-- Old users → old dates

-- But optimizer treats them as independent

SELECT * FROM orders
WHERE user_id > 900000
  AND created_date < '2020-01-01';
-- Optimizer estimate: (10% users) * (20% dates) = 2% of rows
-- Actual: 0.01% of rows (new users = recent dates)
-- Result: Overestimated, wrong plan

-- Solution: Multi-column statistics (PostgreSQL)
CREATE STATISTICS stat_orders_user_date (dependencies)
ON user_id, created_date FROM orders;
ANALYZE orders;
```

### Best Practices for Cardinality

1. **Keep statistics up-to-date**

   ```sql
   -- Automate statistics updates
   -- PostgreSQL: autovacuum updates automatically
   -- SQL Server: AUTO_UPDATE_STATISTICS ON
   -- MySQL: ANALYZE TABLE in cron job
   -- Oracle: DBMS_STATS in scheduled job
   ```

2. **Use appropriate index types**

   ```sql
   -- Low cardinality: Consider bitmap (Oracle) or avoid indexing
   -- High cardinality: B-tree indexes work great
   -- Use INCLUDE for covering when needed
   ```

3. **Monitor query plans**

   ```sql
   -- Check estimated vs actual rows
   EXPLAIN (ANALYZE, BUFFERS) ...  -- PostgreSQL
   SET STATISTICS PROFILE ON; ...  -- SQL Server
   EXPLAIN ANALYZE ...  -- MySQL
   ```

4. **Consider filtered indexes for skewed data**
   ```sql
   -- Instead of indexing low-cardinality column
   CREATE INDEX idx_orders_pending
   ON orders(created_date)
   WHERE status = 'pending';
   ```

## Index Design Best Practices

### 1. Index Selectivity

Create indexes on columns with high selectivity:

```sql
-- ✅ Good: High selectivity (email is unique)
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- ✅ Good: High selectivity (many distinct values)
CREATE INDEX idx_orders_order_date ON orders(order_date);

-- ❌ Poor: Low selectivity (only 2-3 values)
CREATE INDEX idx_users_gender ON users(gender);
-- Table scan likely faster than index scan

-- ⚠️ Consider: Medium selectivity
CREATE INDEX idx_products_category ON products(category);
-- May or may not be beneficial depending on data distribution
```

### 2. Composite Index Design

```sql
-- Order columns by: equality → range → sort
CREATE INDEX idx_orders_search
ON orders(customer_id, status, order_date);

-- Good queries for this index:
SELECT * FROM orders
WHERE customer_id = 123 AND status = 'shipped'
ORDER BY order_date;

SELECT * FROM orders
WHERE customer_id = 123;

-- Poor query (can't use index efficiently):
SELECT * FROM orders
WHERE status = 'shipped';  -- Missing leftmost column

-- Column ordering guidelines:
-- 1. Most selective equality conditions first
-- 2. Range conditions next
-- 3. Sort columns last
-- 4. GROUP BY columns
```

### 3. Covering Indexes

Indexes that include all columns needed by a query (no table lookup required):

```sql
-- Query we want to optimize
SELECT order_id, order_date, total_amount
FROM orders
WHERE customer_id = 123 AND status = 'completed'
ORDER BY order_date DESC;

-- ❌ Partial coverage
CREATE INDEX idx_orders_customer_status
ON orders(customer_id, status);
-- Still needs to lookup table for order_date and total_amount

-- ✅ Covering index (PostgreSQL INCLUDE, SQL Server INCLUDE)
CREATE INDEX idx_orders_covering
ON orders(customer_id, status, order_date)
INCLUDE (total_amount);

-- ✅ Alternative: Include all columns in index
CREATE INDEX idx_orders_all
ON orders(customer_id, status, order_date, total_amount);
-- Trade-off: Larger index, but no table lookups
```

### 4. Partial/Filtered Indexes

Index only rows that match specific criteria:

```sql
-- PostgreSQL: Partial indexes
CREATE INDEX idx_orders_active
ON orders(customer_id, order_date)
WHERE status IN ('pending', 'processing');

-- Benefits:
-- - Smaller index (only active orders)
-- - Faster updates (inactive orders don't update index)
-- - Perfect for common query patterns

SELECT * FROM orders
WHERE customer_id = 123
  AND status = 'pending'
  AND order_date > '2024-01-01';
-- Uses partial index

-- SQL Server: Filtered indexes
CREATE NONCLUSTERED INDEX idx_products_discontinued
ON products(product_id, name)
WHERE discontinued = 0;

-- Only indexes active products (smaller, faster)

-- More examples
CREATE INDEX idx_customers_premium
ON customers(customer_id, last_purchase_date)
WHERE customer_tier = 'premium';

CREATE INDEX idx_logs_errors
ON logs(timestamp, message)
WHERE log_level = 'ERROR';
```

### 5. Index Column Order

```sql
-- ❌ Poor ordering
CREATE INDEX idx_sales_bad
ON sales(sales_amount, customer_id, sale_date);

-- Common query:
SELECT * FROM sales
WHERE customer_id = 123
  AND sale_date BETWEEN '2024-01-01' AND '2024-12-31';
-- Can't use index efficiently (customer_id not leftmost)

-- ✅ Good ordering
CREATE INDEX idx_sales_good
ON sales(customer_id, sale_date, sales_amount);

-- Now query can use index efficiently
```

### 6. Avoid Over-Indexing

```sql
-- ❌ Too many indexes hurt write performance
CREATE INDEX idx1 ON orders(customer_id);
CREATE INDEX idx2 ON orders(order_date);
CREATE INDEX idx3 ON orders(status);
CREATE INDEX idx4 ON orders(customer_id, order_date);
CREATE INDEX idx5 ON orders(customer_id, status);
CREATE INDEX idx6 ON orders(order_date, status);
CREATE INDEX idx7 ON orders(customer_id, order_date, status);
-- 7 indexes! Every INSERT/UPDATE/DELETE must update all

-- ✅ Strategic indexing
CREATE INDEX idx_orders_customer_date_status
ON orders(customer_id, order_date, status);

CREATE INDEX idx_orders_date_status
ON orders(order_date, status);
-- 2 well-designed indexes cover most query patterns
```

### 7. Monitor and Maintain Indexes

```sql
-- PostgreSQL: Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%';

-- SQL Server: Find unused indexes
SELECT OBJECT_NAME(i.object_id) AS table_name,
       i.name AS index_name,
       s.user_seeks,
       s.user_scans,
       s.user_updates
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s
  ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE s.user_seeks = 0
  AND s.user_scans = 0
  AND i.name IS NOT NULL;

-- MySQL: Find duplicate indexes
SELECT table_schema, table_name,
       GROUP_CONCAT(index_name) AS duplicate_indexes,
       GROUP_CONCAT(column_name ORDER BY seq_in_index) AS columns
FROM information_schema.statistics
WHERE table_schema = 'your_database'
GROUP BY table_schema, table_name,
         GROUP_CONCAT(column_name ORDER BY seq_in_index)
HAVING COUNT(*) > 1;
```

## Platform-Specific Features

### PostgreSQL

```sql
-- Expression indexes
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'john@example.com';

-- Partial indexes
CREATE INDEX idx_active_orders ON orders(order_date) WHERE status = 'active';

-- GIN indexes for full-text search
CREATE INDEX idx_docs_fts ON documents USING GIN(to_tsvector('english', content));

-- BRIN indexes for large time-series
CREATE INDEX idx_logs_brin ON logs USING BRIN(timestamp);

-- Concurrent index creation (no table locks)
CREATE INDEX CONCURRENTLY idx_users_created ON users(created_at);

-- Index-only scans (automatically used when possible)
CREATE INDEX idx_covering ON orders(customer_id) INCLUDE (order_date, amount);

-- REINDEX to rebuild
REINDEX INDEX idx_users_email;
REINDEX TABLE users;
```

### SQL Server

```sql
-- Filtered indexes
CREATE INDEX idx_active_products ON products(name)
WHERE is_active = 1 AND stock > 0;

-- Included columns (covering)
CREATE INDEX idx_orders_cust ON orders(customer_id)
INCLUDE (order_date, amount, status);

-- Columnstore indexes (analytics)
CREATE COLUMNSTORE INDEX idx_sales_columnstore ON sales;

-- Rebuild fragmented indexes
ALTER INDEX idx_users_email ON users REBUILD;

-- Reorganize (less intensive)
ALTER INDEX idx_users_email ON users REORGANIZE;

-- Find missing indexes
SELECT
    migs.avg_user_impact,
    migs.avg_total_user_cost,
    mid.statement,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs
  ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid
  ON mig.index_handle = mid.index_handle
ORDER BY migs.avg_user_impact DESC;
```

### MySQL

```sql
-- Full-text indexes
CREATE FULLTEXT INDEX idx_articles_content ON articles(title, content);

-- Prefix indexes (for long strings)
CREATE INDEX idx_urls_prefix ON urls(url(50));

-- Invisible indexes (MySQL 8.0+, test before dropping)
ALTER TABLE users ALTER INDEX idx_old_index INVISIBLE;
-- Monitor performance, then drop if no impact

-- Descending indexes (MySQL 8.0+)
CREATE INDEX idx_orders_date_desc ON orders(order_date DESC);

-- Multi-valued indexes for JSON (MySQL 8.0.17+)
CREATE INDEX idx_tags ON products((CAST(tags AS UNSIGNED ARRAY)));

-- Analyze and optimize
OPTIMIZE TABLE orders;
```

### Oracle

```sql
-- Bitmap indexes
CREATE BITMAP INDEX idx_products_category ON products(category);

-- Function-based indexes
CREATE INDEX idx_upper_name ON customers(UPPER(last_name));

-- Reverse key indexes (reduce contention)
CREATE INDEX idx_orders_id_reverse ON orders(order_id) REVERSE;

-- Compressed indexes
CREATE INDEX idx_sales_compressed ON sales(customer_id, product_id) COMPRESS 2;

-- Invisible indexes (test impact)
ALTER INDEX idx_old_index INVISIBLE;

-- Rebuild online
ALTER INDEX idx_users_email REBUILD ONLINE;

-- Monitor index usage
SELECT index_name, monitoring, used
FROM v$object_usage
WHERE table_name = 'EMPLOYEES';
```

## Common Pitfalls

### 1. Indexing Low-Cardinality Columns

```sql
-- ❌ Bad: Only 2-3 values
CREATE INDEX idx_users_active ON users(is_active);
-- Better: Partial index if you only query one value
CREATE INDEX idx_inactive_users ON users(user_id) WHERE is_active = false;
```

### 2. Not Considering Write Cost

```sql
-- ❌ Too many indexes
CREATE INDEX idx1 ON orders(customer_id);
CREATE INDEX idx2 ON orders(product_id);
CREATE INDEX idx3 ON orders(order_date);
CREATE INDEX idx4 ON orders(status);
CREATE INDEX idx5 ON orders(customer_id, order_date);
-- Every INSERT updates 5+ indexes!

-- ✅ Balance read and write performance
-- Keep only indexes that significantly improve common queries
```

### 3. Wrong Column Order

```sql
-- ❌ Bad: Range column first
CREATE INDEX idx_orders_bad ON orders(order_date, customer_id);

SELECT * FROM orders WHERE customer_id = 123;
-- Can't use index efficiently

-- ✅ Good: Equality column first
CREATE INDEX idx_orders_good ON orders(customer_id, order_date);
```

### 4. Forgetting Index Maintenance

```sql
-- Indexes become fragmented over time
-- PostgreSQL: REINDEX
REINDEX INDEX idx_users_email;

-- SQL Server: REBUILD
ALTER INDEX idx_users_email ON users REBUILD;

-- Monitor fragmentation
SELECT avg_fragmentation_in_percent, index_id
FROM sys.dm_db_index_physical_stats(DB_ID(), OBJECT_ID('users'), NULL, NULL, 'DETAILED');
```

## Performance Monitoring

### Identify Missing Indexes

```sql
-- SQL Server: Missing index suggestions
SELECT
    CONVERT(decimal(18,2), migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans)) AS improvement_measure,
    'CREATE INDEX idx_' + REPLACE(REPLACE(REPLACE(mid.equality_columns, ', ', '_'), '[', ''), ']', '')
    + ' ON ' + mid.statement + ' (' + ISNULL(mid.equality_columns, '')
    + CASE WHEN mid.inequality_columns IS NOT NULL THEN ',' + mid.inequality_columns ELSE '' END + ')'
    + CASE WHEN mid.included_columns IS NOT NULL THEN ' INCLUDE (' + mid.included_columns + ')' ELSE '' END AS create_statement
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
ORDER BY improvement_measure DESC;
```

### Find Unused Indexes

```sql
-- PostgreSQL
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- SQL Server
SELECT OBJECT_NAME(i.object_id) AS table_name,
       i.name AS index_name,
       i.type_desc,
       s.user_seeks + s.user_scans + s.user_lookups AS reads,
       s.user_updates AS writes,
       (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id = i.object_id AND p.index_id = i.index_id) AS rows
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s ON i.object_id = s.object_id AND i.index_id = s.index_id AND s.database_id = DB_ID()
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
  AND i.index_id > 0
  AND (s.user_seeks + s.user_scans + s.user_lookups = 0 OR s.user_seeks IS NULL)
ORDER BY writes DESC;
```

### Monitor Index Fragmentation

```sql
-- SQL Server
SELECT
    OBJECT_NAME(ips.object_id) AS table_name,
    i.name AS index_name,
    ips.index_type_desc,
    ips.avg_fragmentation_in_percent,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'DETAILED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
  AND ips.page_count > 1000
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- Rebuild if > 30% fragmented
-- Reorganize if 10-30% fragmented
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Query Performance](/concepts/performance/) - Query optimization techniques
- [Table Design](/concepts/tables/) - Table structure best practices
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [Aggregations](/concepts/aggregations/) - GROUP BY and aggregate functions
