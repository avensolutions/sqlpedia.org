---
title: DuckDB
description: >-
  Comprehensive guide to DuckDB - Fast in-process analytical database, the
  SQLite for analytics
difficulty: beginner
tags:
  - databases
  - duckdb
  - analytics
  - embedded
  - olap
  - in-memory
---

# DuckDB

## Overview

DuckDB is an in-process SQL OLAP database management system designed for analytical query workloads. Often described as "SQLite for analytics," DuckDB runs embedded within applications without requiring a separate server process. It combines the simplicity of SQLite with the analytical performance of modern columnar databases, making it perfect for data analysis, ETL, and embedded analytics use cases.

### Key Features

- **In-Process Execution**: No server process needed, runs directly in your application
- **Columnar Storage**: Vectorized query execution engine optimized for analytics
- **PostgreSQL-Compatible SQL**: Familiar syntax with extensive SQL support
- **Zero Dependencies**: Single binary with no external dependencies
- **ACID Compliance**: Full transaction support with durability guarantees
- **Parallel Query Execution**: Automatic parallelization of queries across CPU cores
- **Native Parquet Support**: Direct querying of Parquet files without loading
- **Rich Data Types**: Arrays, structs, maps, JSON, and more
- **Python & R Integration**: First-class support for data science ecosystems
- **Extension System**: Extensible with custom functions and data sources
- **Full-Text Search**: Built-in FTS capabilities
- **Spatial Support**: GIS functionality via spatial extension

## Getting Started

### Installation

::: code-group

```bash [Command Line]
# macOS (Homebrew)
brew install duckdb

# Linux (wget)
wget https://github.com/duckdb/duckdb/releases/latest/download/duckdb_cli-linux-amd64.zip
unzip duckdb_cli-linux-amd64.zip
chmod +x duckdb

# Windows (winget)
winget install DuckDB.cli

# Or download from GitHub releases
# https://github.com/duckdb/duckdb/releases
```

```python [Python]
# Install Python package
pip install duckdb

# With pandas support
pip install duckdb pandas

# With additional features
pip install duckdb pandas pyarrow
```

```r [R]
# Install R package
install.packages("duckdb")

# Or development version
# install.packages("duckdb", repos=c("https://duckdb.r-universe.dev", "https://cloud.r-project.org"))
```

```javascript [Node.js]
# Install Node.js package
npm install duckdb

# Or with Yarn
yarn add duckdb
```

```java [Java/JDBC]
<!-- Add to pom.xml -->
<dependency>
    <groupId>org.duckdb</groupId>
    <artifactId>duckdb_jdbc</artifactId>
    <version>0.10.0</version>
</dependency>

<!-- Or download JDBC driver -->
<!-- https://repo1.maven.org/maven2/org/duckdb/duckdb_jdbc/ -->
```

:::

### Connecting

::: code-group

```bash [CLI]
# Start interactive shell (in-memory)
duckdb

# Open/create persistent database
duckdb mydb.duckdb

# Execute query directly
duckdb mydb.duckdb "SELECT 'Hello DuckDB' AS greeting;"

# Read-only mode
duckdb -readonly mydb.duckdb

# Execute SQL file
duckdb mydb.duckdb < script.sql

# Export results to CSV
duckdb mydb.duckdb "COPY (SELECT * FROM customers) TO 'output.csv' WITH (HEADER, DELIMITER ',');"
```

```python [Python]
import duckdb

# In-memory database
con = duckdb.connect()

# Persistent database
con = duckdb.connect('mydb.duckdb')

# Read-only
con = duckdb.connect('mydb.duckdb', read_only=True)

# Execute query
result = con.execute("SELECT 'Hello DuckDB' AS greeting").fetchall()
print(result)

# Query to DataFrame
import pandas as pd
df = con.execute("SELECT * FROM customers").df()

# Or use convenience method
df = con.sql("SELECT * FROM customers").df()

# Query DataFrame directly
df = pd.read_csv('data.csv')
result = con.execute("SELECT * FROM df WHERE amount > 100").df()

# Close connection
con.close()

# Context manager (auto-close)
with duckdb.connect('mydb.duckdb') as con:
    result = con.execute("SELECT * FROM customers").fetchall()
```

```r [R]
library(duckdb)

# Create connection
con <- dbConnect(duckdb::duckdb(), dbdir = "mydb.duckdb")

# In-memory
con <- dbConnect(duckdb::duckdb())

# Execute query
result <- dbGetQuery(con, "SELECT 'Hello DuckDB' AS greeting")

# Query to data.frame
df <- dbGetQuery(con, "SELECT * FROM customers")

# Query R data frame directly
data <- read.csv("data.csv")
dbRegister(con, "data", data)
result <- dbGetQuery(con, "SELECT * FROM data WHERE amount > 100")

# Close connection
dbDisconnect(con, shutdown=TRUE)
```

```javascript [Node.js]
const duckdb = require("duckdb");

// In-memory database
const db = new duckdb.Database(":memory:");

// Persistent database
const db = new duckdb.Database("mydb.duckdb");

// Execute query
db.all("SELECT 'Hello DuckDB' AS greeting", (err, rows) => {
  if (err) throw err;
  console.log(rows);
});

// Using connection
const conn = db.connect();
conn.all("SELECT * FROM customers", (err, rows) => {
  if (err) throw err;
  console.log(rows);
});

// Async/await with promises
const Database = require("duckdb-async").Database;
const db = await Database.create("mydb.duckdb");
const rows = await db.all("SELECT * FROM customers");

// Close database
db.close();
```

