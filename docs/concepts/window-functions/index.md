---
title: Window Functions
description: Comprehensive guide to SQL window functions across different database systems
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
  - window-functions
  - analytics
  - aggregation
  - ranking
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

#### ROW_NUMBER

Assigns a unique sequential integer to each row within a partition.

```sql
-- Basic ROW_NUMBER
SELECT
  employee_id,
  employee_name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num
FROM employees;

-- Using ROW_NUMBER for pagination
SELECT *
FROM (
  SELECT
    product_id,
    product_name,
    price,
    ROW_NUMBER() OVER (ORDER BY product_id) as row_num
  FROM products
) sub
WHERE row_num BETWEEN 11 AND 20;  -- Page 2, 10 items per page

-- ROW_NUMBER to find duplicates
SELECT *
FROM (
  SELECT
    email,
    customer_name,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as row_num
  FROM customers
) sub
WHERE row_num > 1;  -- Duplicate emails
```

**Important Notes**:

- Always assigns unique numbers, even for tied values
- Requires ORDER BY to be deterministic
- Without ORDER BY in window, order is arbitrary

#### RANK and DENSE_RANK

RANK assigns ranks with gaps for ties; DENSE_RANK assigns ranks without gaps.

```sql
-- Comparing RANK vs DENSE_RANK
SELECT
  employee_id,
  employee_name,
  salary,
  RANK() OVER (ORDER BY salary DESC) as rank,
  DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num
FROM employees
ORDER BY salary DESC;

/*
Example output with salaries: 100k, 100k, 90k, 80k
employee_id | salary | rank | dense_rank | row_num
1           | 100000 | 1    | 1          | 1
2           | 100000 | 1    | 1          | 2
3           | 90000  | 3    | 2          | 3
4           | 80000  | 4    | 3          | 4
*/

-- Rank within department
SELECT
  department,
  employee_id,
  employee_name,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees
ORDER BY department, dept_rank;

-- Find top 3 in each department
SELECT *
FROM (
  SELECT
    department,
    employee_id,
    employee_name,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
  FROM employees
) ranked
WHERE rank <= 3
ORDER BY department, rank;
```

**RANK vs DENSE_RANK**:

- RANK: 1, 1, 3, 4 (leaves gaps)
- DENSE_RANK: 1, 1, 2, 3 (no gaps)
- Use RANK for traditional competition ranking
- Use DENSE_RANK when you want consecutive ranks

#### NTILE

Divides rows into a specified number of approximately equal groups.

```sql
-- Quartiles (4 groups)
SELECT
  employee_id,
  salary,
  NTILE(4) OVER (ORDER BY salary DESC) as salary_quartile
FROM employees;

-- Deciles (10 groups)
SELECT
  product_id,
  price,
  NTILE(10) OVER (ORDER BY price DESC) as price_decile
FROM products;

-- Percentiles within department
SELECT
  department,
  employee_id,
  salary,
  NTILE(100) OVER (PARTITION BY department ORDER BY salary DESC) as percentile
FROM employees;

-- Finding median using NTILE
SELECT
  department,
  AVG(salary) as median_salary
FROM (
  SELECT
    department,
    salary,
    NTILE(2) OVER (PARTITION BY department ORDER BY salary) as half
  FROM employees
) sub
WHERE half = 1
GROUP BY department;
```

**Important Notes**:

- Groups may not be exactly equal if rows don't divide evenly
- First groups get one extra row when division is uneven
- Useful for creating equal-sized segments

#### PERCENT_RANK

Calculates the relative rank of a row as a percentage (0 to 1).

```sql
-- PERCENT_RANK: Relative position
SELECT
  employee_id,
  employee_name,
  salary,
  PERCENT_RANK() OVER (ORDER BY salary DESC) as pct_rank,
  ROUND(PERCENT_RANK() OVER (ORDER BY salary DESC) * 100, 2) as percentile
FROM employees
ORDER BY salary DESC;

-- PERCENT_RANK by department
SELECT
  department,
  employee_id,
  salary,
  PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_pct_rank
FROM employees
ORDER BY department, dept_pct_rank;

-- Find employees in top 10% by salary
SELECT *
FROM (
  SELECT
    employee_id,
    employee_name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary DESC) as pct_rank
  FROM employees
) ranked
WHERE pct_rank <= 0.10;
```

**Formula**: `(rank - 1) / (total_rows - 1)`
**Range**: 0 to 1
**Use Case**: Finding relative position, percentile analysis

#### CUME_DIST

Calculates the cumulative distribution (percentage of rows less than or equal to current row).

```sql
-- CUME_DIST: Cumulative distribution
SELECT
  employee_id,
  salary,
  CUME_DIST() OVER (ORDER BY salary) as cume_dist,
  ROUND(CUME_DIST() OVER (ORDER BY salary) * 100, 2) as pct_below_or_equal
FROM employees
ORDER BY salary;

-- Find products in bottom 25% by price
SELECT *
FROM (
  SELECT
    product_id,
    product_name,
    price,
    CUME_DIST() OVER (ORDER BY price) as cume_dist
  FROM products
) sub
WHERE cume_dist <= 0.25;

-- CUME_DIST by category
SELECT
  category,
  product_name,
  price,
  CUME_DIST() OVER (PARTITION BY category ORDER BY price) as price_cume_dist
FROM products
ORDER BY category, price;
```

**Formula**: `(number of rows ≤ current row) / (total rows)`
**Range**: Greater than 0, up to 1
**Difference from PERCENT_RANK**: CUME_DIST tells you what fraction of rows are at or below, PERCENT_RANK tells you relative position

### Aggregate Window Functions

All standard aggregate functions (SUM, AVG, COUNT, MIN, MAX) can be used as window functions.

#### Running Totals and Cumulative Aggregates

```sql
-- Running total (cumulative sum)
SELECT
  order_date,
  order_id,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total,
  SUM(amount) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total_explicit
FROM orders
ORDER BY order_date;

-- Running count
SELECT
  order_date,
  order_id,
  COUNT(*) OVER (ORDER BY order_date) as cumulative_order_count
FROM orders
ORDER BY order_date;

-- Running average
SELECT
  order_date,
  amount,
  AVG(amount) OVER (ORDER BY order_date) as cumulative_avg
FROM orders
ORDER BY order_date;

-- Running min/max
SELECT
  order_date,
  amount,
  MIN(amount) OVER (ORDER BY order_date) as min_amount_so_far,
  MAX(amount) OVER (ORDER BY order_date) as max_amount_so_far
FROM orders
ORDER BY order_date;
```

#### Partition-Level Aggregates

```sql
-- Department statistics
SELECT
  department,
  employee_id,
  employee_name,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary,
  MIN(salary) OVER (PARTITION BY department) as dept_min_salary,
  MAX(salary) OVER (PARTITION BY department) as dept_max_salary,
  COUNT(*) OVER (PARTITION BY department) as dept_employee_count,
  salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees
ORDER BY department, salary DESC;

-- Total vs partition total
SELECT
  category,
  product_name,
  sales,
  SUM(sales) OVER () as total_sales,
  SUM(sales) OVER (PARTITION BY category) as category_sales,
  ROUND(100.0 * sales / SUM(sales) OVER (PARTITION BY category), 2) as pct_of_category,
  ROUND(100.0 * sales / SUM(sales) OVER (), 2) as pct_of_total
FROM product_sales
ORDER BY category, sales DESC;
```

#### Moving Aggregates

```sql
-- Moving average (3-row window)
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as moving_avg_3
FROM orders
ORDER BY order_date;

-- Moving sum (7-day window)
SELECT
  sale_date,
  daily_sales,
  SUM(daily_sales) OVER (
    ORDER BY sale_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as sales_last_7_days
FROM daily_sales
ORDER BY sale_date;

-- Centered moving average (3-period centered)
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) as centered_avg_3
FROM orders
ORDER BY order_date;

-- Moving count
SELECT
  order_date,
  COUNT(*) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as orders_last_7_days
FROM orders
ORDER BY order_date;
```

#### COUNT with Window Functions

```sql
-- Count all rows in partition
SELECT
  department,
  employee_id,
  COUNT(*) OVER (PARTITION BY department) as dept_size
FROM employees;

-- Count with frame
SELECT
  order_date,
  COUNT(*) OVER (
    ORDER BY order_date
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ) as orders_last_30_days
FROM orders;

-- Count distinct (requires subquery in most databases)
SELECT DISTINCT
  department,
  COUNT(*) OVER (PARTITION BY department) as total_employees,
  dept_job_titles
FROM (
  SELECT
    department,
    employee_id,
    COUNT(DISTINCT job_title) OVER (PARTITION BY department) as dept_job_titles
  FROM employees
) sub;
```

### Value Functions

Value functions allow you to access values from other rows relative to the current row.

#### LAG

Access values from previous rows.

