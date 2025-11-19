---
title: SQL:2011
description: Comprehensive guide to SQL:2011 standard featuring temporal tables, enhanced window functions, FETCH FIRST pagination, and advanced OLAP capabilities
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, Snowflake, BigQuery, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [sql-2011, temporal-tables, system-versioning, fetch-first, offset, lead, lag, window-functions, olap]
---

# SQL:2011

<div class="difficulty-badge intermediate">Intermediate</div>

## Overview

SQL:2011, published as ISO/IEC 9075:2011, introduced major enhancements focused on temporal data management and improved analytical capabilities. It represents a significant evolution in SQL's ability to handle time-varying data and complex analytical queries.

Key innovations in SQL:2011:
- **Temporal Tables** (system-versioned tables)
- **Application-time period tables**
- **Bitemporal tables** (combining system and application time)
- **Enhanced window functions** (LEAD, LAG, FIRST_VALUE, LAST_VALUE, NTH_VALUE)
- **FETCH FIRST/OFFSET** pagination (standardized LIMIT)
- **Pipelined table functions**
- **Enhanced OLAP features**

SQL:2011's temporal features enable databases to automatically track historical changes, supporting audit requirements, point-in-time queries, and time-travel capabilities natively in SQL.

## Historical Context

### Timeline
- **2003**: SQL:2003 introduced window functions
- **2006**: SQL:2006 (minor XML revisions)
- **2008**: SQL:2008 (clarifications and enhancements)
- **2011**: SQL:2011 (temporal data focus)
- **2016**: SQL:2016 (JSON support)

### Impact
SQL:2011 was significant because it:
- Standardized temporal data patterns used in data warehousing
- Eliminated need for custom history tracking triggers
- Enabled point-in-time queries without application code
- Standardized pagination (FETCH FIRST)
- Added critical analytical window functions (LEAD, LAG)

Implementation has been gradual, with full temporal support still limited to specialized databases, though FETCH FIRST and enhanced window functions are widely adopted.

## Major Features

### System-Versioned Temporal Tables

System-versioned tables automatically track all changes with system-generated timestamps.

#### Creating System-Versioned Tables

```sql
-- Basic system-versioned table
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2),
    department_id INTEGER,
    -- System-time columns
    sys_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
    sys_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (sys_start, sys_end)
)
WITH SYSTEM VERSIONING;

-- Automatically creates history table: employees_history
```

#### Querying Temporal Data

```sql
-- Current data (default query)
SELECT * FROM employees
WHERE employee_id = 101;

-- Data as of specific time
SELECT * FROM employees
FOR SYSTEM_TIME AS OF TIMESTAMP '2024-01-15 10:00:00'
WHERE employee_id = 101;

-- Data between two timestamps
SELECT * FROM employees
FOR SYSTEM_TIME BETWEEN TIMESTAMP '2024-01-01 00:00:00'
                    AND TIMESTAMP '2024-01-31 23:59:59'
WHERE employee_id = 101;

-- Data from start until timestamp
SELECT * FROM employees
FOR SYSTEM_TIME FROM TIMESTAMP '2024-01-01 00:00:00'
                  TO TIMESTAMP '2024-02-01 00:00:00'
WHERE employee_id = 101;

-- All historical versions (current + history)
SELECT
    employee_id,
    first_name,
    last_name,
    salary,
    sys_start,
    sys_end
FROM employees
FOR SYSTEM_TIME ALL
WHERE employee_id = 101
ORDER BY sys_start;
```

#### Practical Temporal Queries