```java [JDBC]
import java.sql.*;

// Load driver
Class.forName("org.duckdb.DuckDBDriver");

// Connect to database
Connection conn = DriverManager.getConnection("jdbc:duckdb:mydb.duckdb");

// In-memory
Connection conn = DriverManager.getConnection("jdbc:duckdb:");

// Execute query
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT 'Hello DuckDB' AS greeting");

while (rs.next()) {
    System.out.println(rs.getString("greeting"));
}

// Prepared statement
PreparedStatement pstmt = conn.prepareStatement(
    "SELECT * FROM customers WHERE customer_id = ?"
);
pstmt.setInt(1, 100);
ResultSet rs = pstmt.executeQuery();

// Close connection
conn.close();
```

:::

## DuckDB-Specific Features

### Direct File Querying

Query files directly without loading them into tables first.

```sql
-- Query CSV directly
SELECT *
FROM 'data.csv'
WHERE amount > 1000;

-- Query with options
SELECT *
FROM read_csv_auto('data.csv',
    header=true,
    delim=',',
    columns={'id': 'INTEGER', 'name': 'VARCHAR'}
);

-- Query multiple CSV files
SELECT *
FROM read_csv_auto('data/*.csv');

-- Query Parquet files
SELECT *
FROM 'data.parquet';

SELECT *
FROM read_parquet('data/**/*.parquet');

-- Query JSON files
SELECT *
FROM 'data.json';

SELECT *
FROM read_json_auto('logs/*.json');

-- Query Excel files (requires extension)
INSTALL spatial;
LOAD spatial;
SELECT * FROM st_read('data.xlsx');

-- Query remote files
SELECT *
FROM 'https://example.com/data.csv';

SELECT *
FROM 's3://my-bucket/data/*.parquet';

-- Create view from file
CREATE VIEW sales_view AS
SELECT * FROM 'sales.parquet';

-- Export to file
COPY (SELECT * FROM customers) TO 'output.parquet' (FORMAT PARQUET);
COPY (SELECT * FROM customers) TO 'output.csv' (HEADER, DELIMITER ',');
COPY (SELECT * FROM customers) TO 'output.json';
```

### Working with Parquet

DuckDB has first-class Parquet support with advanced features.

```sql
-- Read Parquet with schema
SELECT *
FROM read_parquet('data.parquet',
    union_by_name=true,
    filename=true
);

-- Read partitioned Parquet
SELECT *
FROM read_parquet('data/year=*/month=*/*.parquet',
    hive_partitioning=true
);

-- Parquet metadata
SELECT *
FROM parquet_metadata('data.parquet');

SELECT *
FROM parquet_schema('data.parquet');

-- Write Parquet with options
COPY (SELECT * FROM large_table)
TO 'output.parquet' (
    FORMAT PARQUET,
    COMPRESSION 'ZSTD',
    ROW_GROUP_SIZE 100000
);

-- Partition on write
COPY (SELECT * FROM sales)
TO 'sales_partitioned' (
    FORMAT PARQUET,
    PARTITION_BY (year, month),
    OVERWRITE_OR_IGNORE
);

-- Query Parquet statistics (predicate pushdown)
SELECT COUNT(*)
FROM 'large_file.parquet'
WHERE date >= '2024-01-01';  -- Uses Parquet statistics, very fast
```

### Extensions

DuckDB has a rich extension ecosystem.

```sql
-- Install extension
INSTALL httpfs;
INSTALL parquet;
INSTALL json;
INSTALL icu;
INSTALL fts;
INSTALL spatial;
INSTALL postgres_scanner;
INSTALL sqlite_scanner;

-- Load extension
LOAD httpfs;
LOAD spatial;

-- Auto-load and auto-install
SET autoinstall_known_extensions = true;
SET autoload_known_extensions = true;

-- List installed extensions
SELECT * FROM duckdb_extensions();

-- HTTP/S3 access
INSTALL httpfs;
LOAD httpfs;

-- Configure S3
SET s3_region='us-east-1';
SET s3_access_key_id='your-key';
SET s3_secret_access_key='your-secret';

SELECT * FROM 's3://bucket/data.parquet';

-- Full-text search
INSTALL fts;
LOAD fts;

CREATE TABLE documents (id INTEGER, content TEXT);
INSERT INTO documents VALUES
    (1, 'DuckDB is an analytical database'),
    (2, 'Fast queries on large datasets');

-- Create FTS index
PRAGMA create_fts_index('documents', 'id', 'content');

-- Search
SELECT * FROM (
    SELECT *, fts_main_documents.match_bm25(id, 'analytical database') AS score
    FROM documents
) sq
WHERE score IS NOT NULL
ORDER BY score DESC;

-- Spatial/GIS
INSTALL spatial;
LOAD spatial;

SELECT ST_AsText(ST_Point(1, 2)) AS point;

SELECT ST_Distance(
    ST_Point(0, 0),
    ST_Point(3, 4)
) AS distance;

-- PostgreSQL scanner
INSTALL postgres_scanner;
LOAD postgres_scanner;

ATTACH 'dbname=postgres user=postgres host=127.0.0.1' AS postgres_db (TYPE POSTGRES);
SELECT * FROM postgres_db.public.customers;

-- SQLite scanner
INSTALL sqlite_scanner;
LOAD sqlite_scanner;

SELECT * FROM sqlite_scan('database.sqlite', 'table_name');
```

### Python Integration

DuckDB provides seamless Python integration.

