---
title: Oracle Database
description: >-
  Comprehensive guide to Oracle Database - Enterprise-grade relational database
  management system
difficulty: intermediate
tags:
  - databases
  - oracle
  - enterprise
  - plsql
---

# Oracle Database

## Overview

Oracle Database is a multi-model database management system produced and marketed by Oracle Corporation. It is a database commonly used for running online transaction processing (OLTP), data warehousing (DW), and mixed database workloads. Oracle Database is one of the most trusted and widely-used relational database engines.

### Key Features

- **Enterprise-Grade Reliability**: Industry-leading uptime and data protection
- **Advanced Security**: Transparent Data Encryption, Database Vault, and Label Security
- **High Availability**: Real Application Clusters (RAC), Data Guard, and Active Data Guard
- **Scalability**: Support for databases up to petabytes in size
- **PL/SQL**: Powerful procedural language for database programming
- **Multitenant Architecture**: Container and pluggable databases
- **In-Memory Database**: In-Memory Column Store for extreme performance
- **Advanced Analytics**: Built-in machine learning and spatial analytics
- **Cross-Platform**: Available on Linux, Windows, Unix, and cloud platforms

## Getting Started

### Installation

::: code-group

```bash [Linux (Oracle Linux)]
# Download Oracle Database from Oracle website
# https://www.oracle.com/database/technologies/oracle-database-software-downloads.html

# Install prerequisites
sudo yum install -y oracle-database-preinstall-19c

# Install Oracle Database RPM
sudo yum -y localinstall oracle-database-ee-19c-1.0-1.x86_64.rpm

# Create and configure database
sudo /etc/init.d/oracledb_ORCLCDB-19c configure
```

```bash [Docker]
# Pull Oracle Database Express Edition (free)
docker pull container-registry.oracle.com/database/express:latest

# Run Oracle XE
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -p 5500:5500 \
  -e ORACLE_PWD=YourPassword123 \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  container-registry.oracle.com/database/express:latest

# Connect after container is ready (takes a few minutes)
docker logs -f oracle-xe
```

```bash [Oracle Cloud]
# Use Oracle Autonomous Database (fully managed)
# https://cloud.oracle.com/en_US/database/atp

# Autonomous Transaction Processing or Autonomous Data Warehouse
# Fully automated provisioning, patching, and upgrades
```

:::

### Connecting

```bash
# Using SQL*Plus (command-line tool)
sqlplus system/password@localhost:1521/XEPDB1

# Using SQL Developer (GUI)
# Download from: https://www.oracle.com/database/sqldeveloper/

# Using SQLcl (modern command-line)
sql system/password@localhost:1521/XEPDB1

# Connection string format
# For service name:
system/password@//hostname:1521/service_name

# For SID:
system/password@hostname:1521:SID

# TNS connection
system/password@TNSNAME
```

## Oracle-Specific Features

### PL/SQL Programming

```sql
-- PL/SQL block structure
DECLARE
    v_employee_name VARCHAR2(100);
    v_salary NUMBER;
    v_bonus NUMBER;
BEGIN
    -- Select into variables
    SELECT first_name || ' ' || last_name, salary
    INTO v_employee_name, v_salary
    FROM employees
    WHERE employee_id = 100;

    -- Calculate bonus
    v_bonus := v_salary * 0.10;

    -- Display results
    DBMS_OUTPUT.PUT_LINE('Employee: ' || v_employee_name);
    DBMS_OUTPUT.PUT_LINE('Bonus: ' || v_bonus);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Employee not found');
    WHEN TOO_MANY_ROWS THEN
        DBMS_OUTPUT.PUT_LINE('Multiple employees found');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
END;
/

-- Stored Procedures
CREATE OR REPLACE PROCEDURE update_employee_salary(
    p_employee_id IN NUMBER,
    p_percentage IN NUMBER,
    p_new_salary OUT NUMBER
) IS
    v_current_salary NUMBER;
BEGIN
    -- Get current salary
    SELECT salary INTO v_current_salary
    FROM employees
    WHERE employee_id = p_employee_id
    FOR UPDATE;

    -- Calculate new salary
    p_new_salary := v_current_salary * (1 + p_percentage / 100);

    -- Update salary
    UPDATE employees
    SET salary = p_new_salary
    WHERE employee_id = p_employee_id;

    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20001, 'Employee not found');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- Execute procedure
DECLARE
    v_new_salary NUMBER;
BEGIN
    update_employee_salary(100, 10, v_new_salary);
    DBMS_OUTPUT.PUT_LINE('New salary: ' || v_new_salary);
END;
/

-- Functions
CREATE OR REPLACE FUNCTION get_employee_bonus(
    p_employee_id IN NUMBER
) RETURN NUMBER IS
    v_salary NUMBER;
    v_bonus NUMBER;
BEGIN
    SELECT salary INTO v_salary
    FROM employees
    WHERE employee_id = p_employee_id;

    -- Calculate bonus based on salary
    IF v_salary > 10000 THEN
        v_bonus := v_salary * 0.15;
    ELSIF v_salary > 5000 THEN
        v_bonus := v_salary * 0.10;
    ELSE
        v_bonus := v_salary * 0.05;
    END IF;

    RETURN v_bonus;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

-- Use function in query
SELECT employee_id, first_name, salary,
       get_employee_bonus(employee_id) AS bonus
FROM employees;
```

