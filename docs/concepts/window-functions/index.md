---
title: Window Functions
description: Comprehensive guide to SQL window functions across different database systems
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, BigQuery, Snowflake, DuckDB]
difficulty: intermediate
tags: [analytics, aggregation, ranking]
---

# Window Functions

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Basic window function syntax
SELECT
  column1,
  column2,
  aggregate_function(column3) OVER (
    PARTITION BY partition_column
    ORDER BY order_column
    ROWS BETWEEN frame_start AND frame_end
  ) AS window_result
FROM table_name;
```

## Overview

Window functions perform calculations across a set of table rows that are related to the current row. Unlike regular aggregate functions, window functions do not group rows into a single output row — each row retains its separate identity.

Window functions are essential for:
- Calculating running totals and moving averages
- Ranking and percentile calculations
- Comparing values across rows (lag/lead)
- Calculating differences and ratios between rows

## Syntax

### Basic Structure

```sql
function_name([arguments]) OVER (
  [PARTITION BY partition_expression]
  [ORDER BY sort_expression [ASC | DESC]]
  [frame_clause]
)
```

### Components

1. **Function Name**: The window or aggregate function to apply
2. **PARTITION BY**: Divides rows into partitions (optional)
3. **ORDER BY**: Defines the order within each partition (optional)
4. **Frame Clause**: Defines the window frame (optional)

## Common Window Functions

### Ranking Functions

```sql
-- ROW_NUMBER: Unique sequential number
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num
FROM employees;

-- RANK: Rank with gaps for ties
SELECT
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;

-- DENSE_RANK: Rank without gaps
SELECT
  employee_id,
  department,
  salary,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank
FROM employees;

-- NTILE: Distribute rows into buckets
SELECT
  employee_id,
  salary,
  NTILE(4) OVER (ORDER BY salary DESC) as quartile
FROM employees;
```

### Aggregate Window Functions

```sql
-- Running total
SELECT
  order_date,
  order_id,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Average within partition
SELECT
  department,
  employee_id,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees;

-- Count of rows in partition
SELECT
  department,
  employee_id,
  COUNT(*) OVER (PARTITION BY department) as dept_employee_count
FROM employees;
```

### Value Functions

```sql
-- LAG: Access previous row value
SELECT
  order_date,
  amount,
  LAG(amount, 1) OVER (ORDER BY order_date) as previous_amount,
  amount - LAG(amount, 1) OVER (ORDER BY order_date) as change
FROM orders;

-- LEAD: Access next row value
SELECT
  order_date,
  amount,
  LEAD(amount, 1) OVER (ORDER BY order_date) as next_amount
FROM orders;

-- FIRST_VALUE and LAST_VALUE
SELECT
  employee_id,
  department,
  salary,
  FIRST_VALUE(salary) OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as highest_salary_in_dept
FROM employees;
```

## Platform-Specific Notes

<SQLComparison :dialects="['postgresql', 'mysql', 'sqlserver']" />

::: details PostgreSQL
PostgreSQL has the most comprehensive window function support:
- All standard window functions
- Support for custom frame specifications
- FILTER clause for conditional aggregation
- Full support for ROWS, RANGE, and GROUPS frame types
- Window function optimization in query planner

```sql
-- PostgreSQL-specific: FILTER clause
SELECT
  department,
  COUNT(*) FILTER (WHERE salary > 50000) OVER (PARTITION BY department) as high_earners
FROM employees;
```
:::

::: details MySQL
MySQL added window function support in version 8.0:
- All standard ranking and aggregate window functions
- LAG/LEAD support
- ROWS and RANGE frame types
- No GROUPS frame type (as of MySQL 8.0)
- Earlier versions (5.7 and below) do not support window functions

```sql
-- MySQL 8.0+ window functions work similarly to standard SQL
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg
FROM employees;
```
:::

::: details SQL Server
SQL Server has robust window function support:
- Introduced in SQL Server 2005 (basic functions)
- Enhanced in SQL Server 2012 (full support)
- Excellent optimization for window functions
- Support for ROWS and RANGE frames
- LAG/LEAD added in SQL Server 2012

```sql
-- SQL Server window functions
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
  PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary) as percentile
