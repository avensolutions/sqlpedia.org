---
title: JSON and Complex Data Types
description: >-
  Comprehensive guide to JSON, arrays, structs, and other complex data types
  across SQL databases
difficulty: intermediate
tags:
  - concepts
  - data-types
  - json
  - jsonb
  - arrays
  - structs
  - nested-data
  - complex-types
---

# JSON and Complex Data Types <Badge type="warning" text="intermediate" />

## Quick Reference

```sql
-- PostgreSQL: JSONB operations
SELECT
    data->>'name' AS name,
    data->'address'->>'city' AS city,
    jsonb_array_elements(data->'skills') AS skills
FROM users
WHERE data @> '{"active": true}';

-- MySQL: JSON operations (8.0+)
SELECT
    JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')) AS name,
    JSON_EXTRACT(data, '$.address.city') AS city
FROM users
WHERE JSON_EXTRACT(data, '$.active') = true;

-- SQL Server: JSON operations
SELECT
    JSON_VALUE(data, '$.name') AS name,
    JSON_VALUE(data, '$.address.city') AS city
FROM users
WHERE JSON_VALUE(data, '$.active') = 'true';

-- BigQuery: STRUCT and ARRAY
SELECT
    user.name,
    user.address.city,
    skill
FROM users,
UNNEST(skills) AS skill
WHERE user.active = true;

-- Snowflake: VARIANT and OBJECT
SELECT
    data:name::STRING AS name,
    data:address.city::STRING AS city,
    skill.value::STRING AS skill
FROM users,
LATERAL FLATTEN(input => data:skills) skill
WHERE data:active::BOOLEAN = true;
```

<SQLAssistant />

## Overview

Modern databases support various complex data types beyond simple integers and strings. These include JSON documents, arrays, nested structures (structs/objects), and maps. Understanding the differences in how databases implement these types is crucial for:

- **Schema design**: Choosing between normalized tables vs. nested data
- **Query performance**: Understanding indexing and query optimization
- **Data migration**: Moving data between different database platforms
- **Application development**: Working with semi-structured data

This guide covers the major approaches to complex data types across popular SQL databases.

## JSON Data Types

### JSON vs JSONB

Different databases implement JSON support in different ways:

| Database | JSON Type | Binary Storage | Indexable | Processing Speed |
|----------|-----------|----------------|-----------|------------------|
| PostgreSQL | `JSON` | No | Limited | Slower |
| PostgreSQL | `JSONB` | Yes | Yes | Faster |
| MySQL | `JSON` | Yes | Yes (virtual columns) | Fast |
| SQL Server | `NVARCHAR` | No | Yes (computed columns) | Medium |
| Oracle | `JSON` | Multiple formats | Yes | Fast |
| SQLite | `TEXT` | No | Via generated columns | Medium |
| BigQuery | `JSON` | Yes | Limited | Fast |
| Snowflake | `VARIANT` | Yes | Yes | Fast |
| Databricks | `STRING` | No | Yes (via functions) | Medium |

**Key Differences:**

- **PostgreSQL JSONB**: Binary format, supports indexing (GIN, GiST), faster operations, automatically deduplicates keys
- **PostgreSQL JSON**: Text format, preserves exact formatting and key order, slower operations
- **MySQL JSON**: Binary format (similar to JSONB), validates on insert, supports indexing via virtual columns
- **SQL Server**: Stores as text (`NVARCHAR`), validates on insert if specified, indexes via computed columns
- **Snowflake VARIANT**: Can store JSON, XML, and other semi-structured data, automatically optimized

### Creating Tables with JSON

::: details PostgreSQL
```sql
-- Using JSON (text-based)
CREATE TABLE events_json (
    id SERIAL PRIMARY KEY,
    event_data JSON
);

-- Using JSONB (binary, recommended)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO events (event_data) VALUES
('{"type": "login", "user_id": 123, "timestamp": "2025-01-15T10:30:00Z"}'),
('{"type": "purchase", "user_id": 123, "amount": 99.99, "items": ["item1", "item2"]}');

-- Create GIN index for better query performance
CREATE INDEX idx_event_data ON events USING GIN (event_data);

-- Partial index for specific queries
CREATE INDEX idx_login_events ON events USING GIN (event_data)
WHERE event_data->>'type' = 'login';
```
:::

::: details MySQL
```sql
-- Create table (MySQL 8.0+)
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO events (event_data) VALUES
('{"type": "login", "user_id": 123, "timestamp": "2025-01-15T10:30:00Z"}'),
('{"type": "purchase", "user_id": 123, "amount": 99.99, "items": ["item1", "item2"]}');

-- Create virtual column for indexing
ALTER TABLE events
ADD COLUMN event_type VARCHAR(50) AS (JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type'))) VIRTUAL,
ADD INDEX idx_event_type (event_type);

-- Multi-valued index for arrays (MySQL 8.0.17+)
CREATE INDEX idx_items ON events ((CAST(event_data->'$.items' AS CHAR(255) ARRAY)));
```
:::

::: details SQL Server
```sql
-- Create table
CREATE TABLE events (
    id INT IDENTITY PRIMARY KEY,
    event_data NVARCHAR(MAX) CHECK (ISJSON(event_data) = 1),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Insert data
INSERT INTO events (event_data) VALUES
(N'{"type": "login", "user_id": 123, "timestamp": "2025-01-15T10:30:00Z"}'),
(N'{"type": "purchase", "user_id": 123, "amount": 99.99, "items": ["item1", "item2"]}');

-- Create computed column for indexing
ALTER TABLE events
ADD event_type AS JSON_VALUE(event_data, '$.type');

CREATE INDEX idx_event_type ON events(event_type);

-- Full-text index on JSON data
CREATE FULLTEXT INDEX ON events(event_data);
```
:::