```sql
-- Basic LAG: Previous row value
SELECT
  order_date,
  amount,
  LAG(amount) OVER (ORDER BY order_date) as previous_amount,
  LAG(amount, 1) OVER (ORDER BY order_date) as previous_amount_explicit
FROM orders
ORDER BY order_date;

-- LAG with offset
SELECT
  order_date,
  amount,
  LAG(amount, 1) OVER (ORDER BY order_date) as prev_day,
  LAG(amount, 7) OVER (ORDER BY order_date) as prev_week,
  LAG(amount, 30) OVER (ORDER BY order_date) as prev_month
FROM daily_sales
ORDER BY order_date;

-- LAG with default value
SELECT
  order_date,
  amount,
  LAG(amount, 1, 0) OVER (ORDER BY order_date) as previous_amount,
  amount - LAG(amount, 1, 0) OVER (ORDER BY order_date) as day_over_day_change
FROM orders
ORDER BY order_date;

-- LAG within partition
SELECT
  customer_id,
  order_date,
  amount,
  LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as previous_order_date,
  order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as days_since_last_order
FROM orders
ORDER BY customer_id, order_date;

-- Calculate day-over-day change percentage
SELECT
  order_date,
  daily_revenue,
  LAG(daily_revenue) OVER (ORDER BY order_date) as prev_day_revenue,
  daily_revenue - LAG(daily_revenue) OVER (ORDER BY order_date) as revenue_change,
  ROUND(
    100.0 * (daily_revenue - LAG(daily_revenue) OVER (ORDER BY order_date)) /
    NULLIF(LAG(daily_revenue) OVER (ORDER BY order_date), 0),
    2
  ) as pct_change
FROM daily_revenue_summary
ORDER BY order_date;
```

#### LEAD

Access values from following rows.

```sql
-- Basic LEAD: Next row value
SELECT
  order_date,
  amount,
  LEAD(amount) OVER (ORDER BY order_date) as next_amount,
  LEAD(amount, 1) OVER (ORDER BY order_date) as next_amount_explicit
FROM orders
ORDER BY order_date;

-- LEAD with offset
SELECT
  order_date,
  amount,
  LEAD(amount, 1) OVER (ORDER BY order_date) as next_day,
  LEAD(amount, 7) OVER (ORDER BY order_date) as next_week
FROM daily_sales
ORDER BY order_date;

-- LEAD with default value
SELECT
  order_date,
  amount,
  LEAD(amount, 1, 0) OVER (ORDER BY order_date) as next_amount
FROM orders
ORDER BY order_date;

-- Compare current with next
SELECT
  product_id,
  price_date,
  price,
  LEAD(price) OVER (PARTITION BY product_id ORDER BY price_date) as next_price,
  LEAD(price_date) OVER (PARTITION BY product_id ORDER BY price_date) as next_price_date,
  CASE
    WHEN LEAD(price) OVER (PARTITION BY product_id ORDER BY price_date) > price THEN 'Increase'
    WHEN LEAD(price) OVER (PARTITION BY product_id ORDER BY price_date) < price THEN 'Decrease'
    WHEN LEAD(price) OVER (PARTITION BY product_id ORDER BY price_date) = price THEN 'No Change'
    ELSE 'Last Record'
  END as price_trend
FROM product_prices
ORDER BY product_id, price_date;
```

#### FIRST_VALUE and LAST_VALUE

Access the first or last value in a window frame.

```sql
-- FIRST_VALUE: Get first value in partition
SELECT
  department,
  employee_id,
  employee_name,
  salary,
  FIRST_VALUE(employee_name) OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as highest_paid_in_dept,
  FIRST_VALUE(salary) OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as highest_salary_in_dept
FROM employees
ORDER BY department, salary DESC;

-- LAST_VALUE with proper frame
SELECT
  department,
  employee_id,
  employee_name,
  salary,
  LAST_VALUE(employee_name) OVER (
    PARTITION BY department
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as lowest_paid_in_dept,
  LAST_VALUE(salary) OVER (
    PARTITION BY department
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as lowest_salary_in_dept
FROM employees
ORDER BY department, salary DESC;

-- Compare to first and last in window
SELECT
  order_date,
  amount,
  FIRST_VALUE(amount) OVER (ORDER BY order_date) as first_order_amount,
  LAST_VALUE(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as last_order_amount,
  amount - FIRST_VALUE(amount) OVER (ORDER BY order_date) as diff_from_first
FROM orders
ORDER BY order_date;

-- First and last values in moving window
SELECT
  order_date,
  amount,
  FIRST_VALUE(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as first_in_7day_window,
  LAST_VALUE(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as last_in_7day_window
FROM orders
ORDER BY order_date;
```

**Important Note on LAST_VALUE**:

- Default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`
- This makes LAST_VALUE return the current row by default
- Use `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` to get the actual last value in the partition

#### NTH_VALUE

Access the nth value in a window frame (PostgreSQL, Oracle, SQL Server 2012+).

```sql
-- Get specific position in window
SELECT
  department,
  employee_name,
  salary,
  NTH_VALUE(employee_name, 1) OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as top_earner,
  NTH_VALUE(salary, 2) OVER (
    PARTITION BY department
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as second_highest_salary,
  NTH_VALUE(salary, 3) OVER (
    PARTITION BY department
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as third_highest_salary
FROM employees
ORDER BY department, salary DESC;

-- Quartile values
SELECT DISTINCT
  department,
  NTH_VALUE(salary, 1) OVER w as max_salary,
  NTH_VALUE(salary, CAST(COUNT(*) OVER w * 0.75 AS INTEGER)) OVER w as q3,
  NTH_VALUE(salary, CAST(COUNT(*) OVER w * 0.50 AS INTEGER)) OVER w as median,
  NTH_VALUE(salary, CAST(COUNT(*) OVER w * 0.25 AS INTEGER)) OVER w as q1,
  NTH_VALUE(salary, COUNT(*) OVER w) OVER w as min_salary
FROM employees
WINDOW w AS (
  PARTITION BY department
  ORDER BY salary DESC
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY department;
```

## Platform-Specific Notes

<SQLComparison :dialects="['postgresql', 'mysql', 'sqlserver']" />

::: details PostgreSQL
PostgreSQL has the most comprehensive window function support among open-source databases:

**Supported Features**:

- All standard window functions (ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK, CUME_DIST)
- All aggregate functions as window functions
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- FILTER clause for conditional aggregation
- Full support for ROWS, RANGE, and GROUPS frame types
- EXCLUDE clause for frame exclusion
- Named window definitions with WINDOW clause
- Excellent query planner optimization

**Unique Features**:

```sql
-- FILTER clause (PostgreSQL, SQLite 3.30+)
SELECT
  department,
  employee_name,
  salary,
  COUNT(*) FILTER (WHERE salary > 50000) OVER (PARTITION BY department) as high_earners,
  AVG(salary) FILTER (WHERE salary > 50000) OVER (PARTITION BY department) as avg_high_salary
FROM employees;

-- GROUPS frame type (PostgreSQL 11+)
SELECT
  order_date,
  product_id,
  quantity,
  SUM(quantity) OVER (
    ORDER BY order_date
    GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) as sum_adjacent_groups
FROM orders;

-- EXCLUDE clause (PostgreSQL 11+)
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (
    ORDER BY salary
    ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    EXCLUDE CURRENT ROW
  ) as avg_excluding_self
FROM employees;

-- MODE() as window function
SELECT
  department,
  employee_id,
  job_title,
  MODE() WITHIN GROUP (ORDER BY job_title) OVER (PARTITION BY department) as most_common_title
FROM employees;
```

**Performance Notes**:

- Excellent optimization with incremental calculation for aggregates
- Supports parallel execution for some window queries (9.6+)
- Efficient index usage for PARTITION BY and ORDER BY
  :::

::: details MySQL
MySQL added window function support in version 8.0 (August 2018).

**Supported Features** (MySQL 8.0+):

- ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK, CUME_DIST
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- All aggregate functions as window functions
- ROWS and RANGE frame types
- Named windows with WINDOW clause

**Limitations**:

- No GROUPS frame type
- No FILTER clause (use CASE instead)
- No EXCLUDE clause
- Earlier versions (5.7 and below) have no window function support

**MySQL 8.0+ Examples**:

```sql
-- Basic window functions work like standard SQL
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER w as row_num,
  RANK() OVER w as rank,
  AVG(salary) OVER w as dept_avg
FROM employees
WINDOW w AS (PARTITION BY department ORDER BY salary DESC);

-- LAG/LEAD for year-over-year comparison
SELECT
  YEAR(order_date) as year,
  MONTH(order_date) as month,
  SUM(amount) as monthly_revenue,
  LAG(SUM(amount), 12) OVER (ORDER BY YEAR(order_date), MONTH(order_date)) as prev_year_revenue
FROM orders
GROUP BY YEAR(order_date), MONTH(order_date);

-- Workaround for FILTER using CASE
SELECT
  department,
  COUNT(CASE WHEN salary > 50000 THEN 1 END) OVER (PARTITION BY department) as high_earners
FROM employees;
```

**Migration from MySQL 5.7**:

- Use variables workaround in older versions:

```sql
-- MySQL 5.7 workaround for ROW_NUMBER
SET @row_num = 0;
SET @dept = '';

SELECT
  employee_id,
  department,
  salary,
  @row_num := IF(@dept = department, @row_num + 1, 1) as row_num,
  @dept := department as dept_var
FROM employees
ORDER BY department, salary DESC;
```

:::

::: details SQL Server
SQL Server has had window function support since 2005, with significant enhancements in 2012.

**Version History**:

- SQL Server 2005: ROW_NUMBER, basic OVER clause
- SQL Server 2012: RANK, DENSE_RANK, NTILE, LAG, LEAD, FIRST_VALUE, LAST_VALUE, CUME_DIST, PERCENT_RANK
- SQL Server 2012+: Full frame clause support (ROWS, RANGE)
- SQL Server 2022: WINDOW clause support

**Supported Features** (SQL Server 2012+):

- All standard ranking functions
- LAG, LEAD, FIRST_VALUE, LAST_VALUE
- All aggregate functions as window functions
- ROWS and RANGE frame types
- Excellent query optimizer support
- STRING_AGG as window function (2017+)

**Limitations**:

- No GROUPS frame type
- No FILTER clause (use CASE instead)
- No NTH_VALUE (use workarounds)
- WINDOW clause added in SQL Server 2022

**Examples**:

```sql
-- Ranking functions
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank,
  NTILE(4) OVER (PARTITION BY department ORDER BY salary DESC) as quartile,
  PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary) as pct_rank,
  CUME_DIST() OVER (PARTITION BY department ORDER BY salary) as cume_dist
FROM employees;

-- LAG/LEAD (SQL Server 2012+)
SELECT
  order_date,
  amount,
  LAG(amount, 1, 0) OVER (ORDER BY order_date) as prev_amount,
  LEAD(amount, 1, 0) OVER (ORDER BY order_date) as next_amount
FROM orders;

-- Running totals
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING) as running_total
FROM orders;

-- NTH_VALUE workaround (before SQL Server 2022)
SELECT
  department,
  employee_name,
  salary,
  FIRST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC) as max_salary,
  (
    SELECT salary
    FROM employees e2
    WHERE e2.department = e1.department
    ORDER BY salary DESC
    OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY
  ) as second_highest_salary