```sql
-- Audit trail: Who had which salary when?
SELECT
    employee_id,
    first_name || ' ' || last_name AS employee_name,
    salary,
    sys_start AS effective_from,
    sys_end AS effective_until,
    CASE
        WHEN sys_end = TIMESTAMP '9999-12-31 23:59:59.999999'
        THEN TRUE ELSE FALSE
    END AS is_current
FROM employees FOR SYSTEM_TIME ALL
WHERE employee_id = 101
ORDER BY sys_start;

-- Compare current vs historical state
SELECT
    current.employee_id,
    current.salary AS current_salary,
    historical.salary AS salary_one_year_ago,
    current.salary - historical.salary AS salary_change,
    ROUND(
        100.0 * (current.salary - historical.salary) / historical.salary,
        2
    ) AS pct_change
FROM employees current
LEFT JOIN employees FOR SYSTEM_TIME AS OF (CURRENT_TIMESTAMP - INTERVAL '1' YEAR) historical
    ON current.employee_id = historical.employee_id;

-- Find all changes in the last 30 days
WITH changes AS (
    SELECT
        employee_id,
        first_name,
        last_name,
        salary,
        sys_start,
        LAG(salary) OVER (PARTITION BY employee_id ORDER BY sys_start) AS previous_salary
    FROM employees FOR SYSTEM_TIME ALL
    WHERE sys_start >= CURRENT_TIMESTAMP - INTERVAL '30' DAY
)
SELECT
    employee_id,
    first_name,
    last_name,
    previous_salary,
    salary AS new_salary,
    salary - previous_salary AS change_amount,
    sys_start AS change_date
FROM changes
WHERE previous_salary IS NOT NULL
  AND salary <> previous_salary;
```

### Application-Time Period Tables

Track business-effective dates (as opposed to system-time tracking database changes).

#### Creating Application-Time Tables

```sql
-- Contract validity periods
CREATE TABLE contracts (
    contract_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    contract_amount DECIMAL(10,2),
    -- Application-time period
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    PERIOD FOR valid_time (valid_from, valid_until),
    -- Prevent overlapping periods for same customer
    CONSTRAINT no_overlap
        UNIQUE (customer_id, valid_time WITHOUT OVERLAPS)
);
```

#### Querying Application-Time Data

```sql
-- Current active contracts
SELECT *
FROM contracts
WHERE CURRENT_DATE BETWEEN valid_from AND valid_until;

-- Contracts active on specific date
SELECT *
FROM contracts
FOR PORTION OF valid_time
FROM DATE '2024-06-01' TO DATE '2024-06-30';

-- Contracts overlapping a period
SELECT *
FROM contracts
WHERE valid_time OVERLAPS PERIOD(DATE '2024-01-01', DATE '2024-12-31');
```

#### Updating Application-Time Periods

```sql
-- Update only portion of period (splits record)
UPDATE contracts
FOR PORTION OF valid_time
FROM DATE '2024-03-01' TO DATE '2024-06-01'
SET contract_amount = 15000
WHERE contract_id = 100;

-- Result: Creates up to 3 records:
-- 1. Before period (if exists): original amount
-- 2. During period: new amount (15000)
-- 3. After period (if exists): original amount

-- Delete portion of period
DELETE FROM contracts
FOR PORTION OF valid_time
FROM DATE '2024-04-01' TO DATE '2024-05-01'
WHERE contract_id = 100;
```

### Bitemporal Tables

Combine system-time and application-time for complete temporal tracking.

```sql
-- Track both when data was valid and when changes were made
CREATE TABLE insurance_policies (
    policy_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    coverage_amount DECIMAL(12,2),
    premium DECIMAL(10,2),
    -- Application time: when policy is valid
    policy_start DATE NOT NULL,
    policy_end DATE NOT NULL,
    PERIOD FOR policy_period (policy_start, policy_end),
    -- System time: when record was in database
    sys_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
    sys_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (sys_start, sys_end)
)
WITH SYSTEM VERSIONING;

-- Query: "What did we think on Jan 1, 2024 about policies effective on June 1, 2024?"
SELECT *
FROM insurance_policies
FOR SYSTEM_TIME AS OF TIMESTAMP '2024-01-01 00:00:00'
WHERE DATE '2024-06-01' BETWEEN policy_start AND policy_end;

-- Query: "Show me all versions of this policy's coverage, both past and future"
SELECT
    policy_id,
    coverage_amount,
    policy_start,
    policy_end,
    sys_start AS recorded_from,
    sys_end AS recorded_until
FROM insurance_policies FOR SYSTEM_TIME ALL
WHERE policy_id = 1001
ORDER BY sys_start, policy_start;
```

