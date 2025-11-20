---
title: ACID Properties
description: >-
  Comprehensive guide to ACID (Atomicity, Consistency, Isolation, Durability)
  transactions and BASE alternative for distributed systems
databases:
  - PostgreSQL
  - MySQL
  - SQL Server
  - Oracle
  - SQLite
  - BigQuery
  - Snowflake
  - DuckDB
difficulty: intermediate
tags:
  - concepts
  - acid
  - transactions
  - atomicity
  - consistency
  - isolation
  - durability
  - base
  - eventual-consistency
  - transaction-control
  - commit
  - rollback
  - savepoint
---

# ACID Properties

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Basic transaction control
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;

-- Transaction with rollback on error
BEGIN TRANSACTION;
  INSERT INTO orders (customer_id, total) VALUES (123, 500.00);
  INSERT INTO order_items (order_id, product_id, quantity)
    VALUES (LAST_INSERT_ID(), 456, 2);
  -- If any statement fails, ROLLBACK is automatic in most databases
COMMIT;

-- Using savepoints for partial rollback
BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 10 WHERE product_id = 1;
  SAVEPOINT sp1;
  UPDATE inventory SET quantity = quantity - 5 WHERE product_id = 2;
  ROLLBACK TO SAVEPOINT sp1;  -- Undo only product 2 change
  UPDATE inventory SET quantity = quantity - 3 WHERE product_id = 3;
COMMIT;

-- Setting isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
  SELECT * FROM accounts WHERE account_id = 1 FOR UPDATE;
  -- Perform operations...
COMMIT;

-- Read-only transaction (optimization)
START TRANSACTION READ ONLY;
  SELECT * FROM large_table WHERE condition;
COMMIT;
```

## Overview

ACID is a set of properties that guarantee database transactions are processed reliably, even in the face of errors, power failures, or concurrent access. ACID properties ensure data integrity and consistency in relational database systems.

**ACID stands for**:

- **Atomicity**: All operations in a transaction succeed or all fail
- **Consistency**: Database moves from one valid state to another
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed data is permanently saved

**Why ACID Matters**:

- **Data integrity**: Prevents partial updates and corruption
- **Reliability**: Guarantees data persists after system failures
- **Concurrency**: Allows multiple users to safely access data simultaneously
- **Trust**: Ensures financial, medical, and critical data remains accurate

**Trade-offs**:

- **Performance**: ACID compliance can reduce throughput
- **Scalability**: Strong consistency limits horizontal scaling
- **Complexity**: Proper transaction management requires careful design

## Atomicity

Atomicity ensures that a transaction is treated as a single, indivisible unit of work. Either all operations within the transaction complete successfully, or none of them do. There is no middle ground.

### How Atomicity Works

Databases achieve atomicity through:

- **Transaction logs**: Recording all changes before applying them
- **Rollback mechanisms**: Undoing changes if any operation fails
- **Two-phase commit**: For distributed transactions across databases

### Atomicity in Practice

```sql
-- ✅ Atomic money transfer
BEGIN TRANSACTION;
  -- Debit from account A
  UPDATE accounts
  SET balance = balance - 100
  WHERE account_id = 1 AND balance >= 100;

  -- Check if debit succeeded
  IF @@ROWCOUNT = 0 THEN
    ROLLBACK;
    -- Raise error: insufficient funds
  END IF;

  -- Credit to account B
  UPDATE accounts
  SET balance = balance + 100
  WHERE account_id = 2;

COMMIT;
-- Both updates happen, or neither does

-- ❌ Non-atomic operations (without transaction)
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
-- Power failure here = money disappears!
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
```

### Real-World Examples

```sql
-- Order processing with multiple tables
BEGIN TRANSACTION;
  -- Create order
  INSERT INTO orders (customer_id, order_date, total)
  VALUES (123, CURRENT_TIMESTAMP, 250.00);

  SET @order_id = LAST_INSERT_ID();

  -- Add order items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  VALUES
    (@order_id, 456, 2, 100.00),
    (@order_id, 789, 1, 50.00);

  -- Update inventory
  UPDATE products SET stock = stock - 2 WHERE product_id = 456;
  UPDATE products SET stock = stock - 1 WHERE product_id = 789;

  -- Update customer stats
  UPDATE customers
  SET total_orders = total_orders + 1,
      lifetime_value = lifetime_value + 250.00
  WHERE customer_id = 123;

COMMIT;
-- All tables updated together, or none at all
```

### Handling Errors

```sql
-- PostgreSQL with explicit error handling
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;

  -- Simulate error check
  IF (SELECT balance FROM accounts WHERE account_id = 1) < 0 THEN
    ROLLBACK;
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;

-- SQL Server with TRY...CATCH
BEGIN TRANSACTION;
BEGIN TRY
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

  -- Force error if first account is negative
  IF EXISTS (SELECT 1 FROM accounts WHERE account_id = 1 AND balance < 0)
    THROW 50001, 'Insufficient funds', 1;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION;
  THROW;
END CATCH;
```

### Savepoints for Partial Rollback

Savepoints allow you to create checkpoints within a transaction and rollback to specific points without aborting the entire transaction.

```sql
BEGIN TRANSACTION;
  -- Step 1: Create customer
  INSERT INTO customers (name, email) VALUES ('John Doe', 'john@example.com');
  SAVEPOINT after_customer;

  -- Step 2: Create address (might fail due to validation)
  INSERT INTO addresses (customer_id, street, city)
  VALUES (LAST_INSERT_ID(), '123 Main St', 'InvalidCity');

  -- Rollback just the address insert if validation fails
  ROLLBACK TO SAVEPOINT after_customer;

  -- Step 3: Try alternative address
  INSERT INTO addresses (customer_id, street, city)
  VALUES (LAST_INSERT_ID(), '123 Main St', 'Valid City');

COMMIT;
-- Customer and corrected address are saved
```

## Consistency

Consistency ensures that a transaction brings the database from one valid state to another, maintaining all defined rules, constraints, triggers, and cascades.

### Database Constraints

```sql
-- Primary key constraint
CREATE TABLE accounts (
  account_id INTEGER PRIMARY KEY,
  balance DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check constraint
CREATE TABLE accounts (
  account_id INTEGER PRIMARY KEY,
  balance DECIMAL(10, 2) NOT NULL CHECK (balance >= 0),
  account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings'))
);

-- Foreign key constraint
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Unique constraint
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL
);
```

### Consistency Enforcement

```sql
-- ✅ Consistent transaction
BEGIN TRANSACTION;
  -- This will succeed if balance remains >= 0
  UPDATE accounts
  SET balance = balance - 50
  WHERE account_id = 1;
  -- If balance goes negative, CHECK constraint fails, entire transaction rolls back
