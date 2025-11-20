---
title: Apache Spark SQL
description: >-
  Comprehensive guide to Apache Spark SQL - Distributed SQL processing engine
  for big data analytics
difficulty: intermediate
tags:
  - databases
  - spark-sql
  - spark
  - sparksql
  - bigdata
  - distributed
  - hadoop
---

# Apache Spark SQL

## Overview

Apache Spark SQL is a distributed SQL processing engine built on Apache Spark for processing structured and semi-structured data at scale. It provides a unified interface for querying data across various sources using SQL or the DataFrame API, combining the power of SQL with the flexibility of programming languages like Python, Scala, and Java.

### Key Features

- **Unified Analytics**: Single engine for batch and streaming data processing
- **DataFrame API**: High-level API for working with structured data
- **SQL Support**: Full ANSI SQL:2003 support with extensions
- **Multiple Data Sources**: Read from Parquet, JSON, CSV, Avro, ORC, Hive, JDBC, and more
- **Catalyst Optimizer**: Advanced query optimization engine
- **Code Generation**: Runtime code generation for improved performance
- **In-Memory Processing**: Distribute data across cluster memory for fast analytics
- **Hive Compatibility**: Full compatibility with Apache Hive metastore and HiveQL
- **Streaming SQL**: Unified SQL interface for batch and streaming data
- **Machine Learning Integration**: Seamless integration with MLlib

## Getting Started

### Installation

::: code-group

```bash [Standalone Installation]
# Download Spark
wget https://archive.apache.org/dist/spark/spark-3.5.0/spark-3.5.0-bin-hadoop3.tgz

# Extract
tar -xzf spark-3.5.0-bin-hadoop3.tgz
cd spark-3.5.0-bin-hadoop3

# Set environment variables
export SPARK_HOME=$(pwd)
export PATH=$SPARK_HOME/bin:$PATH

# Verify installation
spark-shell --version
```

```bash [Docker]
# Pull Spark image
docker pull apache/spark:3.5.0

# Run Spark with SQL shell
docker run -it apache/spark:3.5.0 /opt/spark/bin/spark-sql

# Run with PySpark
docker run -it apache/spark:3.5.0 /opt/spark/bin/pyspark
```

```bash [PySpark (Python)]
# Install PySpark via pip
pip install pyspark

# Verify installation
python -c "import pyspark; print(pyspark.__version__)"
```

```bash [Databricks]
# Use Databricks Community Edition (free)
# https://community.cloud.databricks.com/

# Spark SQL is pre-installed and configured
# Access via notebooks with %sql magic command
```

:::

### Starting Spark SQL

```bash
# Spark SQL Shell (interactive)
spark-sql

# PySpark with SQL support
pyspark

# Scala Spark Shell
spark-shell

# Submit Spark application
spark-submit --master local[*] my_app.py
```

### Basic Connection and Usage

::: code-group

```python [PySpark]
from pyspark.sql import SparkSession

# Create SparkSession
spark = SparkSession.builder \
    .appName("MyApp") \
    .config("spark.sql.warehouse.dir", "/user/hive/warehouse") \
    .enableHiveSupport() \
    .getOrCreate()

# Run SQL query
df = spark.sql("SELECT * FROM my_table")
df.show()

# Stop session
spark.stop()
```

```scala [Scala]
import org.apache.spark.sql.SparkSession

// Create SparkSession
val spark = SparkSession.builder()
  .appName("MyApp")
  .config("spark.sql.warehouse.dir", "/user/hive/warehouse")
  .enableHiveSupport()
  .getOrCreate()

// Run SQL query
val df = spark.sql("SELECT * FROM my_table")
df.show()

// Stop session
spark.stop()
```

```sql [Spark SQL Shell]
-- Start shell
spark-sql

-- Run queries directly
SELECT * FROM my_table;

-- Exit
!quit;
```

:::

## Spark SQL-Specific Features

### DataFrames and Datasets

