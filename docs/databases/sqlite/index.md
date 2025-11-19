---
title: SQLite
description: Comprehensive guide to SQLite - Self-contained, serverless, zero-configuration database engine
difficulty: beginner
tags: [sqlite, embedded, serverless, database]
---

# SQLite

## Overview

SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured SQL database engine. SQLite is the most used database engine in the world, embedded in all mobile phones, most computers, and countless other applications that people use every day.

### Key Features

- **Serverless**: No separate server process; database reads and writes directly to disk files
- **Zero Configuration**: No setup or administration needed
- **Self-Contained**: Single library with minimal external dependencies
- **Cross-Platform**: Works on Unix, Windows, macOS, iOS, Android, and more
- **Single File**: Entire database stored in a single cross-platform file
- **ACID Compliant**: Full support for transactions
- **Lightweight**: Small memory footprint (less than 500KB)
- **Public Domain**: No licensing fees or restrictions
- **Stable**: Backwards compatible to version 3.0.0 (2004)
- **Reliable**: Extensive testing (100% branch coverage)

## Getting Started

### Installation

::: code-group

```bash [Ubuntu/Debian]
# Install SQLite command-line tool
sudo apt-get update
sudo apt-get install sqlite3

# Verify installation
sqlite3 --version
```

```bash [macOS]
# SQLite comes pre-installed on macOS
sqlite3 --version

# Or install via Homebrew for latest version
brew install sqlite3
```

```bash [Windows]
# Download from https://www.sqlite.org/download.html
# Extract sqlite-tools-win32-x86-*.zip
# Add to PATH or run from directory

# Or install via Chocolatey
choco install sqlite

# Verify
sqlite3 --version
```

```bash [From Source]
# Download amalgamation from https://www.sqlite.org/download.html
wget https://www.sqlite.org/2024/sqlite-amalgamation-3450000.zip
unzip sqlite-amalgamation-3450000.zip
cd sqlite-amalgamation-3450000

# Compile
gcc -o sqlite3 shell.c sqlite3.c -lpthread -ldl
```

:::

### Creating and Connecting

```bash
# Create/open a database file
sqlite3 myapp.db

# Create in-memory database (temporary)
sqlite3 :memory:

# Open with specific options
sqlite3 -echo -header -column myapp.db

# Execute SQL from command line
sqlite3 myapp.db "SELECT * FROM users;"

# Execute SQL from file
sqlite3 myapp.db < schema.sql

# Export database to SQL
sqlite3 myapp.db .dump > backup.sql
```

### SQLite Shell Commands

```sql
-- Show all dot commands
.help

-- Show databases
.databases

-- Show tables
.tables

-- Show schema for all tables
.schema

-- Show schema for specific table
.schema users

-- Show indexes
.indexes

-- Change output mode
.mode csv          -- CSV format
.mode column       -- Column format
.mode json         -- JSON format
.mode markdown     -- Markdown table format
.mode table        -- ASCII table format
.mode list         -- List format (default)

-- Enable headers
.headers on

-- Set column width
.width 20 10 30

-- Export to CSV
.headers on
.mode csv
.output users.csv
SELECT * FROM users;
.output stdout

-- Import from CSV
.mode csv
.import users.csv users

-- Show execution time
.timer on

-- Show query plan
.eqp on

-- Save output to file
.output results.txt
SELECT * FROM users;
.output stdout

-- Read SQL from file
.read script.sql

-- Backup database
.backup backup.db

-- Restore database
.restore backup.db

-- Exit
.quit
```

## SQLite-Specific Features

### Data Types and Type Affinity

SQLite uses dynamic typing with type affinity:

```sql
-- Storage classes: NULL, INTEGER, REAL, TEXT, BLOB

-- Type affinities: TEXT, NUMERIC, INTEGER, REAL, BLOB
CREATE TABLE flexible_types (
    id INTEGER PRIMARY KEY,
    text_col TEXT,           -- Affinity: TEXT
    numeric_col NUMERIC,     -- Affinity: NUMERIC
    int_col INTEGER,         -- Affinity: INTEGER
    real_col REAL,           -- Affinity: REAL
    blob_col BLOB,           -- Affinity: BLOB
    any_col                  -- Affinity: BLOB (no type specified)
);

-- SQLite is flexible with types
INSERT INTO flexible_types (id, text_col, numeric_col)
VALUES (1, 'hello', 123);      -- Works fine

INSERT INTO flexible_types (id, text_col, numeric_col)
VALUES (2, 'world', 'not a number');  -- Also works!

-- Query shows dynamic typing
SELECT typeof(text_col), typeof(numeric_col)
FROM flexible_types;

-- Strict tables (SQLite 3.37+)
CREATE TABLE strict_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    salary REAL
) STRICT;

-- Now type violations cause errors
-- INSERT INTO strict_types VALUES (1, 123, 'invalid', 50000); -- Error!
```