### Packages

```sql
-- Package specification (public interface)
CREATE OR REPLACE PACKAGE employee_pkg IS
    -- Constants
    c_max_salary CONSTANT NUMBER := 100000;

    -- Public procedures and functions
    PROCEDURE hire_employee(
        p_first_name VARCHAR2,
        p_last_name VARCHAR2,
        p_email VARCHAR2,
        p_salary NUMBER,
        p_employee_id OUT NUMBER
    );

    FUNCTION get_department_total_salary(
        p_department_id NUMBER
    ) RETURN NUMBER;

    PROCEDURE fire_employee(p_employee_id NUMBER);
END employee_pkg;
/

-- Package body (implementation)
CREATE OR REPLACE PACKAGE BODY employee_pkg IS
    -- Private variable
    g_employee_count NUMBER := 0;

    -- Private function
    FUNCTION validate_salary(p_salary NUMBER) RETURN BOOLEAN IS
    BEGIN
        RETURN p_salary > 0 AND p_salary <= c_max_salary;
    END;

    -- Public procedure implementation
    PROCEDURE hire_employee(
        p_first_name VARCHAR2,
        p_last_name VARCHAR2,
        p_email VARCHAR2,
        p_salary NUMBER,
        p_employee_id OUT NUMBER
    ) IS
    BEGIN
        IF NOT validate_salary(p_salary) THEN
            RAISE_APPLICATION_ERROR(-20001, 'Invalid salary');
        END IF;

        INSERT INTO employees (first_name, last_name, email, salary, hire_date)
        VALUES (p_first_name, p_last_name, p_email, p_salary, SYSDATE)
        RETURNING employee_id INTO p_employee_id;

        g_employee_count := g_employee_count + 1;
        COMMIT;
    END;

    -- Public function implementation
    FUNCTION get_department_total_salary(
        p_department_id NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER;
    BEGIN
        SELECT SUM(salary) INTO v_total
        FROM employees
        WHERE department_id = p_department_id;

        RETURN NVL(v_total, 0);
    END;

    -- Public procedure implementation
    PROCEDURE fire_employee(p_employee_id NUMBER) IS
    BEGIN
        DELETE FROM employees WHERE employee_id = p_employee_id;
        g_employee_count := g_employee_count - 1;
        COMMIT;
    END;
END employee_pkg;
/

-- Use package
DECLARE
    v_new_emp_id NUMBER;
BEGIN
    employee_pkg.hire_employee('John', 'Doe', 'john@example.com', 50000, v_new_emp_id);
    DBMS_OUTPUT.PUT_LINE('New employee ID: ' || v_new_emp_id);
END;
/
```

### Triggers

```sql
-- Before INSERT trigger
CREATE OR REPLACE TRIGGER emp_before_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    -- Auto-generate employee ID if not provided
    IF :NEW.employee_id IS NULL THEN
        SELECT emp_seq.NEXTVAL INTO :NEW.employee_id FROM dual;
    END IF;

    -- Set default hire date
    IF :NEW.hire_date IS NULL THEN
        :NEW.hire_date := SYSDATE;
    END IF;

    -- Validate email
    IF :NEW.email NOT LIKE '%@%' THEN
        RAISE_APPLICATION_ERROR(-20001, 'Invalid email format');
    END IF;
END;
/

-- After UPDATE trigger for audit logging
CREATE OR REPLACE TRIGGER emp_salary_audit
AFTER UPDATE OF salary ON employees
FOR EACH ROW
BEGIN
    INSERT INTO salary_audit (
        employee_id,
        old_salary,
        new_salary,
        changed_by,
        changed_date
    ) VALUES (
        :NEW.employee_id,
        :OLD.salary,
        :NEW.salary,
        USER,
        SYSDATE
    );
END;
/

-- Instead of trigger for views
CREATE OR REPLACE TRIGGER emp_dept_view_insert
INSTEAD OF INSERT ON emp_dept_view
FOR EACH ROW
BEGIN
    -- Insert into employees table
    INSERT INTO employees (first_name, last_name, email, salary, department_id)
    VALUES (:NEW.first_name, :NEW.last_name, :NEW.email, :NEW.salary, :NEW.department_id);
END;
/

-- Statement-level trigger
CREATE OR REPLACE TRIGGER emp_statement_trigger
AFTER DELETE ON employees
DECLARE
    v_deleted_count NUMBER;
BEGIN
    v_deleted_count := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('Deleted ' || v_deleted_count || ' employees');
END;
/
```

### Sequences

```sql
-- Create sequence
CREATE SEQUENCE emp_seq
    START WITH 1000
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- Use sequence
INSERT INTO employees (employee_id, first_name, last_name, email)
VALUES (emp_seq.NEXTVAL, 'Jane', 'Smith', 'jane@example.com');

-- Get current and next values
SELECT emp_seq.CURRVAL FROM dual;  -- Current value
SELECT emp_seq.NEXTVAL FROM dual;  -- Next value

-- Alter sequence
ALTER SEQUENCE emp_seq INCREMENT BY 10;

-- Drop sequence
DROP SEQUENCE emp_seq;
```

### Analytical Functions