```python
# Create DataFrame from data
data = [("Alice", 25), ("Bob", 30), ("Charlie", 35)]
df = spark.createDataFrame(data, ["name", "age"])

# Show DataFrame
df.show()
# +-------+---+
# |   name|age|
# +-------+---+
# |  Alice| 25|
# |    Bob| 30|
# |Charlie| 35|
# +-------+---+

# Print schema
df.printSchema()
# root
#  |-- name: string (nullable = true)
#  |-- age: long (nullable = true)

# Select columns
df.select("name").show()

# Filter rows
df.filter(df.age > 25).show()
df.where("age > 25").show()  # SQL-style

# Add new column
df.withColumn("age_plus_10", df.age + 10).show()

# Rename column
df.withColumnRenamed("name", "full_name").show()

# Drop column
df.drop("age").show()

# Aggregate
df.groupBy("age").count().show()

# Order
df.orderBy("age", ascending=False).show()
df.sort(df.age.desc()).show()

# Register as temporary view
df.createOrReplaceTempView("people")
spark.sql("SELECT * FROM people WHERE age > 25").show()
```

### Reading Data from Multiple Sources

```python
# Read CSV
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)

# Read with options
df_csv = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("delimiter", ",") \
    .csv("data.csv")

# Read JSON
df_json = spark.read.json("path/to/file.json")

# Read Parquet (columnar format, recommended)
df_parquet = spark.read.parquet("path/to/file.parquet")

# Read ORC
df_orc = spark.read.orc("path/to/file.orc")

# Read Avro (requires spark-avro package)
df_avro = spark.read.format("avro").load("path/to/file.avro")

# Read from JDBC database
df_jdbc = spark.read \
    .format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/mydb") \
    .option("dbtable", "users") \
    .option("user", "username") \
    .option("password", "password") \
    .load()

# Read from Hive table
df_hive = spark.sql("SELECT * FROM hive_table")

# Read from Delta Lake (requires delta-spark package)
df_delta = spark.read.format("delta").load("path/to/delta/table")

# Read text file
df_text = spark.read.text("path/to/file.txt")

# Read multiple files with pattern
df_multi = spark.read.parquet("path/to/year=*/month=*/day=*/*.parquet")
```

### Writing Data to Multiple Formats

```python
# Write to Parquet
df.write.parquet("output/path")

# Write with partitioning
df.write.partitionBy("year", "month").parquet("output/path")

# Write modes
df.write.mode("overwrite").parquet("output/path")     # Overwrite
df.write.mode("append").parquet("output/path")        # Append
df.write.mode("ignore").parquet("output/path")        # Ignore if exists
df.write.mode("error").parquet("output/path")         # Error if exists (default)

# Write to CSV
df.write.csv("output/path", header=True)

# Write to JSON
df.write.json("output/path")

# Write to ORC
df.write.orc("output/path")

# Write to JDBC database
df.write \
    .format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/mydb") \
    .option("dbtable", "users") \
    .option("user", "username") \
    .option("password", "password") \
    .mode("append") \
    .save()

# Write to Hive table
df.write.mode("overwrite").saveAsTable("hive_table")

# Write with bucketing
df.write.bucketBy(42, "user_id").sortBy("timestamp").saveAsTable("bucketed_table")

# Write to Delta Lake
df.write.format("delta").mode("overwrite").save("path/to/delta/table")
```

### SQL Functions and Expressions