::: details BigQuery
```sql
-- Create table with JSON type (preview feature)
CREATE TABLE events (
    id INT64,
    event_data JSON,
    created_at TIMESTAMP
);

-- Insert data
INSERT INTO events (id, event_data, created_at) VALUES
(1, JSON '{"type": "login", "user_id": 123, "timestamp": "2025-01-15T10:30:00Z"}', CURRENT_TIMESTAMP()),
(2, JSON '{"type": "purchase", "user_id": 123, "amount": 99.99, "items": ["item1", "item2"]}', CURRENT_TIMESTAMP());

-- Alternative: Parse from string
INSERT INTO events (id, event_data, created_at)
SELECT
    3,
    PARSE_JSON('{"type": "logout", "user_id": 123}'),
    CURRENT_TIMESTAMP();
```
:::

::: details Snowflake
```sql
-- Create table with VARIANT
CREATE TABLE events (
    id INT AUTOINCREMENT,
    event_data VARIANT,
    created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Insert data
INSERT INTO events (event_data)
SELECT PARSE_JSON(column1) FROM VALUES
('{"type": "login", "user_id": 123, "timestamp": "2025-01-15T10:30:00Z"}'),
('{"type": "purchase", "user_id": 123, "amount": 99.99, "items": ["item1", "item2"]}');

-- Snowflake automatically optimizes VARIANT storage
-- No explicit indexing needed for VARIANT columns
```
:::

### Querying JSON Data

#### Extracting Values

::: details PostgreSQL
```sql
-- Extract as text (using ->>)
SELECT
    event_data->>'type' AS event_type,
    event_data->>'user_id' AS user_id_text,
    (event_data->>'user_id')::INTEGER AS user_id_int
FROM events;

-- Extract as JSON (using ->)
SELECT
    event_data->'user_id' AS user_id_json,
    event_data->'items' AS items_json
FROM events;

-- Nested extraction
SELECT
    event_data->'metadata'->>'ip_address' AS ip_address
FROM events;

-- Extract from array
SELECT
    event_data->'items'->0 AS first_item,
    event_data->'items'->>1 AS second_item_text
FROM events;
```
:::

::: details MySQL
```sql
-- Extract values
SELECT
    JSON_EXTRACT(event_data, '$.type') AS event_type,
    JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type')) AS event_type_unquoted,
    event_data->>'$.type' AS event_type_short,  -- MySQL 8.0.21+
    event_data->'$.user_id' AS user_id
FROM events;

-- Nested extraction
SELECT
    JSON_EXTRACT(event_data, '$.metadata.ip_address') AS ip_address,
    event_data->>'$.metadata.ip_address' AS ip_address_short
FROM events;

-- Extract from array
SELECT
    JSON_EXTRACT(event_data, '$.items[0]') AS first_item,
    JSON_EXTRACT(event_data, '$.items[1]') AS second_item
FROM events;
```
:::

::: details SQL Server
```sql
-- Extract values
SELECT
    JSON_VALUE(event_data, '$.type') AS event_type,
    JSON_VALUE(event_data, '$.user_id') AS user_id,
    JSON_VALUE(event_data, '$.metadata.ip_address') AS ip_address
FROM events;

-- Extract objects/arrays (returns JSON)
SELECT
    JSON_QUERY(event_data, '$.items') AS items,
    JSON_QUERY(event_data, '$.metadata') AS metadata
FROM events;
```
:::

::: details BigQuery
```sql
-- Extract values using dot notation
SELECT
    JSON_VALUE(event_data, '$.type') AS event_type,
    JSON_VALUE(event_data, '$.user_id') AS user_id,
    JSON_EXTRACT(event_data, '$.items') AS items,
    JSON_EXTRACT_SCALAR(event_data, '$.type') AS event_type_scalar
FROM events;

-- Array element extraction
SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.items[0]') AS first_item
FROM events;
```
:::

::: details Snowflake
```sql
-- Extract using colon notation
SELECT
    event_data:type::STRING AS event_type,
    event_data:user_id::INTEGER AS user_id,
    event_data:amount::FLOAT AS amount,
    event_data:metadata.ip_address::STRING AS ip_address
FROM events;

-- Array element extraction
SELECT
    event_data:items[0]::STRING AS first_item,
    event_data:items[1]::STRING AS second_item
FROM events;
```
:::

#### Filtering on JSON Fields

::: details PostgreSQL
```sql
-- Simple equality
SELECT * FROM events
WHERE event_data->>'type' = 'login';

-- Numeric comparison
SELECT * FROM events
WHERE (event_data->>'user_id')::INTEGER = 123;

-- Containment operator (@>)
SELECT * FROM events
WHERE event_data @> '{"type": "purchase"}';

-- Existence operator (?)
SELECT * FROM events
WHERE event_data ? 'amount';

-- Any key exists (?|)
SELECT * FROM events
WHERE event_data ?| ARRAY['amount', 'total'];

-- All keys exist (?&)
SELECT * FROM events
WHERE event_data ?& ARRAY['type', 'user_id'];

-- Path-based query
SELECT * FROM events
WHERE event_data @? '$.items[*] ? (@ == "item1")';
```
:::

::: details MySQL
```sql
-- Simple equality
SELECT * FROM events
WHERE JSON_EXTRACT(event_data, '$.type') = 'login';

-- Or using -> operator
SELECT * FROM events
WHERE event_data->>'$.type' = 'login';

-- Numeric comparison
SELECT * FROM events
WHERE JSON_EXTRACT(event_data, '$.user_id') = 123;

-- Array contains
SELECT * FROM events
WHERE JSON_CONTAINS(event_data, '"item1"', '$.items');

-- Key exists
SELECT * FROM events
WHERE JSON_CONTAINS_PATH(event_data, 'one', '$.amount');

-- Multiple keys exist
SELECT * FROM events
WHERE JSON_CONTAINS_PATH(event_data, 'all', '$.type', '$.user_id');
```
:::