```python
import duckdb
import pandas as pd
import numpy as np

# Query DataFrames directly
df1 = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
df2 = pd.DataFrame({'a': [1, 2], 'c': [7, 8]})

result = duckdb.query("""
    SELECT df1.*, df2.c
    FROM df1
    JOIN df2 ON df1.a = df2.a
""").df()

# Query NumPy arrays
arr = np.array([[1, 2], [3, 4], [5, 6]])
result = duckdb.query("SELECT * FROM arr").df()

# Register DataFrame
con = duckdb.connect()
con.register('my_df', df1)
result = con.execute("SELECT * FROM my_df").df()

# Query Pandas with DuckDB SQL
result = df1.query("SELECT SUM(a) as total FROM df1")

# Arrow integration
import pyarrow as pa
arrow_table = pa.table({'x': [1, 2, 3], 'y': [4, 5, 6]})
result = duckdb.query("SELECT * FROM arrow_table").arrow()

# Relation API (more Pythonic)
rel = duckdb.from_df(df1)
result = rel.filter("a > 1").project("a, b * 2 as b_doubled").df()

# Or chaining
result = (duckdb.from_df(df1)
    .filter("a > 1")
    .aggregate("SUM(b) as total")
    .df())

# Replace DataFrame operations
# Instead of: df.groupby('category').agg({'sales': 'sum'})
result = duckdb.query("""
    SELECT category, SUM(sales) as total_sales
    FROM df
    GROUP BY category
""").df()

# Faster than pandas for large datasets
large_df = pd.DataFrame({
    'id': range(10000000),
    'value': np.random.randn(10000000)
})

# DuckDB is much faster for aggregations
result = duckdb.query("""
    SELECT
        id % 1000 as group_id,
        AVG(value) as avg_value,
        COUNT(*) as count
    FROM large_df
    GROUP BY group_id
""").df()
```

### Array and Nested Types

DuckDB excels at handling complex nested data structures.

```sql
-- Arrays
SELECT [1, 2, 3, 4] AS numbers;

SELECT list_value(1, 2, 3, 4) AS numbers;

-- Array operations
SELECT
    [1, 2, 3, 4] AS arr,
    array_length([1, 2, 3, 4]) AS len,
    [1, 2, 3, 4][2] AS second_element,  -- 2 (1-indexed)
    list_contains([1, 2, 3], 2) AS contains_two,
    list_concat([1, 2], [3, 4]) AS combined,
    unnest([1, 2, 3, 4]) AS exploded;

-- Create table with arrays
CREATE TABLE products (
    product_id INTEGER,
    name VARCHAR,
    tags VARCHAR[]
);

INSERT INTO products VALUES
    (1, 'Laptop', ['electronics', 'computers', 'portable']),
    (2, 'Mouse', ['electronics', 'accessories']);

-- Query arrays
SELECT * FROM products
WHERE list_contains(tags, 'electronics');

SELECT product_id, unnest(tags) AS tag
FROM products;

-- Structs (nested objects)
SELECT {
    'name': 'John',
    'age': 30,
    'city': 'New York'
} AS person;

-- Access struct fields
SELECT
    {'name': 'John', 'age': 30} AS person,
    {'name': 'John', 'age': 30}.name AS person_name,
    {'name': 'John', 'age': 30}['age'] AS person_age;

-- Create table with structs
CREATE TABLE employees (
    emp_id INTEGER,
    name VARCHAR,
    address STRUCT(street VARCHAR, city VARCHAR, zip VARCHAR)
);

INSERT INTO employees VALUES
    (1, 'Alice', {'street': '123 Main St', 'city': 'Boston', 'zip': '02101'}),
    (2, 'Bob', {'street': '456 Oak Ave', 'city': 'Seattle', 'zip': '98101'});

SELECT name, address.city FROM employees;

-- Maps
CREATE TABLE user_prefs (
    user_id INTEGER,
    preferences MAP(VARCHAR, VARCHAR)
);

INSERT INTO user_prefs VALUES
    (1, MAP(['theme', 'lang'], ['dark', 'en'])),
    (2, MAP(['theme', 'lang'], ['light', 'es']));

SELECT
    user_id,
    preferences['theme'] AS theme
FROM user_prefs;

-- Nested combinations
CREATE TABLE events (
    event_id INTEGER,
    event_name VARCHAR,
    participants STRUCT(
        organizer VARCHAR,
        attendees VARCHAR[],
        metadata MAP(VARCHAR, VARCHAR)
    )[]
);

-- JSON
SELECT '{"name": "John", "age": 30}'::JSON AS json_data;

SELECT
    '{"name": "John", "age": 30, "scores": [95, 87, 92]}'::JSON AS data,
    json_extract('{"name": "John"}', '$.name') AS name,
    data->'name' AS name_alt,
    data->>'age' AS age,
    data->'scores'->0 AS first_score;

-- Read JSON into structured data
CREATE TABLE json_data AS
SELECT * FROM read_json_auto('data.json');
```

### Window Functions

DuckDB has comprehensive window function support.

```sql
-- Row number
SELECT
    customer_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS order_num
FROM orders;

-- Ranking
SELECT
    product_id,
    sales,
    RANK() OVER (ORDER BY sales DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY sales DESC) AS dense_rank,
    PERCENT_RANK() OVER (ORDER BY sales) AS pct_rank,
    NTILE(4) OVER (ORDER BY sales) AS quartile
FROM product_sales;

-- Running totals
SELECT
    order_date,
    amount,
    SUM(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    AVG(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM orders;

-- Lead and lag
SELECT
    date,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY date) AS prev_day_revenue,
    LEAD(revenue, 1) OVER (ORDER BY date) AS next_day_revenue,
    revenue - LAG(revenue) OVER (ORDER BY date) AS day_over_day_change
FROM daily_revenue;

-- First and last value
SELECT
    customer_id,
    order_date,
    amount,
    FIRST_VALUE(amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
    ) AS first_order_amount,
    LAST_VALUE(amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_order_amount
FROM orders;

-- Window frame types
SELECT
    date,
    sales,
    -- ROWS frame (physical rows)
    SUM(sales) OVER (ORDER BY date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS sum_3_rows,
    -- RANGE frame (logical range)
    SUM(sales) OVER (ORDER BY date RANGE BETWEEN INTERVAL 7 DAYS PRECEDING AND CURRENT ROW) AS sum_7_days,
    -- GROUPS frame (peer groups)
    COUNT(*) OVER (ORDER BY department GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS peer_count
FROM sales_data;
```

