---
title: Common Table Expressions (CTEs)
description: Comprehensive guide to CTEs (WITH clause) for organizing complex SQL queries
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
  - ctes
  - cte
  - with
  - recursive-cte
  - subqueries
  - query-organization
  - hierarchical-data
---

# Common Table Expressions (CTEs)

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Basic CTE
WITH customer_totals AS (
  SELECT
    customer_id,
    SUM(amount) as total_spent
  FROM orders
  GROUP BY customer_id
)
SELECT
  c.customer_name,
  ct.total_spent
FROM customers c
JOIN customer_totals ct ON c.customer_id = ct.customer_id;

-- Multiple CTEs
WITH
  order_totals AS (
    SELECT customer_id, SUM(amount) as total
    FROM orders GROUP BY customer_id
  ),
  customer_segments AS (
    SELECT
      customer_id,
      CASE WHEN total > 1000 THEN 'VIP' ELSE 'Regular' END as segment
    FROM order_totals
  )
SELECT * FROM customer_segments;

-- Recursive CTE
WITH RECURSIVE employee_hierarchy AS (
  SELECT employee_id, employee_name, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.employee_name, e.manager_id, eh.level + 1
  FROM employees e
  JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy ORDER BY level, employee_name;
```

## Overview

Common Table Expressions (CTEs), also called WITH queries, are temporary named result sets that exist only within the execution scope of a single SQL statement. They make complex queries more readable and maintainable by breaking them into logical, reusable components.

CTEs are particularly useful for:

- **Improving readability**: Breaking complex queries into logical steps
- **Code reusability**: Referencing the same subquery multiple times
- **Hierarchical queries**: Using recursive CTEs to traverse tree structures
- **Simplifying maintenance**: Making complex logic easier to understand and modify
- **Temporary calculations**: Creating intermediate results without temp tables

## Basic CTEs

### Simple CTE Syntax

```sql
-- Basic CTE structure
WITH cte_name AS (
  SELECT column1, column2
  FROM table_name
  WHERE condition
)
SELECT *
FROM cte_name;

-- Example: Calculate average order value
WITH avg_order_value AS (
  SELECT AVG(amount) as avg_amount
  FROM orders
)
SELECT
  order_id,
  amount,
  avg_amount,
  amount - avg_amount as difference_from_avg
FROM orders
CROSS JOIN avg_order_value;

-- Example: Filter and aggregate
WITH completed_orders AS (
  SELECT
    customer_id,
    order_id,
    order_date,
    amount
  FROM orders
  WHERE status = 'completed'
    AND order_date >= '2024-01-01'
)
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent,
  AVG(amount) as avg_order_value
FROM completed_orders
GROUP BY customer_id;
```

### When to Use CTEs vs Subqueries

```sql
-- ❌ Complex subquery (hard to read)
SELECT
  c.customer_name,
  (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.status = 'completed'
  ) as completed_orders,
  (
    SELECT SUM(amount)
    FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.status = 'completed'
  ) as total_spent
FROM customers c
WHERE (
  SELECT COUNT(*)
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.status = 'completed'
) > 0;

-- ✅ CTE (clearer and more maintainable)
WITH completed_orders AS (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT
  c.customer_name,
  co.order_count as completed_orders,
  co.total_spent
FROM customers c
JOIN completed_orders co ON c.customer_id = co.customer_id
WHERE co.order_count > 0;
```

## Multiple CTEs

You can define multiple CTEs in a single query, separated by commas. Later CTEs can reference earlier ones.

```sql
-- Sequential CTEs (each can reference previous ones)
WITH
  -- Step 1: Get order totals per customer
  order_totals AS (
    SELECT
      customer_id,
      COUNT(*) as order_count,
      SUM(amount) as total_spent,
      AVG(amount) as avg_order_value
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id
  ),

  -- Step 2: Classify customers into segments
  customer_segments AS (
    SELECT
      customer_id,
      order_count,
      total_spent,
      avg_order_value,
      CASE
        WHEN total_spent > 10000 THEN 'Platinum'
        WHEN total_spent > 5000 THEN 'Gold'
        WHEN total_spent > 1000 THEN 'Silver'
        ELSE 'Bronze'
      END as segment
    FROM order_totals
  ),

  -- Step 3: Calculate segment statistics
  segment_stats AS (
    SELECT
      segment,
      COUNT(*) as customer_count,
      AVG(total_spent) as avg_segment_spend,
      MIN(total_spent) as min_spend,
      MAX(total_spent) as max_spend
    FROM customer_segments
    GROUP BY segment
  )

-- Final query using all CTEs
SELECT
  cs.customer_id,
  c.customer_name,
  cs.segment,
  cs.total_spent,
  cs.order_count,
  ss.avg_segment_spend,
  ROUND(100.0 * cs.total_spent / ss.avg_segment_spend, 2) as pct_of_segment_avg
FROM customer_segments cs
JOIN customers c ON cs.customer_id = c.customer_id
JOIN segment_stats ss ON cs.segment = ss.segment
ORDER BY cs.segment, cs.total_spent DESC;
```

### CTE Chaining Pattern

```sql
-- Data pipeline using CTEs
WITH
  -- Extract: Get raw data
  raw_sales AS (
    SELECT
      s.sale_id,
      s.product_id,
      s.customer_id,
      s.sale_date,
      s.quantity,
      s.unit_price,
      p.product_name,
      p.category_id,
      c.customer_name,
      c.region
    FROM sales s
    JOIN products p ON s.product_id = p.product_id
    JOIN customers c ON s.customer_id = c.customer_id
    WHERE s.sale_date >= '2024-01-01'
  ),

  -- Transform: Calculate metrics
  sales_with_metrics AS (
    SELECT
      *,
      quantity * unit_price as line_total,
      CASE
        WHEN quantity >= 10 THEN 'Bulk'
        WHEN quantity >= 5 THEN 'Medium'
        ELSE 'Small'
      END as order_size,
      EXTRACT(YEAR FROM sale_date) as sale_year,
      EXTRACT(MONTH FROM sale_date) as sale_month
    FROM raw_sales
  ),

  -- Aggregate: Summarize by region and month
  regional_monthly_sales AS (
    SELECT
      region,
      sale_year,
      sale_month,
      COUNT(DISTINCT sale_id) as transaction_count,
      COUNT(DISTINCT customer_id) as unique_customers,
      SUM(quantity) as units_sold,
      SUM(line_total) as total_revenue,
      AVG(line_total) as avg_transaction_value
    FROM sales_with_metrics
    GROUP BY region, sale_year, sale_month
  ),

  -- Enrich: Add comparisons
  sales_with_comparisons AS (
    SELECT
      *,
      LAG(total_revenue) OVER (
        PARTITION BY region
        ORDER BY sale_year, sale_month
      ) as prev_month_revenue,
      total_revenue - LAG(total_revenue) OVER (
        PARTITION BY region
        ORDER BY sale_year, sale_month
      ) as month_over_month_change
    FROM regional_monthly_sales
  )

-- Final result
SELECT
  region,
  TO_DATE(sale_year || '-' || LPAD(sale_month::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') as month,
  total_revenue,
  unique_customers,
  transaction_count,
  ROUND(avg_transaction_value, 2) as avg_transaction_value,
  prev_month_revenue,
  month_over_month_change,
  ROUND(
    100.0 * month_over_month_change / NULLIF(prev_month_revenue, 0),
    2
  ) as pct_change
FROM sales_with_comparisons
ORDER BY region, sale_year, sale_month;
```

## Recursive CTEs

Recursive CTEs reference themselves and are perfect for hierarchical or graph-structured data like organizational charts, bill of materials, or network paths.

### Basic Recursive CTE Structure

```sql
WITH RECURSIVE cte_name AS (
  -- Base case (anchor member)
  SELECT initial_query

  UNION ALL

  -- Recursive case (recursive member)
  SELECT recursive_query
  FROM cte_name
  JOIN other_tables
  WHERE termination_condition
)
SELECT * FROM cte_name;
```

### Employee Hierarchy (Org Chart)

```sql
-- Find all employees in a reporting chain
WITH RECURSIVE employee_hierarchy AS (
  -- Base case: Start with CEO (no manager)
  SELECT
    employee_id,
    employee_name,
    manager_id,
    job_title,
    1 as level,
    employee_name as path,
    ARRAY[employee_id] as id_path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive case: Find direct reports
  SELECT
    e.employee_id,
    e.employee_name,
    e.manager_id,
    e.job_title,
    eh.level + 1,
    eh.path || ' > ' || e.employee_name,
    eh.id_path || e.employee_id
  FROM employees e
  JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
  WHERE eh.level < 10  -- Prevent infinite recursion
)
SELECT
  employee_id,
  REPEAT('  ', level - 1) || employee_name as indented_name,
  job_title,
  level,
  path
FROM employee_hierarchy
ORDER BY id_path;

-- Find all subordinates of a specific manager
WITH RECURSIVE subordinates AS (
  -- Base case: The manager themselves
  SELECT
    employee_id,
    employee_name,
    manager_id,
    0 as level
  FROM employees
  WHERE employee_id = 100  -- Starting employee

  UNION ALL

  -- Recursive case: Direct and indirect reports
  SELECT
    e.employee_id,
    e.employee_name,
    e.manager_id,
    s.level + 1
  FROM employees e
  JOIN subordinates s ON e.manager_id = s.employee_id
)
SELECT
  employee_id,
  employee_name,
  level,
  CASE
    WHEN level = 0 THEN 'Manager'
    WHEN level = 1 THEN 'Direct Report'
    ELSE 'Indirect Report (Level ' || level || ')'
  END as relationship
FROM subordinates
ORDER BY level, employee_name;
```

### Category Hierarchy

```sql
-- Traverse nested categories
WITH RECURSIVE category_tree AS (
  -- Base case: Top-level categories
  SELECT
    category_id,
    category_name,
    parent_category_id,
    1 as depth,
    category_name as full_path,
    ARRAY[category_id] as path_ids
  FROM categories
  WHERE parent_category_id IS NULL

  UNION ALL

  -- Recursive case: Child categories
  SELECT
    c.category_id,
    c.category_name,
    c.parent_category_id,
    ct.depth + 1,
    ct.full_path || ' / ' || c.category_name,
    ct.path_ids || c.category_id
  FROM categories c
  JOIN category_tree ct ON c.parent_category_id = ct.category_id
  WHERE ct.depth < 5  -- Limit depth
)
SELECT
  category_id,
  category_name,
  depth,
  full_path,
  (SELECT COUNT(*) FROM products p WHERE p.category_id = ct.category_id) as product_count
FROM category_tree ct
ORDER BY path_ids;
```

### Graph Traversal: Finding All Paths

```sql
-- Find all possible routes between locations
WITH RECURSIVE routes AS (
  -- Base case: Direct connections from starting point
  SELECT
    route_id,
    origin,
    destination,
    distance,
    1 as hop_count,
    origin || ' -> ' || destination as path,
    ARRAY[origin, destination] as visited,
    distance as total_distance
  FROM flights
  WHERE origin = 'NYC'

  UNION ALL

  -- Recursive case: Extended routes
  SELECT
    f.route_id,
    r.origin,
    f.destination,
    f.distance,
    r.hop_count + 1,
    r.path || ' -> ' || f.destination,
    r.visited || f.destination,
    r.total_distance + f.distance
  FROM flights f
  JOIN routes r ON f.origin = r.destination
  WHERE NOT (f.destination = ANY(r.visited))  -- Avoid cycles
    AND r.hop_count < 4  -- Limit to 4 hops
)
SELECT
  origin,
  destination,
  hop_count,
  path,
  total_distance
FROM routes
WHERE destination = 'LAX'  -- End point
ORDER BY total_distance, hop_count;
```

### Number Series and Date Ranges

```sql
-- Generate series of numbers (if generate_series not available)
WITH RECURSIVE number_series AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1
  FROM number_series
  WHERE n < 100
)
SELECT n FROM number_series;

-- Generate date range
WITH RECURSIVE date_series AS (
  SELECT DATE '2024-01-01' as date
  UNION ALL
  SELECT date + INTERVAL '1 day'
  FROM date_series
  WHERE date < DATE '2024-12-31'
)
SELECT
  date,
  EXTRACT(DOW FROM date) as day_of_week,
  CASE
    WHEN EXTRACT(DOW FROM date) IN (0, 6) THEN 'Weekend'
    ELSE 'Weekday'
  END as day_type
FROM date_series;

-- Sales calendar with actual sales data
WITH RECURSIVE date_series AS (
  SELECT
    DATE '2024-01-01' as date,
    DATE '2024-12-31' as end_date
  UNION ALL
  SELECT
    date + INTERVAL '1 day',
    end_date
  FROM date_series
  WHERE date < end_date
)
SELECT
  ds.date,
  COALESCE(SUM(s.amount), 0) as daily_revenue,
  COUNT(s.sale_id) as transaction_count
FROM date_series ds
LEFT JOIN sales s ON DATE(s.sale_date) = ds.date
GROUP BY ds.date
ORDER BY ds.date;
```

### Bill of Materials (BOM)

```sql
-- Calculate total parts needed for a product
WITH RECURSIVE parts_explosion AS (
  -- Base case: Top-level product
  SELECT
    component_id,
    component_name,
    parent_id,
    quantity_needed,
    1 as level,
    quantity_needed as total_quantity
  FROM bill_of_materials
  WHERE parent_id = 'PRODUCT-001'

  UNION ALL

  -- Recursive case: Sub-components
  SELECT
    bom.component_id,
    bom.component_name,
    bom.parent_id,
    bom.quantity_needed,
    pe.level + 1,
    pe.total_quantity * bom.quantity_needed
  FROM bill_of_materials bom
  JOIN parts_explosion pe ON bom.parent_id = pe.component_id
  WHERE pe.level < 10
)
SELECT
  component_id,
  component_name,
  level,
  SUM(total_quantity) as total_needed
FROM parts_explosion
GROUP BY component_id, component_name, level
ORDER BY level, component_name;
```

## CTE Use Cases and Patterns

### Data Deduplication

```sql
-- Remove duplicates using CTEs
WITH ranked_customers AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY email
      ORDER BY created_at DESC, customer_id DESC
    ) as row_num
  FROM customers
)
DELETE FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM ranked_customers
  WHERE row_num > 1
);

