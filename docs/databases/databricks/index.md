---
title: Databricks
description: Comprehensive guide to Databricks - Unified lakehouse platform for data analytics, AI, and machine learning
difficulty: intermediate
tags: [databricks, lakehouse, spark, delta-lake, analytics, ml]
---

# Databricks

## Overview

Databricks is a unified data analytics platform built on Apache Spark that combines data warehousing and data lakes into a lakehouse architecture. It provides a collaborative environment for data engineers, data scientists, and analysts to build, deploy, and manage data pipelines, analytics workflows, and machine learning models at scale.

### Key Features

- **Lakehouse Architecture**: Unified platform combining data lake flexibility with data warehouse performance
- **Unity Catalog**: Centralized governance and metadata management across all data assets
- **Delta Lake**: ACID transactions, time travel, and schema enforcement on data lakes
- **Databricks SQL**: High-performance SQL analytics engine with serverless compute
- **Apache Spark Integration**: Native support for Spark SQL, DataFrames, and distributed processing
- **Collaborative Notebooks**: Interactive development environment supporting Python, SQL, Scala, and R
- **MLflow Integration**: Complete ML lifecycle management built-in
- **Auto Scaling**: Automatic cluster scaling based on workload
- **Multi-Cloud Support**: Available on AWS, Azure, and GCP
- **Photon Engine**: High-performance vectorized query engine

## Getting Started

### Account Setup

::: code-group

```bash [Community Edition]
# Sign up for free Databricks Community Edition
# Visit: https://community.cloud.databricks.com/

# Features:
# - Free access to Databricks platform
# - 15 GB cluster limit
# - Limited to single-node clusters
# - Access to notebooks, SQL, and ML
```

```bash [Databricks CLI]
# Install Databricks CLI
pip install databricks-cli

# Configure authentication
databricks configure --token

# Enter your workspace URL and personal access token
# Workspace URL: https://<instance-name>.cloud.databricks.com
# Token: Generate from User Settings > Access Tokens

# Verify connection
databricks workspace ls /
```

```bash [Cloud Deployment]
# AWS
# Visit: https://accounts.cloud.databricks.com/
# Create account and workspace

# Azure
# Create Databricks workspace from Azure Portal
# Or use Azure CLI:
az databricks workspace create \
  --resource-group myResourceGroup \
  --name myDatabricksWorkspace \
  --location eastus \
  --sku premium

# GCP
# Visit Google Cloud Console
# Navigate to Databricks for GCP
```

:::

### Connecting

::: code-group

```python [Python SDK]
from databricks import sql
import os

# Connect using personal access token
connection = sql.connect(
    server_hostname=os.getenv("DATABRICKS_SERVER_HOSTNAME"),
    http_path=os.getenv("DATABRICKS_HTTP_PATH"),
    access_token=os.getenv("DATABRICKS_TOKEN")
)

# Execute query
cursor = connection.cursor()
cursor.execute("SELECT * FROM samples.nyctaxi.trips LIMIT 10")
result = cursor.fetchall()

for row in result:
    print(row)

cursor.close()
connection.close()
```

```python [PySpark in Notebook]
# In Databricks notebook, SparkSession is pre-configured
# Access via 'spark' variable

# Run SQL query
df = spark.sql("SELECT * FROM samples.nyctaxi.trips LIMIT 10")
df.show()

# Use DataFrame API
from pyspark.sql.functions import col, sum, avg

df = spark.table("samples.nyctaxi.trips") \
    .filter(col("fare_amount") > 10) \
    .groupBy("payment_type") \
    .agg(
        sum("fare_amount").alias("total_fare"),
        avg("fare_amount").alias("avg_fare")
    )
df.display()  # Databricks-specific display function
```

```sql [SQL Notebook]
-- In Databricks SQL notebook
-- Use %sql magic command or create SQL cell

%sql
SELECT
    payment_type,
    COUNT(*) as trip_count,
    AVG(fare_amount) as avg_fare,
    SUM(fare_amount) as total_fare
FROM samples.nyctaxi.trips
GROUP BY payment_type
ORDER BY total_fare DESC
```

```javascript [JDBC]
// JDBC connection string format
String jdbcUrl = "jdbc:databricks://<server-hostname>:443/default;" +
                 "transportMode=http;" +
                 "ssl=1;" +
                 "httpPath=<http-path>;" +
                 "AuthMech=3;" +
                 "UID=token;" +
                 "PWD=<access-token>";

// Load driver
Class.forName("com.databricks.client.jdbc.Driver");

// Connect
Connection conn = DriverManager.getConnection(jdbcUrl);
Statement stmt = conn.createStatement();

// Execute query
ResultSet rs = stmt.executeQuery("SELECT * FROM my_table LIMIT 10");
while (rs.next()) {
    System.out.println(rs.getString(1));
}
```

:::

## Databricks-Specific Features

### Unity Catalog

Unity Catalog provides centralized governance, security, and metadata management across all workspaces.

