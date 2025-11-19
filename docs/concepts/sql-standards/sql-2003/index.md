---
title: SQL:2003
description: Comprehensive guide to SQL:2003 standard featuring window functions, MERGE statement, sequences, XML support, and enhanced analytics capabilities
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, Snowflake, BigQuery, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [sql-2003, window-functions, merge, sequences, xml, analytics, over-clause, ranking]
---

# SQL:2003

<div class="difficulty-badge intermediate">Intermediate</div>

## Overview

SQL:2003, published as ISO/IEC 9075:2003, represents a major milestone in SQL's evolution, introducing powerful analytical capabilities that transformed how developers perform complex data analysis within SQL queries.

The most significant SQL:2003 innovations:
- **Window Functions** (analytic functions) with OVER clause
- **MERGE statement** (UPSERT operations)
- **Sequences** (sequence generators)
- **XML support** (XML data type and functions)
- **IDENTITY columns** (auto-increment standardization)
- **Enhanced OLAP features**
- **TABLESAMPLE** (data sampling)

SQL:2003 is considered the standard that made SQL a serious analytics platform, enabling complex analytical queries previously requiring procedural code or external tools.

## Historical Context

### Timeline
- **1999**: SQL-99 added CTEs and recursion
- **2003**: SQL:2003 introduced window functions
- **2006**: SQL:2006 (minor XML updates)
- **2008**: SQL:2008 (enhancements and clarifications)
- **2011**: SQL:2011 (temporal data)

### Impact
SQL:2003 was transformative because it:
- Enabled sophisticated analytics without cursors
- Standardized common patterns (upsert, sequences)
- Made SQL competitive with specialized analytics tools
- Provided ranking and running aggregations
- Introduced XML as a first-class data type

Most modern databases support core SQL:2003 features, with window functions being nearly universal by 2010.

## Major Features

### Window Functions

Window functions perform calculations across sets of rows related to the current row, without collapsing rows like GROUP BY.

#### ROW_NUMBER

```sql
-- Assign unique sequential numbers
SELECT
    employee_id,
    first_name,
    last_name,
    department_id,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS overall_rank,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank
FROM employees;

-- Example output:
-- employee_id | name      | dept | salary  | overall_rank | dept_rank
-- 105         | Alice     | 10   | 120000  | 1            | 1
-- 103         | Bob       | 20   | 115000  | 2            | 1
-- 101         | Charlie   | 10   | 110000  | 3            | 2
```

#### RANK and DENSE_RANK

```sql
-- RANK: Gaps in ranking after ties
-- DENSE_RANK: No gaps in ranking
SELECT
    product_name,
    category,
    sales_amount,
    RANK() OVER (PARTITION BY category ORDER BY sales_amount DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY category ORDER BY sales_amount DESC) AS dense_rank
FROM product_sales;

-- Example showing difference:
-- product      | category    | sales  | rank | dense_rank
-- Product A    | Electronics | 10000  | 1    | 1
-- Product B    | Electronics | 10000  | 1    | 1  (tie)
-- Product C    | Electronics | 9000   | 3    | 2  (rank skips 2, dense_rank doesn't)
-- Product D    | Electronics | 8000   | 4    | 3
```

#### NTILE

```sql
-- Divide data into N equal buckets
SELECT
    customer_id,
    total_purchases,
    NTILE(4) OVER (ORDER BY total_purchases DESC) AS quartile,
    NTILE(10) OVER (ORDER BY total_purchases DESC) AS decile
FROM customer_summary;

-- Use for segmentation
SELECT
    quartile,
    COUNT(*) AS customer_count,
    AVG(total_purchases) AS avg_purchases
FROM (
    SELECT
        customer_id,
        total_purchases,
        NTILE(4) OVER (ORDER BY total_purchases DESC) AS quartile
    FROM customer_summary
) ranked
GROUP BY quartile
ORDER BY quartile;
```

#### Aggregate Window Functions