-- Or just query without duplicates
WITH deduplicated AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY email
      ORDER BY created_at DESC
    ) as rn
  FROM customers
)
SELECT
  customer_id,
  customer_name,
  email,
  created_at
FROM deduplicated
WHERE rn = 1;
```

### Running Calculations

```sql
-- Running totals and moving averages
WITH daily_sales AS (
  SELECT
    DATE(order_date) as sale_date,
    SUM(amount) as daily_revenue,
    COUNT(*) as daily_orders
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE(order_date)
),
sales_with_metrics AS (
  SELECT
    sale_date,
    daily_revenue,
    daily_orders,
    SUM(daily_revenue) OVER (
      ORDER BY sale_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_total,
    AVG(daily_revenue) OVER (
      ORDER BY sale_date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day,
    LAG(daily_revenue, 1) OVER (ORDER BY sale_date) as prev_day_revenue,
    LAG(daily_revenue, 7) OVER (ORDER BY sale_date) as same_day_last_week
  FROM daily_sales
)
SELECT
  sale_date,
  daily_revenue,
  running_total,
  ROUND(moving_avg_7day, 2) as moving_avg_7day,
  daily_revenue - prev_day_revenue as day_over_day_change,
  daily_revenue - same_day_last_week as week_over_week_change
FROM sales_with_metrics
ORDER BY sale_date;
```

### Data Quality Checks

```sql
-- Comprehensive data quality report
WITH
  -- Missing critical fields
  missing_data AS (
    SELECT
      'customers' as table_name,
      'email' as column_name,
      COUNT(*) as missing_count
    FROM customers
    WHERE email IS NULL OR email = ''
    UNION ALL
    SELECT 'customers', 'phone', COUNT(*)
    FROM customers
    WHERE phone IS NULL OR phone = ''
    UNION ALL
    SELECT 'orders', 'customer_id', COUNT(*)
    FROM orders
    WHERE customer_id IS NULL
  ),

  -- Orphaned records
  orphaned_records AS (
    SELECT
      'orders' as table_name,
      COUNT(*) as orphan_count
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    WHERE c.customer_id IS NULL
    UNION ALL
    SELECT 'order_items', COUNT(*)
    FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.order_id
    WHERE o.order_id IS NULL
  ),

  -- Duplicates
  duplicate_records AS (
    SELECT
      'customers_by_email' as check_name,
      COUNT(*) as duplicate_count
    FROM (
      SELECT email, COUNT(*) as cnt
      FROM customers
      GROUP BY email
      HAVING COUNT(*) > 1
    ) dups
  ),

  -- Invalid data
  invalid_data AS (
    SELECT
      'invalid_emails' as check_name,
      COUNT(*) as invalid_count
    FROM customers
    WHERE email NOT LIKE '%@%.%'
    UNION ALL
    SELECT 'negative_amounts', COUNT(*)
    FROM orders
    WHERE amount < 0
  )

SELECT 'Missing Data' as category, table_name as detail, missing_count as issue_count
FROM missing_data
WHERE missing_count > 0
UNION ALL
SELECT 'Orphaned Records', table_name, orphan_count
FROM orphaned_records
WHERE orphan_count > 0
UNION ALL
SELECT 'Duplicates', check_name, duplicate_count
FROM duplicate_records
WHERE duplicate_count > 0
UNION ALL
SELECT 'Invalid Data', check_name, invalid_count
FROM invalid_data
WHERE invalid_count > 0
ORDER BY category, detail;
```

### Pivot Tables with CTEs

```sql
-- Transform rows to columns
WITH monthly_sales AS (
  SELECT
    product_id,
    product_name,
    EXTRACT(MONTH FROM order_date) as month,
    SUM(quantity * price) as revenue
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  JOIN products p ON oi.product_id = p.product_id
  WHERE EXTRACT(YEAR FROM order_date) = 2024
  GROUP BY product_id, product_name, EXTRACT(MONTH FROM order_date)
)
SELECT
  product_name,
  SUM(CASE WHEN month = 1 THEN revenue ELSE 0 END) as jan,
  SUM(CASE WHEN month = 2 THEN revenue ELSE 0 END) as feb,
  SUM(CASE WHEN month = 3 THEN revenue ELSE 0 END) as mar,
  SUM(CASE WHEN month = 4 THEN revenue ELSE 0 END) as apr,
  SUM(CASE WHEN month = 5 THEN revenue ELSE 0 END) as may,
  SUM(CASE WHEN month = 6 THEN revenue ELSE 0 END) as jun,
  SUM(CASE WHEN month = 7 THEN revenue ELSE 0 END) as jul,
  SUM(CASE WHEN month = 8 THEN revenue ELSE 0 END) as aug,
  SUM(CASE WHEN month = 9 THEN revenue ELSE 0 END) as sep,
  SUM(CASE WHEN month = 10 THEN revenue ELSE 0 END) as oct,
  SUM(CASE WHEN month = 11 THEN revenue ELSE 0 END) as nov,
  SUM(CASE WHEN month = 12 THEN revenue ELSE 0 END) as dec,
  SUM(revenue) as total
FROM monthly_sales
GROUP BY product_name
ORDER BY total DESC;
```

### Gap and Island Detection

```sql
-- Find consecutive sequences and gaps
WITH date_data AS (
  SELECT DISTINCT DATE(login_date) as login_date
  FROM user_logins
  WHERE user_id = 123
),
date_with_groups AS (
  SELECT
    login_date,
    login_date - (ROW_NUMBER() OVER (ORDER BY login_date) || ' days')::INTERVAL as group_id
  FROM date_data
),
consecutive_periods AS (
  SELECT
    MIN(login_date) as period_start,
    MAX(login_date) as period_end,
    COUNT(*) as consecutive_days
  FROM date_with_groups
  GROUP BY group_id
)
SELECT
  period_start,
  period_end,
  consecutive_days,
  CASE
    WHEN consecutive_days >= 7 THEN 'Active Streak'
    WHEN consecutive_days >= 3 THEN 'Moderate Activity'
    ELSE 'Sporadic'
  END as activity_level
FROM consecutive_periods
ORDER BY period_start;
```

## Performance Considerations

### Materialization

CTEs can be materialized (executed once) or inlined (merged into main query). This varies by database.

```sql
-- PostgreSQL: CTEs are materialized by default (v12+: optimization fence removed)
-- This CTE will be executed once
WITH expensive_calculation AS (
  SELECT
    customer_id,
    -- Complex calculation
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '1 year'
  GROUP BY customer_id
)
SELECT *
FROM expensive_calculation
WHERE total_spent > 1000
UNION ALL
SELECT *
FROM expensive_calculation
WHERE order_count > 10;

-- Force inlining in PostgreSQL 12+ with MATERIALIZED hint
WITH expensive_calculation AS MATERIALIZED (
  SELECT customer_id, SUM(amount) as total
  FROM orders
  GROUP BY customer_id
)
SELECT * FROM expensive_calculation WHERE total > 1000;

-- Force non-materialization (inline)
WITH expensive_calculation AS NOT MATERIALIZED (
  SELECT customer_id, SUM(amount) as total
  FROM orders
  GROUP BY customer_id
)
SELECT * FROM expensive_calculation WHERE total > 1000;
```

### Indexing for CTEs

```sql
-- ✅ Good: Filter before CTE reduces dataset
WITH recent_orders AS (
  SELECT *
  FROM orders
  WHERE order_date >= '2024-01-01'  -- Can use index on order_date
    AND status = 'completed'         -- Can use index on status
)
SELECT
  customer_id,
  COUNT(*) as order_count
FROM recent_orders
GROUP BY customer_id;

-- ❌ Less efficient: Large CTE then filter
WITH all_orders AS (
  SELECT *
  FROM orders  -- Full table scan
)
SELECT
  customer_id,
  COUNT(*) as order_count
FROM all_orders
WHERE order_date >= '2024-01-01'
  AND status = 'completed'
GROUP BY customer_id;
```

### Recursive CTE Optimization

```sql
-- ✅ Good: Limit recursion depth
WITH RECURSIVE hierarchy AS (
  SELECT employee_id, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.manager_id, h.level + 1
  FROM employees e
  JOIN hierarchy h ON e.manager_id = h.employee_id
  WHERE h.level < 10  -- Prevent runaway recursion
)
SELECT * FROM hierarchy;

-- ✅ Good: Add termination conditions
WITH RECURSIVE path_finder AS (
  SELECT node_id, ARRAY[node_id] as path, 0 as depth
  FROM graph
  WHERE node_id = 'START'

  UNION ALL

  SELECT g.node_id, pf.path || g.node_id, pf.depth + 1
  FROM graph g
  JOIN path_finder pf ON g.parent_id = pf.node_id
  WHERE pf.depth < 20
    AND NOT (g.node_id = ANY(pf.path))  -- Prevent cycles
)
SELECT * FROM path_finder;
```

### CTE vs Temporary Tables

```sql
-- Use CTE when:
-- - Query is run once
-- - Result set is small to medium
-- - Logic needs to be readable

WITH order_summary AS (
  SELECT customer_id, SUM(amount) as total
  FROM orders
  GROUP BY customer_id
)
SELECT * FROM order_summary WHERE total > 1000;

-- Use temporary table when:
-- - Result will be reused multiple times
-- - Result set is very large
-- - Need indexes on intermediate results

CREATE TEMP TABLE order_summary AS
SELECT customer_id, SUM(amount) as total
FROM orders
GROUP BY customer_id;

CREATE INDEX idx_order_summary_total ON order_summary(total);

-- Use multiple times
SELECT * FROM order_summary WHERE total > 1000;
SELECT * FROM order_summary WHERE customer_id = 123;
SELECT AVG(total) FROM order_summary;

DROP TABLE order_summary;
```

## Platform-Specific Notes

::: details PostgreSQL
PostgreSQL has excellent CTE support with optimization features:

```sql
-- MATERIALIZED hint (PostgreSQL 12+)
WITH monthly_sales AS MATERIALIZED (
  SELECT
    DATE_TRUNC('month', order_date) as month,
    SUM(amount) as revenue
  FROM orders
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT * FROM monthly_sales;

-- NOT MATERIALIZED hint (inline the CTE)
WITH order_counts AS NOT MATERIALIZED (
  SELECT customer_id, COUNT(*) as cnt
  FROM orders
  GROUP BY customer_id
)
SELECT * FROM order_counts WHERE cnt > 5;

-- Recursive CTEs with SEARCH and CYCLE clauses (PostgreSQL 14+)
WITH RECURSIVE search_tree AS (
  SELECT employee_id, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.manager_id, st.level + 1
  FROM employees e
  JOIN search_tree st ON e.manager_id = st.employee_id
)
SEARCH DEPTH FIRST BY employee_id SET ordercol
CYCLE employee_id SET is_cycle USING path
SELECT * FROM search_tree;

-- CTEs in INSERT, UPDATE, DELETE
WITH deleted_orders AS (
  DELETE FROM orders
  WHERE order_date < '2020-01-01'
  RETURNING *
)
INSERT INTO orders_archive
SELECT * FROM deleted_orders;
```

**Performance Notes**:

- PostgreSQL 12+ improved CTE optimization (no longer optimization fence by default)
- Use MATERIALIZED when you want guaranteed single execution
- Use NOT MATERIALIZED when you want the optimizer to inline
  :::

::: details MySQL
MySQL CTE support (MySQL 8.0+):

```sql
-- Basic CTEs (MySQL 8.0+)
WITH sales_summary AS (
  SELECT
    product_id,
    SUM(quantity) as total_sold
  FROM order_items
  GROUP BY product_id
)
SELECT p.product_name, s.total_sold
FROM products p
JOIN sales_summary s ON p.product_id = s.product_id;

-- Recursive CTEs (MySQL 8.0+)
WITH RECURSIVE numbers AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 10
)
SELECT * FROM numbers;

-- Set recursion limit
SET SESSION cte_max_recursion_depth = 1000;

WITH RECURSIVE employee_tree AS (
  SELECT employee_id, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.employee_id, e.manager_id, et.level + 1
  FROM employees e
  JOIN employee_tree et ON e.manager_id = et.employee_id
  WHERE et.level < 999
)
SELECT * FROM employee_tree;
```

**Limitations**:

- ❌ No MATERIALIZED/NOT MATERIALIZED hints
- ❌ No SEARCH or CYCLE clauses
- ❌ Older versions (< 8.0) don't support CTEs at all
- Must use SET SESSION cte_max_recursion_depth for deep recursion
  :::

::: details SQL Server
SQL Server CTE features:

```sql
-- Basic CTE
WITH OrderSummary AS (
  SELECT
    CustomerID,
    COUNT(*) as OrderCount,
    SUM(TotalAmount) as TotalSpent
  FROM Orders
  GROUP BY CustomerID
)
SELECT * FROM OrderSummary WHERE TotalSpent > 1000;

-- Recursive CTE
WITH EmployeeHierarchy AS (
  SELECT EmployeeID, ManagerID, 1 as Level
  FROM Employees
  WHERE ManagerID IS NULL

  UNION ALL

  SELECT e.EmployeeID, e.ManagerID, eh.Level + 1
  FROM Employees e
  INNER JOIN EmployeeHierarchy eh ON e.ManagerID = eh.EmployeeID
  WHERE eh.Level < 10
)
SELECT * FROM EmployeeHierarchy
OPTION (MAXRECURSION 100);  -- Set recursion limit

-- Multiple CTEs
WITH
  Sales AS (
    SELECT ProductID, SUM(Quantity) as TotalSold
    FROM OrderItems
    GROUP BY ProductID
  ),
  TopProducts AS (
    SELECT TOP 10 ProductID, TotalSold
    FROM Sales
    ORDER BY TotalSold DESC
  )
SELECT p.ProductName, tp.TotalSold
FROM TopProducts tp
JOIN Products p ON tp.ProductID = p.ProductID;

-- CTE with UPDATE
WITH DuplicateCustomers AS (
  SELECT
    CustomerID,
    ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CreatedDate) as RowNum
  FROM Customers
)
DELETE FROM DuplicateCustomers WHERE RowNum > 1;
```

**Performance Notes**:

- CTEs are always inlined (not materialized)
- Use OPTION (MAXRECURSION n) to control recursive depth
- Default MAXRECURSION is 100
- Consider temp tables for large intermediate results
  :::

::: details SQLite
SQLite CTE support (SQLite 3.8.3+):

```sql
-- Basic CTE
WITH customer_orders AS (
  SELECT
    customer_id,
    COUNT(*) as order_count
  FROM orders
  GROUP BY customer_id
)
SELECT * FROM customer_orders WHERE order_count > 5;

-- Recursive CTE
WITH RECURSIVE cnt(x) AS (
  SELECT 1
  UNION ALL
  SELECT x + 1 FROM cnt
  LIMIT 100
)
SELECT x FROM cnt;

-- Generate date series
WITH RECURSIVE dates(date) AS (
  SELECT DATE('2024-01-01')
  UNION ALL
  SELECT DATE(date, '+1 day')
  FROM dates
  WHERE date < '2024-12-31'
)
SELECT date FROM dates;

-- Hierarchy traversal
WITH RECURSIVE org_chart AS (
  SELECT employee_id, name, manager_id, 0 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.name, e.manager_id, oc.level + 1
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT * FROM org_chart;
```

**Notes**:

- SQLite has full CTE support including recursive CTEs
- No explicit recursion limit setting (use LIMIT in recursive part)
- CTEs are always inlined
- Very lightweight and fast for small to medium datasets
  :::

::: details Oracle
Oracle CTE features:

```sql
-- Basic CTE
WITH order_totals AS (
  SELECT
    customer_id,
    SUM(amount) as total_spent
  FROM orders
  GROUP BY customer_id
)
SELECT customer_name, total_spent
FROM customers c
JOIN order_totals ot ON c.customer_id = ot.customer_id;

-- Multiple CTEs
WITH
  sales_2024 AS (
    SELECT * FROM sales WHERE EXTRACT(YEAR FROM sale_date) = 2024
  ),
  top_products AS (
    SELECT product_id, SUM(quantity) as total_sold
    FROM sales_2024
    GROUP BY product_id
    ORDER BY total_sold DESC
    FETCH FIRST 10 ROWS ONLY
  )
SELECT p.product_name, tp.total_sold
FROM top_products tp
JOIN products p ON tp.product_id = p.product_id;

-- Recursive CTE (Oracle 11g R2+)
WITH employee_hierarchy (employee_id, manager_id, level, path) AS (
  SELECT employee_id, manager_id, 1, employee_name
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.manager_id, eh.level + 1,
         eh.path || ' > ' || e.employee_name
  FROM employees e
  JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
  WHERE eh.level < 10
)
SELECT * FROM employee_hierarchy;

-- Oracle-specific: CONNECT BY (pre-CTE hierarchical queries)
SELECT
  employee_id,
  employee_name,
  manager_id,
  LEVEL,
  SYS_CONNECT_BY_PATH(employee_name, ' > ') as path
FROM employees
START WITH manager_id IS NULL
CONNECT BY PRIOR employee_id = manager_id
ORDER SIBLINGS BY employee_name;
```

**Notes**:

- CTEs supported in Oracle 9i+ (basic), 11g R2+ (recursive)
- CONNECT BY syntax predates CTEs and is still widely used
- Materialization controlled by optimizer
- Use MATERIALIZE hint to force: WITH /_+ MATERIALIZE _/ cte_name AS (...)
  :::

::: details BigQuery
Google BigQuery CTE support:

```sql
-- Basic CTE
WITH order_summary AS (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM `project.dataset.orders`
  GROUP BY customer_id
)
SELECT * FROM order_summary WHERE total_spent > 1000;

-- Multiple CTEs
WITH
  sales_data AS (
    SELECT
      DATE(order_timestamp) as order_date,
      customer_id,
      amount
    FROM `project.dataset.orders`
    WHERE DATE(order_timestamp) >= '2024-01-01'
  ),
  daily_totals AS (
    SELECT
      order_date,
      SUM(amount) as daily_revenue,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM sales_data
    GROUP BY order_date
  )
SELECT
  order_date,
  daily_revenue,
  unique_customers,
  AVG(daily_revenue) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7day
FROM daily_totals
ORDER BY order_date;

-- Recursive CTE
WITH RECURSIVE date_spine AS (
  SELECT DATE '2024-01-01' as date
  UNION ALL
  SELECT DATE_ADD(date, INTERVAL 1 DAY)
  FROM date_spine
  WHERE date < '2024-12-31'
)
SELECT date FROM date_spine;

-- Employee hierarchy
WITH RECURSIVE org_hierarchy AS (
  SELECT
    employee_id,
    manager_id,
    name,
    1 as level
  FROM `project.dataset.employees`
  WHERE manager_id IS NULL

  UNION ALL

  SELECT
    e.employee_id,
    e.manager_id,
    e.name,
    oh.level + 1
  FROM `project.dataset.employees` e
  JOIN org_hierarchy oh ON e.manager_id = oh.employee_id
  WHERE oh.level < 10
)
SELECT * FROM org_hierarchy ORDER BY level, name;
```

**BigQuery Specifics**:

- Full CTE support including recursive CTEs
- CTEs are optimized and may be materialized or inlined
- Good for breaking down complex queries on large datasets
- Consider using temp tables for very large intermediate results
  :::

::: details Snowflake
Snowflake CTE features:

```sql
-- Basic CTE
WITH monthly_sales AS (
  SELECT
    DATE_TRUNC('month', order_date) as month,
    SUM(amount) as revenue
  FROM orders
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT * FROM monthly_sales ORDER BY month;

-- Multiple CTEs
WITH
  order_data AS (
    SELECT
      customer_id,
      order_id,
      amount,
      order_date
    FROM orders
    WHERE order_date >= '2024-01-01'
  ),
  customer_metrics AS (
    SELECT
      customer_id,
      COUNT(order_id) as order_count,
      SUM(amount) as total_spent,
      AVG(amount) as avg_order_value
    FROM order_data
    GROUP BY customer_id
  )
SELECT
  c.customer_name,
  cm.order_count,
  cm.total_spent,
  cm.avg_order_value
FROM customer_metrics cm
JOIN customers c ON cm.customer_id = c.customer_id
ORDER BY cm.total_spent DESC;

-- Recursive CTE
WITH RECURSIVE employee_tree AS (
  SELECT
    employee_id,
    name,
    manager_id,
    1 as level,
    name as path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT
    e.employee_id,
    e.name,
    e.manager_id,
    et.level + 1,
    et.path || ' > ' || e.name
  FROM employees e
  JOIN employee_tree et ON e.manager_id = et.employee_id
  WHERE et.level < 10
)
SELECT * FROM employee_tree ORDER BY level, name;

-- Generate number series
WITH RECURSIVE numbers AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 1000
)
SELECT n FROM numbers;
```

**Snowflake Features**:

- Excellent CTE support and optimization
- Automatic query optimization handles CTE materialization
- Good performance on large datasets
- Result caching applies to CTEs
  :::

::: details DuckDB
DuckDB advanced CTE features:

```sql
-- Basic CTE
WITH sales_summary AS (
  SELECT
    product_id,
    SUM(quantity) as total_sold,
    SUM(quantity * price) as revenue
  FROM order_items
  GROUP BY product_id
)
SELECT
  p.product_name,
  s.total_sold,
  s.revenue
FROM products p
JOIN sales_summary s ON p.product_id = s.product_id
ORDER BY s.revenue DESC;

-- Recursive CTE
WITH RECURSIVE fib AS (
  SELECT 1 as a, 1 as b
  UNION ALL
  SELECT b, a + b FROM fib WHERE b < 1000
)
SELECT a FROM fib;

-- Generate series (DuckDB has built-in function too)
WITH RECURSIVE dates AS (
  SELECT DATE '2024-01-01' as date
  UNION ALL
  SELECT date + INTERVAL 1 DAY
  FROM dates
  WHERE date < DATE '2024-12-31'
)
SELECT date FROM dates;

-- Alternative using built-in function (more efficient)
SELECT date FROM range(DATE '2024-01-01', DATE '2025-01-01', INTERVAL 1 DAY) dates(date);

-- Complex analytical query with CTEs
WITH
  daily_sales AS (
    SELECT
      DATE_TRUNC('day', order_date) as day,
      SUM(amount) as revenue
    FROM orders
    GROUP BY DATE_TRUNC('day', order_date)
  ),
  sales_with_ma AS (
    SELECT
      day,
      revenue,
      AVG(revenue) OVER (
        ORDER BY day
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
      ) as ma_7day
    FROM daily_sales
  )
SELECT
  day,
  revenue,
  ma_7day,
  revenue - ma_7day as deviation
FROM sales_with_ma
ORDER BY day;
```

**DuckDB Features**:

- Full CTE support with excellent optimization
- Recursive CTEs with good performance
- Built-in functions for common patterns (generate_series, range)
- Efficient execution even on large datasets
- Good for analytical workloads
  :::

## Best Practices

### 1. Use Descriptive CTE Names

```sql
-- ❌ Poor naming
WITH t1 AS (
  SELECT * FROM orders WHERE status = 'completed'
),
t2 AS (
  SELECT customer_id, SUM(amount) FROM t1 GROUP BY customer_id
)
SELECT * FROM t2;

-- ✅ Clear naming
WITH completed_orders AS (
  SELECT * FROM orders WHERE status = 'completed'
),
customer_totals AS (
  SELECT
    customer_id,
    SUM(amount) as total_spent
  FROM completed_orders
  GROUP BY customer_id
)
SELECT * FROM customer_totals;
```

### 2. Break Complex Logic into Steps

```sql
-- ✅ Good: Multi-step breakdown
WITH
  -- Step 1: Get base data
  recent_orders AS (
    SELECT *
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
  ),

  -- Step 2: Calculate metrics
  customer_metrics AS (
    SELECT
      customer_id,
      COUNT(*) as order_count,
      SUM(amount) as total_spent
    FROM recent_orders
    GROUP BY customer_id
  ),

  -- Step 3: Classify customers
  customer_segments AS (
    SELECT
      *,
      CASE
        WHEN total_spent > 5000 THEN 'VIP'
        WHEN total_spent > 1000 THEN 'Regular'
        ELSE 'Occasional'
      END as segment
    FROM customer_metrics
  )

-- Final query
SELECT segment, COUNT(*) as customer_count
FROM customer_segments
GROUP BY segment;
```

### 3. Comment Complex CTEs

```sql
-- ✅ Well documented
WITH
  -- Calculate customer lifetime value based on completed orders
  -- Excludes cancelled and refunded orders
  customer_ltv AS (
    SELECT
      customer_id,
      COUNT(DISTINCT order_id) as lifetime_orders,
      SUM(amount) as lifetime_value,
      MIN(order_date) as first_order_date,
      MAX(order_date) as last_order_date
    FROM orders
    WHERE status IN ('completed', 'delivered')
      AND order_date >= '2020-01-01'  -- Data quality issue before this date
    GROUP BY customer_id
  ),

  -- Identify customers who haven't ordered in 6+ months (at-risk churn)
  at_risk_customers AS (
    SELECT
      customer_id,
      last_order_date,
      CURRENT_DATE - last_order_date as days_since_order
    FROM customer_ltv
    WHERE last_order_date < CURRENT_DATE - INTERVAL '180 days'
      AND lifetime_value > 500  -- Focus on valuable customers
  )

SELECT
  c.customer_name,
  c.email,
  arc.days_since_order,
  ltv.lifetime_value
FROM at_risk_customers arc
JOIN customer_ltv ltv ON arc.customer_id = ltv.customer_id
JOIN customers c ON arc.customer_id = c.customer_id
ORDER BY ltv.lifetime_value DESC;
```

### 4. Limit Recursion Depth

```sql
-- ✅ Always include recursion limit
WITH RECURSIVE hierarchy AS (
  SELECT employee_id, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.manager_id, h.level + 1
  FROM employees e
  JOIN hierarchy h ON e.manager_id = h.employee_id
  WHERE h.level < 20  -- Prevent infinite recursion
)
SELECT * FROM hierarchy;
```

### 5. Avoid Redundant CTEs

```sql
-- ❌ Redundant: Same query multiple times
WITH
  orders_2024 AS (
    SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024
  ),
  orders_2024_copy AS (
    SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024
  )
SELECT * FROM orders_2024
UNION ALL
SELECT * FROM orders_2024_copy;

-- ✅ Efficient: Reuse CTE
WITH orders_2024 AS (
  SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024
)
SELECT * FROM orders_2024
UNION ALL
SELECT * FROM orders_2024;
```

### 6. Use CTEs for Readability, Not Always Performance

```sql
-- Simple case: Direct query may be better
-- ❌ Overkill for simple query
WITH recent_orders AS (
  SELECT * FROM orders WHERE order_date >= '2024-01-01'
)
SELECT COUNT(*) FROM recent_orders;

-- ✅ Simple and direct
SELECT COUNT(*)
FROM orders
WHERE order_date >= '2024-01-01';

-- Complex case: CTE improves readability
-- ✅ Good use of CTE for complex logic
WITH
  customer_metrics AS (
    SELECT customer_id, COUNT(*) as order_count, SUM(amount) as total
    FROM orders
    GROUP BY customer_id
  ),
  top_customers AS (
    SELECT * FROM customer_metrics WHERE total > 10000
  )
SELECT c.customer_name, tc.order_count, tc.total
FROM top_customers tc
JOIN customers c ON tc.customer_id = c.customer_id;
```

## Common Pitfalls

### 1. Forgetting RECURSIVE Keyword

```sql
-- ❌ Error: Missing RECURSIVE keyword
WITH employee_tree AS (
  SELECT employee_id, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.manager_id, et.level + 1
  FROM employees e
  JOIN employee_tree et ON e.manager_id = et.employee_id  -- ERROR!
)
SELECT * FROM employee_tree;

-- ✅ Correct: Include RECURSIVE
WITH RECURSIVE employee_tree AS (
  SELECT employee_id, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.employee_id, e.manager_id, et.level + 1
  FROM employees e
  JOIN employee_tree et ON e.manager_id = et.employee_id
  WHERE et.level < 10
)
SELECT * FROM employee_tree;
```

### 2. Infinite Recursion

```sql
-- ❌ Dangerous: No termination condition
WITH RECURSIVE bad_recursion AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM bad_recursion  -- Never stops!
)
SELECT * FROM bad_recursion;

-- ✅ Safe: Always include termination
WITH RECURSIVE safe_recursion AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM safe_recursion WHERE n < 100
)
SELECT * FROM safe_recursion;
```

### 3. Circular References in Recursive CTEs

```sql
-- ❌ Problematic: Circular graph without cycle detection
WITH RECURSIVE paths AS (
  SELECT node_id, parent_id, ARRAY[node_id] as path
  FROM graph
  WHERE node_id = 'A'

  UNION ALL

  SELECT g.node_id, g.parent_id, p.path || g.node_id
  FROM graph g
  JOIN paths p ON g.parent_id = p.node_id
  -- Can loop forever if graph has cycles!
)
SELECT * FROM paths;

