---
title: SQL Basics
description: Introduction to SQL fundamentals and core concepts
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite]
difficulty: beginner
tags: [fundamentals, select, insert, update, delete]
---

# SQL Basics

<div class="difficulty-badge difficulty-beginner">Beginner</div>

## Quick Reference

```sql
-- Core SQL operations
SELECT column1, column2 FROM table_name WHERE condition;
INSERT INTO table_name (column1, column2) VALUES (value1, value2);
UPDATE table_name SET column1 = value1 WHERE condition;
DELETE FROM table_name WHERE condition;
```

## Overview

SQL (Structured Query Language) is the standard language for working with relational databases. It allows you to query, insert, update, and delete data, as well as create and modify database structures.

SQL is divided into several categories:
- **DQL (Data Query Language)**: SELECT statements for retrieving data
- **DML (Data Manipulation Language)**: INSERT, UPDATE, DELETE for modifying data
- **DDL (Data Definition Language)**: CREATE, ALTER, DROP for database structure
- **DCL (Data Control Language)**: GRANT, REVOKE for permissions
- **TCL (Transaction Control Language)**: COMMIT, ROLLBACK for transactions

## SELECT: Querying Data

### Basic SELECT

```sql
-- Select all columns
SELECT * FROM customers;

-- Select specific columns
SELECT customer_name, email, country FROM customers;

-- Select with alias
SELECT
  customer_name AS name,
  email AS contact_email
FROM customers;
```

### Filtering with WHERE

```sql
-- Single condition
SELECT * FROM customers WHERE country = 'USA';

-- Multiple conditions with AND
SELECT * FROM customers
WHERE country = 'USA' AND city = 'New York';

-- Multiple conditions with OR
SELECT * FROM customers
WHERE country = 'USA' OR country = 'Canada';

-- IN operator
SELECT * FROM customers
WHERE country IN ('USA', 'Canada', 'Mexico');

-- LIKE operator for pattern matching
SELECT * FROM customers
WHERE customer_name LIKE 'A%';  -- Names starting with 'A'

-- BETWEEN operator
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
```

### Sorting with ORDER BY

```sql
-- Sort ascending (default)
SELECT * FROM customers ORDER BY customer_name;

-- Sort descending
SELECT * FROM customers ORDER BY customer_name DESC;

-- Sort by multiple columns
SELECT * FROM customers
ORDER BY country ASC, customer_name DESC;
```

### Limiting Results

```sql
-- PostgreSQL, MySQL, SQLite
SELECT * FROM customers LIMIT 10;

-- SQL Server
SELECT TOP 10 * FROM customers;

-- Oracle
SELECT * FROM customers WHERE ROWNUM <= 10;

-- Standard SQL (SQL:2008)
SELECT * FROM customers FETCH FIRST 10 ROWS ONLY;
```

## INSERT: Adding Data

```sql
-- Insert single row
INSERT INTO customers (customer_name, email, country)
VALUES ('John Doe', 'john@example.com', 'USA');

-- Insert multiple rows
INSERT INTO customers (customer_name, email, country)
VALUES
  ('Jane Smith', 'jane@example.com', 'Canada'),
  ('Bob Johnson', 'bob@example.com', 'USA'),
  ('Alice Brown', 'alice@example.com', 'UK');

-- Insert from SELECT
INSERT INTO customers_backup
SELECT * FROM customers WHERE country = 'USA';
```

## UPDATE: Modifying Data

```sql
-- Update single column
UPDATE customers
SET email = 'newemail@example.com'
WHERE customer_id = 1;

-- Update multiple columns
UPDATE customers
SET
  email = 'updated@example.com',
  country = 'Canada'
WHERE customer_id = 1;

-- Update with calculation
UPDATE products
SET price = price * 1.1
WHERE category = 'Electronics';

-- Update all rows (use with caution!)
UPDATE customers SET status = 'active';
```

## DELETE: Removing Data

```sql
-- Delete specific rows
DELETE FROM customers WHERE country = 'USA';

-- Delete with multiple conditions
DELETE FROM orders
WHERE order_date < '2020-01-01' AND status = 'cancelled';

-- Delete all rows (use with extreme caution!)
DELETE FROM temp_table;

-- Safer alternative: TRUNCATE (faster, but can't be rolled back in some databases)
TRUNCATE TABLE temp_table;
```

## Aggregate Functions

```sql
-- Count rows
SELECT COUNT(*) FROM customers;

-- Count non-NULL values
SELECT COUNT(email) FROM customers;

-- Sum
SELECT SUM(amount) FROM orders;

-- Average
SELECT AVG(price) FROM products;

-- Min and Max
SELECT MIN(price), MAX(price) FROM products;

-- Multiple aggregates
SELECT
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value,
  MIN(amount) as min_order,
  MAX(amount) as max_order
FROM orders;
```

## GROUP BY: Grouping Data

```sql
-- Group by single column
SELECT country, COUNT(*) as customer_count
FROM customers
GROUP BY country;

-- Group by multiple columns
SELECT country, city, COUNT(*) as count
FROM customers
GROUP BY country, city;

-- Group with aggregate functions
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM products
GROUP BY category;

-- HAVING: Filter grouped results
SELECT country, COUNT(*) as customer_count
FROM customers
GROUP BY country
HAVING COUNT(*) > 10;
```