FROM employees e1;

-- STRING_AGG with window (SQL Server 2017+)
SELECT DISTINCT
  department,
  STRING_AGG(employee_name, ', ') OVER (PARTITION BY department ORDER BY salary DESC) as employees_by_salary
FROM employees;
```

**Performance Tips**:

- SQL Server optimizes window functions very well
- Use columnstore indexes for analytical queries with windows
- Batch mode execution (SQL Server 2012+) significantly improves performance
  :::

::: details Oracle
Oracle has had comprehensive window function support since Oracle 8i (1999).

**Supported Features**:

- All standard window functions
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- All aggregate functions as window functions
- ROWS, RANGE, and GROUPS frame types (GROUPS added in 21c)
- KEEP clause for min/max aggregates
- Advanced analytical functions
- Excellent optimization

**Unique Features**:

```sql
-- KEEP clause: Get first/last value based on ordering
SELECT
  department,
  employee_name,
  salary,
  MAX(employee_name) KEEP (DENSE_RANK FIRST ORDER BY salary DESC) OVER (PARTITION BY department) as highest_paid_name,
  MIN(salary) KEEP (DENSE_RANK LAST ORDER BY hire_date) OVER (PARTITION BY department) as latest_hire_salary
FROM employees;

-- RATIO_TO_REPORT
SELECT
  product_id,
  sales,
  RATIO_TO_REPORT(sales) OVER (PARTITION BY category) as ratio_within_category,
  RATIO_TO_REPORT(sales) OVER () as ratio_overall
FROM product_sales;

-- Model clause with window functions
SELECT
  year,
  month,
  revenue,
  SUM(revenue) OVER (PARTITION BY year ORDER BY month) as ytd_revenue,
  REGR_SLOPE(revenue, month) OVER (PARTITION BY year) as monthly_trend
FROM monthly_revenue;

-- WIDTH_BUCKET for histogram
SELECT
  salary,
  WIDTH_BUCKET(salary, 30000, 150000, 10) OVER () as salary_bucket,
  COUNT(*) OVER (
    PARTITION BY WIDTH_BUCKET(salary, 30000, 150000, 10)
  ) as employees_in_bucket
FROM employees;
```

**Oracle-Specific Syntax**:

```sql
-- Windowing clause (ROWS vs RANGE)
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW
  ) as sales_last_7_days
FROM orders;

-- NULLS FIRST/LAST in ORDER BY
SELECT
  department,
  employee_name,
  commission_pct,
  RANK() OVER (
    PARTITION BY department
    ORDER BY commission_pct DESC NULLS LAST
  ) as commission_rank
FROM employees;
```

:::

::: details SQLite
SQLite added window function support in version 3.25.0 (September 2018).

**Supported Features** (SQLite 3.25+):

- ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK, CUME_DIST
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- All aggregate functions as window functions
- ROWS, RANGE, and GROUPS frame types
- FILTER clause (3.30+)
- EXCLUDE clause (3.28+)

**Limitations**:

- Earlier versions (< 3.25) have no window function support
- Performance may be slower than other databases for large datasets
- Limited optimization compared to enterprise databases

**Examples**:

```sql
-- Basic window functions
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;

-- FILTER clause (SQLite 3.30+)
SELECT
  department,
  COUNT(*) OVER (PARTITION BY department) as total_employees,
  COUNT(*) FILTER (WHERE salary > 50000) OVER (PARTITION BY department) as high_earners
FROM employees;

-- EXCLUDE clause (SQLite 3.28+)
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
    EXCLUDE CURRENT ROW
  ) as avg_nearby_excluding_current
FROM orders;

-- GROUPS frame type (SQLite 3.28+)
SELECT
  category,
  product_name,
  price,
  AVG(price) OVER (
    PARTITION BY category
    ORDER BY price
    GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) as avg_price_nearby_groups
FROM products;
```

**Compatibility Notes**:

- SQLite's window function syntax closely follows PostgreSQL
- Very useful for embedded analytics
- Check SQLite version before using: `SELECT sqlite_version();`
  :::

::: details BigQuery
Google BigQuery has comprehensive window function support optimized for large-scale analytics.

**Supported Features**:

- All standard window functions
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- All aggregate functions as window functions
- ROWS and RANGE frame types
- Named windows with WINDOW clause
- Arrays and structs in window functions

**Limitations**:

- No GROUPS frame type
- No FILTER clause (use CASE instead)
- No EXCLUDE clause

**BigQuery-Specific Features**:

```sql
-- PERCENTILE functions
SELECT
  employee_id,
  salary,
  PERCENTILE_CONT(salary, 0.5) OVER (PARTITION BY department) as median_salary,
  PERCENTILE_DISC(salary, 0.5) OVER (PARTITION BY department) as median_salary_discrete
FROM employees;

-- ANY_VALUE for arbitrary selection
SELECT
  customer_id,
  ANY_VALUE(customer_name) OVER (PARTITION BY customer_id) as customer_name,
  order_date,
  amount
FROM orders;

-- ARRAY_AGG as window function
SELECT
  department,
  employee_id,
  ARRAY_AGG(employee_name) OVER (
    PARTITION BY department
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as top_employees_so_far
FROM employees;

-- Date-based RANGE windows
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN INTERVAL 7 DAY PRECEDING AND CURRENT ROW
  ) as sales_last_7_days
FROM orders;

-- Complex analytical queries
SELECT
  product_id,
  order_date,
  quantity,
  -- Multiple windows
  AVG(quantity) OVER w1 as avg_qty_30days,
  SUM(quantity) OVER w2 as cumulative_qty,
  RANK() OVER w3 as daily_rank
FROM order_items
WINDOW
  w1 AS (PARTITION BY product_id ORDER BY order_date RANGE BETWEEN INTERVAL 30 DAY PRECEDING AND CURRENT ROW),
  w2 AS (PARTITION BY product_id ORDER BY order_date),
  w3 AS (PARTITION BY order_date ORDER BY quantity DESC);
```

**Performance Tips**:

- BigQuery automatically optimizes window functions
- PARTITION BY on high-cardinality columns may be expensive
- Use clustering and partitioning on tables for better performance
- Consider approximate functions (APPROX_QUANTILES) for very large datasets
  :::

::: details Snowflake
Snowflake has comprehensive window function support optimized for cloud-scale analytics.

**Supported Features**:

- All standard window functions
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- All aggregate functions as window functions
- ROWS and RANGE frame types
- Named windows with WINDOW clause
- Conditional window functions
- Excellent performance and automatic optimization

**Limitations**:

- No GROUPS frame type
- No FILTER clause (use CASE or IFF instead)

**Snowflake-Specific Features**:

```sql
-- QUALIFY clause (filter on window functions directly)
SELECT
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees
QUALIFY RANK() OVER (PARTITION BY department ORDER BY salary DESC) <= 3;