### Macros and Functions

Create reusable SQL macros and functions.

```sql
-- Simple macro
CREATE MACRO add(a, b) AS a + b;
SELECT add(5, 3) AS result;  -- 8

-- Macro with table
CREATE MACRO top_customers(n) AS TABLE
    SELECT customer_id, SUM(amount) as total
    FROM orders
    GROUP BY customer_id
    ORDER BY total DESC
    LIMIT n;

SELECT * FROM top_customers(10);

-- Macro with default parameters
CREATE MACRO greet(name, greeting := 'Hello') AS
    greeting || ' ' || name;

SELECT greet('Alice');  -- 'Hello Alice'
SELECT greet('Bob', 'Hi');  -- 'Hi Bob'

-- Scalar function
CREATE FUNCTION celsius_to_fahrenheit(c DOUBLE)
RETURNS DOUBLE AS
    (c * 9.0 / 5.0) + 32.0;

SELECT celsius_to_fahrenheit(0) AS freezing;  -- 32.0
SELECT celsius_to_fahrenheit(100) AS boiling;  -- 212.0

-- Table function
CREATE FUNCTION generate_series_custom(start INTEGER, stop INTEGER)
RETURNS TABLE(value INTEGER) AS
    SELECT * FROM generate_series(start, stop);

SELECT * FROM generate_series_custom(1, 5);

-- Replace function
CREATE OR REPLACE FUNCTION add_vat(price DOUBLE, rate := 0.20)
RETURNS DOUBLE AS
    price * (1 + rate);

-- List functions
SELECT * FROM duckdb_functions() WHERE function_name LIKE '%json%';

-- Drop function
DROP FUNCTION IF EXISTS celsius_to_fahrenheit;
DROP MACRO IF EXISTS top_customers;
```

### Sampling

DuckDB provides efficient data sampling methods.

```sql
-- Sample percentage
SELECT * FROM large_table
USING SAMPLE 10%;  -- 10% random sample

-- Sample exact number of rows
SELECT * FROM large_table
USING SAMPLE 1000 ROWS;

-- Reservoir sampling (fixed size)
SELECT * FROM large_table
USING SAMPLE reservoir(5000 ROWS);

-- Bernoulli sampling (per row)
SELECT * FROM large_table
USING SAMPLE bernoulli(5%);

-- System sampling (per block, faster)
SELECT * FROM large_table
USING SAMPLE system(5%);

-- Repeatable sampling
SELECT * FROM large_table
USING SAMPLE 10% (SEED 42);

-- Sample in subquery
WITH sample_data AS (
    SELECT * FROM large_table USING SAMPLE 1%
)
SELECT AVG(amount) FROM sample_data;
```

### Pivot and Unpivot

```sql
-- Pivot
PIVOT sales_data
ON product
USING SUM(amount)
GROUP BY region;

-- Or using SQL
SELECT region,
    SUM(CASE WHEN product = 'A' THEN amount END) AS product_a,
    SUM(CASE WHEN product = 'B' THEN amount END) AS product_b,
    SUM(CASE WHEN product = 'C' THEN amount END) AS product_c
FROM sales_data
GROUP BY region;

-- Dynamic pivot
PIVOT sales_data
ON product
USING SUM(amount);

-- Unpivot
UNPIVOT sales_wide
ON product_a, product_b, product_c
INTO NAME product VALUE amount;

-- Or using UNION
SELECT region, 'product_a' AS product, product_a AS amount FROM sales_wide
UNION ALL
SELECT region, 'product_b', product_b FROM sales_wide
UNION ALL
SELECT region, 'product_c', product_c FROM sales_wide;
```

## Advanced Features

### Parallel Query Execution

DuckDB automatically parallelizes queries across available CPU cores.

```sql
-- Check thread count
PRAGMA threads;

-- Set thread count
PRAGMA threads=4;

-- View parallel execution
EXPLAIN ANALYZE
SELECT COUNT(*), AVG(amount)
FROM large_table
WHERE date >= '2024-01-01';

-- Parallel aggregation (automatic)
SELECT
    category,
    COUNT(*) as count,
    SUM(amount) as total,
    AVG(amount) as average
FROM large_table
GROUP BY category;

-- Parallel joins (automatic)
SELECT a.*, b.name
FROM large_table_a a
JOIN large_table_b b ON a.id = b.id;
```

### Transactions and ACID

```sql
-- Begin transaction
BEGIN TRANSACTION;

-- Perform operations
INSERT INTO accounts (account_id, balance) VALUES (1, 1000);
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

-- Commit
COMMIT;

-- Or rollback on error
ROLLBACK;

-- Savepoints
BEGIN TRANSACTION;
INSERT INTO orders VALUES (1, 100);
SAVEPOINT sp1;
INSERT INTO orders VALUES (2, 200);
ROLLBACK TO SAVEPOINT sp1;  -- Only rolls back second insert
COMMIT;

-- Read consistency
-- DuckDB uses MVCC (Multi-Version Concurrency Control)
BEGIN TRANSACTION;
SELECT * FROM accounts;  -- Sees consistent snapshot
-- Other transactions can modify data
SELECT * FROM accounts;  -- Still sees same snapshot
COMMIT;
```

### Constraints and Indexes

```sql
-- Primary key
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE,
    name VARCHAR NOT NULL
);

-- Composite primary key
CREATE TABLE order_items (
    order_id INTEGER,
    item_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, item_id)
);

-- Foreign key
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Check constraint
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    price DECIMAL(10,2) CHECK (price >= 0),
    stock INTEGER CHECK (stock >= 0),
    category VARCHAR CHECK (category IN ('electronics', 'clothing', 'food'))
);

-- Add constraints to existing table
ALTER TABLE products
ADD CONSTRAINT price_positive CHECK (price > 0);

-- Indexes (for joins and filters)
CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_composite ON sales(region, product_id, sale_date);

-- Unique index
CREATE UNIQUE INDEX idx_email_unique ON customers(email);

-- Show indexes
SELECT * FROM duckdb_indexes();

-- Drop index
DROP INDEX idx_customer_email;
```