```sql
-- Advanced analytical queries
SELECT
    employee_id,
    first_name,
    department_id,
    salary,
    -- Ranking functions
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS row_num,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dense_rank,
    NTILE(4) OVER (PARTITION BY department_id ORDER BY salary) AS quartile,
    -- Window functions
    LAG(salary, 1) OVER (PARTITION BY department_id ORDER BY salary) AS prev_salary,
    LEAD(salary, 1) OVER (PARTITION BY department_id ORDER BY salary) AS next_salary,
    FIRST_VALUE(salary) OVER (
        PARTITION BY department_id
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS max_dept_salary,
    LAST_VALUE(salary) OVER (
        PARTITION BY department_id
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS min_dept_salary,
    -- Aggregate functions
    SUM(salary) OVER (PARTITION BY department_id) AS dept_total_salary,
    AVG(salary) OVER (PARTITION BY department_id) AS dept_avg_salary,
    COUNT(*) OVER (PARTITION BY department_id) AS dept_employee_count,
    -- Ratio functions
    RATIO_TO_REPORT(salary) OVER (PARTITION BY department_id) AS salary_ratio,
    -- Cumulative aggregates
    SUM(salary) OVER (
        PARTITION BY department_id
        ORDER BY employee_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM employees;

-- Windowing with RANGE
SELECT
    employee_id,
    hire_date,
    salary,
    AVG(salary) OVER (
        ORDER BY hire_date
        RANGE BETWEEN INTERVAL '1' YEAR PRECEDING AND CURRENT ROW
    ) AS avg_salary_last_year
FROM employees;
```

### Hierarchical Queries

```sql
-- CONNECT BY (Oracle-specific hierarchical query)
SELECT
    LEVEL,
    employee_id,
    first_name || ' ' || last_name AS employee_name,
    manager_id,
    LPAD(' ', (LEVEL - 1) * 2) || first_name AS indented_name,
    SYS_CONNECT_BY_PATH(first_name, '/') AS path
FROM employees
START WITH manager_id IS NULL
CONNECT BY PRIOR employee_id = manager_id
ORDER SIBLINGS BY first_name;

-- Prevent cycles
SELECT
    employee_id,
    first_name,
    manager_id,
    LEVEL
FROM employees
START WITH manager_id IS NULL
CONNECT BY NOCYCLE PRIOR employee_id = manager_id;

-- WITH clause (recursive CTE - Oracle 11g R2+)
WITH employee_hierarchy (employee_id, first_name, manager_id, level_num) AS (
    -- Anchor member
    SELECT employee_id, first_name, manager_id, 1 AS level_num
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive member
    SELECT e.employee_id, e.first_name, e.manager_id, eh.level_num + 1
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy
ORDER BY level_num, first_name;
```

### Partitioning

```sql
-- Range partitioning
CREATE TABLE sales (
    sale_id NUMBER,
    sale_date DATE,
    amount NUMBER,
    product_id NUMBER
)
PARTITION BY RANGE (sale_date) (
    PARTITION sales_q1_2024 VALUES LESS THAN (TO_DATE('2024-04-01', 'YYYY-MM-DD')),
    PARTITION sales_q2_2024 VALUES LESS THAN (TO_DATE('2024-07-01', 'YYYY-MM-DD')),
    PARTITION sales_q3_2024 VALUES LESS THAN (TO_DATE('2024-10-01', 'YYYY-MM-DD')),
    PARTITION sales_q4_2024 VALUES LESS THAN (TO_DATE('2025-01-01', 'YYYY-MM-DD'))
);

-- List partitioning
CREATE TABLE customers (
    customer_id NUMBER,
    customer_name VARCHAR2(100),
    region VARCHAR2(50)
)
PARTITION BY LIST (region) (
    PARTITION customers_north VALUES ('North', 'Northeast'),
    PARTITION customers_south VALUES ('South', 'Southeast'),
    PARTITION customers_west VALUES ('West', 'Southwest'),
    PARTITION customers_east VALUES ('East')
);

-- Hash partitioning
CREATE TABLE orders (
    order_id NUMBER,
    customer_id NUMBER,
    order_date DATE
)
PARTITION BY HASH (customer_id)
PARTITIONS 4;

-- Composite partitioning (range-hash)
CREATE TABLE transactions (
    trans_id NUMBER,
    trans_date DATE,
    customer_id NUMBER,
    amount NUMBER
)
PARTITION BY RANGE (trans_date)
SUBPARTITION BY HASH (customer_id) SUBPARTITIONS 4 (
    PARTITION trans_2024_q1 VALUES LESS THAN (TO_DATE('2024-04-01', 'YYYY-MM-DD')),
    PARTITION trans_2024_q2 VALUES LESS THAN (TO_DATE('2024-07-01', 'YYYY-MM-DD')),
    PARTITION trans_2024_q3 VALUES LESS THAN (TO_DATE('2024-10-01', 'YYYY-MM-DD')),
    PARTITION trans_2024_q4 VALUES LESS THAN (TO_DATE('2025-01-01', 'YYYY-MM-DD'))
);

-- Query partition information
SELECT table_name, partition_name, high_value, num_rows
FROM user_tab_partitions
WHERE table_name = 'SALES'
ORDER BY partition_position;

-- Add partition
ALTER TABLE sales ADD PARTITION sales_q1_2025
VALUES LESS THAN (TO_DATE('2025-04-01', 'YYYY-MM-DD'));

-- Drop partition
ALTER TABLE sales DROP PARTITION sales_q1_2024;

-- Truncate partition
ALTER TABLE sales TRUNCATE PARTITION sales_q2_2024;
```