-- RATIO_TO_REPORT
SELECT
  product_id,
  sales,
  RATIO_TO_REPORT(sales) OVER (PARTITION BY category) as pct_of_category,
  RATIO_TO_REPORT(sales) OVER () as pct_of_total
FROM product_sales;

-- WIDTH_BUCKET
SELECT
  salary,
  WIDTH_BUCKET(salary, 30000, 150000, 10) as salary_bucket
FROM employees;

-- CONDITIONAL_TRUE_EVENT / CONDITIONAL_CHANGE_EVENT
SELECT
  customer_id,
  order_date,
  amount,
  CONDITIONAL_TRUE_EVENT(amount > 1000) OVER (
    PARTITION BY customer_id ORDER BY order_date
  ) as high_value_order_session
FROM orders;

-- IFF for conditional logic (Snowflake's inline IF)
SELECT
  department,
  COUNT(IFF(salary > 50000, 1, NULL)) OVER (PARTITION BY department) as high_earners
FROM employees;

-- Time-based windows
SELECT
  order_timestamp,
  amount,
  SUM(amount) OVER (
    ORDER BY order_timestamp
    RANGE BETWEEN INTERVAL '1 HOUR' PRECEDING AND CURRENT ROW
  ) as sales_last_hour
FROM orders;

-- Named windows for complex queries
SELECT
  product_id,
  order_date,
  quantity,
  AVG(quantity) OVER w1 as moving_avg_30days,
  SUM(quantity) OVER w2 as ytd_quantity,
  RANK() OVER w3 as product_rank
FROM order_items
WINDOW
  w1 AS (PARTITION BY product_id ORDER BY order_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW),
  w2 AS (PARTITION BY product_id, YEAR(order_date) ORDER BY order_date),
  w3 AS (ORDER BY SUM(quantity) OVER (PARTITION BY product_id) DESC);
```

**Performance Advantages**:

- Automatic query optimization and caching
- Micro-partition pruning helps window function performance
- Result caching for repeated window queries
- Excellent scalability with warehouse sizing
  :::

::: details DuckDB
DuckDB has comprehensive window function support, following PostgreSQL closely.

**Supported Features**:

- All standard window functions
- LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE
- All aggregate functions as window functions
- ROWS, RANGE, and GROUPS frame types
- FILTER clause
- EXCLUDE clause
- Named windows with WINDOW clause
- Excellent performance optimization

**DuckDB-Specific Features**:

```sql
-- FILTER clause (like PostgreSQL)
SELECT
  department,
  COUNT(*) FILTER (WHERE salary > 50000) OVER (PARTITION BY department) as high_earners,
  AVG(salary) FILTER (WHERE salary > 50000) OVER (PARTITION BY department) as avg_high_salary
FROM employees;

-- EXCLUDE clause
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (
    ORDER BY salary
    ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    EXCLUDE CURRENT ROW
  ) as avg_nearby_excluding_self
FROM employees;

-- GROUPS frame type
SELECT
  order_date,
  product_id,
  quantity,
  SUM(quantity) OVER (
    ORDER BY order_date
    GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) as sum_adjacent_date_groups
FROM orders;

-- Aggregate functions with ORDER BY (like PostgreSQL)
SELECT
  department,
  STRING_AGG(employee_name, ', ' ORDER BY salary DESC) OVER (PARTITION BY department) as employees_by_salary
FROM employees;

-- QUALIFY clause (like Snowflake)
SELECT
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees
QUALIFY rank <= 3;

-- Percentile functions
SELECT
  department,
  salary,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) OVER (PARTITION BY department) as median,
  PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY salary) OVER (PARTITION BY department) as median_discrete
FROM employees;

-- List aggregation as window
SELECT
  category,
  product_id,
  LIST(product_name ORDER BY sales DESC) OVER (PARTITION BY category) as top_products
FROM product_sales;
```

**Performance Notes**:

- DuckDB has excellent window function optimization
- In-memory processing makes windows very fast
- Supports parallel window execution
- Vectorized execution for better performance
- Great for embedded analytics and data science workflows
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

Window frames define the subset of rows used for calculation relative to the current row. Understanding frames is crucial for getting correct results with window functions.

### Frame Types: ROWS, RANGE, and GROUPS

#### ROWS Frame

Physical row-based windows - counts actual rows regardless of value ties.

```sql
-- ROWS: Count physical rows
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as sum_last_3_rows,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
  ) as avg_5_row_window
FROM orders
ORDER BY order_date;

-- ROWS with asymmetric frame
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as sum_last_7_days,
  COUNT(*) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as count_last_7_days
FROM daily_sales
ORDER BY order_date;

-- ROWS UNBOUNDED
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  ) as remaining_total
FROM orders
ORDER BY order_date;
```

#### RANGE Frame

Value-based windows - includes all rows with the same ORDER BY value (handles ties).

```sql
-- RANGE: Value-based window
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders
ORDER BY order_date;

-- RANGE with ties
SELECT
  employee_id,
  salary,
  COUNT(*) OVER (
    ORDER BY salary
    RANGE BETWEEN CURRENT ROW AND CURRENT ROW
  ) as employees_with_same_salary
FROM employees
ORDER BY salary;

-- RANGE with interval (PostgreSQL, Oracle, BigQuery, Snowflake)
SELECT
  order_date,
  daily_sales,
  SUM(daily_sales) OVER (
    ORDER BY order_date
    RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
  ) as sales_last_7_days,
  AVG(daily_sales) OVER (
    ORDER BY order_date
    RANGE BETWEEN INTERVAL '30 days' PRECEDING AND CURRENT ROW
  ) as avg_last_30_days
FROM daily_sales
ORDER BY order_date;

-- RANGE with numeric offset (PostgreSQL 11+)
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (
    ORDER BY salary
    RANGE BETWEEN 5000 PRECEDING AND 5000 FOLLOWING
  ) as avg_salary_nearby
FROM employees
ORDER BY salary;
```

**RANGE vs ROWS Difference**:

```sql
-- Example with tied values
-- Data: salaries = [50000, 50000, 60000, 70000]

-- ROWS: Counts physical rows
SELECT
  salary,
  ROW_NUMBER() OVER (ORDER BY salary) as row_num,
  AVG(salary) OVER (
    ORDER BY salary
    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
  ) as avg_rows
FROM employees;
/*
salary | row_num | avg_rows
50000  | 1       | 50000     (only current)
50000  | 2       | 50000     (row 1 and 2)
60000  | 3       | 55000     (row 2 and 3)
70000  | 4       | 65000     (row 3 and 4)
*/

