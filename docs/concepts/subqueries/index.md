---
title: Subqueries
description: >-
  Comprehensive guide to SQL subqueries - nested queries for complex data
  retrieval and filtering
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
  - subqueries
  - nested-queries
  - correlated-subqueries
  - derived-tables
  - scalar-subqueries
  - exists
  - in
---

# Subqueries

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Scalar subquery (returns single value)
SELECT
  product_name,
  price,
  price - (SELECT AVG(price) FROM products) as price_diff_from_avg
FROM products;

-- Column subquery with IN
SELECT customer_name
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  WHERE order_date >= '2024-01-01'
);

-- Table subquery (derived table)
SELECT
  category,
  AVG(product_count) as avg_products
FROM (
  SELECT
    category,
    COUNT(*) as product_count
  FROM products
  GROUP BY category, subcategory
) as category_stats
GROUP BY category;

-- Correlated subquery
SELECT
  e1.employee_name,
  e1.salary,
  e1.department
FROM employees e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department = e1.department
);

-- EXISTS
SELECT c.customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.order_date >= '2024-01-01'
);
```

## Overview

A subquery (also called an inner query or nested query) is a query embedded within another SQL query. Subqueries can appear in various clauses including SELECT, FROM, WHERE, and HAVING. They provide a powerful way to perform complex data retrieval, filtering, and calculations.

Subqueries are particularly useful for:

- **Filtering based on aggregate calculations**: Finding values above/below averages
- **Dynamic comparisons**: Comparing against dynamically computed values
- **Complex filtering**: Using results from one query to filter another
- **Derived tables**: Creating temporary result sets for further processing
- **Existence checks**: Testing whether related data exists
- **Breaking down complex problems**: Solving queries step-by-step

## Types of Subqueries

### Scalar Subqueries

A scalar subquery returns exactly one row with one column (a single value). Can be used anywhere a single value is expected.

```sql
-- Compare each product price to the average
SELECT
  product_id,
  product_name,
  price,
  (SELECT AVG(price) FROM products) as avg_price,
  price - (SELECT AVG(price) FROM products) as difference_from_avg
FROM products
ORDER BY difference_from_avg DESC;

-- Find products priced above the average in their category
SELECT
  product_name,
  category,
  price
FROM products p1
WHERE price > (
  SELECT AVG(price)
  FROM products p2
  WHERE p2.category = p1.category
);

-- Calculate percentage of total revenue
SELECT
  product_id,
  product_name,
  revenue,
  ROUND(
    100.0 * revenue / (SELECT SUM(revenue) FROM product_sales),
    2
  ) as pct_of_total_revenue
FROM product_sales
ORDER BY pct_of_total_revenue DESC;

-- Get the most recent order date for each customer
SELECT
  customer_id,
  customer_name,
  (
    SELECT MAX(order_date)
    FROM orders o
    WHERE o.customer_id = c.customer_id
  ) as last_order_date
FROM customers c;
```

**Important**: Scalar subqueries must return exactly one value. If the subquery returns zero rows, the result is NULL. If it returns multiple rows, most databases will raise an error.

### Column Subqueries

A column subquery returns one column with zero or more rows. Typically used with IN, NOT IN, ANY, or ALL operators.

```sql
-- Find customers who placed orders in 2024
SELECT
  customer_id,
  customer_name,
  email
FROM customers
WHERE customer_id IN (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE EXTRACT(YEAR FROM order_date) = 2024
);

-- Find products not in any orders
SELECT
  product_id,
  product_name,
  price
FROM products
WHERE product_id NOT IN (
  SELECT DISTINCT product_id
  FROM order_items
  WHERE product_id IS NOT NULL
);

-- Find employees earning more than ANY sales rep
SELECT
  employee_name,
  salary,
  department
FROM employees
WHERE salary > ANY (
  SELECT salary
  FROM employees
  WHERE department = 'Sales'
);

-- Find employees earning more than ALL sales reps
SELECT
  employee_name,
  salary,
  department
FROM employees
WHERE salary > ALL (
  SELECT salary
  FROM employees
  WHERE department = 'Sales'
);

-- Find customers in the same cities as our warehouses
SELECT customer_name, city
FROM customers
WHERE city IN (
  SELECT DISTINCT city
  FROM warehouses
);
```

**Warning**: Be careful with NOT IN when the subquery can return NULL values - it may not behave as expected (see Common Pitfalls section).

### Row Subqueries

A row subquery returns one row with multiple columns. Used to compare multiple values simultaneously.

```sql
-- Find products with exact price and category match
SELECT product_name, price, category
FROM products
WHERE (price, category) = (
  SELECT price, category
  FROM products
  WHERE product_id = 100
);

-- Find orders matching specific customer and amount
SELECT order_id, customer_id, amount, order_date
FROM orders
WHERE (customer_id, amount) IN (
  SELECT customer_id, MAX(amount)
  FROM orders
  GROUP BY customer_id
);

-- Find employees with same job title and salary as top performers
SELECT
  employee_name,
  job_title,
  salary
FROM employees
WHERE (job_title, salary) IN (
  SELECT job_title, MAX(salary)
  FROM employees
  GROUP BY job_title
);
```

**Note**: Row subquery support varies by database. PostgreSQL, MySQL 5.7+, and Oracle support them well. Some databases have limited support.

### Table Subqueries (Derived Tables)

A table subquery returns multiple rows and columns. Used in the FROM clause as a "derived table" or "inline view."

```sql
-- Calculate average sales per category, then find categories above overall average
SELECT
  category,
  avg_sales
FROM (
  SELECT
    category,
    AVG(sales) as avg_sales
  FROM products
  GROUP BY category
) as category_averages
WHERE avg_sales > (
  SELECT AVG(sales)
  FROM products
);

-- Complex aggregation pipeline
SELECT
  sales_tier,
  COUNT(*) as customer_count,
  AVG(total_sales) as avg_tier_sales
FROM (
  SELECT
    customer_id,
    SUM(amount) as total_sales,
    CASE
      WHEN SUM(amount) > 10000 THEN 'High'
      WHEN SUM(amount) > 5000 THEN 'Medium'
      ELSE 'Low'
    END as sales_tier
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
) as customer_sales
GROUP BY sales_tier
ORDER BY avg_tier_sales DESC;

-- Top N per group using derived table
SELECT *
FROM (
  SELECT
    category,
    product_name,
    price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as rank_in_category
  FROM products
) ranked
WHERE rank_in_category <= 3;

-- Multi-step calculation
SELECT
  month,
  revenue,
  prev_month_revenue,
  revenue - prev_month_revenue as month_over_month_change,
  ROUND(
    100.0 * (revenue - prev_month_revenue) / NULLIF(prev_month_revenue, 0),
    2
  ) as pct_change
