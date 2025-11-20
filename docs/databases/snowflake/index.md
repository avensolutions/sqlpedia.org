---
title: Snowflake
description: >-
  Comprehensive guide to Snowflake - Cloud-native data warehouse platform for
  analytics and data engineering
difficulty: intermediate
tags:
  - databases
  - snowflake
  - cloud
  - datawarehouse
  - analytics
---

# Snowflake

## Overview

Snowflake is a cloud-native data warehouse platform that provides a single, integrated solution for data warehousing, data lakes, data engineering, data science, and data application development. Built from the ground up for the cloud, Snowflake separates compute from storage, enabling independent scaling and delivering high performance and cost efficiency.

### Key Features

- **Cloud-Native Architecture**: Built exclusively for the cloud (AWS, Azure, GCP)
- **Separation of Storage and Compute**: Scale storage and compute independently
- **Multi-Cluster Shared Data**: Concurrent access without resource contention
- **Zero-Copy Cloning**: Create instant, writable copies of databases without duplicating data
- **Time Travel**: Query historical data and restore previous states
- **Data Sharing**: Securely share live data across organizations without copying
- **Automatic Scaling**: Auto-scaling compute resources based on workload
- **Semi-Structured Data**: Native support for JSON, Avro, Parquet, XML, ORC
- **Snowpark**: Code in Python, Java, and Scala for data transformations
- **No Infrastructure Management**: Fully managed service with automatic optimization

## Getting Started

### Account Setup

::: code-group

```bash [Trial Account]
# Sign up for free trial (30 days, $400 credit)
# Visit: https://signup.snowflake.com/

# After signup, you'll receive:
# - Account URL: https://<account>.snowflakecomputing.com
# - Username and password
# - Default warehouse, database, and schema
```

```bash [SnowSQL (CLI)]
# Install SnowSQL CLI
# macOS
brew install --cask snowflake-snowsql

# Linux
curl -O https://sfc-repo.snowflakecomputing.com/snowsql/bootstrap/1.2/linux_x86_64/snowsql-1.2.28-linux_x86_64.bash
bash snowsql-1.2.28-linux_x86_64.bash

# Windows
# Download from: https://developers.snowflake.com/snowsql/

# Configure connection
snowsql -a <account> -u <username>
```

```python [Python Connector]
# Install Snowflake connector
pip install snowflake-connector-python

# Install Snowpark (for data transformations)
pip install snowflake-snowpark-python
```

```bash [JDBC/ODBC]
# Download JDBC driver
# https://docs.snowflake.com/en/developer-guide/jdbc/jdbc

# Download ODBC driver
# https://docs.snowflake.com/en/developer-guide/odbc/odbc
```

:::

### Connecting

```sql
-- Using SnowSQL
snowsql -a <account_identifier> -u <username>

-- Connection string format
snowsql -a xy12345.us-east-1 -u john_doe

-- Using parameters file (~/.snowsql/config)
[connections.prod]
accountname = xy12345.us-east-1
username = john_doe
password = <password>
dbname = my_database
schemaname = public
warehousename = compute_wh

-- Connect using named connection
snowsql -c prod
```

::: code-group

```python [Python]
import snowflake.connector

# Connect to Snowflake
conn = snowflake.connector.connect(
    user='john_doe',
    password='SecurePassword123',
    account='xy12345.us-east-1',
    warehouse='COMPUTE_WH',
    database='MY_DATABASE',
    schema='PUBLIC'
)

# Create cursor
cur = conn.cursor()

# Execute query
cur.execute("SELECT CURRENT_VERSION()")
print(cur.fetchone())

# Close connection
cur.close()
conn.close()
```

```python [Snowpark]
from snowflake.snowpark import Session

# Connection parameters
connection_parameters = {
    "account": "xy12345.us-east-1",
    "user": "john_doe",
    "password": "SecurePassword123",
    "role": "ACCOUNTADMIN",
    "warehouse": "COMPUTE_WH",
    "database": "MY_DATABASE",
    "schema": "PUBLIC"
}

# Create session
session = Session.builder.configs(connection_parameters).create()

# Run query
df = session.sql("SELECT CURRENT_VERSION()").collect()
print(df)

# Close session
session.close()
```

```javascript [Node.js]
const snowflake = require("snowflake-sdk");

// Create connection
const connection = snowflake.createConnection({
  account: "xy12345.us-east-1",
  username: "john_doe",
  password: "SecurePassword123",
  warehouse: "COMPUTE_WH",
  database: "MY_DATABASE",
  schema: "PUBLIC",
});

// Connect
connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect: " + err.message);
  } else {
    console.log("Successfully connected");

    // Execute query
    conn.execute({
      sqlText: "SELECT CURRENT_VERSION()",
      complete: (err, stmt, rows) => {
        console.log(rows);
      },
    });
  }
});
```

:::

## Snowflake-Specific Features

### Virtual Warehouses

Virtual warehouses are compute clusters that execute queries and DML operations. They can be created, resized, suspended, and resumed independently.