```sql
-- Create catalog
CREATE CATALOG sales_catalog
COMMENT 'Production sales data catalog';

-- Use catalog
USE CATALOG sales_catalog;

-- Create schema within catalog
CREATE SCHEMA bronze
COMMENT 'Raw ingested data';

CREATE SCHEMA silver
COMMENT 'Cleaned and validated data';

CREATE SCHEMA gold
COMMENT 'Business-level aggregates';

-- Three-level namespace: catalog.schema.table
CREATE TABLE sales_catalog.bronze.raw_orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_date TIMESTAMP,
    amount DECIMAL(10,2)
);

-- Grant permissions
GRANT USE CATALOG ON CATALOG sales_catalog TO `data_engineers`;
GRANT USE SCHEMA ON SCHEMA sales_catalog.bronze TO `data_engineers`;
GRANT SELECT ON TABLE sales_catalog.bronze.raw_orders TO `analysts`;

-- Create managed location for catalog
CREATE CATALOG managed_catalog
MANAGED LOCATION 's3://my-bucket/catalogs/managed/';

-- View catalog metadata
DESCRIBE CATALOG EXTENDED sales_catalog;

-- Show all catalogs
SHOW CATALOGS;

-- Show schemas in catalog
SHOW SCHEMAS IN sales_catalog;

-- Search across Unity Catalog
SELECT * FROM system.information_schema.tables
WHERE table_catalog = 'sales_catalog';

-- Data lineage tracking (automatic)
-- Unity Catalog automatically tracks table lineage

-- Tag objects for organization
ALTER TABLE sales_catalog.bronze.raw_orders
SET TAGS ('pii' = 'true', 'domain' = 'sales');
```

### Delta Lake

Delta Lake provides ACID transactions, time travel, and reliability for data lakes.

```sql
-- Create Delta table
CREATE TABLE delta_orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_date DATE,
    amount DECIMAL(10,2),
    status STRING
)
USING DELTA
PARTITIONED BY (order_date);

-- Insert data
INSERT INTO delta_orders VALUES
    (1, 100, '2024-01-15', 150.00, 'completed'),
    (2, 101, '2024-01-15', 200.00, 'pending'),
    (3, 102, '2024-01-16', 75.50, 'completed');

-- Update data (ACID transaction)
UPDATE delta_orders
SET status = 'completed'
WHERE order_id = 2;

-- Delete data
DELETE FROM delta_orders
WHERE amount < 100;

-- Merge (Upsert)
MERGE INTO delta_orders AS target
USING source_orders AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN
    UPDATE SET *
WHEN NOT MATCHED THEN
    INSERT *;

-- Time travel - query historical versions
SELECT * FROM delta_orders
VERSION AS OF 0;

SELECT * FROM delta_orders
TIMESTAMP AS OF '2024-01-15 10:00:00';

-- View table history
DESCRIBE HISTORY delta_orders;

-- Restore table to previous version
RESTORE TABLE delta_orders TO VERSION AS OF 5;

-- Vacuum old files (remove files older than retention period)
VACUUM delta_orders RETAIN 168 HOURS;  -- 7 days

-- Optimize table (compaction)
OPTIMIZE delta_orders;

-- Z-order clustering for faster queries
OPTIMIZE delta_orders
ZORDER BY (customer_id);

-- Clone table (zero-copy for Delta)
CREATE TABLE delta_orders_backup
SHALLOW CLONE delta_orders;

CREATE TABLE delta_orders_test
DEEP CLONE delta_orders;

-- Enable Change Data Feed
ALTER TABLE delta_orders
SET TBLPROPERTIES (delta.enableChangeDataFeed = true);

-- Read change data
SELECT * FROM table_changes('delta_orders', 2, 5);

-- Liquid clustering (auto-optimized clustering)
CREATE TABLE optimized_orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_date DATE,
    amount DECIMAL(10,2)
)
USING DELTA
CLUSTER BY (order_date, customer_id);
```

### Databricks SQL

High-performance SQL analytics with serverless compute and interactive dashboards.

```sql
-- Create SQL warehouse (compute resource)
-- Done via UI: SQL > SQL Warehouses > Create

-- Create table optimized for analytics
CREATE TABLE sales_analytics (
    sale_id BIGINT,
    product_id BIGINT,
    customer_id BIGINT,
    sale_date DATE,
    amount DECIMAL(10,2),
    region STRING
)
USING DELTA
PARTITIONED BY (region, sale_date);

-- Advanced analytics queries
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('MONTH', sale_date) AS month,
        region,
        SUM(amount) AS total_sales,
        COUNT(*) AS transaction_count
    FROM sales_analytics
    WHERE sale_date >= '2024-01-01'
    GROUP BY 1, 2
)
SELECT
    month,
    region,
    total_sales,
    transaction_count,
    total_sales / transaction_count AS avg_transaction,
    LAG(total_sales) OVER (PARTITION BY region ORDER BY month) AS prev_month_sales,
    (total_sales - LAG(total_sales) OVER (PARTITION BY region ORDER BY month)) /
        LAG(total_sales) OVER (PARTITION BY region ORDER BY month) * 100 AS growth_pct
FROM monthly_sales
ORDER BY region, month;

-- Create view
CREATE VIEW sales_summary AS
SELECT
    region,
    DATE_TRUNC('DAY', sale_date) AS day,
    SUM(amount) AS daily_sales
FROM sales_analytics
GROUP BY region, DATE_TRUNC('DAY', sale_date);

-- Materialized view (auto-refresh)
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT
    DATE_TRUNC('DAY', sale_date) AS day,
    region,
    SUM(amount) AS total_sales,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM sales_analytics
GROUP BY 1, 2;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_daily_sales;

-- Create SQL parameter (for queries and dashboards)
-- In Databricks SQL Editor:
-- SELECT * FROM sales WHERE region = :region

-- Use Photon acceleration (automatically enabled for supported operations)
-- Photon provides 2-10x performance improvement

-- Query federation (query external databases)
CREATE TABLE postgres_customers
USING postgresql
OPTIONS (
    host 'my-postgres-server.com',
    port '5432',
    database 'mydb',
    dbtable 'customers',
    user 'myuser',
    password 'mypassword'
);

SELECT * FROM postgres_customers;
```