FROM (
  SELECT
    DATE_TRUNC('month', order_date) as month,
    SUM(amount) as revenue,
    LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', order_date)) as prev_month_revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', order_date)
) monthly_sales
ORDER BY month;
```

**Important**: In most databases, derived tables must have an alias (AS table_name).

## Subqueries in Different Clauses

### WHERE Clause Subqueries

The most common location for subqueries - used for filtering based on complex conditions.

```sql
-- Find customers who spent more than average
SELECT
  customer_id,
  customer_name
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  GROUP BY customer_id
  HAVING SUM(amount) > (
    SELECT AVG(total_amount)
    FROM (
      SELECT customer_id, SUM(amount) as total_amount
      FROM orders
      GROUP BY customer_id
    ) customer_totals
  )
);

-- Find products in categories with more than 10 products
SELECT
  product_id,
  product_name,
  category
FROM products
WHERE category IN (
  SELECT category
  FROM products
  GROUP BY category
  HAVING COUNT(*) > 10
);

-- Find orders larger than customer's average order
SELECT
  o.order_id,
  o.customer_id,
  o.amount,
  o.order_date
FROM orders o
WHERE o.amount > (
  SELECT AVG(amount)
  FROM orders o2
  WHERE o2.customer_id = o.customer_id
);

-- Multiple subquery conditions
SELECT product_name, price, category
FROM products p
WHERE price > (
  SELECT AVG(price) FROM products
)
AND category IN (
  SELECT category
  FROM product_categories
  WHERE is_active = true
)
AND product_id NOT IN (
  SELECT product_id
  FROM discontinued_products
);
```

### FROM Clause Subqueries

Create temporary result sets (derived tables) for further querying.

```sql
-- Calculate metrics on aggregated data
SELECT
  category,
  total_products,
  total_revenue,
  ROUND(total_revenue / total_products, 2) as avg_revenue_per_product
FROM (
  SELECT
    p.category,
    COUNT(DISTINCT p.product_id) as total_products,
    SUM(oi.quantity * oi.unit_price) as total_revenue
  FROM products p
  JOIN order_items oi ON p.product_id = oi.product_id
  GROUP BY p.category
) category_summary
WHERE total_products > 5
ORDER BY avg_revenue_per_product DESC;

-- Join multiple derived tables
SELECT
  cs.customer_name,
  os.order_count,
  os.total_spent,
  ps.product_count
FROM (
  SELECT
    customer_id,
    customer_name,
    email
  FROM customers
  WHERE status = 'active'
) cs
LEFT JOIN (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY customer_id
) os ON cs.customer_id = os.customer_id
LEFT JOIN (
  SELECT
    o.customer_id,
    COUNT(DISTINCT oi.product_id) as product_count
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY o.customer_id
) ps ON cs.customer_id = ps.customer_id;

-- Lateral join (PostgreSQL, Oracle, SQL Server)
SELECT
  c.customer_name,
  recent_orders.order_id,
  recent_orders.order_date,
  recent_orders.amount
FROM customers c
CROSS JOIN LATERAL (
  SELECT order_id, order_date, amount
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY order_date DESC
  LIMIT 3
) recent_orders;
```

### SELECT Clause Subqueries

Compute derived values for each row in the result set.

```sql
-- Add calculated columns using subqueries
SELECT
  p.product_id,
  p.product_name,
  p.price,
  (
    SELECT COUNT(*)
    FROM order_items oi
    WHERE oi.product_id = p.product_id
  ) as times_ordered,
  (
    SELECT SUM(quantity)
    FROM order_items oi
    WHERE oi.product_id = p.product_id
  ) as total_quantity_sold,
  (
    SELECT MAX(order_date)
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE oi.product_id = p.product_id
  ) as last_ordered_date
FROM products p
ORDER BY times_ordered DESC;

-- Calculate percentages
SELECT
  category,
  COUNT(*) as product_count,
  ROUND(
    100.0 * COUNT(*) / (SELECT COUNT(*) FROM products),
    2
  ) as pct_of_total_products
FROM products
GROUP BY category
ORDER BY product_count DESC;

-- Running comparison to totals
SELECT
  order_date,
  daily_revenue,
  (SELECT SUM(amount) FROM orders) as total_revenue,
  ROUND(
    100.0 * daily_revenue / (SELECT SUM(amount) FROM orders),
    2
  ) as pct_of_total
FROM (
  SELECT
    DATE(order_date) as order_date,
    SUM(amount) as daily_revenue
  FROM orders
  GROUP BY DATE(order_date)
) daily_sales
ORDER BY order_date;
```

### HAVING Clause Subqueries

Filter grouped results based on aggregate comparisons.

```sql
-- Find categories with above-average product counts
SELECT
  category,
  COUNT(*) as product_count
FROM products
GROUP BY category
HAVING COUNT(*) > (
  SELECT AVG(cat_count)
  FROM (
    SELECT COUNT(*) as cat_count
    FROM products
    GROUP BY category
  ) category_counts
);

-- Find customers with above-average order totals
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(amount) > (
  SELECT AVG(customer_total)
  FROM (
    SELECT SUM(amount) as customer_total
    FROM orders
    GROUP BY customer_id
  ) customer_totals
);

-- Categories where max price exceeds overall average by 50%
SELECT
  category,
  MAX(price) as max_price,
  COUNT(*) as product_count
FROM products
GROUP BY category
HAVING MAX(price) > (
  SELECT AVG(price) * 1.5
  FROM products
);
```

## Correlated Subqueries

A correlated subquery references columns from the outer query. It's executed once for each row processed by the outer query.

### Basic Correlated Subqueries

```sql
-- Find employees earning above their department average
SELECT
  employee_id,
  employee_name,
  department,
  salary
FROM employees e1
WHERE salary > (
  SELECT AVG(salary)
  FROM employees e2
  WHERE e2.department = e1.department
);

-- Find products priced above their category average
SELECT
  product_id,
  product_name,
  category,
  price,
  (
    SELECT AVG(price)
    FROM products p2
    WHERE p2.category = p1.category
  ) as category_avg_price
FROM products p1
WHERE price > (
  SELECT AVG(price)
  FROM products p2
  WHERE p2.category = p1.category
)
ORDER BY category, price DESC;

-- Find customers' largest orders
SELECT
  o1.customer_id,
  o1.order_id,
  o1.amount,
  o1.order_date
FROM orders o1
WHERE o1.amount = (
  SELECT MAX(o2.amount)
  FROM orders o2
  WHERE o2.customer_id = o1.customer_id
);

-- Get each customer's order count in SELECT clause
SELECT
  c.customer_id,
  c.customer_name,
  (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_id = c.customer_id
  ) as order_count,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM orders o
    WHERE o.customer_id = c.customer_id
  ) as total_spent
FROM customers c
ORDER BY total_spent DESC;
```

### Complex Correlated Subqueries

```sql
-- Find the nth highest value per group
-- (Second highest salary per department)
SELECT DISTINCT
  e1.department,
  (
    SELECT DISTINCT salary
    FROM employees e2
    WHERE e2.department = e1.department
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
  ) as second_highest_salary
FROM employees e1;

