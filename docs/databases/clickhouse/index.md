---
title: ClickHouse
description: >-
  Comprehensive guide to ClickHouse - Column-oriented OLAP database for
  real-time analytics at scale
difficulty: intermediate
tags:
  - databases
  - clickhouse
  - analytics
  - olap
  - columnar
  - realtime
---

# ClickHouse

## Overview

ClickHouse is an open-source, column-oriented database management system (DBMS) built for online analytical processing (OLAP). It is designed to run analytical queries over very large datasets - often billions or trillions of rows - and return results in milliseconds. ClickHouse achieves this through columnar storage, vectorized query execution, aggressive data compression, and a sparse primary index that lets it skip over data it does not need to read.

It is widely used for real-time analytics, observability and log storage, time-series workloads, and as the engine behind user-facing dashboards where low query latency on large data is the priority.

### Key Features

- **Columnar Storage**: Data is stored by column, so queries read only the columns they touch
- **Vectorized Execution**: Processes data in batches (blocks) rather than row-by-row
- **High Compression**: Per-column codecs (LZ4, ZSTD, Delta, DoubleDelta, Gorilla) shrink storage and I/O
- **MergeTree Engine Family**: Sorted, partitioned storage with background merges and a sparse primary index
- **Real-Time Inserts**: Sustains high-throughput batched inserts while serving queries
- **Materialized Views**: Incrementally transform and pre-aggregate data on insert
- **Distributed Queries**: Sharding and replication for horizontal scale and high availability
- **SQL Support**: Familiar SQL with powerful extensions for arrays, aggregation, and approximation
- **Pluggable Table Engines**: Storage and integration engines for Kafka, S3, PostgreSQL, MySQL, and more
- **Dictionaries**: In-memory key-value lookups for fast joins and enrichment
- **TTL and Tiered Storage**: Automatic data expiry and movement between hot and cold volumes
- **Approximate Functions**: Fast `uniq`, quantiles, and sampling for interactive analytics

## Getting Started

### Installation

::: code-group

```bash [Linux]
# Quick install script (Linux / macOS)
curl https://clickhouse.com/ | sh

# Start a local server
./clickhouse server

# Or run client + embedded server (clickhouse-local)
./clickhouse local

# Debian / Ubuntu (APT)
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -fsSL 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key' | sudo gpg --dearmor -o /usr/share/keyrings/clickhouse-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/clickhouse-keyring.gpg] https://packages.clickhouse.com/deb stable main" | sudo tee /etc/apt/sources.list.d/clickhouse.list
sudo apt-get update
sudo apt-get install -y clickhouse-server clickhouse-client
sudo clickhouse start
```

```bash [Docker]
# Run server
docker run -d --name clickhouse-server \
  -p 8123:8123 -p 9000:9000 \
  --ulimit nofile=262144:262144 \
  clickhouse/clickhouse-server

# Connect with the client
docker exec -it clickhouse-server clickhouse-client
```

```bash [macOS]
# Homebrew
brew install clickhouse

# Run server
clickhouse server

# In another terminal
clickhouse client
```

:::

### Connecting

ClickHouse exposes a native TCP protocol (port 9000) and an HTTP interface (port 8123).

::: code-group

```bash [CLI]
# Connect to local server
clickhouse client

# Connect to a remote host
clickhouse client --host clickhouse.example.com --port 9000 \
  --user analyst --password --database analytics

# Run a query directly
clickhouse client --query "SELECT version()"

# Run a query and stream a file in
clickhouse client --query "INSERT INTO events FORMAT CSV" < events.csv

# Output a different format
clickhouse client --query "SELECT * FROM events LIMIT 10 FORMAT JSONEachRow"
```

```bash [HTTP]
# Simple query over HTTP
curl 'http://localhost:8123/?query=SELECT%20version()'

# POST a query
echo 'SELECT count() FROM events' | curl 'http://localhost:8123/' --data-binary @-

# With auth and database
curl 'http://localhost:8123/?database=analytics' \
  -H 'X-ClickHouse-User: analyst' \
  -H 'X-ClickHouse-Key: secret' \
  --data-binary 'SELECT now()'
```

