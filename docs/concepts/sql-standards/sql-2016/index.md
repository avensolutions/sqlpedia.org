---
title: 'SQL:2016'
description: >-
  Comprehensive guide to SQL:2016 standard featuring JSON support, row pattern
  matching, polymorphic table functions, and enhanced temporal features
databases:
  - PostgreSQL
  - MySQL
  - SQL Server
  - Oracle
  - SQLite
  - Snowflake
  - BigQuery
  - DuckDB
  - Databricks
  - Spark SQL
difficulty: intermediate
tags:
  - concepts
  - sql-standards
  - sql-2016
  - json
  - json-path
  - pattern-matching
  - match-recognize
  - polymorphic-functions
  - json-table
---

# SQL:2016

<div class="difficulty-badge intermediate">Intermediate</div>

## Overview

SQL:2016, published as ISO/IEC 9075:2016, represents a significant modernization of SQL to handle contemporary data formats and advanced pattern matching. It brought JSON into the SQL standard as a first-class citizen and introduced sophisticated row pattern recognition capabilities.

Key innovations in SQL:2016:
- **JSON data type** (native JSON support)
- **JSON functions** (JSON_VALUE, JSON_QUERY, JSON_TABLE, JSON_OBJECT, JSON_ARRAY)
- **JSON path expressions** (standard JSON querying syntax)
- **Row pattern matching** (MATCH_RECOGNIZE clause)
- **Polymorphic table functions** (functions adapting to input types)
- **LISTAGG** aggregate function (string aggregation)
- **Enhanced temporal features**

SQL:2016 acknowledged the prevalence of JSON in modern applications and the need for complex event processing and pattern detection directly in SQL, making relational databases more competitive with NoSQL and specialized analytics platforms.

## Historical Context

### Timeline
- **2011**: SQL:2011 (temporal tables, enhanced window functions)
- **2016**: SQL:2016 (JSON support, pattern matching)
- **2019**: SQL:2019 (multi-dimensional arrays, property graphs)
- **2023**: SQL:2023 (enhanced JSON, property graph queries)

### Impact
SQL:2016 was transformative because it:
- Bridged relational and document-oriented data models
- Eliminated need for external JSON processing
- Enabled complex sequence analysis in SQL
- Standardized JSON operations across databases
- Made SQL viable for event stream analysis

Implementation varies significantly across databases, with JSON support nearly universal but MATCH_RECOGNIZE support still limited to enterprise databases.

## Major Features

### JSON Data Type

SQL:2016 standardized JSON as a native SQL data type.

#### Creating JSON Columns

```sql
-- Table with JSON column
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    product_name VARCHAR(100),
    attributes JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert JSON data
INSERT INTO products (product_id, product_name, attributes)
VALUES (
    101,
    'Laptop',
    JSON '{"brand": "TechCorp", "cpu": "Intel i7", "ram": "16GB", "ports": ["USB-C", "HDMI", "USB-A"]}'
);

-- Insert with JSON_OBJECT
INSERT INTO products (product_id, product_name, attributes)
VALUES (
    102,
    'Monitor',
    JSON_OBJECT(
        'brand': 'DisplayCo',
        'size': '27"',
        'resolution': '4K',
        'features': JSON_ARRAY('HDR', 'USB-C', 'Height Adjustable')
    )
);
```

### JSON Functions

#### JSON_VALUE - Extract Scalar Values

```sql
-- Extract single scalar values from JSON
SELECT
    product_id,
    product_name,
    JSON_VALUE(attributes, '$.brand') AS brand,
    JSON_VALUE(attributes, '$.cpu') AS cpu,
    JSON_VALUE(attributes, '$.ram') AS ram,
    CAST(JSON_VALUE(attributes, '$.price') AS DECIMAL(10,2)) AS price
FROM products;

-- With default value for missing paths
SELECT
    product_id,
    JSON_VALUE(attributes, '$.warranty' DEFAULT 'No warranty' ON EMPTY) AS warranty
FROM products;

-- With error handling
SELECT
    product_id,
    JSON_VALUE(attributes, '$.price' DEFAULT 0 ON ERROR) AS price
FROM products;
```

#### JSON_QUERY - Extract JSON Objects/Arrays

