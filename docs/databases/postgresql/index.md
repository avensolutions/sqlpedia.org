---
title: PostgreSQL
description: Comprehensive guide to PostgreSQL - The world's most advanced open source database
difficulty: intermediate
tags: [postgresql, database, open-source]
---

# PostgreSQL

## Overview

PostgreSQL (often called "Postgres") is a powerful, open-source object-relational database system with a strong reputation for reliability, feature robustness, and performance. It has been under active development for over 35 years and has earned a strong reputation for its proven architecture, data integrity, and extensibility.

### Key Features

- **ACID Compliance**: Full support for transactions and data integrity
- **Advanced Data Types**: JSON, arrays, hstore, geometric types, and more
- **Extensibility**: Create custom functions, data types, and operators
- **Full-Text Search**: Built-in text search capabilities
- **Concurrent Access**: Multi-Version Concurrency Control (MVCC)
- **Foreign Data Wrappers**: Query external data sources as tables
- **Replication**: Streaming replication and logical replication
- **Window Functions**: Comprehensive support for analytical queries

## Getting Started

### Installation

::: code-group

```bash [Ubuntu/Debian]
sudo apt update
sudo apt install postgresql postgresql-contrib
```

```bash [macOS (Homebrew)]
brew install postgresql@15
brew services start postgresql@15
```

```bash [Docker]
docker run --name postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d postgres:15
```

:::

### Connecting

```bash
# Connect to default database
psql -U postgres

# Connect to specific database
psql -U username -d database_name -h localhost

# Connection string
psql "postgresql://username:password@localhost:5432/database_name"
```

## PostgreSQL-Specific Features

### Arrays

```sql
-- Create table with array column
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  tags TEXT[]
);

-- Insert array data
INSERT INTO products (name, tags)
VALUES ('Laptop', ARRAY['electronics', 'computer', 'portable']);

-- Query array data
SELECT * FROM products WHERE 'electronics' = ANY(tags);

-- Array functions
SELECT
  name,
  array_length(tags, 1) as tag_count,
  unnest(tags) as individual_tag
FROM products;
```

### JSON and JSONB

```sql
-- Create table with JSONB column
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  profile JSONB
);

-- Insert JSON data
INSERT INTO users (username, profile)
VALUES (
  'john_doe',
  '{"age": 30, "city": "New York", "interests": ["coding", "gaming"]}'::jsonb
);

-- Query JSON data
SELECT * FROM users WHERE profile->>'city' = 'New York';

-- JSON operators
SELECT
  username,
  profile->'age' as age,              -- Returns JSON
  profile->>'age' as age_text,        -- Returns text
  profile->'interests'->0 as first_interest
FROM users;

-- JSONB contains operator
SELECT * FROM users WHERE profile @> '{"city": "New York"}';

-- JSON path queries
SELECT
  username,
  jsonb_path_query(profile, '$.interests[*]') as interests
FROM users;
```

### Full-Text Search

```sql
-- Create table with tsvector column
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  search_vector tsvector
);

-- Update search vector
UPDATE articles
SET search_vector =
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

-- Create GIN index for fast searching
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Search
SELECT title, ts_rank(search_vector, query) as rank
FROM articles, to_tsquery('english', 'postgresql & database') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Highlight search results
SELECT
  title,
  ts_headline('english', content, query) as excerpt
FROM articles, to_tsquery('english', 'postgresql') query
WHERE search_vector @@ query;
```

### Common Table Expressions (CTEs) with Recursion

```sql
-- Recursive CTE for hierarchical data
WITH RECURSIVE employee_hierarchy AS (
  -- Base case: top-level employees
  SELECT
    employee_id,
    employee_name,
    manager_id,
    1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive case
  SELECT
    e.employee_id,
    e.employee_name,
    e.manager_id,
    eh.level + 1
  FROM employees e
  INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy ORDER BY level, employee_name;
```

### Window Functions