-- ✅ Safe: Detect and prevent cycles
WITH RECURSIVE paths AS (
  SELECT node_id, parent_id, ARRAY[node_id] as path
  FROM graph
  WHERE node_id = 'A'

  UNION ALL

  SELECT g.node_id, g.parent_id, p.path || g.node_id
  FROM graph g
  JOIN paths p ON g.parent_id = p.node_id
  WHERE NOT (g.node_id = ANY(p.path))  -- Prevent cycles
    AND array_length(p.path, 1) < 20   -- Limit depth
)
SELECT * FROM paths;
```

### 4. Order of CTE Definitions

```sql
-- ❌ Error: CTE referenced before definition
WITH
  customer_segments AS (
    SELECT customer_id, segment
    FROM customer_totals  -- ERROR: Not defined yet
    WHERE total > 1000
  ),
  customer_totals AS (
    SELECT customer_id, SUM(amount) as total
    FROM orders
    GROUP BY customer_id
  )
SELECT * FROM customer_segments;

-- ✅ Correct: Define CTEs in order
WITH
  customer_totals AS (
    SELECT customer_id, SUM(amount) as total
    FROM orders
    GROUP BY customer_id
  ),
  customer_segments AS (
    SELECT customer_id, total
    FROM customer_totals
    WHERE total > 1000
  )