```sql
-- Extract JSON fragments (objects or arrays)
SELECT
    product_id,
    product_name,
    JSON_QUERY(attributes, '$.features') AS features,
    JSON_QUERY(attributes, '$.specifications') AS specs
FROM products;

-- Extract array elements
SELECT
    product_id,
    JSON_QUERY(attributes, '$.ports[0]') AS first_port,
    JSON_QUERY(attributes, '$.ports') AS all_ports
FROM products;

-- Conditional extraction
SELECT
    product_id,
    JSON_QUERY(
        attributes,
        '$.extended_warranty'
        NULL ON EMPTY
    ) AS extended_warranty
FROM products;
```

#### JSON_TABLE - Convert JSON to Relational

```sql
-- Flatten JSON into relational rows
SELECT p.product_id, p.product_name, jt.*
FROM products p,
JSON_TABLE(
    p.attributes,
    '$'
    COLUMNS (
        brand VARCHAR(50) PATH '$.brand',
        cpu VARCHAR(50) PATH '$.cpu',
        ram VARCHAR(20) PATH '$.ram',
        price DECIMAL(10,2) PATH '$.price'
    )
) AS jt;

-- Extract nested arrays
SELECT p.product_id, p.product_name, ports.port_name
FROM products p,
JSON_TABLE(
    p.attributes,
    '$.ports[*]'
    COLUMNS (
        port_name VARCHAR(50) PATH '$'
    )
) AS ports;

-- Complex nested structure
SELECT
    o.order_id,
    o.customer_id,
    items.item_id,
    items.product_name,
    items.quantity,
    items.price
FROM orders o,
JSON_TABLE(
    o.order_details,
    '$.items[*]'
    COLUMNS (
        item_id INTEGER PATH '$.id',
        product_name VARCHAR(100) PATH '$.name',
        quantity INTEGER PATH '$.qty',
        price DECIMAL(10,2) PATH '$.price',
        NESTED PATH '$.options[*]'
        COLUMNS (
            option_name VARCHAR(50) PATH '$.name',
            option_value VARCHAR(50) PATH '$.value'
        )
    )
) AS items;
```

#### JSON_OBJECT - Create JSON Objects

```sql
-- Construct JSON from relational data
SELECT
    JSON_OBJECT(
        'employee_id': employee_id,
        'name': first_name || ' ' || last_name,
        'department': department_name,
        'salary': salary,
        'hire_date': hire_date
    ) AS employee_json
FROM employees e
JOIN departments d ON e.department_id = d.department_id;

-- With NULL handling
SELECT
    JSON_OBJECT(
        'product_id': product_id,
        'name': product_name,
        'discount': discount_price NULL ON NULL  -- Include null values
    ) AS product_json
FROM products;

-- Nested objects
SELECT
    JSON_OBJECT(
        'order_id': order_id,
        'customer': JSON_OBJECT(
            'id': customer_id,
            'name': customer_name
        ),
        'total': order_total
    ) AS order_json
FROM orders;
```

#### JSON_ARRAY - Create JSON Arrays

```sql
-- Create JSON array from values
SELECT
    department_id,
    JSON_ARRAY(
        first_name,
        last_name,
        salary
    ) AS employee_data
FROM employees;

-- Aggregate into array
SELECT
    department_id,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'id': employee_id,
            'name': first_name || ' ' || last_name
        )
        ORDER BY last_name
    ) AS employees
FROM employees
GROUP BY department_id;

-- With NULL handling
SELECT
    JSON_ARRAY(
        product_name,
        description,
        price NULL ON NULL
    ) AS product_array
FROM products;
```

#### JSON_OBJECTAGG - Aggregate to JSON Object

```sql
-- Create JSON object from aggregated key-value pairs
SELECT
    department_id,
    JSON_OBJECTAGG(
        employee_id: salary
    ) AS employee_salaries
FROM employees
GROUP BY department_id;

-- Build nested structure
SELECT
    JSON_OBJECTAGG(
        category:
        JSON_ARRAYAGG(product_name ORDER BY product_name)
    ) AS products_by_category
FROM products
GROUP BY category;
```

### JSON Path Expressions

SQL:2016 standardized JSON path syntax for querying JSON data.

```sql
-- Basic path expressions
'$.field'                    -- Top-level field
'$.nested.field'             -- Nested field
'$.array[0]'                 -- First array element
'$.array[*]'                 -- All array elements
'$.array[0 to 5]'            -- Array slice
'$.field1, $.field2'         -- Multiple paths

-- Filters
'$.products[*] ? (@.price > 100)'           -- Filter by condition
'$.items[*] ? (@.category == "electronics")' -- String equality
'$.data[*] ? (@.stock > 0 && @.price < 50)' -- Multiple conditions

-- Examples
SELECT product_id
FROM products
WHERE JSON_VALUE(attributes, '$.price') > 100;

SELECT
    product_id,
    JSON_QUERY(attributes, '$.features[*] ? (@.enabled == true)') AS enabled_features
FROM products;

-- Recursive descent
'$..price'  -- All price fields at any depth

SELECT
    product_id,
    JSON_QUERY(data, '$..dimensions') AS all_dimensions
FROM product_catalog;
```

