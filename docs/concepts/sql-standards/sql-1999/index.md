---
title: SQL-99 (SQL:1999)
description: Comprehensive guide to SQL-99 standard featuring recursive queries, Common Table Expressions, CASE expressions, triggers, and object-relational capabilities
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, Snowflake, BigQuery, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [sql-99, sql-1999, cte, recursive, case, triggers, boolean, procedures, functions]
---

# SQL-99 (SQL:1999)

<div class="difficulty-badge intermediate">Intermediate</div>

## Overview

SQL:1999 (commonly called SQL-99 or SQL3) represents a major expansion of the SQL standard, published in 1999 as ISO/IEC 9075:1999. It introduced powerful new features that fundamentally changed how developers write SQL queries.

Key innovations in SQL-99:
- **Common Table Expressions (CTEs)** with the WITH clause
- **Recursive queries** for hierarchical data
- **CASE expressions** for conditional logic
- **Triggers** for automated database actions
- **User-defined functions and procedures**
- **Boolean data type**
- **Object-relational features**
- **BLOB and CLOB** for large objects

SQL-99 was significantly larger than SQL-92, expanding from ~600 pages to over 2000 pages across multiple parts. Most modern databases implement core SQL-99 features, though full compliance remains rare.

## Historical Context

### Timeline
- **1992**: SQL-92 established baseline
- **1999**: SQL:1999 published (major expansion)
- **2003**: SQL:2003 (window functions, MERGE)
- **2011**: SQL:2011 (temporal data)

### Impact
SQL-99 transformed SQL programming by:
- Making complex queries more readable with CTEs
- Enabling hierarchical queries without procedural code
- Standardizing conditional logic with CASE
- Providing procedural extensions (SQL/PSM)
- Adding object-relational capabilities

## Conformance Model

SQL-99 introduced a new conformance model:

### Core SQL:1999
- Essential features all implementations should support
- Replaces Entry SQL-92 as minimum level
- Most widely implemented portion

### Enhanced SQL:1999
Optional feature packages:
- **PSM** (Persistent Stored Modules) - Procedures and functions
- **CLI** (Call-Level Interface) - Programming language bindings
- **MED** (Management of External Data) - Foreign data access
- **OLB** (Object Language Bindings) - Object-oriented integration
- **Temporal** - Date/time enhancements

Most databases implement Core SQL:1999 plus selective enhanced features.

## Major Features

### Common Table Expressions (CTEs)

CTEs provide a way to define temporary named result sets that exist only during query execution.

#### Basic CTEs

```sql
-- Simple CTE
WITH sales_summary AS (
    SELECT
        salesperson_id,
        SUM(amount) AS total_sales,
        COUNT(*) AS transaction_count
    FROM sales
    WHERE sale_date >= DATE '2024-01-01'
    GROUP BY salesperson_id
)
SELECT
    s.salesperson_id,
    s.total_sales,
    s.transaction_count,
    s.total_sales / s.transaction_count AS avg_transaction
FROM sales_summary s
WHERE s.total_sales > 100000;
```

#### Multiple CTEs

```sql
-- Multiple CTEs in single query
WITH
regional_sales AS (
    SELECT region, SUM(amount) AS total_sales
    FROM orders
    GROUP BY region
),
top_regions AS (
    SELECT region
    FROM regional_sales
    WHERE total_sales > (SELECT SUM(total_sales) / 10 FROM regional_sales)
),
regional_customers AS (
    SELECT o.region, c.customer_id, SUM(o.amount) AS customer_total
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    WHERE o.region IN (SELECT region FROM top_regions)
    GROUP BY o.region, c.customer_id
)
SELECT
    rc.region,
    rc.customer_id,
    rc.customer_total,
    CAST(rc.customer_total * 100.0 / rs.total_sales AS DECIMAL(5,2)) AS pct_of_region
FROM regional_customers rc
JOIN regional_sales rs ON rc.region = rs.region
ORDER BY rc.region, rc.customer_total DESC;
```