### Materialized Views

```sql
-- Create materialized view with refresh
CREATE MATERIALIZED VIEW emp_dept_summary
BUILD IMMEDIATE
REFRESH FAST ON COMMIT
ENABLE QUERY REWRITE
AS
SELECT
    d.department_id,
    d.department_name,
    COUNT(*) AS employee_count,
    SUM(e.salary) AS total_salary,
    AVG(e.salary) AS avg_salary
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
GROUP BY d.department_id, d.department_name;

-- Create materialized view log for fast refresh
CREATE MATERIALIZED VIEW LOG ON employees
WITH ROWID, SEQUENCE (department_id, salary)
INCLUDING NEW VALUES;

CREATE MATERIALIZED VIEW LOG ON departments
WITH ROWID, SEQUENCE (department_id, department_name)
INCLUDING NEW VALUES;

-- Refresh materialized view
EXEC DBMS_MVIEW.REFRESH('EMP_DEPT_SUMMARY', 'C');  -- Complete refresh
EXEC DBMS_MVIEW.REFRESH('EMP_DEPT_SUMMARY', 'F');  -- Fast refresh

-- Query materialized view
SELECT * FROM emp_dept_summary WHERE department_name = 'Sales';

-- Drop materialized view
DROP MATERIALIZED VIEW emp_dept_summary;
```

### Virtual Columns

```sql
-- Create table with virtual columns
CREATE TABLE products (
    product_id NUMBER PRIMARY KEY,
    product_name VARCHAR2(100),
    price NUMBER(10,2),
    tax_rate NUMBER(4,2) DEFAULT 0.08,
    -- Virtual columns
    price_with_tax NUMBER(10,2) GENERATED ALWAYS AS (price * (1 + tax_rate)) VIRTUAL,
    discount_price NUMBER(10,2) GENERATED ALWAYS AS (price * 0.9) VIRTUAL
);

-- Insert data (virtual columns calculated automatically)
INSERT INTO products (product_id, product_name, price)
VALUES (1, 'Laptop', 1000);

-- Query virtual columns
SELECT product_name, price, price_with_tax, discount_price
FROM products;

-- Index on virtual column
CREATE INDEX idx_price_with_tax ON products (price_with_tax);
```

## Advanced Features

### Flashback Technology

```sql
-- Flashback Query (query as of a point in time)
SELECT * FROM employees
AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '15' MINUTE)
WHERE employee_id = 100;

-- Flashback Version Query
SELECT versions_starttime, versions_endtime, versions_operation,
       employee_id, first_name, salary
FROM employees
VERSIONS BETWEEN TIMESTAMP
    (SYSTIMESTAMP - INTERVAL '1' HOUR) AND SYSTIMESTAMP
WHERE employee_id = 100;

-- Flashback Transaction Query
SELECT operation, logon_user, undo_sql
FROM flashback_transaction_query
WHERE table_name = 'EMPLOYEES'
  AND xid = HEXTORAW('0A001B00C5020000');

-- Flashback Table
FLASHBACK TABLE employees TO TIMESTAMP
    (SYSTIMESTAMP - INTERVAL '30' MINUTE);

-- Flashback Drop (recover dropped table)
FLASHBACK TABLE employees TO BEFORE DROP;

-- Enable row movement (required for flashback table)
ALTER TABLE employees ENABLE ROW MOVEMENT;
```

### Oracle Text (Full-Text Search)

```sql
-- Create text index
CREATE INDEX idx_product_description
ON products(description)
INDEXTYPE IS CTXSYS.CONTEXT;

-- Full-text search using CONTAINS
SELECT product_id, product_name, description
FROM products
WHERE CONTAINS(description, 'laptop AND wireless', 1) > 0;

-- Search with operators
SELECT product_id, product_name
FROM products
WHERE CONTAINS(description, 'laptop NEAR wireless', 1) > 0;

-- Fuzzy search
SELECT product_id, product_name
FROM products
WHERE CONTAINS(description, 'fuzzy(laptop)', 1) > 0;

-- Score results
SELECT SCORE(1), product_id, product_name
FROM products
WHERE CONTAINS(description, 'laptop', 1) > 0
ORDER BY SCORE(1) DESC;

-- Sync text index
EXEC CTX_DDL.SYNC_INDEX('idx_product_description');
```

### JSON Support (12c+)

```sql
-- Create table with JSON column
CREATE TABLE customer_data (
    customer_id NUMBER PRIMARY KEY,
    customer_info VARCHAR2(4000) CHECK (customer_info IS JSON)
);

-- Insert JSON data
INSERT INTO customer_data VALUES (1, '{
    "name": "John Doe",
    "email": "john@example.com",
    "address": {
        "street": "123 Main St",
        "city": "New York",
        "zip": "10001"
    },
    "phones": ["555-1234", "555-5678"]
}');

-- Query JSON data
SELECT
    customer_id,
    JSON_VALUE(customer_info, '$.name') AS customer_name,
    JSON_VALUE(customer_info, '$.email') AS email,
    JSON_VALUE(customer_info, '$.address.city') AS city
FROM customer_data;

-- Query JSON arrays
SELECT
    customer_id,
    jt.phone_number
FROM customer_data,
JSON_TABLE(customer_info, '$.phones[*]'
    COLUMNS (phone_number VARCHAR2(20) PATH '$')
) jt;

-- JSON_EXISTS
SELECT customer_id
FROM customer_data
WHERE JSON_EXISTS(customer_info, '$.address.city?(@ == "New York")');

-- Update JSON
UPDATE customer_data
SET customer_info = JSON_MERGEPATCH(
    customer_info,
    '{"status": "active", "updated": "2024-01-15"}'
)
WHERE customer_id = 1;
```