### Practical JSON Examples

#### Store and Query User Preferences

```sql
-- Store user preferences as JSON
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY,
    preferences JSON
);

INSERT INTO user_preferences VALUES (
    1,
    JSON_OBJECT(
        'theme': 'dark',
        'language': 'en',
        'notifications': JSON_OBJECT(
            'email': true,
            'sms': false,
            'push': true
        ),
        'favorites': JSON_ARRAY('product_101', 'product_205', 'product_399')
    )
);

-- Query preferences
SELECT
    user_id,
    JSON_VALUE(preferences, '$.theme') AS theme,
    JSON_VALUE(preferences, '$.language') AS language,
    JSON_VALUE(preferences, '$.notifications.email') AS email_notifications
FROM user_preferences;

-- Find users with specific preference
SELECT user_id
FROM user_preferences
WHERE JSON_VALUE(preferences, '$.theme') = 'dark';

-- Expand favorites array
SELECT u.user_id, f.product_id
FROM user_preferences u,
JSON_TABLE(
    u.preferences,
    '$.favorites[*]'
    COLUMNS (product_id VARCHAR(50) PATH '$')
) AS f;
```

#### Event Logging with JSON

```sql
-- Event log table
CREATE TABLE event_log (
    event_id INTEGER PRIMARY KEY,
    event_type VARCHAR(50),
    event_data JSON,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log various events
INSERT INTO event_log (event_id, event_type, event_data) VALUES
(1, 'user_login', JSON_OBJECT('user_id': 123, 'ip': '192.168.1.1', 'device': 'mobile')),
(2, 'purchase', JSON_OBJECT('user_id': 123, 'order_id': 9876, 'amount': 129.99)),
(3, 'page_view', JSON_OBJECT('user_id': 123, 'page': '/products/laptop', 'duration': 45));

-- Query events
SELECT
    event_id,
    event_type,
    JSON_VALUE(event_data, '$.user_id') AS user_id,
    event_timestamp
FROM event_log
WHERE event_type = 'purchase'
  AND CAST(JSON_VALUE(event_data, '$.amount') AS DECIMAL) > 100;

-- Aggregate JSON data
SELECT
    JSON_VALUE(event_data, '$.user_id') AS user_id,
    COUNT(*) AS event_count,
    JSON_ARRAYAGG(event_type) AS event_types
FROM event_log
GROUP BY JSON_VALUE(event_data, '$.user_id');
```

#### Product Catalog with Attributes

```sql
-- Flexible product schema
CREATE TABLE catalog (
    product_id INTEGER PRIMARY KEY,
    category VARCHAR(50),
    base_info JSON,
    custom_attributes JSON
);

-- Different products with different attributes
INSERT INTO catalog VALUES
(1, 'laptop',
    JSON_OBJECT('name': 'Pro Laptop', 'price': 1299.99),
    JSON_OBJECT('cpu': 'Intel i9', 'ram': '32GB', 'storage': '1TB SSD')),
(2, 'book',
    JSON_OBJECT('name': 'SQL Guide', 'price': 49.99),
    JSON_OBJECT('author': 'John Doe', 'pages': 450, 'isbn': '123-456-789'));

-- Query with category-specific attributes
SELECT
    product_id,
    category,
    JSON_VALUE(base_info, '$.name') AS product_name,
    JSON_VALUE(base_info, '$.price') AS price,
    CASE category
        WHEN 'laptop' THEN JSON_VALUE(custom_attributes, '$.cpu')
        WHEN 'book' THEN JSON_VALUE(custom_attributes, '$.author')
    END AS primary_attribute
FROM catalog;
```

### Row Pattern Matching (MATCH_RECOGNIZE)

MATCH_RECOGNIZE enables complex pattern detection in ordered data, similar to regular expressions but for row sequences.

#### Basic Pattern Matching