#### Benefits of CTEs

```sql
-- Without CTE (harder to read)
SELECT
    e.employee_id,
    e.first_name,
    e.salary,
    dept_avg.avg_salary
FROM employees e
JOIN (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
) dept_avg ON e.department_id = dept_avg.department_id
WHERE e.salary > dept_avg.avg_salary;

-- With CTE (clearer intent)
WITH department_averages AS (
    SELECT
        department_id,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT
    e.employee_id,
    e.first_name,
    e.salary,
    da.avg_salary
FROM employees e
JOIN department_averages da ON e.department_id = da.department_id
WHERE e.salary > da.avg_salary;
```

### Recursive Queries

Recursive CTEs enable queries on hierarchical or graph-structured data.

#### Employee Hierarchy

```sql
-- Find all employees in a management chain
WITH RECURSIVE employee_hierarchy AS (
    -- Anchor member: Start with top-level manager
    SELECT
        employee_id,
        first_name,
        last_name,
        manager_id,
        1 AS level,
        CAST(first_name || ' ' || last_name AS VARCHAR(1000)) AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive member: Find direct reports
    SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        e.manager_id,
        eh.level + 1,
        CAST(eh.path || ' > ' || e.first_name || ' ' || e.last_name AS VARCHAR(1000))
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT
    employee_id,
    first_name,
    last_name,
    level,
    path
FROM employee_hierarchy
ORDER BY level, last_name;
```

#### Bill of Materials

```sql
-- Parts breakdown for manufacturing
WITH RECURSIVE parts_explosion AS (
    -- Anchor: Top-level product
    SELECT
        p.part_id,
        p.part_name,
        p.part_number,
        1 AS quantity,
        0 AS level,
        CAST(p.part_name AS VARCHAR(1000)) AS path
    FROM parts p
    WHERE p.part_id = 100  -- Product ID

    UNION ALL

    -- Recursive: Sub-components
    SELECT
        p.part_id,
        p.part_name,
        p.part_number,
        pe.quantity * bom.quantity,
        pe.level + 1,
        CAST(pe.path || ' > ' || p.part_name AS VARCHAR(1000))
    FROM parts p
    INNER JOIN bill_of_materials bom ON p.part_id = bom.component_id
    INNER JOIN parts_explosion pe ON bom.part_id = pe.part_id
)
SELECT
    part_id,
    REPEAT('  ', level) || part_name AS part_hierarchy,
    part_number,
    quantity,
    level
FROM parts_explosion
ORDER BY path;
```

#### Graph Traversal

```sql
-- Find all connected nodes in a graph
WITH RECURSIVE reachable_nodes AS (
    -- Start node
    SELECT
        node_id,
        node_name,
        0 AS distance,
        ARRAY[node_id] AS path
    FROM nodes
    WHERE node_id = 1

    UNION

    -- Follow edges (UNION prevents cycles)
    SELECT
        n.node_id,
        n.node_name,
        rn.distance + 1,
        rn.path || n.node_id
    FROM nodes n
    INNER JOIN edges e ON n.node_id = e.to_node
    INNER JOIN reachable_nodes rn ON e.from_node = rn.node_id
    WHERE NOT n.node_id = ANY(rn.path)  -- Prevent cycles
      AND rn.distance < 10  -- Limit depth
)
SELECT DISTINCT node_id, node_name, MIN(distance) AS shortest_distance
FROM reachable_nodes
GROUP BY node_id, node_name
ORDER BY shortest_distance, node_name;
```

#### Recursive Aggregation