### Workflows and Jobs

Orchestrate data pipelines and automate tasks with Databricks Workflows.

```python
# Create job using Databricks API
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()

# Define job
job = w.jobs.create(
    name="Daily ETL Pipeline",
    tasks=[
        {
            "task_key": "ingest",
            "notebook_task": {
                "notebook_path": "/Users/user@example.com/etl/ingest",
                "base_parameters": {"date": "{{job.start_time}}"}
            },
            "new_cluster": {
                "spark_version": "13.3.x-scala2.12",
                "node_type_id": "i3.xlarge",
                "num_workers": 2
            }
        },
        {
            "task_key": "transform",
            "depends_on": [{"task_key": "ingest"}],
            "notebook_task": {
                "notebook_path": "/Users/user@example.com/etl/transform"
            },
            "job_cluster_key": "shared_cluster"
        },
        {
            "task_key": "aggregate",
            "depends_on": [{"task_key": "transform"}],
            "spark_python_task": {
                "python_file": "/path/to/aggregate.py"
            },
            "job_cluster_key": "shared_cluster"
        }
    ],
    schedule={
        "quartz_cron_expression": "0 0 2 * * ?",  # Daily at 2 AM
        "timezone_id": "America/New_York"
    }
)
```

```sql
-- Schedule SQL queries in Databricks SQL
-- Create query, then click "Schedule" button in UI

-- Monitor job runs
SELECT
    job_id,
    run_id,
    start_time,
    end_time,
    result_state,
    TIMESTAMPDIFF(MINUTE, start_time, end_time) AS duration_minutes
FROM system.lakeflow.job_run_timeline
WHERE job_id = 123456
    AND start_time >= CURRENT_DATE() - INTERVAL 7 DAYS
ORDER BY start_time DESC;
```

### Notebooks and Collaboration

```python
# Databricks notebook magic commands

# %sql - Run SQL
%sql
SELECT * FROM delta_table LIMIT 10

# %python - Run Python (default)
%python
df = spark.table("delta_table")
df.show()

# %scala - Run Scala
%scala
val df = spark.table("delta_table")
df.show()

# %r - Run R
%r
library(SparkR)
df <- sql("SELECT * FROM delta_table")
head(df)

# %sh - Run shell commands
%sh
ls -la /dbfs/

# %fs - File system operations
%fs ls /mnt/data/

# %md - Markdown documentation
%md
# My Analysis
This notebook performs customer segmentation analysis.

# Widgets for parameterization
dbutils.widgets.text("start_date", "2024-01-01")
dbutils.widgets.dropdown("region", "US", ["US", "EU", "APAC"])

start_date = dbutils.widgets.get("start_date")
region = dbutils.widgets.get("region")

# Run another notebook
result = dbutils.notebook.run(
    "/path/to/other_notebook",
    timeout_seconds=600,
    arguments={"param1": "value1"}
)

# Display data with rich visualizations
display(df)  # Auto-generates interactive charts

# Install libraries in notebook
%pip install scikit-learn pandas

# Set Spark configuration
spark.conf.set("spark.sql.adaptive.enabled", "true")
```

### Cluster Management

```python
# Create cluster using API
cluster = w.clusters.create(
    cluster_name="analytics-cluster",
    spark_version="13.3.x-scala2.12",
    node_type_id="i3.xlarge",
    autoscale={
        "min_workers": 2,
        "max_workers": 8
    },
    autotermination_minutes=20,
    spark_conf={
        "spark.sql.adaptive.enabled": "true",
        "spark.databricks.delta.preview.enabled": "true"
    },
    custom_tags={
        "project": "analytics",
        "cost_center": "marketing"
    }
)
```

```sql
-- Monitor cluster usage
SELECT
    cluster_id,
    cluster_name,
    start_time,
    end_time,
    TIMESTAMPDIFF(HOUR, start_time, end_time) AS runtime_hours,
    dbu_usage
FROM system.billing.usage
WHERE sku_name LIKE '%COMPUTE%'
    AND usage_date >= CURRENT_DATE() - INTERVAL 30 DAYS
ORDER BY dbu_usage DESC;
```