COMMIT;

-- ❌ Would violate consistency (prevented by constraint)
BEGIN TRANSACTION;
  UPDATE accounts SET balance = -100 WHERE account_id = 1;
  -- ERROR: Check constraint violation
  -- Transaction automatically rolled back
COMMIT;

-- ✅ Foreign key consistency
BEGIN TRANSACTION;
  -- Can only insert order for existing customer
  INSERT INTO orders (customer_id, total)
  VALUES (123, 100.00);
  -- If customer 123 doesn't exist, foreign key constraint fails
COMMIT;
```

### Application-Level Consistency

```sql
-- Maintain referential integrity across operations
BEGIN TRANSACTION;
  -- Delete customer
  DELETE FROM addresses WHERE customer_id = 123;
  DELETE FROM orders WHERE customer_id = 123;
  DELETE FROM customers WHERE customer_id = 123;
COMMIT;

-- Using CASCADE for automatic consistency
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  FOREIGN KEY (customer_id)
    REFERENCES customers(customer_id)
    ON DELETE CASCADE
);

-- Now deleting customer automatically deletes orders
BEGIN TRANSACTION;
  DELETE FROM customers WHERE customer_id = 123;
  -- Orders automatically deleted
COMMIT;
```

### Triggers for Business Rules

```sql
-- Ensure account balance never goes negative (alternative to CHECK)
CREATE TRIGGER prevent_negative_balance
BEFORE UPDATE ON accounts
FOR EACH ROW
BEGIN
  IF NEW.balance < 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Account balance cannot be negative';
  END IF;
END;

-- Automatically update summary table
CREATE TRIGGER update_customer_stats
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  UPDATE customer_statistics
  SET
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.total,
    last_order_date = NEW.order_date
  WHERE customer_id = NEW.customer_id;
END;
```

## Isolation

Isolation ensures that concurrent transactions execute independently without interfering with each other. Each transaction should be unaware of other concurrent transactions.

### Isolation Levels

SQL defines four standard isolation levels, each providing different trade-offs between consistency and performance:

| Level            | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
| ---------------- | ---------- | ------------------- | ------------ | ----------- |
| READ UNCOMMITTED | Yes        | Yes                 | Yes          | Fastest     |
| READ COMMITTED   | No         | Yes                 | Yes          | Fast        |
| REPEATABLE READ  | No         | No                  | Yes          | Slower      |
| SERIALIZABLE     | No         | No                  | No           | Slowest     |

### Isolation Problems

```sql
-- DIRTY READ: Reading uncommitted changes from another transaction
-- Transaction A
BEGIN TRANSACTION;
  UPDATE accounts SET balance = 1000 WHERE account_id = 1;
  -- Not committed yet!

-- Transaction B (with READ UNCOMMITTED)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN TRANSACTION;
  SELECT balance FROM accounts WHERE account_id = 1;
  -- Sees 1000, but Transaction A might rollback!
COMMIT;

-- Transaction A
ROLLBACK;  -- Transaction B read data that never existed!

-- NON-REPEATABLE READ: Same query returns different results
-- Transaction A
BEGIN TRANSACTION;
  SELECT balance FROM accounts WHERE account_id = 1;  -- Returns 500

-- Transaction B
BEGIN TRANSACTION;
  UPDATE accounts SET balance = 1000 WHERE account_id = 1;
COMMIT;

-- Transaction A
  SELECT balance FROM accounts WHERE account_id = 1;  -- Returns 1000!
COMMIT;

-- PHANTOM READ: New rows appear in repeated queries
-- Transaction A
BEGIN TRANSACTION;
  SELECT COUNT(*) FROM orders WHERE customer_id = 123;  -- Returns 5

-- Transaction B
BEGIN TRANSACTION;
  INSERT INTO orders (customer_id, total) VALUES (123, 100.00);
COMMIT;

-- Transaction A
  SELECT COUNT(*) FROM orders WHERE customer_id = 123;  -- Returns 6!
COMMIT;
```

### READ UNCOMMITTED

Lowest isolation level. Allows dirty reads. Rarely used in practice.

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN TRANSACTION;
  -- Can see uncommitted changes from other transactions
  SELECT * FROM accounts;
  -- Fastest but least reliable
COMMIT;

-- Use case: Approximate analytics where exact values don't matter
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT
  COUNT(*) as total_orders,
  SUM(total) as approx_revenue
FROM orders
WHERE order_date = CURRENT_DATE;
-- Fast count, exact value not critical
```

### READ COMMITTED

Default in most databases (PostgreSQL, Oracle, SQL Server). Prevents dirty reads.

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION;
  -- Only sees committed data
  SELECT balance FROM accounts WHERE account_id = 1;

  -- Another transaction can modify and commit between reads
  SELECT balance FROM accounts WHERE account_id = 1;
  -- Might get different value (non-repeatable read)
COMMIT;

-- Practical example: Banking transaction
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION;
  -- Check balance (reads only committed data)
  SELECT balance FROM accounts WHERE account_id = 1;

  -- Process withdrawal
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
COMMIT;
```

### REPEATABLE READ

Prevents dirty reads and non-repeatable reads. Default in MySQL/InnoDB.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION;
  SELECT balance FROM accounts WHERE account_id = 1;  -- Returns 500

  -- Other transactions can commit changes, but we won't see them
  SELECT balance FROM accounts WHERE account_id = 1;  -- Still returns 500

  -- But new rows can appear (phantom reads)
  SELECT COUNT(*) FROM accounts WHERE balance > 1000;
  -- Count might change if new accounts are inserted
COMMIT;

-- Practical example: Report generation
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION;
  -- Generate consistent report with stable reads
  SELECT customer_id, balance FROM accounts WHERE account_type = 'checking';

  -- Process each account
  -- Values remain stable throughout transaction
  SELECT customer_id, balance FROM accounts WHERE account_type = 'checking';
  -- Same results as first query
COMMIT;
```

### SERIALIZABLE

