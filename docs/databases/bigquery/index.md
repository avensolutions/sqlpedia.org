---
title: BigQuery
description: Comprehensive guide to Google BigQuery - Serverless, highly scalable enterprise data warehouse for analytics
difficulty: intermediate
tags: [bigquery, google-cloud, datawarehouse, analytics, serverless]
---

# BigQuery

## Overview

Google BigQuery is a fully-managed, serverless enterprise data warehouse that enables super-fast SQL queries using the processing power of Google's infrastructure. Built on Google's Dremel technology, BigQuery separates storage and compute, allowing you to analyze petabyte-scale datasets with standard SQL while paying only for what you use.

### Key Features

- **Serverless Architecture**: No infrastructure to manage, automatic scaling
- **Columnar Storage**: Optimized for analytical queries with automatic compression
- **Massively Parallel Processing**: Distributes queries across thousands of machines
- **Standard SQL Support**: ANSI SQL 2011 compliant with extensions
- **BigQuery ML**: Build and deploy machine learning models using SQL
- **BI Engine**: In-memory analysis service for sub-second query response
- **Real-time Analytics**: Streaming inserts for immediate data availability
- **Federated Queries**: Query external data sources without loading data
- **Automatic Backup**: Seven-day time travel and table snapshots
- **Multi-cloud Analytics**: Query data across GCP, AWS, and Azure
- **Built-in Security**: Encryption at rest and in transit, column-level security

## Getting Started

### Account Setup

::: code-group

```bash [Google Cloud Console]
# Create a Google Cloud account
# Visit: https://console.cloud.google.com/

# Create a new project
gcloud projects create my-bigquery-project

# Set the project
gcloud config set project my-bigquery-project

# Enable BigQuery API
gcloud services enable bigquery.googleapis.com

# BigQuery free tier includes:
# - 10 GB storage per month
# - 1 TB queries per month
# - 300+ public datasets available
```

```bash [gcloud CLI]
# Install Google Cloud SDK
# macOS
curl https://sdk.cloud.google.com | bash

# Linux
curl https://sdk.cloud.google.com | bash

# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# Initialize and authenticate
gcloud init
gcloud auth login

# Set default project
gcloud config set project my-project-id

# Install bq command-line tool (included with SDK)
bq version
```

```bash [bq Command-Line Tool]
# Query from command line
bq query --use_legacy_sql=false \
  'SELECT name, SUM(number) as total
   FROM `bigquery-public-data.usa_names.usa_1910_current`
   WHERE year >= 2000
   GROUP BY name
   ORDER BY total DESC
   LIMIT 10'

# Create dataset
bq mk --dataset my_project:my_dataset

# Load data
bq load --source_format=CSV \
  my_dataset.my_table \
  gs://my-bucket/data.csv \
  schema.json
```

```python [Python Client Library]
# Install BigQuery client
pip install google-cloud-bigquery
pip install google-cloud-bigquery-storage  # For faster reads

# Install pandas integration
pip install google-cloud-bigquery[pandas]
pip install google-cloud-bigquery[bqstorage,pandas]
```

:::

### Connecting

::: code-group

```python [Python]
from google.cloud import bigquery

# Initialize client (uses default credentials)
client = bigquery.Client()

# Or specify project
client = bigquery.Client(project='my-project-id')

# Or use service account
from google.oauth2 import service_account
credentials = service_account.Credentials.from_service_account_file(
    'path/to/service-account-key.json'
)
client = bigquery.Client(credentials=credentials, project='my-project-id')

# Run query
query = """
    SELECT name, SUM(number) as total
    FROM `bigquery-public-data.usa_names.usa_1910_current`
    WHERE year >= 2000
    GROUP BY name
    ORDER BY total DESC
    LIMIT 10
"""

# Execute query
query_job = client.query(query)
results = query_job.result()

# Print results
for row in results:
    print(f"{row.name}: {row.total}")

# Query to DataFrame
df = query_job.to_dataframe()
print(df.head())
```

```python [Pandas Integration]
import pandas as pd
from google.cloud import bigquery

client = bigquery.Client()

# Query directly to DataFrame
sql = """
    SELECT *
    FROM `bigquery-public-data.usa_names.usa_1910_current`
    WHERE year = 2020
    LIMIT 1000
"""

df = client.query(sql).to_dataframe()

# Use BigQuery Storage API for faster reads
df = client.query(sql).to_dataframe(create_bqstorage_client=True)

# Write DataFrame to BigQuery
table_id = "my_project.my_dataset.my_table"

job_config = bigquery.LoadJobConfig(
    write_disposition="WRITE_TRUNCATE",
)

job = client.load_table_from_dataframe(df, table_id, job_config=job_config)
job.result()  # Wait for the job to complete
```

```java [JDBC]
// Add dependency to pom.xml
// <dependency>
//   <groupId>com.google.cloud</groupId>
//   <artifactId>google-cloud-bigquery</artifactId>
// </dependency>

import com.google.cloud.bigquery.*;

// Create BigQuery client
BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();

// Run query
String query = "SELECT name, COUNT(*) as total "
             + "FROM `bigquery-public-data.usa_names.usa_1910_current` "
             + "WHERE year >= 2000 "
             + "GROUP BY name "
             + "ORDER BY total DESC "
             + "LIMIT 10";

QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(query)
    .setUseLegacySql(false)
    .build();

// Execute query
TableResult results = bigquery.query(queryConfig);

// Print results
for (FieldValueList row : results.iterateAll()) {
    System.out.println(row.get("name").getStringValue() + ": "
                     + row.get("total").getLongValue());
}
```

```javascript [Node.js]
// Install client library
// npm install @google-cloud/bigquery

const { BigQuery } = require("@google-cloud/bigquery");

// Create client
const bigquery = new BigQuery({
  projectId: "my-project-id",
  keyFilename: "/path/to/keyfile.json",
});

// Run query
async function query() {
  const query = `
    SELECT name, SUM(number) as total
    FROM \`bigquery-public-data.usa_names.usa_1910_current\`
    WHERE year >= 2000
    GROUP BY name
    ORDER BY total DESC
    LIMIT 10
  `;

  const options = {
    query: query,
    location: "US",
  };

  // Run the query
  const [rows] = await bigquery.query(options);

  console.log("Results:");
  rows.forEach((row) => {
    console.log(`${row.name}: ${row.total}`);
  });
}

query();
```

:::

## BigQuery-Specific Features

### Datasets and Tables

Datasets are top-level containers for organizing and controlling access to tables and views.

```sql
-- Create dataset
CREATE SCHEMA my_dataset
OPTIONS(
  location="US",
  description="Production sales data",
  default_table_expiration_ms=2592000000,  -- 30 days
  labels=[("env", "prod"), ("team", "analytics")]
);

