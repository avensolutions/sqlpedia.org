---
title: SQL Aggregations
description: Comprehensive guide to aggregating and grouping data in SQL
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite]
difficulty: beginner
tags: [aggregations, group-by, having, count, sum, avg, min, max, rollup, cube, grouping-sets, statistics, string-agg]
---

# SQL Aggregations

<div class="difficulty-badge difficulty-beginner">Beginner</div>

## Quick Reference

```sql
-- Basic aggregate functions
SELECT
  COUNT(*) as total_rows,
  COUNT(column_name) as non_null_count,
  SUM(amount) as total,
  AVG(amount) as average,
  MIN(amount) as minimum,
  MAX(amount) as maximum
FROM orders;

-- GROUP BY: Aggregate by category
SELECT
  category,
  COUNT(*) as count,
  AVG(price) as avg_price
FROM products
GROUP BY category;

-- HAVING: Filter aggregated results
SELECT
  category,
  AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 100;

-- Multiple grouping levels
SELECT
  country,
  city,
  COUNT(*) as customer_count
FROM customers
GROUP BY country, city;

-- DISTINCT aggregation
SELECT
  COUNT(DISTINCT customer_id) as unique_customers
FROM orders;

-- Conditional aggregation
SELECT
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue
FROM orders;
```

## Overview

Aggregations are operations that combine multiple rows of data into a single summary value. They're essential for analytics, reporting, and understanding patterns in your data.

Aggregate functions perform calculations on a set of values and return a single value. When combined with GROUP BY, they allow you to calculate summaries for different groups within your data.

## Basic Aggregate Functions

### COUNT

Counts the number of rows or non-NULL values.

```sql
-- Count all rows (including NULLs)
SELECT COUNT(*) as total_customers
FROM customers;

-- Count non-NULL values in specific column
SELECT COUNT(email) as customers_with_email
FROM customers;

-- Count with WHERE clause
SELECT COUNT(*) as usa_customers
FROM customers
WHERE country = 'USA';

-- Count distinct values
SELECT COUNT(DISTINCT country) as countries_count
FROM customers;

-- Count with condition
SELECT
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders;
```

**Important Notes**:
- `COUNT(*)` counts all rows including those with NULL values
- `COUNT(column)` counts only non-NULL values in that column
- `COUNT(DISTINCT column)` counts unique non-NULL values

### SUM

Calculates the sum of values in a column.

```sql
-- Total revenue
SELECT SUM(amount) as total_revenue
FROM orders;

-- Sum with condition
SELECT
  SUM(amount) as total_revenue,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue
FROM orders;

-- Sum with NULL handling
SELECT
  SUM(amount) as total_revenue,
  COALESCE(SUM(discount_amount), 0) as total_discounts
FROM orders;

-- Multiple sums
SELECT
  SUM(quantity) as total_units_sold,
  SUM(quantity * price) as total_revenue,
  SUM(quantity * cost) as total_cost,
  SUM(quantity * (price - cost)) as total_profit
FROM order_items;
```

**Important Notes**:
- `SUM()` ignores NULL values
- Returns NULL if all values are NULL
- Use `COALESCE(SUM(column), 0)` to return 0 instead of NULL

### AVG

Calculates the average (mean) of values.

```sql
-- Average order value
SELECT AVG(amount) as avg_order_value
FROM orders;

-- Average with filtering
SELECT AVG(amount) as avg_completed_order_value
FROM orders
WHERE status = 'completed';

-- Average excluding outliers
SELECT AVG(price) as avg_price
FROM products
WHERE price BETWEEN 10 AND 1000;

-- Weighted average
SELECT
  SUM(quantity * price) / SUM(quantity) as weighted_avg_price
FROM order_items;

-- Average with rounding
SELECT
  ROUND(AVG(rating), 2) as avg_rating,
  ROUND(AVG(price), 2) as avg_price
FROM products;
```

**Important Notes**:
- `AVG()` ignores NULL values
- Calculates mean (sum / count of non-NULL values)
- For weighted averages, calculate manually with SUM

### MIN and MAX

Find minimum and maximum values.

```sql
-- Find price range
SELECT
  MIN(price) as min_price,
  MAX(price) as max_price,
  MAX(price) - MIN(price) as price_range
FROM products;

-- Earliest and latest dates
SELECT
  MIN(order_date) as first_order,
  MAX(order_date) as last_order,
  MAX(order_date) - MIN(order_date) as date_range_days
FROM orders;

-- MIN/MAX with strings
SELECT
  MIN(customer_name) as first_alphabetically,
  MAX(customer_name) as last_alphabetically
FROM customers;

-- Multiple MIN/MAX
SELECT
  category,
  MIN(price) as cheapest,
  MAX(price) as most_expensive,
  AVG(price) as average
FROM products
GROUP BY category;
```

**Important Notes**:
- Works with numbers, dates, and strings
- Ignores NULL values
- String comparison is alphabetical

## GROUP BY: Grouping Data

GROUP BY divides rows into groups based on column values, then applies aggregate functions to each group.

### Single Column Grouping