```sql
-- Running totals and moving averages
SELECT
    order_date,
    order_id,
    amount,
    -- Running total
    SUM(amount) OVER (ORDER BY order_date, order_id) AS running_total,
    -- Cumulative average
    AVG(amount) OVER (ORDER BY order_date, order_id) AS cumulative_avg,
    -- Count of orders so far
    COUNT(*) OVER (ORDER BY order_date, order_id) AS order_count,
    -- Running min and max
    MIN(amount) OVER (ORDER BY order_date, order_id) AS running_min,
    MAX(amount) OVER (ORDER BY order_date, order_id) AS running_max
FROM orders
ORDER BY order_date, order_id;
```

#### Window Frames

```sql
-- ROWS vs RANGE frames
SELECT
    order_date,
    amount,
    -- Last 7 days including current (RANGE)
    SUM(amount) OVER (
        ORDER BY order_date
        RANGE BETWEEN INTERVAL '6' DAY PRECEDING AND CURRENT ROW
    ) AS last_7_days_total,
    -- Previous 3 rows plus current row (ROWS)
    AVG(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
    ) AS moving_avg_4,
    -- Centered window
    AVG(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    ) AS centered_avg_5
FROM orders;
```

#### Multiple Windows

```sql
-- Define window specifications once
SELECT
    employee_id,
    first_name,
    department_id,
    salary,
    AVG(salary) OVER dept_window AS dept_avg,
    MAX(salary) OVER dept_window AS dept_max,
    salary - AVG(salary) OVER dept_window AS diff_from_avg,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rank_in_dept
FROM employees
WINDOW dept_window AS (PARTITION BY department_id);
```

#### Practical Analytics Examples

```sql
-- Top N per group
WITH ranked_products AS (
    SELECT
        category,
        product_name,
        sales,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS rank
    FROM product_sales
)
SELECT category, product_name, sales
FROM ranked_products
WHERE rank <= 5;

-- Year-over-year comparison
SELECT
    sale_month,
    current_year_sales,
    LAG(current_year_sales, 12) OVER (ORDER BY sale_month) AS prior_year_sales,
    current_year_sales - LAG(current_year_sales, 12) OVER (ORDER BY sale_month) AS yoy_change,
    ROUND(
        100.0 * (current_year_sales - LAG(current_year_sales, 12) OVER (ORDER BY sale_month))
        / NULLIF(LAG(current_year_sales, 12) OVER (ORDER BY sale_month), 0),
        2
    ) AS yoy_pct_change
FROM monthly_sales
ORDER BY sale_month;

-- Cumulative percentage
SELECT
    product_name,
    sales,
    SUM(sales) OVER (ORDER BY sales DESC) AS cumulative_sales,
    ROUND(
        100.0 * SUM(sales) OVER (ORDER BY sales DESC) / SUM(sales) OVER (),
        2
    ) AS cumulative_pct
FROM product_sales
ORDER BY sales DESC;
```

### MERGE Statement

MERGE performs INSERT, UPDATE, or DELETE in a single statement based on conditions (often called "UPSERT").

#### Basic MERGE

```sql
-- Update existing records, insert new ones
MERGE INTO customer_summary cs
USING (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(total_amount) AS total_spent
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30' DAY
    GROUP BY customer_id
) recent
ON cs.customer_id = recent.customer_id
WHEN MATCHED THEN
    UPDATE SET
        cs.recent_order_count = recent.order_count,
        cs.recent_total_spent = recent.total_spent,
        cs.last_updated = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (customer_id, recent_order_count, recent_total_spent, last_updated)
    VALUES (recent.customer_id, recent.order_count, recent.total_spent, CURRENT_TIMESTAMP);
```

#### MERGE with Conditions