### Delta Live Tables (DLT)

Declarative framework for building reliable data pipelines.

```python
import dlt
from pyspark.sql.functions import col, current_timestamp

# Bronze layer - raw data ingestion
@dlt.table(
    comment="Raw orders from source system",
    table_properties={
        "quality": "bronze",
        "pipelines.autoOptimize.zOrderCols": "order_id"
    }
)
def bronze_orders():
    return (
        spark.readStream
            .format("cloudFiles")
            .option("cloudFiles.format", "json")
            .load("/mnt/source/orders/")
            .withColumn("ingest_time", current_timestamp())
    )

# Silver layer - cleaned and validated
@dlt.table(
    comment="Cleaned orders with quality checks"
)
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_fail("valid_date", "order_date IS NOT NULL")
def silver_orders():
    return (
        dlt.read_stream("bronze_orders")
            .filter(col("order_id").isNotNull())
            .filter(col("amount") > 0)
            .dropDuplicates(["order_id"])
    )

# Gold layer - business aggregates
@dlt.table(
    comment="Daily sales by region"
)
def gold_daily_sales():
    return (
        dlt.read("silver_orders")
            .groupBy("region", "order_date")
            .agg(
                sum("amount").alias("total_sales"),
                count("*").alias("order_count")
            )
    )

# Streaming with watermark
@dlt.table
def streaming_aggregates():
    return (
        dlt.read_stream("bronze_orders")
            .withWatermark("order_date", "1 hour")
            .groupBy(
                window("order_date", "5 minutes"),
                "region"
            )
            .agg(sum("amount").alias("total"))
    )
```

### MLflow Integration

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Enable autologging
mlflow.autolog()

# Load data
df = spark.table("customer_features").toPandas()
X = df.drop("churn", axis=1)
y = df["churn"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Start MLflow run
with mlflow.start_run(run_name="churn_prediction"):
    # Train model
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)

    # Log metrics
    accuracy = model.score(X_test, y_test)
    mlflow.log_metric("accuracy", accuracy)

    # Log parameters
    mlflow.log_param("n_estimators", 100)

    # Log model
    mlflow.sklearn.log_model(model, "model")

    # Register model
    model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
    mlflow.register_model(model_uri, "churn_prediction_model")

# Load model for inference
model = mlflow.pyfunc.load_model("models:/churn_prediction_model/production")
predictions = model.predict(X_test)

# Create feature table for ML
from databricks.feature_store import FeatureStoreClient

fs = FeatureStoreClient()

# Create feature table
fs.create_table(
    name="customer_features",
    primary_keys=["customer_id"],
    df=feature_df,
    description="Customer features for churn prediction"
)
```

## Advanced Features

### Photon Engine

Photon is a vectorized query engine that provides significant performance improvements.

```sql
-- Photon is automatically enabled for:
-- - Databricks SQL warehouses
-- - Supported SQL operations on compatible clusters

-- Check if Photon is being used
SELECT
    query_id,
    statement_text,
    photon_enabled
FROM system.query.history
WHERE execution_end_time >= CURRENT_DATE()
ORDER BY total_task_duration_ms DESC
LIMIT 10;

-- Photon excels at:
-- - Aggregations
-- - Joins
-- - Window functions
-- - Sorting
-- - String operations

-- Example query benefiting from Photon
SELECT
    customer_id,
    SUM(amount) AS total_spent,
    COUNT(*) AS order_count,
    AVG(amount) AS avg_order,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_order
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY customer_id
HAVING total_spent > 1000
ORDER BY total_spent DESC;
```

### Serverless SQL Warehouses

```sql
-- Serverless warehouses provide:
-- - Instant startup (no cold start)
-- - Auto-scaling
-- - No cluster management
-- - Pay only for query execution

-- Best practices for serverless
-- 1. Use for interactive analytics
-- 2. Enable result caching
-- 3. Use query history for optimization

-- Monitor serverless usage
SELECT
    warehouse_id,
    SUM(usage_quantity) AS total_dbus,
    COUNT(DISTINCT query_id) AS query_count
FROM system.billing.usage
WHERE sku_name = 'SERVERLESS_SQL_COMPUTE'
    AND usage_date >= CURRENT_DATE() - INTERVAL 7 DAYS
GROUP BY warehouse_id;
```

### Row and Column Level Security

```sql
-- Create row filter function
CREATE FUNCTION region_filter(region STRING)
RETURN IF(
    IS_ACCOUNT_GROUP_MEMBER('admin'),
    TRUE,
    region = CURRENT_USER_REGION()
);

-- Apply row filter to table
ALTER TABLE sales_data
SET ROW FILTER region_filter ON (region);

-- Users will only see rows they're authorized to access
SELECT * FROM sales_data;  -- Auto-filtered

-- Column masking
CREATE FUNCTION mask_email(email STRING)
RETURN CASE
    WHEN IS_ACCOUNT_GROUP_MEMBER('admin') THEN email
    ELSE REGEXP_REPLACE(email, '(.{2})(.*)(@.*)', '$1****$3')