### Enhanced Window Functions

SQL:2011 added powerful navigational and value window functions.

#### LEAD and LAG

```sql
-- Access subsequent and previous rows
SELECT
    sale_date,
    amount,
    -- Previous day's sales
    LAG(amount, 1) OVER (ORDER BY sale_date) AS prev_day_sales,
    -- Next day's sales
    LEAD(amount, 1) OVER (ORDER BY sale_date) AS next_day_sales,
    -- Day-over-day change
    amount - LAG(amount, 1) OVER (ORDER BY sale_date) AS daily_change,
    -- Day-over-day percent change
    ROUND(
        100.0 * (amount - LAG(amount, 1) OVER (ORDER BY sale_date))
        / NULLIF(LAG(amount, 1) OVER (ORDER BY sale_date), 0),
        2
    ) AS pct_change
FROM daily_sales
ORDER BY sale_date;

-- LAG with default value for first row
SELECT
    product_id,
    sale_date,
    quantity_sold,
    LAG(quantity_sold, 1, 0) OVER (
        PARTITION BY product_id
        ORDER BY sale_date
    ) AS prev_quantity
FROM sales;

-- LEAD multiple rows ahead
SELECT
    month,
    revenue,
    LEAD(revenue, 1) OVER (ORDER BY month) AS next_month,
    LEAD(revenue, 3) OVER (ORDER BY month) AS three_months_ahead,
    LEAD(revenue, 12) OVER (ORDER BY month) AS same_month_next_year
FROM monthly_revenue;
```

#### FIRST_VALUE and LAST_VALUE

```sql
-- First and last values in window
SELECT
    employee_id,
    department_id,
    salary,
    hire_date,
    -- Highest salary in department
    FIRST_VALUE(salary) OVER (
        PARTITION BY department_id
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS dept_max_salary,
    -- Most recently hired in department
    LAST_VALUE(employee_id) OVER (
        PARTITION BY department_id
        ORDER BY hire_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS most_recent_hire
FROM employees;

-- Running comparison to first value
SELECT
    order_date,
    total_sales,
    FIRST_VALUE(total_sales) OVER (ORDER BY order_date) AS baseline_sales,
    total_sales - FIRST_VALUE(total_sales) OVER (ORDER BY order_date) AS change_from_baseline
FROM daily_sales
ORDER BY order_date;
```

#### NTH_VALUE

```sql
-- Access specific position in window
SELECT
    product_id,
    product_name,
    sales,
    -- Second highest selling product in category
    NTH_VALUE(product_name, 2) OVER (
        PARTITION BY category
        ORDER BY sales DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS second_best_product,
    -- Median value (approximate with NTH_VALUE)
    NTH_VALUE(sales, CAST(COUNT(*) OVER (PARTITION BY category) / 2 AS INTEGER)) OVER (
        PARTITION BY category
        ORDER BY sales
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS approx_median
FROM product_sales;
```

#### Practical Analytics Examples

```sql
-- Identify trends: 3 consecutive increases
WITH daily_changes AS (
    SELECT
        sale_date,
        amount,
        amount > LAG(amount, 1) OVER (ORDER BY sale_date) AS is_increase,
        amount > LAG(amount, 2) OVER (ORDER BY sale_date) AS prev_2_increase,
        amount > LAG(amount, 3) OVER (ORDER BY sale_date) AS prev_3_increase
    FROM daily_sales
)
SELECT sale_date, amount
FROM daily_changes
WHERE is_increase AND prev_2_increase AND prev_3_increase;

-- Gap analysis: Days between orders
SELECT
    customer_id,
    order_date,
    LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS previous_order,
    order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS days_since_last_order
FROM orders
ORDER BY customer_id, order_date;

-- First and last purchase comparison
SELECT DISTINCT
    customer_id,
    FIRST_VALUE(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS first_purchase,
    LAST_VALUE(order_date) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_purchase,
    FIRST_VALUE(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS first_amount,
    LAST_VALUE(amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_amount
FROM orders;
```