::: details SQL Server
```sql
-- Simple equality
SELECT * FROM events
WHERE JSON_VALUE(event_data, '$.type') = 'login';

-- Numeric comparison
SELECT * FROM events
WHERE CAST(JSON_VALUE(event_data, '$.user_id') AS INT) = 123;

-- Check if key exists
SELECT * FROM events
WHERE ISJSON(event_data, SCALAR) = 1
  AND JSON_VALUE(event_data, '$.amount') IS NOT NULL;

-- Using OPENJSON for complex filtering
SELECT e.*
FROM events e
CROSS APPLY OPENJSON(e.event_data) WITH (
    type VARCHAR(50) '$.type',
    user_id INT '$.user_id'
) AS j
WHERE j.type = 'purchase' AND j.user_id = 123;
```
:::

::: details Snowflake
```sql
-- Simple equality
SELECT * FROM events
WHERE event_data:type::STRING = 'login';

-- Numeric comparison
SELECT * FROM events
WHERE event_data:user_id::INTEGER = 123;

-- Check if key exists
SELECT * FROM events
WHERE event_data:amount IS NOT NULL;

-- Array contains (using ARRAY_CONTAINS)
SELECT * FROM events
WHERE ARRAY_CONTAINS('item1'::VARIANT, event_data:items);
```
:::

### JSON Functions and Operators

#### Comparison Table

| Operation | PostgreSQL | MySQL | SQL Server | BigQuery | Snowflake |
|-----------|------------|-------|------------|----------|-----------|
| Extract as JSON | `->` | `->` | `JSON_QUERY()` | `JSON_EXTRACT()` | `:` |
| Extract as text | `->>` | `->>` | `JSON_VALUE()` | `JSON_VALUE()` | `::`cast |
| Containment | `@>`, `<@` | `JSON_CONTAINS()` | N/A | N/A | N/A |
| Key exists | `?`, `?|`, `?&` | `JSON_CONTAINS_PATH()` | `JSON_VALUE() IS NOT NULL` | `JSON_VALUE() IS NOT NULL` | `IS NOT NULL` |
| Array length | `jsonb_array_length()` | `JSON_LENGTH()` | `JSON_VALUE()` with `$.size()` | `ARRAY_LENGTH()` | `ARRAY_SIZE()` |
| Array expand | `jsonb_array_elements()` | `JSON_TABLE()` | `OPENJSON()` | `UNNEST()` | `FLATTEN()` |
| Build JSON | `jsonb_build_object()` | `JSON_OBJECT()` | `FOR JSON` | `TO_JSON_STRING()` | `OBJECT_CONSTRUCT()` |
| Build array | `jsonb_build_array()` | `JSON_ARRAY()` | `FOR JSON` | `TO_JSON_STRING()` | `ARRAY_CONSTRUCT()` |
| Merge/Concat | `||` | `JSON_MERGE_PATCH()` | `JSON_MODIFY()` | N/A | `OBJECT_INSERT()` |
| Path query | `@?`, `@@` | `JSON_SEARCH()` | `OPENJSON()` | `JSON_QUERY()` | Path notation |

#### Building JSON from Data

::: details PostgreSQL
```sql
-- Build JSON object
SELECT jsonb_build_object(
    'user_id', user_id,
    'username', username,
    'email', email
) AS user_json
FROM users;

-- Build JSON array
SELECT jsonb_build_array(1, 2, 3, 'four') AS numbers;

-- Aggregate to JSON array
SELECT jsonb_agg(username) AS usernames
FROM users;

-- Aggregate to JSON object
SELECT jsonb_object_agg(username, email) AS user_emails
FROM users;

-- Convert row to JSON
SELECT row_to_json(users.*) AS user_json
FROM users;

-- Complex nested structure
SELECT jsonb_build_object(
    'user', jsonb_build_object(
        'id', u.user_id,
        'name', u.username
    ),
    'orders', (
        SELECT jsonb_agg(jsonb_build_object(
            'order_id', o.order_id,
            'total', o.total
        ))
        FROM orders o
        WHERE o.user_id = u.user_id
    )
) AS user_with_orders
FROM users u;
```
:::

::: details MySQL
```sql
-- Build JSON object
SELECT JSON_OBJECT(
    'user_id', user_id,
    'username', username,
    'email', email
) AS user_json
FROM users;

-- Build JSON array
SELECT JSON_ARRAY(1, 2, 3, 'four') AS numbers;

-- Aggregate to JSON array
SELECT JSON_ARRAYAGG(username) AS usernames
FROM users;

-- Aggregate to JSON object
SELECT JSON_OBJECTAGG(username, email) AS user_emails
FROM users;

-- Complex nested structure (MySQL 8.0+)
SELECT JSON_OBJECT(
    'user', JSON_OBJECT(
        'id', u.user_id,
        'name', u.username
    ),
    'orders', (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'order_id', o.order_id,
            'total', o.total
        ))
        FROM orders o
        WHERE o.user_id = u.user_id
    )
) AS user_with_orders
FROM users u;
```
:::

::: details SQL Server
```sql
-- Build JSON using FOR JSON
SELECT
    user_id,
    username,
    email
FROM users
FOR JSON PATH;

-- With custom root
SELECT
    user_id AS 'user.id',
    username AS 'user.name',
    email AS 'user.email'
FROM users
FOR JSON PATH;

-- Include null values
SELECT user_id, username, email
FROM users
FOR JSON PATH, INCLUDE_NULL_VALUES;

-- Nested structure with subquery
SELECT
    u.user_id,
    u.username,
    (
        SELECT order_id, total
        FROM orders o
        WHERE o.user_id = u.user_id
        FOR JSON PATH
    ) AS orders
FROM users u
FOR JSON PATH;

-- Without array wrapper
SELECT user_id, username
FROM users
WHERE user_id = 1
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
```
:::