-- Create dataset in specific location
CREATE SCHEMA IF NOT EXISTS eu_dataset
OPTIONS(location="EU");

-- View datasets
SELECT * FROM `my_project.INFORMATION_SCHEMA.SCHEMATA`;

-- Create standard table
CREATE TABLE my_dataset.customers (
  customer_id INT64 NOT NULL,
  name STRING,
  email STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  total_purchases NUMERIC,
  is_active BOOL DEFAULT TRUE
)
OPTIONS(
  description="Customer master data",
  labels=[("domain", "sales")]
);

-- Create table from query
CREATE TABLE my_dataset.high_value_customers AS
SELECT *
FROM my_dataset.customers
WHERE total_purchases > 10000;

-- Create table with schema
CREATE TABLE my_dataset.orders (
  order_id INT64 NOT NULL,
  customer_id INT64,
  order_date DATE,
  amount NUMERIC(10,2),
  status STRING,
  items ARRAY<STRUCT<product_id INT64, quantity INT64, price NUMERIC>>,
  metadata JSON
);

-- Create external table
CREATE EXTERNAL TABLE my_dataset.external_logs
OPTIONS (
  format = 'CSV',
  uris = ['gs://my-bucket/logs/*.csv'],
  skip_leading_rows = 1
);

-- Create table with expiration
CREATE TABLE my_dataset.temp_data (
  id INT64,
  data STRING
)
OPTIONS(
  expiration_timestamp=TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
);

-- Alter table
ALTER TABLE my_dataset.customers
ADD COLUMN phone STRING;

ALTER TABLE my_dataset.customers
DROP COLUMN phone;

ALTER TABLE my_dataset.customers
SET OPTIONS (
  description="Updated customer data",
  expiration_timestamp=TIMESTAMP "2025-12-31 00:00:00 UTC"
);

-- View table metadata
SELECT
  table_catalog,
  table_schema,
  table_name,
  table_type,
  creation_time,
  row_count,
  size_bytes
FROM my_dataset.INFORMATION_SCHEMA.TABLES
WHERE table_schema = 'my_dataset';

-- Copy table
CREATE TABLE my_dataset.customers_backup
COPY my_dataset.customers;

-- Drop table
DROP TABLE IF EXISTS my_dataset.old_table;
```

### Partitioning

Partitioning divides tables into segments to improve query performance and reduce costs.

```sql
-- Time-unit partitioned table (by day)
CREATE TABLE my_dataset.events_partitioned (
  event_id INT64,
  user_id INT64,
  event_type STRING,
  event_timestamp TIMESTAMP,
  event_data JSON
)
PARTITION BY DATE(event_timestamp)
OPTIONS(
  partition_expiration_days=90,
  require_partition_filter=TRUE
);

-- Hourly partitioning
CREATE TABLE my_dataset.events_hourly (
  event_id INT64,
  event_timestamp TIMESTAMP,
  data STRING
)
PARTITION BY TIMESTAMP_TRUNC(event_timestamp, HOUR);

-- Monthly partitioning
CREATE TABLE my_dataset.sales_monthly (
  sale_id INT64,
  sale_date DATE,
  amount NUMERIC
)
PARTITION BY DATE_TRUNC(sale_date, MONTH);

-- Yearly partitioning
CREATE TABLE my_dataset.archive_data (
  id INT64,
  created_date DATE,
  data STRING
)
PARTITION BY DATE_TRUNC(created_date, YEAR);

-- Integer-range partitioning
CREATE TABLE my_dataset.customer_segments (
  customer_id INT64,
  segment_score INT64,
  name STRING
)
PARTITION BY RANGE_BUCKET(segment_score, GENERATE_ARRAY(0, 100, 10));

-- Ingestion-time partitioned table
CREATE TABLE my_dataset.logs (
  log_id INT64,
  message STRING,
  severity STRING
)
PARTITION BY _PARTITIONDATE
OPTIONS(
  partition_expiration_days=30
);

-- Query specific partitions
SELECT *
FROM my_dataset.events_partitioned
WHERE DATE(event_timestamp) = '2024-01-15';

-- Query partition metadata
SELECT
  table_name,
  partition_id,
  total_rows,
  total_logical_bytes
FROM my_dataset.INFORMATION_SCHEMA.PARTITIONS
WHERE table_name = 'events_partitioned'
ORDER BY partition_id DESC
LIMIT 10;

-- Insert into partition
INSERT INTO my_dataset.events_partitioned (event_id, user_id, event_type, event_timestamp)
VALUES (1, 100, 'click', TIMESTAMP '2024-01-15 10:30:00');

-- Delete old partitions
DELETE FROM my_dataset.events_partitioned
WHERE DATE(event_timestamp) < DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

-- Copy partition
CREATE TABLE my_dataset.events_backup
PARTITION BY DATE(event_timestamp)
AS SELECT * FROM my_dataset.events_partitioned
WHERE DATE(event_timestamp) = '2024-01-15';
```

### Clustering

Clustering sorts data in a table based on the values in one or more columns.

```sql
-- Create clustered table
CREATE TABLE my_dataset.sales_clustered (
  sale_id INT64,
  customer_id INT64,
  product_id INT64,
  sale_date DATE,
  amount NUMERIC,
  region STRING
)
PARTITION BY DATE_TRUNC(sale_date, MONTH)
CLUSTER BY customer_id, product_id
OPTIONS(
  require_partition_filter=TRUE
);

