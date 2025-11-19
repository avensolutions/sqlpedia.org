---
title: Query Performance & Optimization
description: Comprehensive guide to SQL query performance, optimizers, EXPLAIN plans, cost-based vs rule-based optimization, and query tuning patterns
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, BigQuery, Snowflake, DuckDB]
difficulty: advanced
tags: [performance, optimization, explain, cost-based, rule-based, query-tuning, indexes, execution-plans]
---

# Query Performance & Optimization

<div class="difficulty-badge difficulty-advanced">Advanced</div>

## Quick Reference

```sql
-- PostgreSQL: EXPLAIN and ANALYZE
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT * FROM orders;

-- MySQL: EXPLAIN
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
EXPLAIN FORMAT=JSON SELECT * FROM orders WHERE customer_id = 123;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;  -- MySQL 8.0.18+

-- SQL Server: Execution Plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SET SHOWPLAN_TEXT ON;
SELECT * FROM orders WHERE customer_id = 123;

-- Oracle: EXPLAIN PLAN
EXPLAIN PLAN FOR SELECT * FROM orders WHERE customer_id = 123;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Common optimization patterns
-- Use indexes effectively
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Avoid SELECT *
SELECT order_id, customer_id, amount FROM orders;  -- Better than SELECT *

-- Use WHERE filters early
SELECT * FROM large_table WHERE indexed_column = 'value';  -- Filters first

-- Limit result sets
SELECT * FROM orders WHERE customer_id = 123 LIMIT 100;
```

## Overview

SQL query performance optimization is the process of making database queries execute faster and use fewer resources. Understanding how the database query optimizer works and how to analyze execution plans is essential for writing efficient queries.

**Key Concepts**:
- **Query Optimizer**: The database component that chooses the best execution plan
- **Execution Plan**: The step-by-step strategy the database uses to execute a query
- **Cost Model**: Mathematical estimates of resource consumption (CPU, I/O, memory)
- **Statistics**: Metadata about data distribution that guides optimization decisions
- **Query Tuning**: The practice of improving query performance through various techniques

**Why Performance Matters**:
- **User Experience**: Faster queries mean responsive applications
- **Resource Efficiency**: Optimized queries use less CPU, memory, and I/O
- **Scalability**: Efficient queries handle larger datasets and more concurrent users
- **Cost Savings**: Lower resource consumption reduces infrastructure costs

## Query Optimizers

The query optimizer is the "brain" of the database that transforms your SQL query into an efficient execution plan. It evaluates multiple possible strategies and chooses the one with the lowest estimated cost.

### How Optimizers Work

```
SQL Query → Parser → Optimizer → Execution Plan → Executor → Results
              ↓          ↓
         Syntax Tree  Statistics
                      Indexes
                      Constraints
```

**Optimization Process**:
1. **Parsing**: Convert SQL text to internal representation
2. **Rewriting**: Apply logical transformations (view expansion, subquery flattening)
3. **Plan Generation**: Create possible execution strategies
4. **Cost Estimation**: Calculate resource consumption for each plan
5. **Plan Selection**: Choose the plan with lowest estimated cost
6. **Execution**: Carry out the selected plan

### Cost-Based Optimization (CBO)

Cost-based optimizers use statistics about data distribution to estimate the "cost" of different execution plans. The plan with the lowest cost is selected.

**How CBO Works**:

```sql
-- Example query
SELECT *
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01'
  AND c.country = 'USA';

-- Optimizer considerations:
-- 1. How many rows match order_date >= '2024-01-01'? (cardinality estimation)
-- 2. How many customers are in USA? (statistics)
-- 3. Is there an index on order_date? (index availability)
-- 4. Is there an index on customer_id? (join optimization)
-- 5. What's the table size? (scan vs seek decision)
-- 6. What join algorithm to use? (nested loop, hash, merge)
```

**Cost Factors**:

```sql
-- CPU Cost: Number of rows processed, comparisons, hash calculations
-- I/O Cost: Number of disk reads (page reads)
-- Memory Cost: Sort buffers, hash tables, temp space
-- Network Cost: Data transfer (distributed databases)

-- Example: Simple table scan
-- Cost = (pages_to_read * seq_page_cost) + (rows * cpu_tuple_cost)

-- Example: Index scan
-- Cost = (index_pages * random_page_cost) + (rows * cpu_index_tuple_cost)
```

**Statistics Used by CBO**:

```sql
-- PostgreSQL: View table statistics
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'orders';

-- View column statistics
SELECT
  attname AS column_name,
  n_distinct,
  most_common_vals,
  most_common_freqs,
  correlation
FROM pg_stats
WHERE tablename = 'orders';

-- Update statistics
ANALYZE orders;
ANALYZE VERBOSE orders;

-- SQL Server: View statistics
DBCC SHOW_STATISTICS('orders', 'idx_orders_customer');

-- Update statistics
UPDATE STATISTICS orders WITH FULLSCAN;

-- MySQL: View statistics
SHOW INDEX FROM orders;
ANALYZE TABLE orders;

-- Oracle: Gather statistics
EXEC DBMS_STATS.GATHER_TABLE_STATS('schema_name', 'orders');
```

#### CBO Examples