-- RANGE: Includes all rows with same value
SELECT
  salary,
  ROW_NUMBER() OVER (ORDER BY salary) as row_num,
  AVG(salary) OVER (
    ORDER BY salary
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as avg_range
FROM employees;
/*
salary | row_num | avg_range
50000  | 1       | 50000     (both 50000 rows included)
50000  | 2       | 50000     (both 50000 rows included)
60000  | 3       | 53333     (50000, 50000, 60000)
70000  | 4       | 57500     (all rows)
*/
```

#### GROUPS Frame

Groups rows with the same ORDER BY values together (PostgreSQL 11+, Oracle 21c+, SQLite 3.28+).

```sql
-- GROUPS: Group by ORDER BY value
SELECT
  order_date,
  product_id,
  quantity,
  SUM(quantity) OVER (
    ORDER BY order_date
    GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) as sum_adjacent_dates,
  COUNT(*) OVER (
    ORDER BY order_date
    GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) as rows_in_adjacent_dates
FROM orders
ORDER BY order_date, product_id;

-- GROUPS for handling ties
SELECT
  employee_id,
  salary,
  FIRST_VALUE(employee_id) OVER (
    ORDER BY salary DESC
    GROUPS BETWEEN CURRENT GROUP AND CURRENT GROUP
  ) as first_employee_in_salary_group,
  COUNT(*) OVER (
    ORDER BY salary DESC
    GROUPS BETWEEN CURRENT GROUP AND CURRENT GROUP
  ) as employees_with_same_salary
FROM employees
ORDER BY salary DESC;

-- GROUPS UNBOUNDED
SELECT
  category,
  product_name,
  price,
  COUNT(*) OVER (
    PARTITION BY category
    ORDER BY price
    GROUPS BETWEEN UNBOUNDED PRECEDING AND CURRENT GROUP
  ) as price_groups_so_far
FROM products
ORDER BY category, price;
```

**ROWS vs RANGE vs GROUPS**:

```sql
-- Example dataset: order_date has ties
-- Data:
-- 2024-01-01, product_a, 10
-- 2024-01-01, product_b, 20
-- 2024-01-02, product_c, 15
-- 2024-01-03, product_d, 25

SELECT
  order_date,
  product_id,
  quantity,
  SUM(quantity) OVER (ORDER BY order_date ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) as sum_rows,
  SUM(quantity) OVER (ORDER BY order_date RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as sum_range,
  SUM(quantity) OVER (ORDER BY order_date GROUPS BETWEEN 1 PRECEDING AND CURRENT GROUP) as sum_groups
FROM orders;
/*
order_date  | product | quantity | sum_rows | sum_range | sum_groups
2024-01-01  | a       | 10       | 10       | 30        | 30
2024-01-01  | b       | 20       | 30       | 30        | 30
2024-01-02  | c       | 15       | 35       | 45        | 45
2024-01-03  | d       | 25       | 40       | 70        | 40
                                    ^          ^          ^
                              (15+25)    (all rows) (15+25, both groups)
*/
```

### Frame Boundaries

Complete list of frame boundary options:

| Boundary              | Description                         |
| --------------------- | ----------------------------------- |
| `UNBOUNDED PRECEDING` | From the start of the partition     |
| `n PRECEDING`         | n rows/values/groups before current |
| `CURRENT ROW`         | The current row                     |
| `n FOLLOWING`         | n rows/values/groups after current  |
| `UNBOUNDED FOLLOWING` | To the end of the partition         |

**Default Frames**:

- Without ORDER BY: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` (entire partition)
- With ORDER BY: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` (up to current row)

```sql
-- These are equivalent (with ORDER BY)
SELECT SUM(amount) OVER (ORDER BY order_date) FROM orders;
SELECT SUM(amount) OVER (ORDER BY order_date RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM orders;

-- These are equivalent (without ORDER BY)
SELECT SUM(amount) OVER (PARTITION BY department) FROM employees;
SELECT SUM(amount) OVER (PARTITION BY department ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) FROM employees;
```

### EXCLUDE Clause (PostgreSQL 11+, SQLite 3.28+, DuckDB)

Exclude specific rows from the frame calculation.

```sql
-- EXCLUDE CURRENT ROW: Exclude the current row
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (
    PARTITION BY department
    ORDER BY salary
    ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    EXCLUDE CURRENT ROW
  ) as avg_excluding_self
FROM employees;

-- EXCLUDE GROUP: Exclude all rows with same ORDER BY value as current
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    EXCLUDE GROUP
  ) as sum_excluding_same_date
FROM orders;

-- EXCLUDE TIES: Exclude rows tied with current, keep current
SELECT
  salary,
  COUNT(*) OVER (
    ORDER BY salary
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    EXCLUDE TIES
  ) as count_excluding_ties
FROM employees;

-- EXCLUDE NO OTHERS: Default, include all rows (explicit)
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
    EXCLUDE NO OTHERS
  ) as sum_7_row_window
FROM orders;
```

### Frame Edge Cases

```sql
-- Frame at start of partition (no preceding rows)
SELECT
  order_date,
  amount,
  COUNT(*) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as rows_in_window
FROM orders
ORDER BY order_date;
-- First row will have count = 1, second = 2, etc., up to 7

-- Frame at end of partition (no following rows)
SELECT
  order_date,
  amount,
  COUNT(*) OVER (
    ORDER BY order_date
    ROWS BETWEEN CURRENT ROW AND 6 FOLLOWING
  ) as rows_in_window
FROM orders
ORDER BY order_date;
-- Last row will have count = 1, second-to-last = 2, etc.

-- Empty frame (error or NULL depending on database)
-- This would be an error in most databases:
-- ROWS BETWEEN 1 FOLLOWING AND 1 PRECEDING

-- Frame larger than partition
SELECT
  department,
  employee_id,
  salary,
  AVG(salary) OVER (
    PARTITION BY department
    ORDER BY salary
    ROWS BETWEEN 1000 PRECEDING AND 1000 FOLLOWING
  ) as avg_all_dept
FROM employees;
-- Works fine, just includes all available rows in partition
```

## Named Windows (WINDOW Clause)

Named windows allow you to define window specifications once and reuse them, improving readability and maintainability.

```sql
-- Basic named window
SELECT
  employee_id,
  department,
  salary,
  AVG(salary) OVER w as dept_avg,
  MAX(salary) OVER w as dept_max,
  MIN(salary) OVER w as dept_min,
  COUNT(*) OVER w as dept_count
FROM employees
WINDOW w AS (PARTITION BY department);

-- Multiple named windows
SELECT
  employee_id,
  department,
  salary,
  hire_date,
  -- Department-level aggregates
  AVG(salary) OVER dept_window as dept_avg_salary,
  COUNT(*) OVER dept_window as dept_employee_count,
  -- Company-level ranking
  RANK() OVER company_salary_rank as company_rank,
  -- Department-level ranking
  RANK() OVER dept_salary_rank as dept_rank,
  -- Hire date ordering
  ROW_NUMBER() OVER hire_order as hire_sequence
FROM employees
WINDOW
  dept_window AS (PARTITION BY department),
  company_salary_rank AS (ORDER BY salary DESC),
  dept_salary_rank AS (PARTITION BY department ORDER BY salary DESC),
  hire_order AS (ORDER BY hire_date);

-- Extending named windows
SELECT
  order_date,
  amount,
  -- Reuse base window with different aggregates
  SUM(amount) OVER w as running_total,
  AVG(amount) OVER w as running_avg,
  COUNT(*) OVER w as running_count,
  -- Extend base window with frame clause
  SUM(amount) OVER (w ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as sum_last_7,
  AVG(amount) OVER (w ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as avg_last_7
FROM orders
WINDOW w AS (ORDER BY order_date);

-- Complex analytical query with named windows
SELECT
  product_id,
  category,
  order_date,
  quantity,
  price,
  -- Product-level metrics
  SUM(quantity * price) OVER product_total as product_total_revenue,
  AVG(quantity) OVER product_avg as product_avg_quantity,
  -- Category-level metrics
  SUM(quantity * price) OVER category_total as category_total_revenue,
  RANK() OVER category_rank as rank_in_category,
  -- Time-based metrics
  SUM(quantity * price) OVER monthly as monthly_revenue,
  -- Percentage calculations
  ROUND(
    100.0 * (quantity * price) / SUM(quantity * price) OVER category_total,
    2
  ) as pct_of_category_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
WINDOW
  product_total AS (PARTITION BY product_id),
  product_avg AS (PARTITION BY product_id ORDER BY order_date),
  category_total AS (PARTITION BY category),
  category_rank AS (PARTITION BY category ORDER BY SUM(quantity * price) DESC),
  monthly AS (PARTITION BY DATE_TRUNC('month', order_date));
```

**Benefits of Named Windows**:

1. **DRY Principle**: Define once, use many times
2. **Readability**: Clear window purpose with descriptive names
3. **Maintainability**: Change window definition in one place
4. **Performance**: Database may optimize better with named windows

## Performance Considerations

Window functions can be expensive operations. Understanding performance implications helps write efficient queries.

### Indexing Strategies

Proper indexes significantly improve window function performance.

```sql
-- Index for PARTITION BY
CREATE INDEX idx_employees_dept ON employees(department);

-- Benefits window function:
SELECT
  employee_id,
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg
FROM employees;

-- Index for ORDER BY
CREATE INDEX idx_orders_date ON orders(order_date);

-- Benefits window function:
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Composite index for PARTITION BY + ORDER BY
CREATE INDEX idx_employees_dept_salary ON employees(department, salary DESC);

-- Benefits window function:
SELECT
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees;

-- Covering index (includes SELECT columns)
CREATE INDEX idx_orders_date_amount ON orders(order_date, amount);

-- Fully covered query - no table lookup needed:
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Partial index for filtered queries (PostgreSQL)
CREATE INDEX idx_completed_orders_date
ON orders(order_date, amount)
WHERE status = 'completed';

-- Benefits filtered window query:
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders
WHERE status = 'completed';
```

**Index Selection Guidelines**:

1. Index PARTITION BY columns first (most selective)
2. Add ORDER BY columns in same order as query
3. Include frequently accessed SELECT columns for covering
4. Consider descending indexes if ORDER BY DESC is common
5. Use partial indexes for common filters

### Query Optimization Tips

#### 1. Minimize Partitions

```sql
-- ❌ Inefficient: Too many small partitions
SELECT
  customer_id,
  order_id,
  amount,
  AVG(amount) OVER (PARTITION BY order_id) as order_avg
FROM order_items;
-- Each order_id creates separate partition (inefficient)

-- ✅ Better: Appropriate partition size
SELECT
  customer_id,
  order_id,
  amount,
  AVG(amount) OVER (PARTITION BY customer_id) as customer_avg
FROM order_items;
```

#### 2. Use Appropriate Frame Clauses

```sql
-- ❌ Less efficient: Unbounded frame when not needed
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as avg_amount
FROM orders;
-- Calculates across entire result set

-- ✅ More efficient: Limited frame
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7day
FROM orders;
```

#### 3. Reuse Window Definitions

```sql
-- ❌ Inefficient: Repeated window definition
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (PARTITION BY department ORDER BY salary) as avg_sal,
  MAX(salary) OVER (PARTITION BY department ORDER BY salary) as max_sal,
  MIN(salary) OVER (PARTITION BY department ORDER BY salary) as min_sal,
  COUNT(*) OVER (PARTITION BY department ORDER BY salary) as count_sal
FROM employees;

-- ✅ Efficient: Named window reuse
SELECT
  employee_id,
  salary,
  AVG(salary) OVER w as avg_sal,
  MAX(salary) OVER w as max_sal,
  MIN(salary) OVER w as min_sal,
  COUNT(*) OVER w as count_sal
FROM employees
WINDOW w AS (PARTITION BY department ORDER BY salary);
```

#### 4. Filter Before Windowing

```sql
-- ❌ Less efficient: Window then filter
SELECT *
FROM (
  SELECT
    employee_id,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
  FROM employees
) ranked
WHERE rank <= 5 AND department IN ('Sales', 'Engineering');

-- ✅ More efficient: Filter first
SELECT
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees
WHERE department IN ('Sales', 'Engineering')
QUALIFY rank <= 5;  -- Snowflake, DuckDB

-- Or without QUALIFY:
SELECT *
FROM (
  SELECT
    employee_id,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
  FROM employees
  WHERE department IN ('Sales', 'Engineering')  -- Filter first
) ranked
WHERE rank <= 5;
```

#### 5. Consider Materialization

```sql
-- ❌ Inefficient: Complex window calculation used multiple times
SELECT
  customer_id,
  order_date,
  amount,
  amount - AVG(amount) OVER (PARTITION BY customer_id ORDER BY order_date ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) as diff_from_avg
FROM orders o1
WHERE amount > (
  SELECT AVG(amount) OVER (PARTITION BY customer_id ORDER BY order_date ROWS BETWEEN 11 PRECEDING AND CURRENT ROW)
  FROM orders o2
  WHERE o2.order_id = o1.order_id
);

-- ✅ Efficient: Materialize window results
WITH order_stats AS (
  SELECT
    order_id,
    customer_id,
    order_date,
    amount,
    AVG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
      ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    ) as moving_avg_12_months
  FROM orders
)
SELECT
  customer_id,
  order_date,
  amount,
  amount - moving_avg_12_months as diff_from_avg
FROM order_stats
WHERE amount > moving_avg_12_months;
```

#### 6. Avoid Unnecessary DISTINCT

```sql
-- ❌ Inefficient: DISTINCT after window function
SELECT DISTINCT
  department,
  AVG(salary) OVER (PARTITION BY department) as dept_avg
FROM employees;

-- ✅ Efficient: GROUP BY or window without duplication
SELECT
  department,
  AVG(salary) as dept_avg
FROM employees
GROUP BY department;

-- Or if you need window features:
SELECT DISTINCT ON (department)
  department,
  AVG(salary) OVER (PARTITION BY department) as dept_avg
FROM employees;
```

### Database-Specific Optimizations

#### PostgreSQL

```sql
-- Use parallel execution (PostgreSQL 9.6+)
SET max_parallel_workers_per_gather = 4;

-- Analyze tables for better query plans
ANALYZE employees;

-- Monitor window function performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;
```

#### SQL Server

```sql
-- Use columnstore indexes for analytical workloads
CREATE COLUMNSTORE INDEX idx_orders_columnstore
ON orders (order_date, customer_id, amount);

-- Batch mode execution (automatic with columnstore)
SELECT
  order_date,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Monitor execution plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
```

#### MySQL 8.0+

```sql
-- Create appropriate indexes
CREATE INDEX idx_employees_dept_sal ON employees(department, salary);

-- Use EXPLAIN to check execution plan
EXPLAIN FORMAT=JSON
SELECT
  employee_id,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;
```

### When NOT to Use Window Functions

Sometimes alternatives are more efficient:

```sql
-- ❌ Window function for simple aggregation
SELECT
  customer_id,
  order_id,
  amount,
  AVG(amount) OVER () as overall_avg
FROM orders;

-- ✅ Better: Scalar subquery or CROSS JOIN
SELECT
  customer_id,
  order_id,
  amount,
  (SELECT AVG(amount) FROM orders) as overall_avg
FROM orders;

-- ❌ Window function when JOIN suffices
SELECT
  o.order_id,
  o.amount,
  AVG(amount) OVER (PARTITION BY o.customer_id) as customer_avg
FROM orders o;

-- ✅ Better: JOIN with aggregation
SELECT
  o.order_id,
  o.amount,
  ca.customer_avg
FROM orders o
JOIN (
  SELECT customer_id, AVG(amount) as customer_avg
  FROM orders
  GROUP BY customer_id
) ca ON o.customer_id = ca.customer_id;
```

### Monitoring and Profiling

```sql
-- PostgreSQL: Check query plan
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Look for:
-- - "WindowAgg" nodes
-- - Sort operations
-- - Index scans vs Sequential scans
-- - Execution time

-- SQL Server: Execution plan
SET SHOWPLAN_ALL ON;
-- Run your query
SET SHOWPLAN_ALL OFF;

-- MySQL: EXPLAIN
EXPLAIN FORMAT=TREE
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;
```

## Best Practices

### 1. Always Specify ORDER BY When Needed

```sql
-- ✅ Good: Explicit ORDER BY for ranking
SELECT
  employee_id,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank
FROM employees;

-- ✅ Good: No ORDER BY when aggregating entire partition
SELECT
  employee_id,
  department,
  COUNT(*) OVER (PARTITION BY department) as dept_size
FROM employees;
```

### 2. Use Meaningful Aliases

```sql
-- ❌ Unclear
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (PARTITION BY department) as a
FROM employees;

-- ✅ Clear and descriptive
SELECT
  employee_id,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees;
```

### 3. Be Explicit with Frame Clauses

```sql
-- ❌ Relies on implicit default
SELECT
  order_date,
  SUM(amount) OVER (ORDER BY order_date) as total
FROM orders;

-- ✅ Explicit frame makes intent clear
SELECT
  order_date,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;
```

### 4. Use Named Windows for Readability

```sql
-- ✅ Good: Clear, reusable window definitions
SELECT
  product_id,
  order_date,
  quantity,
  AVG(quantity) OVER monthly_window as monthly_avg,
  SUM(quantity) OVER monthly_window as monthly_total,
  MAX(quantity) OVER monthly_window as monthly_max
FROM order_items
WINDOW monthly_window AS (
  PARTITION BY product_id, DATE_TRUNC('month', order_date)
);
```

### 5. Handle NULLs Appropriately

```sql
-- ✅ Good: Explicit NULL handling
SELECT
  order_date,
  amount,
  LAG(amount, 1, 0) OVER (ORDER BY order_date) as previous_amount,
  COALESCE(LEAD(amount) OVER (ORDER BY order_date), amount) as next_or_current
FROM orders;
```

### 6. Document Complex Window Logic

```sql
-- ✅ Good: Clear comments explaining logic
SELECT
  customer_id,
  order_date,
  amount,
  -- Calculate 12-month rolling average for trend analysis
  AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
  ) as rolling_12_month_avg,
  -- Compare current order to customer's historical average
  amount - AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
  ) as diff_from_historical_avg