```sql
-- Sum up department budgets including sub-departments
WITH RECURSIVE dept_hierarchy AS (
    SELECT
        department_id,
        parent_dept_id,
        department_name,
        budget
    FROM departments
    WHERE parent_dept_id IS NULL

    UNION ALL

    SELECT
        d.department_id,
        d.parent_dept_id,
        d.department_name,
        d.budget
    FROM departments d
    INNER JOIN dept_hierarchy dh ON d.parent_dept_id = dh.department_id
)
SELECT
    department_id,
    department_name,
    budget AS own_budget,
    (
        SELECT SUM(budget)
        FROM dept_hierarchy dh2
        WHERE dh2.department_id = dh.department_id
           OR dh2.parent_dept_id = dh.department_id
    ) AS total_budget_with_children
FROM dept_hierarchy dh;
```

### CASE Expressions

CASE provides conditional logic within SQL statements.

#### Simple CASE

```sql
-- Map codes to descriptions
SELECT
    employee_id,
    first_name,
    last_name,
    status_code,
    CASE status_code
        WHEN 'A' THEN 'Active'
        WHEN 'I' THEN 'Inactive'
        WHEN 'T' THEN 'Terminated'
        WHEN 'L' THEN 'Leave'
        ELSE 'Unknown'
    END AS status_description
FROM employees;
```

#### Searched CASE

```sql
-- Categorize based on conditions
SELECT
    product_id,
    product_name,
    price,
    CASE
        WHEN price < 10 THEN 'Budget'
        WHEN price < 50 THEN 'Standard'
        WHEN price < 200 THEN 'Premium'
        ELSE 'Luxury'
    END AS price_category,
    CASE
        WHEN stock_quantity = 0 THEN 'Out of Stock'
        WHEN stock_quantity < 10 THEN 'Low Stock'
        WHEN stock_quantity < 100 THEN 'In Stock'
        ELSE 'Well Stocked'
    END AS stock_status
FROM products;
```

#### CASE in Aggregations

```sql
-- Conditional counting and summing
SELECT
    department_id,
    COUNT(*) AS total_employees,
    COUNT(CASE WHEN salary > 100000 THEN 1 END) AS high_earners,
    COUNT(CASE WHEN hire_date >= DATE '2023-01-01' THEN 1 END) AS recent_hires,
    SUM(CASE WHEN status = 'FT' THEN salary ELSE 0 END) AS fulltime_payroll,
    SUM(CASE WHEN status = 'PT' THEN salary ELSE 0 END) AS parttime_payroll,
    AVG(CASE WHEN gender = 'F' THEN salary END) AS avg_female_salary,
    AVG(CASE WHEN gender = 'M' THEN salary END) AS avg_male_salary
FROM employees
GROUP BY department_id;
```

#### CASE in ORDER BY

```sql
-- Custom sorting logic
SELECT product_id, product_name, category, priority
FROM products
ORDER BY
    CASE priority
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
    END,
    category,
    product_name;
```

#### Pivoting with CASE

```sql
-- Transform rows to columns
SELECT
    employee_id,
    first_name || ' ' || last_name AS employee_name,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 1 THEN amount ELSE 0 END) AS jan_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 2 THEN amount ELSE 0 END) AS feb_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 3 THEN amount ELSE 0 END) AS mar_sales,
    SUM(amount) AS total_sales
FROM sales
WHERE EXTRACT(YEAR FROM sale_date) = 2024
GROUP BY employee_id, first_name, last_name;
```

### Boolean Data Type

SQL-99 introduced the BOOLEAN type.

```sql
-- Create table with boolean columns
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    newsletter_subscribed BOOLEAN DEFAULT TRUE
);

-- Insert boolean values
INSERT INTO users (user_id, username, email, is_active, is_admin)
VALUES (1, 'johndoe', 'john@example.com', TRUE, FALSE);

-- Query with boolean conditions
SELECT username, email
FROM users
WHERE is_active = TRUE
  AND is_admin = FALSE
  AND email_verified = TRUE;

-- Simpler boolean conditions
SELECT username
FROM users
WHERE is_active  -- TRUE is implicit
  AND NOT is_admin;  -- Negation

-- Boolean expressions
SELECT
    user_id,
    username,
    is_active AND email_verified AS can_login,
    is_admin OR is_moderator AS has_elevated_privileges
FROM users;

-- Update boolean values
UPDATE users
SET is_active = FALSE,
    newsletter_subscribed = FALSE
WHERE last_login < DATE '2023-01-01';
```