```sql
-- PostgreSQL cost estimation example
EXPLAIN SELECT * FROM orders WHERE order_date >= '2024-01-01';
/*
Seq Scan on orders  (cost=0.00..1823.00 rows=5000 width=100)
  Filter: (order_date >= '2024-01-01'::date)

Breakdown:
- cost=0.00..1823.00: Startup cost..total cost
- rows=5000: Estimated rows returned
- width=100: Average row size in bytes
*/

-- With index available
CREATE INDEX idx_orders_date ON orders(order_date);
EXPLAIN SELECT * FROM orders WHERE order_date >= '2024-01-01';
/*
Index Scan using idx_orders_date on orders  (cost=0.29..425.50 rows=5000 width=100)
  Index Cond: (order_date >= '2024-01-01'::date)

Lower cost (425.50 vs 1823.00) → optimizer chooses index scan
*/

-- CBO choosing between plans
-- Low selectivity (many rows): Table scan
EXPLAIN SELECT * FROM orders WHERE status = 'pending';  -- 40% of rows
/*
Seq Scan on orders  (cost=0.00..1823.00 rows=40000 width=100)
*/

-- High selectivity (few rows): Index scan
EXPLAIN SELECT * FROM orders WHERE order_id = 12345;  -- 1 row
/*
Index Scan using orders_pkey on orders  (cost=0.29..8.31 rows=1 width=100)
*/

-- Complex join optimization
EXPLAIN SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01'
  AND c.country = 'USA';
/*
Hash Join  (cost=125.50..2845.25 rows=1250 width=150)
  Hash Cond: (o.customer_id = c.customer_id)
  ->  Index Scan using idx_orders_date on orders o  (cost=0.29..425.50 rows=5000)
        Index Cond: (order_date >= '2024-01-01'::date)
  ->  Hash  (cost=100.00..100.00 rows=2000 width=50)
        ->  Seq Scan on customers c  (cost=0.00..100.00 rows=2000)
              Filter: (country = 'USA'::text)

Optimizer chose:
1. Index scan on orders (filter by date)
2. Sequential scan on customers (filter by country)
3. Hash join algorithm
*/
```

### Rule-Based Optimization (RBO)

Rule-based optimizers use predefined heuristics and rules to choose execution plans. They don't use statistics about data distribution.

**How RBO Works**:
- Apply fixed rules to transform queries
- Choose plans based on syntax patterns
- No consideration of actual data distribution
- Predictable but often suboptimal

**RBO Rules (Historical - Oracle pre-10g)**:

```
Priority Order (Lower is Better):
1. Single row by ROWID
2. Single row by cluster join
3. Single row by hash cluster key with unique or primary key
4. Single row by unique or primary key
5. Cluster join
6. Hash cluster key
7. Indexed cluster key
8. Composite index
9. Single-column indexes
10. Bounded range search on indexed columns
11. Unbounded range search on indexed columns
12. Sort-merge join
13. MAX or MIN of indexed column
14. ORDER BY on indexed column
15. Full table scan
```

**RBO Examples**:

```sql
-- Oracle RBO (deprecated, pre-10g)
-- Always prefers index scan over table scan, regardless of selectivity

-- Low selectivity (80% of rows match) - RBO still uses index (inefficient!)
SELECT * FROM orders WHERE status = 'completed';
-- RBO: Index scan (slow for many rows)
-- CBO: Table scan (faster for many rows)

-- Rule: Always use index if available, even when wrong choice

-- Multiple indexes available
SELECT * FROM orders
WHERE order_date >= '2024-01-01'  -- Index A
  AND customer_id = 123;           -- Index B

-- RBO: Uses first index based on rule priority
-- CBO: Estimates both options, chooses based on statistics
```

### Cost-Based vs Rule-Based Comparison

| Aspect | Cost-Based Optimizer (CBO) | Rule-Based Optimizer (RBO) |
|--------|---------------------------|---------------------------|
| **Decision Basis** | Statistics and data distribution | Fixed rules and heuristics |
| **Statistics Required** | Yes, critical | No |
| **Adaptability** | Adapts to data changes | Fixed behavior |
| **Predictability** | Can change with data | Always the same |
| **Performance** | Generally superior | Can be suboptimal |
| **Maintenance** | Requires statistics updates | No maintenance |
| **Usage** | Modern databases | Obsolete (pre-2000s) |
| **Examples** | All modern DBs | Oracle 9i and earlier |

```sql
-- Why CBO is superior: Example scenario

-- Table: orders (1,000,000 rows)
-- status distribution: 'completed' (950,000), 'pending' (30,000), 'cancelled' (20,000)

-- Query 1: Find completed orders (95% of data)
SELECT * FROM orders WHERE status = 'completed';

-- RBO: Uses index on status (reads 950,000 index entries + 950,000 table lookups)
-- Cost: ~1,900,000 I/O operations

-- CBO: Sees 95% selectivity, chooses table scan
-- Cost: ~10,000 I/O operations (scanning entire table sequentially)
-- Winner: CBO (190x faster!)

-- Query 2: Find cancelled orders (2% of data)
SELECT * FROM orders WHERE status = 'cancelled';

-- RBO: Uses index (reads 20,000 index entries + 20,000 lookups)
-- Cost: ~40,000 I/O operations

-- CBO: Sees 2% selectivity, chooses index scan
-- Cost: ~40,000 I/O operations
-- Winner: TIE (both make same choice)

-- Query 3: Complex join with filters
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'pending'
  AND c.country = 'USA'
  AND o.order_date >= '2024-01-01';

-- RBO: Fixed rule-based join order, doesn't consider data distribution
-- Might join all orders with all customers, then filter
-- Cost: Very high

-- CBO: Estimates selectivity of each filter, optimizes join order
-- Filters to 3,000 pending orders, 50,000 USA customers
-- Chooses hash join with filtered datasets
-- Cost: Much lower
-- Winner: CBO (could be 10-100x faster)
```