```sql
-- Count customers by country
SELECT
  country,
  COUNT(*) as customer_count
FROM customers
GROUP BY country;

-- Sales by product
SELECT
  product_id,
  COUNT(*) as order_count,
  SUM(quantity) as total_quantity,
  SUM(quantity * price) as total_revenue
FROM order_items
GROUP BY product_id;

-- Orders by status
SELECT
  status,
  COUNT(*) as order_count,
  AVG(amount) as avg_amount,
  SUM(amount) as total_amount
FROM orders
GROUP BY status;
```

### Multiple Column Grouping

```sql
-- Customers by country and city
SELECT
  country,
  city,
  COUNT(*) as customer_count
FROM customers
GROUP BY country, city
ORDER BY country, city;

-- Sales by year and quarter
SELECT
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(QUARTER FROM order_date) as quarter,
  COUNT(*) as order_count,
  SUM(amount) as total_revenue
FROM orders
GROUP BY
  EXTRACT(YEAR FROM order_date),
  EXTRACT(QUARTER FROM order_date)
ORDER BY year, quarter;

-- Product sales by category and supplier
SELECT
  category_id,
  supplier_id,
  COUNT(*) as product_count,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM products
GROUP BY category_id, supplier_id;
```

### Grouping with Expressions

```sql
-- Group by calculated column
SELECT
  CASE
    WHEN price < 10 THEN 'Budget'
    WHEN price < 50 THEN 'Mid-range'
    ELSE 'Premium'
  END as price_category,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
GROUP BY
  CASE
    WHEN price < 10 THEN 'Budget'
    WHEN price < 50 THEN 'Mid-range'
    ELSE 'Premium'
  END;

-- Group by date parts
SELECT
  DATE_TRUNC('month', order_date) as month,
  COUNT(*) as order_count,
  SUM(amount) as revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;

-- Group by YEAR and MONTH
SELECT
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(MONTH FROM order_date) as month,
  COUNT(*) as orders,
  SUM(amount) as revenue
FROM orders
GROUP BY
  EXTRACT(YEAR FROM order_date),
  EXTRACT(MONTH FROM order_date)
ORDER BY year, month;
```

### Important GROUP BY Rules

```sql
-- ✅ Correct: All non-aggregated columns in SELECT must be in GROUP BY
SELECT
  country,
  city,
  COUNT(*) as count
FROM customers
GROUP BY country, city;

-- ❌ Error: city is not in GROUP BY
SELECT
  country,
  city,
  COUNT(*) as count
FROM customers
GROUP BY country;

-- ✅ Correct: Use aggregate function for non-grouped columns
SELECT
  country,
  COUNT(*) as count,
  COUNT(DISTINCT city) as city_count
FROM customers
GROUP BY country;
```

## HAVING: Filtering Aggregated Results

HAVING filters groups after aggregation, while WHERE filters rows before aggregation.

### Basic HAVING Clause

```sql
-- Countries with more than 10 customers
SELECT
  country,
  COUNT(*) as customer_count
FROM customers
GROUP BY country
HAVING COUNT(*) > 10;

-- Products with average price above $100
SELECT
  category,
  AVG(price) as avg_price,
  COUNT(*) as product_count
FROM products
GROUP BY category
HAVING AVG(price) > 100;

-- Customers who spent more than $1000
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(amount) > 1000;
```

### WHERE vs HAVING

```sql
-- WHERE: Filters rows before grouping
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
WHERE is_active = TRUE  -- Filter individual rows first
GROUP BY category;

-- HAVING: Filters groups after aggregation
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
GROUP BY category
HAVING COUNT(*) > 5;  -- Filter groups after aggregation

-- Combining WHERE and HAVING
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
WHERE is_active = TRUE  -- Filter rows first
GROUP BY category
HAVING AVG(price) > 50  -- Then filter groups
   AND COUNT(*) > 5;
```

### Complex HAVING Conditions

```sql
-- Multiple HAVING conditions
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent,
  AVG(amount) as avg_order_value
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 5
   AND SUM(amount) > 1000
   AND AVG(amount) > 100;

-- HAVING with CASE
SELECT
  country,
  COUNT(*) as customer_count,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM customers
GROUP BY country
HAVING SUM(CASE WHEN is_active THEN 1 ELSE 0 END) > 10;

-- HAVING with subquery
SELECT
  category,
  AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > (
  SELECT AVG(price) FROM products
);
```

## DISTINCT with Aggregations

DISTINCT removes duplicates before aggregation.

```sql
-- Count distinct values
SELECT
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT country) as countries,
  COUNT(*) as total_rows
FROM orders;

-- Sum distinct values (careful - rarely what you want)
SELECT
  customer_id,
  SUM(DISTINCT amount) as distinct_order_amounts
FROM orders
GROUP BY customer_id;

-- Count distinct with multiple columns
SELECT
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT product_id) as unique_products,
  COUNT(*) as total_order_items
FROM order_items;

-- Distinct aggregations by group
SELECT
  country,
  COUNT(*) as total_customers,
  COUNT(DISTINCT city) as unique_cities,
  COUNT(DISTINCT email) as unique_emails
FROM customers
GROUP BY country;
```

## Conditional Aggregation

Using CASE expressions within aggregate functions to create conditional aggregations.