```sql
-- Conditional updates and deletes
MERGE INTO inventory i
USING (
    SELECT product_id, SUM(quantity) AS sold_quantity
    FROM order_items
    WHERE order_date = CURRENT_DATE
    GROUP BY product_id
) daily_sales
ON i.product_id = daily_sales.product_id
WHEN MATCHED AND i.stock_quantity >= daily_sales.sold_quantity THEN
    UPDATE SET
        i.stock_quantity = i.stock_quantity - daily_sales.sold_quantity,
        i.last_sold_date = CURRENT_DATE
WHEN MATCHED AND i.stock_quantity < daily_sales.sold_quantity THEN
    UPDATE SET
        i.stock_quantity = 0,
        i.out_of_stock = TRUE,
        i.backorder_quantity = daily_sales.sold_quantity - i.stock_quantity
WHEN NOT MATCHED THEN
    INSERT (product_id, stock_quantity, out_of_stock)
    VALUES (daily_sales.product_id, 0, TRUE);
```

#### MERGE with DELETE

```sql
-- Update, insert, or delete based on conditions
MERGE INTO product_catalog pc
USING staging_products sp
ON pc.product_id = sp.product_id
WHEN MATCHED AND sp.discontinued = TRUE THEN
    DELETE
WHEN MATCHED THEN
    UPDATE SET
        pc.product_name = sp.product_name,
        pc.price = sp.price,
        pc.last_updated = CURRENT_TIMESTAMP
WHEN NOT MATCHED AND sp.discontinued = FALSE THEN
    INSERT (product_id, product_name, price, last_updated)
    VALUES (sp.product_id, sp.product_name, sp.price, CURRENT_TIMESTAMP);
```

#### Data Warehouse ETL Pattern

```sql
-- Slowly Changing Dimension Type 1 (SCD1)
MERGE INTO dim_customer target
USING (
    SELECT
        customer_id,
        customer_name,
        email,
        address,
        city,
        state,
        zip
    FROM staging_customers
) source
ON target.customer_id = source.customer_id
WHEN MATCHED AND (
    target.customer_name <> source.customer_name OR
    target.email <> source.email OR
    target.address <> source.address
) THEN
    UPDATE SET
        target.customer_name = source.customer_name,
        target.email = source.email,
        target.address = source.address,
        target.city = source.city,
        target.state = source.state,
        target.zip = source.zip,
        target.modified_date = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (customer_id, customer_name, email, address, city, state, zip, created_date)
    VALUES (source.customer_id, source.customer_name, source.email,
            source.address, source.city, source.state, source.zip, CURRENT_TIMESTAMP);
```

### Sequences

Standardized way to generate unique sequential numbers.

#### Creating Sequences

```sql
-- Basic sequence
CREATE SEQUENCE customer_id_seq
START WITH 1000
INCREMENT BY 1;

-- Sequence with options
CREATE SEQUENCE order_id_seq
START WITH 1
INCREMENT BY 1
MINVALUE 1
MAXVALUE 999999999
CYCLE  -- Restart after reaching MAXVALUE
CACHE 20;  -- Cache values for performance

-- Descending sequence
CREATE SEQUENCE batch_id_seq
START WITH 1000
INCREMENT BY -1
MINVALUE 1;
```

#### Using Sequences

```sql
-- Get next value
INSERT INTO customers (customer_id, customer_name, email)
VALUES (NEXT VALUE FOR customer_id_seq, 'John Doe', 'john@example.com');

-- In SELECT statement
SELECT NEXT VALUE FOR order_id_seq AS new_order_id;

-- Multiple rows with sequence
INSERT INTO orders (order_id, customer_id, order_date)
SELECT
    NEXT VALUE FOR order_id_seq,
    customer_id,
    CURRENT_DATE
FROM pending_orders;

-- Get current value (without incrementing)
SELECT CURRENT VALUE FOR customer_id_seq;
```

#### Altering Sequences

```sql
-- Change increment
ALTER SEQUENCE customer_id_seq INCREMENT BY 10;

-- Reset sequence
ALTER SEQUENCE customer_id_seq RESTART WITH 5000;

-- Drop sequence
DROP SEQUENCE customer_id_seq;
```