SELECT * FROM customer_segments;
```

### 5. Not Reusing CTEs When Beneficial

```sql
-- ❌ Inefficient: Same subquery multiple times
SELECT
  (SELECT SUM(amount) FROM orders WHERE status = 'completed') as completed_total,
  (SELECT SUM(amount) FROM orders WHERE status = 'pending') as pending_total,
  (SELECT SUM(amount) FROM orders WHERE status = 'cancelled') as cancelled_total;

-- ✅ Efficient: Single CTE with conditional aggregation
WITH order_totals AS (
  SELECT
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_total,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total,
    SUM(CASE WHEN status = 'cancelled' THEN amount ELSE 0 END) as cancelled_total
  FROM orders
)
SELECT * FROM order_totals;
```

### 6. Using CTEs When Temp Tables Would Be Better

```sql
-- ❌ Inefficient: Large CTE used many times
WITH large_dataset AS (
  SELECT * FROM huge_table  -- 100M rows
  WHERE complex_condition
)
SELECT * FROM large_dataset WHERE filter1
UNION ALL
SELECT * FROM large_dataset WHERE filter2
UNION ALL
SELECT * FROM large_dataset WHERE filter3
UNION ALL
SELECT * FROM large_dataset WHERE filter4;
-- CTE may be executed 4 times or materialized once depending on DB