```sql
-- Count by status
SELECT
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
  COUNT(*) as total
FROM orders;

-- Sum by condition
SELECT
  customer_id,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
  SUM(CASE WHEN status = 'cancelled' THEN amount ELSE 0 END) as cancelled_revenue,
  SUM(amount) as total_revenue
FROM orders
GROUP BY customer_id;

-- Pivot-style aggregation
SELECT
  product_id,
  SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 1 THEN quantity ELSE 0 END) as q1_sales,
  SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 2 THEN quantity ELSE 0 END) as q2_sales,
  SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 3 THEN quantity ELSE 0 END) as q3_sales,
  SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 4 THEN quantity ELSE 0 END) as q4_sales
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
GROUP BY product_id;

-- Percentage calculations
SELECT
  category,
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_active THEN 1 END) as active_products,
  ROUND(100.0 * COUNT(CASE WHEN is_active THEN 1 END) / COUNT(*), 2) as active_percentage
FROM products
GROUP BY category;
```

## FILTER Clause (PostgreSQL, SQLite 3.30+)

The FILTER clause provides a cleaner syntax for conditional aggregation.

```sql
-- Using FILTER (PostgreSQL)
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
  SUM(amount) FILTER (WHERE status = 'completed') as completed_revenue
FROM orders;

-- Equivalent using CASE
SELECT
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(CASE WHEN status = 'completed' THEN amount END) as completed_revenue
FROM orders;

-- FILTER with GROUP BY
SELECT
  customer_id,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_date >= CURRENT_DATE - INTERVAL '30 days') as orders_last_30_days,
  SUM(amount) FILTER (WHERE status = 'completed') as total_revenue
FROM orders
GROUP BY customer_id;
```

## Advanced Grouping

### ROLLUP

Creates subtotals and grand totals (hierarchical aggregation).

```sql
-- Simple ROLLUP
SELECT
  country,
  city,
  COUNT(*) as customer_count
FROM customers
GROUP BY ROLLUP(country, city)
ORDER BY country NULLS FIRST, city NULLS FIRST;

/*
Result includes:
- Individual country + city combinations
- Country subtotals (city = NULL)
- Grand total (country = NULL, city = NULL)
*/

-- ROLLUP with aggregates
SELECT
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(QUARTER FROM order_date) as quarter,
  COUNT(*) as order_count,
  SUM(amount) as total_revenue
FROM orders
GROUP BY ROLLUP(
  EXTRACT(YEAR FROM order_date),
  EXTRACT(QUARTER FROM order_date)
)
ORDER BY year NULLS FIRST, quarter NULLS FIRST;

-- Identifying ROLLUP levels with GROUPING
SELECT
  country,
  city,
  COUNT(*) as customer_count,
  GROUPING(country) as is_country_total,
  GROUPING(city) as is_city_total
FROM customers
GROUP BY ROLLUP(country, city);

-- Using COALESCE to label totals
SELECT
  COALESCE(country, 'TOTAL') as country,
  COALESCE(city, 'Subtotal') as city,
  COUNT(*) as customer_count
FROM customers
GROUP BY ROLLUP(country, city);
```

### CUBE

Creates aggregations for all possible combinations of grouping columns.

```sql
-- CUBE example
SELECT
  country,
  city,
  COUNT(*) as customer_count
FROM customers
GROUP BY CUBE(country, city);

/*
Result includes:
- Individual country + city combinations
- Country totals (all cities)
- City totals (all countries)
- Grand total
*/

-- CUBE with three dimensions
SELECT
  category,
  supplier_id,
  is_active,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
GROUP BY CUBE(category, supplier_id, is_active);

-- Using GROUPING_ID to identify aggregation level
SELECT
  country,
  city,
  COUNT(*) as count,
  GROUPING_ID(country, city) as grouping_level
FROM customers
GROUP BY CUBE(country, city)
ORDER BY grouping_level, country, city;
```

### GROUPING SETS

Explicitly specify which grouping combinations to create.

```sql
-- GROUPING SETS: Custom combinations
SELECT
  country,
  city,
  COUNT(*) as customer_count
FROM customers
GROUP BY GROUPING SETS (
  (country, city),  -- Country + city
  (country),        -- Country only
  ()                -- Grand total
);

-- Complex GROUPING SETS
SELECT
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(MONTH FROM order_date) as month,
  category,
  COUNT(*) as order_count,
  SUM(amount) as revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY GROUPING SETS (
  (year, month, category),  -- Detailed
  (year, category),         -- Yearly by category
  (year, month),            -- Monthly totals
  (category),               -- Category totals
  ()                        -- Grand total
);

-- Equivalent to ROLLUP
GROUP BY GROUPING SETS (
  (country, city),
  (country),
  ()
);
-- Is the same as:
GROUP BY ROLLUP(country, city);

-- Equivalent to CUBE
GROUP BY GROUPING SETS (
  (country, city),
  (country),
  (city),
  ()
);
-- Is the same as:
GROUP BY CUBE(country, city);
```

## Statistical Aggregate Functions

### Variance and Standard Deviation

```sql
-- Variance and standard deviation (population)
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as mean_price,
  VAR_POP(price) as variance,
  STDDEV_POP(price) as std_deviation
FROM products
GROUP BY category;

-- Variance and standard deviation (sample)
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as mean_price,
  VAR_SAMP(price) as variance,
  STDDEV_SAMP(price) as std_deviation
FROM products
GROUP BY category;

-- Coefficient of variation (relative variability)
SELECT
  category,
  AVG(price) as mean_price,
  STDDEV_SAMP(price) as std_deviation,
  CASE
    WHEN AVG(price) > 0
    THEN STDDEV_SAMP(price) / AVG(price)
    ELSE NULL
  END as coefficient_of_variation
FROM products
GROUP BY category;
```

