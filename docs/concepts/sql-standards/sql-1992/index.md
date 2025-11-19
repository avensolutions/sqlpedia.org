---
title: SQL-92 (SQL:1992)
description: Comprehensive guide to the SQL-92 standard, the first widely-adopted SQL standard that established the foundation for modern relational databases
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, Snowflake, BigQuery, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [sql-92, sql-1992, ansi, iso, standard, joins, subqueries, constraints, transactions]
---

# SQL-92 (SQL:1992)

<div class="difficulty-badge intermediate">Intermediate</div>

## Overview

SQL-92, formally known as ISO/IEC 9075:1992, was published in 1992 and represents the first major, widely-adopted SQL standard. It significantly expanded upon the earlier SQL-89 standard and established the foundation for modern relational database systems.

SQL-92 introduced critical features that remain essential today:
- Standardized JOIN syntax
- Comprehensive constraint definitions
- Transaction control
- Enhanced data types
- Subquery capabilities
- Schema manipulation

Virtually all modern relational databases support SQL-92 Entry level as a minimum, making it the most portable SQL dialect.

## Historical Context

### Timeline
- **1986**: SQL-86 (First ANSI SQL standard, very basic)
- **1989**: SQL-89 (Minor revision with integrity enhancements)
- **1992**: SQL-92 (Major expansion, ~600 pages)
- **1999**: SQL-99 (Next major revision)

### Impact
SQL-92 was transformative because it:
- Established a common language across database vendors
- Enabled database portability
- Provided three conformance levels (Entry, Intermediate, Full)
- Became the baseline for database procurement in enterprise and government

## Conformance Levels

SQL-92 defined three levels of compliance:

### Entry SQL-92
- Minimal required features
- Closest to SQL-89
- Most widely implemented
- Baseline for interoperability

### Intermediate SQL-92
- Moderate feature set
- Added domain support
- Enhanced schema manipulation
- Partially implemented by major vendors

### Full SQL-92
- Complete standard
- Fully implemented by few vendors
- Some features proved impractical
- Basis for future enhancements

**Most databases today support Entry SQL-92 completely and many Intermediate/Full features selectively.**

## Core Features

### Data Definition Language (DDL)

#### CREATE TABLE

```sql
-- Basic table creation
CREATE TABLE employees (
    employee_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    hire_date DATE,
    salary DECIMAL(10, 2),
    department_id INTEGER,
    PRIMARY KEY (employee_id)
);

-- Table with constraints
CREATE TABLE departments (
    department_id INTEGER NOT NULL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100),
    manager_id INTEGER,
    CONSTRAINT fk_manager
        FOREIGN KEY (manager_id)
        REFERENCES employees(employee_id)
);

-- CHECK constraints
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2),
    quantity INTEGER,
    CONSTRAINT positive_price CHECK (price > 0),
    CONSTRAINT valid_quantity CHECK (quantity >= 0)
);
```

#### ALTER TABLE

```sql
-- Add column
ALTER TABLE employees
ADD COLUMN email VARCHAR(100);

-- Add constraint
ALTER TABLE employees
ADD CONSTRAINT fk_department
    FOREIGN KEY (department_id)
    REFERENCES departments(department_id);

-- Drop column
ALTER TABLE employees
DROP COLUMN email;

-- Drop constraint
ALTER TABLE employees
DROP CONSTRAINT fk_department;
```

#### CREATE VIEW

```sql
-- Simple view
CREATE VIEW active_employees AS
SELECT employee_id, first_name, last_name, department_id
FROM employees
WHERE hire_date >= DATE '2020-01-01';

-- View with joins
CREATE VIEW employee_departments AS
SELECT
    e.employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    d.department_name,
    d.location
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;
```

#### CREATE INDEX

```sql
-- Single column index
CREATE INDEX idx_employee_last_name
ON employees(last_name);

-- Multi-column index
CREATE INDEX idx_employee_dept_salary
ON employees(department_id, salary);

-- Unique index
CREATE UNIQUE INDEX idx_employee_email
ON employees(email);
```

### Data Types

SQL-92 standardized essential data types:

#### Numeric Types