END;

-- Apply column mask
ALTER TABLE customers
ALTER COLUMN email SET MASK mask_email;

-- Dynamic views for security
CREATE VIEW customer_safe_view AS
SELECT
    customer_id,
    name,
    CASE
        WHEN CURRENT_USER() = 'admin@company.com' THEN email
        ELSE '***@***'
    END AS email,
    CASE
        WHEN CURRENT_USER() = 'admin@company.com' THEN phone
        ELSE '***-***-****'
    END AS phone
FROM customers;
```

### Databricks Assistant (AI)

```python
# Databricks Assistant provides AI-powered features in notebooks

# Comment to code
# Type comment like: "# Load orders from delta table and filter by date"
# Assistant suggests code completion

# Error diagnosis
# When code fails, Assistant provides fix suggestions

# Query optimization
# Assistant suggests optimizations for slow queries

# Natural language to SQL (in SQL cells)
-- /* Show me total sales by region for last 30 days */
-- Assistant generates:
SELECT
    region,
    SUM(amount) AS total_sales
FROM sales
WHERE sale_date >= CURRENT_DATE() - INTERVAL 30 DAYS
GROUP BY region
ORDER BY total_sales DESC;
```

### Lakehouse Federation

Query data across multiple systems without moving it.

```sql
-- Connect to external PostgreSQL
CREATE CONNECTION postgres_prod
TYPE postgresql
OPTIONS (
    host 'prod-db.example.com',
    port '5432',
    user 'readonly_user',
    password secret('db_credentials', 'postgres_password')
);

-- Create foreign catalog
CREATE FOREIGN CATALOG postgres_catalog
USING CONNECTION postgres_prod
OPTIONS (
    database 'production'
);

-- Query external data directly
SELECT * FROM postgres_catalog.public.customers LIMIT 10;

-- Join Databricks and external data
SELECT
    d.order_id,
    d.amount,
    p.customer_name,
    p.customer_email
FROM delta_orders d
INNER JOIN postgres_catalog.public.customers p
    ON d.customer_id = p.id
WHERE d.order_date >= '2024-01-01';

-- Supported connections:
-- - PostgreSQL
-- - MySQL
-- - SQL Server
-- - Snowflake
-- - Redshift
-- - BigQuery
```

### Structured Streaming

```python
# Read streaming data from Kafka
streaming_df = (
    spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "broker:9092")
        .option("subscribe", "orders")
        .load()
)

# Parse JSON data
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

schema = StructType([
    StructField("order_id", StringType()),
    StructField("customer_id", StringType()),
    StructField("amount", DoubleType())
])

parsed_df = streaming_df.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# Streaming aggregation with watermark
from pyspark.sql.functions import window, sum, count

aggregated = (
    parsed_df
        .withWatermark("timestamp", "10 minutes")
        .groupBy(
            window("timestamp", "5 minutes", "1 minute"),
            "customer_id"
        )
        .agg(
            sum("amount").alias("total_amount"),
            count("*").alias("order_count")
        )
)

# Write to Delta table
query = (
    aggregated.writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", "/mnt/checkpoints/orders")
        .table("streaming_orders")
)

# Monitor streaming queries
spark.streams.active  # List active streams
query.status  # Query status
query.recentProgress  # Recent progress
```

## Data Types

### Numeric Types

| Type          | Range                                                   | Precision            |
| ------------- | ------------------------------------------------------- | -------------------- |
| TINYINT       | -128 to 127                                             | 1 byte               |
| SMALLINT      | -32,768 to 32,767                                       | 2 bytes              |
| INT           | -2,147,483,648 to 2,147,483,647                         | 4 bytes              |
| BIGINT        | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | 8 bytes              |
| FLOAT         | Approximate                                             | 4 bytes              |
| DOUBLE        | Approximate                                             | 8 bytes              |
| DECIMAL(p, s) | Exact                                                   | Precision p, scale s |

### String Types

| Type       | Description                | Max Size     |
| ---------- | -------------------------- | ------------ |
| STRING     | Variable-length string     | 2 GB         |
| VARCHAR(n) | Variable-length with limit | n characters |
| CHAR(n)    | Fixed-length               | n characters |
| BINARY     | Binary data                | 2 GB         |

### Date/Time Types

| Type          | Format              | Range                            |
| ------------- | ------------------- | -------------------------------- |
| DATE          | YYYY-MM-DD          | 0001-01-01 to 9999-12-31         |
| TIMESTAMP     | YYYY-MM-DD HH:MM:SS | Microsecond precision            |
| TIMESTAMP_NTZ | No timezone         | Microsecond precision            |
| INTERVAL      | Duration            | Year-month or day-time intervals |

### Complex Types

- **ARRAY<T>**: Ordered collection of elements
- **MAP<K,V>**: Key-value pairs
- **STRUCT<f1:T1, f2:T2>**: Named fields with types

### Other Types

- **BOOLEAN**: TRUE, FALSE, NULL
- **VOID**: NULL values only

## Common Operations

### Database and Schema Management

```sql
-- Create catalog
CREATE CATALOG IF NOT EXISTS production;