```python
from pyspark.sql import functions as F
from pyspark.sql.functions import col, lit, when

# String functions
df.select(
    F.upper("name"),
    F.lower("name"),
    F.concat("first_name", lit(" "), "last_name").alias("full_name"),
    F.substring("name", 1, 3),
    F.length("name"),
    F.trim("name"),
    F.regexp_replace("name", "A", "X")
).show()

# Numeric functions
df.select(
    F.round("price", 2),
    F.ceil("value"),
    F.floor("value"),
    F.abs("balance"),
    F.sqrt("number"),
    F.pow("base", 2)
).show()

# Date/time functions
df.select(
    F.current_date(),
    F.current_timestamp(),
    F.year("date_column"),
    F.month("date_column"),
    F.dayofmonth("date_column"),
    F.date_add("date_column", 7),
    F.date_sub("date_column", 7),
    F.datediff("end_date", "start_date"),
    F.to_date("string_date", "yyyy-MM-dd"),
    F.date_format("timestamp", "yyyy-MM-dd")
).show()

# Conditional expressions
df.select(
    when(col("age") < 18, "Minor")
        .when(col("age") < 65, "Adult")
        .otherwise("Senior").alias("age_group")
).show()

# NULL handling
df.select(
    F.coalesce("col1", "col2", lit("default")),
    F.isnan("numeric_col"),
    F.isnull("col")
).show()

df.na.drop()  # Drop rows with any NULL
df.na.drop(subset=["col1", "col2"])  # Drop if specific columns are NULL
df.na.fill(0)  # Fill all NULLs with 0
df.na.fill({"col1": 0, "col2": "unknown"})  # Fill by column

# Aggregate functions
df.groupBy("category").agg(
    F.count("*").alias("count"),
    F.sum("amount").alias("total"),
    F.avg("amount").alias("average"),
    F.min("amount").alias("minimum"),
    F.max("amount").alias("maximum"),
    F.stddev("amount").alias("std_dev"),
    F.collect_list("product").alias("products"),
    F.collect_set("product").alias("unique_products")
).show()

# Array and map functions
df.select(
    F.array("col1", "col2", "col3").alias("array_col"),
    F.map_from_arrays("keys", "values").alias("map_col"),
    F.explode("array_column"),
    F.size("array_column"),
    F.array_contains("array_col", "value")
).show()
```

### Window Functions

```python
from pyspark.sql.window import Window

# Define window specification
window_spec = Window.partitionBy("department").orderBy("salary")

# Ranking functions
df.select(
    "employee_name",
    "department",
    "salary",
    F.row_number().over(window_spec).alias("row_num"),
    F.rank().over(window_spec).alias("rank"),
    F.dense_rank().over(window_spec).alias("dense_rank"),
    F.ntile(4).over(window_spec).alias("quartile")
).show()

# Offset functions
df.select(
    "employee_name",
    "salary",
    F.lag("salary", 1).over(window_spec).alias("prev_salary"),
    F.lead("salary", 1).over(window_spec).alias("next_salary")
).show()

# Aggregate window functions
window_unbounded = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df.select(
    "date",
    "revenue",
    F.sum("revenue").over(window_unbounded).alias("running_total"),
    F.avg("revenue").over(Window.partitionBy("department")).alias("dept_avg")
).show()

# Moving average (7-day window)
window_7day = Window.orderBy("date").rowsBetween(-6, 0)
df.select(
    "date",
    "value",
    F.avg("value").over(window_7day).alias("moving_avg_7")
).show()
```

### Complex Data Types

```python
# Struct (nested structure)
df.select(
    F.struct("first_name", "last_name").alias("name"),
    F.col("address.street"),
    F.col("address.city")
).show()

# Array operations
df.select(
    F.array("item1", "item2", "item3").alias("items"),
    F.size("array_col").alias("array_size"),
    F.array_contains("tags", "important").alias("has_tag"),
    F.sort_array("array_col").alias("sorted"),
    F.array_distinct("array_col").alias("unique_items")
).show()

# Explode arrays
df.select(
    "id",
    F.explode("array_column").alias("item")
).show()

# Explode with position
df.select(
    "id",
    F.posexplode("array_column").alias("pos", "item")
).show()

# Map operations
df.select(
    F.map_keys("map_col"),
    F.map_values("map_col"),
    F.map_concat("map1", "map2"),
    F.element_at("map_col", "key")
).show()

# JSON operations
df.select(
    F.from_json("json_string", schema).alias("parsed"),
    F.to_json("struct_col").alias("json_str"),
    F.get_json_object("json_col", "$.field").alias("value")
).show()
```

### User-Defined Functions (UDFs)