FROM orders;
```

### 7. Consider Performance Early

```sql
-- ✅ Good: Create indexes before using window functions
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Then use window function
SELECT
  customer_id,
  order_date,
  amount,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as order_sequence
FROM orders;
```

## Common Pitfalls

Understanding common mistakes helps avoid bugs and performance issues.

### 1. Forgetting ORDER BY for Ranking Functions

```sql
-- ❌ Error: RANK requires ORDER BY
SELECT
  employee_id,
  salary,
  RANK() OVER (PARTITION BY department) as rank  -- ERROR!
FROM employees;

-- ✅ Correct: Always use ORDER BY with ranking functions
SELECT
  employee_id,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;
```

### 2. Unexpected Default Frame with ORDER BY

```sql
-- ⚠️ Surprising behavior: Default frame is RANGE UNBOUNDED PRECEDING TO CURRENT ROW
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as total
FROM orders WHERE order_date = '2024-01-01';
-- If multiple rows have same order_date, all get the same total!

-- ✅ Better: Be explicit about frame
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;
```

### 3. LAST_VALUE Frame Confusion

```sql
-- ❌ Common mistake: LAST_VALUE returns current row (default frame issue)
SELECT
  employee_id,
  salary,
  LAST_VALUE(salary) OVER (
    PARTITION BY department
    ORDER BY salary
  ) as max_salary  -- Wrong! Returns current row's salary
FROM employees;

-- ✅ Correct: Must extend frame to end of partition
SELECT
  employee_id,
  salary,
  LAST_VALUE(salary) OVER (
    PARTITION BY department
    ORDER BY salary
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as max_salary
FROM employees;

-- ✅ Or just use MAX()
SELECT
  employee_id,
  salary,
  MAX(salary) OVER (PARTITION BY department) as max_salary
FROM employees;
```

### 4. NULL Handling in LAG/LEAD

```sql
-- ⚠️ LAG/LEAD return NULL when out of bounds
SELECT
  order_date,
  amount,
  LAG(amount) OVER (ORDER BY order_date) as prev_amount,  -- NULL for first row
  amount - LAG(amount) OVER (ORDER BY order_date) as change  -- NULL for first row
FROM orders;

-- ✅ Better: Use default value
SELECT
  order_date,
  amount,
  LAG(amount, 1, 0) OVER (ORDER BY order_date) as prev_amount,
  amount - LAG(amount, 1, 0) OVER (ORDER BY order_date) as change
FROM orders;

-- ✅ Or use COALESCE
SELECT
  order_date,
  amount,
  COALESCE(LAG(amount) OVER (ORDER BY order_date), 0) as prev_amount
FROM orders;
```

### 5. Frame Clause with Wrong Frame Type

```sql
-- ❌ Error: Can't use interval with ROWS (in most databases)
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW  -- ERROR!
  ) as sum_last_7_days