::: details BigQuery
```sql
-- Build JSON object
SELECT TO_JSON_STRING(STRUCT(
    user_id,
    username,
    email
)) AS user_json
FROM users;

-- Build from specific fields
SELECT TO_JSON_STRING(STRUCT(
    user_id AS id,
    username AS name
)) AS user_json
FROM users;

-- Aggregate to array
SELECT TO_JSON_STRING(ARRAY_AGG(username)) AS usernames
FROM users;

-- Complex nested structure
SELECT TO_JSON_STRING(STRUCT(
    user_id,
    username,
    ARRAY(
        SELECT STRUCT(order_id, total)
        FROM orders o
        WHERE o.user_id = u.user_id
    ) AS orders
)) AS user_with_orders
FROM users u;
```
:::

::: details Snowflake
```sql
-- Build JSON object
SELECT OBJECT_CONSTRUCT(
    'user_id', user_id,
    'username', username,
    'email', email
) AS user_json
FROM users;

-- Build JSON array
SELECT ARRAY_CONSTRUCT(1, 2, 3, 'four') AS numbers;

-- Aggregate to JSON array
SELECT ARRAY_AGG(username) AS usernames
FROM users;

-- Aggregate to JSON object
SELECT OBJECT_AGG(username, email) AS user_emails
FROM users;

-- Complex nested structure
SELECT OBJECT_CONSTRUCT(
    'user', OBJECT_CONSTRUCT(
        'id', u.user_id,
        'name', u.username
    ),
    'orders', ARRAY_AGG(OBJECT_CONSTRUCT(
        'order_id', o.order_id,
        'total', o.total
    ))
) AS user_with_orders
FROM users u
JOIN orders o ON o.user_id = u.user_id
GROUP BY u.user_id, u.username;
```
:::

## Array Types

### Array Support by Database

| Database | Native Arrays | Syntax | Max Dimensions | Notes |
|----------|---------------|--------|----------------|-------|
| PostgreSQL | ✅ Yes | `INTEGER[]`, `TEXT[]` | Unlimited | Full array support |
| MySQL | ❌ No | Use JSON arrays | N/A | Arrays via JSON type |
| SQL Server | ❌ No | Use JSON/XML | N/A | Arrays via JSON or XML |
| Oracle | ✅ Yes | `VARRAY`, `NESTED TABLE` | 1 (VARRAY) | Requires type definition |
| SQLite | ❌ No | Use JSON/TEXT | N/A | Arrays via JSON or delimited text |
| BigQuery | ✅ Yes | `ARRAY<INT64>` | 1 | Full array support |
| Snowflake | ✅ Yes | `ARRAY` | Nested | Arrays within VARIANT |
| Databricks | ✅ Yes | `ARRAY<INT>` | Nested | Full array support |
| DuckDB | ✅ Yes | `INTEGER[]` | Nested | PostgreSQL-compatible |

### Working with Arrays

::: details PostgreSQL
```sql
-- Create table with arrays
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT,
    tags TEXT[],
    prices NUMERIC[],
    dimensions INTEGER[][]  -- Multi-dimensional
);

-- Insert arrays
INSERT INTO products (name, tags, prices) VALUES
('Widget', ARRAY['gadget', 'useful'], ARRAY[9.99, 14.99, 19.99]),
('Gizmo', '{"tool", "premium"}', '{29.99, 39.99}');  -- Alternative syntax

-- Query arrays
SELECT
    name,
    tags[1] AS first_tag,           -- 1-indexed
    array_length(tags, 1) AS tag_count,
    array_upper(tags, 1) AS max_index
FROM products;

-- Expand array to rows
SELECT
    name,
    unnest(tags) AS tag
FROM products;

-- Filter by array contents
SELECT * FROM products
WHERE 'gadget' = ANY(tags);

SELECT * FROM products
WHERE tags @> ARRAY['useful'];  -- Contains

SELECT * FROM products
WHERE tags && ARRAY['premium', 'gadget'];  -- Overlaps

-- Array aggregation
SELECT array_agg(name) AS product_names
FROM products;

-- Array operations
SELECT
    tags || ARRAY['new_tag'] AS tags_with_new,
    array_cat(tags, ARRAY['tag1', 'tag2']) AS concatenated,
    array_prepend('first', tags) AS with_prepended
FROM products;
```
:::

::: details MySQL (using JSON arrays)
```sql
-- Create table with JSON arrays
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    tags JSON,
    prices JSON
);

-- Insert arrays
INSERT INTO products (name, tags, prices) VALUES
('Widget', JSON_ARRAY('gadget', 'useful'), JSON_ARRAY(9.99, 14.99, 19.99)),
('Gizmo', '["tool", "premium"]', '[29.99, 39.99]');

-- Query arrays
SELECT
    name,
    JSON_EXTRACT(tags, '$[0]') AS first_tag,
    JSON_LENGTH(tags) AS tag_count
FROM products;

-- Expand array to rows (MySQL 8.0+)
SELECT
    p.name,
    j.tag
FROM products p,
JSON_TABLE(
    p.tags,
    '$[*]' COLUMNS(tag VARCHAR(50) PATH '$')
) AS j;

-- Filter by array contents
SELECT * FROM products
WHERE JSON_CONTAINS(tags, '"gadget"');

SELECT * FROM products
WHERE JSON_OVERLAPS(tags, JSON_ARRAY('premium', 'gadget'));

-- Array aggregation
SELECT JSON_ARRAYAGG(name) AS product_names
FROM products;
```
:::