```python [Python]
# pip install clickhouse-connect
import clickhouse_connect

client = clickhouse_connect.get_client(
    host='localhost',
    port=8123,
    username='default',
    password='',
    database='analytics'
)

# Query to rows
result = client.query('SELECT count() FROM events')
print(result.result_rows)

# Query to a pandas DataFrame
df = client.query_df('SELECT event_type, count() FROM events GROUP BY event_type')

# Insert rows
client.insert(
    'events',
    [[1, 'click', '2024-01-15 10:00:00']],
    column_names=['id', 'event_type', 'event_time']
)
```

```go [Go]
// go get github.com/ClickHouse/clickhouse-go/v2
import (
    "context"
    "github.com/ClickHouse/clickhouse-go/v2"
)

conn, err := clickhouse.Open(&clickhouse.Options{
    Addr: []string{"localhost:9000"},
    Auth: clickhouse.Auth{
        Database: "analytics",
        Username: "default",
        Password: "",
    },
})

rows, err := conn.Query(context.Background(),
    "SELECT event_type, count() FROM events GROUP BY event_type")
```

:::

## ClickHouse-Specific Features

### The MergeTree Engine

`MergeTree` is the core engine for most tables. Data is stored sorted by the `ORDER BY` key, split into parts, and merged in the background. The `ORDER BY` key also doubles as a sparse primary index that lets ClickHouse skip large ranges of data.

```sql
CREATE TABLE events
(
    event_time   DateTime,
    event_type   LowCardinality(String),
    user_id      UInt64,
    url          String,
    duration_ms  UInt32
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)   -- one part group per month
ORDER BY (event_type, event_time)   -- sort + sparse primary index
TTL event_time + INTERVAL 90 DAY;   -- auto-expire old data

-- Insert in batches (ClickHouse prefers large batched inserts)
INSERT INTO events VALUES
    ('2024-01-15 10:00:00', 'click', 101, '/home', 120),
    ('2024-01-15 10:00:05', 'view',  101, '/pricing', 800);

-- Range queries on the ORDER BY key skip irrelevant parts
SELECT event_type, count(), avg(duration_ms)
FROM events
WHERE event_type = 'click'
  AND event_time >= '2024-01-01'
GROUP BY event_type;
```

### Specialized MergeTree Variants

The MergeTree family includes engines that collapse or aggregate rows during background merges.

```sql
-- ReplacingMergeTree: keep the latest version of a row by sort key
CREATE TABLE user_profiles
(
    user_id    UInt64,
    name       String,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)   -- version column
ORDER BY user_id;

-- Deduplication happens on merge; FINAL forces it at query time
SELECT * FROM user_profiles FINAL;

-- SummingMergeTree: sum numeric columns sharing the same sort key
CREATE TABLE daily_totals
(
    day     Date,
    metric  String,
    value   UInt64
)
ENGINE = SummingMergeTree
ORDER BY (day, metric);

-- AggregatingMergeTree: store partial aggregate states
CREATE TABLE user_stats
(
    user_id    UInt64,
    visits     AggregateFunction(count, UInt64),
    unique_ips AggregateFunction(uniq, String)
)
ENGINE = AggregatingMergeTree
ORDER BY user_id;
```

### Materialized Views

Materialized views in ClickHouse are insert triggers: when rows land in the source table, the view's `SELECT` runs on that block and writes the result to a target table. This is the standard way to pre-aggregate data.

```sql
-- Target table holding aggregate states
CREATE TABLE events_per_hour
(
    hour       DateTime,
    event_type LowCardinality(String),
    events     AggregateFunction(count, UInt64),
    users      AggregateFunction(uniq, UInt64)
)
ENGINE = AggregatingMergeTree
ORDER BY (hour, event_type);

-- Materialized view that feeds the target on every insert into events
CREATE MATERIALIZED VIEW events_per_hour_mv TO events_per_hour AS
SELECT
    toStartOfHour(event_time) AS hour,
    event_type,
    countState()             AS events,
    uniqState(user_id)       AS users
FROM events
GROUP BY hour, event_type;

-- Read final values by merging the stored states
SELECT
    hour,
    event_type,
    countMerge(events) AS events,
    uniqMerge(users)   AS users
FROM events_per_hour
GROUP BY hour, event_type
ORDER BY hour;
```