FROM orders;

-- ✅ Correct: Use RANGE for interval-based windows
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
  ) as sum_last_7_days
FROM orders;
```

### 6. Partition BY on High-Cardinality Columns

```sql
-- ❌ Inefficient: Each row is its own partition
SELECT
  order_id,  -- Unique for each row
  amount,
  AVG(amount) OVER (PARTITION BY order_id) as order_avg  -- Meaningless
FROM order_items;

-- ✅ Better: Use appropriate partition key
SELECT
  order_id,
  customer_id,
  amount,
  AVG(amount) OVER (PARTITION BY customer_id) as customer_avg
FROM order_items;
```

### 7. Mixing Aggregate and Window Functions Incorrectly

```sql
-- ❌ Error: Can't mix regular aggregates with window functions in SELECT
SELECT
  department,
  AVG(salary) as dept_avg,  -- Regular aggregate
  RANK() OVER (ORDER BY salary DESC) as rank  -- Window function
FROM employees
GROUP BY department;  -- ERROR!

-- ✅ Correct: Use window function for both or use subquery
SELECT
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees;

-- ✅ Or use subquery/CTE
WITH dept_avg AS (
  SELECT department, AVG(salary) as avg_salary
  FROM employees
  GROUP BY department
)
SELECT
  e.department,
  e.salary,
  d.avg_salary,
  RANK() OVER (PARTITION BY e.department ORDER BY e.salary DESC) as rank
FROM employees e
JOIN dept_avg d ON e.department = d.department;
```

### 8. ROW_NUMBER vs RANK Confusion

```sql
-- Data: salaries = [100, 100, 90, 80]

-- ROW_NUMBER: Always unique (1, 2, 3, 4)
SELECT
  employee_id,
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num
FROM employees;
-- Results: 1, 2, 3, 4 (even for tied values)

-- RANK: Leaves gaps (1, 1, 3, 4)
SELECT
  employee_id,
  salary,
  RANK() OVER (ORDER BY salary DESC) as rank
FROM employees;
-- Results: 1, 1, 3, 4

-- DENSE_RANK: No gaps (1, 1, 2, 3)
SELECT
  employee_id,
  salary,
  DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank
FROM employees;
-- Results: 1, 1, 2, 3

-- ⚠️ Choose based on requirements:
-- - ROW_NUMBER: Need unique row numbers (pagination, deduplication)
-- - RANK: Traditional competition ranking (Olympics-style)
-- - DENSE_RANK: Consecutive ranking levels
```

### 9. ORDER BY NULL Behavior

```sql
-- ⚠️ NULLs can affect ordering and window results
-- Data: salaries = [100, NULL, 90, NULL, 80]

SELECT
  employee_id,
  salary,
  RANK() OVER (ORDER BY salary DESC) as rank
FROM employees;
-- PostgreSQL/MySQL: NULLs last by default
-- SQL Server/Oracle: NULLs first by default

-- ✅ Be explicit about NULL ordering
SELECT
  employee_id,
  salary,
  RANK() OVER (ORDER BY salary DESC NULLS LAST) as rank
FROM employees;
```

### 10. Performance Pitfall: No Index on ORDER BY/PARTITION BY

```sql
-- ❌ Slow: No index on partition/order columns
SELECT
  customer_id,
  order_date,
  amount,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as order_num
FROM orders;  -- Table scan + sort!

-- ✅ Fast: Create appropriate index first
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

SELECT
  customer_id,
  order_date,
  amount,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as order_num
FROM orders;  -- Index scan, no sort needed
```

### 11. Using Window Functions in WHERE Clause

```sql
-- ❌ Error: Can't use window functions in WHERE
SELECT
  employee_id,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees
WHERE RANK() OVER (PARTITION BY department ORDER BY salary DESC) <= 3;  -- ERROR!

-- ✅ Correct: Use subquery or CTE
SELECT *
FROM (
  SELECT
    employee_id,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
  FROM employees
) ranked
WHERE rank <= 3;

-- ✅ Or use QUALIFY (Snowflake, DuckDB)
SELECT
  employee_id,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees
QUALIFY rank <= 3;
```

### 12. Incorrect Frame for Moving Averages

```sql
-- ❌ Wrong: 7-period moving average with wrong count
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 7 PRECEDING AND CURRENT ROW  -- Actually 8 rows!
  ) as moving_avg_7
FROM orders;

-- ✅ Correct: 7-period moving average
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW  -- 7 rows total
  ) as moving_avg_7
FROM orders;
```

## Real-World Examples

Practical examples demonstrating common business use cases for window functions.

### Customer Purchase Analysis

```sql
-- Comprehensive customer purchase metrics
SELECT
  customer_id,
  customer_name,
  order_date,
  amount,
  -- Order sequence for each customer
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as order_number,
  -- Days since last purchase
  order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as days_since_last_order,
  -- Running total spent by customer
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as lifetime_value,
  -- Average order value (historical)
  AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
  ) as historical_avg_order,
  -- Comparison to historical average
  CASE
    WHEN amount > AVG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) THEN 'Above Average'
    WHEN amount < AVG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) THEN 'Below Average'
    ELSE 'First Order or At Average'
  END as order_size_category,
  -- Customer rank by lifetime value
  RANK() OVER (ORDER BY SUM(amount) OVER (PARTITION BY customer_id) DESC) as customer_value_rank
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY customer_id, order_date;
```

### Product Sales Ranking and Trends

```sql
-- Product performance analysis with trends
WITH daily_product_sales AS (
  SELECT
    product_id,
    product_name,
    category,
    DATE(order_date) as sale_date,
    SUM(quantity) as units_sold,
    SUM(quantity * price) as daily_revenue
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  JOIN orders o ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY product_id, product_name, category, DATE(order_date)
)
SELECT
  product_id,
  product_name,
  category,
  sale_date,
  daily_revenue,
  -- 7-day moving average
  AVG(daily_revenue) OVER (
    PARTITION BY product_id
    ORDER BY sale_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7day,
  -- Day-over-day change
  daily_revenue - LAG(daily_revenue) OVER (
    PARTITION BY product_id
    ORDER BY sale_date
  ) as revenue_change,
  ROUND(
    100.0 * (daily_revenue - LAG(daily_revenue) OVER (PARTITION BY product_id ORDER BY sale_date)) /
    NULLIF(LAG(daily_revenue) OVER (PARTITION BY product_id ORDER BY sale_date), 0),
    2
  ) as pct_change,
  -- Product rank within category (by total revenue)
  RANK() OVER (
    PARTITION BY category
    ORDER BY SUM(daily_revenue) OVER (PARTITION BY product_id) DESC
  ) as category_rank,
  -- Percentile within category
  PERCENT_RANK() OVER (
    PARTITION BY category
    ORDER BY SUM(daily_revenue) OVER (PARTITION BY product_id)
  ) as category_percentile,
  -- Running total for the product
  SUM(daily_revenue) OVER (
    PARTITION BY product_id
    ORDER BY sale_date
  ) as cumulative_revenue
FROM daily_product_sales
ORDER BY category, category_rank, sale_date;
```

### Time-Series Analysis: Sales Trends

```sql
-- Monthly sales with year-over-year and month-over-month comparisons
WITH monthly_sales AS (
  SELECT
    DATE_TRUNC('month', order_date) as month,
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(MONTH FROM order_date) as month_num,
    SUM(amount) as monthly_revenue,
    COUNT(*) as order_count,
    COUNT(DISTINCT customer_id) as unique_customers
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', order_date),
           EXTRACT(YEAR FROM order_date),
           EXTRACT(MONTH FROM order_date)
)
SELECT
  month,
  monthly_revenue,
  order_count,
  unique_customers,
  -- Month-over-month change
  monthly_revenue - LAG(monthly_revenue, 1) OVER (ORDER BY month) as mom_change,
  ROUND(
    100.0 * (monthly_revenue - LAG(monthly_revenue, 1) OVER (ORDER BY month)) /
    NULLIF(LAG(monthly_revenue, 1) OVER (ORDER BY month), 0),
    2
  ) as mom_pct_change,
  -- Year-over-year change
  monthly_revenue - LAG(monthly_revenue, 12) OVER (ORDER BY month) as yoy_change,
  ROUND(
    100.0 * (monthly_revenue - LAG(monthly_revenue, 12) OVER (ORDER BY month)) /
    NULLIF(LAG(monthly_revenue, 12) OVER (ORDER BY month), 0),
    2
  ) as yoy_pct_change,
  -- 3-month moving average
  AVG(monthly_revenue) OVER (
    ORDER BY month
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as moving_avg_3month,
  -- Year-to-date total
  SUM(monthly_revenue) OVER (
    PARTITION BY year
    ORDER BY month
  ) as ytd_revenue,
  -- Rank within year
  RANK() OVER (
    PARTITION BY year
    ORDER BY monthly_revenue DESC
  ) as month_rank_in_year,
  -- Cumulative total across all time
  SUM(monthly_revenue) OVER (
    ORDER BY month
  ) as cumulative_all_time
FROM monthly_sales
ORDER BY month;
```

### Employee Compensation Analysis

```sql
-- Employee salary analysis with department context
SELECT
  employee_id,
  employee_name,
  department,
  job_title,
  salary,
  hire_date,
  -- Department statistics
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary,
  MIN(salary) OVER (PARTITION BY department) as dept_min_salary,
  MAX(salary) OVER (PARTITION BY department) as dept_max_salary,
  -- Position relative to department average
  salary - AVG(salary) OVER (PARTITION BY department) as diff_from_dept_avg,
  ROUND(
    100.0 * (salary - AVG(salary) OVER (PARTITION BY department)) /
    AVG(salary) OVER (PARTITION BY department),
    2
  ) as pct_diff_from_avg,
  -- Rankings
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_salary_rank,
  RANK() OVER (ORDER BY salary DESC) as company_salary_rank,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY job_title, salary DESC) as title_salary_rank,
  -- Percentiles
  PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary) as dept_percentile,
  NTILE(4) OVER (PARTITION BY department ORDER BY salary) as dept_quartile,
  -- Salary compared to people hired around the same time
  AVG(salary) OVER (
    ORDER BY hire_date
    RANGE BETWEEN INTERVAL '90 days' PRECEDING AND INTERVAL '90 days' FOLLOWING
  ) as avg_salary_similar_hire_date,
  -- Tenure rank
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY hire_date) as dept_seniority_rank,
  -- Identify top and bottom earners
  CASE
    WHEN RANK() OVER (PARTITION BY department ORDER BY salary DESC) <= 3
    THEN 'Top 3 in Department'
    WHEN RANK() OVER (PARTITION BY department ORDER BY salary ASC) <= 3
    THEN 'Bottom 3 in Department'
    ELSE 'Middle'
  END as salary_tier