-- Moving average using correlated subquery
SELECT
  order_date,
  daily_revenue,
  (
    SELECT AVG(daily_revenue)
    FROM (
      SELECT
        DATE(order_date) as order_date,
        SUM(amount) as daily_revenue
      FROM orders
      GROUP BY DATE(order_date)
    ) d2
    WHERE d2.order_date BETWEEN d1.order_date - INTERVAL '6 days'
      AND d1.order_date
  ) as moving_avg_7day
FROM (
  SELECT
    DATE(order_date) as order_date,
    SUM(amount) as daily_revenue
  FROM orders
  GROUP BY DATE(order_date)
) d1
ORDER BY order_date;

-- Find records with no related records in a date range
SELECT
  c.customer_id,
  c.customer_name,
  c.signup_date
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'
);
```

**Performance Note**: Correlated subqueries can be slow because they execute once per outer row. Consider using JOINs or window functions as alternatives when possible.

## EXISTS and NOT EXISTS

EXISTS checks whether a subquery returns any rows. It's often more efficient than IN for checking existence.

### EXISTS

```sql
-- Find customers who have placed orders
SELECT
  customer_id,
  customer_name,
  email
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
);

-- Find products that have been ordered in the last 30 days
SELECT
  p.product_id,
  p.product_name,
  p.category
FROM products p
WHERE EXISTS (
  SELECT 1
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE oi.product_id = p.product_id
    AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
);

-- Find departments with high earners (salary > 100000)
SELECT
  d.department_id,
  d.department_name
FROM departments d
WHERE EXISTS (
  SELECT 1
  FROM employees e
  WHERE e.department_id = d.department_id
    AND e.salary > 100000
);

-- Multiple EXISTS conditions
SELECT
  c.customer_id,
  c.customer_name
FROM customers c
WHERE EXISTS (
  -- Has orders
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
)
AND EXISTS (
  -- Has recent activity
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'
)
AND NOT EXISTS (
  -- No cancelled orders
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.status = 'cancelled'
);
```

### NOT EXISTS

```sql
-- Find customers who have never placed an order
SELECT
  customer_id,
  customer_name,
  signup_date
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
);

-- Find products never ordered
SELECT
  product_id,
  product_name,
  price,
  stock_quantity
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM order_items oi
  WHERE oi.product_id = p.product_id
);

-- Find orphaned records
SELECT
  o.order_id,
  o.customer_id,
  o.order_date
FROM orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM customers c
  WHERE c.customer_id = o.customer_id
);

-- Find employees without direct reports
SELECT
  e.employee_id,
  e.employee_name,
  e.job_title
FROM employees e
WHERE NOT EXISTS (
  SELECT 1
  FROM employees e2
  WHERE e2.manager_id = e.employee_id
);

-- Find gaps in sequences
SELECT
  g.expected_id
FROM generate_series(
  (SELECT MIN(order_id) FROM orders),
  (SELECT MAX(order_id) FROM orders)
) g(expected_id)
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.order_id = g.expected_id
);
```

**Performance Tip**: EXISTS is typically faster than IN for large subquery results because it stops searching as soon as it finds one matching row.

## IN and NOT IN

### IN Operator

```sql
-- Basic IN with subquery
SELECT
  product_name,
  category,
  price
FROM products
WHERE category IN (
  SELECT category
  FROM product_categories
  WHERE is_featured = true
);

-- Multiple columns (PostgreSQL, MySQL 5.7+)
SELECT product_name, price, category
FROM products
WHERE (category, price) IN (
  SELECT category, MAX(price)
  FROM products
  GROUP BY category
);

-- Nested IN subqueries
SELECT
  employee_name,
  department
FROM employees
WHERE department IN (
  SELECT department_name
  FROM departments
  WHERE location IN (
    SELECT city
    FROM offices
    WHERE country = 'USA'
  )
);

-- IN with complex subquery
SELECT
  c.customer_name,
  c.email
FROM customers c
WHERE c.customer_id IN (
  SELECT o.customer_id
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE oi.product_id IN (
    SELECT product_id
    FROM products
    WHERE category = 'Electronics'
  )
  GROUP BY o.customer_id
  HAVING SUM(o.amount) > 1000
);
```

### NOT IN Operator

```sql
-- Find products not in any category
SELECT
  product_id,
  product_name
FROM products
WHERE category NOT IN (
  SELECT category_name
  FROM active_categories
);

-- Find customers who haven't ordered specific products
SELECT
  customer_id,
  customer_name
FROM customers
WHERE customer_id NOT IN (
  SELECT DISTINCT o.customer_id
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE oi.product_id IN (100, 101, 102)
);

-- Find available time slots
SELECT slot_time
FROM available_slots
WHERE slot_time NOT IN (
  SELECT appointment_time
  FROM appointments
  WHERE appointment_date = CURRENT_DATE
);
```

**Warning**: NOT IN with NULL values can produce unexpected results. If the subquery returns any NULL, NOT IN will return no rows. Use NOT EXISTS or IS NOT NULL checks instead.

```sql
-- ❌ Problematic: Returns no rows if subquery has NULLs
SELECT customer_name
FROM customers
WHERE customer_id NOT IN (
  SELECT customer_id FROM orders  -- If any row has NULL customer_id
);

-- ✅ Better: Use NOT EXISTS
SELECT customer_name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
);

-- ✅ Alternative: Filter NULLs explicitly
SELECT customer_name
FROM customers
WHERE customer_id NOT IN (
  SELECT customer_id
  FROM orders
  WHERE customer_id IS NOT NULL
);
```

## Comparison Operators with Subqueries

### ANY and SOME

ANY and SOME are synonyms. They return true if the comparison is true for at least one value returned by the subquery.

```sql
-- Find products cheaper than ANY luxury product
SELECT
  product_name,
  price,
  category
FROM products
WHERE price < ANY (
  SELECT price
  FROM products
  WHERE category = 'Luxury'
);

-- Equivalent to: price < (SELECT MAX(price) FROM products WHERE category = 'Luxury')

-- Find employees with salary higher than ANY manager
SELECT
  employee_name,
  salary,
  department
FROM employees
WHERE salary > ANY (
  SELECT salary
  FROM employees
  WHERE job_title LIKE '%Manager%'
);

-- Products with price equal to any historical price
SELECT
  p.product_name,
  p.price
FROM products p
WHERE p.price = ANY (
  SELECT price
  FROM price_history ph
  WHERE ph.product_id = p.product_id
);
```

### ALL

ALL returns true if the comparison is true for all values returned by the subquery.

```sql
-- Find products more expensive than ALL economy products
SELECT
  product_name,
  price,
  category
FROM products
WHERE price > ALL (
  SELECT price
  FROM products
  WHERE category = 'Economy'
);

-- Equivalent to: price > (SELECT MAX(price) FROM products WHERE category = 'Economy')

-- Find customers who spent more than ALL customers in a region
SELECT
  c1.customer_name,
  c1.region,
  (SELECT SUM(amount) FROM orders WHERE customer_id = c1.customer_id) as total_spent
FROM customers c1
WHERE (
  SELECT SUM(amount)
  FROM orders
  WHERE customer_id = c1.customer_id
) > ALL (
  SELECT SUM(amount)
  FROM orders o
  JOIN customers c2 ON o.customer_id = c2.customer_id
  WHERE c2.region = 'West'
  GROUP BY o.customer_id
);