### AUTOINCREMENT vs INTEGER PRIMARY KEY

```sql
-- INTEGER PRIMARY KEY (recommended)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,  -- Auto-incrementing, can reuse deleted IDs
    username TEXT NOT NULL
);

-- AUTOINCREMENT (prevents ID reuse)
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Never reuses IDs
    event_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Check last inserted rowid
INSERT INTO users (username) VALUES ('alice');
SELECT last_insert_rowid();

-- Manual ID insertion
INSERT INTO users (id, username) VALUES (100, 'bob');
```

### WITHOUT ROWID Tables

```sql
-- Normal table (has implicit rowid)
CREATE TABLE normal_table (
    id INTEGER PRIMARY KEY,
    data TEXT
);

-- WITHOUT ROWID table (saves space, faster for certain queries)
CREATE TABLE efficient_table (
    id INTEGER PRIMARY KEY,
    category TEXT,
    data TEXT
) WITHOUT ROWID;

-- Best for tables with:
-- - Non-integer or composite primary keys
-- - Small rows
-- - Primarily accessed by primary key

CREATE TABLE composite_key (
    user_id INTEGER,
    post_id INTEGER,
    liked_at DATETIME,
    PRIMARY KEY (user_id, post_id)
) WITHOUT ROWID;
```

### Partial Indexes

```sql
-- Index only active users
CREATE INDEX idx_active_users ON users(username)
WHERE status = 'active';

-- Index only recent orders
CREATE INDEX idx_recent_orders ON orders(order_date)
WHERE order_date >= date('now', '-30 days');

-- Index only non-null values
CREATE INDEX idx_email ON users(email)
WHERE email IS NOT NULL;

-- Smaller, faster indexes for specific queries
SELECT * FROM users
WHERE status = 'active' AND username = 'alice';  -- Uses idx_active_users
```

### Generated Columns (3.31+)

```sql
-- Virtual columns (computed on-the-fly)
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price REAL,
    tax_rate REAL DEFAULT 0.08,
    price_with_tax REAL GENERATED ALWAYS AS (price * (1 + tax_rate)) VIRTUAL
);

-- Stored columns (computed and stored)
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED
);

-- Insert data (generated columns calculated automatically)
INSERT INTO products (name, price) VALUES ('Laptop', 1000);

SELECT name, price, price_with_tax FROM products;

-- Can create indexes on generated columns
CREATE INDEX idx_full_name ON employees(full_name);
```

### Common Table Expressions (CTEs)

```sql
-- Simple CTE
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 100000
)
SELECT * FROM high_earners WHERE department = 'Engineering';

-- Recursive CTE for hierarchical data
WITH RECURSIVE employee_hierarchy AS (
    -- Base case: top-level managers
    SELECT id, name, manager_id, 1 as level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT e.id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy ORDER BY level, name;

-- Generate series (SQLite 3.9+)
WITH RECURSIVE cnt(x) AS (
    SELECT 1
    UNION ALL
    SELECT x + 1 FROM cnt WHERE x < 10
)
SELECT x FROM cnt;

-- Date range generation
WITH RECURSIVE dates(date) AS (
    SELECT date('2024-01-01')
    UNION ALL
    SELECT date(date, '+1 day')
    FROM dates
    WHERE date < '2024-01-31'
)
SELECT date FROM dates;
```

### Window Functions (3.25+)