```sql
-- Detect stock price pattern: V-shape (down then up)
SELECT *
FROM stock_prices
MATCH_RECOGNIZE (
    ORDER BY trade_date
    MEASURES
        FIRST(A.price) AS start_price,
        LAST(B.price) AS bottom_price,
        LAST(C.price) AS end_price,
        LAST(C.trade_date) AS pattern_end_date
    ONE ROW PER MATCH
    PATTERN (A+ B+ C+)
    DEFINE
        A AS A.price < PREV(A.price),  -- Declining prices
        B AS B.price < PREV(B.price),  -- Continue declining
        C AS C.price > PREV(C.price)   -- Rising prices
)
WHERE symbol = 'TECH';
```

#### Pattern Variables and Quantifiers

```sql
-- Find sequences: 3+ consecutive increases
SELECT *
FROM daily_sales
MATCH_RECOGNIZE (
    PARTITION BY product_id
    ORDER BY sale_date
    MEASURES
        FIRST(increase.sale_date) AS streak_start,
        LAST(increase.sale_date) AS streak_end,
        COUNT(*) AS streak_length,
        FIRST(increase.amount) AS start_amount,
        LAST(increase.amount) AS end_amount
    ONE ROW PER MATCH
    PATTERN (increase{3,})  -- 3 or more occurrences
    DEFINE
        increase AS amount > PREV(amount)
);

-- Pattern with alternatives
SELECT *
FROM sensor_data
MATCH_RECOGNIZE (
    ORDER BY reading_time
    MEASURES
        CLASSIFIER() AS pattern_type,
        FIRST(reading_time) AS event_start
    ALL ROWS PER MATCH
    PATTERN ((spike | drop))
    DEFINE
        spike AS value > PREV(value) * 1.5,  -- 50% increase
        drop AS value < PREV(value) * 0.5    -- 50% decrease
);
```

#### Complex Patterns

```sql
-- E-commerce: Browse then purchase pattern
SELECT *
FROM user_events
MATCH_RECOGNIZE (
    PARTITION BY user_id
    ORDER BY event_time
    MEASURES
        FIRST(browse.event_time) AS first_browse,
        LAST(browse.event_time) AS last_browse,
        COUNT(browse.*) AS browse_count,
        purchase.event_time AS purchase_time,
        purchase.amount AS purchase_amount
    ONE ROW PER MATCH
    AFTER MATCH SKIP TO NEXT ROW
    PATTERN (browse+ purchase)
    DEFINE
        browse AS event_type = 'page_view',
        purchase AS event_type = 'purchase' AND amount > 0
);

-- Security: Failed login attempts before success
SELECT *
FROM login_attempts
MATCH_RECOGNIZE (
    PARTITION BY user_id
    ORDER BY attempt_time
    MEASURES
        COUNT(failed.*) AS failed_attempts,
        FIRST(failed.attempt_time) AS first_failed,
        success.attempt_time AS success_time,
        success.ip_address AS success_ip
    ONE ROW PER MATCH
    PATTERN (failed{2,} success)
    DEFINE
        failed AS status = 'failed',
        success AS status = 'success'
);
```

#### Financial Pattern Detection

```sql
-- Double top pattern in trading
SELECT *
FROM stock_prices
MATCH_RECOGNIZE (
    PARTITION BY symbol
    ORDER BY trade_date
    MEASURES
        FIRST(peak1.trade_date) AS first_peak_date,
        FIRST(peak1.price) AS first_peak_price,
        valley.trade_date AS valley_date,
        valley.price AS valley_price,
        LAST(peak2.trade_date) AS second_peak_date,
        LAST(peak2.price) AS second_peak_price
    ONE ROW PER MATCH
    PATTERN (rise1+ peak1+ decline+ valley+ rise2+ peak2+)
    DEFINE
        rise1 AS price > PREV(price),
        peak1 AS price >= PREV(price) AND price > NEXT(price),
        decline AS price < PREV(price),
        valley AS price <= PREV(price) AND price < NEXT(price),
        rise2 AS price > PREV(price),
        peak2 AS price >= PREV(price)
              AND ABS(price - FIRST(peak1.price)) < FIRST(peak1.price) * 0.05
);
```

### Polymorphic Table Functions

Functions that adapt their output schema based on input.