```python
# Python UDF
from pyspark.sql.types import IntegerType

def square(x):
    return x * x

# Register UDF
square_udf = F.udf(square, IntegerType())

# Use in DataFrame
df.select(square_udf("number").alias("squared")).show()

# Register for SQL usage
spark.udf.register("square", square, IntegerType())
spark.sql("SELECT square(5) as result").show()

# Pandas UDF (vectorized, much faster)
from pyspark.sql.functions import pandas_udf
import pandas as pd

@pandas_udf(IntegerType())
def pandas_square(series: pd.Series) -> pd.Series:
    return series * series

df.select(pandas_square("number").alias("squared")).show()

# Pandas UDF for grouped aggregation
@pandas_udf("double")
def mean_udf(v: pd.Series) -> float:
    return v.mean()

df.groupBy("group").agg(mean_udf("value")).show()
```

### Hive Integration

```sql
-- Create Hive table
CREATE TABLE IF NOT EXISTS users (
    user_id INT,
    username STRING,
    email STRING,
    created_date DATE
)
PARTITIONED BY (country STRING)
STORED AS PARQUET;

-- Insert data
INSERT INTO users PARTITION(country='US')
VALUES (1, 'alice', 'alice@example.com', '2024-01-15');

-- Dynamic partitioning
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;

INSERT INTO users PARTITION(country)
SELECT user_id, username, email, created_date, country
FROM staging_users;

-- Show partitions
SHOW PARTITIONS users;

-- Alter table
ALTER TABLE users ADD COLUMNS (last_login TIMESTAMP);

-- Drop partition
ALTER TABLE users DROP PARTITION (country='UK');

-- Analyze table for statistics
ANALYZE TABLE users COMPUTE STATISTICS;
ANALYZE TABLE users PARTITION(country='US') COMPUTE STATISTICS;

-- Show statistics
DESCRIBE EXTENDED users;
```

### SQL DDL and DML Operations

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS analytics;
USE analytics;

-- Create managed table
CREATE TABLE employees (
    employee_id INT,
    name STRING,
    department STRING,
    salary DECIMAL(10,2),
    hire_date DATE
)
USING PARQUET
PARTITIONED BY (department);

-- Create external table
CREATE EXTERNAL TABLE logs (
    timestamp TIMESTAMP,
    level STRING,
    message STRING
)
STORED AS PARQUET
LOCATION '/data/logs';

-- Create table from query (CTAS)
CREATE TABLE high_earners AS
SELECT * FROM employees WHERE salary > 100000;

-- Temporary view
CREATE OR REPLACE TEMP VIEW active_users AS
SELECT * FROM users WHERE status = 'active';

-- Global temporary view (session-scoped)
CREATE GLOBAL TEMP VIEW global_summary AS
SELECT department, COUNT(*) as count FROM employees GROUP BY department;

-- Access global temp view
SELECT * FROM global_temp.global_summary;

-- Insert data
INSERT INTO employees VALUES
(1, 'Alice', 'Engineering', 95000, '2020-01-15'),
(2, 'Bob', 'Sales', 75000, '2021-03-20');

-- Insert from query
INSERT INTO employees
SELECT * FROM staging_employees WHERE status = 'approved';

-- Insert overwrite
INSERT OVERWRITE TABLE employees
SELECT * FROM new_employees;

-- Update (Delta Lake/Iceberg only)
UPDATE employees
SET salary = salary * 1.1
WHERE department = 'Engineering';

-- Delete (Delta Lake/Iceberg only)
DELETE FROM employees WHERE hire_date < '2020-01-01';

-- Merge (Delta Lake/Iceberg only)
MERGE INTO target
USING source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

-- Truncate table
TRUNCATE TABLE employees;

-- Drop table
DROP TABLE IF EXISTS old_table;

-- Show tables
SHOW TABLES;
SHOW TABLES IN analytics;

-- Describe table
DESCRIBE employees;
DESCRIBE EXTENDED employees;
DESCRIBE FORMATTED employees;

-- Show columns
SHOW COLUMNS IN employees;
```

## Advanced Features

### Catalyst Query Optimizer

```python
# View logical plan
df.explain(True)