```sql
-- Ranking functions
SELECT
    employee_name,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank,
    NTILE(4) OVER (PARTITION BY department ORDER BY salary) as quartile
FROM employees;

-- Offset functions
SELECT
    employee_name,
    hire_date,
    salary,
    LAG(salary, 1) OVER (ORDER BY hire_date) as prev_salary,
    LEAD(salary, 1) OVER (ORDER BY hire_date) as next_salary,
    FIRST_VALUE(salary) OVER (ORDER BY hire_date) as first_salary,
    LAST_VALUE(salary) OVER (
        ORDER BY hire_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_salary
FROM employees;

-- Aggregate window functions
SELECT
    date,
    revenue,
    SUM(revenue) OVER (ORDER BY date) as running_total,
    AVG(revenue) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7_day,
    revenue - LAG(revenue) OVER (ORDER BY date) as daily_change
FROM daily_sales
ORDER BY date;
```

### Full-Text Search (FTS5)

```sql
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE documents_fts USING fts5(
    title,
    content,
    author,
    tokenize = 'porter'  -- Porter stemming
);

-- Insert data
INSERT INTO documents_fts (title, content, author)
VALUES ('SQLite Guide', 'Complete guide to SQLite database', 'John Doe');

-- Simple search
SELECT * FROM documents_fts
WHERE documents_fts MATCH 'sqlite';

-- Phrase search
SELECT * FROM documents_fts
WHERE documents_fts MATCH '"complete guide"';

-- Boolean operators
SELECT * FROM documents_fts
WHERE documents_fts MATCH 'sqlite AND database';

SELECT * FROM documents_fts
WHERE documents_fts MATCH 'sqlite OR postgres';

SELECT * FROM documents_fts
WHERE documents_fts MATCH 'database NOT oracle';

-- Column-specific search
SELECT * FROM documents_fts
WHERE documents_fts MATCH 'title:sqlite';

-- Proximity search (words within 5 positions)
SELECT * FROM documents_fts
WHERE documents_fts MATCH 'NEAR(complete guide, 5)';

-- Ranking results
SELECT *, rank FROM documents_fts
WHERE documents_fts MATCH 'sqlite'
ORDER BY rank;

-- Highlight matches
SELECT highlight(documents_fts, 1, '[', ']') as highlighted_content
FROM documents_fts
WHERE documents_fts MATCH 'sqlite';

-- Snippet extraction
SELECT snippet(documents_fts, 1, '[', ']', '...', 32) as snippet
FROM documents_fts
WHERE documents_fts MATCH 'database';
```

### JSON Support (3.38+)

```sql
-- JSON functions
CREATE TABLE api_logs (
    id INTEGER PRIMARY KEY,
    request_data TEXT,  -- JSON stored as TEXT
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert JSON
INSERT INTO api_logs (request_data) VALUES ('{
    "user_id": 123,
    "action": "login",
    "ip": "192.168.1.1",
    "metadata": {
        "browser": "Chrome",
        "os": "Windows"
    }
}');

-- Extract JSON values
SELECT
    id,
    json_extract(request_data, '$.user_id') as user_id,
    json_extract(request_data, '$.action') as action,
    json_extract(request_data, '$.metadata.browser') as browser
FROM api_logs;

-- Shorter syntax (->)
SELECT
    request_data -> '$.user_id' as user_id,
    request_data ->> '$.action' as action  -- ->> removes quotes
FROM api_logs;

-- Query JSON arrays
INSERT INTO api_logs (request_data) VALUES ('{
    "tags": ["important", "urgent", "review"]
}');

SELECT json_each.value
FROM api_logs, json_each(request_data, '$.tags')
WHERE id = 2;

-- JSON aggregation
SELECT json_group_array(username) as all_users
FROM users;

SELECT json_group_object(id, username) as user_map
FROM users;

-- Validate JSON
SELECT json_valid('{"valid": true}');  -- Returns 1
SELECT json_valid('invalid json');     -- Returns 0

-- Pretty print JSON
SELECT json_pretty(request_data) FROM api_logs;

-- Modify JSON
UPDATE api_logs
SET request_data = json_set(request_data, '$.processed', 1)
WHERE id = 1;

-- Insert into JSON
UPDATE api_logs
SET request_data = json_insert(request_data, '$.timestamp', datetime('now'))
WHERE id = 1;

-- Remove from JSON
UPDATE api_logs
SET request_data = json_remove(request_data, '$.metadata')
WHERE id = 1;
```

### UPSERT (3.24+)