-- ✅ Better: Use temp table for large intermediate results
CREATE TEMP TABLE large_dataset AS
SELECT * FROM huge_table
WHERE complex_condition;

CREATE INDEX idx_large_dataset ON large_dataset(relevant_column);

SELECT * FROM large_dataset WHERE filter1
UNION ALL
SELECT * FROM large_dataset WHERE filter2
UNION ALL
SELECT * FROM large_dataset WHERE filter3
UNION ALL
SELECT * FROM large_dataset WHERE filter4;

DROP TABLE large_dataset;
```

## Real-World Examples

### Customer Cohort Analysis

```sql
-- Comprehensive cohort analysis with retention metrics
WITH
  -- Define customer cohorts by signup month
  customer_cohorts AS (
    SELECT
      customer_id,
      DATE_TRUNC('month', signup_date) as cohort_month,
      signup_date
    FROM customers
  ),

  -- Get order activity by month
  monthly_orders AS (
    SELECT
      customer_id,
      DATE_TRUNC('month', order_date) as order_month,
      SUM(amount) as monthly_revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id, DATE_TRUNC('month', order_date)
  ),

  -- Calculate cohort age for each order
  cohort_activity AS (
    SELECT
      cc.cohort_month,
      mo.order_month,
      mo.customer_id,
      mo.monthly_revenue,
      EXTRACT(YEAR FROM AGE(mo.order_month, cc.cohort_month)) * 12 +
      EXTRACT(MONTH FROM AGE(mo.order_month, cc.cohort_month)) as months_since_signup
    FROM customer_cohorts cc
    JOIN monthly_orders mo ON cc.customer_id = mo.customer_id
  ),

  -- Calculate cohort sizes
  cohort_sizes AS (
    SELECT
      cohort_month,
      COUNT(DISTINCT customer_id) as cohort_size
    FROM customer_cohorts
    GROUP BY cohort_month
  ),

  -- Calculate retention by cohort and month
  cohort_retention AS (
    SELECT
      ca.cohort_month,
      ca.months_since_signup,
      COUNT(DISTINCT ca.customer_id) as active_customers,
      SUM(ca.monthly_revenue) as cohort_revenue,
      cs.cohort_size
    FROM cohort_activity ca
    JOIN cohort_sizes cs ON ca.cohort_month = cs.cohort_month
    GROUP BY ca.cohort_month, ca.months_since_signup, cs.cohort_size
  )