### XML Support

```sql
-- Create XMLType column
CREATE TABLE documents (
    doc_id NUMBER PRIMARY KEY,
    doc_content XMLType
);

-- Insert XML data
INSERT INTO documents VALUES (1, XMLType('
<book>
    <title>Oracle Database Guide</title>
    <author>John Smith</author>
    <year>2024</year>
    <price>49.99</price>
</book>'));

-- Query XML using XPath
SELECT
    doc_id,
    EXTRACTVALUE(doc_content, '/book/title') AS title,
    EXTRACTVALUE(doc_content, '/book/author') AS author,
    EXTRACTVALUE(doc_content, '/book/price') AS price
FROM documents;

-- Query XML using XMLQuery
SELECT
    doc_id,
    XMLQuery('/book/title/text()' PASSING doc_content RETURNING CONTENT).getStringVal() AS title
FROM documents;

-- Update XML
UPDATE documents
SET doc_content = UPDATEXML(
    doc_content,
    '/book/price/text()',
    '59.99'
)
WHERE doc_id = 1;

-- XMLTable for complex queries
SELECT jt.*
FROM documents,
XMLTable('/book'
    PASSING doc_content
    COLUMNS
        title VARCHAR2(100) PATH 'title',
        author VARCHAR2(100) PATH 'author',
        year NUMBER PATH 'year',
        price NUMBER PATH 'price'
) jt;
```

### In-Memory Column Store

```sql
-- Enable table for in-memory
ALTER TABLE employees INMEMORY;

-- Specify in-memory options
ALTER TABLE sales INMEMORY
    MEMCOMPRESS FOR QUERY
    PRIORITY HIGH;

-- Query in-memory objects
SELECT segment_name, bytes, inmemory_size, bytes_not_populated
FROM v$im_segments
WHERE segment_name = 'EMPLOYEES';

-- Disable in-memory
ALTER TABLE employees NO INMEMORY;
```

## Performance Optimization

### Execution Plans

```sql
-- Explain plan
EXPLAIN PLAN FOR
SELECT e.first_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE e.salary > 50000;

-- View execution plan
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Autotrace (SQL*Plus)
SET AUTOTRACE ON EXPLAIN
SELECT * FROM employees WHERE salary > 50000;

-- Display actual execution plan
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));

-- SQL Monitoring (for long-running queries)
SELECT DBMS_SQLTUNE.REPORT_SQL_MONITOR() FROM DUAL;
```

### Indexes

```sql
-- B-tree index (default)
CREATE INDEX idx_emp_salary ON employees(salary);

-- Unique index
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Composite index
CREATE INDEX idx_emp_dept_sal ON employees(department_id, salary);

-- Function-based index
CREATE INDEX idx_emp_upper_name ON employees(UPPER(last_name));

-- Bitmap index (for low-cardinality columns)
CREATE BITMAP INDEX idx_emp_gender ON employees(gender);

-- Reverse key index (for sequence-based keys)
CREATE INDEX idx_emp_id_rev ON employees(employee_id) REVERSE;

-- Descending index
CREATE INDEX idx_emp_sal_desc ON employees(salary DESC);

-- Invisible index (not used by optimizer)
CREATE INDEX idx_emp_hire_date ON employees(hire_date) INVISIBLE;

-- Make index visible
ALTER INDEX idx_emp_hire_date VISIBLE;

-- Index monitoring
ALTER INDEX idx_emp_salary MONITORING USAGE;

-- Check index usage
SELECT * FROM v$object_usage WHERE index_name = 'IDX_EMP_SALARY';

-- Rebuild index
ALTER INDEX idx_emp_salary REBUILD;

-- Drop index
DROP INDEX idx_emp_salary;
```

### Optimizer Hints

```sql
-- Force full table scan
SELECT /*+ FULL(e) */ *
FROM employees e
WHERE salary > 50000;

-- Force index usage
SELECT /*+ INDEX(e idx_emp_salary) */ *
FROM employees e
WHERE salary > 50000;

-- Parallel query
SELECT /*+ PARALLEL(e, 4) */ COUNT(*)
FROM employees e;

-- Use hash join
SELECT /*+ USE_HASH(e d) */
    e.first_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Use nested loops
SELECT /*+ USE_NL(e d) */
    e.first_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- First rows (optimize for quick initial results)
SELECT /*+ FIRST_ROWS(10) */ *
FROM employees
WHERE salary > 50000
ORDER BY salary DESC;

-- Append hint for direct-path insert
INSERT /*+ APPEND */ INTO employees_archive
SELECT * FROM employees WHERE hire_date < TO_DATE('2020-01-01', 'YYYY-MM-DD');
```

### Statistics