**Modern Reality**:
- **All modern databases use CBO**: PostgreSQL, MySQL 5.7+, SQL Server, Oracle 10g+, DB2, BigQuery, Snowflake, etc.
- **RBO is obsolete**: Oracle deprecated it in 10g (2003), removed in 11g
- **Statistics are critical**: CBO is only as good as its statistics

## EXPLAIN Plans

EXPLAIN shows you the execution plan the optimizer has chosen. Understanding EXPLAIN output is essential for query optimization.

### PostgreSQL EXPLAIN

```sql
-- Basic EXPLAIN (shows plan without executing)
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- EXPLAIN ANALYZE (executes query and shows actual performance)
EXPLAIN ANALYZE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';

-- Full details with all options
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, COSTS, TIMING)
SELECT * FROM orders WHERE customer_id = 123;

-- JSON format (easier to parse programmatically)
EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 123;
```

**Reading PostgreSQL EXPLAIN Output**:

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE order_date >= '2024-01-01';

/*
Index Scan using idx_orders_date on orders  (cost=0.29..425.50 rows=5000 width=100) (actual time=0.123..12.456 rows=4823 loops=1)
  Index Cond: (order_date >= '2024-01-01'::date)
  Buffers: shared hit=234 read=45
Planning Time: 0.234 ms
Execution Time: 13.567 ms

Breaking it down:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cost=0.29..425.50    Estimated costs (startup..total)
rows=5000            Estimated rows returned
width=100            Average row width in bytes
actual time=0.123..12.456   Actual time (first row..last row) in ms
rows=4823            Actual rows returned
loops=1              Number of times this node executed
Buffers: shared hit=234   Pages found in cache (fast)
Buffers: read=45     Pages read from disk (slow)
Planning Time        Time spent optimizing
Execution Time       Total time to execute
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
```

**PostgreSQL Join Examples**:

```sql
-- Nested Loop Join (good for small datasets, indexed joins)
EXPLAIN ANALYZE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_id = 12345;
/*
Nested Loop  (cost=0.57..16.62 rows=1 width=150)
  ->  Index Scan using orders_pkey on orders o  (cost=0.29..8.31 rows=1)
        Index Cond: (order_id = 12345)
  ->  Index Scan using customers_pkey on customers c  (cost=0.29..8.30 rows=1)
        Index Cond: (customer_id = o.customer_id)

For each order (1 row), look up customer by index
Good for small result sets
*/

-- Hash Join (good for large datasets)
EXPLAIN ANALYZE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';
/*
Hash Join  (cost=1500.00..8500.00 rows=5000 width=150)
  Hash Cond: (o.customer_id = c.customer_id)
  ->  Seq Scan on orders o  (cost=0.00..2500.00 rows=5000)
        Filter: (order_date >= '2024-01-01')
  ->  Hash  (cost=1000.00..1000.00 rows=50000)
        ->  Seq Scan on customers c  (cost=0.00..1000.00 rows=50000)

Build hash table from customers, probe with orders
Good for larger datasets
*/

-- Merge Join (good for pre-sorted data)
EXPLAIN ANALYZE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.customer_id;
/*
Merge Join  (cost=0.84..5234.56 rows=100000 width=150)
  Merge Cond: (o.customer_id = c.customer_id)
  ->  Index Scan using idx_orders_customer on orders o  (cost=0.42..3000.00 rows=100000)
  ->  Index Scan using customers_pkey on customers c  (cost=0.42..1500.00 rows=50000)

Both inputs sorted by join key, merge together
Efficient when inputs are already sorted
*/
```

**Common PostgreSQL Plan Nodes**:

```sql
-- Sequential Scan: Full table scan
Seq Scan on orders  (cost=0.00..1823.00 rows=100000 width=100)
-- Reads every row in the table

-- Index Scan: Use index + fetch rows
Index Scan using idx_orders_date on orders  (cost=0.29..425.50 rows=5000)
-- Uses index to find rows, fetches from table

-- Index Only Scan: Data in index (no table fetch)
Index Only Scan using idx_orders_customer_date on orders  (cost=0.29..245.50 rows=5000)
-- All needed columns in index, no table access

-- Bitmap Index Scan + Bitmap Heap Scan
Bitmap Heap Scan on orders  (cost=123.45..987.65 rows=5000)
  Recheck Cond: (status = 'pending')
  ->  Bitmap Index Scan on idx_orders_status  (cost=0.00..122.20 rows=5000)
        Index Cond: (status = 'pending')
-- Creates bitmap of matching pages, then scans those pages

-- CTE Scan: Scanning a CTE result
CTE Scan on order_totals  (cost=0.00..40.00 rows=2000)
-- Scans results of a Common Table Expression

-- Aggregate: Grouping/aggregation
HashAggregate  (cost=1500.00..1600.00 rows=100)
  Group Key: customer_id
  ->  Seq Scan on orders
-- Hash-based grouping for GROUP BY

-- Sort: Sorting operation
Sort  (cost=1234.56..1284.56 rows=20000 width=100)
  Sort Key: order_date DESC
  ->  Seq Scan on orders
-- Sorts result set