-- Use catalog
USE CATALOG production;

-- Create schema
CREATE SCHEMA IF NOT EXISTS sales
COMMENT 'Sales data and analytics';

-- Use schema
USE SCHEMA sales;

-- Set default catalog and schema
USE production.sales;

-- View catalogs
SHOW CATALOGS;

-- View schemas
SHOW SCHEMAS IN production;

-- View tables
SHOW TABLES IN production.sales;

-- Drop schema
DROP SCHEMA IF EXISTS old_schema CASCADE;

-- Clone schema
CREATE SCHEMA test_sales
CLONE production.sales;
```

### Table Operations

```sql
-- Create managed table (data stored in Unity Catalog)
CREATE TABLE customers (
    customer_id BIGINT GENERATED ALWAYS AS IDENTITY,
    name STRING NOT NULL,
    email STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT customers_pk PRIMARY KEY (customer_id)
)
USING DELTA
PARTITIONED BY (created_at)
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);

-- Create external table
CREATE EXTERNAL TABLE external_logs (
    log_id BIGINT,
    message STRING,
    log_date DATE
)
USING DELTA
LOCATION 's3://my-bucket/logs/';

-- Create table from query
CREATE TABLE high_value_customers AS
SELECT *
FROM customers
WHERE total_purchases > 10000;

-- Add column
ALTER TABLE customers
ADD COLUMN phone STRING AFTER email;

-- Rename column
ALTER TABLE customers
RENAME COLUMN phone TO mobile;

-- Change column type
ALTER TABLE customers
ALTER COLUMN mobile TYPE VARCHAR(15);

-- Drop column
ALTER TABLE customers
DROP COLUMN mobile;

-- Add constraint
ALTER TABLE orders
ADD CONSTRAINT fk_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- Table properties
ALTER TABLE customers
SET TBLPROPERTIES (
    'delta.enableChangeDataFeed' = 'true',
    'delta.deletedFileRetentionDuration' = 'interval 30 days'
);

-- Describe table
DESCRIBE TABLE EXTENDED customers;

-- Show table properties
SHOW TBLPROPERTIES customers;

-- Drop table
DROP TABLE IF EXISTS old_table;
```

### Data Loading and Export

```sql
-- Load CSV
COPY INTO customers
FROM 's3://bucket/customers.csv'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'inferSchema' = 'true');

-- Load JSON
COPY INTO events
FROM 's3://bucket/events/'
FILEFORMAT = JSON
COPY_OPTIONS ('mergeSchema' = 'true');

-- Load Parquet
COPY INTO sales
FROM '/mnt/data/sales.parquet'
FILEFORMAT = PARQUET;

-- Incremental load with pattern
COPY INTO orders
FROM 's3://bucket/orders/'
FILEFORMAT = CSV
PATTERN = '2024-01-.*[.]csv'
FORMAT_OPTIONS ('header' = 'true');

-- Load with Auto Loader (recommended for production)
CREATE OR REFRESH STREAMING TABLE bronze_orders AS
SELECT *
FROM cloud_files(
    's3://bucket/orders/',
    'json',
    map('cloudFiles.inferColumnTypes', 'true')
);

-- Export to cloud storage
COPY INTO 's3://bucket/exports/customers/'
FROM customers
FILEFORMAT = PARQUET;

-- Export with partitioning
COPY INTO 's3://bucket/exports/sales/'
FROM sales
FILEFORMAT = PARQUET
PARTITION BY (year, month);
```

### Data Manipulation

```sql
-- Insert
INSERT INTO customers (name, email)
VALUES ('John Doe', 'john@example.com');

INSERT INTO customers
SELECT * FROM staging_customers;

-- Update
UPDATE customers
SET email = 'newemail@example.com'
WHERE customer_id = 100;

-- Delete
DELETE FROM orders
WHERE order_date < '2023-01-01';

-- Merge (Upsert)
MERGE INTO customers AS target
USING updates AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN
    UPDATE SET
        target.name = source.name,
        target.email = source.email
WHEN NOT MATCHED THEN
    INSERT (customer_id, name, email)
    VALUES (source.customer_id, source.name, source.email)
WHEN NOT MATCHED BY SOURCE AND target.updated_at < '2024-01-01' THEN
    DELETE;

-- Truncate
TRUNCATE TABLE staging_table;
```

### Analytical Queries

```sql
-- Window functions
SELECT
    customer_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS order_number,
    SUM(amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    AVG(amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3
FROM orders;

-- Pivot
SELECT *
FROM (
    SELECT region, product, sales
    FROM sales_data
)
PIVOT (
    SUM(sales)
    FOR product IN ('Product A', 'Product B', 'Product C')
);

-- Unpivot
SELECT *
FROM sales_wide
UNPIVOT (
    sales FOR product IN (product_a, product_b, product_c)
);

-- Common Table Expressions
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        SUM(amount) AS total
    FROM orders
    GROUP BY 1
),
growth AS (
    SELECT
        month,
        total,
        LAG(total) OVER (ORDER BY month) AS prev_month
    FROM monthly_sales
)
SELECT
    month,
    total,
    (total - prev_month) / prev_month * 100 AS growth_pct
FROM growth;
```

## Performance Optimization

### Best Practices

```sql
-- 1. Use Z-ordering for frequently filtered columns
OPTIMIZE orders
ZORDER BY (customer_id, order_date);

-- 2. Enable auto-optimize
ALTER TABLE orders
SET TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);