::: details BigQuery
```sql
-- Create table with arrays
CREATE TABLE products (
    id INT64,
    name STRING,
    tags ARRAY<STRING>,
    prices ARRAY<FLOAT64>
);

-- Insert arrays
INSERT INTO products (id, name, tags, prices) VALUES
(1, 'Widget', ['gadget', 'useful'], [9.99, 14.99, 19.99]),
(2, 'Gizmo', ['tool', 'premium'], [29.99, 39.99]);

-- Query arrays
SELECT
    name,
    tags[OFFSET(0)] AS first_tag,  -- 0-indexed with OFFSET
    tags[SAFE_OFFSET(0)] AS first_tag_safe,  -- Returns NULL if out of bounds
    ARRAY_LENGTH(tags) AS tag_count
FROM products;

-- Expand array to rows
SELECT
    name,
    tag
FROM products,
UNNEST(tags) AS tag;

-- Or using CROSS JOIN
SELECT
    p.name,
    t AS tag
FROM products p
CROSS JOIN UNNEST(p.tags) AS t;

-- Filter by array contents
SELECT * FROM products
WHERE 'gadget' IN UNNEST(tags);

SELECT * FROM products
WHERE EXISTS(SELECT 1 FROM UNNEST(tags) AS t WHERE t = 'gadget');

-- Array aggregation
SELECT ARRAY_AGG(name) AS product_names
FROM products;

-- Array operations
SELECT
    ARRAY_CONCAT(tags, ['new_tag']) AS tags_with_new,
    ARRAY_REVERSE(tags) AS reversed_tags,
    ARRAY_TO_STRING(tags, ', ') AS tags_string
FROM products;

-- Array transformations
SELECT
    name,
    ARRAY(
        SELECT UPPER(tag)
        FROM UNNEST(tags) AS tag
    ) AS uppercase_tags
FROM products;
```
:::

::: details Snowflake
```sql
-- Create table with arrays
CREATE TABLE products (
    id INT,
    name VARCHAR,
    tags ARRAY,
    prices ARRAY,
    metadata VARIANT
);

-- Insert arrays
INSERT INTO products (id, name, tags, prices)
SELECT 1, 'Widget', ARRAY_CONSTRUCT('gadget', 'useful'), ARRAY_CONSTRUCT(9.99, 14.99, 19.99)
UNION ALL
SELECT 2, 'Gizmo', ARRAY_CONSTRUCT('tool', 'premium'), ARRAY_CONSTRUCT(29.99, 39.99);

-- Query arrays
SELECT
    name,
    tags[0]::STRING AS first_tag,  -- 0-indexed
    ARRAY_SIZE(tags) AS tag_count
FROM products;

-- Expand array to rows
SELECT
    p.name,
    t.value::STRING AS tag
FROM products p,
LATERAL FLATTEN(input => p.tags) t;

-- Filter by array contents
SELECT * FROM products
WHERE ARRAY_CONTAINS('gadget'::VARIANT, tags);

-- Array aggregation
SELECT ARRAY_AGG(name) AS product_names
FROM products;

-- Array operations
SELECT
    ARRAY_APPEND(tags, 'new_tag') AS tags_with_new,
    ARRAY_CAT(tags, ARRAY_CONSTRUCT('tag1', 'tag2')) AS concatenated,
    ARRAY_SLICE(tags, 0, 1) AS first_two_tags
FROM products;

-- Array transformations
SELECT
    name,
    ARRAY_CONSTRUCT(
        (SELECT UPPER(t.value::STRING)
         FROM TABLE(FLATTEN(tags)) t)
    ) AS uppercase_tags
FROM products;
```
:::

::: details Databricks/Spark SQL
```sql
-- Create table with arrays
CREATE TABLE products (
    id INT,
    name STRING,
    tags ARRAY<STRING>,
    prices ARRAY<DOUBLE>
);

-- Insert arrays
INSERT INTO products VALUES
(1, 'Widget', array('gadget', 'useful'), array(9.99, 14.99, 19.99)),
(2, 'Gizmo', array('tool', 'premium'), array(29.99, 39.99));

-- Query arrays
SELECT
    name,
    tags[0] AS first_tag,  -- 0-indexed
    size(tags) AS tag_count,
    array_max(prices) AS max_price,
    array_min(prices) AS min_price
FROM products;

-- Expand array to rows
SELECT
    name,
    explode(tags) AS tag
FROM products;

-- Or with position
SELECT
    name,
    pos,
    tag
FROM products
LATERAL VIEW posexplode(tags) AS pos, tag;

-- Filter by array contents
SELECT * FROM products
WHERE array_contains(tags, 'gadget');

SELECT * FROM products
WHERE exists(tags, x -> x = 'gadget');

-- Array aggregation
SELECT collect_list(name) AS product_names
FROM products;

SELECT collect_set(name) AS unique_product_names
FROM products;

-- Array operations
SELECT
    array_union(tags, array('new_tag')) AS tags_with_new,
    concat(tags, array('tag1', 'tag2')) AS concatenated,
    slice(tags, 1, 2) AS first_two_tags,  -- 1-indexed for slice
    reverse(tags) AS reversed_tags
FROM products;

-- Higher-order array functions
SELECT
    name,
    transform(tags, x -> upper(x)) AS uppercase_tags,
    filter(prices, x -> x > 15) AS expensive_prices,
    aggregate(prices, 0.0, (acc, x) -> acc + x) AS total_price
FROM products;
```
:::

## Struct/Object Types

### Struct Support by Database

| Database | Type Name | Syntax | Nested Support | Notes |
|----------|-----------|--------|----------------|-------|
| PostgreSQL | `COMPOSITE TYPE` | Custom type definition | ✅ Yes | Requires explicit type creation |
| MySQL | ❌ N/A | Use JSON | ✅ Yes | Via JSON documents |
| SQL Server | ❌ N/A | Use JSON | ✅ Yes | Via JSON documents |
| BigQuery | `STRUCT` | `STRUCT<field TYPE>` | ✅ Yes | Native support |
| Snowflake | `OBJECT` | Within `VARIANT` | ✅ Yes | Semi-structured data |
| Databricks | `STRUCT` | `STRUCT<field:TYPE>` | ✅ Yes | Native support |
| DuckDB | `STRUCT` | `STRUCT(field TYPE)` | ✅ Yes | Native support |