-- Limit: Limit rows returned
Limit  (cost=0.29..25.50 rows=100)
  ->  Index Scan using idx_orders_date on orders
-- Returns only first N rows
```

### MySQL EXPLAIN

```sql
-- Basic EXPLAIN
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- JSON format (more detailed)
EXPLAIN FORMAT=JSON SELECT * FROM orders WHERE customer_id = 123;

-- Tree format (MySQL 8.0.16+)
EXPLAIN FORMAT=TREE SELECT * FROM orders WHERE customer_id = 123;

-- EXPLAIN ANALYZE (executes and shows actual performance - MySQL 8.0.18+)
EXPLAIN ANALYZE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';
```

**Reading MySQL EXPLAIN Output**:

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 123\G

/*
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: orders
   partitions: NULL
         type: ref                    ← Access type (IMPORTANT!)
possible_keys: idx_orders_customer    ← Indexes considered
          key: idx_orders_customer    ← Index actually used
      key_len: 4                      ← Bytes of index used
          ref: const                  ← What's being compared
         rows: 15                     ← Estimated rows examined
     filtered: 100.00                 ← % of rows after filter
        Extra: Using index condition ← Additional info
*/
```

**MySQL Access Types (best to worst)**:

```sql
-- system: Table has 0 or 1 row (const table)
-- const: Lookup by primary key or unique index (best for lookups)
EXPLAIN SELECT * FROM orders WHERE order_id = 12345;
-- type: const

-- eq_ref: One row per join (best for joins)
EXPLAIN SELECT * FROM orders o JOIN customers c ON o.customer_id = c.customer_id;
-- type: eq_ref (for customers)

-- ref: Multiple rows with same index value
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
-- type: ref

-- range: Index range scan
EXPLAIN SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
-- type: range

-- index: Full index scan (better than ALL, but not great)
EXPLAIN SELECT customer_id FROM orders;
-- type: index

-- ALL: Full table scan (worst, avoid when possible)
EXPLAIN SELECT * FROM orders WHERE YEAR(order_date) = 2024;
-- type: ALL (function on column prevents index use)
```

**MySQL Extra Column Values**:

```sql
-- Using index: Index-only scan (good!)
EXPLAIN SELECT customer_id FROM orders WHERE customer_id > 100;
-- Extra: Using index

-- Using where: Filter applied after read
EXPLAIN SELECT * FROM orders WHERE status = 'completed';
-- Extra: Using where

-- Using index condition: Index Condition Pushdown (ICP)
EXPLAIN SELECT * FROM orders WHERE customer_id > 100 AND amount > 1000;
-- Extra: Using index condition

-- Using temporary: Creates temp table (expensive)
EXPLAIN SELECT DISTINCT customer_id FROM orders;
-- Extra: Using temporary

-- Using filesort: Sort operation (expensive for large datasets)
EXPLAIN SELECT * FROM orders ORDER BY amount DESC;
-- Extra: Using filesort

-- Using join buffer: Join buffering needed
EXPLAIN SELECT * FROM orders o JOIN customers c ON o.amount > c.credit_limit;
-- Extra: Using join buffer (hash join or block nested loop)
```

**MySQL Join Examples**:

```sql
-- Nested Loop Join (MySQL default for small result sets)
EXPLAIN FORMAT=TREE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_id = 12345;
/*
-> Nested loop inner join
    -> Index lookup on o using PRIMARY (order_id=12345)
    -> Single-row index lookup on c using PRIMARY (customer_id=o.customer_id)
*/

-- Hash Join (MySQL 8.0.18+)
EXPLAIN FORMAT=TREE
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';
/*
-> Inner hash join (c.customer_id = o.customer_id)
    -> Table scan on c
    -> Hash
        -> Index range scan on o using idx_orders_date
*/

-- Block Nested Loop (older MySQL, no hash join)
EXPLAIN
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
/*
Extra: Using join buffer (Block Nested Loop)
Uses memory buffer to reduce I/O
*/
```

### SQL Server Execution Plans

```sql
-- Text execution plan
SET SHOWPLAN_TEXT ON;
GO
SELECT * FROM orders WHERE customer_id = 123;
GO
SET SHOWPLAN_TEXT OFF;

-- XML execution plan (most detailed)
SET SHOWPLAN_XML ON;
GO
SELECT * FROM orders WHERE customer_id = 123;
GO
SET SHOWPLAN_XML OFF;

-- Actual execution plan with statistics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SELECT * FROM orders WHERE customer_id = 123;
/*
SQL Server Execution Times:
   CPU time = 15 ms,  elapsed time = 23 ms.

Table 'orders'. Scan count 1, logical reads 145, physical reads 3,
read-ahead reads 0, lob logical reads 0, lob physical reads 0.
*/

-- Include actual execution plan (graphical in SSMS)
SET STATISTICS PROFILE ON;
```

**Reading SQL Server Plans**:

```sql
-- Clustered Index Seek (best for single/few rows)
|--Clustered Index Seek(OBJECT:([orders].[PK_orders]),
    SEEK:([customer_id]=(123)), ORDERED FORWARD)
-- Cost: 0.003

-- Clustered Index Scan (table scan via clustered index)
|--Clustered Index Scan(OBJECT:([orders].[PK_orders]))
-- Cost: 0.523 (higher = worse)

-- Nonclustered Index Seek + Key Lookup
|--Nested Loops(Inner Join, OUTER REFERENCES:([Bmk1000]))
    |--Index Seek(OBJECT:([orders].[idx_customer]))
    |--RID Lookup(OBJECT:([orders]), SEEK:([Bmk1000]))
-- Index seek + lookup to clustered index/heap

-- Hash Match (Hash Join)
|--Hash Match(Inner Join, HASH:([c].[customer_id])=([o].[customer_id]))
    |--Clustered Index Scan(OBJECT:([customers]))
    |--Clustered Index Scan(OBJECT:([orders]))
-- Build hash table, probe with second input

-- Merge Join
|--Merge Join(Inner Join, MERGE:([c].[customer_id])=([o].[customer_id]))
    |--Clustered Index Scan(OBJECT:([customers]), ORDERED FORWARD)
    |--Clustered Index Scan(OBJECT:([orders]), ORDERED FORWARD)
-- Both inputs sorted, merge together
```

**SQL Server Statistics**:

```sql
-- Logical reads: Pages read from buffer cache (fast)
-- Physical reads: Pages read from disk (slow)
-- Read-ahead reads: Pages pre-fetched

-- Good query (mostly logical reads)
Table 'orders'. Scan count 1, logical reads 5, physical reads 0
-- All data in cache

-- Poor query (many physical reads)
Table 'orders'. Scan count 1, logical reads 15234, physical reads 8932
-- Lots of disk I/O, needs optimization

-- Scan count: Number of seeks/scans performed
-- High scan count in loops = potential problem
```

### Oracle EXPLAIN PLAN

```sql
-- Generate execution plan
EXPLAIN PLAN FOR
SELECT * FROM orders WHERE customer_id = 123;

-- Display the plan
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Display with runtime statistics
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));

-- Autotrace (SQL*Plus)
SET AUTOTRACE ON EXPLAIN;
SELECT * FROM orders WHERE customer_id = 123;

-- Plan with actual execution
SET AUTOTRACE TRACEONLY STATISTICS;
```

**Reading Oracle Plans**:

```sql
EXPLAIN PLAN FOR SELECT * FROM orders WHERE order_date >= DATE '2024-01-01';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

/*
---------------------------------------------------------------------------
| Id  | Operation                    | Name           | Rows  | Cost (%CPU)|
---------------------------------------------------------------------------
|   0 | SELECT STATEMENT            |                |  5000 |   245 (0)   |
|*  1 |  INDEX RANGE SCAN           | IDX_ORDERS_DATE|  5000 |   245 (0)   |
---------------------------------------------------------------------------

Predicate Information (identified by operation id):
---------------------------------------------------
   1 - access("ORDER_DATE">=TO_DATE('2024-01-01','YYYY-MM-DD'))

Notes:
- Cost: Estimated resource consumption (lower is better)
- Rows: Estimated cardinality
- Operation: Type of access (INDEX RANGE SCAN, TABLE ACCESS FULL, etc.)
*/
```

**Oracle Access Methods**:

```sql
-- INDEX UNIQUE SCAN: Lookup by unique index
SELECT * FROM orders WHERE order_id = 12345;

-- INDEX RANGE SCAN: Range scan on index
SELECT * FROM orders WHERE order_date >= DATE '2024-01-01';

-- INDEX FULL SCAN: Full scan of index (sorted order)
SELECT customer_id FROM orders ORDER BY customer_id;

-- TABLE ACCESS BY INDEX ROWID: Index seek + row fetch
SELECT * FROM orders WHERE customer_id = 123;

-- TABLE ACCESS FULL: Full table scan
SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024;

-- HASH JOIN: Hash-based join
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.customer_id;

-- NESTED LOOPS: Nested loop join
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_id = 12345;

-- MERGE JOIN: Sort-merge join
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.customer_id
ORDER BY c.customer_id;
```

## Query Tuning Patterns

Practical techniques for improving query performance.

### 1. Index Optimization

```sql
-- ❌ Bad: Missing index on filter column
SELECT * FROM orders WHERE customer_id = 123;
-- Full table scan

-- ✅ Good: Add appropriate index
CREATE INDEX idx_orders_customer ON orders(customer_id);
SELECT * FROM orders WHERE customer_id = 123;
-- Index seek (much faster)

-- ❌ Bad: Function on indexed column prevents index use
SELECT * FROM orders WHERE YEAR(order_date) = 2024;
-- Full table scan

-- ✅ Good: Rewrite to allow index use
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
  AND order_date < '2025-01-01';
-- Index range scan

-- ❌ Bad: OR condition may not use indexes efficiently
SELECT * FROM orders
WHERE customer_id = 123 OR order_date >= '2024-01-01';
-- Might scan table

-- ✅ Good: Use UNION for better index usage
SELECT * FROM orders WHERE customer_id = 123
UNION
SELECT * FROM orders WHERE order_date >= '2024-01-01';
-- Uses both indexes

-- Covering index (index includes all needed columns)
CREATE INDEX idx_orders_covering
ON orders(customer_id, order_date)
INCLUDE (amount, status);

SELECT customer_id, order_date, amount, status
FROM orders
WHERE customer_id = 123;
-- Index-only scan (no table access needed)
```

### 2. Query Rewriting