Highest isolation level. Prevents all anomalies. Transactions appear to execute serially.

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
  -- Complete isolation from other transactions
  SELECT SUM(balance) FROM accounts;

  -- No other transaction can modify these rows until we commit
  -- No phantom reads possible
  SELECT SUM(balance) FROM accounts;
  -- Guaranteed same result
COMMIT;

-- Practical example: End-of-day reconciliation
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
  -- Calculate totals
  SELECT
    COUNT(*) as account_count,
    SUM(balance) as total_balance,
    AVG(balance) as avg_balance
  FROM accounts;

  -- Record snapshot
  INSERT INTO daily_snapshots (snapshot_date, account_count, total_balance)
  VALUES (CURRENT_DATE, ...);

  -- Values guaranteed consistent
COMMIT;
```

### Locking for Isolation

```sql
-- SELECT ... FOR UPDATE: Lock rows for update
BEGIN TRANSACTION;
  SELECT balance
  FROM accounts
  WHERE account_id = 1
  FOR UPDATE;
  -- Row locked, other transactions must wait

  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
COMMIT;

-- SELECT ... FOR SHARE: Shared lock (allow reads, block writes)
BEGIN TRANSACTION;
  SELECT balance
  FROM accounts
  WHERE account_id = 1
  FOR SHARE;
  -- Others can read but not modify

  -- Use balance for calculation
COMMIT;

-- NOWAIT: Don't wait for locks
BEGIN TRANSACTION;
  SELECT balance
  FROM accounts
  WHERE account_id = 1
  FOR UPDATE NOWAIT;
  -- Error immediately if row is locked
COMMIT;

-- SKIP LOCKED: Skip locked rows
BEGIN TRANSACTION;
  SELECT job_id
  FROM job_queue
  WHERE status = 'pending'
  ORDER BY priority DESC
  LIMIT 10
  FOR UPDATE SKIP LOCKED;
  -- Get next available jobs, skip locked ones
  -- Useful for job queues with multiple workers
COMMIT;
```

### Optimistic vs Pessimistic Locking

```sql
-- Pessimistic locking: Lock immediately
BEGIN TRANSACTION;
  SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
  -- Row locked, no one else can modify

  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
COMMIT;

-- Optimistic locking: Check version before update
-- Add version column
ALTER TABLE inventory ADD COLUMN version INTEGER DEFAULT 1;

-- Application-level optimistic locking
BEGIN TRANSACTION;
  -- Read current version
  SELECT quantity, version FROM inventory WHERE product_id = 1;
  -- Returns: quantity=10, version=5

  -- Update only if version hasn't changed
  UPDATE inventory
  SET
    quantity = quantity - 1,
    version = version + 1
  WHERE product_id = 1 AND version = 5;

  -- Check if update succeeded
  IF @@ROWCOUNT = 0 THEN
    ROLLBACK;
    -- Retry or fail
  ELSE
    COMMIT;
  END IF;
```

## Durability

Durability guarantees that once a transaction is committed, it remains committed even in the event of system failures, crashes, or power outages.

### How Durability Works

Databases ensure durability through:

- **Write-Ahead Logging (WAL)**: Changes written to log before data files
- **Transaction logs**: Sequential log of all committed transactions
- **Checkpointing**: Periodic flushing of dirty pages to disk
- **Replication**: Copying data to multiple servers
- **RAID storage**: Redundant disk arrays

### Write-Ahead Logging (WAL)

```
Transaction Flow:
1. BEGIN TRANSACTION
2. Application makes changes → Written to WAL log
3. WAL log flushed to disk (fsync)
4. COMMIT returns success
5. Background process writes to data files (eventually)

On crash:
- WAL log is replayed to restore committed transactions
- Uncommitted transactions are discarded
```

### Commit Behavior

```sql
-- Synchronous commit (default): Wait for WAL flush
BEGIN TRANSACTION;
  INSERT INTO orders (customer_id, total) VALUES (123, 500.00);
COMMIT;  -- Waits for disk write, slower but durable

-- Asynchronous commit (PostgreSQL): Don't wait for WAL flush
SET LOCAL synchronous_commit = OFF;
BEGIN TRANSACTION;
  INSERT INTO logs (message) VALUES ('Low priority log entry');
COMMIT;  -- Returns immediately, faster but small window of data loss

-- Group commit: Database automatically batches commits for efficiency
-- Multiple concurrent transactions
-- Transaction 1
BEGIN; UPDATE accounts SET balance = balance - 100 WHERE account_id = 1; COMMIT;
-- Transaction 2
BEGIN; UPDATE accounts SET balance = balance + 50 WHERE account_id = 2; COMMIT;
-- Transaction 3
BEGIN; INSERT INTO logs (message) VALUES ('Event'); COMMIT;
-- Database flushes all three to disk together
```

### Durability Trade-offs

```sql
-- ✅ Maximum durability (slowest)
SET synchronous_commit = ON;
SET fsync = ON;
SET wal_sync_method = 'fsync';  -- PostgreSQL
-- Every commit waits for physical disk write

-- ⚖️ Balanced approach
SET synchronous_commit = ON;
SET commit_delay = 100;  -- Microseconds
-- Small delay to batch commits, good balance

-- ⚠️ Performance priority (risk of data loss)
SET synchronous_commit = OFF;
-- Fast commits, but up to wal_writer_delay of data loss on crash
-- Acceptable for non-critical data like analytics, logs

-- ❌ Dangerous (should never use in production)
SET fsync = OFF;
-- Fast but corruption risk, only for bulk loading
```

### Backup and Recovery

```sql
-- Point-in-time recovery (PostgreSQL)
-- Requires continuous WAL archiving
-- Restore to specific moment
pg_restore --target-time='2024-01-15 14:30:00'

-- Transaction log backups (SQL Server)
-- Full backup
BACKUP DATABASE mydb TO DISK = 'C:\backup\mydb_full.bak';

-- Transaction log backup (for point-in-time recovery)
BACKUP LOG mydb TO DISK = 'C:\backup\mydb_log.bak';

-- Restore to specific point
RESTORE DATABASE mydb FROM DISK = 'C:\backup\mydb_full.bak'
WITH NORECOVERY;
RESTORE LOG mydb FROM DISK = 'C:\backup\mydb_log.bak'
WITH RECOVERY, STOPAT = '2024-01-15 14:30:00';
```

### Replication for Durability

```sql
-- Synchronous replication (PostgreSQL)
-- Transaction waits for replica confirmation
ALTER SYSTEM SET synchronous_standby_names = 'replica1';
BEGIN TRANSACTION;
  INSERT INTO critical_data (value) VALUES ('important');