-- 3. Use liquid clustering for new tables
CREATE TABLE new_orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_date DATE
)
USING DELTA
CLUSTER BY (order_date, customer_id);

-- 4. Partition large tables strategically
CREATE TABLE events (
    event_id BIGINT,
    event_date DATE,
    user_id BIGINT
)
USING DELTA
PARTITIONED BY (event_date);

-- 5. Use appropriate file sizes (1GB target)
ALTER TABLE large_table
SET TBLPROPERTIES (
    'delta.targetFileSize' = '1gb'
);

-- 6. Cache frequently accessed data
CACHE SELECT * FROM hot_table;

-- List cached tables
SHOW TABLES IN CACHE;

-- Clear cache
UNCACHE TABLE hot_table;

-- 7. Use broadcast joins for small tables
SELECT /*+ BROADCAST(small_table) */
    large_table.id,
    small_table.name
FROM large_table
JOIN small_table ON large_table.id = small_table.id;

-- 8. Enable adaptive query execution (default)
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.coalescePartitions.enabled = true;

-- 9. Analyze table statistics
ANALYZE TABLE orders COMPUTE STATISTICS;
ANALYZE TABLE orders COMPUTE STATISTICS FOR COLUMNS customer_id, order_date;

-- 10. Monitor query performance
SELECT
    statement_text,
    execution_duration,
    read_bytes,
    result_size
FROM system.query.history
WHERE user_name = CURRENT_USER()
    AND execution_end_time >= CURRENT_DATE() - INTERVAL 1 DAY
ORDER BY execution_duration DESC
LIMIT 10;
```

### Cluster Configuration

```python
# Optimal cluster settings for different workloads

# ETL Workload
etl_config = {
    "spark_version": "13.3.x-scala2.12",
    "node_type_id": "i3.xlarge",  # Memory-optimized
    "num_workers": 8,
    "autoscale": {"min_workers": 4, "max_workers": 16},
    "spark_conf": {
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.databricks.delta.optimizeWrite.enabled": "true"
    }
}

# Analytics Workload
analytics_config = {
    "spark_version": "13.3.x-photon-scala2.12",  # Photon enabled
    "node_type_id": "r5d.xlarge",  # Compute-optimized
    "enable_photon": True,
    "autoscale": {"min_workers": 2, "max_workers": 8}
}

# ML Workload
ml_config = {
    "spark_version": "13.3.x-cpu-ml-scala2.12",  # ML runtime
    "node_type_id": "g4dn.xlarge",  # GPU instances
    "num_workers": 4,
    "spark_conf": {
        "spark.task.resource.gpu.amount": "1"
    }
}
```

## Security Features

### Access Control

```sql
-- Grant catalog permissions
GRANT USE CATALOG ON CATALOG production TO `data_engineers`;
GRANT CREATE SCHEMA ON CATALOG production TO `data_engineers`;

-- Grant schema permissions
GRANT USE SCHEMA ON SCHEMA production.sales TO `analysts`;
GRANT CREATE TABLE ON SCHEMA production.sales TO `data_engineers`;

-- Grant table permissions
GRANT SELECT ON TABLE production.sales.orders TO `analysts`;
GRANT MODIFY ON TABLE production.sales.orders TO `data_engineers`;
GRANT ALL PRIVILEGES ON TABLE production.sales.orders TO `admins`;

-- Grant on all tables in schema
GRANT SELECT ON SCHEMA production.sales TO `analysts`;

-- Revoke permissions
REVOKE SELECT ON TABLE production.sales.orders FROM `analysts`;

-- Show grants
SHOW GRANTS ON TABLE production.sales.orders;
SHOW GRANTS `analysts`;

-- Create service principal
-- Done via Databricks UI or Account Console
```

### Data Encryption

```sql
-- Encryption at rest (automatic in Databricks)
-- - All data encrypted with AES-256
-- - Customer-managed keys supported

-- Enable customer-managed keys (CMK)
-- Configure via Databricks UI or API
-- Supports AWS KMS, Azure Key Vault, GCP KMS

-- Secrets management
-- Store sensitive data in Databricks secrets

-- Create secret scope (via CLI)
-- databricks secrets create-scope --scope my_scope

-- Add secret
-- databricks secrets put --scope my_scope --key db_password

-- Use secret in code
password = dbutils.secrets.get(scope="my_scope", key="db_password")