```sql
-- Gather table statistics
EXEC DBMS_STATS.GATHER_TABLE_STATS('HR', 'EMPLOYEES');

-- Gather schema statistics
EXEC DBMS_STATS.GATHER_SCHEMA_STATS('HR');

-- Gather database statistics
EXEC DBMS_STATS.GATHER_DATABASE_STATS;

-- View statistics
SELECT table_name, num_rows, blocks, avg_row_len, last_analyzed
FROM user_tables
WHERE table_name = 'EMPLOYEES';

-- Lock statistics (prevent automatic regathering)
EXEC DBMS_STATS.LOCK_TABLE_STATS('HR', 'EMPLOYEES');

-- Unlock statistics
EXEC DBMS_STATS.UNLOCK_TABLE_STATS('HR', 'EMPLOYEES');

-- Delete statistics
EXEC DBMS_STATS.DELETE_TABLE_STATS('HR', 'EMPLOYEES');
```

## Data Types

### Numeric Types

| Type          | Range           | Description                     |
| ------------- | --------------- | ------------------------------- |
| NUMBER(p,s)   | Variable        | Precision (p) and scale (s)     |
| INTEGER       | -2^31 to 2^31-1 | 38-digit integer                |
| FLOAT(p)      | Variable        | 126-digit precision             |
| BINARY_FLOAT  | 32-bit          | Single-precision floating point |
| BINARY_DOUBLE | 64-bit          | Double-precision floating point |

### Character Types

| Type         | Description             | Max Size                     |
| ------------ | ----------------------- | ---------------------------- |
| CHAR(n)      | Fixed-length            | 2000 bytes                   |
| VARCHAR2(n)  | Variable-length         | 4000 bytes (32767 in PL/SQL) |
| NCHAR(n)     | Fixed-length Unicode    | 2000 bytes                   |
| NVARCHAR2(n) | Variable-length Unicode | 4000 bytes                   |
| CLOB         | Character LOB           | 4 GB                         |
| NCLOB        | National character LOB  | 4 GB                         |
| LONG         | Long text (deprecated)  | 2 GB                         |

### Date/Time Types

| Type                           | Format                        | Range                            |
| ------------------------------ | ----------------------------- | -------------------------------- |
| DATE                           | DD-MON-YYYY HH24:MI:SS        | 01-Jan-4712 BC to 31-Dec-9999 AD |
| TIMESTAMP                      | DD-MON-YYYY HH24:MI:SS.FF     | More precise than DATE           |
| TIMESTAMP WITH TIME ZONE       | TIMESTAMP + TZ                | Includes time zone               |
| TIMESTAMP WITH LOCAL TIME ZONE | TIMESTAMP                     | Normalized to database TZ        |
| INTERVAL YEAR TO MONTH         | Years and months              | ±999,999,999 years               |
| INTERVAL DAY TO SECOND         | Days, hours, minutes, seconds | ±999,999,999 days                |

### Other Types

- **RAW(n)**: Binary data (2000 bytes)
- **BLOB**: Binary LOB (4 GB)
- **BFILE**: External file pointer
- **ROWID**: Physical row address
- **UROWID**: Universal row ID
- **XMLType**: XML documents
- **JSON**: JSON documents (21c+)

## Common Operations

### Database Management

```sql
-- Create pluggable database (12c+)
CREATE PLUGGABLE DATABASE pdb1
ADMIN USER pdb_admin IDENTIFIED BY password
FILE_NAME_CONVERT = ('/pdbseed/', '/pdb1/');

-- Open pluggable database
ALTER PLUGGABLE DATABASE pdb1 OPEN;

-- Switch to pluggable database
ALTER SESSION SET CONTAINER = pdb1;

-- Create tablespace
CREATE TABLESPACE users_ts
DATAFILE '/u01/app/oracle/oradata/ORCL/users01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE 500M;

-- Create temporary tablespace
CREATE TEMPORARY TABLESPACE temp_ts
TEMPFILE '/u01/app/oracle/oradata/ORCL/temp01.dbf'
SIZE 50M;

-- View tablespaces
SELECT tablespace_name, status, contents
FROM dba_tablespaces;

-- Drop tablespace
DROP TABLESPACE users_ts INCLUDING CONTENTS AND DATAFILES;
```

### User Management

```sql
-- Create user
CREATE USER john_doe
IDENTIFIED BY SecurePassword123
DEFAULT TABLESPACE users_ts
TEMPORARY TABLESPACE temp_ts
QUOTA 100M ON users_ts;

-- Grant privileges
GRANT CREATE SESSION TO john_doe;
GRANT CREATE TABLE TO john_doe;
GRANT CREATE VIEW TO john_doe;
GRANT CREATE PROCEDURE TO john_doe;

-- Grant role
GRANT CONNECT, RESOURCE TO john_doe;

-- Grant object privileges
GRANT SELECT, INSERT, UPDATE ON employees TO john_doe;
GRANT ALL PRIVILEGES ON departments TO john_doe;

-- Grant with admin option
GRANT CREATE USER TO john_doe WITH ADMIN OPTION;

-- Grant with grant option
GRANT SELECT ON employees TO john_doe WITH GRANT OPTION;

-- Revoke privileges
REVOKE CREATE TABLE FROM john_doe;

-- Change password
ALTER USER john_doe IDENTIFIED BY NewPassword456;

-- Lock/unlock user
ALTER USER john_doe ACCOUNT LOCK;
ALTER USER john_doe ACCOUNT UNLOCK;

-- Drop user
DROP USER john_doe CASCADE;
```