### Views and CTEs

```sql
-- Create view
CREATE VIEW high_value_customers AS
SELECT
    c.customer_id,
    c.name,
    c.email,
    SUM(o.amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name, c.email
HAVING SUM(o.amount) > 10000;

-- Query view
SELECT * FROM high_value_customers
ORDER BY total_spent DESC;

-- Create or replace view
CREATE OR REPLACE VIEW daily_sales AS
SELECT
    DATE_TRUNC('day', order_date) as day,
    SUM(amount) as total_sales
FROM orders
GROUP BY day;

-- Materialized view (create table from query)
CREATE TABLE daily_sales_materialized AS
SELECT
    DATE_TRUNC('day', order_date) as day,
    SUM(amount) as total_sales
FROM orders
GROUP BY day;

-- Refresh materialized view
CREATE OR REPLACE TABLE daily_sales_materialized AS
SELECT
    DATE_TRUNC('day', order_date) as day,
    SUM(amount) as total_sales
FROM orders
GROUP BY day;

-- Recursive CTEs
WITH RECURSIVE date_series AS (
    SELECT DATE '2024-01-01' as date
    UNION ALL
    SELECT date + INTERVAL 1 DAY
    FROM date_series
    WHERE date < DATE '2024-12-31'
)
SELECT * FROM date_series;

-- Organizational hierarchy
WITH RECURSIVE org_tree AS (
    SELECT employee_id, name, manager_id, 0 as level
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.employee_id, e.name, e.manager_id, ot.level + 1
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree ORDER BY level, name;

-- Drop view
DROP VIEW IF EXISTS high_value_customers;
```

### Sequences and Auto-Increment

```sql
-- Auto-increment with sequences
CREATE SEQUENCE customer_id_seq START 1;

CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY DEFAULT nextval('customer_id_seq'),
    name VARCHAR
);

INSERT INTO customers (name) VALUES ('Alice'), ('Bob'), ('Charlie');

-- Identity column (simpler)
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_id INTEGER,
    amount DECIMAL(10,2)
);

-- Or with start/increment
CREATE TABLE products (
    product_id INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1000 INCREMENT BY 10),
    name VARCHAR
);

-- Get current sequence value
SELECT currval('customer_id_seq');

-- Set sequence value
SELECT setval('customer_id_seq', 1000);

-- List sequences
SELECT * FROM duckdb_sequences();
```

### Attach Multiple Databases

```sql
-- Attach another DuckDB database
ATTACH 'other_db.duckdb' AS other;

-- Query from attached database
SELECT * FROM other.schema.table;

-- Join across databases
SELECT a.*, b.name
FROM main.orders a
JOIN other.customers b ON a.customer_id = b.customer_id;

-- Attach in read-only mode
ATTACH 'readonly.duckdb' AS readonly (READ_ONLY);

-- Attach SQLite database
INSTALL sqlite_scanner;
LOAD sqlite_scanner;
ATTACH 'database.sqlite' AS sqlite_db (TYPE SQLITE);
SELECT * FROM sqlite_db.table_name;

-- Attach PostgreSQL
INSTALL postgres_scanner;
LOAD postgres_scanner;
ATTACH 'dbname=mydb user=postgres' AS postgres_db (TYPE POSTGRES);
SELECT * FROM postgres_db.schema.table;

-- List attached databases
SELECT * FROM duckdb_databases();

-- Detach database
DETACH other;
```

### Export and Import

```sql
-- Export database
EXPORT DATABASE 'my_backup';

-- Export to specific format
EXPORT DATABASE 'my_backup' (FORMAT PARQUET);

-- Import database
IMPORT DATABASE 'my_backup';

-- Export single table
COPY customers TO 'customers.parquet' (FORMAT PARQUET);
COPY customers TO 'customers.csv' (HEADER, DELIMITER ',');
COPY customers TO 'customers.json';

-- Export with compression
COPY large_table TO 'data.parquet' (FORMAT PARQUET, COMPRESSION 'ZSTD');

-- Export query results
COPY (
    SELECT * FROM orders WHERE order_date >= '2024-01-01'
) TO 'recent_orders.parquet';

-- Import from file
CREATE TABLE imported_data AS
SELECT * FROM 'data.parquet';

-- Insert from file
INSERT INTO existing_table
SELECT * FROM 'new_data.csv';

-- Partitioned export
COPY (SELECT * FROM sales)
TO 'sales_data' (FORMAT PARQUET, PARTITION_BY (year, month));
```

## Data Types

### Numeric Types

| Type         | Size     | Range                                                   | Description                     |
| ------------ | -------- | ------------------------------------------------------- | ------------------------------- |
| TINYINT      | 1 byte   | -127 to 127                                             | Small integers                  |
| SMALLINT     | 2 bytes  | -32,768 to 32,767                                       | Short integers                  |
| INTEGER      | 4 bytes  | -2,147,483,648 to 2,147,483,647                         | Standard integers               |
| BIGINT       | 8 bytes  | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | Large integers                  |
| HUGEINT      | 16 bytes | ~10^38                                                  | Very large integers             |
| FLOAT        | 4 bytes  | Variable                                                | Single precision floating point |
| DOUBLE       | 8 bytes  | Variable                                                | Double precision floating point |
| DECIMAL(p,s) | Variable | Exact                                                   | Fixed-precision decimal         |

### String Types