```sql
-- ❌ Bad: SELECT *
SELECT * FROM orders WHERE customer_id = 123;
-- Retrieves all columns (more I/O, larger result set)

-- ✅ Good: Select only needed columns
SELECT order_id, order_date, amount
FROM orders
WHERE customer_id = 123;
-- Less I/O, smaller result set

-- ❌ Bad: Correlated subquery
SELECT
  c.customer_name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) as order_count
FROM customers c;
-- Executes subquery for EACH customer

-- ✅ Good: JOIN instead
SELECT
  c.customer_name,
  COUNT(o.order_id) as order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name;
-- Single scan of each table

-- ❌ Bad: IN with large subquery
SELECT * FROM orders
WHERE customer_id IN (
  SELECT customer_id FROM customers WHERE country = 'USA'
);
-- May execute subquery first, then lookup each

-- ✅ Good: JOIN (often better optimized)
SELECT o.*
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.country = 'USA';
-- Optimizer can choose best join algorithm

-- ❌ Bad: DISTINCT to fix duplicates from bad join
SELECT DISTINCT o.order_id, o.amount
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id;
-- Extra sorting/grouping to remove duplicates

-- ✅ Good: Use EXISTS or proper aggregation
SELECT o.order_id, o.amount
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id
);
-- No duplicates to remove
```

### 3. Join Optimization

```sql
-- ❌ Bad: Joining before filtering
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01'
  AND c.country = 'USA';
-- Joins all rows, then filters

-- ✅ Good: Filter early with CTEs or derived tables
WITH recent_orders AS (
  SELECT * FROM orders WHERE order_date >= '2024-01-01'
),
usa_customers AS (
  SELECT * FROM customers WHERE country = 'USA'
)
SELECT o.*, c.customer_name
FROM recent_orders o
JOIN usa_customers c ON o.customer_id = c.customer_id;
-- Filters first, reduces join size

-- ❌ Bad: Multiple small queries (N+1 problem)
-- In application code:
-- orders = SELECT * FROM orders WHERE customer_id = 123;
-- for each order:
--   customer = SELECT * FROM customers WHERE customer_id = order.customer_id;
-- 1 query + N queries = N+1 queries

-- ✅ Good: Single query with JOIN
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.customer_id = 123;
-- 1 query total

-- Join order optimization (optimizer usually handles this)
-- Small table first (build hash table from smaller dataset)
SELECT o.*
FROM
  small_lookup_table s
  JOIN large_fact_table o ON s.id = o.lookup_id
WHERE s.category = 'X';

-- Use STRAIGHT_JOIN (MySQL) or hints to force join order if needed
SELECT STRAIGHT_JOIN o.*
FROM small_table s
JOIN large_table l ON s.id = l.small_id;
```

### 4. Aggregation Optimization

```sql
-- ❌ Bad: Counting all rows when you just need to know if any exist
SELECT COUNT(*) FROM orders WHERE customer_id = 123;
-- Counts all matching rows

-- ✅ Good: Use EXISTS for existence check
SELECT EXISTS (SELECT 1 FROM orders WHERE customer_id = 123 LIMIT 1);
-- Stops after finding first row

-- ❌ Bad: Multiple aggregate queries
SELECT COUNT(*) FROM orders WHERE status = 'completed';
SELECT COUNT(*) FROM orders WHERE status = 'pending';
SELECT COUNT(*) FROM orders WHERE status = 'cancelled';
-- 3 table scans

-- ✅ Good: Single query with conditional aggregation
SELECT
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM orders;
-- 1 table scan

-- ❌ Bad: Aggregating before filtering
SELECT customer_id, SUM(amount) as total
FROM orders
GROUP BY customer_id
HAVING SUM(amount) > 10000;
-- Aggregates all customers, then filters

-- ✅ Good: Use indexed views or materialized views for repeated aggregations
CREATE MATERIALIZED VIEW customer_totals AS
SELECT customer_id, SUM(amount) as total_spent
FROM orders
GROUP BY customer_id;

SELECT * FROM customer_totals WHERE total_spent > 10000;
-- Pre-computed aggregates
```

### 5. Pagination Optimization

```sql
-- ❌ Bad: OFFSET with large values
SELECT * FROM orders
ORDER BY order_date DESC
LIMIT 100 OFFSET 1000000;
-- Still scans first 1,000,100 rows, discards 1,000,000

-- ✅ Good: Keyset pagination (cursor-based)
-- Page 1
SELECT * FROM orders
WHERE order_date <= '2024-12-31'
ORDER BY order_date DESC, order_id DESC
LIMIT 100;

-- Page 2 (using last row from page 1: date='2024-11-15', id=50000)
SELECT * FROM orders
WHERE (order_date < '2024-11-15')
   OR (order_date = '2024-11-15' AND order_id < 50000)
ORDER BY order_date DESC, order_id DESC
LIMIT 100;
-- Only scans rows needed for current page

-- ✅ Alternative: Indexed sort with range
CREATE INDEX idx_orders_date_id ON orders(order_date DESC, order_id DESC);

SELECT * FROM orders
WHERE order_id > :last_seen_id
ORDER BY order_id
LIMIT 100;
-- Efficient for ID-based pagination
```

### 6. Subquery Optimization