### Working with Structs

::: details PostgreSQL (Composite Types)
```sql
-- Create composite types
CREATE TYPE address AS (
    street TEXT,
    city TEXT,
    state CHAR(2),
    zip_code VARCHAR(10)
);

CREATE TYPE person AS (
    name TEXT,
    age INTEGER,
    address address  -- Nested struct
);

-- Create table using composite type
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_info person,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO customers (customer_info) VALUES
(ROW('John Doe', 30, ROW('123 Main St', 'Springfield', 'IL', '62701')::address)::person);

-- Query struct fields
SELECT
    (customer_info).name,
    (customer_info).age,
    (customer_info.address).city,
    (customer_info.address).state
FROM customers;

-- Update struct fields
UPDATE customers
SET customer_info.age = 31
WHERE (customer_info).name = 'John Doe';
```
:::

::: details BigQuery
```sql
-- Create table with STRUCT
CREATE TABLE customers (
    id INT64,
    customer_info STRUCT<
        name STRING,
        age INT64,
        address STRUCT<
            street STRING,
            city STRING,
            state STRING,
            zip_code STRING
        >
    >,
    created_at TIMESTAMP
);

-- Insert data
INSERT INTO customers (id, customer_info, created_at) VALUES
(1, STRUCT(
    'John Doe' AS name,
    30 AS age,
    STRUCT(
        '123 Main St' AS street,
        'Springfield' AS city,
        'IL' AS state,
        '62701' AS zip_code
    ) AS address
), CURRENT_TIMESTAMP());

-- Query struct fields
SELECT
    customer_info.name,
    customer_info.age,
    customer_info.address.city,
    customer_info.address.state
FROM customers;

-- Create struct in query
SELECT
    STRUCT(
        name,
        email,
        STRUCT(city, state) AS location
    ) AS user_info
FROM users;

-- Array of structs
CREATE TABLE orders (
    order_id INT64,
    items ARRAY<STRUCT<
        product_id INT64,
        quantity INT64,
        price FLOAT64
    >>
);

-- Query array of structs
SELECT
    order_id,
    item.product_id,
    item.quantity,
    item.price
FROM orders,
UNNEST(items) AS item
WHERE item.price > 10;
```
:::

::: details Databricks/Spark SQL
```sql
-- Create table with STRUCT
CREATE TABLE customers (
    id INT,
    customer_info STRUCT<
        name: STRING,
        age: INT,
        address: STRUCT<
            street: STRING,
            city: STRING,
            state: STRING,
            zip_code: STRING
        >
    >,
    created_at TIMESTAMP
);

-- Insert data
INSERT INTO customers VALUES (
    1,
    struct(
        'John Doe',
        30,
        struct('123 Main St', 'Springfield', 'IL', '62701')
    ),
    current_timestamp()
);

-- Or using named fields
INSERT INTO customers VALUES (
    2,
    named_struct(
        'name', 'Jane Smith',
        'age', 28,
        'address', named_struct(
            'street', '456 Oak Ave',
            'city', 'Portland',
            'state', 'OR',
            'zip_code', '97201'
        )
    ),
    current_timestamp()
);

-- Query struct fields
SELECT
    customer_info.name,
    customer_info.age,
    customer_info.address.city,
    customer_info.address.state
FROM customers;

-- Array of structs
CREATE TABLE orders (
    order_id INT,
    items ARRAY<STRUCT<
        product_id: INT,
        quantity: INT,
        price: DOUBLE
    >>
);

-- Insert array of structs
INSERT INTO orders VALUES (
    1,
    array(
        struct(101, 2, 29.99),
        struct(102, 1, 49.99)
    )
);

-- Query array of structs
SELECT
    order_id,
    item.product_id,
    item.quantity,
    item.price
FROM orders
LATERAL VIEW explode(items) t AS item
WHERE item.price > 30;

-- Transform structs
SELECT
    order_id,
    transform(items, x -> struct(
        x.product_id AS id,
        x.quantity * x.price AS total
    )) AS item_totals
FROM orders;
```
:::

::: details DuckDB
```sql
-- Create table with STRUCT
CREATE TABLE customers (
    id INTEGER,
    customer_info STRUCT(
        name VARCHAR,
        age INTEGER,
        address STRUCT(
            street VARCHAR,
            city VARCHAR,
            state VARCHAR,
            zip_code VARCHAR
        )
    ),
    created_at TIMESTAMP
);

-- Insert data
INSERT INTO customers VALUES (
    1,
    {'name': 'John Doe', 'age': 30, 'address': {
        'street': '123 Main St',
        'city': 'Springfield',
        'state': 'IL',
        'zip_code': '62701'
    }},
    CURRENT_TIMESTAMP
);

-- Query struct fields
SELECT
    customer_info.name,
    customer_info.age,
    customer_info.address.city,
    customer_info.address.state
FROM customers;

-- Alternative: using bracket notation
SELECT
    customer_info['name'],
    customer_info['address']['city']
FROM customers;

-- Array of structs
CREATE TABLE orders (
    order_id INTEGER,
    items STRUCT(
        product_id INTEGER,
        quantity INTEGER,
        price DOUBLE
    )[]
);

-- Query array of structs
SELECT
    order_id,
    unnest(items) AS item
FROM orders;
```
:::

## Map/Dictionary Types

### Map Support by Database

| Database | Native Support | Implementation | Key Type | Value Type |
|----------|----------------|----------------|----------|------------|
| PostgreSQL | ✅ Yes | `hstore` extension | TEXT | TEXT |
| MySQL | ❌ No | JSON objects | STRING | ANY |
| SQL Server | ❌ No | JSON objects | STRING | ANY |
| BigQuery | ❌ Limited | Repeated STRUCT | ANY | ANY |
| Snowflake | ✅ Yes | OBJECT type | STRING | VARIANT |
| Databricks | ✅ Yes | `MAP<K,V>` | Primitive | ANY |
| DuckDB | ✅ Yes | `MAP(K,V)` | ANY | ANY |