```sql
-- Insert or update on conflict
CREATE TABLE user_stats (
    user_id INTEGER PRIMARY KEY,
    login_count INTEGER DEFAULT 0,
    last_login DATETIME
);

-- UPSERT: increment login count or create new record
INSERT INTO user_stats (user_id, login_count, last_login)
VALUES (1, 1, datetime('now'))
ON CONFLICT(user_id) DO UPDATE SET
    login_count = login_count + 1,
    last_login = datetime('now');

-- Multiple conflict targets
CREATE TABLE unique_email (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    updated_at DATETIME
);

INSERT INTO unique_email (email, username, updated_at)
VALUES ('user@example.com', 'johndoe', datetime('now'))
ON CONFLICT(email) DO UPDATE SET
    updated_at = datetime('now');

-- DO NOTHING on conflict
INSERT INTO user_stats (user_id, login_count, last_login)
VALUES (1, 1, datetime('now'))
ON CONFLICT(user_id) DO NOTHING;
```

### RETURNING Clause (3.35+)

```sql
-- INSERT with RETURNING
INSERT INTO users (username, email)
VALUES ('alice', 'alice@example.com')
RETURNING id, username, created_at;

-- UPDATE with RETURNING
UPDATE products
SET price = price * 1.1
WHERE category = 'Electronics'
RETURNING id, name, price;

-- DELETE with RETURNING
DELETE FROM old_logs
WHERE created_at < date('now', '-30 days')
RETURNING id, event_type, created_at;

-- Use in CTE
WITH deleted AS (
    DELETE FROM temp_data
    WHERE processed = 1
    RETURNING *
)
INSERT INTO archive_data SELECT * FROM deleted;
```

## Advanced Features

### Transactions and Savepoints

```sql
-- Begin transaction
BEGIN TRANSACTION;

-- Or specify type
BEGIN DEFERRED TRANSACTION;   -- Default, lock when needed
BEGIN IMMEDIATE TRANSACTION;  -- Lock immediately
BEGIN EXCLUSIVE TRANSACTION;  -- Exclusive lock

-- Savepoints
BEGIN TRANSACTION;

INSERT INTO users (username) VALUES ('alice');

SAVEPOINT sp1;

INSERT INTO users (username) VALUES ('bob');

SAVEPOINT sp2;

INSERT INTO users (username) VALUES ('charlie');

-- Rollback to savepoint
ROLLBACK TO sp2;  -- charlie not inserted

-- Release savepoint
RELEASE sp1;

COMMIT;

-- Nested transactions using savepoints
BEGIN TRANSACTION;
    INSERT INTO accounts (balance) VALUES (1000);

    SAVEPOINT nested1;
        UPDATE accounts SET balance = balance - 100 WHERE id = 1;
        -- Error occurred, rollback nested transaction
        ROLLBACK TO nested1;

    -- Main transaction continues
    INSERT INTO audit_log (event) VALUES ('account created');
COMMIT;
```

### Triggers

```sql
-- BEFORE INSERT trigger
CREATE TRIGGER validate_user_before_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN NEW.email NOT LIKE '%@%'
BEGIN
    SELECT RAISE(ABORT, 'Invalid email format');
END;

-- AFTER INSERT trigger
CREATE TRIGGER create_user_profile
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_profiles (user_id, created_at)
    VALUES (NEW.id, datetime('now'));
END;

-- BEFORE UPDATE trigger
CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now')
    WHERE id = NEW.id;
END;

-- AFTER DELETE trigger (audit)
CREATE TRIGGER audit_user_deletion
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (event_type, user_id, event_data, created_at)
    VALUES ('user_deleted', OLD.id, json_object('username', OLD.username), datetime('now'));
END;

-- INSTEAD OF trigger (for views)
CREATE VIEW active_users AS
SELECT * FROM users WHERE status = 'active';

CREATE TRIGGER delete_active_user
INSTEAD OF DELETE ON active_users
FOR EACH ROW
BEGIN
    UPDATE users SET status = 'deleted', deleted_at = datetime('now')
    WHERE id = OLD.id;
END;

-- Conditional trigger
CREATE TRIGGER high_value_order_alert
AFTER INSERT ON orders
FOR EACH ROW
WHEN NEW.total_amount > 10000
BEGIN
    INSERT INTO alerts (alert_type, order_id, created_at)
    VALUES ('high_value_order', NEW.id, datetime('now'));
END;

-- List triggers
SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger';

-- Drop trigger
DROP TRIGGER IF EXISTS audit_user_deletion;
```