### FETCH FIRST and OFFSET

Standardized pagination and result limiting.

#### Basic FETCH FIRST

```sql
-- Get first 10 rows
SELECT employee_id, first_name, last_name, salary
FROM employees
ORDER BY salary DESC
FETCH FIRST 10 ROWS ONLY;

-- Alternative syntax
SELECT employee_id, first_name, last_name, salary
FROM employees
ORDER BY salary DESC
FETCH NEXT 10 ROWS ONLY;

-- With ties: Include all rows with same value as last row
SELECT product_name, sales
FROM products
ORDER BY sales DESC
FETCH FIRST 5 ROWS WITH TIES;
```

#### OFFSET for Pagination

```sql
-- Skip first 20, get next 10 (page 3 of results, 10 per page)
SELECT product_id, product_name, price
FROM products
ORDER BY product_name
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY;

-- First page
SELECT * FROM products ORDER BY product_id
OFFSET 0 ROWS FETCH NEXT 25 ROWS ONLY;

-- Second page
SELECT * FROM products ORDER BY product_id
OFFSET 25 ROWS FETCH NEXT 25 ROWS ONLY;

-- Third page
SELECT * FROM products ORDER BY product_id
OFFSET 50 ROWS FETCH NEXT 25 ROWS ONLY;
```

#### Percentage-Based Limiting

```sql
-- Get top 10% of rows
SELECT employee_id, first_name, salary
FROM employees
ORDER BY salary DESC
FETCH FIRST 10 PERCENT ROWS ONLY;

-- Top 5% with ties
SELECT product_name, sales
FROM products
ORDER BY sales DESC
FETCH FIRST 5 PERCENT ROWS WITH TIES;
```

#### Practical Pagination Examples

```sql
-- Parameterized pagination function
-- Page 1: OFFSET 0, Page 2: OFFSET 10, etc.
CREATE FUNCTION get_products_page(page_num INTEGER, page_size INTEGER)
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR(100),
    price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.product_id, p.product_name, p.price
    FROM products p
    ORDER BY p.product_name
    OFFSET (page_num - 1) * page_size ROWS
    FETCH NEXT page_size ROWS ONLY;
END;
$$ LANGUAGE plpgsql;

-- Pagination with total count
WITH total AS (
    SELECT COUNT(*) AS total_rows FROM products
),
page_data AS (
    SELECT product_id, product_name, price
    FROM products
    ORDER BY product_name
    OFFSET 20 ROWS
    FETCH NEXT 10 ROWS ONLY
)
SELECT
    p.*,
    t.total_rows,
    CEIL(t.total_rows::DECIMAL / 10) AS total_pages
FROM page_data p
CROSS JOIN total t;
```

### Enhanced OLAP Features

#### LISTAGG (Aggregate Function)

```sql
-- Concatenate values across rows
SELECT
    department_id,
    LISTAGG(first_name, ', ') WITHIN GROUP (ORDER BY last_name) AS employee_list
FROM employees
GROUP BY department_id;

-- With custom separator and ordering
SELECT
    category,
    LISTAGG(product_name, ' | ') WITHIN GROUP (ORDER BY sales DESC) AS top_products
FROM products
GROUP BY category;

-- Limit concatenated length
SELECT
    department_id,
    LISTAGG(first_name, ', ' ON OVERFLOW TRUNCATE '...' WITH COUNT)
        WITHIN GROUP (ORDER BY hire_date)
        AS recent_hires
FROM employees
GROUP BY department_id;
```

#### PERCENTILE Functions