COMMIT;
-- Returns only after replica confirms write

-- Asynchronous replication
-- Primary doesn't wait for replica
ALTER SYSTEM SET synchronous_standby_names = '';
-- Faster, but small risk of data loss if primary fails

-- Multi-datacenter durability
-- Write to multiple geographic locations
ALTER SYSTEM SET synchronous_standby_names = 'ANY 2 (datacenter1, datacenter2, datacenter3)';
-- Requires 2 of 3 datacenters to confirm
```

## Transaction Control

### Basic Transaction Commands

```sql
-- BEGIN TRANSACTION (various syntaxes)
BEGIN;                          -- PostgreSQL, SQLite
BEGIN TRANSACTION;              -- SQL Server, MySQL
START TRANSACTION;              -- MySQL, PostgreSQL
BEGIN WORK;                     -- PostgreSQL

-- COMMIT (finalize changes)
COMMIT;
COMMIT TRANSACTION;
COMMIT WORK;

-- ROLLBACK (undo changes)
ROLLBACK;
ROLLBACK TRANSACTION;
ROLLBACK WORK;

-- SAVEPOINT (partial rollback points)
SAVEPOINT savepoint_name;
ROLLBACK TO SAVEPOINT savepoint_name;
RELEASE SAVEPOINT savepoint_name;
```

### Autocommit Mode

```sql
-- Autocommit ON (default in most databases)
-- Each statement is its own transaction
UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
-- Automatically committed

-- Autocommit OFF
SET AUTOCOMMIT = OFF;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
-- Not committed until explicit COMMIT
COMMIT;

-- MySQL autocommit
SET autocommit = 0;  -- Disable
SET autocommit = 1;  -- Enable

-- PostgreSQL (autocommit controlled by client)
-- psql: \set AUTOCOMMIT off
```

### Nested Transactions and Savepoints

```sql
BEGIN TRANSACTION;
  INSERT INTO customers (name) VALUES ('Alice');

  SAVEPOINT sp1;
    INSERT INTO orders (customer_id, total) VALUES (1, 100);

    SAVEPOINT sp2;
      INSERT INTO order_items (order_id, product_id) VALUES (1, 1);
      -- Error occurs
    ROLLBACK TO SAVEPOINT sp2;  -- Undo only order_items

  -- Order still exists, continue
  INSERT INTO orders (customer_id, total) VALUES (1, 200);

COMMIT;  -- Customer and second order saved
```

### Transaction Timeout

```sql
-- SQL Server: Set statement timeout
SET LOCK_TIMEOUT 5000;  -- Milliseconds
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
  -- If lock not acquired in 5 seconds, error
COMMIT;

-- PostgreSQL: Statement timeout
SET statement_timeout = '5s';
BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
COMMIT;

-- Idle in transaction timeout (PostgreSQL)
SET idle_in_transaction_session_timeout = '10min';
-- Automatically rollback if idle for 10 minutes
```

### Read-Only Transactions

```sql
-- PostgreSQL
START TRANSACTION READ ONLY;
  SELECT * FROM large_table;
  -- Cannot modify data
  -- UPDATE would fail
COMMIT;

-- Benefits: Better performance, can avoid locks
-- Useful for reports, analytics

-- SQL Server
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN TRANSACTION;
  SELECT * FROM orders;
  -- Read-only, no locks acquired
COMMIT;
```

## BASE: Alternative to ACID

While ACID provides strong consistency guarantees, it can limit scalability in distributed systems. BASE is an alternative model commonly used in NoSQL databases and distributed systems.

### What is BASE?

**BASE stands for**:

- **Basically Available**: System guarantees availability
- **Soft state**: State may change over time, even without input
- **Eventual consistency**: System will become consistent over time

### ACID vs BASE Comparison

| Aspect           | ACID                          | BASE                    |
| ---------------- | ----------------------------- | ----------------------- |
| **Consistency**  | Strong, immediate             | Eventual                |
| **Availability** | May sacrifice for consistency | Always available        |
| **Scalability**  | Vertical (scale up)           | Horizontal (scale out)  |
| **Performance**  | Slower writes                 | Faster writes           |
| **Use case**     | Financial, critical data      | Social media, analytics |
| **Examples**     | PostgreSQL, MySQL             | Cassandra, DynamoDB     |

### ACID Trade-offs

```
CAP Theorem: Can only have 2 of 3:
- Consistency (C): All nodes see same data
- Availability (A): System always responds
- Partition tolerance (P): Works despite network splits

ACID systems: Choose C + P (sacrifice A during partitions)
BASE systems: Choose A + P (sacrifice C, use eventual consistency)
```

### Eventual Consistency Example

```sql
-- Traditional ACID approach
BEGIN TRANSACTION;
  -- Update product rating across all servers (slow)
  UPDATE products SET rating = 4.5 WHERE product_id = 123;
  -- Wait for all replicas to confirm
COMMIT;

-- BASE/Eventual consistency approach
-- Server 1
UPDATE products SET rating = 4.5 WHERE product_id = 123;
-- Returns immediately

-- Asynchronously propagate to other servers
-- Servers 2, 3, 4 eventually receive update
-- Brief period where different servers show different ratings

-- Eventual consistency guarantees:
-- 1. If no new updates, all replicas eventually converge
-- 2. Reads from different replicas may return different values temporarily
```

### BASE in SQL Databases

Some SQL databases support BASE-like features for specific use cases:

```sql
-- PostgreSQL: Asynchronous commit (BASE-like)
SET synchronous_commit = OFF;
BEGIN;
  INSERT INTO analytics_events (event_type, data)
  VALUES ('page_view', '{"page": "/home"}');
COMMIT;
-- Returns before WAL sync, eventual durability

-- MySQL: Delayed replication (for analytics)
CHANGE MASTER TO MASTER_DELAY = 3600;  -- 1 hour delay
-- Analytics replica lags by 1 hour
-- Allows point-in-time queries, reduces load

-- SQL Server: Read-only replica with lag
-- Application routing
-- Writes → Primary (ACID)
-- Reads → Replica (eventual consistency, may be stale)

SELECT * FROM products;  -- Might be slightly outdated
```

### Multi-Version Concurrency Control (MVCC)

MVCC is a compromise between ACID and BASE, used by PostgreSQL, MySQL InnoDB:

```sql
-- PostgreSQL MVCC behavior
-- Transaction 1
BEGIN;
  SELECT * FROM products WHERE product_id = 1;
  -- Sees version at start of transaction