### Roles

```sql
-- Create role
CREATE ROLE app_developer;

-- Grant privileges to role
GRANT CREATE TABLE, CREATE VIEW, CREATE PROCEDURE TO app_developer;
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO app_developer;

-- Grant role to user
GRANT app_developer TO john_doe;

-- Set default role
ALTER USER john_doe DEFAULT ROLE app_developer;

-- View user roles
SELECT * FROM user_role_privs;

-- View role privileges
SELECT * FROM role_sys_privs WHERE role = 'APP_DEVELOPER';

-- Drop role
DROP ROLE app_developer;
```

### Backup and Recovery

```sql
-- Enable archive log mode
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Backup database (RMAN)
RMAN TARGET /
BACKUP DATABASE PLUS ARCHIVELOG;

-- Backup tablespace
BACKUP TABLESPACE users_ts;

-- Backup specific datafile
BACKUP DATAFILE '/u01/app/oracle/oradata/ORCL/users01.dbf';

-- List backups
LIST BACKUP SUMMARY;

-- Restore and recover
RESTORE DATABASE;
RECOVER DATABASE;

-- Point-in-time recovery
RUN {
    SET UNTIL TIME "TO_DATE('2024-01-15 12:00:00', 'YYYY-MM-DD HH24:MI:SS')";
    RESTORE DATABASE;
    RECOVER DATABASE;
}

-- Export data (Data Pump)
expdp system/password DIRECTORY=dump_dir DUMPFILE=employees.dmp TABLES=employees

-- Import data (Data Pump)
impdp system/password DIRECTORY=dump_dir DUMPFILE=employees.dmp TABLES=employees
```

## Security Features

### Data Encryption

```sql
-- Transparent Data Encryption (TDE)
-- Create wallet
ALTER SYSTEM SET ENCRYPTION KEY IDENTIFIED BY "wallet_password";

-- Encrypt tablespace
CREATE TABLESPACE secure_ts
DATAFILE '/u01/app/oracle/oradata/ORCL/secure01.dbf'
SIZE 100M
ENCRYPTION USING 'AES256'
DEFAULT STORAGE (ENCRYPT);

-- Encrypt column
CREATE TABLE secure_data (
    id NUMBER,
    ssn VARCHAR2(11) ENCRYPT USING 'AES256',
    credit_card VARCHAR2(16) ENCRYPT
);

-- Encrypt existing column
ALTER TABLE employees MODIFY (salary ENCRYPT);
```

### Virtual Private Database (VPD)

```sql
-- Create security policy function
CREATE OR REPLACE FUNCTION employee_security_policy(
    schema_var IN VARCHAR2,
    table_var IN VARCHAR2
) RETURN VARCHAR2 IS
    v_predicate VARCHAR2(400);
BEGIN
    -- Only show employees in user's department
    v_predicate := 'department_id = SYS_CONTEXT(''USERENV'', ''CLIENT_IDENTIFIER'')';
    RETURN v_predicate;
END;
/

-- Add policy to table
BEGIN
    DBMS_RLS.ADD_POLICY(
        object_schema => 'HR',
        object_name => 'EMPLOYEES',
        policy_name => 'EMP_POLICY',
        function_schema => 'HR',
        policy_function => 'employee_security_policy',
        statement_types => 'SELECT, UPDATE, DELETE'
    );
END;
/

-- Set client identifier
EXEC DBMS_SESSION.SET_IDENTIFIER('10');

-- Now queries automatically filter by department_id = 10
SELECT * FROM employees;
```

### Database Vault

```sql
-- Create realm to protect sensitive tables
BEGIN
    DVSYS.DBMS_MACADM.CREATE_REALM(
        realm_name => 'HR Realm',
        description => 'Protects HR tables',
        enabled => DBMS_MACUTL.G_YES,
        audit_options => DBMS_MACUTL.G_REALM_AUDIT_FAIL
    );
END;
/

-- Add tables to realm
BEGIN
    DVSYS.DBMS_MACADM.ADD_OBJECT_TO_REALM(
        realm_name => 'HR Realm',
        object_owner => 'HR',
        object_name => 'EMPLOYEES',
        object_type => 'TABLE'
    );
END;
/

-- Authorize user for realm
BEGIN
    DVSYS.DBMS_MACADM.ADD_AUTH_TO_REALM(
        realm_name => 'HR Realm',
        grantee => 'HR_MANAGER'
    );
END;
/
```

## High Availability

### Real Application Clusters (RAC)

```sql
-- View cluster database status
SELECT instance_name, status, active_state
FROM gv$instance;

-- View cluster database services
SELECT name, network_name
FROM dba_services;

-- Create service
BEGIN
    DBMS_SERVICE.CREATE_SERVICE(
        service_name => 'app_service',
        network_name => 'app_service.example.com'
    );
END;
/

-- Start service on instance
BEGIN
    DBMS_SERVICE.START_SERVICE('app_service', 'ORCL1');
END;
/
```

### Data Guard