### Percentiles and Medians

```sql
-- PostgreSQL: Percentile functions
SELECT
  category,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) as q1,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) as q3,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price) as p95
FROM products
GROUP BY category;

-- Multiple percentiles at once
SELECT
  category,
  PERCENTILE_CONT(ARRAY[0.25, 0.5, 0.75, 0.95])
    WITHIN GROUP (ORDER BY price) as quartiles
FROM products
GROUP BY category;

-- PERCENTILE_DISC (discrete percentile - returns actual value from dataset)
SELECT
  category,
  PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY price) as median_price
FROM products
GROUP BY category;
```

### SQL Server Statistical Functions

```sql
-- SQL Server: STDEV, STDEVP, VAR, VARP
SELECT
  category,
  AVG(price) as avg_price,
  STDEV(price) as sample_std_dev,
  STDEVP(price) as population_std_dev,
  VAR(price) as sample_variance,
  VARP(price) as population_variance
FROM products
GROUP BY category;

-- SQL Server: PERCENTILE_CONT
SELECT
  category,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) OVER (PARTITION BY category) as median_price
FROM products;
```

## String Aggregation

Concatenate strings from multiple rows into a single string.

### STRING_AGG (PostgreSQL, SQL Server 2017+, SQLite 3.44+)

```sql
-- Basic string aggregation
SELECT
  country,
  STRING_AGG(city, ', ') as cities
FROM customers
GROUP BY country;

-- With ordering
SELECT
  country,
  STRING_AGG(city, ', ' ORDER BY city) as cities
FROM customers
GROUP BY country;

-- With DISTINCT
SELECT
  country,
  STRING_AGG(DISTINCT city, ', ' ORDER BY city) as unique_cities
FROM customers
GROUP BY country;

-- Concatenate with more complex separator
SELECT
  customer_id,
  STRING_AGG(
    product_name || ' (' || quantity || ')',
    '; '
    ORDER BY order_date DESC
  ) as order_history
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY customer_id;
```

### GROUP_CONCAT (MySQL, SQLite)

```sql
-- MySQL: GROUP_CONCAT
SELECT
  country,
  GROUP_CONCAT(city ORDER BY city SEPARATOR ', ') as cities
FROM customers
GROUP BY country;

-- With DISTINCT
SELECT
  country,
  GROUP_CONCAT(DISTINCT city ORDER BY city SEPARATOR ', ') as unique_cities
FROM customers
GROUP BY country;

-- Limiting results
SELECT
  customer_id,
  GROUP_CONCAT(
    product_name
    ORDER BY order_date DESC
    SEPARATOR ', '
  ) as recent_products
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY customer_id;
```

### LISTAGG (Oracle, SQL Server)

```sql
-- Oracle: LISTAGG
SELECT
  country,
  LISTAGG(city, ', ') WITHIN GROUP (ORDER BY city) as cities
FROM customers
GROUP BY country;

-- With DISTINCT (Oracle 19c+)
SELECT
  country,
  LISTAGG(DISTINCT city, ', ') WITHIN GROUP (ORDER BY city) as cities
FROM customers
GROUP BY country;

-- SQL Server: STRING_AGG (2017+)
SELECT
  country,
  STRING_AGG(city, ', ') WITHIN GROUP (ORDER BY city) as cities
FROM customers
GROUP BY country;
```

## Array Aggregation (PostgreSQL)

```sql
-- ARRAY_AGG: Create array from values
SELECT
  country,
  ARRAY_AGG(city) as cities_array,
  ARRAY_AGG(city ORDER BY city) as sorted_cities
FROM customers
GROUP BY country;

-- With DISTINCT
SELECT
  country,
  ARRAY_AGG(DISTINCT city ORDER BY city) as unique_cities
FROM customers
GROUP BY country;

-- Array aggregation with filtering
SELECT
  customer_id,
  ARRAY_AGG(order_id ORDER BY order_date DESC) FILTER (WHERE status = 'completed') as completed_orders
FROM orders
GROUP BY customer_id;

-- Combining with array functions
SELECT
  country,
  ARRAY_LENGTH(ARRAY_AGG(DISTINCT city), 1) as unique_city_count,
  ARRAY_AGG(DISTINCT city ORDER BY city) as cities
FROM customers
GROUP BY country;
```

## JSON Aggregation (PostgreSQL, MySQL 5.7+)

```sql
-- PostgreSQL: JSON aggregation
SELECT
  country,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'city', city,
      'customer_count', customer_count
    )
  ) as city_data
FROM (
  SELECT country, city, COUNT(*) as customer_count
  FROM customers
  GROUP BY country, city
) sub
GROUP BY country;

-- MySQL: JSON_ARRAYAGG, JSON_OBJECTAGG
SELECT
  country,
  JSON_ARRAYAGG(city) as cities
FROM customers
GROUP BY country;

-- Create JSON object
SELECT
  customer_id,
  JSON_OBJECTAGG(
    order_id,
    amount
  ) as orders
FROM orders
GROUP BY customer_id;
```