-- Use in SQL
CREATE TABLE external_data
USING postgresql
OPTIONS (
    host 'server.com',
    user 'myuser',
    password secret('my_scope', 'db_password')
);
```

## Databricks vs Other Platforms

| Feature        | Databricks            | Snowflake            | BigQuery            | Spark SQL              |
| -------------- | --------------------- | -------------------- | ------------------- | ---------------------- |
| Architecture   | Lakehouse             | Cloud Data Warehouse | Serverless          | Distributed Engine     |
| Storage Format | Delta Lake            | Proprietary          | Capacitor           | Parquet/ORC            |
| Compute        | Spark Clusters        | Virtual Warehouses   | Serverless          | Spark Clusters         |
| ML Integration | MLflow (native)       | External             | BQML                | MLlib                  |
| Streaming      | Native (Structured)   | Limited              | Pub/Sub integration | Native                 |
| Notebooks      | Yes (native)          | Worksheets           | Colab integration   | External               |
| Time Travel    | Delta Lake            | Native               | 7 days              | Delta Lake             |
| Open Source    | Built on Spark        | Proprietary          | Proprietary         | Apache Spark           |
| Programming    | Python, SQL, Scala, R | SQL, Python          | SQL, Python         | Python, Scala, Java, R |
| Cost Model     | DBU-based             | Credit-based         | Slot/query          | Cluster-based          |

## Best Practices

### 1. Data Organization (Medallion Architecture)

```sql
-- Bronze: Raw data
CREATE SCHEMA IF NOT EXISTS bronze;

CREATE TABLE bronze.raw_events (
    raw_data STRING,
    ingest_timestamp TIMESTAMP
)
USING DELTA
PARTITIONED BY (DATE(ingest_timestamp));

-- Silver: Cleaned and validated
CREATE SCHEMA IF NOT EXISTS silver;

CREATE TABLE silver.events (
    event_id BIGINT,
    event_type STRING,
    user_id BIGINT,
    event_timestamp TIMESTAMP,
    properties MAP<STRING, STRING>
)
USING DELTA
CLUSTER BY (event_type, DATE(event_timestamp));

-- Gold: Business-level aggregates
CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE gold.daily_metrics (
    metric_date DATE,
    event_type STRING,
    event_count BIGINT,
    unique_users BIGINT
)
USING DELTA
CLUSTER BY (metric_date);
```

### 2. Cost Optimization

```sql
-- Use spot instances for fault-tolerant workloads
-- Configure in cluster settings

-- Use smaller clusters for development
-- Use auto-scaling for production

-- Monitor costs
SELECT
    usage_date,
    sku_name,
    SUM(usage_quantity) AS total_dbus,
    SUM(usage_quantity * list_price) AS estimated_cost
FROM system.billing.usage
WHERE usage_date >= CURRENT_DATE() - INTERVAL 30 DAYS
GROUP BY usage_date, sku_name
ORDER BY usage_date DESC, estimated_cost DESC;

-- Set cluster auto-termination
-- Recommended: 10-20 minutes for interactive
--              Immediate for jobs

-- Use serverless SQL for ad-hoc queries
-- Use jobs clusters for scheduled workloads
```

### 3. Data Quality

```python
# Use Delta Live Tables expectations
@dlt.expect("valid_email", "email IS NOT NULL AND email LIKE '%@%'")
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_fail("required_fields", """
    customer_id IS NOT NULL AND
    order_date IS NOT NULL
""")
```

### 4. Version Control

```sql
-- Use Git integration for notebooks
-- Configure in Repos

-- Track table lineage with Unity Catalog
-- Automatic lineage tracking enabled

-- Use table versioning
DESCRIBE HISTORY orders;

-- Tag important versions
ALTER TABLE orders
SET TBLPROPERTIES ('version.1.0' = '2024-01-15');
```

### 5. Monitoring and Observability

```sql
-- Monitor pipeline health
SELECT
    pipeline_id,
    pipeline_name,
    update_id,
    start_time,
    end_time,
    state
FROM event_log('my_dlt_pipeline')
WHERE event_type = 'flow_progress'
ORDER BY start_time DESC;

-- Monitor data quality
SELECT
    dataset,
    expectation,
    SUM(passed_records) AS passed,
    SUM(failed_records) AS failed
FROM event_log('my_dlt_pipeline')
WHERE event_type = 'flow_progress'
GROUP BY dataset, expectation;

-- Set up alerts in SQL dashboards
-- Configure via Databricks SQL UI
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="databricks" :show-model-selector="false" />

## See Also

- [Apache Spark SQL](/databases/spark-sql/) - Core Spark SQL engine
- [Delta Lake](/concepts/delta-lake/) - ACID transactions on data lakes
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [Snowflake](/databases/snowflake/) - Cloud data warehouse comparison

## Resources

- [Official Documentation](https://docs.databricks.com/)
- [Databricks Academy](https://www.databricks.com/learn/training) - Free training and certification
- [Databricks Community](https://community.databricks.com/) - Forums and Q&A
- [Databricks Blog](https://www.databricks.com/blog) - Best practices and announcements
- [Delta Lake Documentation](https://docs.delta.io/) - Delta Lake details
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html) - ML lifecycle management
- [Databricks SQL Reference](https://docs.databricks.com/sql/language-manual/index.html) - Complete SQL syntax
- [Databricks YouTube Channel](https://www.youtube.com/c/Databricks) - Video tutorials and demos