-- Transaction 2
BEGIN;
  UPDATE products SET price = 29.99 WHERE product_id = 1;
COMMIT;

-- Transaction 1
  SELECT * FROM products WHERE product_id = 1;
  -- Still sees old version (snapshot isolation)
  -- Eventually consistent within isolation level
COMMIT;

-- After both commit, all transactions see new version
-- Combines ACID isolation with BASE-like version management
```

### When to Use BASE

```sql
-- ✅ Good for BASE/eventual consistency:

-- Social media likes (exact count not critical)
UPDATE posts SET like_count = like_count + 1 WHERE post_id = 123;
-- Can be eventually consistent across servers

-- Page view analytics
INSERT INTO page_views (page, timestamp) VALUES ('/home', NOW());
-- Doesn't need immediate consistency

-- Product recommendations (cached, updated periodically)
SELECT * FROM product_recommendations WHERE user_id = 123;
-- Can be stale by minutes/hours

-- ❌ Bad for BASE (requires ACID):

-- Financial transactions
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
-- Must be immediately consistent

-- Inventory management
BEGIN TRANSACTION;
  SELECT quantity FROM products WHERE product_id = 1 FOR UPDATE;
  -- Must prevent overselling
  UPDATE products SET quantity = quantity - 1 WHERE product_id = 1;
COMMIT;
-- Cannot be eventually consistent