### Arrays and Nested Data

ClickHouse has rich array support, including `ARRAY JOIN` to expand arrays into rows.

```sql
-- Array columns
CREATE TABLE sessions
(
    session_id UInt64,
    pages      Array(String),
    durations  Array(UInt32)
)
ENGINE = MergeTree ORDER BY session_id;

INSERT INTO sessions VALUES
    (1, ['/home', '/pricing', '/signup'], [120, 800, 300]);

-- Array functions
SELECT
    session_id,
    length(pages)                 AS page_count,
    arraySum(durations)           AS total_ms,
    arrayFilter(d -> d > 200, durations) AS long_views
FROM sessions;

-- ARRAY JOIN: one row per array element
SELECT session_id, page, duration
FROM sessions
ARRAY JOIN pages AS page, durations AS duration;
```

### Table Functions and Integrations

Query external systems and files directly with table functions, or attach them as table engines.

```sql
-- Query a file on S3 directly
SELECT count()
FROM s3('https://bucket.s3.amazonaws.com/data/*.parquet', 'Parquet');

-- Query a remote ClickHouse cluster
SELECT * FROM remote('host:9000', 'analytics.events', 'user', 'password') LIMIT 10;

-- Read from PostgreSQL
SELECT * FROM postgresql('pg:5432', 'mydb', 'customers', 'user', 'password');

-- Ingest from a URL
INSERT INTO events
SELECT * FROM url('https://example.com/events.csv', 'CSV',
    'event_time DateTime, event_type String, user_id UInt64');

-- Stream from Kafka via a table engine
CREATE TABLE kafka_events
(
    event_time DateTime,
    event_type String,
    user_id    UInt64
)
ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'kafka:9092',
    kafka_topic_list = 'events',
    kafka_group_name = 'clickhouse',
    kafka_format = 'JSONEachRow';
```

### Dictionaries

Dictionaries hold key-value data in memory for fast lookups and joins.

```sql
CREATE DICTIONARY country_names
(
    country_code String,
    country_name String
)
PRIMARY KEY country_code
SOURCE(HTTP(url 'https://example.com/countries.csv' format 'CSV'))
LAYOUT(HASHED())
LIFETIME(3600);

-- Use it in queries
SELECT
    user_id,
    dictGet('country_names', 'country_name', country_code) AS country
FROM users;
```

## Data Types

### Numeric Types

| Type                  | Description                          |
| --------------------- | ------------------------------------ |
| Int8 / Int16 / Int32 / Int64 / Int128 / Int256 | Signed integers of fixed width |
| UInt8 / UInt16 / UInt32 / UInt64 / UInt256 | Unsigned integers |
| Float32 / Float64     | Floating point                       |
| Decimal(P, S)         | Fixed-precision decimal              |
| Bool                  | Boolean (stored as UInt8)            |

### String and Special Types

| Type                    | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| String                  | Variable-length string (no length limit)             |
| FixedString(N)          | Fixed-length byte string                             |
| LowCardinality(String)  | Dictionary-encoded string for low-cardinality values |
| UUID                    | 128-bit universally unique identifier                |
| Enum8 / Enum16          | Named integer enumeration                            |

### Date/Time Types

| Type            | Description                                |
| --------------- | ------------------------------------------ |
| Date            | Days since epoch (2 bytes)                 |
| Date32          | Extended date range (4 bytes)              |
| DateTime        | Seconds precision, optional timezone       |
| DateTime64(P)   | Sub-second precision (up to nanoseconds)   |

### Composite Types

| Type                | Description                          |
| ------------------- | ------------------------------------ |
| Array(T)            | Ordered collection of one type       |
| Tuple(T1, T2, ...)  | Fixed group of typed fields          |
| Map(K, V)           | Key-value pairs                      |
| Nested              | Repeated group of named columns      |
| Nullable(T)         | Allows NULL (with storage overhead)  |