```sql
-- View Data Guard configuration
SELECT database_role, protection_mode, protection_level
FROM v$database;

-- Switchover to standby
ALTER DATABASE COMMIT TO SWITCHOVER TO PHYSICAL STANDBY WITH SESSION SHUTDOWN;

-- Failover to standby
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE FINISH;
ALTER DATABASE ACTIVATE PHYSICAL STANDBY DATABASE;

-- View apply lag
SELECT name, value, unit, time_computed
FROM v$dataguard_stats
WHERE name IN ('apply lag', 'transport lag');
```

## Oracle vs Other Databases

| Feature             | Oracle                | PostgreSQL           | MySQL                    | SQL Server                |
| ------------------- | --------------------- | -------------------- | ------------------------ | ------------------------- |
| License             | Commercial (XE free)  | Open Source          | Open Source / Commercial | Commercial (Express free) |
| Platform            | Cross-platform        | Cross-platform       | Cross-platform           | Windows, Linux            |
| Procedural Language | PL/SQL                | PL/pgSQL             | Procedures               | T-SQL                     |
| Partitioning        | Advanced (all types)  | Range, List, Hash    | Range, List, Hash (8.0+) | Range, List, Hash         |
| Materialized Views  | Yes (refresh options) | Yes (manual refresh) | No                       | Indexed views             |
| Flashback           | Yes                   | No                   | No                       | Temporal tables           |
| RAC                 | Yes                   | No                   | NDB Cluster              | Always On                 |
| JSON Support        | Native (12c+)         | JSONB                | Native (5.7+)            | Native                    |
| XML Support         | Advanced XMLType      | XML functions        | Basic                    | Advanced                  |
| Full-Text Search    | Oracle Text           | Built-in             | Built-in                 | Advanced                  |

## Best Practices

### 1. Use Bind Variables

```sql
-- ❌ Avoid hard-coded values
SELECT * FROM employees WHERE employee_id = 100;

-- ✅ Use bind variables
VARIABLE emp_id NUMBER;
EXEC :emp_id := 100;
SELECT * FROM employees WHERE employee_id = :emp_id;

-- In PL/SQL
DECLARE
    v_emp_id NUMBER := 100;
BEGIN
    FOR emp IN (SELECT * FROM employees WHERE employee_id = v_emp_id) LOOP
        DBMS_OUTPUT.PUT_LINE(emp.first_name);
    END LOOP;
END;
/
```

### 2. Use Appropriate Data Types

```sql
-- ✅ Good practice
CREATE TABLE employees (
    employee_id NUMBER(6),
    email VARCHAR2(100),
    hire_date DATE,
    salary NUMBER(8,2)
);

-- ❌ Avoid overly generic types
CREATE TABLE employees (
    employee_id NUMBER,
    email VARCHAR2(4000),
    hire_date VARCHAR2(100),
    salary NUMBER
);
```

### 3. Use Sequences for Primary Keys

```sql
-- Create sequence
CREATE SEQUENCE emp_seq START WITH 1000 INCREMENT BY 1;

-- Use in insert
INSERT INTO employees (employee_id, first_name, last_name)
VALUES (emp_seq.NEXTVAL, 'John', 'Doe');

-- Use with trigger for auto-population
CREATE OR REPLACE TRIGGER emp_bi
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    IF :NEW.employee_id IS NULL THEN
        :NEW.employee_id := emp_seq.NEXTVAL;
    END IF;
END;
/
```

### 4. Proper Error Handling

```sql
CREATE OR REPLACE PROCEDURE process_order(p_order_id NUMBER) IS
    v_customer_id NUMBER;
    e_invalid_order EXCEPTION;
BEGIN
    -- Named exception
    SELECT customer_id INTO v_customer_id
    FROM orders
    WHERE order_id = p_order_id;

    IF v_customer_id IS NULL THEN
        RAISE e_invalid_order;
    END IF;

    -- Process order
    COMMIT;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Order not found');
        ROLLBACK;
    WHEN e_invalid_order THEN
        DBMS_OUTPUT.PUT_LINE('Invalid order');
        ROLLBACK;
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
        ROLLBACK;
        RAISE;
END;
/
```

### 5. Use Collections Efficiently

```sql
DECLARE
    -- Associative array
    TYPE emp_array IS TABLE OF employees%ROWTYPE INDEX BY PLS_INTEGER;
    v_emps emp_array;

    -- Nested table
    TYPE name_list IS TABLE OF VARCHAR2(100);
    v_names name_list := name_list();
BEGIN
    -- Bulk collect for efficient retrieval
    SELECT * BULK COLLECT INTO v_emps
    FROM employees
    WHERE department_id = 10;

    -- Process collection
    FOR i IN 1..v_emps.COUNT LOOP
        DBMS_OUTPUT.PUT_LINE(v_emps(i).first_name);
    END LOOP;
END;
/
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="oracle" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Comparison with PostgreSQL
- [MySQL](/databases/mysql/) - Comparison with MySQL
- [SQL Server](/databases/sqlserver/) - Comparison with SQL Server
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [Joins](/concepts/joins/) - Join operations

## Resources

- [Official Documentation](https://docs.oracle.com/en/database/)
- [Oracle Live SQL](https://livesql.oracle.com/) - Online SQL playground
- [Oracle Technology Network](https://www.oracle.com/technical-resources/)
- [Oracle Database Express Edition](https://www.oracle.com/database/technologies/appdev/xe.html) - Free version
- [Ask TOM](https://asktom.oracle.com/) - Oracle Q&A site