```sql
-- Create warehouse
CREATE WAREHOUSE my_warehouse
WITH
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 300
    AUTO_RESUME = TRUE
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 3
    SCALING_POLICY = 'STANDARD'
    INITIALLY_SUSPENDED = TRUE
    COMMENT = 'Warehouse for analytics queries';

-- Warehouse sizes: X-SMALL, SMALL, MEDIUM, LARGE, X-LARGE, 2X-LARGE, 3X-LARGE, 4X-LARGE, 5X-LARGE, 6X-LARGE

-- Use warehouse
USE WAREHOUSE my_warehouse;

-- Resize warehouse (immediate effect)
ALTER WAREHOUSE my_warehouse SET WAREHOUSE_SIZE = 'LARGE';

-- Suspend warehouse
ALTER WAREHOUSE my_warehouse SUSPEND;

-- Resume warehouse
ALTER WAREHOUSE my_warehouse RESUME;

-- Multi-cluster warehouse for concurrency
ALTER WAREHOUSE my_warehouse SET
    MIN_CLUSTER_COUNT = 2
    MAX_CLUSTER_COUNT = 5
    SCALING_POLICY = 'ECONOMY';  -- or 'STANDARD'

-- View warehouse details
SHOW WAREHOUSES;
DESC WAREHOUSE my_warehouse;

-- Monitor warehouse usage
SELECT
    start_time,
    end_time,
    warehouse_name,
    credits_used,
    credits_used_compute,
    credits_used_cloud_services
FROM snowflake.account_usage.warehouse_metering_history
WHERE warehouse_name = 'MY_WAREHOUSE'
    AND start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
ORDER BY start_time DESC;

-- Drop warehouse
DROP WAREHOUSE my_warehouse;
```

### Time Travel

Query historical data and recover deleted or modified objects within the retention period (0-90 days).

```sql
-- Query data as of a specific time
SELECT *
FROM my_table
AT(TIMESTAMP => '2024-01-15 10:30:00'::TIMESTAMP);

-- Query data as of offset from current time
SELECT *
FROM my_table
AT(OFFSET => -60*5);  -- 5 minutes ago

-- Query using statement ID
SELECT *
FROM my_table
BEFORE(STATEMENT => '01a1b2c3-0000-0000-0000-000000000000');

-- Restore dropped table
UNDROP TABLE my_table;

-- Restore to previous state
CREATE OR REPLACE TABLE my_table CLONE my_table
AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP);

-- Set retention period (Enterprise Edition: up to 90 days)
ALTER TABLE my_table SET DATA_RETENTION_TIME_IN_DAYS = 90;
ALTER DATABASE my_database SET DATA_RETENTION_TIME_IN_DAYS = 7;
ALTER SCHEMA my_schema SET DATA_RETENTION_TIME_IN_DAYS = 30;

-- View retention settings
SHOW PARAMETERS LIKE 'DATA_RETENTION_TIME_IN_DAYS' FOR TABLE my_table;

-- Query historical changes
SELECT *
FROM my_table
CHANGES(INFORMATION => DEFAULT)
AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP)
END(TIMESTAMP => CURRENT_TIMESTAMP());
```

### Zero-Copy Cloning

Create instant copies of databases, schemas, or tables without duplicating the underlying data.

```sql
-- Clone table
CREATE TABLE employees_clone CLONE employees;

-- Clone table at specific time
CREATE TABLE employees_backup CLONE employees
AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP);

-- Clone schema
CREATE SCHEMA analytics_dev CLONE analytics_prod;

-- Clone database
CREATE DATABASE production_backup CLONE production;

-- Clone with time travel
CREATE DATABASE db_restore CLONE production
AT(OFFSET => -60*60*24);  -- 24 hours ago

-- Swap tables (atomic swap)
ALTER TABLE employees SWAP WITH employees_new;

-- Clone external table
CREATE TABLE ext_table_clone CLONE ext_table;
```

### Data Sharing

Share live data securely with other Snowflake accounts without copying or moving data.

```sql
-- Create share
CREATE SHARE sales_share;

-- Grant usage on database
GRANT USAGE ON DATABASE sales_db TO SHARE sales_share;

-- Grant usage on schema
GRANT USAGE ON SCHEMA sales_db.public TO SHARE sales_share;

-- Grant select on tables
GRANT SELECT ON TABLE sales_db.public.orders TO SHARE sales_share;
GRANT SELECT ON ALL TABLES IN SCHEMA sales_db.public TO SHARE sales_share;

-- Add account to share
ALTER SHARE sales_share ADD ACCOUNTS = xy67890;

-- View shares
SHOW SHARES;
DESC SHARE sales_share;

-- Consumer side: Create database from share
CREATE DATABASE shared_sales_data FROM SHARE provider_account.sales_share;

-- Use shared data
SELECT * FROM shared_sales_data.public.orders;

-- Secure views for sharing (hide sensitive data)
CREATE SECURE VIEW public.customer_summary AS
SELECT
    customer_id,
    customer_name,
    total_orders,
    total_amount
FROM customers
WHERE region = CURRENT_ROLE();  -- Row-level security

-- Add secure view to share
GRANT SELECT ON VIEW sales_db.public.customer_summary TO SHARE sales_share;
```

### Streams and Tasks

Streams track changes to tables for CDC (Change Data Capture), while tasks enable scheduling and automation.