| Type    | Description            | Example                  |
| ------- | ---------------------- | ------------------------ |
| VARCHAR | Variable-length string | 'Hello World'            |
| TEXT    | Alias for VARCHAR      | 'Long text...'           |
| CHAR(n) | Fixed-length string    | 'ABC'                    |
| BLOB    | Binary data            | '\xDE\xAD\xBE\xEF'::BLOB |

### Date/Time Types

| Type        | Format                   | Range                        | Example                              |
| ----------- | ------------------------ | ---------------------------- | ------------------------------------ |
| DATE        | YYYY-MM-DD               | 5,877,641 BC to 5,879,611 AD | DATE '2024-01-15'                    |
| TIME        | HH:MM:SS[.µs]            | 00:00:00 to 23:59:59.999999  | TIME '13:30:00'                      |
| TIMESTAMP   | YYYY-MM-DD HH:MM:SS[.µs] | Wide range                   | TIMESTAMP '2024-01-15 13:30:00'      |
| TIMESTAMPTZ | With timezone            | Wide range                   | TIMESTAMPTZ '2024-01-15 13:30:00+00' |
| INTERVAL    | Duration                 | Any duration                 | INTERVAL 5 DAYS                      |

### Complex Types

| Type       | Description          | Example                     |
| ---------- | -------------------- | --------------------------- |
| ARRAY/LIST | Ordered collection   | [1, 2, 3, 4]                |
| STRUCT     | Named fields         | {'name': 'John', 'age': 30} |
| MAP        | Key-value pairs      | MAP(['a', 'b'], [1, 2])     |
| UNION      | One of several types | union_value(num := 42)      |
| JSON       | JSON data            | '{"key": "value"}'::JSON    |

### Other Types

| Type          | Description                   |
| ------------- | ----------------------------- |
| BOOLEAN       | TRUE, FALSE, NULL             |
| UUID          | Universally unique identifier |
| ENUM          | Set of named values           |
| BIT/BITSTRING | Bit strings                   |

## Common Operations

### Database and Table Management

```sql
-- Create table
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table from query
CREATE TABLE high_spenders AS
SELECT customer_id, SUM(amount) as total_spent
FROM orders
GROUP BY customer_id
HAVING total_spent > 1000;

-- Create temporary table
CREATE TEMP TABLE temp_results AS
SELECT * FROM large_query;

-- Show tables
SHOW TABLES;

-- Describe table
DESCRIBE customers;
PRAGMA table_info('customers');

-- Show create statement
SELECT sql FROM sqlite_master WHERE name = 'customers';

-- Add column
ALTER TABLE customers ADD COLUMN phone VARCHAR;

-- Drop column
ALTER TABLE customers DROP COLUMN phone;

-- Rename table
ALTER TABLE customers RENAME TO clients;

-- Drop table
DROP TABLE IF EXISTS old_table;

-- Vacuum (compact database)
VACUUM;

-- Analyze (update statistics)
ANALYZE;
```

### Data Querying

```sql
-- Basic SELECT
SELECT
    customer_id,
    name,
    email
FROM customers
WHERE created_at >= '2024-01-01'
ORDER BY customer_id
LIMIT 100;

-- Joins
SELECT
    o.order_id,
    c.name,
    o.amount,
    o.order_date
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL 30 DAYS;

-- Left join
SELECT
    c.customer_id,
    c.name,
    COALESCE(SUM(o.amount), 0) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name;

-- Aggregations
SELECT
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as order_count,
    SUM(amount) as total_sales,
    AVG(amount) as avg_order_value,
    MIN(amount) as min_order,
    MAX(amount) as max_order,
    MEDIAN(amount) as median_order
FROM orders
GROUP BY month
ORDER BY month;

-- Group by multiple columns
SELECT
    region,
    product_category,
    COUNT(*) as sales_count,
    SUM(amount) as revenue
FROM sales
GROUP BY region, product_category
HAVING revenue > 10000;

-- Subqueries
SELECT *
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE order_date >= '2024-01-01'
);

-- Correlated subquery
SELECT
    c.customer_id,
    c.name,
    (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) as order_count
FROM customers c;

-- CASE expressions
SELECT
    customer_id,
    amount,
    CASE
        WHEN amount >= 1000 THEN 'High'
        WHEN amount >= 500 THEN 'Medium'
        ELSE 'Low'
    END as amount_category
FROM orders;

-- DISTINCT
SELECT DISTINCT region FROM sales;

-- COUNT DISTINCT
SELECT COUNT(DISTINCT customer_id) as unique_customers FROM orders;

-- String operations
SELECT
    UPPER(name) as name_upper,
    LOWER(email) as email_lower,
    CONCAT(first_name, ' ', last_name) as full_name,
    SUBSTRING(phone, 1, 3) as area_code,
    LENGTH(description) as desc_length,
    TRIM(name) as trimmed_name
FROM customers;

-- Date operations
SELECT
    order_date,
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(MONTH FROM order_date) as month,
    EXTRACT(DAY FROM order_date) as day,
    DATE_TRUNC('month', order_date) as month_start,
    order_date + INTERVAL 7 DAYS as week_later,
    CURRENT_DATE - order_date as days_ago
FROM orders;

-- NULL handling
SELECT
    customer_id,
    COALESCE(phone, 'No phone') as phone,
    NULLIF(email, '') as email,
    phone IS NULL as has_no_phone,
    phone IS NOT NULL as has_phone
FROM customers;
```

### Data Manipulation