FROM employees;
```
:::

## Examples

### Basic Example: Ranking Employees by Salary

```sql
SELECT
  employee_id,
  employee_name,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary,
  salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees
ORDER BY department, salary_rank;
```

### Advanced Example: Moving Average

```sql
-- Calculate 7-day moving average of sales
SELECT
  sale_date,
  daily_sales,
  AVG(daily_sales) OVER (
    ORDER BY sale_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7day
FROM daily_sales
ORDER BY sale_date;
```

### Advanced Example: Year-over-Year Comparison

```sql
-- Compare sales to same month last year
WITH monthly_sales AS (
  SELECT
    DATE_TRUNC('month', sale_date) as month,
    SUM(amount) as total_sales
  FROM sales
  GROUP BY DATE_TRUNC('month', sale_date)
)
SELECT
  month,
  total_sales,
  LAG(total_sales, 12) OVER (ORDER BY month) as sales_last_year,
  total_sales - LAG(total_sales, 12) OVER (ORDER BY month) as yoy_change,
  ROUND(
    100.0 * (total_sales - LAG(total_sales, 12) OVER (ORDER BY month)) /
    NULLIF(LAG(total_sales, 12) OVER (ORDER BY month), 0),
    2
  ) as yoy_pct_change
FROM monthly_sales
ORDER BY month;
```

## Frame Specifications

### ROWS vs RANGE

```sql
-- ROWS: Physical row-based window
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as sum_last_3_rows
FROM orders;

-- RANGE: Value-based window (includes ties)
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
  ) as sum_last_7_days
FROM orders;
```

### Frame Boundaries

- `UNBOUNDED PRECEDING`: From the start of the partition
- `n PRECEDING`: n rows before the current row
- `CURRENT ROW`: The current row
- `n FOLLOWING`: n rows after the current row
- `UNBOUNDED FOLLOWING`: To the end of the partition

## Performance Considerations

### Indexing

Window functions benefit from indexes on:
- PARTITION BY columns
- ORDER BY columns
- Composite indexes on both

```sql
-- Create index to support window function
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_employees_dept_salary ON employees(department, salary);
```

### Optimization Tips

1. **Minimize partitions**: Large numbers of partitions can be expensive
2. **Use appropriate frame clauses**: Smaller frames are generally faster
3. **Avoid redundant calculations**: Reuse window definitions with named windows

```sql
-- Named window for reuse
SELECT
  employee_id,
  salary,
  AVG(salary) OVER w as avg_salary,
  MAX(salary) OVER w as max_salary,
  MIN(salary) OVER w as min_salary
FROM employees
WINDOW w AS (PARTITION BY department);
```

4. **Consider materialized CTEs**: For complex calculations used multiple times

## Common Pitfalls

### 1. Forgetting ORDER BY

```sql
-- ❌ Without ORDER BY, frame includes entire partition
SELECT
  employee_id,
  salary,
  SUM(salary) OVER (PARTITION BY department) as total
FROM employees;

-- ✅ With ORDER BY, creates running total
SELECT
  employee_id,
  salary,
  SUM(salary) OVER (PARTITION BY department ORDER BY employee_id) as running_total
FROM employees;
```

### 2. Frame Clause Confusion

```sql
-- Default frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Explicit frame specification
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;
```

### 3. NULL Handling

```sql
-- LAG/LEAD with default values for NULLs
SELECT
  order_date,
  amount,
  LAG(amount, 1, 0) OVER (ORDER BY order_date) as previous_amount,
  amount - COALESCE(LAG(amount, 1) OVER (ORDER BY order_date), 0) as change
FROM orders;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Aggregations](/concepts/aggregations/) - Regular aggregate functions
- [CTEs (Common Table Expressions)](/concepts/ctes/) - For organizing complex queries
- [Performance Optimization](/concepts/performance/) - Query tuning techniques
- [Analytics Patterns](/patterns/analytics/) - Real-world analytical query patterns