## JOIN: Combining Tables

```sql
-- INNER JOIN: Only matching rows
SELECT
  customers.customer_name,
  orders.order_id,
  orders.order_date
FROM customers
INNER JOIN orders ON customers.customer_id = orders.customer_id;

-- LEFT JOIN: All rows from left table
SELECT
  customers.customer_name,
  orders.order_id
FROM customers
LEFT JOIN orders ON customers.customer_id = orders.customer_id;

-- RIGHT JOIN: All rows from right table
SELECT
  customers.customer_name,
  orders.order_id
FROM customers
RIGHT JOIN orders ON customers.customer_id = orders.customer_id;

-- FULL OUTER JOIN: All rows from both tables
SELECT
  customers.customer_name,
  orders.order_id
FROM customers
FULL OUTER JOIN orders ON customers.customer_id = orders.customer_id;
```

## Platform-Specific Notes

::: details PostgreSQL
PostgreSQL follows SQL standards closely and adds many advanced features:
- Full support for all standard SQL operations
- Case-sensitive identifiers with double quotes
- Rich set of data types (arrays, JSON, UUID, etc.)
- Powerful full-text search
- Advanced indexing options

```sql
-- PostgreSQL-specific: RETURNING clause
INSERT INTO customers (customer_name, email)
VALUES ('John Doe', 'john@example.com')
RETURNING customer_id, created_at;
```
:::

::: details MySQL
MySQL is widely used for web applications:
- Case-insensitive by default (depends on configuration)
- Backticks for identifiers
- Different storage engines (InnoDB, MyISAM)
- AUTO_INCREMENT for primary keys

```sql
-- MySQL-specific: AUTO_INCREMENT
CREATE TABLE customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100),
  email VARCHAR(100)
);
```
:::

::: details SQL Server
SQL Server (Microsoft) is popular in enterprise environments:
- Square brackets for identifiers
- IDENTITY for auto-increment
- Rich T-SQL extensions
- Strong integration with Microsoft ecosystem

```sql
-- SQL Server-specific: IDENTITY
CREATE TABLE customers (
  customer_id INT IDENTITY(1,1) PRIMARY KEY,
  customer_name VARCHAR(100),
  email VARCHAR(100)
);
```
:::

## Data Types

### Common Data Types Across Platforms

| Category | Type | Description | Example |
|----------|------|-------------|---------|
| Numeric | INTEGER, INT | Whole numbers | 42 |
| Numeric | DECIMAL(p,s), NUMERIC(p,s) | Fixed precision | 19.99 |
| Numeric | FLOAT, REAL | Floating point | 3.14159 |
| Text | VARCHAR(n) | Variable length string | 'Hello' |
| Text | CHAR(n) | Fixed length string | 'USA' |
| Text | TEXT | Large text | Long content |
| Date/Time | DATE | Date only | '2024-01-15' |
| Date/Time | TIME | Time only | '14:30:00' |
| Date/Time | TIMESTAMP | Date and time | '2024-01-15 14:30:00' |
| Boolean | BOOLEAN | True/false | TRUE |

## Best Practices

### 1. Always Use WHERE with UPDATE/DELETE

```sql
-- ❌ Dangerous: Updates all rows
UPDATE customers SET country = 'USA';

-- ✅ Safe: Updates specific rows
UPDATE customers SET country = 'USA' WHERE customer_id = 1;
```

### 2. Use Meaningful Aliases

```sql
-- ❌ Unclear
SELECT c.n, c.e FROM customers c;

-- ✅ Clear
SELECT
  c.customer_name,
  c.email
FROM customers c;
```

### 3. Explicitly List Columns

```sql
-- ❌ Fragile: Breaks if table structure changes
INSERT INTO customers VALUES (1, 'John', 'john@example.com');

-- ✅ Robust: Explicit column list
INSERT INTO customers (customer_id, customer_name, email)
VALUES (1, 'John', 'john@example.com');
```

### 4. Use Transactions for Multiple Operations

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

COMMIT;
-- Or ROLLBACK; if there's an error
```

## Common Pitfalls

### 1. NULL Handling

```sql
-- ❌ This doesn't work with NULL
SELECT * FROM customers WHERE email = NULL;

-- ✅ Use IS NULL
SELECT * FROM customers WHERE email IS NULL;

-- ✅ Use IS NOT NULL
SELECT * FROM customers WHERE email IS NOT NULL;
```

### 2. String Comparison

```sql
-- ❌ Case-sensitive in some databases
SELECT * FROM customers WHERE country = 'usa';

-- ✅ Explicit case handling
SELECT * FROM customers WHERE LOWER(country) = 'usa';
-- Or use UPPER, or ensure consistent case in data
```

### 3. Date Formatting

```sql
-- ❌ Database-specific format
SELECT * FROM orders WHERE order_date = '01/15/2024';

-- ✅ ISO format (YYYY-MM-DD) works everywhere
SELECT * FROM orders WHERE order_date = '2024-01-15';
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Joins](/concepts/joins/) - Detailed guide to joining tables
- [Aggregations](/concepts/aggregations/) - Advanced aggregation techniques
- [Subqueries](/concepts/subqueries/) - Using queries within queries
- [Indexes](/concepts/indexes/) - Improving query performance