```sql
-- Define polymorphic table function (syntax varies)
CREATE FUNCTION split_string(
    input_string VARCHAR,
    delimiter VARCHAR
)
RETURNS TABLE (
    position INTEGER,
    value VARCHAR
)
AS $$
    WITH RECURSIVE split AS (
        SELECT
            1 AS position,
            CASE
                WHEN POSITION(delimiter IN input_string) > 0
                THEN SUBSTRING(input_string, 1, POSITION(delimiter IN input_string) - 1)
                ELSE input_string
            END AS value,
            CASE
                WHEN POSITION(delimiter IN input_string) > 0
                THEN SUBSTRING(input_string, POSITION(delimiter IN input_string) + LENGTH(delimiter))
                ELSE NULL
            END AS remainder

        UNION ALL

        SELECT
            position + 1,
            CASE
                WHEN POSITION(delimiter IN remainder) > 0
                THEN SUBSTRING(remainder, 1, POSITION(delimiter IN remainder) - 1)
                ELSE remainder
            END,
            CASE
                WHEN POSITION(delimiter IN remainder) > 0
                THEN SUBSTRING(remainder, POSITION(delimiter IN remainder) + LENGTH(delimiter))
                ELSE NULL
            END
        FROM split
        WHERE remainder IS NOT NULL
    )
    SELECT position, value FROM split;
$$;

-- Use polymorphic function
SELECT t.*, s.*
FROM tags t,
split_string(t.tag_list, ',') s;
```

## Database-Specific Implementations

### PostgreSQL
- **JSON**: Excellent support with `json` and `jsonb` types
- **JSON Functions**: Full suite of JSON functions
- **MATCH_RECOGNIZE**: Not supported (use window functions)
- **Path**: JSONPath support via `jsonb_path_query`

```sql
-- PostgreSQL JSON
SELECT
    product_id,
    attributes->>'brand' AS brand,
    attributes->'features' AS features,
    jsonb_path_query(attributes, '$.ports[*]') AS ports
FROM products;
```

### MySQL
- **JSON**: Native JSON type since 5.7
- **JSON Functions**: Good coverage (JSON_VALUE, JSON_TABLE, etc.)
- **MATCH_RECOGNIZE**: Not supported
- **Path**: JSON path expressions supported

```sql
-- MySQL JSON
SELECT
    product_id,
    JSON_EXTRACT(attributes, '$.brand') AS brand,
    JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.cpu')) AS cpu
FROM products;
```

### SQL Server
- **JSON**: JSON support via string storage (no native type)
- **JSON Functions**: Good function support
- **MATCH_RECOGNIZE**: Not supported
- **Path**: JSON path via `JSON_VALUE`, `JSON_QUERY`

```sql
-- SQL Server JSON
SELECT
    product_id,
    JSON_VALUE(attributes, '$.brand') AS brand,
    JSON_QUERY(attributes, '$.features') AS features
FROM products;

-- Convert JSON to table
SELECT *
FROM OPENJSON(
    '{"brand":"TechCorp","cpu":"i7"}',
    '$'
) WITH (
    brand VARCHAR(50) '$.brand',
    cpu VARCHAR(50) '$.cpu'
);
```

### Oracle
- **JSON**: Full JSON support with multiple storage options
- **JSON Functions**: Comprehensive JSON function library
- **MATCH_RECOGNIZE**: Full support (Oracle 12c+)
- **Path**: SQL/JSON path expressions

```sql
-- Oracle JSON
SELECT
    product_id,
    JSON_VALUE(attributes, '$.brand') AS brand,
    JSON_QUERY(attributes, '$.features') AS features
FROM products;

-- Oracle MATCH_RECOGNIZE
SELECT *
FROM stock_prices
MATCH_RECOGNIZE (
    ORDER BY trade_date
    MEASURES
        CLASSIFIER() AS pattern
    PATTERN (up{2,})
    DEFINE
        up AS price > PREV(price)
);
```

### Snowflake
- **JSON**: Native VARIANT type for JSON
- **JSON Functions**: Excellent JSON support
- **MATCH_RECOGNIZE**: Full support
- **Path**: JSON notation and path functions

```sql
-- Snowflake JSON
SELECT
    product_id,
    attributes:brand::STRING AS brand,
    attributes:features AS features,
    attributes:ports[0]::STRING AS first_port
FROM products;

-- Snowflake MATCH_RECOGNIZE
SELECT *
FROM events
MATCH_RECOGNIZE (
    PARTITION BY user_id
    ORDER BY event_time
    MEASURES /* pattern measures */
    PATTERN (/* pattern */)
    DEFINE /* pattern definitions */
);
```

## Common Patterns

### JSON Schema Evolution

```sql
-- Add new attributes without schema changes
UPDATE products
SET attributes = JSON_OBJECT(
    'brand': JSON_VALUE(attributes, '$.brand'),
    'model': JSON_VALUE(attributes, '$.model'),
    'specs': JSON_QUERY(attributes, '$.specs'),
    'new_field': 'new_value'  -- Add new field
)
WHERE product_id = 101;
```