```sql
-- Create stream on table
CREATE STREAM customer_stream ON TABLE customers;

-- Query stream (shows inserts, updates, deletes)
SELECT
    customer_id,
    customer_name,
    METADATA$ACTION,
    METADATA$ISUPDATE,
    METADATA$ROW_ID
FROM customer_stream;

-- Create task to process stream
CREATE TASK process_customer_changes
    WAREHOUSE = compute_wh
    SCHEDULE = '5 MINUTE'
WHEN
    SYSTEM$STREAM_HAS_DATA('customer_stream')
AS
    INSERT INTO customer_history
    SELECT *, CURRENT_TIMESTAMP() AS processed_time
    FROM customer_stream;

-- Resume task (tasks are suspended by default)
ALTER TASK process_customer_changes RESUME;

-- Create dependent task (DAG)
CREATE TASK aggregate_sales
    WAREHOUSE = compute_wh
    AFTER process_customer_changes
AS
    INSERT INTO sales_summary
    SELECT customer_id, SUM(amount)
    FROM orders
    GROUP BY customer_id;

-- View task history
SELECT
    name,
    state,
    scheduled_time,
    query_start_time,
    next_scheduled_time
FROM table(information_schema.task_history())
WHERE name = 'PROCESS_CUSTOMER_CHANGES'
ORDER BY scheduled_time DESC;

-- Suspend task
ALTER TASK process_customer_changes SUSPEND;

-- Drop stream and task
DROP TASK process_customer_changes;
DROP STREAM customer_stream;
```

### Semi-Structured Data

Snowflake natively supports JSON, Avro, Parquet, XML, and ORC with the VARIANT data type.

```sql
-- Create table with VARIANT column
CREATE TABLE events (
    event_id NUMBER,
    event_time TIMESTAMP,
    event_data VARIANT
);

-- Insert JSON data
INSERT INTO events
SELECT
    1,
    CURRENT_TIMESTAMP(),
    PARSE_JSON('{
        "user_id": 12345,
        "action": "purchase",
        "product": {
            "id": 789,
            "name": "Laptop",
            "price": 999.99
        },
        "tags": ["electronics", "computers"]
    }');

-- Query JSON data using dot notation
SELECT
    event_id,
    event_data:user_id::NUMBER AS user_id,
    event_data:action::STRING AS action,
    event_data:product.name::STRING AS product_name,
    event_data:product.price::NUMBER(10,2) AS price
FROM events;

-- Query array elements
SELECT
    event_id,
    value::STRING AS tag
FROM events,
LATERAL FLATTEN(input => event_data:tags);

-- Create view on semi-structured data
CREATE VIEW event_details AS
SELECT
    event_id,
    event_time,
    event_data:user_id::NUMBER AS user_id,
    event_data:action::STRING AS action,
    event_data:product.id::NUMBER AS product_id,
    event_data:product.name::STRING AS product_name,
    event_data:product.price::NUMBER(10,2) AS product_price
FROM events;

-- Load JSON from stage
COPY INTO events
FROM @my_stage/events.json
FILE_FORMAT = (TYPE = 'JSON');

-- Flatten nested arrays
SELECT
    event_data:user_id AS user_id,
    f.value:id AS item_id,
    f.value:quantity AS quantity
FROM events,
LATERAL FLATTEN(input => event_data:items) f;
```

### Snowpipe (Continuous Data Loading)

Automate data loading as files arrive in cloud storage.

```sql
-- Create pipe
CREATE PIPE customer_pipe
    AUTO_INGEST = TRUE
    AWS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123456789012:s3_notification'
AS
    COPY INTO customers
    FROM @customer_stage
    FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 1);

-- View pipe status
SELECT SYSTEM$PIPE_STATUS('customer_pipe');

-- View pipe history
SELECT *
FROM table(information_schema.copy_history(
    TABLE_NAME => 'customers',
    START_TIME => DATEADD(hours, -1, CURRENT_TIMESTAMP())
));

-- Manually trigger pipe
ALTER PIPE customer_pipe REFRESH;

-- Pause pipe
ALTER PIPE customer_pipe SET PIPE_EXECUTION_PAUSED = TRUE;

-- Resume pipe
ALTER PIPE customer_pipe SET PIPE_EXECUTION_PAUSED = FALSE;

-- Drop pipe
DROP PIPE customer_pipe;
```

### External Tables

Query data in external cloud storage without loading it into Snowflake.

```sql
-- Create external stage
CREATE STAGE s3_stage
    URL = 's3://mybucket/data/'
    CREDENTIALS = (AWS_KEY_ID = 'xxx' AWS_SECRET_KEY = 'xxx');

-- Create external table
CREATE EXTERNAL TABLE ext_orders (
    order_id NUMBER AS (value:c1::NUMBER),
    customer_id NUMBER AS (value:c2::NUMBER),
    order_date DATE AS (value:c3::DATE),
    amount NUMBER(10,2) AS (value:c4::NUMBER(10,2))
)
WITH LOCATION = @s3_stage/orders/
FILE_FORMAT = (TYPE = 'PARQUET');

-- Query external table
SELECT * FROM ext_orders WHERE order_date >= '2024-01-01';

-- Refresh external table metadata
ALTER EXTERNAL TABLE ext_orders REFRESH;

-- Partition external table
CREATE EXTERNAL TABLE ext_sales (
    sale_id NUMBER AS (value:c1::NUMBER),
    sale_date DATE AS (value:c2::DATE),
    amount NUMBER AS (value:c3::NUMBER)
)
PARTITION BY (sale_date)
WITH LOCATION = @s3_stage/sales/
FILE_FORMAT = (TYPE = 'PARQUET')
AUTO_REFRESH = TRUE;
```

### Materialized Views

Create pre-computed views that automatically refresh when base tables change.

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW sales_summary AS
SELECT
    DATE_TRUNC('day', order_date) AS order_day,
    product_id,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount
FROM orders
GROUP BY 1, 2;

-- Query materialized view (fast, uses pre-computed results)
SELECT * FROM sales_summary WHERE order_day >= '2024-01-01';

-- Materialized views refresh automatically
-- Manual refresh is not needed

-- Suspend automatic refresh
ALTER MATERIALIZED VIEW sales_summary SUSPEND;

-- Resume automatic refresh
ALTER MATERIALIZED VIEW sales_summary RESUME;

-- View refresh history
SELECT *
FROM table(information_schema.materialized_view_refresh_history(
    'sales_summary',
    DATEADD('day', -7, CURRENT_TIMESTAMP())
));

-- Drop materialized view
DROP MATERIALIZED VIEW sales_summary;

-- Cluster materialized view for better performance
CREATE MATERIALIZED VIEW sales_by_region
CLUSTER BY (region, order_date) AS
SELECT
    region,
    DATE_TRUNC('day', order_date) AS order_date,
    SUM(amount) AS total_sales
FROM orders
GROUP BY region, DATE_TRUNC('day', order_date);
```

### Clustering Keys

Improve query performance by co-locating related data.

```sql
-- Create table with clustering key
CREATE TABLE large_events (
    event_id NUMBER,
    event_date DATE,
    user_id NUMBER,
    event_type STRING,
    event_data VARIANT
)
CLUSTER BY (event_date, event_type);

-- Add clustering to existing table
ALTER TABLE large_events CLUSTER BY (event_date, user_id);

-- Remove clustering
ALTER TABLE large_events DROP CLUSTERING KEY;

-- View clustering information
SELECT SYSTEM$CLUSTERING_INFORMATION('large_events');

-- View clustering depth (0-1, lower is better)
SELECT SYSTEM$CLUSTERING_DEPTH('large_events');

-- Automatic clustering (Enterprise Edition)
ALTER TABLE large_events RESUME RECLUSTER;
ALTER TABLE large_events SUSPEND RECLUSTER;

-- Multi-column clustering
CREATE TABLE transactions (
    transaction_id NUMBER,
    transaction_date DATE,
    customer_id NUMBER,
    amount NUMBER
)
CLUSTER BY (transaction_date, customer_id);
```

### Snowpark

Write data transformations in Python, Java, or Scala instead of SQL.

```python
from snowflake.snowpark import Session
from snowflake.snowpark.functions import col, sum, avg

# Create session
session = Session.builder.configs(connection_parameters).create()

# Read table as DataFrame
df = session.table("orders")

# Filter and transform
result = df.filter(col("order_date") >= "2024-01-01") \
    .group_by("customer_id") \
    .agg(
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount")
    ) \
    .filter(col("total_amount") > 1000)

# Show results
result.show()

# Save to table
result.write.mode("overwrite").save_as_table("customer_summary")

# User-Defined Functions (UDFs)
from snowflake.snowpark.types import IntegerType

def square(x):
    return x * x

# Register UDF
square_udf = session.udf.register(
    square,
    return_type=IntegerType(),
    input_types=[IntegerType()]
)

# Use UDF
df = session.create_dataframe([[1], [2], [3]], schema=["num"])
df.select(square_udf(col("num")).alias("squared")).show()

# Stored Procedure in Python
from snowflake.snowpark.types import StringType

def load_data(session: Session, source: str) -> str:
    session.sql(f"COPY INTO target_table FROM @{source}").collect()
    return "Success"

# Register stored procedure
session.sproc.register(
    load_data,
    name="load_data_proc",
    replace=True
)

# Call stored procedure
session.call("load_data_proc", "my_stage")
```

## Advanced Features

### Dynamic Data Masking

Mask sensitive data at query time based on user roles.

```sql
-- Create masking policy
CREATE MASKING POLICY email_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ADMIN', 'SECURITY') THEN val
        ELSE REGEXP_REPLACE(val, '.+@', '****@')
    END;

-- Apply masking policy to column
ALTER TABLE customers MODIFY COLUMN email
SET MASKING POLICY email_mask;

-- Create number masking policy
CREATE MASKING POLICY ssn_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ADMIN') THEN val
        ELSE '***-**-' || SUBSTRING(val, 8, 4)
    END;

-- Apply to SSN column
ALTER TABLE employees MODIFY COLUMN ssn
SET MASKING POLICY ssn_mask;

-- View applied policies
SELECT * FROM table(information_schema.policy_references(
    POLICY_NAME => 'EMAIL_MASK'
));

-- Remove masking policy
ALTER TABLE customers MODIFY COLUMN email
UNSET MASKING POLICY;

-- Drop masking policy
DROP MASKING POLICY email_mask;
```

### Row Access Policies

Implement row-level security to control which rows users can access.

```sql
-- Create row access policy
CREATE ROW ACCESS POLICY region_policy AS (region_col STRING)
RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'ADMIN' THEN TRUE
        WHEN CURRENT_ROLE() = 'SALES_US' AND region_col = 'US' THEN TRUE
        WHEN CURRENT_ROLE() = 'SALES_EU' AND region_col = 'EU' THEN TRUE
        ELSE FALSE
    END;

-- Apply row access policy to table
ALTER TABLE sales
ADD ROW ACCESS POLICY region_policy ON (region);

-- Users will only see rows they're authorized to access
SELECT * FROM sales;  -- Automatically filtered by policy