## Common Operations

### Table Management

```sql
-- Create a database
CREATE DATABASE analytics;

-- Create a table
CREATE TABLE analytics.orders
(
    order_id   UInt64,
    customer_id UInt64,
    amount     Decimal(12, 2),
    status     LowCardinality(String),
    created_at DateTime
)
ENGINE = MergeTree
ORDER BY (created_at, order_id);

-- Add / drop / modify columns
ALTER TABLE analytics.orders ADD COLUMN currency LowCardinality(String) DEFAULT 'USD';
ALTER TABLE analytics.orders MODIFY COLUMN amount Decimal(14, 2);
ALTER TABLE analytics.orders DROP COLUMN currency;

-- Inspect a table
DESCRIBE TABLE analytics.orders;
SHOW CREATE TABLE analytics.orders;

-- Drop / truncate
TRUNCATE TABLE analytics.orders;
DROP TABLE IF EXISTS analytics.orders;
```

### Querying

```sql
-- Aggregation with GROUP BY
SELECT
    status,
    count()        AS orders,
    sum(amount)    AS revenue,
    avg(amount)    AS avg_order
FROM orders
WHERE created_at >= today() - 30
GROUP BY status
ORDER BY revenue DESC;

-- WITH ROLLUP / WITH TOTALS
SELECT status, sum(amount) AS revenue
FROM orders
GROUP BY status WITH TOTALS;

-- Approximate distinct counts (fast)
SELECT uniq(customer_id) AS approx_customers FROM orders;
SELECT uniqExact(customer_id) AS exact_customers FROM orders;

-- Quantiles
SELECT
    quantile(0.5)(amount)  AS median,
    quantile(0.95)(amount) AS p95
FROM orders;

-- Conditional aggregation with -If combinators
SELECT
    countIf(status = 'shipped')   AS shipped,
    sumIf(amount, status = 'paid') AS paid_revenue
FROM orders;

-- Sampling for interactive queries
SELECT avg(amount) FROM orders SAMPLE 0.1;
```

### Data Manipulation

ClickHouse is optimized for inserts and reads. Updates and deletes are asynchronous "mutations" and should be used sparingly.

```sql
-- Batched insert (preferred)
INSERT INTO orders (order_id, customer_id, amount, status, created_at) VALUES
    (1, 101, 49.99, 'paid', now()),
    (2, 102, 19.50, 'paid', now());

-- Insert from a SELECT
INSERT INTO orders_archive SELECT * FROM orders WHERE created_at < '2023-01-01';

-- Mutations (asynchronous, rewrite parts in the background)
ALTER TABLE orders UPDATE status = 'refunded' WHERE order_id = 1;
ALTER TABLE orders DELETE WHERE created_at < '2022-01-01';

-- Lightweight delete (faster for some workloads)
DELETE FROM orders WHERE order_id = 2;
```

## Performance Optimization

### Best Practices

```sql
-- 1. Choose an ORDER BY key matching your most common filters
--    Put low-cardinality, frequently-filtered columns first
CREATE TABLE metrics
(
    metric_name LowCardinality(String),
    ts          DateTime,
    value       Float64
)
ENGINE = MergeTree
ORDER BY (metric_name, ts);

-- 2. Use LowCardinality for repetitive strings (status, country, type)
-- 3. Partition by time for easy expiry and pruning, but avoid over-partitioning
--    (aim for partitions in the GB range, not thousands of tiny parts)

-- 4. Insert in large batches, not row-by-row
--    Many small inserts create many parts and slow down merges

-- 5. Add data-skipping indexes for secondary filters
ALTER TABLE metrics
ADD INDEX idx_value value TYPE minmax GRANULARITY 4;

-- 6. Use PREWHERE (or let ClickHouse choose it) to filter before reading columns
SELECT metric_name, value
FROM metrics
PREWHERE metric_name = 'cpu'
WHERE value > 90;

-- 7. Inspect query execution
EXPLAIN PLAN
SELECT count() FROM metrics WHERE metric_name = 'cpu';

EXPLAIN PIPELINE
SELECT count() FROM metrics WHERE metric_name = 'cpu';
```