```sql
-- ❌ Bad: Scalar subquery in SELECT
SELECT
  o.order_id,
  (SELECT customer_name FROM customers WHERE customer_id = o.customer_id) as customer_name
FROM orders o
WHERE o.order_date >= '2024-01-01';
-- Subquery executes for each row

-- ✅ Good: JOIN
SELECT o.order_id, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2024-01-01';
-- Single pass through customers

-- ❌ Bad: Non-correlated subquery not materialized
SELECT * FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders);
-- May calculate AVG multiple times (depends on DB)

-- ✅ Good: CTE or derived table
WITH avg_amount AS (
  SELECT AVG(amount) as avg FROM orders
)
SELECT o.*
FROM orders o, avg_amount a
WHERE o.amount > a.avg;
-- AVG calculated once

-- ❌ Bad: NOT IN with nullable column
SELECT * FROM orders
WHERE customer_id NOT IN (SELECT customer_id FROM blacklist);
-- If blacklist.customer_id has NULLs, query returns 0 rows!

-- ✅ Good: NOT EXISTS
SELECT * FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM blacklist b WHERE b.customer_id = o.customer_id
);
-- Correct behavior with NULLs
```

### 7. Batch Operations

```sql
-- ❌ Bad: Row-by-row updates
-- In application code:
-- for each customer:
--   UPDATE customers SET last_login = NOW() WHERE customer_id = ?;
-- N queries, N round-trips

-- ✅ Good: Batch update
UPDATE customers
SET last_login = NOW()
WHERE customer_id IN (123, 456, 789, ...);
-- 1 query

-- ✅ Better: Temp table + join
CREATE TEMP TABLE customer_logins (customer_id INT, login_time TIMESTAMP);
INSERT INTO customer_logins VALUES (123, NOW()), (456, NOW()), ...;

UPDATE customers c
SET last_login = cl.login_time
FROM customer_logins cl
WHERE c.customer_id = cl.customer_id;
-- Efficient bulk update

-- ❌ Bad: Individual inserts
INSERT INTO orders VALUES (1, 123, '2024-01-01', 100);
INSERT INTO orders VALUES (2, 124, '2024-01-02', 200);
INSERT INTO orders VALUES (3, 125, '2024-01-03', 300);
-- Many round-trips

-- ✅ Good: Bulk insert
INSERT INTO orders VALUES
  (1, 123, '2024-01-01', 100),
  (2, 124, '2024-01-02', 200),
  (3, 125, '2024-01-03', 300);
-- 1 round-trip
```

### 8. Avoiding Common Pitfalls

```sql
-- ❌ Bad: Wildcard at start of LIKE
SELECT * FROM customers WHERE email LIKE '%@example.com';
-- Cannot use index

-- ✅ Good: Wildcard at end
SELECT * FROM customers WHERE email LIKE 'john%';
-- Can use index

-- ✅ Alternative: Full-text search for complex patterns
CREATE INDEX idx_customers_email_fts ON customers USING GIN(to_tsvector('english', email));
SELECT * FROM customers WHERE to_tsvector('english', email) @@ to_tsquery('example.com');

-- ❌ Bad: Implicit type conversion
SELECT * FROM orders WHERE customer_id = '123';  -- '123' is string
-- Index on customer_id (INT) may not be used efficiently

-- ✅ Good: Correct types
SELECT * FROM orders WHERE customer_id = 123;

-- ❌ Bad: OR conditions on different columns
SELECT * FROM orders
WHERE customer_id = 123 OR order_date >= '2024-01-01';
-- Hard to use indexes efficiently

-- ✅ Good: UNION if needed for index usage
SELECT * FROM orders WHERE customer_id = 123
UNION
SELECT * FROM orders WHERE order_date >= '2024-01-01';
-- Each branch can use its index

-- ❌ Bad: Using HAVING instead of WHERE
SELECT * FROM orders
GROUP BY customer_id
HAVING customer_id = 123;
-- Aggregates all customers, then filters

-- ✅ Good: WHERE filters before aggregation
SELECT * FROM orders
WHERE customer_id = 123
GROUP BY customer_id;
-- Filters first
```

## Performance Monitoring

### Key Metrics to Track

```sql
-- PostgreSQL: Slow query log
-- postgresql.conf
log_min_duration_statement = 1000  -- Log queries > 1 second

-- View current activity
SELECT
  pid,
  usename,
  application_name,
  state,
  query,
  query_start,
  state_change,
  NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- MySQL: Slow query log
-- my.cnf
slow_query_log = 1
long_query_time = 1
log_queries_not_using_indexes = 1

-- View current queries
SHOW PROCESSLIST;
SELECT * FROM information_schema.processlist
WHERE command != 'Sleep'
ORDER BY time DESC;

-- SQL Server: Query Store
-- Enable Query Store
ALTER DATABASE YourDatabase SET QUERY_STORE = ON;

-- Find expensive queries
SELECT
  q.query_id,
  qt.query_sql_text,
  rs.avg_duration,
  rs.avg_cpu_time,
  rs.avg_logical_io_reads
FROM sys.query_store_query q
JOIN sys.query_store_query_text qt ON q.query_text_id = qt.query_text_id
JOIN sys.query_store_plan p ON q.query_id = p.query_id
JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
ORDER BY rs.avg_duration DESC;
```

### Index Usage Analysis

```sql
-- PostgreSQL: Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_relation_size(indexrelid) DESC;

-- MySQL: Index statistics
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  INDEX_NAME,
  SEQ_IN_INDEX,
  COLUMN_NAME,
  CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- SQL Server: Missing indexes
SELECT
  migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) AS improvement_measure,
  OBJECT_NAME(mid.object_id) AS table_name,
  mid.equality_columns,
  mid.inequality_columns,
  mid.included_columns,
  migs.user_seeks,
  migs.user_scans
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE migs.avg_user_impact > 50
ORDER BY improvement_measure DESC;
```