-- Up to 4 clustering columns
CREATE TABLE my_dataset.events_clustered (
  event_timestamp TIMESTAMP,
  user_id INT64,
  event_type STRING,
  platform STRING,
  country STRING
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY user_id, event_type, platform, country;

-- Add clustering to existing table
CREATE OR REPLACE TABLE my_dataset.orders_clustered
CLUSTER BY customer_id, order_date
AS SELECT * FROM my_dataset.orders;

-- Query clustered table (automatic optimization)
SELECT *
FROM my_dataset.sales_clustered
WHERE customer_id = 12345
  AND DATE(sale_date) BETWEEN '2024-01-01' AND '2024-01-31';

-- View clustering information
SELECT
  table_name,
  clustering_ordinal_position,
  column_name
FROM my_dataset.INFORMATION_SCHEMA.CLUSTERING_COLUMNS
WHERE table_name = 'sales_clustered';

-- Automatic re-clustering (managed by BigQuery)
-- No manual OPTIMIZE needed - BigQuery automatically maintains clustering
```

### Materialized Views

Precomputed views that periodically cache query results for better performance.

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW my_dataset.sales_summary AS
SELECT
  DATE_TRUNC(sale_date, MONTH) AS month,
  region,
  product_category,
  COUNT(*) AS sale_count,
  SUM(amount) AS total_sales,
  AVG(amount) AS avg_sale
FROM my_dataset.sales
GROUP BY month, region, product_category;

-- Query materialized view (uses cached results)
SELECT *
FROM my_dataset.sales_summary
WHERE month = '2024-01-01'
  AND region = 'US';

-- Materialized views refresh automatically
-- Manual refresh not needed in most cases

-- Create materialized view with partition
CREATE MATERIALIZED VIEW my_dataset.daily_events_mv
PARTITION BY event_date
AS
SELECT
  DATE(event_timestamp) AS event_date,
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM my_dataset.events
GROUP BY event_date, event_type;

-- Create materialized view with clustering
CREATE MATERIALIZED VIEW my_dataset.customer_metrics_mv
CLUSTER BY customer_id
AS
SELECT
  customer_id,
  COUNT(*) AS order_count,
  SUM(amount) AS total_spent,
  MAX(order_date) AS last_order_date,
  AVG(amount) AS avg_order_value
FROM my_dataset.orders
GROUP BY customer_id;

-- View materialized view metadata
SELECT
  table_name,
  materialized_view_status,
  last_refresh_time,
  refresh_watermark
FROM my_dataset.INFORMATION_SCHEMA.MATERIALIZED_VIEWS;

-- Disable auto-refresh (not recommended)
ALTER MATERIALIZED VIEW my_dataset.sales_summary
SET OPTIONS (enable_refresh = false);

-- Enable auto-refresh
ALTER MATERIALIZED VIEW my_dataset.sales_summary
SET OPTIONS (enable_refresh = true);

-- Force refresh
-- Not directly supported - use CREATE OR REPLACE to rebuild
CREATE OR REPLACE MATERIALIZED VIEW my_dataset.sales_summary AS
SELECT
  DATE_TRUNC(sale_date, MONTH) AS month,
  region,
  SUM(amount) AS total_sales
FROM my_dataset.sales
GROUP BY month, region;

-- Drop materialized view
DROP MATERIALIZED VIEW my_dataset.sales_summary;
```

### BigQuery ML

Build and deploy machine learning models using SQL.

```sql
-- Create logistic regression model
CREATE OR REPLACE MODEL my_dataset.churn_model
OPTIONS(
  model_type='LOGISTIC_REG',
  input_label_cols=['churned'],
  auto_class_weights=TRUE
) AS
SELECT
  customer_tenure_months,
  monthly_charges,
  total_charges,
  num_products,
  has_tech_support,
  churned
FROM my_dataset.customer_features
WHERE date = CURRENT_DATE();

-- Create time series model
CREATE OR REPLACE MODEL my_dataset.sales_forecast
OPTIONS(
  model_type='ARIMA_PLUS',
  time_series_timestamp_col='date',
  time_series_data_col='sales',
  holiday_region='US'
) AS
SELECT
  date,
  SUM(amount) AS sales
FROM my_dataset.sales
GROUP BY date;

-- Create clustering model
CREATE OR REPLACE MODEL my_dataset.customer_segments
OPTIONS(
  model_type='KMEANS',
  num_clusters=5
) AS
SELECT
  customer_lifetime_value,
  recency_days,
  frequency,
  avg_order_value
FROM my_dataset.customer_rfm;

-- Evaluate model
SELECT
  *
FROM ML.EVALUATE(MODEL my_dataset.churn_model,
  (
    SELECT
      customer_tenure_months,
      monthly_charges,
      total_charges,
      num_products,
      has_tech_support,
      churned
    FROM my_dataset.customer_features
    WHERE date = CURRENT_DATE() - 30
  )
);

-- Make predictions
SELECT
  customer_id,
  predicted_churned,
  predicted_churned_probs
FROM ML.PREDICT(MODEL my_dataset.churn_model,
  (
    SELECT
      customer_id,
      customer_tenure_months,
      monthly_charges,
      total_charges,
      num_products,
      has_tech_support
    FROM my_dataset.customers
    WHERE is_active = TRUE
  )
)
WHERE predicted_churned = 1
ORDER BY predicted_churned_probs[OFFSET(0)].prob DESC;

-- Forecast future values
SELECT
  *
FROM ML.FORECAST(MODEL my_dataset.sales_forecast,
  STRUCT(30 AS horizon, 0.95 AS confidence_level)
);

-- Get feature importance
SELECT
  *
FROM ML.FEATURE_IMPORTANCE(MODEL my_dataset.churn_model);

-- Get model weights
SELECT
  *
FROM ML.WEIGHTS(MODEL my_dataset.churn_model);

-- Explain prediction
SELECT
  *
FROM ML.EXPLAIN_PREDICT(MODEL my_dataset.churn_model,
  (
    SELECT * FROM my_dataset.customers WHERE customer_id = 12345
  )
);

-- Export model
EXPORT MODEL my_dataset.churn_model
OPTIONS(URI='gs://my-bucket/models/churn_model');

-- Import model
CREATE OR REPLACE MODEL my_dataset.imported_model
OPTIONS(MODEL_TYPE='TENSORFLOW', MODEL_PATH='gs://my-bucket/tf-model/*');
```

### Scheduled Queries

Automate query execution on a recurring schedule.

```sql
-- Create scheduled query (via bq command-line)
-- bq query --use_legacy_sql=false \
--   --display_name='Daily Sales Summary' \
--   --schedule='every day 02:00' \
--   --destination_table='my_dataset.daily_sales' \
--   --replace=true \
--   'SELECT
--      DATE(sale_timestamp) AS sale_date,
--      SUM(amount) AS total_sales,
--      COUNT(*) AS transaction_count
--    FROM my_dataset.sales
--    WHERE DATE(sale_timestamp) = CURRENT_DATE() - 1
--    GROUP BY sale_date'

-- Scheduled query in UI
-- 1. Go to BigQuery Console
-- 2. Click "Scheduled queries" in navigation
-- 3. Click "Create scheduled query"
-- 4. Enter query and schedule

-- Example queries for scheduling:

-- Daily aggregation
CREATE OR REPLACE TABLE my_dataset.daily_summary AS
SELECT
  CURRENT_DATE() - 1 AS report_date,
  COUNT(*) AS total_orders,
  SUM(amount) AS total_revenue,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM my_dataset.orders
WHERE DATE(order_timestamp) = CURRENT_DATE() - 1;

-- Incremental load
INSERT INTO my_dataset.events_processed
SELECT
  event_id,
  user_id,
  event_type,
  event_timestamp,
  CURRENT_TIMESTAMP() AS processed_at
FROM my_dataset.events_raw
WHERE DATE(event_timestamp) = CURRENT_DATE() - 1
  AND event_id NOT IN (
    SELECT event_id FROM my_dataset.events_processed
  );

-- Data quality check
CREATE OR REPLACE TABLE my_dataset.data_quality_report AS
SELECT
  CURRENT_TIMESTAMP() AS check_time,
  'orders' AS table_name,
  COUNT(*) AS total_rows,
  COUNTIF(customer_id IS NULL) AS null_customer_ids,
  COUNTIF(amount <= 0) AS invalid_amounts,
  COUNTIF(order_date > CURRENT_DATE()) AS future_dates
FROM my_dataset.orders;

-- View scheduled queries
SELECT
  display_name,
  schedule,
  destination_table_name_template,
  state,
  creation_time,
  last_run_time,
  next_run_time
FROM `region-us`.INFORMATION_SCHEMA.JOBS
WHERE job_type = 'QUERY'
  AND state = 'PENDING';
```

### User-Defined Functions (UDFs)

Create reusable functions in SQL or JavaScript.

```sql
-- SQL UDF
CREATE OR REPLACE FUNCTION my_dataset.calculate_discount(
  amount NUMERIC,
  discount_pct NUMERIC
)
RETURNS NUMERIC
AS (
  amount * (1 - discount_pct / 100)
);

-- Use SQL UDF
SELECT
  order_id,
  amount,
  my_dataset.calculate_discount(amount, 10) AS discounted_amount
FROM my_dataset.orders;

-- Temporary SQL UDF
CREATE TEMP FUNCTION multiply(x FLOAT64, y FLOAT64)
RETURNS FLOAT64
AS (x * y);

SELECT multiply(5, 10) AS result;

-- JavaScript UDF
CREATE OR REPLACE FUNCTION my_dataset.parse_user_agent(user_agent STRING)
RETURNS STRING
LANGUAGE js AS r"""
  if (user_agent.includes('Chrome')) return 'Chrome';
  if (user_agent.includes('Firefox')) return 'Firefox';
  if (user_agent.includes('Safari')) return 'Safari';
  return 'Other';
""";

-- Use JavaScript UDF
SELECT
  user_id,
  my_dataset.parse_user_agent(user_agent) AS browser
FROM my_dataset.web_logs;

-- JavaScript UDF with external library
CREATE OR REPLACE FUNCTION my_dataset.encrypt_data(data STRING, key STRING)
RETURNS STRING
LANGUAGE js
OPTIONS (
  library=["gs://my-bucket/crypto-js.min.js"]
) AS r"""
  return CryptoJS.AES.encrypt(data, key).toString();
""";

-- Aggregate UDF
CREATE OR REPLACE AGGREGATE FUNCTION my_dataset.custom_avg(x FLOAT64)
RETURNS FLOAT64
AS (
  (SELECT AVG(x))
);

-- UDF with STRUCT return type
CREATE OR REPLACE FUNCTION my_dataset.split_name(full_name STRING)
RETURNS STRUCT<first_name STRING, last_name STRING>
AS (
  STRUCT(
    SPLIT(full_name, ' ')[OFFSET(0)] AS first_name,
    SPLIT(full_name, ' ')[SAFE_OFFSET(1)] AS last_name
  )
);

SELECT
  full_name,
  my_dataset.split_name(full_name).*
FROM my_dataset.customers;

-- UDF with ARRAY parameter
CREATE OR REPLACE FUNCTION my_dataset.array_sum(arr ARRAY<FLOAT64>)
RETURNS FLOAT64
AS (
  (SELECT SUM(element) FROM UNNEST(arr) AS element)
);

SELECT my_dataset.array_sum([1, 2, 3, 4, 5]) AS total;

-- Drop UDF
DROP FUNCTION IF EXISTS my_dataset.calculate_discount;
```

### Streaming Inserts

Insert data in real-time for immediate availability in queries.

```python
# Python streaming insert
from google.cloud import bigquery

client = bigquery.Client()
table_id = "my_project.my_dataset.streaming_table"

# Single row insert
rows_to_insert = [
    {
        "event_id": "12345",
        "user_id": 100,
        "event_type": "click",
        "timestamp": "2024-01-15T10:30:00",
    }
]

errors = client.insert_rows_json(table_id, rows_to_insert)
if errors:
    print(f"Errors: {errors}")
else:
    print("Rows inserted successfully")

# Batch streaming insert
rows_to_insert = [
    {"event_id": str(i), "user_id": i, "event_type": "click"}
    for i in range(1000)
]

errors = client.insert_rows_json(table_id, rows_to_insert)

# Streaming with deduplication
rows_to_insert = [
    {
        "event_id": "12345",
        "user_id": 100,
        "event_type": "click",
    }
]

# Insert with insertId for deduplication
errors = client.insert_rows_json(
    table_id,
    rows_to_insert,
    row_ids=[bigquery.AutoRowIDs.GENERATE_UUID] * len(rows_to_insert)
)
```

```javascript
// Node.js streaming insert
const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery();

async function streamData() {
  const datasetId = "my_dataset";
  const tableId = "streaming_table";

  const rows = [
    { event_id: "12345", user_id: 100, event_type: "click" },
    { event_id: "12346", user_id: 101, event_type: "view" },
  ];

  await bigquery.dataset(datasetId).table(tableId).insert(rows);

  console.log(`Inserted ${rows.length} rows`);
}

streamData();
```

```sql
-- Query streaming data
-- Note: Streaming buffer data may take a few seconds to appear
SELECT *
FROM my_dataset.streaming_table
WHERE _PARTITIONTIME = TIMESTAMP(CURRENT_DATE());

-- Check streaming buffer
SELECT
  SUM(estimated_bytes) AS estimated_bytes,
  SUM(estimated_rows) AS estimated_rows,
  MAX(oldest_entry_time) AS oldest_entry_time
FROM `my_dataset.__TABLES__`
WHERE table_id = 'streaming_table';
```

### Federated Queries

Query external data sources without loading data into BigQuery.

```sql
-- Query Cloud Storage (CSV)
SELECT *
FROM EXTERNAL_QUERY(
  "projects/my-project/locations/us/connections/my-connection",
  """SELECT * FROM csv_table"""
);

-- Query Cloud SQL (PostgreSQL)
SELECT *
FROM EXTERNAL_QUERY(
  "projects/my-project/locations/us/connections/postgres-connection",
  """SELECT customer_id, name, email
     FROM customers
     WHERE created_at >= '2024-01-01'"""
);

-- Query Cloud Spanner
SELECT *
FROM EXTERNAL_QUERY(
  "projects/my-project/locations/us/connections/spanner-connection",
  """SELECT * FROM orders WHERE order_date = @date""",
  STRUCT(DATE '2024-01-15' AS date)
);

-- Join BigQuery table with external MySQL data
SELECT
  bq.order_id,
  bq.amount,
  ext.customer_name,
  ext.customer_email
FROM my_dataset.orders AS bq
INNER JOIN EXTERNAL_QUERY(
  "projects/my-project/locations/us/connections/mysql-connection",
  """SELECT customer_id, name AS customer_name, email AS customer_email
     FROM customers"""
) AS ext
ON bq.customer_id = ext.customer_id
WHERE bq.order_date >= '2024-01-01';

-- Create external connection
-- Must be done via bq command-line or API
-- bq mk --connection --location=US --project_id=my-project \
--   --connection_type=CLOUD_SQL \
--   --properties='{"instanceId":"my-instance","database":"mydb","type":"POSTGRES"}' \
--   --connection_credential='{"username":"user","password":"pass"}' \
--   my-connection
```

### BI Engine

In-memory analysis service for sub-second query performance.

```sql
-- BI Engine is enabled at the project or dataset level
-- Configuration done via Cloud Console or API

-- Check if query used BI Engine
-- Look for "bi_engine_statistics" in query job metadata

-- Queries that benefit from BI Engine:
-- - Aggregations on small to medium datasets
-- - Filters and JOINs
-- - GROUP BY operations
-- - Dashboard and visualization queries

-- Example query optimized for BI Engine
SELECT
  product_category,
  DATE_TRUNC(order_date, MONTH) AS month,
  SUM(amount) AS total_sales,
  COUNT(*) AS order_count,
  AVG(amount) AS avg_order_value
FROM my_dataset.orders
WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY product_category, month
ORDER BY month DESC, total_sales DESC;

-- View BI Engine usage
-- Check in Cloud Console > BigQuery > BI Engine
```

## Advanced Features

### Table Snapshots

Create point-in-time copies of tables for backup and analysis.

```sql
-- Create snapshot
CREATE SNAPSHOT TABLE my_dataset.orders_snapshot
CLONE my_dataset.orders
OPTIONS(
  expiration_timestamp=TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
);

-- Restore from snapshot
CREATE OR REPLACE TABLE my_dataset.orders
COPY my_dataset.orders_snapshot;

-- Create snapshot of partition
CREATE SNAPSHOT TABLE my_dataset.events_snapshot
CLONE my_dataset.events
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);

-- List snapshots
SELECT
  table_name,
  snapshot_time_ms,
  base_table_catalog,
  base_table_schema,
  base_table_name
FROM my_dataset.INFORMATION_SCHEMA.TABLE_SNAPSHOTS
WHERE base_table_name = 'orders';

-- Drop snapshot
DROP SNAPSHOT TABLE my_dataset.orders_snapshot;
```

### Time Travel

Query historical data up to 7 days in the past.

```sql
-- Query table as it was 1 hour ago
SELECT *
FROM my_dataset.orders
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);

-- Query table at specific timestamp
SELECT *
FROM my_dataset.customers
FOR SYSTEM_TIME AS OF TIMESTAMP '2024-01-15 10:00:00 UTC';

-- Restore deleted data
CREATE OR REPLACE TABLE my_dataset.orders AS
SELECT *
FROM my_dataset.orders
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 HOUR);

-- Compare current vs historical data
SELECT
  current.order_id,
  current.status AS current_status,
  historical.status AS previous_status
FROM my_dataset.orders AS current
LEFT JOIN (
  SELECT *
  FROM my_dataset.orders
  FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
) AS historical
ON current.order_id = historical.order_id
WHERE current.status != historical.status;
```

### Data Transfer Service

Automate data loads from SaaS applications and external sources.

```sql
-- Data Transfer Service supports:
-- - Google Ads
-- - Campaign Manager
-- - Google Ad Manager
-- - Google Merchant Center
-- - Google Play
-- - YouTube Analytics
-- - Cloud Storage
-- - Amazon S3
-- - Teradata
-- - Amazon Redshift

-- Transfers are configured via Cloud Console or API
-- Scheduled transfers run automatically

-- Example: Query transferred Google Ads data
SELECT
  _DATA_DATE AS date,
  campaign_name,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  SUM(cost) / 1000000 AS total_cost
FROM `my_dataset.ads_CampaignBasicStats_*`
WHERE _TABLE_SUFFIX BETWEEN '20240101' AND '20240131'
GROUP BY date, campaign_name
ORDER BY date DESC;
```

### Search Indexes

Create search indexes for better performance on high-cardinality columns.

```sql
-- Create search index
CREATE SEARCH INDEX my_search_index
ON my_dataset.documents(content)
OPTIONS(analyzer='LOG_ANALYZER');

-- Use search index with SEARCH function
SELECT document_id, title, content
FROM my_dataset.documents
WHERE SEARCH(content, 'machine learning')
ORDER BY document_id;

-- Advanced search with relevance scoring
SELECT
  document_id,
  title,
  SEARCH_SCORE() AS relevance_score
FROM my_dataset.documents
WHERE SEARCH(content, 'artificial intelligence OR machine learning')
ORDER BY relevance_score DESC
LIMIT 10;

-- Drop search index
DROP SEARCH INDEX my_search_index
ON my_dataset.documents;
```

### Column-Level Security

Implement fine-grained access control at the column level.

```sql
-- Create policy tag taxonomy (via Data Catalog)
-- Then apply tags to columns

-- Grant access to policy tag
-- gcloud data-catalog taxonomies policy-tags set-iam-policy \
--   POLICY_TAG_ID policy.json

-- Masked column example
-- Columns tagged with "PII" policy tag will be automatically
-- masked for users without permission

SELECT
  customer_id,
  name,
  email,  -- Masked as NULL if user lacks permission
  phone,  -- Masked as NULL if user lacks permission
  total_purchases
FROM my_dataset.customers;

-- Data masking with policy tags (configured in Data Catalog)
-- - Users without policy tag access see NULL
-- - Users with access see actual values
```

### Row-Level Security

Control which rows users can access using row access policies.

```sql
-- Create row access policy
CREATE OR REPLACE ROW ACCESS POLICY regional_access
ON my_dataset.sales
GRANT TO ('user:analyst@example.com', 'group:regional-managers@example.com')
FILTER USING (region = SESSION_USER());

-- Create policy with complex logic
CREATE OR REPLACE ROW ACCESS POLICY sales_access
ON my_dataset.sales
GRANT TO ('group:analysts@example.com')
FILTER USING (
  sale_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  OR amount < 1000
);

-- Create policy for all users
CREATE OR REPLACE ROW ACCESS POLICY public_data
ON my_dataset.products
GRANT TO ('allAuthenticatedUsers')
FILTER USING (is_public = TRUE);

-- View row access policies
SELECT
  row_access_policy_name,
  grantee_list,
  filter_predicate
FROM my_dataset.INFORMATION_SCHEMA.ROW_ACCESS_POLICIES
WHERE table_name = 'sales';

-- Drop row access policy
DROP ROW ACCESS POLICY regional_access
ON my_dataset.sales;
```

### Query Execution Graph

Analyze query performance with detailed execution statistics.

```python
# Get query execution details
from google.cloud import bigquery

client = bigquery.Client()

query = """
  SELECT customer_id, SUM(amount) AS total
  FROM my_dataset.orders
  WHERE order_date >= '2024-01-01'
  GROUP BY customer_id
  HAVING total > 1000
  ORDER BY total DESC
"""

job_config = bigquery.QueryJobConfig(use_query_cache=False)
query_job = client.query(query, job_config=job_config)
query_job.result()

# Get execution statistics
print(f"Total bytes processed: {query_job.total_bytes_processed}")
print(f"Total bytes billed: {query_job.total_bytes_billed}")
print(f"Total slot ms: {query_job.slot_millis}")
print(f"Cache hit: {query_job.cache_hit}")

# Get query plan
for stage in query_job.query_plan:
    print(f"Stage {stage.name}:")
    print(f"  Input stages: {stage.input_stages}")
    print(f"  Wait ms avg: {stage.wait_ms_avg}")
    print(f"  Read ms avg: {stage.read_ms_avg}")
    print(f"  Compute ms avg: {stage.compute_ms_avg}")
    print(f"  Write ms avg: {stage.write_ms_avg}")
    print(f"  Records read: {stage.records_read}")
    print(f"  Records written: {stage.records_written}")
```

## Data Types

### Numeric Types

| Type       | Range                                                   | Precision   | Use Case                |
| ---------- | ------------------------------------------------------- | ----------- | ----------------------- |
| INT64      | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | Exact       | Integers, IDs           |
| NUMERIC    | 38 digits precision, 9 digits scale                     | Exact       | Financial calculations  |
| BIGNUMERIC | 76.76 digits precision, 38 digits scale                 | Exact       | High-precision decimals |
| FLOAT64    | IEEE 754 double-precision                               | Approximate | Scientific calculations |

### String Types

| Type   | Description                    | Max Size |
| ------ | ------------------------------ | -------- |
| STRING | Variable-length character data | 2 GB     |
| BYTES  | Variable-length binary data    | 2 GB     |

### Date/Time Types

| Type      | Format                                    | Range                                                 |
| --------- | ----------------------------------------- | ----------------------------------------------------- |
| DATE      | YYYY-MM-DD                                | 0001-01-01 to 9999-12-31                              |
| TIME      | HH:MM:SS[.SSSSSS]                         | 00:00:00 to 23:59:59.999999                           |
| DATETIME  | YYYY-MM-DD HH:MM:SS[.SSSSSS]              | 0001-01-01 00:00:00 to 9999-12-31 23:59:59.999999     |
| TIMESTAMP | UNIX timestamp with microsecond precision | 0001-01-01 00:00:00 to 9999-12-31 23:59:59.999999 UTC |
| INTERVAL  | Duration                                  | N/A                                                   |

### Complex Types

- **ARRAY<T>**: Ordered list of zero or more elements of type T
- **STRUCT<field1 T1, field2 T2, ...>**: Container of ordered fields
- **JSON**: Semi-structured JSON data (stored as STRING, parsed with JSON functions)
- **GEOGRAPHY**: Geospatial data (points, lines, polygons)

### Other Types

- **BOOL**: TRUE, FALSE, NULL

## Common Operations

### Data Querying

```sql
-- Basic SELECT
SELECT
  customer_id,
  name,
  email,
  total_purchases
FROM my_dataset.customers
WHERE total_purchases > 1000
ORDER BY total_purchases DESC
LIMIT 100;

-- JOINs
SELECT
  o.order_id,
  o.order_date,
  c.name AS customer_name,
  p.product_name,
  o.quantity,
  o.amount
FROM my_dataset.orders o
INNER JOIN my_dataset.customers c
  ON o.customer_id = c.customer_id
INNER JOIN my_dataset.products p
  ON o.product_id = p.product_id
WHERE o.order_date >= '2024-01-01';

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
  ) AS moving_avg_3,
  RANK() OVER (PARTITION BY DATE_TRUNC(order_date, MONTH) ORDER BY amount DESC) AS monthly_rank
FROM my_dataset.orders;

-- Subqueries
SELECT
  customer_id,
  name,
  (SELECT COUNT(*) FROM my_dataset.orders o WHERE o.customer_id = c.customer_id) AS order_count,
  (SELECT SUM(amount) FROM my_dataset.orders o WHERE o.customer_id = c.customer_id) AS total_spent
FROM my_dataset.customers c
WHERE customer_id IN (
  SELECT customer_id
  FROM my_dataset.orders
  WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
);

-- UNNEST arrays
SELECT
  order_id,
  item.product_id,
  item.quantity,
  item.price
FROM my_dataset.orders,
UNNEST(items) AS item;

-- Work with JSON
SELECT
  event_id,
  JSON_VALUE(event_data, '$.user_id') AS user_id,
  JSON_VALUE(event_data, '$.action') AS action,
  JSON_VALUE(event_data, '$.product.name') AS product_name
FROM my_dataset.events;

-- PIVOT
SELECT *
FROM (
  SELECT region, product_category, sales
  FROM my_dataset.sales_data
)
PIVOT (
  SUM(sales) AS total_sales
  FOR product_category IN ('Electronics', 'Clothing', 'Books')
);

-- Common Table Expressions (CTEs)
WITH monthly_sales AS (
  SELECT
    DATE_TRUNC(order_date, MONTH) AS month,
    SUM(amount) AS total_sales
  FROM my_dataset.orders
  GROUP BY month
),
growth_calc AS (
  SELECT
    month,
    total_sales,
    LAG(total_sales) OVER (ORDER BY month) AS prev_month_sales
  FROM monthly_sales
)
SELECT
  month,
  total_sales,
  prev_month_sales,
  SAFE_DIVIDE(total_sales - prev_month_sales, prev_month_sales) * 100 AS growth_pct
FROM growth_calc
ORDER BY month;
```

### Data Manipulation

```sql
-- INSERT
INSERT INTO my_dataset.customers (customer_id, name, email)
VALUES (1, 'John Doe', 'john@example.com');

INSERT INTO my_dataset.customers (customer_id, name, email)
SELECT customer_id, name, email
FROM my_dataset.staging_customers;

-- UPDATE
UPDATE my_dataset.customers
SET email = 'newemail@example.com',
    updated_at = CURRENT_TIMESTAMP()
WHERE customer_id = 100;

-- DELETE
DELETE FROM my_dataset.orders
WHERE order_date < DATE_SUB(CURRENT_DATE(), INTERVAL 2 YEAR);

-- MERGE (Upsert)
MERGE my_dataset.customers AS target
USING my_dataset.customer_updates AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN
  UPDATE SET
    name = source.name,
    email = source.email,
    updated_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN
  INSERT (customer_id, name, email, created_at)
  VALUES (source.customer_id, source.name, source.email, CURRENT_TIMESTAMP());

-- TRUNCATE
TRUNCATE TABLE my_dataset.staging_table;
```

### Data Loading

```sql
-- Load from Cloud Storage
LOAD DATA INTO my_dataset.customers
FROM FILES (
  format = 'CSV',
  uris = ['gs://my-bucket/customers/*.csv'],
  skip_leading_rows = 1
);

-- Load Parquet
LOAD DATA INTO my_dataset.events
FROM FILES (
  format = 'PARQUET',
  uris = ['gs://my-bucket/events/2024-01-*/*.parquet']
);

-- Load JSON
LOAD DATA INTO my_dataset.logs
FROM FILES (
  format = 'JSON',
  uris = ['gs://my-bucket/logs/*.json']
);

-- Load with schema auto-detection
LOAD DATA INTO my_dataset.new_table
FROM FILES (
  format = 'CSV',
  uris = ['gs://my-bucket/data.csv'],
  auto_detect_schema = TRUE
);

-- Export to Cloud Storage
EXPORT DATA
OPTIONS (
  uri = 'gs://my-bucket/export/customers-*.csv',
  format = 'CSV',
  overwrite = TRUE,
  header = TRUE
)
AS (
  SELECT * FROM my_dataset.customers
);

-- Export Parquet
EXPORT DATA
OPTIONS (
  uri = 'gs://my-bucket/export/orders-*.parquet',
  format = 'PARQUET'
)
AS (
  SELECT * FROM my_dataset.orders
  WHERE order_date >= '2024-01-01'
);
```

## Performance Optimization

### Best Practices

```sql
-- 1. Partition large tables
CREATE TABLE my_dataset.events (
  event_id INT64,
  event_timestamp TIMESTAMP,
  user_id INT64
)
PARTITION BY DATE(event_timestamp)
OPTIONS(require_partition_filter=TRUE);

-- 2. Cluster frequently filtered columns
CREATE TABLE my_dataset.sales (
  sale_id INT64,
  customer_id INT64,
  product_id INT64,
  sale_date DATE,
  amount NUMERIC
)
PARTITION BY sale_date
CLUSTER BY customer_id, product_id;

-- 3. Use appropriate data types
-- Use INT64 instead of STRING for IDs
-- Use DATE instead of TIMESTAMP when time is not needed
-- Use NUMERIC for exact decimal calculations

-- 4. Avoid SELECT *
-- Query only the columns you need
SELECT customer_id, name, total_purchases
FROM my_dataset.customers;

-- 5. Filter early and often
SELECT
  customer_id,
  SUM(amount) AS total
FROM my_dataset.orders
WHERE order_date >= '2024-01-01'  -- Partition filter
  AND customer_id IS NOT NULL
GROUP BY customer_id;

-- 6. Use APPROX functions for large datasets
SELECT
  APPROX_COUNT_DISTINCT(customer_id) AS approx_unique_customers,
  APPROX_QUANTILES(amount, 100)[OFFSET(50)] AS median_amount
FROM my_dataset.orders;

-- 7. Denormalize for analytics
CREATE TABLE my_dataset.orders_denormalized AS
SELECT
  o.*,
  c.name AS customer_name,
  c.region AS customer_region,
  p.product_name,
  p.category AS product_category
FROM my_dataset.orders o
JOIN my_dataset.customers c ON o.customer_id = c.customer_id
JOIN my_dataset.products p ON o.product_id = p.product_id;

-- 8. Use materialized views for frequent aggregations
CREATE MATERIALIZED VIEW my_dataset.daily_sales_mv AS
SELECT
  DATE(order_timestamp) AS order_date,
  product_id,
  SUM(amount) AS total_sales,
  COUNT(*) AS order_count
FROM my_dataset.orders
GROUP BY order_date, product_id;

-- 9. Optimize JOINs
-- Put largest table first
SELECT /*+ NO_QUERY_CACHE */
  large.id,
  small.name
FROM large_table AS large
JOIN small_table AS small
  ON large.id = small.id;

-- 10. Monitor query performance
SELECT
  creation_time,
  query,
  total_bytes_processed,
  total_slot_ms,
  total_bytes_billed / POW(10, 12) AS tb_billed,
  (total_slot_ms / 1000) / 3600 AS slot_hours
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND job_type = 'QUERY'
  AND state = 'DONE'
ORDER BY total_bytes_processed DESC
LIMIT 10;
```

### Query Optimization

```sql
-- Use query plan to identify bottlenecks
-- Run EXPLAIN statement
EXPLAIN
SELECT
  customer_id,
  SUM(amount) AS total_amount
FROM my_dataset.orders
WHERE order_date >= '2024-01-01'
GROUP BY customer_id
HAVING total_amount > 1000;

-- Avoid self-JOINs when possible
-- BAD:
SELECT a.customer_id, a.name, b.total_orders
FROM customers a
JOIN (
  SELECT customer_id, COUNT(*) AS total_orders
  FROM orders
  GROUP BY customer_id
) b ON a.customer_id = b.customer_id;

-- GOOD:
SELECT
  c.customer_id,
  c.name,
  COUNT(o.order_id) AS total_orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name;

-- Use WITH clause to avoid repeated subqueries
WITH order_totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
)
SELECT
  c.name,
  ot.total,
  ot.total / (SELECT AVG(total) FROM order_totals) AS pct_of_avg
FROM customers c
JOIN order_totals ot ON c.customer_id = ot.customer_id;
```

## Security Features

### IAM and Access Control

```sql
-- Grant dataset access
-- GRANT `roles/bigquery.dataViewer` ON my_dataset TO 'user:analyst@example.com'

-- Grant table access
-- GRANT `roles/bigquery.dataViewer` ON my_dataset.customers TO 'group:analysts@example.com'

-- Authorized views (view can access data user can't)
CREATE VIEW my_dataset.customer_summary
OPTIONS(
  description='Summary view for analysts'
)
AS
SELECT
  customer_id,
  name,
  total_purchases,
  -- Hide sensitive email and phone
FROM my_dataset.customers;

-- Then grant access to view, not base table
-- GRANT `roles/bigquery.dataViewer` ON my_dataset.customer_summary TO 'group:analysts@example.com'
```

### Encryption

```sql
-- Encryption at rest (automatic)
-- - All data encrypted with AES-256
-- - Google-managed or customer-managed keys (CMEK)

-- Enable customer-managed encryption keys (CMEK)
-- Configure via Cloud Console or API

-- Create table with CMEK
CREATE TABLE my_dataset.encrypted_data (
  id INT64,
  sensitive_data STRING
)
OPTIONS(
  kms_key_name="projects/my-project/locations/us/keyRings/my-ring/cryptoKeys/my-key"
);
```

### Audit Logging

```sql
-- BigQuery audit logs are automatically sent to Cloud Logging

-- Query audit logs
SELECT
  timestamp,
  principal_email,
  method_name,
  resource.labels.dataset_id,
  resource.labels.table_id,
  protopayload_auditlog.authenticationInfo.principalEmail
FROM `my-project.my_dataset.cloudaudit_googleapis_com_data_access_*`
WHERE resource.type = 'bigquery_resource'
  AND DATE(_PARTITIONTIME) >= CURRENT_DATE() - 7
ORDER BY timestamp DESC;
```

## BigQuery vs Other Data Warehouses

| Feature             | BigQuery                       | Snowflake          | Redshift              | Databricks           |
| ------------------- | ------------------------------ | ------------------ | --------------------- | -------------------- |
| Architecture        | Serverless                     | Multi-cluster      | MPP                   | Lakehouse            |
| Storage Format      | Columnar (Capacitor)           | Proprietary        | Columnar              | Delta Lake           |
| Scaling             | Automatic                      | Manual/Auto        | Manual resize         | Auto-scaling         |
| Pricing             | Per-query (on-demand) or slots | Per-second compute | Hourly                | DBU-based            |
| ML Support          | BigQuery ML (native)           | Snowpark ML        | SageMaker integration | MLflow (native)      |
| Real-time Streaming | Native                         | Limited            | Kinesis integration   | Structured Streaming |
| Time Travel         | 7 days                         | 0-90 days          | Manual snapshots      | Delta Lake           |
| Public Datasets     | 200+ datasets                  | Marketplace        | None                  | Partner integrations |
| Multi-cloud         | GCP (query AWS/Azure)          | AWS, Azure, GCP    | AWS only              | AWS, Azure, GCP      |

## Best Practices

### 1. Cost Optimization

```sql
-- Use partitioning and clustering
CREATE TABLE my_dataset.events (
  event_timestamp TIMESTAMP,
  user_id INT64,
  event_type STRING
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY user_id, event_type
OPTIONS(require_partition_filter=TRUE);

-- Monitor costs
SELECT
  DATE(creation_time) AS query_date,
  user_email,
  SUM(total_bytes_billed) / POW(10, 12) AS tb_billed,
  SUM(total_bytes_billed) / POW(10, 12) * 5 AS estimated_cost_usd
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE DATE(creation_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND job_type = 'QUERY'
  AND state = 'DONE'
GROUP BY query_date, user_email
ORDER BY query_date DESC, tb_billed DESC;

-- Set maximum bytes billed
-- Prevents accidentally expensive queries
```

```python
# Set query cost limit
from google.cloud import bigquery

client = bigquery.Client()

job_config = bigquery.QueryJobConfig(
    maximum_bytes_billed=100000000  # 100 MB limit
)

query_job = client.query(query, job_config=job_config)
```

### 2. Data Organization

```sql
-- Use descriptive naming
-- dataset: domain_environment (e.g., sales_prod, analytics_dev)
-- table: entity_type (e.g., customers_master, orders_daily)

-- Set table expiration for temporary data
ALTER TABLE my_dataset.temp_analysis
SET OPTIONS (
  expiration_timestamp=TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
);

-- Use labels for organization
ALTER TABLE my_dataset.customers
SET OPTIONS (
  labels=[("env", "prod"), ("team", "marketing"), ("pii", "true")]
);
```

### 3. Query Efficiency

```sql
-- Cache results when appropriate (default 24 hours)
-- Use query cache by running identical queries

-- Disable cache for testing
SELECT /*+ NO_QUERY_CACHE */ *
FROM my_dataset.large_table
LIMIT 1000;

-- Use LIMIT for exploratory queries
SELECT *
FROM my_dataset.large_table
LIMIT 100;

-- Sample data for development
SELECT *
FROM my_dataset.large_table
TABLESAMPLE SYSTEM (1 PERCENT);
```

### 4. Data Quality

```sql
-- Add constraints with descriptions
ALTER TABLE my_dataset.orders
ADD CONSTRAINT pk_order_id PRIMARY KEY (order_id) NOT ENFORCED,
ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id)
  REFERENCES my_dataset.customers (customer_id) NOT ENFORCED;

-- Data validation queries
SELECT
  'orders' AS table_name,
  COUNT(*) AS total_rows,
  COUNTIF(order_id IS NULL) AS null_order_ids,
  COUNTIF(customer_id IS NULL) AS null_customer_ids,
  COUNTIF(amount <= 0) AS invalid_amounts,
  COUNTIF(order_date > CURRENT_DATE()) AS future_dates,
  CURRENT_TIMESTAMP() AS checked_at
FROM my_dataset.orders;
```

### 5. Monitoring and Alerting

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW my_dataset.query_performance AS
SELECT
  creation_time,
  user_email,
  query,
  total_bytes_processed / POW(10, 9) AS gb_processed,
  total_slot_ms / 1000 / 60 AS slot_minutes,
  TIMESTAMP_DIFF(end_time, start_time, SECOND) AS duration_seconds,
  error_result.message AS error_message
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND job_type = 'QUERY'
ORDER BY creation_time DESC;

-- Set up alerts in Cloud Monitoring
-- Alert when daily query costs exceed threshold
-- Alert when query errors spike
-- Alert when specific datasets haven't been updated
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="bigquery" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Traditional relational database
- [Snowflake](/databases/snowflake/) - Cloud data warehouse
- [Databricks](/databases/databricks/) - Lakehouse platform
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries

## Resources

- [Official Documentation](https://cloud.google.com/bigquery/docs) - Complete BigQuery documentation
- [BigQuery SQL Reference](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax) - SQL syntax guide
- [BigQuery Public Datasets](https://cloud.google.com/bigquery/public-data) - 200+ free datasets
- [BigQuery ML Documentation](https://cloud.google.com/bigquery-ml/docs) - Machine learning in SQL
- [BigQuery Best Practices](https://cloud.google.com/bigquery/docs/best-practices) - Performance and cost optimization
- [BigQuery Pricing Calculator](https://cloud.google.com/products/calculator) - Estimate costs
- [BigQuery YouTube Channel](https://www.youtube.com/c/googlecloudplatform) - Video tutorials
- [BigQuery Community](https://stackoverflow.com/questions/tagged/google-bigquery) - Stack Overflow Q&A