```sql
-- Exact numeric types
INTEGER         -- Whole numbers (typically 32-bit)
SMALLINT        -- Small integers (typically 16-bit)
NUMERIC(p, s)   -- Exact precision/scale
DECIMAL(p, s)   -- Same as NUMERIC

-- Approximate numeric types
REAL            -- Single-precision floating point
DOUBLE PRECISION -- Double-precision floating point
FLOAT(p)        -- Floating point with precision
```

#### Character Types

```sql
-- Fixed-length
CHAR(n)         -- Fixed-length string, space-padded
CHARACTER(n)    -- Same as CHAR

-- Variable-length
VARCHAR(n)      -- Variable-length string
CHARACTER VARYING(n) -- Same as VARCHAR
```

#### Date/Time Types

```sql
DATE            -- Year, month, day
TIME            -- Hour, minute, second
TIMESTAMP       -- Date and time combined

-- Example usage
CREATE TABLE events (
    event_id INTEGER PRIMARY KEY,
    event_name VARCHAR(100),
    event_date DATE,
    start_time TIME,
    created_at TIMESTAMP
);

-- Inserting date/time values
INSERT INTO events VALUES (
    1,
    'Product Launch',
    DATE '2024-06-15',
    TIME '09:00:00',
    TIMESTAMP '2024-01-10 14:30:00'
);
```

#### Other Types

```sql
BIT(n)          -- Fixed-length bit string
BIT VARYING(n)  -- Variable-length bit string
```

### Data Manipulation Language (DML)

#### SELECT Statements

```sql
-- Basic SELECT
SELECT first_name, last_name, salary
FROM employees
WHERE salary > 50000
ORDER BY last_name, first_name;

-- SELECT with DISTINCT
SELECT DISTINCT department_id
FROM employees;

-- SELECT with aggregate functions
SELECT
    department_id,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS total_payroll
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;

-- All rows
SELECT * FROM departments;

-- Computed columns
SELECT
    first_name,
    last_name,
    salary,
    salary * 0.15 AS tax_amount,
    salary * 0.85 AS net_salary
FROM employees;
```

#### JOIN Operations

SQL-92 introduced explicit JOIN syntax, a major improvement over implicit joins:

```sql
-- INNER JOIN
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- LEFT OUTER JOIN
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
LEFT OUTER JOIN departments d ON e.department_id = d.department_id;

-- RIGHT OUTER JOIN
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
RIGHT OUTER JOIN departments d ON e.department_id = d.department_id;

-- FULL OUTER JOIN
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.department_id;

-- CROSS JOIN (Cartesian product)
SELECT e.first_name, d.department_name
FROM employees e
CROSS JOIN departments d;

-- Multiple joins
SELECT
    e.first_name,
    e.last_name,
    d.department_name,
    p.project_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
INNER JOIN employee_projects ep ON e.employee_id = ep.employee_id
INNER JOIN projects p ON ep.project_id = p.project_id;

-- Self join
SELECT
    e.first_name || ' ' || e.last_name AS employee,
    m.first_name || ' ' || m.last_name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

#### INSERT Statements

```sql
-- Single row insert
INSERT INTO employees (employee_id, first_name, last_name, hire_date, salary)
VALUES (101, 'John', 'Doe', DATE '2024-01-15', 75000.00);

-- Multi-column insert
INSERT INTO departments
VALUES (10, 'Engineering', 'Building A', 501);

-- Insert specific columns
INSERT INTO employees (employee_id, first_name, last_name)
VALUES (102, 'Jane', 'Smith');

-- Insert from SELECT
INSERT INTO archived_employees
SELECT * FROM employees
WHERE hire_date < DATE '2010-01-01';
```

#### UPDATE Statements

```sql
-- Update single row
UPDATE employees
SET salary = 80000.00
WHERE employee_id = 101;

-- Update multiple columns
UPDATE employees
SET salary = salary * 1.05,
    last_modified = CURRENT_TIMESTAMP
WHERE department_id = 10;

-- Update with subquery
UPDATE employees
SET salary = (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = employees.department_id
)
WHERE salary < 50000;

-- Update all rows
UPDATE products
SET discontinued = 1;
```

#### DELETE Statements

```sql
-- Delete specific rows
DELETE FROM employees
WHERE employee_id = 101;

-- Delete with condition
DELETE FROM employees
WHERE hire_date < DATE '2000-01-01';

-- Delete all rows
DELETE FROM temp_data;