```sql
-- Advanced window functions
SELECT
  employee_name,
  department,
  salary,
  -- Ranking functions
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank,
  -- Distribution functions
  PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary) as percent_rank,
  CUME_DIST() OVER (PARTITION BY department ORDER BY salary) as cumulative_dist,
  -- Offset functions
  LAG(salary) OVER (PARTITION BY department ORDER BY salary) as prev_salary,
  LEAD(salary) OVER (PARTITION BY department ORDER BY salary) as next_salary,
  -- Aggregate functions
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees;
```

### RETURNING Clause

```sql
-- INSERT with RETURNING
INSERT INTO products (name, price)
VALUES ('New Product', 99.99)
RETURNING id, name, created_at;

-- UPDATE with RETURNING
UPDATE products
SET price = price * 1.1
WHERE category = 'electronics'
RETURNING id, name, price;

-- DELETE with RETURNING
DELETE FROM old_records
WHERE created_at < '2020-01-01'
RETURNING id, created_at;
```

### UPSERT (INSERT ... ON CONFLICT)

```sql
-- Insert or update if conflict
INSERT INTO users (email, username, last_login)
VALUES ('john@example.com', 'john_doe', NOW())
ON CONFLICT (email)
DO UPDATE SET
  last_login = EXCLUDED.last_login,
  login_count = users.login_count + 1;

-- Insert or do nothing if conflict
INSERT INTO users (email, username)
VALUES ('john@example.com', 'john_doe')
ON CONFLICT (email) DO NOTHING;
```

### Table Partitioning

```sql
-- Create partitioned table
CREATE TABLE measurements (
  id SERIAL,
  measurement_date DATE NOT NULL,
  temperature DECIMAL,
  humidity DECIMAL
) PARTITION BY RANGE (measurement_date);

-- Create partitions
CREATE TABLE measurements_2024_q1 PARTITION OF measurements
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE measurements_2024_q2 PARTITION OF measurements
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Queries automatically use appropriate partition
SELECT * FROM measurements
WHERE measurement_date BETWEEN '2024-02-01' AND '2024-02-29';
```

### Advanced Indexing

```sql
-- B-tree index (default)
CREATE INDEX idx_users_email ON users(email);

-- Partial index
CREATE INDEX idx_active_users ON users(email)
WHERE status = 'active';

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Multi-column index
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- GIN index for full-text search
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- GiST index for geometric data
CREATE INDEX idx_locations ON places USING GIST(location);

-- BRIN index for large sequential data
CREATE INDEX idx_logs_timestamp ON logs USING BRIN(timestamp);
```

## Performance Optimization

### EXPLAIN and ANALYZE

```sql
-- Show query plan
EXPLAIN SELECT * FROM users WHERE email = 'john@example.com';

-- Show query plan with actual execution stats
EXPLAIN ANALYZE
SELECT
  u.username,
  COUNT(o.order_id) as order_count
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.username;

-- Show detailed query plan
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM large_table WHERE indexed_column = 'value';
```

### Vacuum and Analyze

```sql
-- Update table statistics
ANALYZE users;

-- Clean up dead tuples
VACUUM users;

-- Full vacuum (reclaims space but locks table)
VACUUM FULL users;

-- Vacuum and analyze together
VACUUM ANALYZE users;
```

### Query Optimization Tips