## Best Practices Summary

### 1. Always Have Up-to-Date Statistics
```sql
-- PostgreSQL
ANALYZE;  -- All tables
ANALYZE orders;  -- Specific table

-- MySQL
ANALYZE TABLE orders;

-- SQL Server
UPDATE STATISTICS orders WITH FULLSCAN;

-- Oracle
EXEC DBMS_STATS.GATHER_SCHEMA_STATS('schema_name');
```

### 2. Use EXPLAIN Regularly
```sql
-- Check execution plans during development
EXPLAIN ANALYZE SELECT ...;

-- Look for:
-- - Full table scans on large tables
-- - Missing index usage
-- - Estimated vs actual row counts (big differences = stale stats)
-- - Expensive operations (sorts, hash joins on large datasets)
```

### 3. Index Strategically
```sql
-- Index columns used in:
-- - WHERE clauses (filters)
-- - JOIN conditions
-- - ORDER BY clauses
-- - GROUP BY clauses

-- But don't over-index:
-- - Too many indexes slow down writes
-- - Each index uses disk space
-- - Keep 3-5 indexes per table max (rule of thumb)
```

### 4. Monitor and Iterate
```sql
-- Track slow queries
-- Analyze execution plans
-- Test optimizations
-- Measure improvements
-- Keep monitoring (data changes over time)
```

## Platform-Specific Features

::: details PostgreSQL
**Advanced Features**:

```sql
-- JIT compilation (PostgreSQL 11+)
SET jit = on;
SELECT SUM(amount) FROM large_table;  -- JIT compiles aggregation

-- Parallel query execution
SET max_parallel_workers_per_gather = 4;
EXPLAIN SELECT COUNT(*) FROM large_table;  -- Shows parallel scan

-- Expression indexes
CREATE INDEX idx_lower_email ON customers(LOWER(email));
SELECT * FROM customers WHERE LOWER(email) = 'user@example.com';

-- Partial indexes
CREATE INDEX idx_active_orders ON orders(order_date)
WHERE status = 'active';
```

**Configuration for Performance**:
```
# postgresql.conf
shared_buffers = 256MB           # 25% of RAM (up to 8GB)
effective_cache_size = 1GB       # 50-75% of RAM
random_page_cost = 1.1           # Lower for SSD
work_mem = 16MB                  # Per sort/hash operation
maintenance_work_mem = 256MB     # For VACUUM, CREATE INDEX
```
:::

::: details MySQL
**Advanced Features**:

```sql
-- Optimizer hints (MySQL 8.0+)
SELECT /*+ INDEX(orders idx_orders_date) */ *
FROM orders
WHERE order_date >= '2024-01-01';

-- Force index usage
SELECT * FROM orders FORCE INDEX (idx_orders_customer)
WHERE customer_id = 123;

-- Optimizer trace
SET optimizer_trace='enabled=on';
SELECT * FROM orders WHERE customer_id = 123;
SELECT * FROM information_schema.OPTIMIZER_TRACE;

-- Invisible indexes (test before dropping)
ALTER TABLE orders ALTER INDEX idx_old INVISIBLE;
```

**Configuration for Performance**:
```
# my.cnf
innodb_buffer_pool_size = 2G     # 70-80% of RAM
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 0             # Disable in MySQL 5.7 (removed in 8.0)
tmp_table_size = 64M
max_heap_table_size = 64M
```
:::

::: details SQL Server
**Advanced Features**:

```sql
-- Query hints
SELECT * FROM orders WITH (INDEX(idx_orders_customer))
WHERE customer_id = 123;

-- Force plan
SELECT * FROM orders
WHERE customer_id = 123
OPTION (FORCE ORDER, HASH JOIN);

-- Plan guides
EXEC sp_create_plan_guide
  @name = N'MyPlanGuide',
  @stmt = N'SELECT * FROM orders WHERE customer_id = @custid',
  @type = N'SQL',
  @hints = N'OPTION (OPTIMIZE FOR (@custid = 123))';

-- Columnstore indexes (analytics)
CREATE COLUMNSTORE INDEX idx_orders_cs ON orders;

-- In-Memory OLTP
CREATE TABLE orders_memory (
  order_id INT PRIMARY KEY NONCLUSTERED HASH WITH (BUCKET_COUNT = 1000000),
  ...
) WITH (MEMORY_OPTIMIZED = ON);
```
:::

::: details Oracle
**Advanced Features**:

```sql
-- Optimizer hints
SELECT /*+ INDEX(orders idx_orders_customer) */ *
FROM orders
WHERE customer_id = 123;

-- Force hash join
SELECT /*+ USE_HASH(o c) */ *
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;

-- Parallel execution
SELECT /*+ PARALLEL(orders, 4) */ COUNT(*)
FROM orders;

-- SQL Plan Management
-- Capture and fix execution plans
EXEC DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(
  sql_id => 'abc123xyz'
);

-- Adaptive query optimization (12c+)
-- Automatically adjusts plans during execution
```
:::

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Indexes](/concepts/indexes/) - Database index design and implementation
- [Subqueries](/concepts/subqueries/) - Subquery optimization techniques
- [CTEs](/concepts/ctes/) - Common Table Expressions for query organization
- [Joins](/concepts/joins/) - Join algorithms and optimization
- [Window Functions](/concepts/window-functions/) - Analytical query performance