## Aggregations with Window Functions

Combining aggregates with window functions for running totals, moving averages, etc.

```sql
-- Running total
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Moving average (3-day)
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as moving_avg_3day
FROM orders;

-- Cumulative count
SELECT
  order_date,
  customer_id,
  COUNT(*) OVER (ORDER BY order_date) as cumulative_order_count,
  COUNT(*) OVER (PARTITION BY customer_id ORDER BY order_date) as customer_order_sequence
FROM orders;

-- Percentage of total
SELECT
  category,
  SUM(amount) as category_revenue,
  SUM(amount) * 100.0 / SUM(SUM(amount)) OVER () as percentage_of_total
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY category;
```

For more details on window functions, see the [Window Functions guide](/concepts/window-functions/).

## Performance Considerations

### Index Optimization for Aggregations

```sql
-- ✅ Good: Index on GROUP BY columns
CREATE INDEX idx_orders_customer ON orders(customer_id);

SELECT customer_id, COUNT(*), SUM(amount)
FROM orders
GROUP BY customer_id;

-- ✅ Good: Covering index (includes aggregated columns)
CREATE INDEX idx_orders_customer_amount ON orders(customer_id, amount);

SELECT customer_id, COUNT(*), SUM(amount)
FROM orders
GROUP BY customer_id;

-- ✅ Good: Partial index for filtered aggregations
CREATE INDEX idx_completed_orders ON orders(customer_id, amount)
WHERE status = 'completed';

SELECT customer_id, SUM(amount)
FROM orders
WHERE status = 'completed'
GROUP BY customer_id;
```

### Filtering Before Aggregating

```sql
-- ❌ Less efficient: Aggregate then filter
SELECT
  customer_id,
  COUNT(*) as order_count
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY customer_id
HAVING COUNT(*) > 5;

-- ✅ More efficient: Filter as much as possible in WHERE
SELECT
  customer_id,
  COUNT(*) as order_count
FROM orders
WHERE order_date >= '2024-01-01'
  AND status = 'completed'  -- Additional filter in WHERE
GROUP BY customer_id
HAVING COUNT(*) > 5;
```

### Materialized Views for Expensive Aggregations

```sql
-- Create materialized view (PostgreSQL)
CREATE MATERIALIZED VIEW customer_summary AS
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent,
  AVG(amount) as avg_order_value,
  MIN(order_date) as first_order,
  MAX(order_date) as last_order
FROM orders
GROUP BY customer_id;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW customer_summary;

-- Query is now fast
SELECT * FROM customer_summary
WHERE total_spent > 1000;
```

### Avoid Aggregating Large Result Sets

```sql
-- ❌ Inefficient: Counting all rows to check existence
SELECT COUNT(*) FROM large_table WHERE condition;
-- Then checking if count > 0

-- ✅ Efficient: Use EXISTS for existence checks
SELECT EXISTS(SELECT 1 FROM large_table WHERE condition);

-- ❌ Inefficient: Aggregating just to get one value
SELECT AVG(price) FROM products;
-- When you only need approximate value

-- ✅ Consider sampling for approximations (PostgreSQL)
SELECT AVG(price)
FROM products
TABLESAMPLE BERNOULLI(10);  -- Sample 10% of rows
```

## Best Practices

### 1. Use Meaningful Aliases

```sql
-- ❌ Unclear
SELECT country, COUNT(*) FROM customers GROUP BY country;

-- ✅ Clear with alias
SELECT
  country,
  COUNT(*) as customer_count
FROM customers
GROUP BY country;
```

### 2. Be Explicit with NULL Handling

```sql
-- ❌ Unexpected NULLs in results
SELECT
  customer_id,
  SUM(discount_amount) as total_discount
FROM orders
GROUP BY customer_id;

-- ✅ Handle NULLs explicitly
SELECT
  customer_id,
  COALESCE(SUM(discount_amount), 0) as total_discount
FROM orders
GROUP BY customer_id;
```

### 3. Use HAVING for Aggregate Filters, WHERE for Row Filters

```sql
-- ✅ Correct usage
SELECT
  category,
  COUNT(*) as product_count
FROM products
WHERE is_active = TRUE        -- Filter rows before grouping
GROUP BY category
HAVING COUNT(*) > 5;           -- Filter groups after aggregation
```

### 4. Consider DISTINCT Carefully

```sql
-- ❌ Inefficient: DISTINCT is expensive
SELECT
  customer_id,
  COUNT(DISTINCT order_id)
FROM orders
GROUP BY customer_id;

-- ✅ Better: Ensure data is already unique or use proper joins
SELECT
  customer_id,
  COUNT(order_id)
FROM orders
GROUP BY customer_id;
```

### 5. Round Aggregate Results Appropriately

```sql
-- ✅ Round financial calculations
SELECT
  category,
  ROUND(AVG(price), 2) as avg_price,
  ROUND(STDDEV(price), 2) as std_dev
FROM products
GROUP BY category;
```

### 6. Document Complex Aggregations

```sql
-- ✅ Good: Clear comment explaining calculation
SELECT
  customer_id,
  -- Revenue from completed orders in last 90 days
  SUM(amount) FILTER (
    WHERE status = 'completed'
    AND order_date >= CURRENT_DATE - INTERVAL '90 days'
  ) as recent_revenue
FROM orders
GROUP BY customer_id;
```