::: details PostgreSQL (hstore)
```sql
-- Enable hstore extension
CREATE EXTENSION IF NOT EXISTS hstore;

-- Create table with hstore
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT,
    attributes hstore
);

-- Insert data
INSERT INTO products (name, attributes) VALUES
('T-Shirt', 'color=>red, size=>L, material=>cotton'),
('Jeans', '"color"=>"blue", "size"=>"32", "style"=>"slim"');

-- Query hstore
SELECT
    name,
    attributes->'color' AS color,
    attributes->'size' AS size,
    attributes ? 'material' AS has_material
FROM products;

-- Filter by key/value
SELECT * FROM products
WHERE attributes @> 'color=>red';

-- Get all keys
SELECT name, akeys(attributes) AS keys
FROM products;

-- Get all values
SELECT name, avals(attributes) AS values
FROM products;

-- Convert to JSON
SELECT name, hstore_to_json(attributes) AS attributes_json
FROM products;
```
:::

::: details Databricks/Spark SQL
```sql
-- Create table with MAP
CREATE TABLE products (
    id INT,
    name STRING,
    attributes MAP<STRING, STRING>
);

-- Insert data
INSERT INTO products VALUES
(1, 'T-Shirt', map('color', 'red', 'size', 'L', 'material', 'cotton')),
(2, 'Jeans', map('color', 'blue', 'size', '32', 'style', 'slim'));

-- Query map
SELECT
    name,
    attributes['color'] AS color,
    attributes['size'] AS size
FROM products;

-- Get all keys
SELECT name, map_keys(attributes) AS keys
FROM products;

-- Get all values
SELECT name, map_values(attributes) AS values
FROM products;

-- Explode map to rows
SELECT
    name,
    key,
    value
FROM products
LATERAL VIEW explode(attributes) t AS key, value;

-- Filter by key existence
SELECT * FROM products
WHERE array_contains(map_keys(attributes), 'material');

-- Create map from arrays
SELECT map_from_arrays(
    array('key1', 'key2'),
    array('value1', 'value2')
) AS my_map;
```
:::

::: details DuckDB
```sql
-- Create table with MAP
CREATE TABLE products (
    id INTEGER,
    name VARCHAR,
    attributes MAP(VARCHAR, VARCHAR)
);

-- Insert data
INSERT INTO products VALUES
(1, 'T-Shirt', MAP(['color', 'size', 'material'], ['red', 'L', 'cotton'])),
(2, 'Jeans', MAP(['color', 'size', 'style'], ['blue', '32', 'slim']));

-- Or using map literal syntax
INSERT INTO products VALUES
(3, 'Shoes', MAP {'color': 'black', 'size': '10', 'type': 'sneaker'});

-- Query map
SELECT
    name,
    attributes['color'] AS color,
    attributes['size'] AS size
FROM products;

-- Get all keys
SELECT name, map_keys(attributes) AS keys
FROM products;

-- Get all values
SELECT name, map_values(attributes) AS values
FROM products;

-- Explode map to rows
SELECT
    name,
    unnest(map_keys(attributes)) AS key,
    unnest(map_values(attributes)) AS value
FROM products;
```
:::

## Performance Considerations

### Indexing Strategies

#### PostgreSQL JSONB Indexing
```sql
-- GIN index for containment queries
CREATE INDEX idx_data_gin ON events USING GIN (event_data);

-- Queries that benefit:
-- WHERE event_data @> '{"type": "login"}'
-- WHERE event_data ? 'user_id'

-- GIN index on specific path
CREATE INDEX idx_event_type ON events USING GIN ((event_data->'type'));

-- B-tree index on extracted value
CREATE INDEX idx_user_id ON events ((event_data->>'user_id'));

-- Queries that benefit:
-- WHERE event_data->>'user_id' = '123'

-- Expression index for complex queries
CREATE INDEX idx_amount ON events (((event_data->>'amount')::NUMERIC))
WHERE event_data->>'type' = 'purchase';
```

#### MySQL JSON Indexing
```sql
-- Virtual column + index
ALTER TABLE events
ADD COLUMN event_type VARCHAR(50)
    AS (JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type'))) VIRTUAL,
ADD INDEX idx_event_type (event_type);

-- Multi-valued index for arrays (MySQL 8.0.17+)
CREATE INDEX idx_tags ON products (
    (CAST(event_data->'$.tags' AS CHAR(50) ARRAY))
);

-- Functional index (MySQL 8.0.13+)
CREATE INDEX idx_user_id ON events (
    (CAST(JSON_EXTRACT(event_data, '$.user_id') AS UNSIGNED))
);
```

#### SQL Server JSON Indexing
```sql
-- Computed column + index
ALTER TABLE events
ADD event_type AS JSON_VALUE(event_data, '$.type');

CREATE INDEX idx_event_type ON events(event_type);

-- Full-text index for JSON content search
CREATE FULLTEXT INDEX ON events(event_data)
KEY INDEX PK_events;

-- Columnstore index for analytics
CREATE NONCLUSTERED COLUMNSTORE INDEX idx_events_cs
ON events (id, event_data, created_at);
```

### Storage Considerations

| Database | JSON Storage | Compression | Best For |
|----------|--------------|-------------|----------|
| PostgreSQL JSONB | Binary, decomposed | TOAST compression | Frequent queries, updates |
| PostgreSQL JSON | Text | TOAST compression | Preserving exact format |
| MySQL JSON | Binary, optimized | InnoDB compression | Moderate JSON usage |
| SQL Server | Text (NVARCHAR) | Page/row compression | Flexible schema |
| BigQuery JSON | Columnar | Automatic | Large-scale analytics |
| Snowflake VARIANT | Optimized binary | Automatic | Semi-structured data at scale |