### Triggers

Triggers automatically execute code in response to database events.

#### INSERT Trigger

```sql
-- Audit trail trigger
CREATE TRIGGER audit_employee_insert
AFTER INSERT ON employees
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit (
        employee_id,
        action,
        action_date,
        new_salary
    ) VALUES (
        NEW.employee_id,
        'INSERT',
        CURRENT_TIMESTAMP,
        NEW.salary
    );
END;
```

#### UPDATE Trigger

```sql
-- Prevent salary decrease
CREATE TRIGGER prevent_salary_decrease
BEFORE UPDATE ON employees
FOR EACH ROW
WHEN (NEW.salary < OLD.salary)
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Salary cannot be decreased';
END;

-- Track changes
CREATE TRIGGER track_salary_changes
AFTER UPDATE ON employees
FOR EACH ROW
WHEN (NEW.salary <> OLD.salary)
BEGIN
    INSERT INTO salary_history (
        employee_id,
        old_salary,
        new_salary,
        change_date,
        changed_by
    ) VALUES (
        NEW.employee_id,
        OLD.salary,
        NEW.salary,
        CURRENT_TIMESTAMP,
        CURRENT_USER
    );
END;
```

#### DELETE Trigger

```sql
-- Soft delete implementation
CREATE TRIGGER soft_delete_employee
BEFORE DELETE ON employees
FOR EACH ROW
BEGIN
    INSERT INTO deleted_employees
    SELECT * FROM employees WHERE employee_id = OLD.employee_id;

    -- Optionally prevent actual deletion
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Use UPDATE to set is_deleted flag instead';
END;
```

### User-Defined Functions

```sql
-- Scalar function
CREATE FUNCTION calculate_tax(salary DECIMAL(10,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE tax DECIMAL(10,2);
    IF salary < 40000 THEN
        SET tax = salary * 0.10;
    ELSEIF salary < 80000 THEN
        SET tax = salary * 0.20;
    ELSE
        SET tax = salary * 0.30;
    END IF;
    RETURN tax;
END;

-- Usage
SELECT
    employee_id,
    first_name,
    salary,
    calculate_tax(salary) AS tax_amount,
    salary - calculate_tax(salary) AS net_salary
FROM employees;

-- Table-valued function
CREATE FUNCTION get_department_employees(dept_id INTEGER)
RETURNS TABLE (
    employee_id INTEGER,
    full_name VARCHAR(100),
    salary DECIMAL(10,2)
)
BEGIN
    RETURN SELECT
        employee_id,
        first_name || ' ' || last_name,
        salary
    FROM employees
    WHERE department_id = dept_id;
END;

-- Usage
SELECT * FROM get_department_employees(10);
```

### Stored Procedures

```sql
-- Procedure with parameters
CREATE PROCEDURE give_raise(
    IN emp_id INTEGER,
    IN raise_pct DECIMAL(5,2),
    OUT new_salary DECIMAL(10,2)
)
BEGIN
    DECLARE current_salary DECIMAL(10,2);

    -- Get current salary
    SELECT salary INTO current_salary
    FROM employees
    WHERE employee_id = emp_id;

    -- Calculate and update
    SET new_salary = current_salary * (1 + raise_pct / 100);

    UPDATE employees
    SET salary = new_salary
    WHERE employee_id = emp_id;

    -- Log the change
    INSERT INTO salary_changes (employee_id, old_salary, new_salary, change_date)
    VALUES (emp_id, current_salary, new_salary, CURRENT_TIMESTAMP);
END;

-- Call procedure
CALL give_raise(101, 5.0, @new_sal);
SELECT @new_sal;
```