-- View applied policies
DESC TABLE sales;

-- Remove row access policy
ALTER TABLE sales DROP ROW ACCESS POLICY region_policy;

-- Drop row access policy
DROP ROW ACCESS POLICY region_policy;
```

### Result Caching

Snowflake automatically caches query results for 24 hours for faster repeated queries.

```sql
-- Result cache is automatic and free
-- Repeated identical queries use cached results

-- Disable result cache for a session
ALTER SESSION SET USE_CACHED_RESULT = FALSE;

-- Enable result cache
ALTER SESSION SET USE_CACHED_RESULT = TRUE;

-- View query profile to see if cache was used
SELECT query_id, query_text, execution_status, query_tag
FROM table(information_schema.query_history())
WHERE execution_status = 'SUCCESS'
    AND bytes_scanned = 0  -- Indicates cache was used
ORDER BY start_time DESC
LIMIT 10;
```

### Search Optimization Service

Improve performance of point lookup and selective filtering queries.

```sql
-- Enable search optimization on table
ALTER TABLE large_table ADD SEARCH OPTIMIZATION;

-- Enable on specific columns
ALTER TABLE large_table ADD SEARCH OPTIMIZATION
ON EQUALITY(customer_id, email)
ON SUBSTRING(description);

-- View search optimization status
SELECT * FROM table(
    information_schema.search_optimization_history(
        TABLE_NAME => 'LARGE_TABLE'
    )
);

-- Drop search optimization
ALTER TABLE large_table DROP SEARCH OPTIMIZATION;

-- Costs credits but significantly improves point lookup queries
-- Example: WHERE customer_id = 12345
-- Example: WHERE email LIKE '%@example.com'
```

### Query Acceleration Service

Automatically accelerate portions of queries that can benefit from additional compute.

```sql
-- Enable query acceleration on warehouse
ALTER WAREHOUSE compute_wh SET ENABLE_QUERY_ACCELERATION = TRUE;

-- Set scale factor (1-100, controls max resources)
ALTER WAREHOUSE compute_wh SET QUERY_ACCELERATION_MAX_SCALE_FACTOR = 8;

-- View eligible queries
SELECT
    query_id,
    query_text,
    eligible_query_acceleration_time
FROM table(information_schema.query_acceleration_eligible(
    DATEADD('hour', -1, CURRENT_TIMESTAMP())
));

-- View acceleration history
SELECT
    query_id,
    eligible_query_acceleration_time,
    upper_limit_scale_factor,
    query_acceleration_bytes_scanned
FROM snowflake.account_usage.query_acceleration_history
WHERE start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP());
```

## Data Types

### Numeric Types

| Type                                    | Precision        | Scale | Range           |
| --------------------------------------- | ---------------- | ----- | --------------- |
| NUMBER                                  | 1-38             | 0-38  | -10^38 to 10^38 |
| DECIMAL, NUMERIC                        | Alias for NUMBER |       |                 |
| INT, INTEGER, BIGINT, SMALLINT, TINYINT | 38               | 0     | Whole numbers   |
| FLOAT, DOUBLE                           | Approximate      |       | IEEE 754        |

### String Types

| Type            | Description       | Max Size |
| --------------- | ----------------- | -------- |
| VARCHAR         | Variable-length   | 16 MB    |
| CHAR, CHARACTER | Alias for VARCHAR | 16 MB    |
| STRING, TEXT    | Alias for VARCHAR | 16 MB    |
| BINARY          | Binary data       | 8 MB     |
| VARBINARY       | Alias for BINARY  | 8 MB     |

### Date/Time Types

| Type          | Format                 | Range                                                |
| ------------- | ---------------------- | ---------------------------------------------------- |
| DATE          | YYYY-MM-DD             | 0001-01-01 to 9999-12-31                             |
| TIME          | HH:MI:SS               | 00:00:00 to 23:59:59.999999999                       |
| TIMESTAMP     | YYYY-MM-DD HH:MI:SS    | 0001-01-01 00:00:00 to 9999-12-31 23:59:59.999999999 |
| TIMESTAMP_LTZ | With local time zone   |                                                      |
| TIMESTAMP_NTZ | No time zone (default) |                                                      |
| TIMESTAMP_TZ  | With time zone         |                                                      |

### Semi-Structured Types

- **VARIANT**: Stores semi-structured data (JSON, Avro, Parquet, XML, ORC)
- **OBJECT**: Stores key-value pairs
- **ARRAY**: Stores arrays

### Other Types

- **BOOLEAN**: TRUE, FALSE, NULL
- **GEOGRAPHY**: Geospatial data (GeoJSON)
- **GEOMETRY**: Geospatial data (WKT, WKB, EWKT, EWKB, GeoJSON)

## Common Operations

### Database and Schema Management

```sql
-- Create database
CREATE DATABASE my_database
    DATA_RETENTION_TIME_IN_DAYS = 7
    COMMENT = 'Production database';

-- Use database
USE DATABASE my_database;

-- Create schema
CREATE SCHEMA analytics
    DATA_RETENTION_TIME_IN_DAYS = 30;

-- Use schema
USE SCHEMA analytics;

-- Create transient table (no time travel, lower cost)
CREATE TRANSIENT TABLE temp_data (
    id NUMBER,
    data STRING
);

-- Create temporary table (session-scoped)
CREATE TEMPORARY TABLE session_data (
    id NUMBER,
    data STRING
);

