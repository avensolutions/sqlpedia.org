---
title: SQL Basics
description: Introduction to SQL fundamentals and core concepts
databases:
  - PostgreSQL
  - MySQL
  - SQL Server
  - Oracle
  - SQLite
difficulty: beginner
tags:
  - concepts
  - basics
  - fundamentals
  - select
  - insert
  - update
  - delete
  - create-table
  - alter-table
  - constraints
  - views
  - indexes
  - subqueries
  - joins
  - ddl
  - dml
---

# SQL Basics

<div class="difficulty-badge difficulty-beginner">Beginner</div>

## Quick Reference

```sql
-- Data Query Language (DQL)
SELECT column1, column2 FROM table_name WHERE condition;

-- Data Manipulation Language (DML)
INSERT INTO table_name (column1, column2) VALUES (value1, value2);
UPDATE table_name SET column1 = value1 WHERE condition;
DELETE FROM table_name WHERE condition;

-- Data Definition Language (DDL)
CREATE TABLE table_name (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(50);
DROP TABLE table_name;

-- Views
CREATE VIEW view_name AS SELECT column1, column2 FROM table_name;

-- Indexes
CREATE INDEX idx_name ON table_name(column_name);
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

## Subqueries

Subqueries are queries nested inside another query. They can be used in SELECT, FROM, WHERE, and HAVING clauses.

```sql
-- Subquery in WHERE clause
SELECT customer_name, email
FROM customers
WHERE customer_id IN (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE order_date >= '2024-01-01'
);

-- Subquery in SELECT clause
SELECT
  customer_name,
  (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customers.customer_id) as order_count
FROM customers;

-- Subquery in FROM clause (derived table)
SELECT avg_price_by_category.*
FROM (
  SELECT category, AVG(price) as avg_price
  FROM products
  GROUP BY category
) avg_price_by_category
WHERE avg_price > 100;

-- EXISTS operator
SELECT customer_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
  AND o.order_date >= '2024-01-01'
);

-- NOT EXISTS operator
SELECT customer_name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
);
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

For more details on joins, see the [Joins guide](/concepts/joins/).

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

| Category  | Type                       | Description            | Example               |
| --------- | -------------------------- | ---------------------- | --------------------- |
| Numeric   | INTEGER, INT               | Whole numbers          | 42                    |
| Numeric   | DECIMAL(p,s), NUMERIC(p,s) | Fixed precision        | 19.99                 |
| Numeric   | FLOAT, REAL                | Floating point         | 3.14159               |
| Text      | VARCHAR(n)                 | Variable length string | 'Hello'               |
| Text      | CHAR(n)                    | Fixed length string    | 'USA'                 |
| Text      | TEXT                       | Large text             | Long content          |
| Date/Time | DATE                       | Date only              | '2024-01-15'          |
| Date/Time | TIME                       | Time only              | '14:30:00'            |
| Date/Time | TIMESTAMP                  | Date and time          | '2024-01-15 14:30:00' |
| Boolean   | BOOLEAN                    | True/false             | TRUE                  |

## DDL: Creating and Modifying Tables

### CREATE TABLE

```sql
-- Basic table creation
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  country VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- With multiple constraints
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending',
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- With composite primary key
CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- CREATE TABLE AS SELECT (create from query)
CREATE TABLE customers_usa AS
SELECT * FROM customers
WHERE country = 'USA';
```

### ALTER TABLE

```sql
-- Add column
ALTER TABLE customers
ADD COLUMN phone VARCHAR(20);

-- Add column with default
ALTER TABLE customers
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Drop column
ALTER TABLE customers
DROP COLUMN phone;

-- Modify column (PostgreSQL)
ALTER TABLE customers
ALTER COLUMN email TYPE VARCHAR(150);

-- Modify column (MySQL)
ALTER TABLE customers
MODIFY COLUMN email VARCHAR(150);

-- Add constraint
ALTER TABLE customers
ADD CONSTRAINT unique_email UNIQUE (email);

-- Add foreign key
ALTER TABLE orders
ADD CONSTRAINT fk_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- Drop constraint
ALTER TABLE customers
DROP CONSTRAINT unique_email;

-- Rename table
ALTER TABLE customers
RENAME TO clients;

-- Rename column (PostgreSQL)
ALTER TABLE customers
RENAME COLUMN customer_name TO name;
```

### DROP TABLE

```sql
-- Drop single table
DROP TABLE temp_table;

-- Drop if exists (safe)
DROP TABLE IF EXISTS temp_table;

-- Drop multiple tables
DROP TABLE table1, table2, table3;

-- Drop with CASCADE (PostgreSQL) - removes dependent objects
DROP TABLE customers CASCADE;

-- Drop with RESTRICT (default) - fails if dependencies exist
DROP TABLE customers RESTRICT;
```

## Constraints

Constraints enforce rules on data in tables to maintain data integrity.

### PRIMARY KEY

Uniquely identifies each row in a table. Cannot be NULL.

```sql
-- Single column primary key
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name VARCHAR(100)
);

-- Named primary key constraint
CREATE TABLE customers (
  customer_id INTEGER,
  customer_name VARCHAR(100),
  CONSTRAINT pk_customers PRIMARY KEY (customer_id)
);

-- Composite primary key
CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  PRIMARY KEY (order_id, product_id)
);
```

### FOREIGN KEY

Links two tables together, enforcing referential integrity.