```sql
-- Insert single row
INSERT INTO customers (customer_id, name, email)
VALUES (1, 'John Doe', 'john@example.com');

-- Insert multiple rows
INSERT INTO customers VALUES
    (2, 'Alice Smith', 'alice@example.com'),
    (3, 'Bob Jones', 'bob@example.com'),
    (4, 'Carol White', 'carol@example.com');

-- Insert from query
INSERT INTO archived_orders
SELECT * FROM orders
WHERE order_date < '2023-01-01';

-- Insert or replace
INSERT OR REPLACE INTO customers VALUES (1, 'John Updated', 'john@example.com');

-- Insert or ignore
INSERT OR IGNORE INTO customers VALUES (1, 'John', 'john@example.com');

-- Update
UPDATE customers
SET email = 'newemail@example.com'
WHERE customer_id = 1;

-- Update multiple columns
UPDATE customers
SET
    name = 'Jane Doe',
    email = 'jane@example.com',
    updated_at = CURRENT_TIMESTAMP
WHERE customer_id = 2;

-- Update from subquery
UPDATE customers
SET total_orders = (
    SELECT COUNT(*) FROM orders WHERE orders.customer_id = customers.customer_id
);

-- Delete
DELETE FROM customers
WHERE customer_id = 1;

-- Delete with condition
DELETE FROM orders
WHERE order_date < CURRENT_DATE - INTERVAL 2 YEARS;

-- Truncate (faster than DELETE)
TRUNCATE TABLE staging_table;

-- Upsert (ON CONFLICT)
INSERT INTO customers (customer_id, name, email)
VALUES (1, 'John Doe', 'john@example.com')
ON CONFLICT (customer_id)
DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
```

## Performance Optimization

### Best Practices

```sql
-- 1. Use appropriate data types
CREATE TABLE optimized (
    id INTEGER,              -- Not VARCHAR for IDs
    amount DECIMAL(10,2),    -- Not DOUBLE for money
    status VARCHAR,          -- Not TEXT for short strings
    data BLOB               -- For binary data
);

-- 2. Create indexes on filtered/joined columns
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);

-- 3. Use COPY for bulk loading (much faster than INSERT)
COPY customers FROM 'large_file.csv' (HEADER);

-- 4. Query Parquet directly instead of loading
SELECT COUNT(*) FROM 'huge_file.parquet' WHERE date = '2024-01-01';

-- 5. Use columnar formats (Parquet) for analytics
COPY (SELECT * FROM large_table) TO 'data.parquet' (FORMAT PARQUET);

-- 6. Partition large datasets
COPY (SELECT * FROM events)
TO 'events_partitioned' (FORMAT PARQUET, PARTITION_BY (year, month));

-- 7. Use ANALYZE to update statistics
ANALYZE customers;

-- 8. Leverage parallel execution (automatic)
PRAGMA threads=8;  -- Use 8 threads

-- 9. Use EXPLAIN for query analysis
EXPLAIN SELECT * FROM large_table WHERE condition;

EXPLAIN ANALYZE
SELECT customer_id, SUM(amount)
FROM orders
GROUP BY customer_id;

-- 10. Avoid SELECT * in production
-- BAD:
SELECT * FROM large_table;

-- GOOD:
SELECT id, name, amount FROM large_table;

-- 11. Filter early
-- BAD:
SELECT * FROM (
    SELECT * FROM large_table
) WHERE date = '2024-01-01';

-- GOOD:
SELECT * FROM large_table
WHERE date = '2024-01-01';

-- 12. Use WITH for repeated subqueries
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', sale_date) as month,
        SUM(amount) as total
    FROM sales
    GROUP BY month
)
SELECT * FROM monthly_sales WHERE total > 10000;

-- 13. Use approximate aggregates for large datasets
SELECT
    APPROX_COUNT_DISTINCT(customer_id) as approx_customers,
    APPROX_QUANTILE(amount, 0.5) as approx_median
FROM large_table;

-- 14. Sample for development/testing
SELECT * FROM large_table USING SAMPLE 1%;
```

### Query Optimization

```sql
-- View query execution plan
EXPLAIN SELECT * FROM orders WHERE customer_id = 100;

-- Detailed analysis
EXPLAIN ANALYZE
SELECT
    c.name,
    COUNT(o.order_id) as order_count,
    SUM(o.amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name
HAVING total_spent > 1000;

-- Check if index is used
EXPLAIN SELECT * FROM orders WHERE customer_id = 100;
-- Look for "Index Scan" in output

-- Optimize joins (smaller table on right for hash joins)
SELECT a.*
FROM large_table a
JOIN small_table b ON a.id = b.id;

-- Use IN instead of multiple ORs
-- BAD:
SELECT * FROM orders
WHERE status = 'pending' OR status = 'processing' OR status = 'shipped';

-- GOOD:
SELECT * FROM orders
WHERE status IN ('pending', 'processing', 'shipped');

-- Use EXISTS instead of IN for correlated queries
-- BAD:
SELECT * FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount > 1000);

-- GOOD:
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND amount > 1000);
```

### Memory Management

```sql
-- Set memory limit
SET memory_limit='4GB';

-- Check memory usage
SELECT * FROM pragma_database_size();

-- Use streaming for large result sets (in Python)
```

```python
import duckdb

con = duckdb.connect()
result = con.execute("SELECT * FROM huge_table")

# Process in chunks
while True:
    chunk = result.fetchmany(10000)
    if not chunk:
        break
    # Process chunk
    print(f"Processing {len(chunk)} rows")
```

### File Format Optimization

```sql
-- Parquet is fastest for analytics
-- Write with optimal settings
COPY (SELECT * FROM large_table)
TO 'optimized.parquet' (
    FORMAT PARQUET,
    COMPRESSION 'ZSTD',           -- Best compression
    ROW_GROUP_SIZE 100000          -- Optimal for your data
);

-- CSV with compression
COPY (SELECT * FROM large_table)
TO 'data.csv.gz' (
    FORMAT CSV,
    COMPRESSION GZIP
);

-- Query compressed files directly
SELECT * FROM 'data.csv.gz';
SELECT * FROM 'data.parquet.zst';
```

## Security and Access Control

### Read-Only Connections

```sql
-- Connect in read-only mode (Python)
```