### IDENTITY Columns

Standardized auto-increment columns.

#### GENERATED ALWAYS

```sql
-- Always generated, cannot be overridden
CREATE TABLE orders (
    order_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2)
);

-- Inserts automatically generate order_id
INSERT INTO orders (customer_id, order_date, total_amount)
VALUES (100, CURRENT_DATE, 250.00);

-- Error: Cannot override GENERATED ALWAYS
INSERT INTO orders (order_id, customer_id, order_date, total_amount)
VALUES (999, 100, CURRENT_DATE, 250.00);  -- ERROR

-- Override with special syntax
INSERT INTO orders (order_id, customer_id, order_date, total_amount)
OVERRIDING SYSTEM VALUE
VALUES (999, 100, CURRENT_DATE, 250.00);
```

#### GENERATED BY DEFAULT

```sql
-- Generated by default, can be overridden
CREATE TABLE products (
    product_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2)
);

-- Auto-generates product_id
INSERT INTO products (product_name, price)
VALUES ('Widget', 19.99);

-- Can specify explicit value
INSERT INTO products (product_id, product_name, price)
VALUES (5000, 'Special Widget', 29.99);
```

#### Identity Options

```sql
-- With sequence options
CREATE TABLE employees (
    employee_id INTEGER GENERATED ALWAYS AS IDENTITY (
        START WITH 1000
        INCREMENT BY 1
        MINVALUE 1000
        MAXVALUE 999999
        CACHE 10
    ) PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50)
);
```

### XML Support

SQL:2003 introduced XML as a first-class SQL data type.

#### XML Data Type

```sql
-- Create table with XML column
CREATE TABLE documents (
    document_id INTEGER PRIMARY KEY,
    title VARCHAR(200),
    content XML,
    created_date TIMESTAMP
);

-- Insert XML data
INSERT INTO documents (document_id, title, content)
VALUES (
    1,
    'Product Catalog',
    XMLPARSE(DOCUMENT '
        <catalog>
            <product id="101">
                <name>Widget</name>
                <price>19.99</price>
                <category>Hardware</category>
            </product>
            <product id="102">
                <name>Gadget</name>
                <price>29.99</price>
                <category>Electronics</category>
            </product>
        </catalog>
    ')
);
```

#### XML Functions

```sql
-- XMLELEMENT: Create XML elements
SELECT
    XMLELEMENT(
        NAME "employee",
        XMLATTRIBUTES(employee_id AS "id"),
        XMLELEMENT(NAME "name", first_name || ' ' || last_name),
        XMLELEMENT(NAME "salary", salary)
    ) AS employee_xml
FROM employees;

-- XMLFOREST: Create multiple elements
SELECT
    XMLELEMENT(
        NAME "employee",
        XMLFOREST(
            employee_id AS "id",
            first_name,
            last_name,
            salary
        )
    ) AS employee_xml
FROM employees;

-- XMLAGG: Aggregate XML
SELECT
    department_id,
    XMLELEMENT(
        NAME "department",
        XMLAGG(
            XMLELEMENT(
                NAME "employee",
                XMLFOREST(employee_id, first_name, last_name)
            )
        )
    ) AS dept_xml
FROM employees
GROUP BY department_id;
```

#### Querying XML

```sql
-- XMLEXISTS: Check if XPath matches
SELECT title
FROM documents
WHERE XMLEXISTS('//product[@id="101"]' PASSING content);

-- XMLQUERY: Extract XML fragments
SELECT
    document_id,
    XMLQUERY('//product/name' PASSING content) AS product_names
FROM documents;

-- XMLTABLE: Convert XML to relational
SELECT d.document_id, p.*
FROM documents d,
XMLTABLE(
    '//product'
    PASSING d.content
    COLUMNS
        product_id INTEGER PATH '@id',
        name VARCHAR(100) PATH 'name',
        price DECIMAL(10,2) PATH 'price',
        category VARCHAR(50) PATH 'category'
) AS p;
```