FROM employees
ORDER BY department, salary DESC;
```

### Inventory Management: Stock Levels

```sql
-- Track inventory changes with running totals and alerts
WITH inventory_changes AS (
  SELECT
    product_id,
    transaction_date,
    transaction_type,  -- 'purchase', 'sale', 'adjustment'
    quantity_change,   -- positive for purchases, negative for sales
    CASE
      WHEN transaction_type = 'purchase' THEN quantity_change
      WHEN transaction_type = 'sale' THEN -quantity_change
      ELSE quantity_change
    END as signed_quantity
  FROM inventory_transactions
)
SELECT
  product_id,
  transaction_date,
  transaction_type,
  quantity_change,
  -- Running inventory level
  SUM(signed_quantity) OVER (
    PARTITION BY product_id
    ORDER BY transaction_date, transaction_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as current_stock_level,
  -- Average daily change over last 30 days
  AVG(signed_quantity) OVER (
    PARTITION BY product_id
    ORDER BY transaction_date
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ) as avg_daily_change_30days,
  -- Days until out of stock (estimated)
  CASE
    WHEN AVG(signed_quantity) OVER (
      PARTITION BY product_id
      ORDER BY transaction_date
      ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) < 0
    THEN ROUND(
      SUM(signed_quantity) OVER (
        PARTITION BY product_id
        ORDER BY transaction_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) /
      ABS(AVG(signed_quantity) OVER (
        PARTITION BY product_id
        ORDER BY transaction_date
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
      )),
      0
    )
    ELSE NULL
  END as estimated_days_until_stockout,
  -- Min/max stock levels in last 90 days
  MIN(SUM(signed_quantity) OVER (
    PARTITION BY product_id
    ORDER BY transaction_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  )) OVER (
    PARTITION BY product_id
    ORDER BY transaction_date
    ROWS BETWEEN 89 PRECEDING AND CURRENT ROW
  ) as min_stock_90days,
  MAX(SUM(signed_quantity) OVER (
    PARTITION BY product_id
    ORDER BY transaction_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  )) OVER (
    PARTITION BY product_id
    ORDER BY transaction_date
    ROWS BETWEEN 89 PRECEDING AND CURRENT ROW
  ) as max_stock_90days,
  -- Stock alert flags
  CASE
    WHEN SUM(signed_quantity) OVER (
      PARTITION BY product_id
      ORDER BY transaction_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) < 100 THEN 'Low Stock'
    WHEN SUM(signed_quantity) OVER (
      PARTITION BY product_id
      ORDER BY transaction_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) < 50 THEN 'Critical Stock'
    ELSE 'OK'
  END as stock_status
FROM inventory_changes
ORDER BY product_id, transaction_date;
```

### Cohort Analysis: User Retention

```sql
-- Monthly cohort retention analysis
WITH user_cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signup_date) as cohort_month,
    signup_date
  FROM users
),
user_activity AS (
  SELECT
    user_id,
    DATE_TRUNC('month', activity_date) as activity_month
  FROM user_activities
  GROUP BY user_id, DATE_TRUNC('month', activity_date)
),
cohort_activity AS (
  SELECT
    uc.cohort_month,
    ua.activity_month,
    COUNT(DISTINCT uc.user_id) as cohort_size,
    COUNT(DISTINCT ua.user_id) as active_users,
    EXTRACT(MONTH FROM AGE(ua.activity_month, uc.cohort_month)) as months_since_signup
  FROM user_cohorts uc
  LEFT JOIN user_activity ua ON uc.user_id = ua.user_id
  GROUP BY uc.cohort_month, ua.activity_month
)
SELECT
  cohort_month,
  activity_month,
  months_since_signup,
  cohort_size,
  active_users,
  ROUND(100.0 * active_users / NULLIF(cohort_size, 0), 2) as retention_rate,
  -- First month retention as baseline
  FIRST_VALUE(active_users) OVER (
    PARTITION BY cohort_month
    ORDER BY months_since_signup
  ) as month_0_active,
  -- Retention compared to first month
  ROUND(
    100.0 * active_users / NULLIF(FIRST_VALUE(active_users) OVER (
      PARTITION BY cohort_month
      ORDER BY months_since_signup
    ), 0),
    2
  ) as pct_of_initial,
  -- Previous month retention for comparison
  LAG(active_users) OVER (
    PARTITION BY cohort_month
    ORDER BY months_since_signup
  ) as prev_month_active,
  -- Month-over-month retention change
  active_users - LAG(active_users) OVER (
    PARTITION BY cohort_month
    ORDER BY months_since_signup
  ) as mom_change
FROM cohort_activity
WHERE cohort_month >= '2024-01-01'
ORDER BY cohort_month, months_since_signup;
```

### Session Analysis: Web Analytics

```sql
-- Analyze user sessions with page view sequences
WITH page_views AS (
  SELECT
    user_id,
    session_id,
    page_url,
    view_timestamp,
    -- Session metrics
    ROW_NUMBER() OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
    ) as page_sequence,
    FIRST_VALUE(page_url) OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as landing_page,
    LAST_VALUE(page_url) OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as exit_page,
    COUNT(*) OVER (PARTITION BY session_id) as pages_in_session,
    -- Time calculations
    view_timestamp - LAG(view_timestamp) OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
    ) as time_since_last_page,
    LEAD(view_timestamp) OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
    ) - view_timestamp as time_to_next_page,
    -- Next and previous pages
    LAG(page_url) OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
    ) as previous_page,
    LEAD(page_url) OVER (
      PARTITION BY session_id
      ORDER BY view_timestamp
    ) as next_page
  FROM web_analytics
)
SELECT
  session_id,
  user_id,
  page_url,
  page_sequence,
  landing_page,
  exit_page,
  pages_in_session,
  previous_page,
  next_page,
  time_since_last_page,
  time_to_next_page,
  CASE
    WHEN page_sequence = 1 THEN 'Landing Page'
    WHEN page_sequence = pages_in_session THEN 'Exit Page'
    ELSE 'Mid-Session'
  END as page_type,
  CASE
    WHEN next_page IS NULL THEN 'Session End'
    WHEN time_to_next_page > INTERVAL '30 minutes' THEN 'Long Gap'
    ELSE 'Normal Flow'
  END as flow_status
FROM page_views
ORDER BY session_id, page_sequence;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Aggregations](/concepts/aggregations/) - Regular aggregate functions
- [CTEs (Common Table Expressions)](/concepts/ctes/) - For organizing complex queries
- [Performance Optimization](/concepts/performance/) - Query tuning techniques
- [Analytics Patterns](/patterns/analytics/) - Real-world analytical query patterns