-- User authentication
SELECT password_hash FROM users WHERE username = 'alice';
-- Must be strongly consistent
```

### Implementing Eventual Consistency Patterns

```sql
-- Event sourcing pattern
CREATE TABLE events (
  event_id SERIAL PRIMARY KEY,
  aggregate_id INTEGER,
  event_type VARCHAR(50),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Write events (fast, append-only)
INSERT INTO events (aggregate_id, event_type, event_data)
VALUES (123, 'product_updated', '{"price": 29.99}');

-- Materialize views asynchronously (eventual consistency)
CREATE MATERIALIZED VIEW product_current_state AS
SELECT
  aggregate_id as product_id,
  (event_data->>'price')::DECIMAL as current_price,
  MAX(created_at) as last_updated
FROM events
WHERE event_type = 'product_updated'
GROUP BY aggregate_id, event_data->>'price';

-- Refresh periodically (eventual consistency)
REFRESH MATERIALIZED VIEW product_current_state;

-- CQRS pattern: Separate read and write models
-- Write model (ACID, normalized)
CREATE TABLE orders_write (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  status VARCHAR(20),
  created_at TIMESTAMP
);

-- Read model (eventual consistency, denormalized)
CREATE TABLE orders_read (
  order_id INTEGER,
  customer_name VARCHAR(100),
  customer_email VARCHAR(255),
  order_total DECIMAL(10, 2),
  item_count INTEGER,
  status VARCHAR(20)
);

-- Async process updates read model
-- Fast writes to write model, optimized reads from read model
```

## Platform-Specific Notes

::: details PostgreSQL

**Default Isolation Level**: READ COMMITTED

**Transaction Syntax**:

```sql
BEGIN;  -- or START TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**MVCC**: PostgreSQL uses Multi-Version Concurrency Control for high concurrency without read locks.

**Isolation Levels**:

```sql
-- Set session default
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Set for single transaction
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  -- statements
COMMIT;
```

**Serializable Snapshot Isolation**:

```sql
-- PostgreSQL uses SSI for SERIALIZABLE
-- More efficient than traditional locking
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  SELECT SUM(balance) FROM accounts;
  -- Checks for conflicts, may rollback with serialization error
COMMIT;
```

**Savepoints**:

```sql
BEGIN;
  SAVEPOINT my_savepoint;
  -- statements
  ROLLBACK TO SAVEPOINT my_savepoint;
  RELEASE SAVEPOINT my_savepoint;
COMMIT;
```

**Durability Options**:

```sql
-- Synchronous commit (default)
SET synchronous_commit = ON;

-- Async commit (faster, small durability risk)
SET synchronous_commit = OFF;

-- Synchronous replication
ALTER SYSTEM SET synchronous_standby_names = 'replica1';
```

**Advisory Locks** (application-level locking):

```sql
-- Acquire lock
SELECT pg_advisory_lock(123);

-- Release lock
SELECT pg_advisory_unlock(123);

-- Try lock (non-blocking)
SELECT pg_try_advisory_lock(123);
```

:::

::: details MySQL

**Default Isolation Level**: REPEATABLE READ (InnoDB)

**Transaction Syntax**:

```sql
START TRANSACTION;  -- or BEGIN
  -- statements
COMMIT;  -- or ROLLBACK
```

**Storage Engine Differences**:

- **InnoDB**: Full ACID support, row-level locking
- **MyISAM**: No transaction support, table-level locking

**Isolation Levels**:

```sql
-- Set session isolation
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Set global default
SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Per-transaction
START TRANSACTION WITH CONSISTENT SNAPSHOT;
-- REPEATABLE READ with snapshot at start
```

**Locking Reads**:

```sql
-- Lock for update
SELECT * FROM accounts WHERE account_id = 1 FOR UPDATE;

-- Shared lock
SELECT * FROM accounts WHERE account_id = 1 FOR SHARE;

-- Skip locked rows
SELECT * FROM jobs WHERE status = 'pending'
LIMIT 10 FOR UPDATE SKIP LOCKED;
```

**Autocommit**:

```sql
-- Disable autocommit
SET autocommit = 0;

-- Enable autocommit
SET autocommit = 1;

-- Check status
SELECT @@autocommit;
```

**Gap Locks** (REPEATABLE READ):

```sql
-- Prevents phantom reads by locking gaps
BEGIN;
  SELECT * FROM orders WHERE customer_id BETWEEN 100 AND 200 FOR UPDATE;
  -- Locks existing rows AND gaps between them
  -- Prevents inserts in range
COMMIT;
```

:::

::: details SQL Server

**Default Isolation Level**: READ COMMITTED

**Transaction Syntax**:

```sql
BEGIN TRANSACTION;
  -- statements
COMMIT TRANSACTION;  -- or ROLLBACK TRANSACTION
```

**Named Transactions**:

```sql
BEGIN TRANSACTION transfer_money;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT TRANSACTION transfer_money;
```

**Error Handling**:

```sql
BEGIN TRANSACTION;
BEGIN TRY
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  -- Simulate error
  RAISERROR('Insufficient funds', 16, 1);
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION;
  PRINT ERROR_MESSAGE();
  THROW;
END CATCH;
```

**Isolation Levels**:

```sql
-- Set isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Snapshot isolation (requires database configuration)
ALTER DATABASE mydb SET ALLOW_SNAPSHOT_ISOLATION ON;
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;

-- Read committed snapshot (MVCC-like)
ALTER DATABASE mydb SET READ_COMMITTED_SNAPSHOT ON;
```

**Locking Hints**:

```sql
-- Force exclusive lock
SELECT * FROM accounts WITH (UPDLOCK) WHERE account_id = 1;

-- No locks (dirty read)
SELECT * FROM accounts WITH (NOLOCK);

-- Row-level lock
SELECT * FROM accounts WITH (ROWLOCK) WHERE account_id = 1;

-- Table-level lock
SELECT * FROM accounts WITH (TABLOCK);
```

**Savepoints**:

```sql
BEGIN TRANSACTION;
  SAVE TRANSACTION savepoint1;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  ROLLBACK TRANSACTION savepoint1;
COMMIT TRANSACTION;
```

:::

::: details Oracle

**Default Isolation Level**: READ COMMITTED

**Transaction Syntax**:

```sql
-- Implicit begin (no BEGIN statement)
UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
COMMIT;  -- or ROLLBACK
```

**Isolation Levels**:

```sql
-- Set transaction isolation
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Read-only transaction
SET TRANSACTION READ ONLY;

-- Specify rollback segment
SET TRANSACTION USE ROLLBACK SEGMENT rbs1;
```

**Locking**:

```sql
-- Lock rows for update
SELECT * FROM accounts WHERE account_id = 1 FOR UPDATE;

-- Skip locked rows
SELECT * FROM jobs WHERE status = 'pending'
FOR UPDATE SKIP LOCKED;

-- Wait specified time
SELECT * FROM accounts WHERE account_id = 1
FOR UPDATE WAIT 5;  -- Wait 5 seconds

-- No wait
SELECT * FROM accounts WHERE account_id = 1
FOR UPDATE NOWAIT;
```

**Savepoints**:

```sql
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
SAVEPOINT sp1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
ROLLBACK TO SAVEPOINT sp1;
COMMIT;
```

**Flashback Query** (read historical data):

```sql
-- Query as of specific time
SELECT * FROM accounts
AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '5' MINUTE)
WHERE account_id = 1;

-- Query as of SCN
SELECT * FROM accounts
AS OF SCN 123456
WHERE account_id = 1;
```

**Autonomous Transactions**:

```sql
CREATE OR REPLACE PROCEDURE log_event(msg VARCHAR2) AS
PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  INSERT INTO audit_log (message) VALUES (msg);
  COMMIT;  -- Independent of calling transaction
END;
```

:::

::: details SQLite

**Default Isolation Level**: SERIALIZABLE

**Transaction Syntax**:

```sql
BEGIN;  -- or BEGIN TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**Transaction Types**:

```sql
-- Deferred (default): Lock acquired on first read/write
BEGIN DEFERRED TRANSACTION;

-- Immediate: Write lock acquired immediately
BEGIN IMMEDIATE TRANSACTION;

-- Exclusive: Exclusive lock acquired immediately
BEGIN EXCLUSIVE TRANSACTION;
```

**Isolation**:

- SQLite uses file-level locking
- Only one writer at a time
- Multiple concurrent readers (unless exclusive lock)
- Effectively SERIALIZABLE

**Write-Ahead Logging**:

```sql
-- Enable WAL mode (better concurrency)
PRAGMA journal_mode = WAL;

-- Readers don't block writers
-- Writers don't block readers
-- Only writers block writers
```

**Savepoints**:

```sql
BEGIN;
  SAVEPOINT sp1;
  INSERT INTO logs (message) VALUES ('Event 1');
  ROLLBACK TO sp1;
  INSERT INTO logs (message) VALUES ('Event 2');
COMMIT;
```

**Busy Timeout**:

```sql
-- Wait up to 5 seconds for lock
PRAGMA busy_timeout = 5000;
```

**Limitations**:

- No READ UNCOMMITTED or READ COMMITTED
- Limited concurrent write access
- File-level locking (not row-level)

:::

::: details BigQuery

**Transaction Support**: Limited (Beta as of 2024)

**Multi-Statement Transactions**:

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT TRANSACTION;
```

**Limitations**:

- Transactions limited to single region
- Maximum 20,000 DML statements per transaction
- Time limit: 6 hours
- No SAVEPOINT support
- No explicit isolation level control

**Atomicity**:

```sql
-- Single DML statements are atomic
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 1 AND balance >= 100;
-- Either all matching rows updated or none

-- Multi-table updates require transaction
BEGIN TRANSACTION;
  UPDATE table1 SET value = 1 WHERE id = 123;
  UPDATE table2 SET value = 2 WHERE id = 123;
COMMIT TRANSACTION;
```

**Snapshot Consistency**:

```sql
-- Queries see consistent snapshot
-- Automatic, no configuration needed
SELECT * FROM large_table WHERE date = CURRENT_DATE();
-- Sees consistent view even if inserts happening
```

**Time Travel**:

```sql
-- Query historical data (up to 7 days)
SELECT * FROM `project.dataset.table`
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);
```

:::

::: details Snowflake

**Default Isolation Level**: Snapshot isolation (READ COMMITTED with MVCC)

**Transaction Syntax**:

```sql
BEGIN;  -- or BEGIN TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**Automatic Transaction Begin**:

```sql
-- No explicit BEGIN needed
UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
COMMIT;
```

**Multi-Statement Transactions**:

```sql
BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
  INSERT INTO sales (product_id, quantity) VALUES (1, 1);
COMMIT;
```

**Zero-Copy Cloning** (metadata operation):

```sql
-- Create instant copy
CREATE TABLE accounts_backup CLONE accounts;
-- ACID-compliant, instant, no storage duplication initially
```

**Time Travel**:

```sql
-- Query historical data
SELECT * FROM accounts
AT(OFFSET => -60*5);  -- 5 minutes ago

-- Clone from past
CREATE TABLE accounts_restore CLONE accounts
AT(TIMESTAMP => '2024-01-15 14:30:00'::TIMESTAMP);

-- Undrop table
UNDROP TABLE accounts;
```

**MVCC Benefits**:

- Reads never block writes
- Writes never block reads
- No dirty reads
- Snapshot isolation by default

**Transaction Limitations**:

- No SAVEPOINT support
- No explicit isolation level configuration
- Transactions limited to single statement or explicit BEGIN/COMMIT block

:::

::: details DuckDB

**Default Isolation Level**: SERIALIZABLE (MVCC with HyPer-style snapshot isolation)

**Transaction Syntax**:

```sql
BEGIN;  -- or START TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**ACID Support**:

- Full ACID compliance
- MVCC for high concurrency
- Write-Ahead Logging (WAL)

**Isolation**:

```sql
-- All transactions SERIALIZABLE by default
BEGIN;
  SELECT SUM(balance) FROM accounts;
  -- Consistent snapshot
COMMIT;
```

**Concurrent Access**:

- Multiple concurrent readers
- Single writer at a time
- Readers don't block writers
- Writers don't block readers (different transactions)

**Savepoints**:

```sql
BEGIN;
  INSERT INTO logs (message) VALUES ('Event 1');
  SAVEPOINT sp1;
  INSERT INTO logs (message) VALUES ('Event 2');
  ROLLBACK TO sp1;
COMMIT;
```

**Checkpointing**:

```sql
-- Force checkpoint (flush WAL to main database)
CHECKPOINT;

-- Configure WAL size before checkpoint
SET wal_autocheckpoint = 16777216;  -- 16 MB
```

**In-Memory vs Persistent**:

```sql
-- In-memory database (no durability)
duckdb :memory:

-- Persistent database (full ACID)
duckdb mydb.duckdb
```

:::

## Performance Considerations

### Transaction Size

```sql
-- ❌ Huge transaction (locks many resources, long rollback time)
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance * 1.01;  -- Millions of rows
  UPDATE customers SET last_updated = NOW();      -- Millions of rows
  -- If error occurs, rollback takes very long
COMMIT;

-- ✅ Batch processing
DECLARE @batch_size INT = 1000;
WHILE EXISTS (SELECT 1 FROM accounts WHERE updated = 0)
BEGIN
  BEGIN TRANSACTION;
    UPDATE TOP (@batch_size) accounts
    SET balance = balance * 1.01, updated = 1
    WHERE updated = 0;
  COMMIT;
  -- Small commits, easier to recover
END;
```

### Isolation Level Trade-offs

```sql
-- ❌ Unnecessary SERIALIZABLE (slower)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  SELECT * FROM products WHERE product_id = 123;
  -- Simple read, doesn't need SERIALIZABLE
COMMIT;

-- ✅ Use appropriate level
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
  SELECT * FROM products WHERE product_id = 123;
COMMIT;

-- ✅ SERIALIZABLE only when needed
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  -- Calculate totals for accounting
  INSERT INTO daily_totals
  SELECT CURRENT_DATE, SUM(amount) FROM transactions WHERE date = CURRENT_DATE;
COMMIT;
```

### Long Transactions

```sql
-- ❌ Transaction open while waiting for user input
BEGIN TRANSACTION;
  SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
  -- Application waits for user to confirm
  -- Locks held for minutes!
COMMIT;

-- ✅ Optimistic locking, no locks held
-- Read version
SELECT quantity, version FROM inventory WHERE product_id = 1;
-- User confirms in UI (no transaction open)

-- When user confirms, quick transaction
BEGIN TRANSACTION;
  UPDATE inventory
  SET quantity = quantity - 1, version = version + 1
  WHERE product_id = 1 AND version = @original_version;

  IF @@ROWCOUNT = 0 THEN
    ROLLBACK;
    -- Version changed, retry
  ELSE
    COMMIT;
  END IF;
```

### Index Impact on Transactions

```sql
-- Transactions slower with many indexes
-- Each INSERT/UPDATE/DELETE must update all indexes

-- ❌ Over-indexed table
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  order_date DATE,
  total DECIMAL(10, 2),
  INDEX idx1 (customer_id),
  INDEX idx2 (order_date),
  INDEX idx3 (total),
  INDEX idx4 (customer_id, order_date),
  INDEX idx5 (customer_id, total)
  -- Too many indexes!
);

-- Every insert updates 6 structures (PK + 5 indexes)
BEGIN;
  INSERT INTO orders VALUES (...);  -- Slower
COMMIT;

-- ✅ Minimal necessary indexes
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  order_date DATE,
  total DECIMAL(10, 2),
  INDEX idx_customer_date (customer_id, order_date)
  -- Composite index covers most queries
);
```

### Read-Only Optimization

```sql
-- ✅ Mark read-only transactions
START TRANSACTION READ ONLY;
  -- Generate report
  SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id;
COMMIT;

-- Benefits:
-- - No locks acquired
-- - Better concurrency
-- - Query optimizer can optimize differently
```

## Common Pitfalls

### Forgetting to Commit or Rollback

```sql
-- ❌ Transaction left open
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
  -- Application crashes, connection drops
  -- Transaction left hanging, locks held!

-- ✅ Always use try/finally
-- Pseudocode
try {
  db.begin();
  db.execute("UPDATE accounts ...");
  db.commit();
} catch (error) {
  db.rollback();
  throw error;
} finally {
  // Connection cleanup
}
```

### Deadlocks

```sql
-- Transaction 1
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;  -- Lock A
  -- Context switch
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;  -- Wait for B
COMMIT;

-- Transaction 2 (concurrent)
BEGIN;
  UPDATE accounts SET balance = balance - 50 WHERE account_id = 2;   -- Lock B
  UPDATE accounts SET balance = balance + 50 WHERE account_id = 1;   -- Wait for A
COMMIT;
-- DEADLOCK! Both waiting for each other

-- ✅ Solution: Consistent ordering
-- Both transactions update in same order (account_id ascending)
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;  -- Lock A
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;  -- Lock B
COMMIT;

BEGIN;
  UPDATE accounts SET balance = balance + 50 WHERE account_id = 1;   -- Lock A
  UPDATE accounts SET balance = balance - 50 WHERE account_id = 2;   -- Lock B
COMMIT;
```

### Lost Updates

```sql
-- ❌ Lost update problem
-- Transaction 1
BEGIN;
  SELECT balance FROM accounts WHERE account_id = 1;  -- Returns 1000
  -- Calculate new balance: 1000 - 100 = 900

-- Transaction 2
BEGIN;
  SELECT balance FROM accounts WHERE account_id = 1;  -- Returns 1000
  -- Calculate new balance: 1000 - 50 = 950
  UPDATE accounts SET balance = 950 WHERE account_id = 1;
COMMIT;

-- Transaction 1 continues
  UPDATE accounts SET balance = 900 WHERE account_id = 1;
COMMIT;
-- Balance is 900, but should be 850! Lost Transaction 2's update

-- ✅ Solution: Atomic operations
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
COMMIT;

-- ✅ Or use SELECT FOR UPDATE
BEGIN;
  SELECT balance FROM accounts WHERE account_id = 1 FOR UPDATE;
  -- Lock acquired, other transactions must wait
  UPDATE accounts SET balance = <calculated> WHERE account_id = 1;
COMMIT;
```

### Transaction Scope Issues

```sql
-- ❌ Transaction across external API call
BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;

  -- Call external payment API (slow, might timeout)
  EXEC sp_call_external_payment_api;

  UPDATE orders SET status = 'paid' WHERE order_id = 123;
COMMIT;
-- Problem: Long transaction, locks held during external call

-- ✅ Solution: Separate transactions
BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
  UPDATE orders SET status = 'pending_payment' WHERE order_id = 123;
COMMIT;

-- Call external API (no transaction open)
EXEC sp_call_external_payment_api;

-- Update status
BEGIN TRANSACTION;
  UPDATE orders SET status = 'paid' WHERE order_id = 123;
COMMIT;
```

### Implicit Transactions

```sql
-- Some operations cause implicit commits (MySQL)
BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;

  CREATE TABLE temp_table (id INT);  -- Implicit COMMIT!

  UPDATE accounts SET balance = balance - 100 WHERE account_id = 2;
  -- This is in a NEW transaction!

ROLLBACK;  -- Only rolls back second UPDATE, first UPDATE already committed!

-- Operations causing implicit commits:
-- DDL: CREATE, ALTER, DROP, RENAME, TRUNCATE
-- Account management: CREATE USER, DROP USER, GRANT, REVOKE
-- LOCK TABLES, UNLOCK TABLES

-- ✅ Be aware and plan accordingly
-- Complete all DML before DDL
BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 2;
COMMIT;

-- Now do DDL (outside transaction)
CREATE TABLE temp_table (id INT);
```

## Best Practices

### Keep Transactions Short

```sql
-- ✅ Good: Short, focused transaction
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
-- Quick, minimal locks

-- ❌ Bad: Long transaction with unrelated operations
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
  UPDATE customer_stats SET last_transaction = NOW() WHERE customer_id = 123;
  INSERT INTO audit_log (message) VALUES ('Transfer completed');
  UPDATE system_config SET last_update = NOW();
  -- Too many unrelated operations
COMMIT;
```

### Use Appropriate Isolation Levels

```sql
-- ✅ Default (READ COMMITTED) for most operations
BEGIN;
  INSERT INTO orders (customer_id, total) VALUES (123, 500.00);
COMMIT;

-- ✅ REPEATABLE READ for consistent reports
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  SELECT customer_id, SUM(total) as total_spent FROM orders GROUP BY customer_id;
  -- Generate multi-page report with consistent data
COMMIT;

-- ✅ SERIALIZABLE for critical operations
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  -- End-of-day reconciliation
  SELECT SUM(balance) FROM accounts;
  INSERT INTO daily_balance_snapshot VALUES (...);
COMMIT;

-- ✅ READ UNCOMMITTED for approximate analytics (rarely)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT COUNT(*) FROM large_table;
-- Quick count, exactness not critical
```

### Handle Errors Properly

```sql
-- ✅ Explicit error handling
BEGIN TRANSACTION;
BEGIN TRY
  UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;

  IF (SELECT balance FROM accounts WHERE account_id = 1) < 0
    THROW 50001, 'Insufficient funds', 1;

  UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  -- Log error
  INSERT INTO error_log (error_message) VALUES (ERROR_MESSAGE());

  -- Re-raise
  THROW;
END CATCH;
```

### Use Savepoints for Complex Transactions

```sql
-- ✅ Savepoints for logical units
BEGIN TRANSACTION;
  -- Create customer
  INSERT INTO customers (name, email) VALUES ('John', 'john@example.com');
  SAVEPOINT customer_created;

  -- Try to create premium account
  BEGIN TRY
    INSERT INTO premium_accounts (customer_id, tier) VALUES (LAST_INSERT_ID(), 'gold');
    SAVEPOINT premium_created;
  END TRY
  BEGIN CATCH
    -- Rollback just premium account creation
    ROLLBACK TO SAVEPOINT customer_created;
    -- Create standard account instead
    INSERT INTO standard_accounts (customer_id) VALUES (LAST_INSERT_ID());
  END CATCH

COMMIT;
-- Customer created with appropriate account type
```

### Batch Large Operations

```sql
-- ✅ Process in batches
DECLARE @batch_size INT = 1000;
DECLARE @rows_affected INT = 1;

WHILE @rows_affected > 0
BEGIN
  BEGIN TRANSACTION;
    UPDATE TOP (@batch_size) large_table
    SET processed = 1
    WHERE processed = 0;

    SET @rows_affected = @@ROWCOUNT;
  COMMIT;

  -- Brief pause to allow other operations
  WAITFOR DELAY '00:00:00.100';  -- 100ms
END;
```

### Monitor Transaction Duration

```sql
-- PostgreSQL: Find long-running transactions
SELECT
  pid,
  usename,
  state,
  query_start,
  NOW() - query_start as duration,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND NOW() - query_start > INTERVAL '1 minute'
ORDER BY duration DESC;

-- SQL Server: Find blocked transactions
SELECT
  blocking_session_id,
  session_id,
  wait_type,
  wait_time,
  wait_resource
FROM sys.dm_exec_requests
WHERE blocking_session_id > 0;

-- MySQL: Show processlist
SHOW FULL PROCESSLIST;
```

## See Also

- [Indexes](/concepts/indexes) - Understanding indexes improves transaction performance
- [Query Performance](/concepts/performance) - Optimize queries within transactions
- [Joins](/concepts/joins) - Efficient joins reduce transaction time
- [Subqueries](/concepts/subqueries) - Alternative to multiple queries in transactions
- [CTEs](/concepts/ctes) - Organize complex transactional logic
