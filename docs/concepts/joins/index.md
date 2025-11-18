---
title: SQL Joins
description: Comprehensive guide to joining tables in SQL
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite]
difficulty: beginner
tags: [joins, inner-join, left-join, right-join, full-outer-join]
---

# SQL Joins

<div class="difficulty-badge difficulty-beginner">Beginner</div>

## Quick Reference

```sql
-- INNER JOIN: Only matching rows
SELECT a.*, b.*
FROM table_a a
INNER JOIN table_b b ON a.id = b.a_id;

-- LEFT JOIN: All from left, matching from right
SELECT a.*, b.*
FROM table_a a
LEFT JOIN table_b b ON a.id = b.a_id;

-- RIGHT JOIN: All from right, matching from left
SELECT a.*, b.*
FROM table_a a
RIGHT JOIN table_b b ON a.id = b.a_id;

-- FULL OUTER JOIN: All rows from both tables
SELECT a.*, b.*
FROM table_a a
FULL OUTER JOIN table_b b ON a.id = b.a_id;
```

## Overview

Joins are used to combine rows from two or more tables based on a related column between them. Understanding joins is fundamental to working with relational databases effectively.

## Types of Joins

### INNER JOIN

Returns only rows where there is a match in both tables.

```sql
SELECT
  customers.customer_name,
  orders.order_id,
  orders.order_date
FROM customers
INNER JOIN orders ON customers.customer_id = orders.customer_id;
```

### LEFT JOIN (LEFT OUTER JOIN)

Returns all rows from the left table, and matching rows from the right table. NULL for non-matching rows.

```sql
SELECT
  customers.customer_name,
  orders.order_id
FROM customers
LEFT JOIN orders ON customers.customer_id = orders.customer_id;
```

### RIGHT JOIN (RIGHT OUTER JOIN)

Returns all rows from the right table, and matching rows from the left table.

```sql
SELECT
  customers.customer_name,
  orders.order_id
FROM customers
RIGHT JOIN orders ON customers.customer_id = orders.customer_id;
```

### FULL OUTER JOIN

Returns all rows when there is a match in either table.

```sql
SELECT
  customers.customer_name,
  orders.order_id
FROM customers
FULL OUTER JOIN orders ON customers.customer_id = orders.customer_id;
```

### CROSS JOIN

Returns the Cartesian product of both tables (all possible combinations).

```sql
SELECT
  colors.color_name,
  sizes.size_name
FROM colors
CROSS JOIN sizes;
```

### SELF JOIN

A table joined with itself.

```sql
-- Find employees and their managers
SELECT
  e.employee_name as employee,
  m.employee_name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

## Examples

### Basic Example: Customers and Orders

```sql
-- Find all customers with their orders
SELECT
  c.customer_id,
  c.customer_name,
  o.order_id,
  o.order_date,
  o.total_amount
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
ORDER BY c.customer_name, o.order_date;
```

### Advanced Example: Multiple Joins

```sql
-- Get customer orders with order items and product details
SELECT
  c.customer_name,
  o.order_id,
  o.order_date,
  p.product_name,
  oi.quantity,
  oi.price,
  (oi.quantity * oi.price) as line_total
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= '2024-01-01'
ORDER BY c.customer_name, o.order_date, p.product_name;
```

## Platform-Specific Notes

::: details MySQL
MySQL does not support FULL OUTER JOIN directly. Use UNION instead:

```sql
-- Emulate FULL OUTER JOIN
SELECT * FROM table_a a LEFT JOIN table_b b ON a.id = b.a_id
UNION
SELECT * FROM table_a a RIGHT JOIN table_b b ON a.id = b.a_id;
```
:::

::: details SQLite
SQLite does not support RIGHT JOIN or FULL OUTER JOIN. Use LEFT JOIN with table order reversed:

```sql
-- Emulate RIGHT JOIN
SELECT * FROM table_b b
LEFT JOIN table_a a ON b.a_id = a.id;
```
:::

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Subqueries](/concepts/subqueries/)
- [CTEs](/concepts/ctes/)
- [Window Functions](/concepts/window-functions/)

---

**Note**: This is a stub page. Full content coming soon. Contributions welcome!