```python
import duckdb
con = duckdb.connect('database.duckdb', read_only=True)
```

```sql
-- CLI read-only
-- duckdb -readonly database.duckdb
```

### File Permissions

DuckDB relies on operating system file permissions for security. The database file itself can be protected using standard OS mechanisms.

### Secrets Management

```python
# Don't hardcode credentials
import duckdb
import os

con = duckdb.connect()

# Use environment variables
con.execute(f"""
    SET s3_access_key_id='{os.getenv('AWS_ACCESS_KEY')}';
    SET s3_secret_access_key='{os.getenv('AWS_SECRET_KEY')}';
""")
```

## DuckDB vs Other Databases

| Feature                 | DuckDB        | SQLite        | PostgreSQL      | Pandas            |
| ----------------------- | ------------- | ------------- | --------------- | ----------------- |
| Architecture            | Embedded OLAP | Embedded OLTP | Client-Server   | DataFrame Library |
| Best For                | Analytics     | Simple apps   | Production apps | Data analysis     |
| Query Speed (Analytics) | Very Fast     | Slow          | Medium          | Slow              |
| Parallelization         | Yes           | No            | Yes             | Limited           |
| Storage                 | Columnar      | Row-based     | Row-based       | In-memory         |
| SQL Support             | Extensive     | Good          | Excellent       | Limited           |
| File Querying           | Native        | No            | Extensions      | read_csv/parquet  |
| Parquet Support         | Native        | Extensions    | Extensions      | via PyArrow       |
| Memory Efficiency       | Excellent     | Good          | Good            | Poor (large data) |
| Size Limits             | TB+           | 281 TB        | No limit        | RAM limited       |
| Multi-user              | Single-writer | Single-writer | Multi-user      | N/A               |
| Language Integration    | Excellent     | Good          | Good            | Native (Python)   |

## Best Practices

### 1. File Organization

```sql
-- Use Parquet for large analytical datasets
COPY (SELECT * FROM events) TO 'events.parquet';

-- Partition large datasets
COPY (SELECT * FROM events)
TO 'events' (FORMAT PARQUET, PARTITION_BY (year, month));

-- Query partitioned data efficiently
SELECT * FROM 'events/year=2024/month=01/*.parquet';
```

### 2. Schema Design

```sql
-- Use appropriate data types
CREATE TABLE optimized_schema (
    id INTEGER PRIMARY KEY,
    timestamp TIMESTAMP,         -- Not VARCHAR
    amount DECIMAL(10,2),        -- Not DOUBLE for money
    status VARCHAR,              -- Not TEXT for short values
    metadata JSON                -- For flexible data
);

-- Add constraints
CREATE TABLE with_constraints (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 0),
    status VARCHAR CHECK (status IN ('active', 'inactive'))
);
```

### 3. Development Workflow

```python
import duckdb

# Development: use in-memory
dev_con = duckdb.connect(':memory:')

# Load sample data
dev_con.execute("CREATE TABLE data AS SELECT * FROM 'data.parquet' USING SAMPLE 1%")

# Test queries
result = dev_con.execute("SELECT * FROM data").df()

# Production: use persistent database
prod_con = duckdb.connect('production.duckdb')
```

### 4. ETL Patterns

```sql
-- Bronze layer: raw data
CREATE TABLE bronze_events AS
SELECT * FROM read_json_auto('raw_events/*.json');

-- Silver layer: cleaned data
CREATE TABLE silver_events AS
SELECT
    event_id::INTEGER,
    CAST(event_time AS TIMESTAMP) as event_time,
    user_id::INTEGER,
    event_type,
    properties
FROM bronze_events
WHERE event_id IS NOT NULL
    AND event_time IS NOT NULL;

-- Gold layer: aggregated data
CREATE TABLE gold_daily_metrics AS
SELECT
    DATE_TRUNC('day', event_time) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
FROM silver_events
GROUP BY date, event_type;
```

### 5. Error Handling

```python
import duckdb

con = duckdb.connect('database.duckdb')

try:
    con.execute("SELECT * FROM non_existent_table")
except duckdb.CatalogException as e:
    print(f"Table not found: {e}")
except duckdb.Error as e:
    print(f"Database error: {e}")
finally:
    con.close()
```

### 6. Testing Queries

```sql
-- Use EXPLAIN to verify query plans
EXPLAIN SELECT * FROM large_table WHERE id = 100;

-- Test with samples first
CREATE TEMP TABLE test_data AS
SELECT * FROM huge_table USING SAMPLE 1%;

SELECT COUNT(*), SUM(amount) FROM test_data;

-- Verify with ANALYZE
EXPLAIN ANALYZE
SELECT customer_id, COUNT(*)
FROM orders
GROUP BY customer_id;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="duckdb" :show-model-selector="false" />

## See Also

- [SQLite](/databases/sqlite/) - Embedded OLTP database
- [PostgreSQL](/databases/postgresql/) - Full-featured relational database
- [Parquet Format](/formats/parquet/) - Columnar storage format
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries

## Resources

- [Official Documentation](https://duckdb.org/docs/) - Complete DuckDB documentation
- [DuckDB Blog](https://duckdb.org/news/) - Latest features and announcements
- [GitHub Repository](https://github.com/duckdb/duckdb) - Source code and issues
- [Why DuckDB](https://duckdb.org/why_duckdb) - Design philosophy and use cases
- [SQL Reference](https://duckdb.org/docs/sql/introduction) - Complete SQL syntax guide
- [Extensions](https://duckdb.org/docs/extensions/overview) - Available extensions
- [Python API](https://duckdb.org/docs/api/python/overview) - Python integration guide
- [Performance Guide](https://duckdb.org/docs/guides/performance/overview) - Optimization tips
- [Awesome DuckDB](https://github.com/davidgasquez/awesome-duckdb) - Community resources