### Views

```sql
-- Simple view
CREATE VIEW active_users AS
SELECT id, username, email, created_at
FROM users
WHERE status = 'active';

-- Use view
SELECT * FROM active_users;

-- View with joins
CREATE VIEW user_orders AS
SELECT
    u.id as user_id,
    u.username,
    o.id as order_id,
    o.total_amount,
    o.created_at
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- Materialized view simulation
CREATE TABLE materialized_user_stats AS
SELECT
    user_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_spent
FROM orders
GROUP BY user_id;

-- Refresh materialized view
DELETE FROM materialized_user_stats;
INSERT INTO materialized_user_stats
SELECT user_id, COUNT(*), SUM(total_amount)
FROM orders
GROUP BY user_id;

-- Drop view
DROP VIEW IF EXISTS active_users;
```

### Indexes

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Partial index (SQLite specific)
CREATE INDEX idx_active_users ON users(username)
WHERE status = 'active';

-- Expression index
CREATE INDEX idx_users_lower_email ON users(lower(email));

-- Descending index
CREATE INDEX idx_products_price_desc ON products(price DESC);

-- Covering index
CREATE INDEX idx_users_lookup ON users(email, username, created_at);

-- Analyze index usage
EXPLAIN QUERY PLAN
SELECT * FROM users WHERE email = 'alice@example.com';

-- List indexes
SELECT name, sql FROM sqlite_master
WHERE type = 'index' AND tbl_name = 'users';

-- Drop index
DROP INDEX IF EXISTS idx_users_email;

-- Reindex
REINDEX;
REINDEX users;
REINDEX idx_users_email;
```

### Attached Databases

```sql
-- Attach another database
ATTACH DATABASE 'other.db' AS other;

-- Query across databases
SELECT u.username, o.total_amount
FROM main.users u
INNER JOIN other.orders o ON u.id = o.user_id;

-- Copy table between databases
CREATE TABLE other.users AS SELECT * FROM main.users;

-- List attached databases
PRAGMA database_list;

-- Detach database
DETACH DATABASE other;
```

## Performance Optimization

### Query Planning

```sql
-- View query plan
EXPLAIN QUERY PLAN
SELECT * FROM users WHERE email = 'alice@example.com';

-- Analyze query performance
.eqp on
SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;
.eqp off

-- Analyze database
ANALYZE;

-- Analyze specific table
ANALYZE users;

-- View statistics
SELECT * FROM sqlite_stat1;
```

### Pragma Statements

```sql
-- View all pragmas
PRAGMA compile_options;

-- Journal mode
PRAGMA journal_mode;           -- Check current mode
PRAGMA journal_mode = WAL;     -- Write-Ahead Logging (faster)
PRAGMA journal_mode = DELETE;  -- Default
PRAGMA journal_mode = TRUNCATE;
PRAGMA journal_mode = PERSIST;
PRAGMA journal_mode = MEMORY;
PRAGMA journal_mode = OFF;     -- Dangerous!

-- Synchronous mode
PRAGMA synchronous;
PRAGMA synchronous = FULL;     -- Safest (default)
PRAGMA synchronous = NORMAL;   -- Balanced
PRAGMA synchronous = OFF;      -- Fastest but risky

-- Cache size
PRAGMA cache_size;
PRAGMA cache_size = 10000;     -- 10000 pages

-- Page size (must set before creating tables)
PRAGMA page_size;
PRAGMA page_size = 4096;

-- Memory mapped I/O
PRAGMA mmap_size = 268435456;  -- 256MB

-- Temp store
PRAGMA temp_store = MEMORY;    -- Store temp tables in memory

-- Auto vacuum
PRAGMA auto_vacuum;
PRAGMA auto_vacuum = FULL;     -- Reclaim space automatically
PRAGMA auto_vacuum = INCREMENTAL;
PRAGMA auto_vacuum = NONE;

-- Foreign keys
PRAGMA foreign_keys;
PRAGMA foreign_keys = ON;

-- Secure delete
PRAGMA secure_delete = ON;     -- Overwrite deleted data

-- Database integrity
PRAGMA integrity_check;
PRAGMA quick_check;

-- Database info
PRAGMA database_list;
PRAGMA table_info(users);
PRAGMA index_list(users);
PRAGMA index_info(idx_users_email);