### TABLESAMPLE

Sample random rows from large tables for analysis.

```sql
-- Get 10% random sample
SELECT *
FROM large_table
TABLESAMPLE BERNOULLI(10);

-- Get approximately 1000 rows
SELECT *
FROM large_table
TABLESAMPLE SYSTEM(1000 ROWS);

-- Sample with repeatable seed
SELECT *
FROM orders
TABLESAMPLE BERNOULLI(5) REPEATABLE(12345);

-- Use for quick analysis
SELECT
    AVG(amount) AS avg_order,
    COUNT(*) AS sample_size
FROM orders
TABLESAMPLE BERNOULLI(1)  -- 1% sample
WHERE order_date >= DATE '2024-01-01';
```

### Enhanced Analytics

#### GROUPING SETS

```sql
-- Multiple groupings in one query
SELECT
    EXTRACT(YEAR FROM order_date) AS year,
    category,
    region,
    SUM(amount) AS total_sales
FROM sales
GROUP BY GROUPING SETS (
    (year, category, region),  -- All dimensions
    (year, category),          -- By year and category
    (year, region),            -- By year and region
    (year),                    -- By year only
    ()                         -- Grand total
)
ORDER BY year, category, region;
```

#### ROLLUP

```sql
-- Hierarchical subtotals
SELECT
    EXTRACT(YEAR FROM order_date) AS year,
    EXTRACT(MONTH FROM order_date) AS month,
    category,
    SUM(amount) AS total_sales
FROM sales
GROUP BY ROLLUP (year, month, category)
ORDER BY year, month, category;

-- Produces:
-- Year-Month-Category totals
-- Year-Month totals
-- Year totals
-- Grand total
```

#### CUBE

```sql
-- All possible combinations
SELECT
    region,
    category,
    product_type,
    SUM(sales) AS total_sales
FROM sales_data
GROUP BY CUBE (region, category, product_type);

-- Produces all combinations:
-- region + category + product_type
-- region + category
-- region + product_type
-- category + product_type
-- region only
-- category only
-- product_type only
-- Grand total
```

## Database-Specific Implementations

### PostgreSQL
- **Window Functions**: Full support since 8.4 (2009)
- **MERGE**: Added in PostgreSQL 15 (2022)
- **Sequences**: Excellent support with CREATE SEQUENCE
- **XML**: Full SQL:2003 XML support

```sql
-- PostgreSQL window functions
SELECT
    employee_id,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary) AS percentile
FROM employees;
```

### MySQL
- **Window Functions**: Added in MySQL 8.0 (2018)
- **MERGE**: Not supported (use INSERT ... ON DUPLICATE KEY UPDATE)
- **Sequences**: Not standard (use AUTO_INCREMENT)
- **XML**: Limited support

```sql
-- MySQL upsert alternative
INSERT INTO customer_summary (customer_id, order_count, total_spent)
VALUES (100, 5, 250.00)
ON DUPLICATE KEY UPDATE
    order_count = VALUES(order_count),
    total_spent = VALUES(total_spent);
```

### SQL Server
- **Window Functions**: Excellent support since SQL Server 2005
- **MERGE**: Full support since SQL Server 2008
- **Sequences**: Added in SQL Server 2012
- **XML**: Strong XML support with XQuery

```sql
-- SQL Server MERGE with OUTPUT
MERGE INTO target t
USING source s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.value = s.value
WHEN NOT MATCHED THEN INSERT (id, value) VALUES (s.id, s.value)
OUTPUT $action, inserted.*, deleted.*;
```

### Oracle
- **Window Functions**: Pioneered analytics functions
- **MERGE**: Full support since Oracle 9i
- **Sequences**: Long-standing support
- **XML**: Comprehensive XML capabilities

```sql
-- Oracle analytic functions (pre-SQL:2003)
SELECT
    employee_id,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rank,
    RATIO_TO_REPORT(salary) OVER () AS pct_of_total
FROM employees;
```