SELECT
  cohort_month,
  months_since_signup,
  cohort_size,
  active_customers,
  ROUND(100.0 * active_customers / cohort_size, 2) as retention_rate,
  cohort_revenue,
  ROUND(cohort_revenue / active_customers, 2) as revenue_per_active_customer
FROM cohort_retention
WHERE cohort_month >= '2023-01-01'
ORDER BY cohort_month, months_since_signup;
```

### Product Recommendation Engine

```sql
-- Find products frequently purchased together
WITH
  -- Get all order items
  order_pairs AS (
    SELECT
      oi1.order_id,
      oi1.product_id as product_a,
      oi2.product_id as product_b
    FROM order_items oi1
    JOIN order_items oi2
      ON oi1.order_id = oi2.order_id
      AND oi1.product_id < oi2.product_id  -- Avoid duplicates
    WHERE oi1.product_id != oi2.product_id
  ),

  -- Count co-occurrences
  product_associations AS (
    SELECT
      product_a,
      product_b,
      COUNT(DISTINCT order_id) as times_bought_together
    FROM order_pairs
    GROUP BY product_a, product_b
  ),

  -- Get individual product purchase counts
  product_popularity AS (
    SELECT
      product_id,
      COUNT(DISTINCT order_id) as total_orders
    FROM order_items
    GROUP BY product_id
  ),

  -- Calculate association strength (lift)
  product_recommendations AS (
    SELECT
      pa.product_a,
      pa.product_b,
      pa.times_bought_together,
      ppa.total_orders as product_a_orders,
      ppb.total_orders as product_b_orders,
      -- Lift: How much more likely to buy together vs independently
      ROUND(
        (pa.times_bought_together::FLOAT / ppa.total_orders) /
        (ppb.total_orders::FLOAT / (SELECT COUNT(DISTINCT order_id) FROM orders)),
        2
      ) as lift,
      -- Confidence: % of product A orders that include product B
      ROUND(100.0 * pa.times_bought_together / ppa.total_orders, 2) as confidence
    FROM product_associations pa
    JOIN product_popularity ppa ON pa.product_a = ppa.product_id
    JOIN product_popularity ppb ON pa.product_b = ppb.product_id
  )