-- Optimize database
PRAGMA optimize;

-- Vacuum
VACUUM;
VACUUM INTO 'backup.db';
```

### Optimization Tips

```sql
-- Use prepared statements (prevents SQL injection, faster)
-- In application code:
-- stmt = db.prepare("SELECT * FROM users WHERE id = ?")
-- stmt.bind(1, user_id)
-- stmt.step()

-- Batch inserts with transactions
BEGIN TRANSACTION;
INSERT INTO logs (message) VALUES ('Log 1');
INSERT INTO logs (message) VALUES ('Log 2');
INSERT INTO logs (message) VALUES ('Log 3');
-- ... thousands more
COMMIT;

-- Use indexes wisely
-- ✅ Good: Query uses indexed column
SELECT * FROM users WHERE email = 'alice@example.com';

-- ❌ Bad: Function on indexed column prevents index use
SELECT * FROM users WHERE lower(email) = 'alice@example.com';

-- ✅ Better: Create expression index
CREATE INDEX idx_users_lower_email ON users(lower(email));

-- Use covering indexes to avoid table lookups
CREATE INDEX idx_user_covering ON users(email, username, created_at);
SELECT username, created_at FROM users WHERE email = 'alice@example.com';

-- Use partial indexes for filtered queries
CREATE INDEX idx_active_premium ON users(username)
WHERE status = 'active' AND account_type = 'premium';

-- Avoid SELECT *
-- ❌ Bad: Retrieves all columns
SELECT * FROM users;

-- ✅ Good: Only retrieve needed columns
SELECT id, username, email FROM users;

-- Use LIMIT for large result sets
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;

-- Use EXISTS instead of COUNT for existence checks
-- ❌ Slower
SELECT CASE WHEN (SELECT COUNT(*) FROM orders WHERE user_id = 1) > 0
    THEN 'Has orders' ELSE 'No orders' END;

-- ✅ Faster
SELECT CASE WHEN EXISTS (SELECT 1 FROM orders WHERE user_id = 1)
    THEN 'Has orders' ELSE 'No orders' END;
```

## Data Types

SQLite uses dynamic typing with type affinity. Here are the recommended type declarations:

### Integer Types

| Declaration | Affinity | Notes               |
| ----------- | -------- | ------------------- |
| INT         | INTEGER  | Recommended         |
| INTEGER     | INTEGER  | Recommended         |
| TINYINT     | INTEGER  | 1-byte in other DBs |
| SMALLINT    | INTEGER  | 2-byte in other DBs |
| MEDIUMINT   | INTEGER  | 3-byte in other DBs |
| BIGINT      | INTEGER  | 8-byte in other DBs |

### Text Types

| Declaration | Affinity | Notes             |
| ----------- | -------- | ----------------- |
| TEXT        | TEXT     | Recommended       |
| VARCHAR(n)  | TEXT     | Length is ignored |
| CHAR(n)     | TEXT     | Not fixed-length  |
| CLOB        | TEXT     | Character LOB     |

### Real (Floating Point) Types

| Declaration | Affinity | Notes               |
| ----------- | -------- | ------------------- |
| REAL        | REAL     | Recommended         |
| DOUBLE      | REAL     | 8-byte float        |
| FLOAT       | REAL     | 4-byte in other DBs |

### Numeric Types

| Declaration  | Affinity | Notes                           |
| ------------ | -------- | ------------------------------- |
| NUMERIC      | NUMERIC  | May store as INTEGER or REAL    |
| DECIMAL(p,s) | NUMERIC  | Decimal number                  |
| BOOLEAN      | NUMERIC  | 0 or 1                          |
| DATE         | NUMERIC  | Store as TEXT, REAL, or INTEGER |
| DATETIME     | NUMERIC  | Store as TEXT, REAL, or INTEGER |

### Blob Types

| Declaration          | Affinity | Notes       |
| -------------------- | -------- | ----------- |
| BLOB                 | BLOB     | Binary data |
| Any type with "BLOB" | BLOB     | -           |

### Date and Time

SQLite doesn't have dedicated date/time types. Use one of these:

```sql
-- TEXT: ISO8601 strings ("YYYY-MM-DD HH:MM:SS.SSS")
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    event_date TEXT DEFAULT (datetime('now'))
);