### JSON Aggregation

```sql
-- Aggregate relational data to JSON
SELECT
    d.department_id,
    d.department_name,
    JSON_OBJECT(
        'department': d.department_name,
        'employee_count': COUNT(e.employee_id),
        'employees': JSON_ARRAYAGG(
            JSON_OBJECT(
                'id': e.employee_id,
                'name': e.first_name || ' ' || e.last_name,
                'salary': e.salary
            )
            ORDER BY e.last_name
        )
    ) AS department_json
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name;
```

### Pattern Detection for Anomalies

```sql
-- Detect sudden spikes in metrics
SELECT *
FROM system_metrics
MATCH_RECOGNIZE (
    PARTITION BY server_id
    ORDER BY metric_time
    MEASURES
        FIRST(normal.metric_time) AS baseline_time,
        spike.metric_time AS spike_time,
        spike.value AS spike_value,
        AVG(normal.value) AS baseline_avg
    ONE ROW PER MATCH
    PATTERN (normal{5,} spike)
    DEFINE
        normal AS value BETWEEN 0 AND 100,
        spike AS value > AVG(normal.value) * 3  -- 3x baseline
);
```

## Best Practices

### JSON Indexing

```sql
-- Create indexes on JSON paths (database-specific)
-- PostgreSQL
CREATE INDEX idx_product_brand ON products
USING GIN ((attributes->'brand'));

-- MySQL
CREATE INDEX idx_brand ON products (
    (CAST(JSON_EXTRACT(attributes, '$.brand') AS CHAR(50)))
);

-- SQL Server
CREATE INDEX idx_brand ON products
(JSON_VALUE(attributes, '$.brand'));
```

### JSON Validation

```sql
-- Validate JSON structure before insert
CREATE TABLE products_validated (
    product_id INTEGER PRIMARY KEY,
    attributes JSON,
    CHECK (
        JSON_VALUE(attributes, '$.brand') IS NOT NULL
        AND JSON_VALUE(attributes, '$.price') IS NOT NULL
    )
);
```

### Performance Considerations

```sql
-- Inefficient: Multiple JSON_VALUE calls
SELECT
    JSON_VALUE(data, '$.field1'),
    JSON_VALUE(data, '$.field2'),
    JSON_VALUE(data, '$.field3')
FROM large_table;

-- Better: Use JSON_TABLE for multiple extractions
SELECT jt.*
FROM large_table t,
JSON_TABLE(
    t.data,
    '$'
    COLUMNS (
        field1 VARCHAR(50) PATH '$.field1',
        field2 VARCHAR(50) PATH '$.field2',
        field3 INTEGER PATH '$.field3'
    )
) AS jt;
```

## Common Pitfalls

### JSON Type vs String

```sql
-- Wrong: Storing JSON as VARCHAR
CREATE TABLE bad_design (
    id INTEGER,
    data VARCHAR(1000)  -- Can't validate, index, or query efficiently
);

-- Correct: Use JSON type
CREATE TABLE good_design (
    id INTEGER,
    data JSON  -- Validated, queryable, indexable
);
```

### NULL Handling in JSON

```sql
-- JSON null vs SQL NULL are different
SELECT
    JSON_OBJECT('field': NULL),  -- JSON: {"field": null}
    JSON_OBJECT('field': NULL NULL ON NULL),  -- JSON: {"field": null}
    JSON_OBJECT('field': NULL ABSENT ON NULL);  -- JSON: {}
```

### Pattern Matching Performance

MATCH_RECOGNIZE can be computationally expensive on large datasets. Use appropriate partitioning and limiting.

## See Also

- [SQL Standards Overview](../) - All SQL standards
- [SQL:2011](../sql-2011/) - Previous standard
- [JSON in SQL](../../json/) - JSON patterns and practices
- [Pattern Matching](../../pattern-matching/) - MATCH_RECOGNIZE guide
- [Window Functions](../../window-functions/) - Analytics functions

## External Resources

- [ISO/IEC 9075:2016](https://www.iso.org/standard/63555.html) - Official standard
- [Modern SQL - JSON](https://modern-sql.com/blog/2017-06/whats-new-in-sql-2016) - SQL:2016 features
- [Oracle MATCH_RECOGNIZE](https://docs.oracle.com/en/database/oracle/oracle-database/19/dwhsg/pattern-matching.html)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