# Stages of optimization:
# 1. Analysis: Resolve column names, data types
# 2. Logical Optimization: Rule-based optimization
#    - Predicate pushdown
#    - Projection pruning
#    - Constant folding
#    - Join reordering
# 3. Physical Planning: Generate physical execution plans
# 4. Code Generation: Generate Java bytecode

# Example: Predicate pushdown
df = spark.read.parquet("large_dataset")
filtered = df.filter("date = '2024-01-15'")  # Pushed down to file scan

# Broadcast join hint
from pyspark.sql.functions import broadcast
small_df = spark.read.csv("small.csv")
large_df = spark.read.parquet("large.parquet")

# Force broadcast join
result = large_df.join(broadcast(small_df), "id")
```

### Adaptive Query Execution (AQE)

```python
# Enable AQE (enabled by default in Spark 3.0+)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# AQE features:
# 1. Dynamically coalesce shuffle partitions
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# 2. Dynamically switch join strategies
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# 3. Dynamically optimize skew joins
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")

# View execution plan with AQE
df.explain("formatted")
```

### Partitioning and Bucketing

```python
# Partition by column (directory-based)
df.write \
    .partitionBy("year", "month") \
    .parquet("partitioned_data")

# Read specific partitions
df = spark.read.parquet("partitioned_data/year=2024/month=01")

# Bucketing (file-based, better for joins)
df.write \
    .bucketBy(100, "user_id") \
    .sortBy("timestamp") \
    .saveAsTable("bucketed_users")

# Repartition in memory
df.repartition(10)  # Random redistribution
df.repartition("department")  # Hash partitioning by column
df.repartitionByRange("date")  # Range partitioning

# Coalesce (reduce partitions, no shuffle)
df.coalesce(1)  # Reduce to 1 partition
```

### Caching and Persistence

```python
# Cache in memory (default MEMORY_AND_DISK)
df.cache()
df.persist()

# Specify storage level
from pyspark import StorageLevel

df.persist(StorageLevel.MEMORY_ONLY)
df.persist(StorageLevel.MEMORY_AND_DISK)
df.persist(StorageLevel.DISK_ONLY)
df.persist(StorageLevel.MEMORY_AND_DISK_SER)  # Serialized
df.persist(StorageLevel.OFF_HEAP)

# Unpersist
df.unpersist()

# SQL cache
spark.sql("CACHE TABLE users")
spark.sql("UNCACHE TABLE users")

# Clear all caches
spark.catalog.clearCache()
```

### Dynamic Partition Pruning (DPP)

```sql
-- Enable DPP (enabled by default in Spark 3.0+)
SET spark.sql.optimizer.dynamicPartitionPruning.enabled = true;

-- Example: Fact-dimension join with partition pruning
SELECT f.sales, d.product_name
FROM fact_sales f
JOIN dim_products d ON f.product_id = d.product_id
WHERE d.category = 'Electronics'
AND f.sale_date BETWEEN '2024-01-01' AND '2024-12-31';

-- DPP automatically filters fact table partitions based on dimension filter
```

### Structured Streaming

```python
# Read streaming data
streaming_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "topic1") \
    .load()

# Process streaming data
result = streaming_df \
    .selectExpr("CAST(value AS STRING)") \
    .groupBy("value") \
    .count()

# Write streaming output
query = result.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()

query.awaitTermination()

# Streaming SQL
streaming_df.createOrReplaceTempView("stream_data")
result = spark.sql("""
    SELECT window(timestamp, '1 minute'), category, COUNT(*)
    FROM stream_data
    GROUP BY window(timestamp, '1 minute'), category
""")

# Window operations on event time
result = streaming_df \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(F.window("timestamp", "5 minutes"), "category") \
    .count()
```

### Delta Lake Integration

```python
# Create Delta table
df.write.format("delta").save("/path/to/delta/table")

# Read Delta table
df = spark.read.format("delta").load("/path/to/delta/table")

# Time travel
df = spark.read.format("delta").option("versionAsOf", 5).load("/delta/table")
df = spark.read.format("delta").option("timestampAsOf", "2024-01-01").load("/delta/table")

# ACID transactions
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/path/to/delta/table")