-- Delete with subquery
DELETE FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM departments
    WHERE location = 'Closed'
);
```

### Subqueries

SQL-92 provided robust subquery support:

#### Scalar Subqueries

```sql
-- Subquery returning single value
SELECT first_name, last_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- In SELECT clause
SELECT
    first_name,
    last_name,
    salary,
    (SELECT AVG(salary) FROM employees) AS company_avg,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;
```

#### IN Subqueries

```sql
-- Check membership
SELECT first_name, last_name
FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM departments
    WHERE location = 'New York'
);

-- NOT IN
SELECT product_name
FROM products
WHERE product_id NOT IN (
    SELECT DISTINCT product_id
    FROM orders
);
```

#### EXISTS Subqueries

```sql
-- Existence check
SELECT d.department_name
FROM departments d
WHERE EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);

-- NOT EXISTS
SELECT d.department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);
```

#### Comparison Subqueries

```sql
-- ANY/SOME
SELECT first_name, last_name, salary
FROM employees
WHERE salary > ANY (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);

-- ALL
SELECT first_name, last_name, salary
FROM employees
WHERE salary > ALL (
    SELECT salary
    FROM employees
    WHERE department_id = 20
);
```

### Constraints

SQL-92 formalized constraint definitions:

#### Primary Keys

```sql
-- Column constraint
CREATE TABLE departments (
    department_id INTEGER PRIMARY KEY,
    department_name VARCHAR(100)
);

-- Table constraint
CREATE TABLE employees (
    employee_id INTEGER,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    PRIMARY KEY (employee_id)
);

-- Composite primary key
CREATE TABLE employee_projects (
    employee_id INTEGER,
    project_id INTEGER,
    role VARCHAR(50),
    PRIMARY KEY (employee_id, project_id)
);
```

#### Foreign Keys

```sql
-- Basic foreign key
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    department_id INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Named constraint
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
);