```sql
-- Continuous percentiles (interpolated)
SELECT
    department_id,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) AS q1_salary,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS q3_salary,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY salary) AS p90_salary
FROM employees
GROUP BY department_id;

-- Discrete percentiles (actual values)
SELECT
    category,
    PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY price) AS median_price
FROM products
GROUP BY category;

-- Window function version
SELECT
    employee_id,
    first_name,
    salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)
        OVER (PARTITION BY department_id) AS dept_median
FROM employees;
```

### Pipelined Table Functions

Enable functions to return rows incrementally for improved performance.

```sql
-- Define pipelined function (syntax varies by database)
CREATE FUNCTION generate_dates(start_date DATE, end_date DATE)
RETURNS TABLE (date_value DATE)
LANGUAGE SQL
AS $$
    WITH RECURSIVE dates AS (
        SELECT start_date AS date_value
        UNION ALL
        SELECT date_value + INTERVAL '1' DAY
        FROM dates
        WHERE date_value < end_date
    )
    SELECT date_value FROM dates;
$$;

-- Use pipelined function
SELECT d.date_value, COALESCE(s.amount, 0) AS sales
FROM generate_dates(DATE '2024-01-01', DATE '2024-01-31') d
LEFT JOIN daily_sales s ON d.date_value = s.sale_date
ORDER BY d.date_value;
```

## Database-Specific Implementations

### PostgreSQL
- **Temporal Tables**: Not natively supported (use triggers/extensions)
- **FETCH FIRST**: Full support since 8.4
- **LEAD/LAG**: Excellent window function support
- **OFFSET**: Full support

```sql
-- PostgreSQL FETCH FIRST
SELECT * FROM employees
ORDER BY salary DESC
OFFSET 10 ROWS
FETCH FIRST 20 ROWS ONLY;
```

### MySQL
- **Temporal Tables**: Not natively supported
- **FETCH FIRST**: Not supported (use LIMIT)
- **LEAD/LAG**: Added in MySQL 8.0
- **OFFSET**: Via LIMIT...OFFSET

```sql
-- MySQL pagination (non-standard)
SELECT * FROM employees
ORDER BY salary DESC
LIMIT 20 OFFSET 10;
```

### SQL Server
- **Temporal Tables**: Full system-versioned table support since SQL Server 2016
- **FETCH FIRST**: Full support since SQL Server 2012
- **LEAD/LAG**: Full window function support
- **OFFSET**: Full support

```sql
-- SQL Server system-versioned table
CREATE TABLE dbo.Employees (
    EmployeeID INT PRIMARY KEY,
    Name NVARCHAR(100),
    Salary DECIMAL(10,2),
    ValidFrom DATETIME2 GENERATED ALWAYS AS ROW START,
    ValidTo DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo)
)
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.EmployeesHistory));

-- Query historical data
SELECT * FROM Employees
FOR SYSTEM_TIME AS OF '2024-01-15 10:00:00'
WHERE EmployeeID = 101;
```

### Oracle
- **Temporal Tables**: Flashback versions queries (proprietary)
- **FETCH FIRST**: Supported in Oracle 12c+
- **LEAD/LAG**: Long-standing support
- **OFFSET**: Supported in 12c+

```sql
-- Oracle Flashback (similar to temporal)
SELECT * FROM employees
AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' HOUR)
WHERE employee_id = 101;

-- Oracle FETCH FIRST
SELECT * FROM employees
ORDER BY salary DESC
FETCH FIRST 10 ROWS ONLY;
```

### Snowflake
- **Temporal Tables**: Time Travel (proprietary, similar concept)
- **FETCH FIRST**: Not standard syntax (use LIMIT)
- **LEAD/LAG**: Full support
- **OFFSET**: Via LIMIT...OFFSET

```sql
-- Snowflake Time Travel
SELECT * FROM employees
AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP)
WHERE employee_id = 101;

-- Query as of 1 hour ago
SELECT * FROM employees
AT(OFFSET => -3600);  -- Seconds ago
```

## Common Patterns

### Audit Trail with Temporal Tables