# Update
delta_table.update(
    condition = "date < '2024-01-01'",
    set = {"status": "'archived'"}
)

# Delete
delta_table.delete("age < 18")

# Merge (UPSERT)
delta_table.alias("target").merge(
    source.alias("source"),
    "target.id = source.id"
).whenMatchedUpdate(set = {
    "value": "source.value"
}).whenNotMatchedInsert(values = {
    "id": "source.id",
    "value": "source.value"
}).execute()

# Optimize and vacuum
delta_table.optimize().executeCompaction()
delta_table.vacuum(168)  # Remove files older than 7 days
```

## Performance Optimization

### Query Performance Tips

```python
# 1. Use appropriate file formats
# Parquet/ORC > Avro > JSON > CSV
df.write.parquet("data.parquet")  # Columnar, compressed, predicate pushdown

# 2. Enable compression
spark.conf.set("spark.sql.parquet.compression.codec", "snappy")  # or gzip, zstd

# 3. Partition large datasets
df.write.partitionBy("date").parquet("partitioned_data")

# 4. Use bucketing for join optimization
df.write.bucketBy(100, "user_id").saveAsTable("bucketed_table")

# 5. Broadcast small tables
result = large_df.join(broadcast(small_df), "id")

# 6. Use appropriate number of partitions
spark.conf.set("spark.sql.shuffle.partitions", "200")  # Default is 200

# 7. Avoid UDFs when possible (use built-in functions)
# ❌ Slower
df.select(my_udf("col"))
# ✅ Faster
df.select(F.upper("col"))

# 8. Cache frequently accessed data
df.cache()

# 9. Use columnar operations
# ❌ Row-by-row processing
df.rdd.map(lambda row: row.value * 2)
# ✅ Columnar operation
df.select(col("value") * 2)

# 10. Filter early
df.filter("date >= '2024-01-01'").groupBy("category").count()
```

### Configuration Tuning

```python
# Memory configuration
spark.conf.set("spark.executor.memory", "4g")
spark.conf.set("spark.driver.memory", "2g")
spark.conf.set("spark.memory.fraction", "0.8")  # Fraction for execution and storage

# Parallelism
spark.conf.set("spark.default.parallelism", "100")
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Broadcast threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "10485760")  # 10MB

# Adaptive query execution
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# Dynamic allocation
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.minExecutors", "1")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "10")

# Compression
spark.conf.set("spark.sql.parquet.compression.codec", "snappy")

# Optimization
spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.enabled", "true")
```

### Monitoring and Debugging

```python
# View execution plan
df.explain()
df.explain(True)  # Verbose mode
df.explain("formatted")  # Formatted output

# Web UI (default: http://localhost:4040)
# - Jobs, Stages, Storage, Environment, Executors, SQL tabs

# Logging
spark.sparkContext.setLogLevel("INFO")  # or DEBUG, WARN, ERROR

# Metrics
# Access via Spark UI or programmatically
metrics = spark.sparkContext._jsc.sc().getExecutorMemoryStatus()

# Query execution time
import time
start = time.time()
df.count()
print(f"Execution time: {time.time() - start} seconds")
```

## Data Types

### Primitive Types

| Spark SQL Type | Python Type       | SQL Type     | Description                 |
| -------------- | ----------------- | ------------ | --------------------------- |
| ByteType       | int               | TINYINT      | 1-byte signed integer       |
| ShortType      | int               | SMALLINT     | 2-byte signed integer       |
| IntegerType    | int               | INT          | 4-byte signed integer       |
| LongType       | int               | BIGINT       | 8-byte signed integer       |
| FloatType      | float             | FLOAT        | 4-byte floating point       |
| DoubleType     | float             | DOUBLE       | 8-byte floating point       |
| DecimalType    | decimal.Decimal   | DECIMAL(p,s) | Arbitrary precision decimal |
| StringType     | str               | STRING       | Character string            |
| BinaryType     | bytearray         | BINARY       | Binary data                 |
| BooleanType    | bool              | BOOLEAN      | True/False                  |
| DateType       | datetime.date     | DATE         | Date without time           |
| TimestampType  | datetime.datetime | TIMESTAMP    | Date and time               |

### Complex Types

| Type       | Description        | Example                      |
| ---------- | ------------------ | ---------------------------- |
| ArrayType  | Ordered collection | [1, 2, 3]                    |
| MapType    | Key-value pairs    | {"key1": "value1"}           |
| StructType | Named fields       | {"name": "Alice", "age": 25} |

### Type Conversion

```python
from pyspark.sql.types import *