### Large Objects (LOBs)

```sql
-- BLOB and CLOB types
CREATE TABLE documents (
    document_id INTEGER PRIMARY KEY,
    title VARCHAR(200),
    document_text CLOB,  -- Character Large Object
    file_data BLOB,      -- Binary Large Object
    created_date TIMESTAMP
);

-- Insert CLOB
INSERT INTO documents (document_id, title, document_text)
VALUES (1, 'Terms of Service', 'Very long text content...');

-- Insert BLOB (database-specific syntax varies)
-- Example conceptual syntax
INSERT INTO documents (document_id, title, file_data)
VALUES (2, 'Logo Image', LOAD_FILE('/path/to/logo.png'));

-- Query LOBs
SELECT document_id, title, LENGTH(document_text) AS text_length
FROM documents;
```

### Enhanced String Functions

```sql
-- SIMILAR TO (regular expression pattern matching)
SELECT product_name
FROM products
WHERE product_name SIMILAR TO '%(phone|tablet)%';

-- Character substring
SELECT
    product_name,
    SUBSTRING(product_name FROM 1 FOR 10) AS short_name,
    POSITION('Pro' IN product_name) AS pro_position
FROM products;

-- String concatenation
SELECT first_name || ' ' || last_name AS full_name
FROM employees;

-- OVERLAY (replace portion of string)
SELECT OVERLAY(phone_number PLACING 'XXX' FROM 1 FOR 3) AS masked_phone
FROM customers;
```

### Enhanced Date/Time

```sql
-- EXTRACT function
SELECT
    order_id,
    order_date,
    EXTRACT(YEAR FROM order_date) AS order_year,
    EXTRACT(MONTH FROM order_date) AS order_month,
    EXTRACT(DAY FROM order_date) AS order_day,
    EXTRACT(HOUR FROM order_timestamp) AS order_hour
FROM orders;

-- CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP
SELECT
    CURRENT_DATE AS today,
    CURRENT_TIME AS now_time,
    CURRENT_TIMESTAMP AS right_now;

-- Date arithmetic
SELECT
    order_date,
    order_date + INTERVAL '30' DAY AS due_date,
    order_date - INTERVAL '1' MONTH AS previous_month
FROM orders;
```

## Database-Specific Implementations

### PostgreSQL
- **Compliance**: Excellent SQL-99 support
- **CTEs**: Full support including RECURSIVE
- **Triggers**: Rich trigger system with multiple events
- **Functions**: PL/pgSQL and other languages

```sql
-- PostgreSQL recursive CTE
WITH RECURSIVE numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM numbers WHERE n < 10
)
SELECT * FROM numbers;
```

### MySQL
- **Compliance**: Good support from MySQL 8.0+
- **CTEs**: Supported in 8.0+ (WITH clause)
- **Recursive**: WITH RECURSIVE in 8.0+
- **Triggers**: Full support with some syntax differences

```sql
-- MySQL trigger syntax
DELIMITER //
CREATE TRIGGER before_employee_update
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    IF NEW.salary < OLD.salary THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Salary cannot decrease';
    END IF;
END//
DELIMITER ;
```

### SQL Server
- **Compliance**: Strong SQL-99 support
- **CTEs**: Full support (introduced in SQL Server 2005)
- **Recursive**: WITH clause supports recursion
- **Triggers**: INSTEAD OF and AFTER triggers

```sql
-- SQL Server CTE syntax
WITH EmployeeCTE AS (
    SELECT EmployeeID, FirstName, ManagerID, 1 AS Level
    FROM Employees
    WHERE ManagerID IS NULL
    UNION ALL
    SELECT e.EmployeeID, e.FirstName, e.ManagerID, Level + 1
    FROM Employees e
    INNER JOIN EmployeeCTE cte ON e.ManagerID = cte.EmployeeID
)
SELECT * FROM EmployeeCTE;
```