-- Employees with higher salary than ALL in another department
SELECT
  employee_name,
  salary,
  department
FROM employees
WHERE department = 'Engineering'
  AND salary > ALL (
    SELECT salary
    FROM employees
    WHERE department = 'Sales'
  );
```

### Comparison with Scalar Subqueries

```sql
-- Greater than average
SELECT product_name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- Equal to maximum
SELECT employee_name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- Less than minimum of a subset
SELECT product_name, price, category
FROM products
WHERE price < (
  SELECT MIN(price)
  FROM products
  WHERE category = 'Premium'
);

-- Between subquery results
SELECT order_id, amount, order_date
FROM orders
WHERE amount BETWEEN
  (SELECT AVG(amount) FROM orders) AND
  (SELECT MAX(amount) FROM orders);
```

## Subquery Performance Optimization

### When to Use Subqueries vs JOINs

```sql
-- Subquery approach
SELECT
  c.customer_name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) as order_count
FROM customers c;

-- JOIN approach (often faster)
SELECT
  c.customer_name,
  COUNT(o.order_id) as order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name;

-- EXISTS (efficient for existence checks)
SELECT customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);

-- JOIN equivalent (may be less efficient)
SELECT DISTINCT c.customer_name
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id;
```

### Optimizing Correlated Subqueries

```sql
-- ❌ Slow: Correlated subquery in SELECT
SELECT
  p.product_name,
  p.price,
  (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.product_id) as order_count,
  (SELECT SUM(quantity) FROM order_items oi WHERE oi.product_id = p.product_id) as total_quantity
FROM products p;

-- ✅ Faster: Single JOIN with aggregation
SELECT
  p.product_name,
  p.price,
  COALESCE(oi_agg.order_count, 0) as order_count,
  COALESCE(oi_agg.total_quantity, 0) as total_quantity
FROM products p
LEFT JOIN (
  SELECT
    product_id,
    COUNT(*) as order_count,
    SUM(quantity) as total_quantity
  FROM order_items
  GROUP BY product_id
) oi_agg ON p.product_id = oi_agg.product_id;

-- ❌ Slow: Correlated subquery executed for each row
SELECT
  e1.employee_name,
  e1.salary
FROM employees e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department = e1.department
);

-- ✅ Faster: Pre-calculate department averages
SELECT
  e.employee_name,
  e.salary,
  e.department
FROM employees e
JOIN (
  SELECT department, AVG(salary) as avg_salary
  FROM employees
  GROUP BY department
) dept_avg ON e.department = dept_avg.department
WHERE e.salary > dept_avg.avg_salary;
```

### Indexing for Subqueries

```sql
-- Ensure columns used in subquery joins and filters are indexed

-- Index for this query:
SELECT customer_name
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  WHERE order_date >= '2024-01-01'
);

-- Recommended indexes:
-- CREATE INDEX idx_orders_date ON orders(order_date);
-- CREATE INDEX idx_orders_customer_id ON orders(customer_id);
-- CREATE INDEX idx_customers_id ON customers(customer_id);

-- For correlated subquery:
SELECT
  p.product_name,
  (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.product_id) as times_ordered
FROM products p;

-- Recommended index:
-- CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### Materialization Hints

```sql
-- PostgreSQL: Materialized CTE instead of subquery
WITH product_stats AS MATERIALIZED (
  SELECT
    product_id,
    COUNT(*) as order_count,
    SUM(quantity) as total_quantity
  FROM order_items
  GROUP BY product_id
)
SELECT
  p.product_name,
  p.price,
  COALESCE(ps.order_count, 0) as order_count,
  COALESCE(ps.total_quantity, 0) as total_quantity
FROM products p
LEFT JOIN product_stats ps ON p.product_id = ps.product_id;

-- MySQL: Force subquery materialization
SELECT /*+ SUBQUERY_MATERIALIZATION(true) */ *
FROM orders
WHERE customer_id IN (
  SELECT customer_id
  FROM customers
  WHERE region = 'West'
);
```

## Platform-Specific Notes

::: details PostgreSQL
PostgreSQL has excellent subquery support and optimization:

```sql
-- Lateral joins (correlated subquery in FROM)
SELECT
  c.customer_name,
  latest_orders.order_id,
  latest_orders.order_date,
  latest_orders.amount
FROM customers c
CROSS JOIN LATERAL (
  SELECT order_id, order_date, amount
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY order_date DESC
  LIMIT 5
) latest_orders;

-- Array subqueries
SELECT
  category,
  ARRAY(
    SELECT product_name
    FROM products p
    WHERE p.category = c.category
    ORDER BY price DESC
    LIMIT 3
  ) as top_products
FROM (SELECT DISTINCT category FROM products) c;

-- Subquery in UPDATE
UPDATE products p
SET price = price * 1.1
WHERE category IN (
  SELECT category
  FROM product_categories
  WHERE is_premium = true
);

-- Subquery in DELETE with RETURNING
DELETE FROM orders
WHERE order_id IN (
  SELECT order_id
  FROM orders
  WHERE order_date < CURRENT_DATE - INTERVAL '7 years'
    AND status = 'cancelled'
)
RETURNING order_id, order_date, amount;

-- Subquery factoring with CTEs
WITH high_value_customers AS (
  SELECT customer_id, SUM(amount) as total
  FROM orders
  GROUP BY customer_id
  HAVING SUM(amount) > 10000
)
SELECT
  c.customer_name,
  hvc.total
FROM customers c
WHERE c.customer_id IN (SELECT customer_id FROM high_value_customers);
```

**Performance Notes**:

- PostgreSQL 12+ improved subquery optimization significantly
- LATERAL joins are very powerful for correlated subqueries
- EXISTS is typically faster than IN for large datasets
- Use EXPLAIN ANALYZE to check subquery execution plans
  :::

::: details MySQL
MySQL 8.0+ has much improved subquery support:

```sql
-- Derived table with subquery
SELECT
  category,
  product_count,
  avg_price
FROM (
  SELECT
    category,
    COUNT(*) as product_count,
    AVG(price) as avg_price
  FROM products
  GROUP BY category
) AS category_stats
WHERE product_count > 5;

-- Subquery in IN clause
SELECT customer_name
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  WHERE YEAR(order_date) = 2024
);

-- Scalar subquery
SELECT
  product_name,
  price,
  price - (SELECT AVG(price) FROM products) as diff_from_avg
FROM products;

-- EXISTS optimization (MySQL 5.7+)
SELECT c.customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
);

-- Lateral derived tables (MySQL 8.0.14+)
SELECT
  c.customer_name,
  recent.order_date,
  recent.amount
FROM customers c
JOIN LATERAL (
  SELECT order_date, amount
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY order_date DESC
  LIMIT 3
) recent ON TRUE;

-- Subquery with window functions (MySQL 8.0+)
SELECT *
FROM (
  SELECT
    employee_name,
    salary,
    department,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
  FROM employees
) ranked
WHERE dept_rank <= 3;
```