# Define schema
schema = StructType([
    StructField("id", IntegerType(), False),
    StructField("name", StringType(), True),
    StructField("age", IntegerType(), True),
    StructField("salary", DecimalType(10, 2), True),
    StructField("tags", ArrayType(StringType()), True),
    StructField("address", StructType([
        StructField("street", StringType()),
        StructField("city", StringType())
    ]), True)
])

# Create DataFrame with schema
df = spark.createDataFrame(data, schema)

# Cast types
df.select(
    col("age").cast("string"),
    col("salary").cast(DoubleType()),
    col("id").cast("long")
).show()
```

## Common Operations

### Joins

```python
# Inner join
df1.join(df2, "id")
df1.join(df2, df1.id == df2.id)

# Left outer join
df1.join(df2, "id", "left")
df1.join(df2, "id", "left_outer")

# Right outer join
df1.join(df2, "id", "right")

# Full outer join
df1.join(df2, "id", "outer")
df1.join(df2, "id", "full")

# Left semi join (IN subquery)
df1.join(df2, "id", "left_semi")

# Left anti join (NOT IN subquery)
df1.join(df2, "id", "left_anti")

# Cross join (cartesian product)
df1.crossJoin(df2)

# Multiple join conditions
df1.join(df2, (df1.id == df2.id) & (df1.date == df2.date))

# Broadcast join
df1.join(broadcast(df2), "id")
```

### Aggregations

```python
# Group by with aggregations
df.groupBy("department").agg(
    F.count("*").alias("count"),
    F.sum("salary").alias("total_salary"),
    F.avg("salary").alias("avg_salary"),
    F.min("salary").alias("min_salary"),
    F.max("salary").alias("max_salary")
).show()

# Multiple aggregations
df.groupBy("department", "location").agg(
    {"salary": "avg", "age": "max"}
).show()

# Rollup (hierarchical aggregation)
df.rollup("country", "city").agg(
    F.sum("amount").alias("total")
).show()

# Cube (all combinations)
df.cube("year", "quarter").agg(
    F.sum("revenue").alias("total_revenue")
).show()

# Pivot
df.groupBy("year").pivot("category").sum("amount").show()
```

### Set Operations

```python
# Union
df1.union(df2)
df1.unionAll(df2)  # Deprecated, use union()
df1.unionByName(df2)  # Match by column names

# Intersection
df1.intersect(df2)
df1.intersectAll(df2)  # Include duplicates

# Difference (EXCEPT)
df1.subtract(df2)
df1.exceptAll(df2)  # Include duplicates

# Distinct
df.distinct()
df.dropDuplicates()
df.dropDuplicates(["id", "date"])
```

## Best Practices

### 1. Choose the Right File Format

```python
# ✅ Use Parquet for analytics workloads
df.write.parquet("data.parquet")

# Parquet benefits:
# - Columnar storage (efficient for column-heavy queries)
# - Built-in compression
# - Predicate pushdown
# - Schema evolution support

# ✅ Use ORC for Hive compatibility
df.write.orc("data.orc")

# ✅ Use Delta Lake for ACID transactions
df.write.format("delta").save("delta_table")

# ❌ Avoid CSV/JSON for large datasets
# - No compression by default
# - Text-based (larger size)
# - No predicate pushdown
# - Schema inference overhead
```

### 2. Optimize Partitioning

```python
# ✅ Partition by commonly filtered columns
df.write.partitionBy("date", "region").parquet("data")

# Guidelines:
# - Partition column should have low to medium cardinality
# - Avoid over-partitioning (< 1GB per partition)
# - Partition on columns used in WHERE clauses