### Oracle
- **Compliance**: Very strong SQL-99 support
- **CTEs**: Full WITH clause support
- **Recursive**: CONNECT BY (proprietary) and WITH RECURSIVE
- **Triggers**: Comprehensive trigger system

```sql
-- Oracle CONNECT BY (pre-SQL-99 proprietary)
SELECT employee_id, last_name, manager_id, LEVEL
FROM employees
START WITH manager_id IS NULL
CONNECT BY PRIOR employee_id = manager_id
ORDER SIBLINGS BY last_name;

-- Oracle WITH clause (SQL-99)
WITH dept_costs AS (
    SELECT department_id, SUM(salary) AS total
    FROM employees
    GROUP BY department_id
)
SELECT * FROM dept_costs WHERE total > 100000;
```

### SQLite
- **Compliance**: Good core SQL-99 support
- **CTEs**: Full WITH support including RECURSIVE
- **Triggers**: Comprehensive trigger support
- **Limitations**: No stored procedures, limited data types

```sql
-- SQLite recursive CTE
WITH RECURSIVE cnt(x) AS (
    SELECT 1
    UNION ALL
    SELECT x+1 FROM cnt WHERE x < 10
)
SELECT x FROM cnt;
```

## Common Patterns

### Hierarchical Data Queries

```sql
-- Organization chart with levels
WITH RECURSIVE org_chart AS (
    SELECT
        employee_id,
        first_name || ' ' || last_name AS name,
        manager_id,
        title,
        0 AS level,
        CAST(last_name AS VARCHAR(500)) AS sort_path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    SELECT
        e.employee_id,
        e.first_name || ' ' || e.last_name,
        e.manager_id,
        e.title,
        oc.level + 1,
        CAST(oc.sort_path || ' > ' || e.last_name AS VARCHAR(500))
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT
    REPEAT('  ', level) || name AS hierarchy,
    title,
    level
FROM org_chart
ORDER BY sort_path;
```

### Running Totals with CTEs

```sql
-- Daily running total
WITH daily_sales AS (
    SELECT
        sale_date,
        SUM(amount) AS daily_total
    FROM sales
    GROUP BY sale_date
)
SELECT
    ds1.sale_date,
    ds1.daily_total,
    (
        SELECT SUM(ds2.daily_total)
        FROM daily_sales ds2
        WHERE ds2.sale_date <= ds1.sale_date
    ) AS running_total
FROM daily_sales ds1
ORDER BY ds1.sale_date;
```

### Conditional Aggregation

```sql
-- Pivot data using CASE
SELECT
    EXTRACT(YEAR FROM order_date) AS year,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 1 THEN amount ELSE 0 END) AS q1,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 2 THEN amount ELSE 0 END) AS q2,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 3 THEN amount ELSE 0 END) AS q3,
    SUM(CASE WHEN EXTRACT(QUARTER FROM order_date) = 4 THEN amount ELSE 0 END) AS q4,
    SUM(amount) AS yearly_total
FROM orders
GROUP BY EXTRACT(YEAR FROM order_date)
ORDER BY year;
```

## Best Practices

### Use CTEs for Clarity

```sql
-- Good: Readable and maintainable
WITH
active_customers AS (
    SELECT customer_id, name
    FROM customers
    WHERE status = 'Active'
),
recent_orders AS (
    SELECT customer_id, COUNT(*) AS order_count
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '90' DAY
    GROUP BY customer_id
)
SELECT ac.name, COALESCE(ro.order_count, 0) AS orders
FROM active_customers ac
LEFT JOIN recent_orders ro ON ac.customer_id = ro.customer_id;
```

### Control Recursion Depth