**Limitations**:

- Older MySQL versions (< 5.6) have poor subquery optimization
- MySQL 5.6+ uses subquery materialization and semi-join optimization
- Avoid correlated subqueries in MySQL 5.5 and earlier
- Use EXPLAIN to check if subquery is using dependent subquery (slow)
  :::

::: details SQL Server
SQL Server has strong subquery support with various optimization strategies:

```sql
-- Basic subquery
SELECT
  ProductName,
  Price
FROM Products
WHERE Price > (SELECT AVG(Price) FROM Products);

-- Correlated subquery
SELECT
  e1.EmployeeName,
  e1.Salary,
  e1.Department
FROM Employees e1
WHERE e1.Salary > (
  SELECT AVG(e2.Salary)
  FROM Employees e2
  WHERE e2.Department = e1.Department
);

-- CROSS APPLY (similar to LATERAL in PostgreSQL)
SELECT
  c.CustomerName,
  recent_orders.OrderID,
  recent_orders.OrderDate
FROM Customers c
CROSS APPLY (
  SELECT TOP 5 OrderID, OrderDate, Amount
  FROM Orders o
  WHERE o.CustomerID = c.CustomerID
  ORDER BY OrderDate DESC
) recent_orders;

-- OUTER APPLY (LEFT JOIN variant)
SELECT
  c.CustomerName,
  recent_orders.OrderID,
  recent_orders.OrderDate
FROM Customers c
OUTER APPLY (
  SELECT TOP 1 OrderID, OrderDate
  FROM Orders o
  WHERE o.CustomerID = c.CustomerID
  ORDER BY OrderDate DESC
) recent_orders;

-- Subquery in UPDATE
UPDATE p
SET Price = Price * 1.1
FROM Products p
WHERE p.CategoryID IN (
  SELECT CategoryID
  FROM Categories
  WHERE CategoryName IN ('Electronics', 'Computers')
);

-- Derived table with aggregation
SELECT
  Category,
  AvgPrice,
  ProductCount
FROM (
  SELECT
    Category,
    AVG(Price) as AvgPrice,
    COUNT(*) as ProductCount
  FROM Products
  GROUP BY Category
) AS CategoryStats
WHERE ProductCount > 10;

-- EXISTS with complex condition
SELECT c.CustomerName
FROM Customers c
WHERE EXISTS (
  SELECT 1
  FROM Orders o
  JOIN OrderItems oi ON o.OrderID = oi.OrderID
  WHERE o.CustomerID = c.CustomerID
    AND o.OrderDate >= DATEADD(DAY, -90, GETDATE())
  GROUP BY o.CustomerID
  HAVING SUM(oi.Quantity * oi.UnitPrice) > 1000
);
```

**Performance Notes**:

- SQL Server can convert IN to EXISTS automatically
- CROSS APPLY and OUTER APPLY are powerful for correlated logic
- Use SET STATISTICS IO ON to analyze subquery performance
- Check execution plans for index seeks vs scans
  :::

::: details Oracle
Oracle has comprehensive subquery support:

```sql
-- Scalar subquery
SELECT
  product_name,
  price,
  price - (SELECT AVG(price) FROM products) as diff_from_avg
FROM products;

-- Correlated subquery
SELECT
  e1.employee_name,
  e1.salary,
  e1.department_id
FROM employees e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e1.department_id
);

-- Inline view (derived table)
SELECT
  category,
  avg_price,
  product_count
FROM (
  SELECT
    category,
    AVG(price) as avg_price,
    COUNT(*) as product_count
  FROM products
  GROUP BY category
)
WHERE product_count > 5;

-- Lateral inline view (Oracle 12c+)
SELECT
  c.customer_name,
  recent.order_id,
  recent.order_date
FROM customers c,
LATERAL (
  SELECT order_id, order_date, amount
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY order_date DESC
  FETCH FIRST 5 ROWS ONLY
) recent;

-- Subquery factoring (WITH clause)
WITH high_value_orders AS (
  SELECT customer_id, order_id, amount
  FROM orders
  WHERE amount > 1000
)
SELECT
  c.customer_name,
  COUNT(hvo.order_id) as high_value_order_count
FROM customers c
LEFT JOIN high_value_orders hvo ON c.customer_id = hvo.customer_id
GROUP BY c.customer_name;

-- Subquery in INSERT
INSERT INTO premium_customers (customer_id, customer_name, total_spent)
SELECT
  customer_id,
  customer_name,
  (SELECT SUM(amount) FROM orders o WHERE o.customer_id = c.customer_id) as total_spent
FROM customers c
WHERE (SELECT SUM(amount) FROM orders o WHERE o.customer_id = c.customer_id) > 10000;

-- ANY and ALL
SELECT product_name, price
FROM products
WHERE price > ALL (
  SELECT price
  FROM products
  WHERE category = 'Budget'
);
```

**Performance Notes**:

- Oracle optimizes subqueries aggressively
- Use EXPLAIN PLAN to check execution strategy
- Consider materialized views for frequently-used subqueries
- LATERAL views are powerful for correlated logic (12c+)
  :::

::: details SQLite
SQLite has good subquery support despite being lightweight:

```sql
-- Basic subquery in WHERE
SELECT
  product_name,
  price
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- Correlated subquery
SELECT
  c.customer_name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) as order_count
FROM customers c;

-- Derived table
SELECT
  category,
  avg_price
FROM (
  SELECT
    category,
    AVG(price) as avg_price
  FROM products
  GROUP BY category
)
WHERE avg_price > 50;

-- EXISTS
SELECT customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
);

-- IN with subquery
SELECT product_name
FROM products
WHERE category IN (
  SELECT category_name
  FROM categories
  WHERE is_active = 1
);

-- Scalar subquery in SELECT
SELECT
  product_name,
  price,
  (SELECT AVG(price) FROM products) as avg_price,
  price - (SELECT AVG(price) FROM products) as diff_from_avg
FROM products;

-- Multiple subqueries
SELECT
  product_name,
  price,
  category
FROM products
WHERE price > (SELECT AVG(price) FROM products)
  AND category IN (
    SELECT category
    FROM product_categories
    WHERE is_featured = 1
  );
```

**Limitations**:

- No LATERAL joins
- No APPLY operators
- Subquery optimization is basic compared to enterprise databases
- For complex queries, consider breaking into temp tables
- EXISTS typically faster than IN for larger datasets
  :::

::: details BigQuery
Google BigQuery has excellent subquery support optimized for large-scale analytics:

```sql
-- Scalar subquery
SELECT
  product_name,
  price,
  price - (SELECT AVG(price) FROM `project.dataset.products`) as diff_from_avg
FROM `project.dataset.products`;

-- Correlated subquery
SELECT
  e1.employee_name,
  e1.salary,
  e1.department
FROM `project.dataset.employees` e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM `project.dataset.employees` e2
  WHERE e2.department = e1.department
);

-- Array subquery (BigQuery-specific)
SELECT
  category,
  ARRAY(
    SELECT AS STRUCT product_name, price
    FROM `project.dataset.products` p
    WHERE p.category = c.category
    ORDER BY price DESC
    LIMIT 3
  ) as top_products
FROM (SELECT DISTINCT category FROM `project.dataset.products`) c;

-- Derived table with aggregation
SELECT
  category,
  total_revenue,
  product_count
FROM (
  SELECT
    p.category,
    SUM(oi.quantity * oi.price) as total_revenue,
    COUNT(DISTINCT p.product_id) as product_count
  FROM `project.dataset.products` p
  JOIN `project.dataset.order_items` oi ON p.product_id = oi.product_id
  GROUP BY p.category
)
WHERE product_count > 10;

-- EXISTS
SELECT c.customer_name
FROM `project.dataset.customers` c
WHERE EXISTS (
  SELECT 1
  FROM `project.dataset.orders` o
  WHERE o.customer_id = c.customer_id
    AND DATE(o.order_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
);

-- IN with subquery
SELECT product_name, category
FROM `project.dataset.products`
WHERE category IN (
  SELECT category_name
  FROM `project.dataset.categories`
  WHERE is_active = TRUE
);

-- Subquery with window functions
SELECT *
FROM (
  SELECT
    product_name,
    category,
    revenue,
    RANK() OVER (PARTITION BY category ORDER BY revenue DESC) as rank_in_category
  FROM (
    SELECT
      p.product_name,
      p.category,
      SUM(oi.quantity * oi.price) as revenue
    FROM `project.dataset.products` p
    JOIN `project.dataset.order_items` oi ON p.product_id = oi.product_id
    GROUP BY p.product_name, p.category
  )
)
WHERE rank_in_category <= 5;
```

**BigQuery Features**:

- Excellent optimization for analytical subqueries
- Array subqueries for nested data
- Automatically optimizes many correlated subqueries
- Use EXPLAIN to view execution plan
- Subqueries work well with partitioned tables
  :::

::: details Snowflake
Snowflake provides strong subquery support optimized for cloud data warehousing:

```sql
-- Scalar subquery
SELECT
  product_name,
  price,
  price - (SELECT AVG(price) FROM products) as price_diff_from_avg
FROM products;

-- Correlated subquery
SELECT
  e1.employee_name,
  e1.salary,
  e1.department
FROM employees e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department = e1.department
);

-- Derived table
SELECT
  category,
  avg_price,
  product_count
FROM (
  SELECT
    category,
    AVG(price) as avg_price,
    COUNT(*) as product_count
  FROM products
  GROUP BY category
) category_stats
WHERE product_count > 10
ORDER BY avg_price DESC;

-- LATERAL join (Snowflake supports LATERAL)
SELECT
  c.customer_name,
  recent_orders.order_id,
  recent_orders.order_date,
  recent_orders.amount
FROM customers c,
LATERAL (
  SELECT order_id, order_date, amount
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY order_date DESC
  LIMIT 5
) recent_orders;

-- Subquery with table functions
SELECT
  c.customer_name,
  monthly_sales.month,
  monthly_sales.total_amount
FROM customers c,
LATERAL FLATTEN(
  INPUT => (
    SELECT ARRAY_AGG(OBJECT_CONSTRUCT('month', DATE_TRUNC('month', order_date), 'amount', amount))
    FROM orders o
    WHERE o.customer_id = c.customer_id
  )
) monthly_sales;

-- EXISTS
SELECT c.customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.order_date >= DATEADD(day, -90, CURRENT_DATE())
);

-- IN with subquery
SELECT product_name, category
FROM products
WHERE category IN (
  SELECT category_name
  FROM categories
  WHERE is_active = TRUE
);

-- Subquery in UPDATE
UPDATE products
SET price = price * 1.1
WHERE category IN (
  SELECT category_name
  FROM categories
  WHERE category_type = 'Premium'
);
```

**Performance Notes**:

- Snowflake automatically optimizes subqueries
- Query result caching applies to subqueries
- LATERAL joins are efficient for correlated logic
- Use query profile to analyze subquery performance
- Clustering keys help optimize subquery filters
  :::

::: details DuckDB
DuckDB has excellent subquery support with advanced optimization:

```sql
-- Scalar subquery
SELECT
  product_name,
  price,
  price - (SELECT AVG(price) FROM products) as diff_from_avg
FROM products;

-- Correlated subquery
SELECT
  e1.employee_name,
  e1.salary
FROM employees e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department = e1.department
);

-- Derived table with complex aggregation
SELECT
  category,
  avg_price,
  product_count,
  total_revenue
FROM (
  SELECT
    p.category,
    AVG(p.price) as avg_price,
    COUNT(DISTINCT p.product_id) as product_count,
    SUM(oi.quantity * oi.price) as total_revenue
  FROM products p
  LEFT JOIN order_items oi ON p.product_id = oi.product_id
  GROUP BY p.category
) category_stats
WHERE product_count > 5
ORDER BY total_revenue DESC;

-- EXISTS
SELECT c.customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.order_date >= CURRENT_DATE - INTERVAL 90 DAY
);

-- IN with subquery
SELECT product_name
FROM products
WHERE category IN (
  SELECT category_name
  FROM categories
  WHERE is_active = true
);

-- List/array aggregation subquery (DuckDB-specific)
SELECT
  category,
  LIST(product_name ORDER BY price DESC) FILTER (WHERE price > 100) as expensive_products
FROM products
GROUP BY category;

-- Lateral join
SELECT
  c.customer_name,
  recent.order_date,
  recent.amount
FROM customers c
CROSS JOIN LATERAL (
  SELECT order_date, amount
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY order_date DESC
  LIMIT 3
) recent;

-- Subquery with window functions
SELECT *
FROM (
  SELECT
    product_name,
    category,
    price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank
  FROM products
) ranked
WHERE price_rank <= 5;
```

**DuckDB Features**:

- Vectorized execution for fast subquery processing
- Advanced query optimization
- Efficient correlated subquery execution
- Full support for complex nested queries
- Use EXPLAIN to see query plan
  :::

## Best Practices

### 1. Use EXISTS Instead of IN for Large Datasets

```sql
-- ❌ Less efficient for large subquery results
SELECT customer_name
FROM customers
WHERE customer_id IN (
  SELECT customer_id FROM orders  -- Returns all IDs
);

-- ✅ More efficient: stops at first match
SELECT customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);
```

### 2. Avoid SELECT \* in Subqueries

```sql
-- ❌ Wasteful: retrieves unnecessary columns
SELECT customer_name
FROM (
  SELECT *
  FROM customers
  WHERE region = 'West'
) western_customers;

-- ✅ Efficient: select only needed columns
SELECT customer_name
FROM (
  SELECT customer_id, customer_name
  FROM customers
  WHERE region = 'West'
) western_customers;
```

### 3. Filter Early in Subqueries