# ❌ Don't partition by high cardinality columns
df.write.partitionBy("user_id").parquet("data")  # Bad if millions of users
```

### 3. Use Broadcast Joins Wisely

```python
# ✅ Broadcast small dimension tables (< 10MB by default)
from pyspark.sql.functions import broadcast

result = large_fact_table.join(
    broadcast(small_dimension_table),
    "dimension_id"
)

# ❌ Don't broadcast large tables
# This will cause OOM errors
```

### 4. Cache Strategically

```python
# ✅ Cache DataFrames used multiple times
df = spark.read.parquet("large_dataset")
df.cache()

result1 = df.filter("age > 30").count()
result2 = df.filter("age < 20").count()

# ✅ Unpersist when done
df.unpersist()

# ❌ Don't cache everything
# Only cache data that's reused
```

### 5. Avoid Shuffles When Possible

```python
# ✅ Filter before joining
df1.filter("date >= '2024-01-01'").join(df2, "id")

# ✅ Use broadcast joins for small tables
df1.join(broadcast(df2), "id")

# ❌ Avoid unnecessary repartitioning
df.repartition(1000).repartition(100)  # Wasteful
```

### 6. Use Built-in Functions Over UDFs

```python
# ❌ UDF (slower, cannot be optimized)
from pyspark.sql.functions import udf
upper_udf = udf(lambda x: x.upper())
df.select(upper_udf("name"))

# ✅ Built-in function (optimized by Catalyst)
df.select(F.upper("name"))

# If UDF is necessary, use Pandas UDF (vectorized)
from pyspark.sql.functions import pandas_udf

@pandas_udf("string")
def pandas_upper(s: pd.Series) -> pd.Series:
    return s.str.upper()

df.select(pandas_upper("name"))
```

### 7. Handle Skewed Data

```python
# Detect skew
df.groupBy("key").count().orderBy("count", ascending=False).show()

# ✅ Enable AQE for skew joins
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# ✅ Salt keys for skewed joins
from pyspark.sql.functions import concat, lit, rand

df_salted = df.withColumn("salted_key", concat("key", lit("_"), (rand() * 10).cast("int")))

# ✅ Use broadcast join if dimension is small
result = large_df.join(broadcast(small_df), "key")
```

## Spark SQL vs Other Systems

| Feature            | Spark SQL                   | Hive                   | Presto                | PostgreSQL              |
| ------------------ | --------------------------- | ---------------------- | --------------------- | ----------------------- |
| **Execution**      | In-memory distributed       | MapReduce/Tez          | In-memory distributed | Single-node RDBMS       |
| **Latency**        | Seconds to minutes          | Minutes to hours       | Sub-second to seconds | Milliseconds            |
| **Scalability**    | Petabytes                   | Petabytes              | Petabytes             | Terabytes               |
| **SQL Standard**   | ANSI SQL:2003               | HiveQL (SQL-like)      | ANSI SQL              | Full ANSI SQL           |
| **ACID**           | With Delta/Iceberg          | With ORC/Parquet v2    | No                    | Yes                     |
| **Streaming**      | Yes (Structured Streaming)  | No                     | No                    | Limited                 |
| **ML Integration** | MLlib                       | External               | External              | Extensions              |
| **Best For**       | Batch + streaming analytics | Large batch processing | Interactive queries   | Transactional workloads |

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="spark" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Traditional RDBMS comparison
- [MySQL](/databases/mysql/) - Another RDBMS perspective
- [Window Functions](/concepts/window-functions/) - Advanced analytics
- [Joins](/concepts/joins/) - Join patterns and optimization

## Resources

- [Official Documentation](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [Spark SQL API](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql.html)
- [Databricks Academy](https://academy.databricks.com/) - Free Spark training
- [The Internals of Spark SQL](https://books.japila.pl/spark-sql-internals/) - Deep dive
- [Delta Lake](https://delta.io/) - ACID transactions for Spark
- [Apache Iceberg](https://iceberg.apache.org/) - Table format for big data
- [Spark Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)