```sql
-- Prevent infinite recursion
WITH RECURSIVE paths AS (
    SELECT node_id, parent_id, 1 AS depth
    FROM tree
    WHERE parent_id IS NULL

    UNION ALL

    SELECT t.node_id, t.parent_id, p.depth + 1
    FROM tree t
    JOIN paths p ON t.parent_id = p.node_id
    WHERE p.depth < 100  -- Safety limit
)
SELECT * FROM paths;
```

### Use CASE for Data Quality

```sql
-- Clean and standardize data
SELECT
    customer_id,
    CASE
        WHEN TRIM(email) = '' THEN NULL
        WHEN email NOT LIKE '%@%.%' THEN NULL
        ELSE LOWER(TRIM(email))
    END AS cleaned_email,
    CASE
        WHEN phone ~ '^[0-9]{10}$' THEN phone
        WHEN phone ~ '^[0-9]{3}-[0-9]{3}-[0-9]{4}$' THEN REPLACE(phone, '-', '')
        ELSE NULL
    END AS cleaned_phone
FROM customers;
```

## Common Pitfalls

### CTE Materialization

```sql
-- CTE may be evaluated multiple times
WITH expensive_cte AS (
    SELECT * FROM large_table WHERE complex_condition
)
SELECT * FROM expensive_cte
UNION ALL
SELECT * FROM expensive_cte WHERE another_condition;

-- Solution: Use temporary table if performance issues
CREATE TEMPORARY TABLE temp_result AS
SELECT * FROM large_table WHERE complex_condition;
```

### Recursive Depth Limits

Different databases have different default recursion limits:
- PostgreSQL: Configurable, no hard limit
- MySQL: `max_execution_time` and `cte_max_recursion_depth`
- SQL Server: 100 by default (use MAXRECURSION hint)
- Oracle: No explicit limit but resource-constrained

### Boolean in Older Databases

```sql
-- Some databases lack native BOOLEAN
-- Use alternatives:
CREATE TABLE users (
    user_id INTEGER,
    is_active CHAR(1) CHECK (is_active IN ('Y', 'N')),  -- Char flag
    is_admin SMALLINT CHECK (is_admin IN (0, 1))        -- Integer flag
);
```

## Migration Considerations

### From SQL-92 to SQL-99

```sql
-- SQL-92: Nested subqueries
SELECT e.*
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
);

-- SQL-99: CTE (clearer)
WITH dept_averages AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.*
FROM employees e
JOIN dept_averages da ON e.department_id = da.department_id
WHERE e.salary > da.avg_salary;
```

## Performance Considerations

### CTE vs Subquery

CTEs and subqueries can have different performance characteristics:
- CTEs may be materialized (computed once)
- Subqueries might be executed multiple times
- Database optimizer makes the decision
- Test both approaches for large datasets

### Recursive Query Optimization

```sql
-- Add filtering early to reduce iterations
WITH RECURSIVE hierarchy AS (
    SELECT node_id, parent_id, 1 AS level
    FROM tree
    WHERE category = 'Electronics'  -- Filter at anchor

    UNION ALL

    SELECT t.node_id, t.parent_id, h.level + 1
    FROM tree t
    JOIN hierarchy h ON t.parent_id = h.node_id
    WHERE t.category = 'Electronics'  -- Filter at recursion
      AND h.level < 10
)
SELECT * FROM hierarchy;
```

## See Also

- [SQL Standards Overview](../) - All SQL standards
- [SQL-92](../sql-1992/) - Previous standard
- [SQL:2003](../sql-2003/) - Next standard with window functions
- [Common Table Expressions](../../ctes/) - Detailed CTE guide
- [Recursive Queries](../../recursive/) - Recursion patterns
- [CASE Expressions](../../case/) - Conditional logic

## External Resources

- [ISO/IEC 9075:1999](https://www.iso.org/standard/26197.html) - Official standard
- [Modern SQL - WITH Clause](https://modern-sql.com/feature/with) - SQL-99 features explained
- Database vendor documentation for SQL-99 features