-- REAL: Julian day numbers
CREATE TABLE events_julian (
    id INTEGER PRIMARY KEY,
    event_date REAL DEFAULT (julianday('now'))
);

-- INTEGER: Unix timestamps
CREATE TABLE events_unix (
    id INTEGER PRIMARY KEY,
    event_timestamp INTEGER DEFAULT (unixepoch())
);

-- Date/time functions
SELECT
    date('now'),                          -- Current date
    time('now'),                          -- Current time
    datetime('now'),                      -- Current datetime
    julianday('now'),                     -- Julian day
    unixepoch(),                          -- Unix timestamp
    datetime('now', 'localtime'),         -- Local time
    date('now', '+1 day'),                -- Tomorrow
    date('now', '-1 month'),              -- Last month
    datetime('now', 'start of month'),    -- First of month
    datetime('now', 'start of year'),     -- First of year
    strftime('%Y-%m-%d %H:%M', 'now'),   -- Custom format
    strftime('%s', 'now')                 -- Unix timestamp
FROM dual;  -- Note: dual table doesn't exist, just using single row
SELECT date('now');  -- This works without FROM
```

## Common Operations

### Database Management

```sql
-- Create database (just create a file)
-- sqlite3 newdb.db

-- List all tables
SELECT name FROM sqlite_master WHERE type='table';

-- Table schema
SELECT sql FROM sqlite_master WHERE type='table' AND name='users';

-- Database size
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();

-- Compact database
VACUUM;

-- Copy database
VACUUM INTO 'backup.db';

-- Database integrity check
PRAGMA integrity_check;
```

### Table Management

```sql
-- Create table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT,
    CHECK (email LIKE '%@%'),
    CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Create table from query
CREATE TABLE archived_users AS
SELECT * FROM users WHERE status = 'inactive';

-- Rename table
ALTER TABLE users RENAME TO app_users;

-- Add column
ALTER TABLE users ADD COLUMN phone TEXT;

-- Rename column (3.25+)
ALTER TABLE users RENAME COLUMN phone TO phone_number;

-- Drop column (3.35+)
ALTER TABLE users DROP COLUMN phone_number;

-- Drop table
DROP TABLE IF EXISTS old_table;

-- Temporary table
CREATE TEMPORARY TABLE temp_results (
    id INTEGER PRIMARY KEY,
    result TEXT
);
```

### Constraints

```sql
-- Primary key
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT
);

-- Composite primary key
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    PRIMARY KEY (user_id, role_id)
);

-- Foreign key
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enable foreign keys (disabled by default)
PRAGMA foreign_keys = ON;

-- Unique constraint
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT,
    UNIQUE(username)
);

-- Not null constraint
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL
);

-- Check constraint
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL CHECK (price > 0),
    stock INTEGER CHECK (stock >= 0)
);

-- Default values
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
);
```

## SQLite vs Other Databases

| Feature              | SQLite                       | PostgreSQL          | MySQL                  | SQL Server      |
| -------------------- | ---------------------------- | ------------------- | ---------------------- | --------------- |
| **Architecture**     | Serverless, embedded         | Client-Server       | Client-Server          | Client-Server   |
| **File Storage**     | Single file                  | Multiple files      | Multiple files         | Multiple files  |
| **Configuration**    | Zero                         | Extensive           | Moderate               | Extensive       |
| **Concurrency**      | Limited (WAL helps)          | Excellent           | Good                   | Excellent       |
| **Max DB Size**      | 281 TB                       | Unlimited           | 64 TB                  | 524 PB          |
| **Typing**           | Dynamic                      | Static              | Static                 | Static          |
| **ALTER TABLE**      | Limited                      | Full support        | Good support           | Full support    |
| **License**          | Public Domain                | Open Source         | Open Source/Commercial | Commercial      |
| **Best For**         | Mobile, embedded, prototypes | Web apps, analytics | Web apps               | Enterprise apps |
| **Foreign Keys**     | Optional (off by default)    | Full support        | Full support           | Full support    |
| **Window Functions** | Yes (3.25+)                  | Yes                 | Yes (8.0+)             | Yes             |
| **JSON**             | Yes (3.38+)                  | JSONB (excellent)   | Yes                    | Yes             |
| **Full-Text**        | FTS5                         | Built-in            | Built-in               | Advanced        |

## Best Practices

### 1. Enable Foreign Keys

```sql
-- Enable at connection start
PRAGMA foreign_keys = ON;