```sql
-- ❌ Filters after aggregation
SELECT category, avg_price
FROM (
  SELECT category, AVG(price) as avg_price
  FROM products
  GROUP BY category
) cat_avg
WHERE category IN ('Electronics', 'Computers');

-- ✅ Filter before aggregation
SELECT category, AVG(price) as avg_price
FROM products
WHERE category IN ('Electronics', 'Computers')
GROUP BY category;
```

### 4. Consider CTEs for Readability

```sql
-- ❌ Hard to read nested subqueries
SELECT
  customer_name,
  total_spent
FROM (
  SELECT
    c.customer_name,
    (
      SELECT SUM(amount)
      FROM orders o
      WHERE o.customer_id = c.customer_id
        AND o.customer_id IN (
          SELECT customer_id
          FROM orders
          GROUP BY customer_id
          HAVING COUNT(*) > 5
        )
    ) as total_spent
  FROM customers c
) customer_totals
WHERE total_spent > 1000;

-- ✅ Clearer with CTEs
WITH active_customers AS (
  SELECT customer_id
  FROM orders
  GROUP BY customer_id
  HAVING COUNT(*) > 5
),
customer_totals AS (
  SELECT
    c.customer_name,
    SUM(o.amount) as total_spent
  FROM customers c
  JOIN orders o ON c.customer_id = o.customer_id
  WHERE c.customer_id IN (SELECT customer_id FROM active_customers)
  GROUP BY c.customer_name
)
SELECT *
FROM customer_totals
WHERE total_spent > 1000;
```

### 5. Use Appropriate Subquery Type

```sql
-- Scalar subquery: when you need a single value
SELECT
  product_name,
  price,
  (SELECT AVG(price) FROM products) as avg_price
FROM products;

-- EXISTS: for existence checks
SELECT customer_name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

-- IN: for membership in a set
SELECT product_name
FROM products
WHERE category IN ('Electronics', 'Computers', 'Phones');

-- Derived table: for complex transformations
SELECT category, avg_price
FROM (
  SELECT category, AVG(price) as avg_price
  FROM products
  GROUP BY category
) category_averages;
```

### 6. Be Careful with NULL Values

```sql
-- ❌ Problematic with NULLs
SELECT customer_name
FROM customers
WHERE customer_id NOT IN (
  SELECT customer_id FROM orders  -- If any NULL, returns no rows
);

-- ✅ Safe: filter NULLs
SELECT customer_name
FROM customers
WHERE customer_id NOT IN (
  SELECT customer_id FROM orders WHERE customer_id IS NOT NULL
);

-- ✅ Better: use NOT EXISTS
SELECT customer_name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);
```

## Common Pitfalls

### 1. NOT IN with NULL Values

```sql
-- ❌ Returns zero rows if subquery contains NULL
SELECT product_name
FROM products
WHERE product_id NOT IN (
  SELECT product_id FROM discontinued_products  -- May contain NULLs
);
-- If discontinued_products has any NULL product_id, this returns nothing!

-- ✅ Solution 1: Filter NULLs
SELECT product_name
FROM products
WHERE product_id NOT IN (
  SELECT product_id FROM discontinued_products WHERE product_id IS NOT NULL
);

-- ✅ Solution 2: Use NOT EXISTS
SELECT product_name
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM discontinued_products d WHERE d.product_id = p.product_id
);
```

### 2. Multiple Executions of Correlated Subqueries

```sql
-- ❌ Inefficient: subquery executes once per outer row
SELECT
  product_name,
  (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.product_id) as order_count,
  (SELECT SUM(quantity) FROM order_items oi WHERE oi.product_id = p.product_id) as total_qty
FROM products p;
-- Same table scanned twice per product!

-- ✅ Efficient: single JOIN with pre-aggregated data
SELECT
  p.product_name,
  COALESCE(agg.order_count, 0) as order_count,
  COALESCE(agg.total_qty, 0) as total_qty
FROM products p
LEFT JOIN (
  SELECT
    product_id,
    COUNT(*) as order_count,
    SUM(quantity) as total_qty
  FROM order_items
  GROUP BY product_id
) agg ON p.product_id = agg.product_id;
```

### 3. Scalar Subquery Returning Multiple Rows

```sql
-- ❌ Error: subquery returns more than one row
SELECT
  customer_name,
  (SELECT order_id FROM orders WHERE customer_id = c.customer_id) as order_id
FROM customers c;
-- ERROR if any customer has multiple orders

-- ✅ Solution 1: Ensure single row with aggregate
SELECT
  customer_name,
  (SELECT MAX(order_id) FROM orders WHERE customer_id = c.customer_id) as latest_order_id
FROM customers c;

-- ✅ Solution 2: Use derived table if multiple rows needed
SELECT
  c.customer_name,
  o.order_id,
  o.order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;
```

### 4. Missing Derived Table Alias

```sql
-- ❌ Syntax error: derived table needs alias
SELECT category, product_count
FROM (
  SELECT category, COUNT(*) as product_count
  FROM products
  GROUP BY category
);
-- ERROR: Every derived table must have its own alias

-- ✅ Correct: add alias
SELECT category, product_count
FROM (
  SELECT category, COUNT(*) as product_count
  FROM products
  GROUP BY category
) AS category_counts;
```

### 5. Inefficient Subquery in SELECT Clause

```sql
-- ❌ Inefficient: correlated subquery per row
SELECT
  c.customer_name,
  (SELECT COUNT(*) FROM orders WHERE customer_id = c.customer_id) as order_count,
  (SELECT SUM(amount) FROM orders WHERE customer_id = c.customer_id) as total_spent,
  (SELECT MAX(order_date) FROM orders WHERE customer_id = c.customer_id) as last_order
FROM customers c;
-- Three separate scans of orders table per customer!

-- ✅ Efficient: single aggregation
SELECT
  c.customer_name,
  COALESCE(o.order_count, 0) as order_count,
  COALESCE(o.total_spent, 0) as total_spent,
  o.last_order
FROM customers c
LEFT JOIN (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent,
    MAX(order_date) as last_order
  FROM orders
  GROUP BY customer_id
) o ON c.customer_id = o.customer_id;
```

### 6. Comparing with Aggregate Results Incorrectly

```sql
-- ❌ Wrong: trying to use aggregate in WHERE directly
SELECT product_name, category
FROM products
WHERE price > AVG(price);  -- ERROR: can't use aggregate in WHERE

-- ✅ Correct: use subquery
SELECT product_name, category
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- ❌ Wrong: correlated aggregate without proper grouping
SELECT
  category,
  product_name
FROM products p1
WHERE price = MAX(price);  -- ERROR

-- ✅ Correct: correlated subquery with proper scope
SELECT
  category,
  product_name,
  price
FROM products p1
WHERE price = (
  SELECT MAX(price)
  FROM products p2
  WHERE p2.category = p1.category
);
```

## Real-World Examples

### Customer Segmentation Analysis