## Common Pitfalls

### 1. Forgetting GROUP BY Columns

```sql
-- ❌ Error: customer_name not in GROUP BY
SELECT
  customer_id,
  customer_name,  -- Error!
  COUNT(*) as order_count
FROM orders
GROUP BY customer_id;

-- ✅ Fix: Include all non-aggregated columns in GROUP BY
SELECT
  o.customer_id,
  c.customer_name,
  COUNT(*) as order_count
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY o.customer_id, c.customer_name;
```

### 2. Using WHERE Instead of HAVING

```sql
-- ❌ Error: Can't use aggregate in WHERE
SELECT
  customer_id,
  SUM(amount) as total
FROM orders
GROUP BY customer_id
WHERE SUM(amount) > 1000;  -- Error!

-- ✅ Fix: Use HAVING for aggregate conditions
SELECT
  customer_id,
  SUM(amount) as total
FROM orders
GROUP BY customer_id
HAVING SUM(amount) > 1000;
```

### 3. NULL in Aggregations

```sql
-- ⚠️ Returns NULL if all values are NULL
SELECT SUM(discount_amount) FROM orders;

-- ✅ Handle NULL explicitly
SELECT COALESCE(SUM(discount_amount), 0) as total_discount
FROM orders;

-- ⚠️ COUNT(*) vs COUNT(column)
SELECT
  COUNT(*) as total_rows,           -- Counts all rows
  COUNT(email) as rows_with_email   -- Counts non-NULL emails
FROM customers;
```

### 4. Integer Division in Averages

```sql
-- ❌ Integer division may truncate (database-dependent)
SELECT
  category,
  SUM(quantity) / COUNT(*) as avg_quantity
FROM products
GROUP BY category;

-- ✅ Use AVG or cast to decimal
SELECT
  category,
  AVG(quantity) as avg_quantity
FROM products
GROUP BY category;

-- ✅ Or force decimal division
SELECT
  category,
  SUM(quantity) * 1.0 / COUNT(*) as avg_quantity
FROM products
GROUP BY category;
```

### 5. Aggregating Without GROUP BY

```sql
-- ❌ Mixing aggregates and non-aggregates without GROUP BY
SELECT
  customer_id,      -- Error in most databases
  COUNT(*) as total
FROM orders;

-- ✅ Add GROUP BY
SELECT
  customer_id,
  COUNT(*) as total
FROM orders
GROUP BY customer_id;

-- ✅ Or aggregate everything (if that's what you want)
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT customer_id) as unique_customers
FROM orders;
```

### 6. Performance Issues with DISTINCT

```sql
-- ❌ Slow: Multiple DISTINCTs in one query
SELECT
  COUNT(DISTINCT customer_id),
  COUNT(DISTINCT product_id),
  COUNT(DISTINCT order_id)
FROM order_items;

-- ✅ Better: Separate queries or use subqueries
SELECT
  (SELECT COUNT(DISTINCT customer_id) FROM order_items) as unique_customers,
  (SELECT COUNT(DISTINCT product_id) FROM order_items) as unique_products,
  (SELECT COUNT(DISTINCT order_id) FROM order_items) as unique_orders;
```

## Platform-Specific Notes

::: details PostgreSQL
PostgreSQL has excellent aggregation support with many advanced features:

```sql
-- FILTER clause
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') as completed_orders
FROM orders;

-- Array aggregation
SELECT
  country,
  ARRAY_AGG(city ORDER BY city) as cities
FROM customers
GROUP BY country;

-- JSON aggregation
SELECT
  country,
  JSON_AGG(JSON_BUILD_OBJECT('city', city, 'count', cnt))
FROM (
  SELECT country, city, COUNT(*) as cnt
  FROM customers
  GROUP BY country, city
) sub
GROUP BY country;

-- Advanced statistical functions
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median,
  MODE() WITHIN GROUP (ORDER BY category) as most_common_category
FROM products;

-- GROUPING SETS, ROLLUP, CUBE
SELECT
  country,
  city,
  COUNT(*)
FROM customers
GROUP BY ROLLUP(country, city);
```
:::

::: details MySQL
MySQL aggregation features and limitations:

```sql
-- GROUP_CONCAT (MySQL-specific)
SELECT
  country,
  GROUP_CONCAT(city ORDER BY city SEPARATOR ', ') as cities
FROM customers
GROUP BY country;

-- JSON aggregation (MySQL 5.7+)
SELECT
  country,
  JSON_ARRAYAGG(city) as cities
FROM customers
GROUP BY country;

-- ❌ No FILTER clause (use CASE instead)
SELECT
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
FROM orders;

-- ❌ Limited window function support in older versions
-- ✅ MySQL 8.0+ has full window function support

-- WITH ROLLUP (MySQL syntax)
SELECT
  country,
  city,
  COUNT(*)
FROM customers
GROUP BY country, city WITH ROLLUP;

-- ❌ No CUBE or GROUPING SETS in MySQL 8.0
-- Must use UNION or multiple queries
```
:::

::: details SQL Server
SQL Server aggregation features:

```sql
-- STRING_AGG (SQL Server 2017+)
SELECT
  country,
  STRING_AGG(city, ', ') WITHIN GROUP (ORDER BY city) as cities
FROM customers
GROUP BY country;

-- Statistical functions
SELECT
  category,
  AVG(price) as avg_price,
  STDEV(price) as std_dev,
  VAR(price) as variance
FROM products
GROUP BY category;

-- ROLLUP, CUBE, GROUPING SETS
SELECT
  country,
  city,
  COUNT(*)
FROM customers
GROUP BY ROLLUP(country, city);

-- GROUPING and GROUPING_ID
SELECT
  country,
  city,
  COUNT(*),
  GROUPING(country) as is_country_subtotal,
  GROUPING_ID(country, city) as grouping_level
FROM customers
GROUP BY CUBE(country, city);

-- Older versions: Use FOR XML PATH for string aggregation
SELECT
  country,
  STUFF((
    SELECT ', ' + city
    FROM customers c2
    WHERE c2.country = c1.country
    FOR XML PATH('')
  ), 1, 2, '') as cities
FROM customers c1
GROUP BY country;
```
:::

::: details SQLite
SQLite has basic but functional aggregation:

```sql
-- Basic aggregates work well
SELECT
  country,
  COUNT(*) as customer_count,
  AVG(age) as avg_age
FROM customers
GROUP BY country;

-- GROUP_CONCAT
SELECT
  country,
  GROUP_CONCAT(city, ', ') as cities
FROM customers
GROUP BY country;

-- ❌ No FILTER clause in older versions
-- ✅ SQLite 3.30+ supports FILTER
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') as completed_orders
FROM orders;

-- ❌ No ROLLUP, CUBE, or GROUPING SETS
-- Must use UNION for similar functionality

-- ❌ Limited statistical functions
-- No STDDEV, VARIANCE (must calculate manually)
SELECT
  category,
  AVG(price) as avg_price,
  AVG(price * price) - AVG(price) * AVG(price) as variance
FROM products
GROUP BY category;

-- JSON aggregation (SQLite 3.38+)
SELECT
  country,
  JSON_GROUP_ARRAY(city) as cities
FROM customers
GROUP BY country;
```
:::

::: details Oracle
Oracle aggregation features:

```sql
-- LISTAGG for string aggregation
SELECT
  country,
  LISTAGG(city, ', ') WITHIN GROUP (ORDER BY city) as cities
FROM customers
GROUP BY country;

-- LISTAGG with DISTINCT (Oracle 19c+)
SELECT
  country,
  LISTAGG(DISTINCT city, ', ') WITHIN GROUP (ORDER BY city) as cities
FROM customers
GROUP BY country;

-- Statistical functions
SELECT
  category,
  AVG(price) as avg_price,
  STDDEV(price) as std_dev,
  VARIANCE(price) as variance,
  MEDIAN(price) as median
FROM products
GROUP BY category;

-- ROLLUP, CUBE, GROUPING SETS
SELECT
  country,
  city,
  COUNT(*)
FROM customers
GROUP BY ROLLUP(country, city);

-- GROUPING and GROUPING_ID
SELECT
  country,
  city,
  COUNT(*),
  GROUPING(country) as is_country_total,
  GROUPING_ID(country, city) as level
FROM customers
GROUP BY CUBE(country, city);

-- Percentiles
SELECT
  category,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median,
  PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY price) as median_discrete
FROM products
GROUP BY category;
```
:::

## Real-World Examples

### E-commerce Sales Analysis

```sql
-- Comprehensive sales metrics by product category
SELECT
  c.category_name,
  COUNT(DISTINCT oi.order_id) as order_count,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  SUM(oi.quantity) as units_sold,
  SUM(oi.quantity * oi.price) as gross_revenue,
  SUM(oi.quantity * p.cost) as total_cost,
  SUM(oi.quantity * (oi.price - p.cost)) as gross_profit,
  ROUND(
    100.0 * SUM(oi.quantity * (oi.price - p.cost)) / NULLIF(SUM(oi.quantity * oi.price), 0),
    2
  ) as profit_margin_pct,
  ROUND(AVG(oi.price), 2) as avg_selling_price,
  ROUND(AVG(oi.quantity), 2) as avg_quantity_per_order,
  MIN(o.order_date) as first_sale_date,
  MAX(o.order_date) as last_sale_date
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'completed'
  AND o.order_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY c.category_id, c.category_name
HAVING SUM(oi.quantity * oi.price) > 1000
ORDER BY gross_revenue DESC;
```

### Customer Segmentation