SELECT
  pa.product_name as anchor_product,
  pb.product_name as recommended_product,
  pr.times_bought_together,
  pr.confidence as confidence_pct,
  pr.lift
FROM product_recommendations pr
JOIN products pa ON pr.product_a = pa.product_id
JOIN products pb ON pr.product_b = pb.product_id
WHERE pr.times_bought_together >= 10  -- Minimum support
  AND pr.lift > 1.5  -- At least 50% more likely together
  AND pr.confidence >= 20  -- At least 20% confidence
ORDER BY pr.product_a, pr.lift DESC;
```

### Financial Running Totals and Balances

```sql
-- Account balance tracking with running totals
WITH RECURSIVE
  -- Get all transactions
  all_transactions AS (
    SELECT
      transaction_id,
      account_id,
      transaction_date,
      transaction_type,
      CASE
        WHEN transaction_type IN ('deposit', 'credit') THEN amount
        WHEN transaction_type IN ('withdrawal', 'debit') THEN -amount
        ELSE 0
      END as signed_amount,
      description
    FROM transactions
    WHERE account_id = 'ACC-12345'
      AND transaction_date >= '2024-01-01'
  ),

  -- Add running balance
  running_balance AS (
    SELECT
      transaction_id,
      account_id,
      transaction_date,
      transaction_type,
      signed_amount,
      description,
      SUM(signed_amount) OVER (
        ORDER BY transaction_date, transaction_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as balance,
      ROW_NUMBER() OVER (ORDER BY transaction_date, transaction_id) as row_num
    FROM all_transactions
  ),

  -- Flag overdrafts
  flagged_transactions AS (
    SELECT
      *,
      CASE
        WHEN balance < 0 THEN 'OVERDRAFT'
        WHEN balance < 100 THEN 'LOW BALANCE'
        ELSE 'OK'
      END as balance_status,
      CASE
        WHEN balance < 0 AND LAG(balance) OVER (ORDER BY transaction_date, transaction_id) >= 0
        THEN TRUE
        ELSE FALSE
      END as overdraft_trigger
    FROM running_balance
  ),

  -- Calculate daily summaries
  daily_summary AS (
    SELECT
      transaction_date,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN signed_amount > 0 THEN signed_amount ELSE 0 END) as total_credits,
      SUM(CASE WHEN signed_amount < 0 THEN ABS(signed_amount) ELSE 0 END) as total_debits,
      MAX(balance) as end_of_day_balance,
      MIN(balance) as lowest_balance
    FROM flagged_transactions
    GROUP BY transaction_date
  )