```sql
-- Foreign key constraint
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  order_date DATE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Named foreign key with actions
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  order_date DATE,
  CONSTRAINT fk_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(customer_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Referential actions:
-- CASCADE: Delete/update child rows when parent is deleted/updated
-- SET NULL: Set foreign key to NULL when parent is deleted/updated
-- SET DEFAULT: Set foreign key to default value
-- RESTRICT: Prevent deletion/update if child rows exist
-- NO ACTION: Similar to RESTRICT (default)
```

### UNIQUE

Ensures all values in a column are different.

```sql
-- Column-level unique constraint
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  customer_name VARCHAR(100)
);

-- Table-level unique constraint
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  email VARCHAR(100),
  customer_name VARCHAR(100),
  UNIQUE (email)
);

-- Composite unique constraint
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  username VARCHAR(50),
  domain VARCHAR(50),
  UNIQUE (username, domain)
);
```

### NOT NULL

Ensures a column cannot have NULL values.

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20)  -- Can be NULL
);
```

### CHECK

Ensures values in a column meet a specific condition.

```sql
-- Simple check constraint
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name VARCHAR(100),
  price DECIMAL(10, 2) CHECK (price > 0),
  stock_quantity INTEGER CHECK (stock_quantity >= 0)
);

-- Named check constraint
CREATE TABLE employees (
  employee_id INTEGER PRIMARY KEY,
  employee_name VARCHAR(100),
  age INTEGER,
  salary DECIMAL(10, 2),
  CONSTRAINT check_age CHECK (age >= 18 AND age <= 65),
  CONSTRAINT check_salary CHECK (salary > 0)
);

-- Check with multiple columns
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  order_date DATE,
  ship_date DATE,
  CHECK (ship_date >= order_date)
);
```

### DEFAULT

Provides a default value for a column when no value is specified.

```sql
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  order_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  discount_rate DECIMAL(3, 2) DEFAULT 0.00
);

-- Using default values
INSERT INTO orders (order_id, customer_id)
VALUES (1, 100);
-- order_date, status, created_at, and discount_rate will use defaults
```

## Views

Views are virtual tables based on the result of a SELECT query. They don't store data themselves but provide a way to simplify complex queries and control access to data.

### CREATE VIEW

```sql
-- Simple view
CREATE VIEW customer_orders AS
SELECT
  c.customer_id,
  c.customer_name,
  c.email,
  COUNT(o.order_id) as order_count,
  SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name, c.email;

-- Query the view
SELECT * FROM customer_orders
WHERE order_count > 5;

-- View with complex logic
CREATE VIEW high_value_customers AS
SELECT
  customer_id,
  customer_name,
  email,
  total_spent,
  CASE
    WHEN total_spent > 10000 THEN 'Platinum'
    WHEN total_spent > 5000 THEN 'Gold'
    WHEN total_spent > 1000 THEN 'Silver'
    ELSE 'Bronze'
  END as customer_tier
FROM customer_orders
WHERE total_spent > 0;

-- View with filters
CREATE VIEW active_usa_customers AS
SELECT customer_id, customer_name, email, phone
FROM customers
WHERE country = 'USA' AND is_active = TRUE;
```

### Using Views

```sql
-- Select from view (just like a table)
SELECT * FROM high_value_customers
WHERE customer_tier = 'Platinum';

-- Join with views
SELECT
  hvc.customer_name,
  hvc.customer_tier,
  o.order_date,
  o.total_amount
FROM high_value_customers hvc
INNER JOIN orders o ON hvc.customer_id = o.customer_id
WHERE o.order_date >= '2024-01-01';
```

### DROP VIEW

```sql
-- Drop view
DROP VIEW customer_orders;

-- Drop if exists
DROP VIEW IF EXISTS customer_orders;

-- Drop multiple views
DROP VIEW view1, view2, view3;
```

### CREATE OR REPLACE VIEW

```sql
-- Update view definition (PostgreSQL, MySQL, SQL Server)
CREATE OR REPLACE VIEW customer_orders AS
SELECT
  c.customer_id,
  c.customer_name,
  c.email,
  COUNT(o.order_id) as order_count,
  SUM(o.total_amount) as total_spent,
  AVG(o.total_amount) as avg_order_value
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name, c.email;
```

## Indexes

Indexes improve query performance by allowing the database to find data faster, but they slow down write operations and use additional storage.

### CREATE INDEX

```sql
-- Simple index on single column
CREATE INDEX idx_customers_email ON customers(email);

-- Index on multiple columns (composite index)
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Unique index (enforces uniqueness)
CREATE UNIQUE INDEX idx_unique_email ON customers(email);

-- Conditional index (PostgreSQL)
CREATE INDEX idx_active_customers ON customers(customer_id)
WHERE is_active = TRUE;

-- Index with DESC order
CREATE INDEX idx_orders_date_desc ON orders(order_date DESC);
```

### When to Use Indexes

```sql
-- ✅ Good candidates for indexes:
-- - Columns in WHERE clauses
SELECT * FROM customers WHERE email = 'john@example.com';

-- - Columns in JOIN conditions
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;

-- - Columns in ORDER BY
SELECT * FROM products ORDER BY price DESC;

-- - Foreign key columns
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- ❌ Avoid indexes on:
-- - Small tables (full scan is faster)
-- - Columns with low cardinality (few unique values)
-- - Columns that are frequently updated
-- - Columns rarely used in queries
```

### DROP INDEX

```sql
-- Drop index (PostgreSQL, Oracle)
DROP INDEX idx_customers_email;

-- Drop index (MySQL, SQL Server)
DROP INDEX idx_customers_email ON customers;

-- Drop if exists
DROP INDEX IF EXISTS idx_customers_email;
```

For more details on indexes and performance optimization, see the [Indexes guide](/concepts/indexes/).

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