```sql
-- RFM (Recency, Frequency, Monetary) Analysis
WITH customer_metrics AS (
  SELECT
    customer_id,
    MAX(order_date) as last_order_date,
    COUNT(*) as order_count,
    SUM(amount) as total_spent,
    AVG(amount) as avg_order_value
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
customer_scores AS (
  SELECT
    *,
    CURRENT_DATE - last_order_date as days_since_last_order,
    NTILE(5) OVER (ORDER BY last_order_date DESC) as recency_score,
    NTILE(5) OVER (ORDER BY order_count) as frequency_score,
    NTILE(5) OVER (ORDER BY total_spent) as monetary_score
  FROM customer_metrics
)
SELECT
  CASE
    WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
    WHEN recency_score >= 3 AND frequency_score >= 3 THEN 'Loyal Customers'
    WHEN recency_score >= 4 THEN 'Recent Customers'
    WHEN frequency_score >= 4 THEN 'Frequent Shoppers'
    WHEN monetary_score >= 4 THEN 'Big Spenders'
    WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'At Risk'
    WHEN recency_score <= 2 THEN 'Needs Attention'
    ELSE 'Regular'
  END as customer_segment,
  COUNT(*) as customer_count,
  ROUND(AVG(total_spent), 2) as avg_total_spent,
  ROUND(AVG(order_count), 2) as avg_order_count,
  ROUND(AVG(days_since_last_order), 0) as avg_days_since_last_order
FROM customer_scores
GROUP BY
  CASE
    WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
    WHEN recency_score >= 3 AND frequency_score >= 3 THEN 'Loyal Customers'
    WHEN recency_score >= 4 THEN 'Recent Customers'
    WHEN frequency_score >= 4 THEN 'Frequent Shoppers'
    WHEN monetary_score >= 4 THEN 'Big Spenders'
    WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'At Risk'
    WHEN recency_score <= 2 THEN 'Needs Attention'
    ELSE 'Regular'
  END
ORDER BY customer_count DESC;
```

### Monthly Revenue Trends with Comparisons

```sql
-- Month-over-month revenue analysis
WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', order_date) as month,
    SUM(amount) as revenue,
    COUNT(*) as order_count,
    COUNT(DISTINCT customer_id) as unique_customers
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT
  month,
  revenue,
  order_count,
  unique_customers,
  LAG(revenue) OVER (ORDER BY month) as prev_month_revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) as revenue_change,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) /
    NULLIF(LAG(revenue) OVER (ORDER BY month), 0),
    2
  ) as revenue_change_pct,
  SUM(revenue) OVER (ORDER BY month) as cumulative_revenue,
  AVG(revenue) OVER (
    ORDER BY month
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as moving_avg_3month
FROM monthly_revenue
ORDER BY month;
```

### Product Performance Dashboard

```sql
-- Product performance with multiple metrics
SELECT
  p.product_id,
  p.product_name,
  c.category_name,
  COUNT(DISTINCT oi.order_id) as times_ordered,
  SUM(oi.quantity) as total_units_sold,
  SUM(oi.quantity * oi.price) as total_revenue,
  ROUND(AVG(oi.price), 2) as avg_selling_price,
  ROUND(AVG(oi.quantity), 2) as avg_quantity_per_order,

  -- Revenue metrics
  ROUND(
    100.0 * SUM(oi.quantity * oi.price) /
    SUM(SUM(oi.quantity * oi.price)) OVER (),
    2
  ) as pct_of_total_revenue,

  -- Ranking
  RANK() OVER (ORDER BY SUM(oi.quantity * oi.price) DESC) as revenue_rank,
  RANK() OVER (PARTITION BY c.category_id ORDER BY SUM(oi.quantity) DESC) as category_rank,

  -- Time metrics
  MIN(o.order_date) as first_sold,
  MAX(o.order_date) as last_sold,
  CURRENT_DATE - MAX(o.order_date) as days_since_last_sale,

  -- Customer metrics
  COUNT(DISTINCT o.customer_id) as unique_customers,
  ROUND(
    SUM(oi.quantity * oi.price) * 1.0 / NULLIF(COUNT(DISTINCT o.customer_id), 0),
    2
  ) as revenue_per_customer

FROM products p
JOIN categories c ON p.category_id = c.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status = 'completed'
WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
   OR o.order_date IS NULL
GROUP BY p.product_id, p.product_name, c.category_id, c.category_name
ORDER BY total_revenue DESC NULLS LAST;
```

### Cohort Analysis

```sql
-- Customer cohort analysis by signup month
WITH customer_cohorts AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', created_at) as cohort_month
  FROM customers
),
order_months AS (
  SELECT
    o.customer_id,
    DATE_TRUNC('month', o.order_date) as order_month,
    SUM(o.amount) as month_revenue
  FROM orders o
  WHERE o.status = 'completed'
  GROUP BY o.customer_id, DATE_TRUNC('month', o.order_date)
)
SELECT
  cc.cohort_month,
  COUNT(DISTINCT cc.customer_id) as cohort_size,
  om.order_month - cc.cohort_month as months_since_signup,
  COUNT(DISTINCT om.customer_id) as active_customers,
  ROUND(
    100.0 * COUNT(DISTINCT om.customer_id) / COUNT(DISTINCT cc.customer_id),
    2
  ) as retention_rate,
  ROUND(SUM(om.month_revenue), 2) as total_revenue,
  ROUND(AVG(om.month_revenue), 2) as avg_revenue_per_active_customer
FROM customer_cohorts cc
LEFT JOIN order_months om
  ON cc.customer_id = om.customer_id
WHERE cc.cohort_month >= '2024-01-01'
GROUP BY cc.cohort_month, om.order_month - cc.cohort_month
ORDER BY cc.cohort_month, months_since_signup;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Basics](/concepts/basics/) - SQL fundamentals and basic queries
- [Joins](/concepts/joins/) - Combining data from multiple tables
- [Window Functions](/concepts/window-functions/) - Advanced analytical functions
- [Subqueries](/concepts/subqueries/) - Queries within queries
- [Indexes](/concepts/indexes/) - Optimizing aggregation performance