### Compression Codecs

```sql
-- Per-column codecs reduce storage and I/O
CREATE TABLE timeseries
(
    ts     DateTime CODEC(DoubleDelta, ZSTD),  -- great for monotonic timestamps
    sensor LowCardinality(String),
    value  Float64  CODEC(Gorilla, ZSTD)        -- great for slowly changing floats
)
ENGINE = MergeTree
ORDER BY (sensor, ts);
```

## Security and Access Control

```sql
-- Create a user
CREATE USER analyst IDENTIFIED WITH sha256_password BY 'strong-password';

-- Roles and grants
CREATE ROLE readonly;
GRANT SELECT ON analytics.* TO readonly;
GRANT readonly TO analyst;

-- Row-level security via row policies
CREATE ROW POLICY region_filter ON analytics.orders
    FOR SELECT USING region = 'EU'
    TO analyst;

-- Quotas to limit resource usage
CREATE QUOTA limited
    FOR INTERVAL 1 HOUR MAX queries = 1000, read_rows = 1000000000
    TO analyst;
```

ClickHouse also supports TLS for native and HTTP interfaces, LDAP and Kerberos authentication, and settings constraints to cap per-query memory and execution time.

## ClickHouse vs Other Databases

| Feature              | ClickHouse        | PostgreSQL        | DuckDB            | Snowflake         |
| -------------------- | ----------------- | ----------------- | ----------------- | ----------------- |
| Primary Workload     | OLAP / analytics  | OLTP              | Embedded OLAP     | Cloud OLAP        |
| Storage              | Columnar          | Row-based         | Columnar          | Columnar          |
| Architecture         | Distributed server| Client-server     | In-process        | Cloud service     |
| Query Speed (Analytics) | Very fast      | Medium            | Very fast         | Very fast         |
| Updates / Deletes    | Async mutations   | First-class       | First-class       | Supported         |
| Horizontal Scale     | Sharding + replication | Read replicas / extensions | Single node | Managed scaling |
| Best For             | Large-scale real-time analytics | Transactional apps | Local analytics | Managed warehousing |

## Best Practices

### 1. Model for Reads

Design the `ORDER BY` key and partitioning around the queries you run most. ClickHouse rewards a schema shaped to its access patterns far more than a normalized one.

### 2. Pre-Aggregate with Materialized Views

Push heavy aggregations to insert time with `AggregatingMergeTree` target tables so dashboards read small, pre-computed results.

### 3. Batch Inserts

Buffer rows on the client (or use async inserts) and write in large blocks. Avoid frequent single-row inserts that flood the merge process with tiny parts.

### 4. Avoid Heavy Mutations

Treat data as append-only where possible. For changing data, prefer `ReplacingMergeTree` with a version column over frequent `ALTER ... UPDATE` mutations.

### 5. Use the Right String Type

`LowCardinality(String)` for repetitive values, `String` for free text, and `Enum` when the set of values is fixed and known.

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="clickhouse" :show-model-selector="false" />

## See Also

- [DuckDB](/databases/duckdb/) - In-process analytical database
- [Snowflake](/databases/snowflake/) - Cloud-native data warehouse
- [BigQuery](/databases/bigquery/) - Serverless cloud data warehouse
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [Performance](/concepts/performance/) - Query optimization concepts

## Resources

- [Official Documentation](https://clickhouse.com/docs) - Complete ClickHouse documentation
- [SQL Reference](https://clickhouse.com/docs/sql-reference) - Functions, statements, and data types
- [MergeTree Engine](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree) - Core storage engine guide
- [ClickHouse Blog](https://clickhouse.com/blog) - Features, benchmarks, and use cases
- [GitHub Repository](https://github.com/ClickHouse/ClickHouse) - Source code and issues
- [ClickHouse Academy](https://learn.clickhouse.com/) - Free training courses