-- View databases
SHOW DATABASES;

-- View schemas
SHOW SCHEMAS IN DATABASE my_database;

-- Drop database
DROP DATABASE my_database;
```

### Table Operations

```sql
-- Create table
CREATE TABLE employees (
    employee_id NUMBER AUTOINCREMENT PRIMARY KEY,
    first_name STRING NOT NULL,
    last_name STRING NOT NULL,
    email STRING UNIQUE,
    hire_date DATE DEFAULT CURRENT_DATE(),
    salary NUMBER(10,2),
    department_id NUMBER,
    manager_id NUMBER,
    CONSTRAINT fk_dept FOREIGN KEY (department_id)
        REFERENCES departments(department_id),
    CONSTRAINT fk_mgr FOREIGN KEY (manager_id)
        REFERENCES employees(employee_id)
);

-- Create table from query
CREATE TABLE high_earners AS
SELECT * FROM employees WHERE salary > 100000;

-- Add column
ALTER TABLE employees ADD COLUMN phone_number STRING;

-- Modify column
ALTER TABLE employees MODIFY COLUMN email SET NOT NULL;

-- Rename column
ALTER TABLE employees RENAME COLUMN phone_number TO mobile;

-- Drop column
ALTER TABLE employees DROP COLUMN mobile;

-- Truncate table
TRUNCATE TABLE employees;

-- Drop table
DROP TABLE employees;

-- Show tables
SHOW TABLES IN SCHEMA analytics;

-- Describe table
DESC TABLE employees;
```

### Data Loading

```sql
-- Create stage
CREATE STAGE my_stage
    URL = 's3://mybucket/data/'
    CREDENTIALS = (AWS_KEY_ID = 'xxx' AWS_SECRET_KEY = 'xxx');

-- Create file format
CREATE FILE FORMAT csv_format
    TYPE = 'CSV'
    FIELD_DELIMITER = ','
    SKIP_HEADER = 1
    NULL_IF = ('NULL', 'null', '')
    EMPTY_FIELD_AS_NULL = TRUE
    COMPRESSION = 'GZIP';

-- List files in stage
LIST @my_stage;

-- Load data from stage
COPY INTO employees
FROM @my_stage/employees.csv
FILE_FORMAT = csv_format
ON_ERROR = 'CONTINUE';

-- Load with pattern matching
COPY INTO orders
FROM @my_stage
PATTERN = '.*orders.*[.]csv'
FILE_FORMAT = csv_format;

-- Load JSON data
COPY INTO events
FROM @my_stage/events.json
FILE_FORMAT = (TYPE = 'JSON')
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;

-- Load Parquet data
COPY INTO sales
FROM @my_stage/sales.parquet
FILE_FORMAT = (TYPE = 'PARQUET');

-- Validate data before loading
COPY INTO employees
FROM @my_stage/employees.csv
FILE_FORMAT = csv_format
VALIDATION_MODE = 'RETURN_ERRORS';

-- View load history
SELECT *
FROM table(information_schema.copy_history(
    TABLE_NAME => 'employees',
    START_TIME => DATEADD(hours, -24, CURRENT_TIMESTAMP())
));
```

### Data Unloading

```sql
-- Unload data to stage
COPY INTO @my_stage/employees_export.csv
FROM employees
FILE_FORMAT = csv_format
SINGLE = FALSE
MAX_FILE_SIZE = 4900000000
OVERWRITE = TRUE;

-- Unload with partitioning
COPY INTO @my_stage/orders_export/
FROM (SELECT * FROM orders WHERE order_date >= '2024-01-01')
PARTITION BY (DATE_TRUNC('month', order_date))
FILE_FORMAT = (TYPE = 'PARQUET')
HEADER = TRUE;

-- Unload to JSON
COPY INTO @my_stage/events.json
FROM events
FILE_FORMAT = (TYPE = 'JSON')
OVERWRITE = TRUE;

-- Get presigned URL for download
SELECT GET_PRESIGNED_URL(@my_stage, 'employees_export.csv', 3600);
```

### User and Role Management

```sql
-- Create role
CREATE ROLE data_analyst;

-- Grant privileges to role
GRANT USAGE ON DATABASE analytics_db TO ROLE data_analyst;
GRANT USAGE ON SCHEMA analytics_db.public TO ROLE data_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics_db.public TO ROLE data_analyst;
GRANT SELECT ON FUTURE TABLES IN SCHEMA analytics_db.public TO ROLE data_analyst;

-- Create user
CREATE USER john_doe
    PASSWORD = 'SecurePassword123'
    DEFAULT_ROLE = data_analyst
    DEFAULT_WAREHOUSE = compute_wh
    MUST_CHANGE_PASSWORD = TRUE;

-- Grant role to user
GRANT ROLE data_analyst TO USER john_doe;

-- Create hierarchy
GRANT ROLE data_analyst TO ROLE data_scientist;
GRANT ROLE data_scientist TO USER jane_doe;

-- Switch role
USE ROLE data_analyst;

-- View current role
SELECT CURRENT_ROLE();

-- View grants
SHOW GRANTS TO ROLE data_analyst;
SHOW GRANTS ON TABLE employees;
SHOW GRANTS TO USER john_doe;

-- Revoke privileges
REVOKE SELECT ON TABLE employees FROM ROLE data_analyst;

-- Drop user
DROP USER john_doe;