```sql
-- Use EXISTS instead of IN for better performance with large datasets
-- ❌ Slower with large subqueries
SELECT * FROM customers
WHERE customer_id IN (SELECT customer_id FROM large_orders_table);

-- ✅ Faster
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM large_orders_table o WHERE o.customer_id = c.customer_id);

-- Use specific columns instead of SELECT *
-- ❌ Retrieves unnecessary data
SELECT * FROM users;

-- ✅ Only retrieve needed columns
SELECT user_id, username, email FROM users;

-- Use LIMIT for pagination
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

## Data Types

### Numeric Types

| Type | Range | Description |
|------|-------|-------------|
| SMALLINT | -32768 to 32767 | 2-byte integer |
| INTEGER | -2147483648 to 2147483647 | 4-byte integer |
| BIGINT | -9223372036854775808 to 9223372036854775807 | 8-byte integer |
| DECIMAL(p,s) | Up to 131072 digits | Exact numeric |
| NUMERIC(p,s) | Up to 131072 digits | Exact numeric (same as DECIMAL) |
| REAL | 6 decimal digits precision | 4-byte float |
| DOUBLE PRECISION | 15 decimal digits precision | 8-byte float |
| SERIAL | 1 to 2147483647 | Auto-incrementing integer |
| BIGSERIAL | 1 to 9223372036854775807 | Auto-incrementing bigint |

### String Types

| Type | Description |
|------|-------------|
| VARCHAR(n) | Variable-length with limit |
| CHAR(n) | Fixed-length, blank padded |
| TEXT | Variable unlimited length |

### Date/Time Types

| Type | Description | Example |
|------|-------------|---------|
| DATE | Date only | '2024-01-15' |
| TIME | Time only | '14:30:00' |
| TIMESTAMP | Date and time | '2024-01-15 14:30:00' |
| TIMESTAMPTZ | Timestamp with timezone | '2024-01-15 14:30:00+00' |
| INTERVAL | Time interval | '1 day 2 hours' |

### Other Useful Types

- **UUID**: Universally unique identifier
- **BOOLEAN**: True/false
- **BYTEA**: Binary data
- **ARRAY**: Array of any data type
- **JSON/JSONB**: JSON data (JSONB is binary, faster)
- **HSTORE**: Key-value pairs
- **Geometric**: POINT, LINE, POLYGON, etc.
- **Network**: INET, CIDR, MACADDR

## Common Operations

### Database Management

```sql
-- Create database
CREATE DATABASE myapp;

-- Drop database
DROP DATABASE myapp;

-- List databases
\l

-- Connect to database
\c myapp
```

### Schema Management

```sql
-- Create schema
CREATE SCHEMA sales;

-- Set search path
SET search_path TO sales, public;

-- Create table in schema
CREATE TABLE sales.orders (
  id SERIAL PRIMARY KEY,
  amount DECIMAL
);
```

### User Management

```sql
-- Create user
CREATE USER myuser WITH PASSWORD 'securepassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE myapp TO myuser;
GRANT SELECT, INSERT, UPDATE ON TABLE users TO myuser;

-- Revoke privileges
REVOKE INSERT ON TABLE users FROM myuser;

-- Change password
ALTER USER myuser WITH PASSWORD 'newpassword';
```

## PostgreSQL vs Other Databases

<SQLComparison :dialects="['postgresql', 'mysql', 'sqlserver']" />

| Feature | PostgreSQL | MySQL | SQL Server |
|---------|------------|-------|------------|
| License | Open Source (PostgreSQL) | Open Source (GPL) / Commercial | Commercial |
| ACID Compliance | Full | Full (InnoDB) | Full |
| JSON Support | Native JSONB | Native JSON | Native JSON |
| Full-Text Search | Built-in | Built-in | Built-in |
| Window Functions | Full support | Full (8.0+) | Full support |
| CTEs | Recursive supported | Recursive (8.0+) | Recursive supported |
| Table Partitioning | Declarative | Declarative | Declarative |
| Replication | Streaming, Logical | Async, Semi-sync | Always On, Mirroring |
| Extensions | Rich ecosystem | Limited | CLR integration |

## Best Practices

### 1. Use Appropriate Data Types

```sql
-- ✅ Use specific types
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ Avoid overly generic types
CREATE TABLE users (
  id TEXT,
  email TEXT,
  created_at TEXT
);
```

### 2. Add Constraints

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
  total DECIMAL(10,2) CHECK (total >= 0)
);
```

### 3. Use Indexes Strategically

```sql
-- Index foreign keys
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Index frequently filtered columns
CREATE INDEX idx_orders_status ON orders(status);

-- Use partial indexes for specific queries
CREATE INDEX idx_pending_orders ON orders(order_date)
WHERE status = 'pending';
```

### 4. Enable Connection Pooling

Use connection pooling (PgBouncer, pgpool-II) for better performance in production environments.

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [CTEs](/concepts/ctes/) - Common Table Expressions
- [Indexes](/concepts/indexes/) - Index optimization
- [Performance](/concepts/performance/) - Query optimization
- [MySQL](/databases/mysql/) - Comparison with MySQL
- [SQL Server](/databases/sqlserver/) - Comparison with SQL Server