### Query Performance Tips

1. **Use the right data type**:
   - PostgreSQL: Prefer JSONB over JSON for querying
   - MySQL: Use JSON type (validates and optimizes)
   - Consider arrays for simple lists

2. **Index appropriately**:
   - Index frequently queried JSON paths
   - Use partial indexes for filtered queries
   - Consider computed/virtual columns for complex expressions

3. **Avoid full JSON scans**:
```sql
-- Bad: Full table scan
SELECT * FROM events
WHERE event_data::TEXT LIKE '%login%';

-- Good: Use containment or path queries
SELECT * FROM events
WHERE event_data @> '{"type": "login"}';
```

4. **Batch operations**:
```sql
-- Bad: Row-by-row updates
UPDATE events
SET event_data = jsonb_set(event_data, '{processed}', 'true')
WHERE id = 1;

-- Good: Bulk update
UPDATE events
SET event_data = jsonb_set(event_data, '{processed}', 'true')
WHERE event_data->>'type' = 'login'
  AND created_at < NOW() - INTERVAL '1 day';
```

## Common Pitfalls

### 1. Type Confusion

```sql
-- PostgreSQL: -> returns JSON, ->> returns text
-- This fails:
SELECT * FROM events
WHERE event_data->'user_id' = 123;  -- JSON vs INTEGER

-- Correct:
SELECT * FROM events
WHERE event_data->>'user_id' = '123'  -- text comparison
   OR (event_data->>'user_id')::INTEGER = 123;  -- cast to integer
```

### 2. Array Indexing Differences

```sql
-- PostgreSQL: 1-indexed
SELECT tags[1] FROM products;  -- First element

-- BigQuery/Snowflake/Databricks: 0-indexed
SELECT tags[0] FROM products;  -- First element
SELECT tags[OFFSET(0)] FROM products;  -- BigQuery explicit syntax
```

### 3. NULL Handling in JSON

```sql
-- PostgreSQL: JSON null vs SQL NULL
SELECT
    event_data->'missing_key',        -- Returns JSON null
    event_data->>'missing_key',       -- Returns SQL NULL
    event_data->'explicit_null',      -- Returns JSON null
    event_data->>'explicit_null'      -- Returns SQL NULL
FROM events;

-- Check for JSON null vs missing key
SELECT * FROM events
WHERE event_data->>'field' IS NULL;  -- Missing OR null

SELECT * FROM events
WHERE NOT (event_data ? 'field');  -- Missing key only
```

### 4. Quoting in JSON Queries

```sql
-- PostgreSQL: Single quotes for JSON, dollar quotes for complex
WHERE event_data @> '{"type": "login"}';  -- Correct
WHERE event_data @> "{\"type\": \"login\"}";  -- Also works but ugly

-- Better for complex JSON:
WHERE event_data @> $${"type": "login", "status": "success"}$$;
```

### 5. Performance with Large JSON Documents

```sql
-- Bad: Store huge arrays in single JSON document
INSERT INTO logs (data) VALUES (
    json_build_object('events', (
        SELECT json_agg(row_to_json(e.*))
        FROM events e
    ))
);  -- Can create multi-MB JSON documents

-- Good: Use proper relational structure or partitioning
CREATE TABLE events (...);
CREATE TABLE event_details (...);
```

## Migration Considerations

### PostgreSQL to BigQuery

```sql
-- PostgreSQL: JSONB array operations
SELECT jsonb_array_elements(data->'items')
FROM orders;

-- BigQuery: UNNEST with JSON
SELECT item
FROM orders,
UNNEST(JSON_EXTRACT_ARRAY(data, '$.items')) AS item;

-- Better: Use ARRAY type in BigQuery
CREATE TABLE orders (
    id INT64,
    items ARRAY<STRUCT<product STRING, quantity INT64>>
);
```

### MySQL to Snowflake

```sql
-- MySQL: JSON functions
SELECT
    JSON_EXTRACT(data, '$.user.name') AS name,
    JSON_EXTRACT(data, '$.user.age') AS age
FROM users;

-- Snowflake: Colon notation
SELECT
    data:user.name::STRING AS name,
    data:user.age::INTEGER AS age
FROM users;
```

### Relational to JSON

```sql
-- Before: Normalized tables
CREATE TABLE orders (id INT, customer_id INT, order_date DATE);
CREATE TABLE order_items (order_id INT, product_id INT, quantity INT);

-- After: Denormalized JSON (PostgreSQL)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_data JSONB
);

-- Migrate data
INSERT INTO orders (order_data)
SELECT jsonb_build_object(
    'order_id', o.id,
    'customer_id', o.customer_id,
    'order_date', o.order_date,
    'items', (
        SELECT jsonb_agg(jsonb_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity
        ))
        FROM order_items oi
        WHERE oi.order_id = o.id
    )
)
FROM orders o;
```

## Try It Yourself

<CodePlayground />

### Practice Exercises

1. **JSON Extraction**: Create a table with JSON data and practice extracting nested values
2. **Array Operations**: Store an array of tags and query for specific values
3. **Complex Structures**: Build a query that creates nested JSON from relational data
4. **Performance**: Compare query performance with and without appropriate indexes

## See Also

- [Subqueries and CTEs](/concepts/subqueries/) - Using CTEs with JSON transformations
- [Aggregations and GROUP BY](/concepts/aggregations/) - JSON aggregation functions
- [PostgreSQL Guide](/databases/postgresql/) - Advanced PostgreSQL JSON features
- [BigQuery Guide](/databases/bigquery/) - Working with BigQuery STRUCT and ARRAY
- [Snowflake Guide](/databases/snowflake/) - VARIANT and semi-structured data