-- Referential actions
CREATE TABLE order_items (
    item_id INTEGER PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    CONSTRAINT fk_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

#### UNIQUE Constraints

```sql
-- Column constraint
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE
);

-- Table constraint
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    ssn VARCHAR(11),
    email VARCHAR(100),
    CONSTRAINT unique_ssn UNIQUE (ssn),
    CONSTRAINT unique_email UNIQUE (email)
);
```

#### CHECK Constraints

```sql
-- Column constraint
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    salary DECIMAL(10, 2) CHECK (salary > 0),
    age INTEGER CHECK (age >= 18)
);

-- Table constraint
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    price DECIMAL(10, 2),
    discount_price DECIMAL(10, 2),
    CONSTRAINT valid_prices
        CHECK (discount_price < price AND price > 0)
);

-- Multiple conditions
CREATE TABLE appointments (
    appointment_id INTEGER PRIMARY KEY,
    start_time TIME,
    end_time TIME,
    CHECK (end_time > start_time)
);
```

#### NOT NULL Constraints

```sql
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20)  -- Nullable
);
```

### Transaction Control

SQL-92 standardized transaction management:

```sql
-- Begin transaction (implicit in most databases)
BEGIN;

-- Make changes
INSERT INTO accounts (account_id, balance) VALUES (1, 1000);
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

-- Commit transaction
COMMIT;

-- Or rollback
ROLLBACK;

-- Transaction isolation (conceptual)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### Aggregate Functions

```sql
-- COUNT
SELECT COUNT(*) FROM employees;
SELECT COUNT(DISTINCT department_id) FROM employees;

-- SUM
SELECT SUM(salary) FROM employees;

-- AVG
SELECT AVG(salary) FROM employees;

-- MIN/MAX
SELECT MIN(salary), MAX(salary) FROM employees;

-- GROUP BY
SELECT
    department_id,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id;

-- HAVING clause
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 60000;
```

### Set Operations

```sql
-- UNION (removes duplicates)
SELECT employee_id, first_name FROM employees
UNION
SELECT manager_id, first_name FROM departments;

-- UNION ALL (keeps duplicates)
SELECT customer_id FROM orders_2023
UNION ALL
SELECT customer_id FROM orders_2024;

-- INTERSECT
SELECT employee_id FROM sales_team
INTERSECT
SELECT employee_id FROM engineering_team;

-- EXCEPT (SQL-92) / MINUS (Oracle)
SELECT employee_id FROM all_employees
EXCEPT
SELECT employee_id FROM terminated_employees;
```

### String Operations

```sql
-- Concatenation
SELECT first_name || ' ' || last_name AS full_name
FROM employees;

-- LIKE pattern matching
SELECT * FROM employees
WHERE last_name LIKE 'S%';  -- Starts with S

SELECT * FROM products
WHERE product_name LIKE '%phone%';  -- Contains 'phone'

SELECT * FROM customers
WHERE email LIKE '%@gmail.com';  -- Ends with @gmail.com

-- Wildcards
-- % matches any sequence of characters
-- _ matches any single character

SELECT * FROM products
WHERE product_code LIKE 'A_B%';

-- UPPER/LOWER
SELECT UPPER(first_name), LOWER(last_name)
FROM employees;

-- SUBSTRING
SELECT SUBSTRING(product_code FROM 1 FOR 3) AS prefix
FROM products;

-- TRIM
SELECT TRIM('  hello  ') AS trimmed;
SELECT TRIM(LEADING ' ' FROM '  hello') AS left_trimmed;
SELECT TRIM(TRAILING ' ' FROM 'hello  ') AS right_trimmed;
```

### NULL Handling

```sql
-- IS NULL
SELECT * FROM employees
WHERE manager_id IS NULL;

-- IS NOT NULL
SELECT * FROM employees
WHERE email IS NOT NULL;

-- COALESCE (introduced in SQL-92)
SELECT
    first_name,
    last_name,
    COALESCE(middle_name, '') AS middle_name,
    COALESCE(phone, email, 'No contact') AS contact
FROM employees;

-- NULLIF
SELECT
    product_name,
    NULLIF(discount_price, 0) AS discount
FROM products;
```

## Database-Specific Implementation

### PostgreSQL
- **Compliance**: Excellent SQL-92 support
- **Notes**: Implements most Full SQL-92 features
- **Extensions**: Adds array types, JSON, full-text search

```sql
-- PostgreSQL serial (non-standard)
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50)
);
```

### MySQL
- **Compliance**: Good Entry SQL-92, partial Intermediate
- **Notes**: Some deviations in behavior (e.g., GROUP BY handling)
- **Extensions**: AUTO_INCREMENT, non-standard string quoting

```sql
-- MySQL auto_increment
CREATE TABLE employees (
    employee_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50)
);
```

### SQL Server
- **Compliance**: Strong SQL-92 Entry, good Intermediate/Full
- **Notes**: T-SQL adds significant extensions
- **Extensions**: IDENTITY columns, proprietary functions

```sql
-- SQL Server IDENTITY
CREATE TABLE employees (
    employee_id INTEGER IDENTITY(1,1) PRIMARY KEY,
    first_name VARCHAR(50)
);
```

### Oracle
- **Compliance**: Very strong SQL-92 support
- **Notes**: One of the first to implement extensively
- **Extensions**: ROWNUM, CONNECT BY, Oracle-specific types

```sql
-- Oracle sequence (SQL-92 doesn't specify auto-increment)
CREATE SEQUENCE emp_seq START WITH 1;

CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    first_name VARCHAR2(50)
);

INSERT INTO employees VALUES (emp_seq.NEXTVAL, 'John');
```

### SQLite
- **Compliance**: Good core SQL-92 support
- **Notes**: Some features omitted (RIGHT/FULL JOIN, some constraints)
- **Extensions**: Dynamic typing, AUTOINCREMENT

```sql
-- SQLite autoincrement
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT
);
```

## Common Patterns

### Master-Detail Queries

```sql
-- Orders with items
SELECT
    o.order_id,
    o.order_date,
    o.customer_id,
    oi.product_id,
    oi.quantity,
    oi.price
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.order_date >= DATE '2024-01-01'
ORDER BY o.order_id, oi.item_id;
```

### Aggregation with Grouping

```sql
-- Department statistics
SELECT
    d.department_name,
    COUNT(e.employee_id) AS employee_count,
    AVG(e.salary) AS avg_salary,
    MIN(e.hire_date) AS earliest_hire,
    MAX(e.salary) AS highest_salary
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name
HAVING COUNT(e.employee_id) > 0
ORDER BY employee_count DESC;
```

### Conditional Logic

```sql
-- Salary categorization (requires CASE from SQL-92)
-- Note: CASE was actually introduced in SQL-92
SELECT
    first_name,
    last_name,
    salary,
    CASE
        WHEN salary < 40000 THEN 'Entry Level'
        WHEN salary < 70000 THEN 'Mid Level'
        WHEN salary < 100000 THEN 'Senior'
        ELSE 'Executive'
    END AS salary_grade