```sql
-- Classify customers into segments based on purchase behavior
SELECT
  c.customer_id,
  c.customer_name,
  c.signup_date,
  CASE
    WHEN c.customer_id IN (
      SELECT customer_id
      FROM orders
      GROUP BY customer_id
      HAVING SUM(amount) > 10000
    ) THEN 'VIP'
    WHEN c.customer_id IN (
      SELECT customer_id
      FROM orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY customer_id
      HAVING COUNT(*) >= 3
    ) THEN 'Active'
    WHEN c.customer_id IN (
      SELECT customer_id
      FROM orders
      WHERE order_date < CURRENT_DATE - INTERVAL '180 days'
      GROUP BY customer_id
      HAVING MAX(order_date) < CURRENT_DATE - INTERVAL '180 days'
    ) THEN 'At Risk'
    WHEN EXISTS (
      SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
    ) THEN 'Regular'
    ELSE 'New'
  END as customer_segment,
  (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_id = c.customer_id
  ) as total_orders,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM orders o
    WHERE o.customer_id = c.customer_id
  ) as lifetime_value,
  (
    SELECT MAX(order_date)
    FROM orders o
    WHERE o.customer_id = c.customer_id
  ) as last_order_date
FROM customers c
ORDER BY lifetime_value DESC;
```

### Inventory Optimization

```sql
-- Find products that need reordering based on sales velocity
SELECT
  p.product_id,
  p.product_name,
  p.current_stock,
  p.reorder_point,
  sales_30day.units_sold as units_sold_last_30_days,
  sales_30day.units_sold / 30.0 as daily_sales_rate,
  CASE
    WHEN p.current_stock < p.reorder_point THEN 'URGENT: Reorder Now'
    WHEN p.current_stock < (sales_30day.units_sold / 30.0) * 14 THEN 'Reorder Soon'
    ELSE 'Stock OK'
  END as stock_status,
  GREATEST(
    p.reorder_point - p.current_stock +
    CEIL((sales_30day.units_sold / 30.0) * 7),  -- 1 week buffer
    0
  ) as suggested_order_quantity
FROM products p
LEFT JOIN (
  SELECT
    product_id,
    SUM(quantity) as units_sold
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.order_id
  WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND o.status = 'completed'
  GROUP BY product_id
) sales_30day ON p.product_id = sales_30day.product_id
WHERE
  p.is_active = true
  AND (
    p.current_stock < p.reorder_point
    OR p.current_stock < (
      SELECT AVG(current_stock) * 0.5
      FROM products
      WHERE category = p.category
    )
  )
ORDER BY
  CASE
    WHEN p.current_stock < p.reorder_point THEN 1
    WHEN p.current_stock < (sales_30day.units_sold / 30.0) * 14 THEN 2
    ELSE 3
  END,
  sales_30day.units_sold DESC;
```

### Employee Performance Ranking

```sql
-- Rank employees within departments and identify top performers
SELECT
  e.employee_id,
  e.employee_name,
  e.department,
  e.salary,
  (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department = e.department
  ) as dept_avg_salary,
  e.salary - (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department = e.department
  ) as salary_vs_dept_avg,
  (
    SELECT COUNT(*) + 1
    FROM employees e2
    WHERE e2.department = e.department
      AND e2.salary > e.salary
  ) as rank_in_department,
  CASE
    WHEN e.salary > (
      SELECT AVG(salary) * 1.2
      FROM employees e2
      WHERE e2.department = e.department
    ) THEN 'Top Performer'
    WHEN e.salary > (
      SELECT AVG(salary)
      FROM employees e2
      WHERE e2.department = e.department
    ) THEN 'Above Average'
    WHEN e.salary > (
      SELECT AVG(salary) * 0.8
      FROM employees e2
      WHERE e2.department = e.department
    ) THEN 'Average'
    ELSE 'Below Average'
  END as performance_category,
  EXISTS (
    SELECT 1
    FROM employees e2
    WHERE e2.manager_id = e.employee_id
  ) as is_manager
FROM employees e
WHERE e.is_active = true
ORDER BY e.department, rank_in_department;
```

### Product Recommendation Based on Purchase Patterns

```sql
-- Find products frequently bought together (market basket analysis)
SELECT
  p1.product_name as anchor_product,
  p2.product_name as recommended_product,
  pair_counts.times_bought_together,
  ROUND(
    100.0 * pair_counts.times_bought_together / (
      SELECT COUNT(DISTINCT order_id)
      FROM order_items oi
      WHERE oi.product_id = p1.product_id
    ),
    2
  ) as recommendation_confidence_pct
FROM (
  SELECT
    oi1.product_id as product_a,
    oi2.product_id as product_b,
    COUNT(DISTINCT oi1.order_id) as times_bought_together
  FROM order_items oi1
  JOIN order_items oi2
    ON oi1.order_id = oi2.order_id
    AND oi1.product_id < oi2.product_id  -- Avoid duplicates
  GROUP BY oi1.product_id, oi2.product_id
  HAVING COUNT(DISTINCT oi1.order_id) >= 10  -- Minimum support
) pair_counts
JOIN products p1 ON pair_counts.product_a = p1.product_id
JOIN products p2 ON pair_counts.product_b = p2.product_id
WHERE
  -- Only recommend if confidence is strong
  pair_counts.times_bought_together >= (
    SELECT COUNT(DISTINCT order_id) * 0.2
    FROM order_items oi
    WHERE oi.product_id = p1.product_id
  )
ORDER BY
  p1.product_name,
  pair_counts.times_bought_together DESC,
  recommendation_confidence_pct DESC;
```

### Revenue Attribution Analysis

```sql
-- Analyze revenue by customer acquisition channel
SELECT
  channel,
  customer_count,
  total_customers_in_channel,
  ROUND(100.0 * customer_count / total_customers_in_channel, 2) as pct_of_channel,
  avg_revenue_per_customer,
  total_revenue,
  ROUND(
    100.0 * total_revenue / (
      SELECT SUM(revenue)
      FROM (
        SELECT
          c.customer_id,
          COALESCE(SUM(o.amount), 0) as revenue
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        WHERE o.status = 'completed' OR o.order_id IS NULL
        GROUP BY c.customer_id
      ) all_revenue
    ),
    2
  ) as pct_of_total_revenue
FROM (
  SELECT
    c.acquisition_channel as channel,
    COUNT(*) as customer_count,
    (
      SELECT COUNT(*)
      FROM customers c2
      WHERE c2.acquisition_channel = c.acquisition_channel
    ) as total_customers_in_channel,
    AVG(customer_revenue.revenue) as avg_revenue_per_customer,
    SUM(customer_revenue.revenue) as total_revenue
  FROM customers c
  JOIN (
    SELECT
      customer_id,
      COALESCE(SUM(amount), 0) as revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id
  ) customer_revenue ON c.customer_id = customer_revenue.customer_id
  GROUP BY c.acquisition_channel
) channel_stats
ORDER BY total_revenue DESC;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [CTEs (Common Table Expressions)](/concepts/ctes/) - Alternative to complex subqueries
- [Joins](/concepts/joins/) - Combining data from multiple tables
- [Window Functions](/concepts/window-functions/) - Advanced analytical functions
- [Aggregations](/concepts/aggregations/) - Grouping and summarizing data
- [Performance Tuning](/concepts/performance/) - Optimizing query performance