-- Drop role
DROP ROLE data_analyst;
```

### Query Performance

```sql
-- View query history
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    execution_status,
    total_elapsed_time / 1000 AS elapsed_seconds,
    bytes_scanned,
    rows_produced
FROM table(information_schema.query_history())
WHERE start_time >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
ORDER BY total_elapsed_time DESC
LIMIT 10;

-- Get query profile
SELECT SYSTEM$QUERY_PROFILE('01a1b2c3-0000-0000-0000-000000000000');

-- Explain query plan
EXPLAIN SELECT * FROM large_table WHERE date_col >= '2024-01-01';

-- Use query tag for tracking
ALTER SESSION SET QUERY_TAG = 'monthly_report';
SELECT * FROM sales WHERE sale_date >= '2024-01-01';
ALTER SESSION UNSET QUERY_TAG;

-- Monitor running queries
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    start_time,
    DATEDIFF(second, start_time, CURRENT_TIMESTAMP()) AS running_seconds
FROM table(information_schema.query_history())
WHERE execution_status = 'RUNNING';

-- Cancel query
SELECT SYSTEM$CANCEL_QUERY('01a1b2c3-0000-0000-0000-000000000000');
```

## Window Functions

Snowflake supports all standard window functions with powerful partitioning capabilities.

```sql
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
    PERCENT_RANK() OVER (PARTITION BY department_id ORDER BY salary) AS pct_rank,
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
    -- Cumulative aggregates
    SUM(salary) OVER (
        PARTITION BY department_id
        ORDER BY employee_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    -- Moving average
    AVG(salary) OVER (
        PARTITION BY department_id
        ORDER BY hire_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3
FROM employees;
```

## Performance Optimization

### Best Practices

```sql
-- 1. Use clustering for large tables
ALTER TABLE large_table CLUSTER BY (date_col, category);

-- 2. Use appropriate warehouse size
-- Start small, scale up if needed
USE WAREHOUSE small_wh;  -- For light queries
USE WAREHOUSE large_wh;  -- For heavy analytics

-- 3. Use result caching
-- Identical queries within 24 hours use cached results (free)

-- 4. Use transient tables for temporary data
CREATE TRANSIENT TABLE staging_data AS
SELECT * FROM source_table;

-- 5. Partition external tables
CREATE EXTERNAL TABLE partitioned_sales
PARTITION BY (sale_date)
LOCATION = @s3_stage/sales/
FILE_FORMAT = (TYPE = 'PARQUET')
AUTO_REFRESH = TRUE;

-- 6. Use LIMIT for exploratory queries
SELECT * FROM large_table LIMIT 100;

-- 7. Filter early and reduce data volume
SELECT customer_id, SUM(amount)
FROM orders
WHERE order_date >= '2024-01-01'  -- Filter first
GROUP BY customer_id;

-- 8. Use materialized views for repeated aggregations
CREATE MATERIALIZED VIEW daily_sales AS
SELECT DATE_TRUNC('day', order_date) AS day,
       SUM(amount) AS total_sales
FROM orders
GROUP BY 1;

-- 9. Use search optimization for point lookups
ALTER TABLE customers ADD SEARCH OPTIMIZATION
ON EQUALITY(customer_id, email);

-- 10. Monitor and optimize warehouse usage
SELECT
    warehouse_name,
    SUM(credits_used) AS total_credits,
    SUM(credits_used_compute) AS compute_credits,
    SUM(credits_used_cloud_services) AS cloud_credits
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY warehouse_name
ORDER BY total_credits DESC;
```

## Security Features

### Network Policies

```sql
-- Create network policy
CREATE NETWORK POLICY office_policy
    ALLOWED_IP_LIST = ('192.168.1.0/24', '10.0.0.0/8')
    BLOCKED_IP_LIST = ('192.168.1.99');

-- Apply to account
ALTER ACCOUNT SET NETWORK_POLICY = office_policy;

-- Apply to user
ALTER USER john_doe SET NETWORK_POLICY = office_policy;

-- View network policies
SHOW NETWORK POLICIES;

-- Drop network policy
DROP NETWORK POLICY office_policy;
```

### Multi-Factor Authentication

```sql
-- Enable MFA for user
ALTER USER john_doe SET MINS_TO_BYPASS_MFA = 0;

-- Disable MFA bypass
ALTER USER john_doe UNSET MINS_TO_BYPASS_MFA;

-- Enforce MFA at account level
ALTER ACCOUNT SET MFA_AUTHENTICATION_POLICY = 'REQUIRED';
```

### Object Tagging

```sql
-- Create tag
CREATE TAG pii_tag ALLOWED_VALUES 'sensitive', 'public';

-- Apply tag to column
ALTER TABLE customers MODIFY COLUMN email
SET TAG pii_tag = 'sensitive';

-- Apply tag to table
ALTER TABLE customers SET TAG pii_tag = 'sensitive';

-- Query tagged objects
SELECT *
FROM snowflake.account_usage.tag_references
WHERE tag_name = 'PII_TAG'
    AND tag_value = 'sensitive';

-- Use with masking policy
CREATE MASKING POLICY pii_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN SYSTEM$GET_TAG_ON_CURRENT_COLUMN('pii_tag') = 'sensitive'
             AND CURRENT_ROLE() NOT IN ('ADMIN')
        THEN '***MASKED***'
        ELSE val
    END;
```

## Snowflake vs Other Databases

| Feature         | Snowflake                 | Redshift            | BigQuery        | Databricks       |
| --------------- | ------------------------- | ------------------- | --------------- | ---------------- |
| Architecture    | Multi-cluster shared data | MPP                 | Serverless      | Lakehouse        |
| Storage/Compute | Fully separated           | Partially separated | Fully separated | Separated        |
| Scaling         | Independent, instant      | Manual resize       | Automatic       | Automatic        |
| Time Travel     | 0-90 days                 | Manual snapshots    | 7 days          | Delta Lake       |
| Zero-Copy Clone | Yes                       | No                  | Snapshots       | Delta Lake       |
| Data Sharing    | Native, live              | Manual copy         | Analytics Hub   | Delta Sharing    |
| Semi-Structured | Native VARIANT            | SUPER type          | JSON            | Native           |
| Streams/CDC     | Native                    | Manual              | Change streams  | Change Data Feed |
| Cost Model      | Per-second billing        | Hourly              | Per-query       | Per-DBU          |
| Multi-Cloud     | AWS, Azure, GCP           | AWS only            | GCP only        | AWS, Azure, GCP  |

## Best Practices

### 1. Warehouse Sizing and Management

```sql
-- Start with smaller warehouse
CREATE WAREHOUSE query_wh
WITH WAREHOUSE_SIZE = 'SMALL'
     AUTO_SUSPEND = 60
     AUTO_RESUME = TRUE;

-- Use multi-cluster for concurrency
CREATE WAREHOUSE prod_wh
WITH WAREHOUSE_SIZE = 'LARGE'
     MIN_CLUSTER_COUNT = 1
     MAX_CLUSTER_COUNT = 3
     SCALING_POLICY = 'ECONOMY';

-- Separate warehouses by workload
CREATE WAREHOUSE etl_wh WITH WAREHOUSE_SIZE = 'X-LARGE';
CREATE WAREHOUSE reporting_wh WITH WAREHOUSE_SIZE = 'MEDIUM';
CREATE WAREHOUSE adhoc_wh WITH WAREHOUSE_SIZE = 'SMALL';
```

### 2. Use Appropriate Table Types

```sql
-- Permanent table (default) - Use for production data
CREATE TABLE production_data (...);

-- Transient table - Use for staging/temporary data (lower cost, no fail-safe)
CREATE TRANSIENT TABLE staging_data (...);

-- Temporary table - Use for session-specific data
CREATE TEMPORARY TABLE session_data (...);
```

### 3. Optimize Data Loading

```sql
-- Use warehouse appropriate for data volume
USE WAREHOUSE etl_wh;

-- Load in parallel with multiple files
COPY INTO large_table
FROM @my_stage
PATTERN = '.*[.]csv'
FILE_FORMAT = csv_format;

-- Use Snowpipe for continuous loading
CREATE PIPE auto_load_pipe AUTO_INGEST = TRUE AS
COPY INTO target_table FROM @auto_stage;
```

### 4. Implement Proper Security

```sql
-- Use role-based access control
CREATE ROLE analyst;
GRANT USAGE ON WAREHOUSE query_wh TO ROLE analyst;
GRANT USAGE ON DATABASE analytics_db TO ROLE analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics_db.public TO ROLE analyst;

-- Mask sensitive data
CREATE MASKING POLICY mask_pii AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ADMIN', 'COMPLIANCE')
        THEN val
        ELSE '***MASKED***'
    END;

ALTER TABLE customers MODIFY COLUMN ssn SET MASKING POLICY mask_pii;
```

### 5. Monitor and Optimize Costs

```sql
-- Monitor warehouse usage
SELECT
    warehouse_name,
    DATE_TRUNC('day', start_time) AS day,
    SUM(credits_used) AS total_credits
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATEADD(month, -1, CURRENT_TIMESTAMP())
GROUP BY 1, 2
ORDER BY total_credits DESC;

-- Monitor storage usage
SELECT
    DATE_TRUNC('day', usage_date) AS day,
    AVG(storage_bytes) / POWER(1024, 3) AS avg_storage_gb,
    AVG(failsafe_bytes) / POWER(1024, 3) AS avg_failsafe_gb
FROM snowflake.account_usage.storage_usage
WHERE usage_date >= DATEADD(month, -1, CURRENT_TIMESTAMP())
GROUP BY 1
ORDER BY 1;

-- Identify expensive queries
SELECT
    query_id,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS seconds,
    credits_used_cloud_services
FROM snowflake.account_usage.query_history
WHERE start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
    AND credits_used_cloud_services > 0
ORDER BY credits_used_cloud_services DESC
LIMIT 20;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="snowflake" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Traditional relational database
- [MySQL](/databases/mysql/) - Popular open-source database
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [Joins](/concepts/joins/) - Join operations

## Resources

- [Official Documentation](https://docs.snowflake.com/)
- [Snowflake University](https://learn.snowflake.com/) - Free training and certification
- [Snowflake Community](https://community.snowflake.com/) - Forums and discussions
- [Snowflake Quickstarts](https://quickstarts.snowflake.com/) - Hands-on tutorials
- [Snowflake YouTube Channel](https://www.youtube.com/user/snowflakecomputing) - Video tutorials
- [Snowflake SQL Reference](https://docs.snowflake.com/en/sql-reference) - Complete SQL syntax
- [Snowflake Blog](https://www.snowflake.com/blog/) - Best practices and announcements