-- Verify
PRAGMA foreign_keys;
```

### 2. Use WAL Mode for Better Concurrency

```sql
-- Enable Write-Ahead Logging
PRAGMA journal_mode = WAL;

-- Benefits:
-- - Readers don't block writers
-- - Writers don't block readers
-- - Faster in most cases
```

### 3. Use Transactions for Batch Operations

```sql
-- ❌ Slow: Each insert is a transaction
INSERT INTO logs (message) VALUES ('Log 1');
INSERT INTO logs (message) VALUES ('Log 2');
-- ... 10,000 more

-- ✅ Fast: One transaction for all inserts
BEGIN TRANSACTION;
INSERT INTO logs (message) VALUES ('Log 1');
INSERT INTO logs (message) VALUES ('Log 2');
-- ... 10,000 more
COMMIT;

-- Can be 100x faster!
```

### 4. Use Appropriate Column Types

```sql
-- ✅ Good
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    age INTEGER,
    balance REAL,
    is_active INTEGER  -- Boolean: 0 or 1
);

-- ❌ Avoid: All TEXT (loses type benefits)
CREATE TABLE users (
    id TEXT,
    username TEXT,
    age TEXT,
    balance TEXT
);
```

### 5. Create Indexes for Frequent Queries

```sql
-- Identify slow queries
.timer on
SELECT * FROM orders WHERE user_id = 123;

-- Add index
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Verify index usage
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE user_id = 123;
```

### 6. Regular Maintenance

```sql
-- Analyze for query optimizer
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Integrity check
PRAGMA integrity_check;

-- Optimize
PRAGMA optimize;
```

### 7. Handle Errors Properly

```sql
-- Use BEGIN to ensure atomic operations
BEGIN TRANSACTION;

-- Attempt operations
INSERT INTO accounts (id, balance) VALUES (1, 1000);
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If error, ROLLBACK
-- If success, COMMIT
COMMIT;
```

## Common Use Cases

### 1. Mobile Applications

```sql
-- Lightweight schema for mobile app
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending'
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    synced INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Query unsynced items
SELECT * FROM notes WHERE synced = 0;

-- Mark as synced
UPDATE notes SET synced = 1, sync_status = 'completed'
WHERE id IN (1, 2, 3);
```

### 2. Configuration Storage

```sql
-- Application settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- UPSERT settings
INSERT INTO settings (key, value)
VALUES ('theme', 'dark')
ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = datetime('now');

-- Retrieve setting
SELECT value FROM settings WHERE key = 'theme';
```

### 3. Local Cache

```sql
-- Cache table with TTL
CREATE TABLE cache (
    key TEXT PRIMARY KEY,
    value TEXT,
    expires_at TEXT
);

-- Store in cache
INSERT OR REPLACE INTO cache (key, value, expires_at)
VALUES ('user:123', '{"name":"Alice"}', datetime('now', '+1 hour'));

-- Retrieve from cache
SELECT value FROM cache
WHERE key = 'user:123'
  AND expires_at > datetime('now');

-- Clean expired cache
DELETE FROM cache WHERE expires_at <= datetime('now');
```

### 4. Testing and Prototyping

```sql
-- Quick prototype database
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price REAL
);

-- Seed test data
INSERT INTO products (name, price) VALUES
('Laptop', 999.99),
('Mouse', 29.99),
('Keyboard', 79.99);

-- Use in-memory for tests
-- sqlite3 :memory:
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="sqlite" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Comparison with PostgreSQL
- [MySQL](/databases/mysql/) - Comparison with MySQL
- [SQL Basics](/concepts/basics/) - SQL fundamentals
- [Joins](/concepts/joins/) - Join operations
- [Indexes](/concepts/indexes/) - Index optimization

## Resources

- [Official Documentation](https://www.sqlite.org/docs.html)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [DB Browser for SQLite](https://sqlitebrowser.org/) - GUI tool
- [SQLite Online](https://sqliteonline.com/) - Try SQLite in browser
- [When to Use SQLite](https://www.sqlite.org/whentouse.html)
- [SQLite CLI Documentation](https://www.sqlite.org/cli.html)