-- Final report
SELECT
  ft.transaction_date,
  ft.transaction_id,
  ft.transaction_type,
  ft.signed_amount,
  ft.balance,
  ft.balance_status,
  ft.overdraft_trigger,
  ft.description,
  ds.total_credits as daily_credits,
  ds.total_debits as daily_debits
FROM flagged_transactions ft
JOIN daily_summary ds ON ft.transaction_date = ds.transaction_date
ORDER BY ft.transaction_date, ft.transaction_id;
```

### Sales Pipeline Analysis

```sql
-- Sales funnel conversion analysis
WITH
  -- Define pipeline stages
  pipeline_stages AS (
    SELECT stage_id, stage_name, stage_order
    FROM (VALUES
      (1, 'Lead', 1),
      (2, 'Qualified', 2),
      (3, 'Proposal', 3),
      (4, 'Negotiation', 4),
      (5, 'Closed Won', 5),
      (6, 'Closed Lost', 6)
    ) AS t(stage_id, stage_name, stage_order)
  ),

  -- Track opportunity stage transitions
  opportunity_history AS (
    SELECT
      opportunity_id,
      stage_id,
      stage_date,
      amount,
      LEAD(stage_id) OVER (PARTITION BY opportunity_id ORDER BY stage_date) as next_stage_id,
      LEAD(stage_date) OVER (PARTITION BY opportunity_id ORDER BY stage_date) as next_stage_date
    FROM opportunity_stages
  ),

  -- Calculate time in each stage
  stage_durations AS (
    SELECT
      oh.opportunity_id,
      ps.stage_name,
      ps.stage_order,
      oh.stage_date as entered_stage,
      oh.next_stage_date as exited_stage,
      COALESCE(
        EXTRACT(EPOCH FROM (oh.next_stage_date - oh.stage_date)) / 86400,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - oh.stage_date)) / 86400
      ) as days_in_stage,
      oh.amount
    FROM opportunity_history oh
    JOIN pipeline_stages ps ON oh.stage_id = ps.stage_id
  ),

  -- Calculate conversion rates between stages
  stage_conversions AS (
    SELECT
      ps1.stage_name as from_stage,
      ps2.stage_name as to_stage,
      COUNT(DISTINCT oh.opportunity_id) as converted_count,
      SUM(oh.amount) as converted_value
    FROM opportunity_history oh
    JOIN pipeline_stages ps1 ON oh.stage_id = ps1.stage_id
    JOIN pipeline_stages ps2 ON oh.next_stage_id = ps2.stage_id
    WHERE oh.next_stage_id IS NOT NULL
    GROUP BY ps1.stage_name, ps2.stage_name, ps1.stage_order, ps2.stage_order
  ),

  -- Overall funnel metrics
  funnel_metrics AS (
    SELECT
      ps.stage_name,
      ps.stage_order,
      COUNT(DISTINCT sd.opportunity_id) as opportunities,
      SUM(sd.amount) as total_value,
      AVG(sd.days_in_stage) as avg_days_in_stage,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sd.days_in_stage) as median_days_in_stage
    FROM stage_durations sd
    JOIN pipeline_stages ps ON sd.stage_name = ps.stage_name
    GROUP BY ps.stage_name, ps.stage_order
  )

SELECT
  fm.stage_name,
  fm.opportunities,
  fm.total_value,
  ROUND(fm.avg_days_in_stage, 1) as avg_days_in_stage,
  ROUND(fm.median_days_in_stage, 1) as median_days_in_stage,
  LAG(fm.opportunities) OVER (ORDER BY fm.stage_order) as prev_stage_opps,
  ROUND(
    100.0 * fm.opportunities /
    NULLIF(LAG(fm.opportunities) OVER (ORDER BY fm.stage_order), 0),
    2
  ) as conversion_rate_pct
FROM funnel_metrics fm
ORDER BY fm.stage_order;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Window Functions](/concepts/window-functions/) - Advanced analytical functions
- [Subqueries](/concepts/subqueries/) - Queries within queries
- [Joins](/concepts/joins/) - Combining data from multiple tables
- [Aggregations](/concepts/aggregations/) - Grouping and summarizing data
- [Performance Tuning](/concepts/performance/) - Optimizing query performance