```sql
-- Track all salary changes
SELECT
    employee_id,
    first_name || ' ' || last_name AS name,
    salary,
    sys_start AS effective_from,
    sys_end AS effective_until,
    LEAD(sys_start) OVER (PARTITION BY employee_id ORDER BY sys_start) - sys_start AS duration
FROM employees FOR SYSTEM_TIME ALL
ORDER BY employee_id, sys_start;
```

### Keyset Pagination (Better than OFFSET)

```sql
-- First page
SELECT product_id, product_name, price
FROM products
WHERE product_id > 0
ORDER BY product_id
FETCH FIRST 25 ROWS ONLY;

-- Next page (use last_id from previous page)
SELECT product_id, product_name, price
FROM products
WHERE product_id > :last_id
ORDER BY product_id
FETCH FIRST 25 ROWS ONLY;
```

### Calculate Streaks

```sql
-- Find consecutive days with sales > 1000
WITH daily_status AS (
    SELECT
        sale_date,
        amount,
        CASE WHEN amount > 1000 THEN 1 ELSE 0 END AS is_high,
        sale_date - (ROW_NUMBER() OVER (ORDER BY sale_date)) * INTERVAL '1' DAY AS streak_group
    FROM daily_sales
)
SELECT
    MIN(sale_date) AS streak_start,
    MAX(sale_date) AS streak_end,
    COUNT(*) AS streak_length
FROM daily_status
WHERE is_high = 1
GROUP BY streak_group
HAVING COUNT(*) >= 3
ORDER BY streak_length DESC;
```

## Best Practices

### Use Appropriate Window Frame

```sql
-- Default frame (RANGE UNBOUNDED PRECEDING) may not be desired
SELECT
    order_date,
    amount,
    -- Wrong for running total (uses RANGE by default)
    SUM(amount) OVER (ORDER BY order_date) AS total,
    -- Correct: explicit ROWS frame
    SUM(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM orders;
```

### Pagination Efficiency

```sql
-- Inefficient: OFFSET scans and discards rows
SELECT * FROM large_table
ORDER BY id
OFFSET 1000000 ROWS
FETCH NEXT 10 ROWS ONLY;

-- Better: Keyset pagination
SELECT * FROM large_table
WHERE id > :last_seen_id
ORDER BY id
FETCH FIRST 10 ROWS ONLY;
```

### Temporal Query Performance

```sql
-- Index temporal columns
CREATE INDEX idx_employees_sys_time
ON employees (employee_id, sys_start, sys_end);

-- Query with specific time ranges
SELECT * FROM employees
FOR SYSTEM_TIME BETWEEN '2024-01-01' AND '2024-01-31'
WHERE employee_id = 101;
```

## Common Pitfalls

### LAST_VALUE Default Frame

```sql
-- Wrong: LAST_VALUE with default frame
SELECT
    order_date,
    amount,
    LAST_VALUE(amount) OVER (ORDER BY order_date) AS last_amount
FROM orders;
-- Returns current row amount, not last in partition!

-- Correct: Specify full frame
SELECT
    order_date,
    amount,
    LAST_VALUE(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_amount
FROM orders;
```

### Temporal Table Updates

System-versioned tables automatically create history - don't try to manually manage it.

```sql
-- Wrong: Trying to update history table
UPDATE employees_history
SET salary = 100000
WHERE employee_id = 101;  -- Error or ignored

-- Correct: Update current table only
UPDATE employees
SET salary = 100000
WHERE employee_id = 101;
-- History automatically recorded
```

## See Also

- [SQL Standards Overview](../) - All SQL standards
- [SQL:2003](../sql-2003/) - Previous standard
- [SQL:2016](../sql-2016/) - Next standard
- [Window Functions](../../window-functions/) - Detailed guide
- [Temporal Tables](../../temporal/) - Temporal patterns

## External Resources

- [ISO/IEC 9075:2011](https://www.iso.org/standard/53681.html) - Official standard
- [SQL Server Temporal Tables](https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables)
- [Modern SQL - Pagination](https://modern-sql.com/feature/limit)