FROM employees;
```

## Best Practices

### Use Explicit JOINs
```sql
-- Good: SQL-92 explicit JOIN
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Avoid: Implicit join (SQL-89 style)
SELECT e.name, d.department_name
FROM employees e, departments d
WHERE e.department_id = d.department_id;
```

### Qualify Column Names
```sql
-- Always prefix columns with table aliases
SELECT
    e.employee_id,
    e.first_name,
    d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;
```

### Use Constraints
```sql
-- Define constraints at creation time
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
```

### Handle NULLs Explicitly
```sql
-- Be explicit about NULL handling
SELECT first_name, last_name
FROM employees
WHERE commission IS NOT NULL
   OR base_salary > 50000;
```

## Common Pitfalls

### NULL Comparisons
```sql
-- Wrong: NULL = NULL is not true
SELECT * FROM employees
WHERE manager_id = NULL;  -- Returns no rows

-- Correct: Use IS NULL
SELECT * FROM employees
WHERE manager_id IS NULL;
```

### String Padding in CHAR
```sql
-- CHAR pads with spaces
CREATE TABLE test (code CHAR(5));
INSERT INTO test VALUES ('ABC');

-- 'ABC' is stored as 'ABC  ' (padded)
-- This affects comparisons in some databases
SELECT * FROM test WHERE code = 'ABC';  -- May not match!
```

### Division by Zero
```sql
-- Unprotected division
SELECT total_sales / order_count  -- Fails if order_count = 0
FROM statistics;

-- Protected
SELECT
    CASE
        WHEN order_count = 0 THEN 0
        ELSE total_sales / order_count
    END AS avg_order_value
FROM statistics;
```

### Group By Requirements
```sql
-- Wrong: SELECT list includes non-aggregated, non-grouped column
SELECT department_id, first_name, COUNT(*)
FROM employees
GROUP BY department_id;  -- Error: first_name not in GROUP BY

-- Correct
SELECT department_id, COUNT(*) AS employee_count
FROM employees
GROUP BY department_id;
```

## Migration from SQL-89

SQL-92 introduced backward-compatible improvements:

```sql
-- SQL-89 implicit join
SELECT e.name, d.dept_name
FROM employees e, departments d
WHERE e.dept_id = d.dept_id;

-- SQL-92 explicit join (preferred)
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;

-- SQL-89 outer join (non-standard, vendor-specific)
-- Oracle: (+) syntax
-- SQL Server: *= syntax

-- SQL-92 standard outer join
SELECT e.name, d.dept_name
FROM employees e
LEFT OUTER JOIN departments d ON e.dept_id = d.dept_id;
```

## Performance Considerations

### Index Usage
```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_employee_dept ON employees(department_id);
CREATE INDEX idx_employee_name ON employees(last_name, first_name);

-- Queries benefit from indexes
SELECT * FROM employees
WHERE department_id = 10;  -- Uses idx_employee_dept
```

### Subquery vs JOIN
```sql
-- Sometimes JOIN performs better than subquery
-- Subquery approach
SELECT * FROM employees
WHERE department_id IN (
    SELECT department_id FROM departments WHERE location = 'NY'
);

-- JOIN approach (often faster)
SELECT DISTINCT e.*
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE d.location = 'NY';
```

## See Also

- [SQL Standards Overview](../) - Overview of all SQL standards
- [SQL-99](../sql-1999/) - Next major standard revision
- [SQL Basics](../../basics/) - Fundamental SQL concepts
- [JOINs](../../joins/) - Detailed JOIN documentation
- [Subqueries](../../subqueries/) - Comprehensive subquery guide
- [Transactions](../../transactions/) - Transaction management
- [Indexes](../../indexes/) - Index strategies

## External Resources

- [ISO/IEC 9075:1992](https://www.iso.org/standard/16662.html) - Official standard
- [ANSI SQL-92 Overview](https://www.contrib.andrew.cmu.edu/~shadow/sql/sql1992.txt) - Draft specification
- Database vendor SQL-92 compliance documentation