### Snowflake
- **Window Functions**: Full modern support
- **MERGE**: Complete MERGE support
- **Sequences**: Full sequence support
- **XML**: Basic support, JSON preferred

```sql
-- Snowflake window functions
SELECT
    product_name,
    sales,
    SUM(sales) OVER (ORDER BY sales DESC ROWS UNBOUNDED PRECEDING) AS cumulative
FROM products;
```

## Common Patterns

### Running Totals by Group

```sql
SELECT
    department_id,
    employee_id,
    hire_date,
    salary,
    SUM(salary) OVER (
        PARTITION BY department_id
        ORDER BY hire_date
        ROWS UNBOUNDED PRECEDING
    ) AS dept_cumulative_payroll
FROM employees
ORDER BY department_id, hire_date;
```

### Gap Detection

```sql
-- Find missing sequence numbers
WITH numbered_orders AS (
    SELECT
        order_id,
        ROW_NUMBER() OVER (ORDER BY order_id) AS expected_sequence
    FROM orders
)
SELECT order_id
FROM numbered_orders
WHERE order_id <> expected_sequence;
```

### Percentage of Total

```sql
SELECT
    category,
    product_name,
    sales,
    ROUND(100.0 * sales / SUM(sales) OVER (PARTITION BY category), 2) AS pct_of_category,
    ROUND(100.0 * sales / SUM(sales) OVER (), 2) AS pct_of_total
FROM product_sales;
```

### Moving Average

```sql
-- 7-day moving average
SELECT
    date,
    value,
    AVG(value) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM daily_metrics
ORDER BY date;
```

## Best Practices

### Window Function Performance

```sql
-- Good: Reuse window definitions
SELECT
    employee_id,
    salary,
    AVG(salary) OVER dept_window,
    MAX(salary) OVER dept_window,
    MIN(salary) OVER dept_window
FROM employees
WINDOW dept_window AS (PARTITION BY department_id);

-- Avoid: Repeat window definitions
SELECT
    employee_id,
    salary,
    AVG(salary) OVER (PARTITION BY department_id),
    MAX(salary) OVER (PARTITION BY department_id),
    MIN(salary) OVER (PARTITION BY department_id)
FROM employees;
```

### MERGE Error Handling

```sql
-- Include error logging in MERGE
MERGE INTO target t
USING source s ON t.id = s.id
WHEN MATCHED THEN
    UPDATE SET t.value = s.value, t.updated_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (id, value, created_at) VALUES (s.id, s.value, CURRENT_TIMESTAMP);

-- Log merge results
INSERT INTO merge_log (table_name, rows_inserted, rows_updated, merge_date)
SELECT 'target', COUNT(*) FILTER (WHERE action = 'INSERT'),
       COUNT(*) FILTER (WHERE action = 'UPDATE'), CURRENT_TIMESTAMP
FROM (MERGE ... OUTPUT $action) AS merge_result;
```

## Common Pitfalls

### Window Function Order

```sql
-- Order matters for cumulative functions
SELECT
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total  -- Correct
FROM orders;

-- Wrong: Missing ORDER BY gives unexpected results
SELECT
    order_date,
    amount,
    SUM(amount) OVER () AS not_a_running_total  -- Just total repeated
FROM orders;
```

### MERGE Atomicity

MERGE is a single statement but may have performance implications with large datasets. Test thoroughly.

## See Also

- [SQL Standards Overview](../) - All SQL standards
- [SQL-99](../sql-1999/) - Previous standard
- [SQL:2011](../sql-2011/) - Next standard
- [Window Functions](../../window-functions/) - Detailed guide
- [Common Table Expressions](../../ctes/) - CTE patterns

## External Resources

- [ISO/IEC 9075:2003](https://www.iso.org/standard/34132.html) - Official standard
- [Modern SQL - Window Functions](https://modern-sql.com/feature/over) - SQL:2003 features
- [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
