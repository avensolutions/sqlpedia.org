---
title: Database Transactions
description: Comprehensive guide to database transactions including transaction control, locking, isolation levels, rollback, and ACID properties
databases:
  [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, BigQuery, Snowflake, DuckDB]
difficulty: intermediate
tags:
  [
    transactions,
    locking,
    isolation-levels,
    rollback,
    commit,
    acid,
    concurrency,
    savepoint,
    deadlock,
    pessimistic-locking,
    optimistic-locking,
    transaction-control,
  ]
---

# Database Transactions

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Start a transaction
BEGIN TRANSACTION;
START TRANSACTION;  -- Alternative syntax
BEGIN;              -- Short form (PostgreSQL, SQLite)

-- Commit changes
COMMIT;

-- Rollback changes
ROLLBACK;

-- Savepoint for partial rollback
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  SAVEPOINT sp1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  ROLLBACK TO SAVEPOINT sp1;  -- Undo only second UPDATE
COMMIT;

-- Set isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
  -- Transaction statements
COMMIT;

-- Locking reads
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;  -- Exclusive lock
SELECT * FROM accounts WHERE id = 1 FOR SHARE;   -- Shared lock

-- Skip locked rows (job queue pattern)
SELECT * FROM jobs
WHERE status = 'pending'
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

## Overview

A **transaction** is a sequence of one or more SQL operations that are executed as a single logical unit of work. Transactions ensure data integrity by guaranteeing that either all operations succeed together, or none of them do.

**Why Use Transactions?**:

- **Data consistency**: Prevent partial updates that leave data in an invalid state
- **Concurrent access**: Allow multiple users to safely access data simultaneously
- **Error recovery**: Undo changes when errors occur
- **Business logic**: Enforce multi-step operations as atomic units

**Key Concepts**:

- **Transaction control**: BEGIN, COMMIT, ROLLBACK
- **ACID properties**: Atomicity, Consistency, Isolation, Durability
- **Locking**: Controlling access to data during transactions
- **Isolation levels**: Balancing consistency vs. performance
- **Savepoints**: Creating checkpoints within transactions

## Transaction Basics

### Starting a Transaction

```sql
-- PostgreSQL, SQLite
BEGIN;
-- or
BEGIN TRANSACTION;

-- MySQL
START TRANSACTION;
-- or
BEGIN;

-- SQL Server
BEGIN TRANSACTION;
-- or with name
BEGIN TRANSACTION transfer_funds;

-- Oracle (implicit)
-- Transactions start automatically with first DML statement
UPDATE accounts SET balance = 1000 WHERE id = 1;
```

### Committing a Transaction

Committing makes all changes permanent.

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- Both updates are now permanent
```

### Rolling Back a Transaction

Rolling back undoes all changes made in the transaction.

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;

  -- Check if something went wrong
  IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN
    ROLLBACK;  -- Undo both updates
  ELSE
    COMMIT;
  END IF;
```

### Autocommit Mode

Most databases run in autocommit mode by default, where each statement is automatically committed.

```sql
-- Check autocommit status (MySQL)
SELECT @@autocommit;

-- Disable autocommit (MySQL)
SET autocommit = 0;

-- Now statements require explicit COMMIT
UPDATE accounts SET balance = 1000 WHERE id = 1;
COMMIT;  -- Required

-- Re-enable autocommit
SET autocommit = 1;

-- PostgreSQL (controlled by client)
-- In psql: \set AUTOCOMMIT off
```

## ACID Properties

Transactions follow ACID properties to ensure reliability:

- **Atomicity**: All operations succeed or all fail (no partial updates)
- **Consistency**: Database moves from one valid state to another
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed changes survive system failures

### Atomicity Example

```sql
-- Money transfer: both updates or neither
BEGIN TRANSACTION;
  -- Debit account
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;

  -- Credit account
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;

  -- If either fails, both are rolled back
COMMIT;
```

### Consistency Example

```sql
-- Constraints enforce consistency
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance DECIMAL(10,2) CHECK (balance >= 0)  -- Never negative
);

BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
  -- If this violates CHECK constraint, transaction rolls back
COMMIT;
```

For detailed coverage of ACID properties, see the [ACID guide](/concepts/acid).

## Locking Mechanisms

Locks prevent conflicting concurrent access to data. Databases use locks automatically, but you can also request explicit locks.

### Types of Locks

**Shared Lock (S)**: Multiple transactions can read, none can write

**Exclusive Lock (X)**: Only one transaction can read/write

**Update Lock (U)**: Prevents deadlocks in read-then-update scenarios

### Implicit Locking

Databases automatically acquire locks based on operations:

```sql
-- SELECT: Shared lock (in some isolation levels)
SELECT * FROM accounts WHERE id = 1;

-- UPDATE/DELETE: Exclusive lock
UPDATE accounts SET balance = 1000 WHERE id = 1;
-- Row is exclusively locked until COMMIT or ROLLBACK

-- INSERT: Exclusive lock on new row
INSERT INTO accounts (id, balance) VALUES (3, 1000);
```

### Explicit Locking

#### SELECT FOR UPDATE

Acquires exclusive lock for reading, preventing other transactions from modifying or locking the rows.

```sql
-- Lock rows for update
BEGIN TRANSACTION;
  SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
  -- Row is locked, other transactions must wait

  -- Now safe to update based on read value
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
-- Lock released
```

**Use cases**:

- Read-then-update patterns
- Preventing lost updates
- Queue processing

```sql
-- Job queue: Lock next available job
BEGIN TRANSACTION;
  SELECT * FROM jobs
  WHERE status = 'pending'
  ORDER BY priority DESC
  LIMIT 1
  FOR UPDATE;

  -- Process job...
  UPDATE jobs SET status = 'processing' WHERE id = @job_id;
COMMIT;
```

#### SELECT FOR SHARE

Acquires shared lock, allowing other transactions to read but not modify.

```sql
BEGIN TRANSACTION;
  SELECT balance FROM accounts WHERE id = 1 FOR SHARE;
  -- Others can read but not modify

  -- Use value for calculations
  -- (without modifying)
COMMIT;
```

### Lock Modifiers

#### NOWAIT

Don't wait for locks, fail immediately if locked.

```sql
BEGIN TRANSACTION;
  SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
  -- Error if row is locked
COMMIT;
```

**Use case**: Try to acquire lock, handle failure gracefully

```sql
-- Try to process job without waiting
BEGIN TRANSACTION;
  BEGIN TRY
    SELECT * FROM jobs WHERE id = 1 FOR UPDATE NOWAIT;
    -- Process job
    COMMIT;
  END TRY
  BEGIN CATCH
    ROLLBACK;
    -- Job is locked, try another one
  END CATCH
```

#### SKIP LOCKED

Skip rows that are locked, return unlocked rows only.

```sql
-- Multiple workers processing job queue
BEGIN TRANSACTION;
  SELECT * FROM jobs
  WHERE status = 'pending'
  ORDER BY priority DESC
  LIMIT 10
  FOR UPDATE SKIP LOCKED;

  -- Each worker gets different jobs
  -- No waiting or conflicts
  UPDATE jobs SET status = 'processing' WHERE id IN (...);
COMMIT;
```

**Use cases**:

- Job queues with multiple workers
- Batch processing
- Concurrent task distribution

### Lock Granularity

**Row-level locks**: Lock individual rows (InnoDB, PostgreSQL, SQL Server, Oracle)

```sql
-- Lock single row
UPDATE accounts SET balance = 1000 WHERE id = 1;
-- Only this row is locked
```

**Table-level locks**: Lock entire table (MyISAM, some operations)

```sql
-- Explicit table lock (MySQL)
LOCK TABLES accounts WRITE;
-- Entire table locked
UPDATE accounts SET balance = balance * 1.1;
UNLOCK TABLES;

-- PostgreSQL
LOCK TABLE accounts IN EXCLUSIVE MODE;
UPDATE accounts SET balance = balance * 1.1;
COMMIT;  -- Unlocks
```

**Page-level locks**: Lock database pages (SQL Server, older systems)

### Pessimistic vs Optimistic Locking

#### Pessimistic Locking

Lock immediately, prevent conflicts.

```sql
-- Acquire lock at read time
BEGIN TRANSACTION;
  SELECT quantity FROM inventory WHERE product_id = 1 FOR UPDATE;
  -- Row locked, no one else can modify

  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
COMMIT;
```

**Pros**: Guaranteed no conflicts
**Cons**: Reduced concurrency, potential deadlocks
**Use when**: High contention expected

#### Optimistic Locking

Don't lock, check for conflicts at update time.

```sql
-- Add version column
ALTER TABLE inventory ADD COLUMN version INTEGER DEFAULT 1;

-- Read without locking
SELECT quantity, version FROM inventory WHERE product_id = 1;
-- Returns: quantity=10, version=5

-- Later: Update only if version unchanged
UPDATE inventory
SET
  quantity = quantity - 1,
  version = version + 1
WHERE product_id = 1 AND version = 5;

-- Check affected rows
IF @@ROWCOUNT = 0 THEN
  -- Version changed, conflict occurred
  -- Retry or handle error
END IF;
```

**Pros**: Better concurrency, no locks
**Cons**: Must handle conflicts, may need retries
**Use when**: Low contention expected

```sql
-- Application-level optimistic locking pattern
max_retries = 3
for attempt in 1..max_retries:
  -- Read current version
  SELECT quantity, version FROM inventory WHERE product_id = 1

  -- Update with version check
  UPDATE inventory
  SET quantity = quantity - 1, version = version + 1
  WHERE product_id = 1 AND version = @original_version

  if rows_affected > 0:
    break  -- Success
  else:
    if attempt == max_retries:
      raise ConflictError
    -- Retry
```

## Isolation Levels

Isolation levels control how transactions interact with each other, trading off consistency for performance.

### The Four Standard Levels

| Isolation Level  | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
| ---------------- | ---------- | ------------------- | ------------ | ----------- |
| READ UNCOMMITTED | Yes        | Yes                 | Yes          | Fastest     |
| READ COMMITTED   | No         | Yes                 | Yes          | Fast        |
| REPEATABLE READ  | No         | No                  | Yes\*        | Slower      |
| SERIALIZABLE     | No         | No                  | No           | Slowest     |

\*MySQL InnoDB prevents phantom reads even in REPEATABLE READ

### Setting Isolation Level

```sql
-- Session-level (affects all transactions)
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Next transaction only
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION;
  -- Statements
COMMIT;

-- PostgreSQL: Per transaction
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- Statements
COMMIT;

-- SQL Server: Query hint
SELECT * FROM accounts WITH (SERIALIZABLE) WHERE id = 1;
```

### Read Phenomena

#### Dirty Read

Reading uncommitted changes from another transaction.

```sql
-- Transaction A
BEGIN;
  UPDATE accounts SET balance = 5000 WHERE id = 1;
  -- Not committed yet!

-- Transaction B (READ UNCOMMITTED)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;
  -- Sees 5000 (uncommitted value)
COMMIT;

-- Transaction A
ROLLBACK;
-- Balance was never really 5000!
-- Transaction B read data that never existed
```

#### Non-Repeatable Read

Same query returns different results within transaction.

```sql
-- Transaction A (READ COMMITTED)
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;
  -- Returns 1000

-- Transaction B
BEGIN;
  UPDATE accounts SET balance = 2000 WHERE id = 1;
COMMIT;

-- Transaction A
  SELECT balance FROM accounts WHERE id = 1;
  -- Returns 2000 (changed!)
COMMIT;
```

#### Phantom Read

New rows appear in repeated query.

```sql
-- Transaction A (REPEATABLE READ)
BEGIN;
  SELECT COUNT(*) FROM orders WHERE customer_id = 123;
  -- Returns 5

-- Transaction B
BEGIN;
  INSERT INTO orders (customer_id, total) VALUES (123, 500);
COMMIT;

-- Transaction A
  SELECT COUNT(*) FROM orders WHERE customer_id = 123;
  -- Returns 6 (new row appeared!)
COMMIT;
```

### READ UNCOMMITTED

Lowest isolation level. Allows dirty reads.

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
  SELECT * FROM large_table;
  -- Fastest, but may see uncommitted changes
COMMIT;
```

**Use cases**:

- Approximate analytics where exact values don't matter
- Read-only queries where dirty reads are acceptable
- Performance-critical scenarios with acceptable trade-offs

**Risks**:

- Reading data that may be rolled back
- Inconsistent results

### READ COMMITTED

Default in PostgreSQL, Oracle, SQL Server. Prevents dirty reads.

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;
  -- Only sees committed data

  -- Another transaction can commit changes between reads
  SELECT balance FROM accounts WHERE id = 1;
  -- Might return different value (non-repeatable read)
COMMIT;
```

**Use cases**:

- Most general-purpose transactions
- OLTP workloads
- Default choice for most applications

**Allows**:

- Non-repeatable reads
- Phantom reads

### REPEATABLE READ

Default in MySQL InnoDB. Prevents dirty and non-repeatable reads.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000

  -- Other transactions can commit, but we won't see changes
  SELECT balance FROM accounts WHERE id = 1;  -- Still returns 1000

  -- But new rows can appear (phantoms)
  SELECT COUNT(*) FROM orders WHERE customer_id = 123;
  -- Count might change if rows inserted
COMMIT;
```

**Use cases**:

- Reports requiring consistent snapshots
- Multi-step calculations on same data
- Avoiding non-repeatable reads

**Allows**:

- Phantom reads (except MySQL InnoDB)

### SERIALIZABLE

Highest isolation level. Prevents all phenomena.

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  SELECT SUM(balance) FROM accounts;
  -- Complete isolation, same result if repeated

  SELECT SUM(balance) FROM accounts;
  -- Guaranteed same result
COMMIT;
```

**Use cases**:

- Financial reconciliation
- Critical consistency requirements
- End-of-period processing

**Implementation**:

- PostgreSQL: Serializable Snapshot Isolation (SSI)
- SQL Server: Range locks
- MySQL: Gap locks (in REPEATABLE READ)

**Performance impact**:

- Increased locking
- Potential for serialization errors
- Reduced concurrency

## Rollback and Error Handling

### Basic Rollback

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;

  -- Error occurred, undo everything
  ROLLBACK;
```

### Conditional Rollback

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;

  -- Check business rule
  IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN
    ROLLBACK;
    -- Raise error
  ELSE
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;
    COMMIT;
  END IF;
```

### Error Handling (SQL Server)

```sql
BEGIN TRANSACTION;
BEGIN TRY
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;

  -- Simulate error check
  IF (SELECT balance FROM accounts WHERE id = 1) < 0
    THROW 50001, 'Insufficient funds', 1;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  -- Log error
  DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
  INSERT INTO error_log (error_msg, error_time)
  VALUES (@ErrorMessage, GETDATE());

  -- Re-raise
  THROW;
END CATCH;
```

### Error Handling (PostgreSQL)

```sql
DO $$
BEGIN
  BEGIN
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;

    -- Check condition
    IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error occurred: %', SQLERRM;
      RAISE;
  END;
END $$;
```

### Savepoints

Savepoints create checkpoints within a transaction for partial rollback.

```sql
BEGIN TRANSACTION;
  -- Step 1
  INSERT INTO customers (name, email)
  VALUES ('John Doe', 'john@example.com');
  SAVEPOINT customer_created;

  -- Step 2
  INSERT INTO addresses (customer_id, street, city)
  VALUES (LAST_INSERT_ID(), '123 Main St', 'Boston');
  SAVEPOINT address_created;

  -- Step 3 fails
  INSERT INTO orders (customer_id, total)
  VALUES (999, 100);  -- Invalid customer_id

  -- Rollback to step 2, keep customer and address
  ROLLBACK TO SAVEPOINT address_created;

  -- Continue with different operation
  INSERT INTO notes (customer_id, note)
  VALUES (LAST_INSERT_ID(), 'New customer');

COMMIT;
-- Customer, address, and note saved
-- Failed order insert was rolled back
```

### Nested Savepoints

```sql
BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 10 WHERE product_id = 1;
  SAVEPOINT sp1;

  UPDATE inventory SET quantity = quantity - 5 WHERE product_id = 2;
  SAVEPOINT sp2;

  UPDATE inventory SET quantity = quantity - 3 WHERE product_id = 3;
  SAVEPOINT sp3;

  -- Error on product 3, rollback just that change
  ROLLBACK TO SAVEPOINT sp3;

  -- Continue with product 4
  UPDATE inventory SET quantity = quantity - 2 WHERE product_id = 4;

COMMIT;
-- Products 1, 2, 4 updated; product 3 unchanged
```

### Releasing Savepoints

```sql
BEGIN TRANSACTION;
  INSERT INTO orders (customer_id) VALUES (1);
  SAVEPOINT order_created;

  INSERT INTO order_items (order_id, product_id) VALUES (1, 100);

  -- No longer need savepoint
  RELEASE SAVEPOINT order_created;
  -- Can't rollback to it anymore

COMMIT;
```

## Deadlocks

A deadlock occurs when two or more transactions wait for each other to release locks.

### Deadlock Example

```sql
-- Transaction A
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- Lock A
  -- Wait...
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- Wait for B
COMMIT;

-- Transaction B (concurrent)
BEGIN;
  UPDATE accounts SET balance = balance - 50 WHERE id = 2;   -- Lock B
  UPDATE accounts SET balance = balance + 50 WHERE id = 1;   -- Wait for A
COMMIT;

-- DEADLOCK! A waits for B, B waits for A
```

### Database Response to Deadlocks

When a deadlock is detected, the database:

1. Chooses a "victim" transaction
2. Rolls back the victim
3. Returns a deadlock error
4. Allows other transaction to proceed

```sql
-- One transaction gets error:
-- ERROR: deadlock detected
-- DETAIL: Process 1234 waits for ShareLock on transaction 5678
```

### Preventing Deadlocks

#### 1. Consistent Lock Order

Always acquire locks in the same order.

```sql
-- ✅ Both transactions lock in same order (id ascending)
-- Transaction A
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- Lock 1
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- Lock 2
COMMIT;

-- Transaction B
BEGIN;
  UPDATE accounts SET balance = balance + 50 WHERE id = 1;   -- Lock 1 (waits for A)
  UPDATE accounts SET balance = balance - 50 WHERE id = 2;   -- Lock 2
COMMIT;
-- No deadlock, B waits for A to complete
```

#### 2. Keep Transactions Short

```sql
-- ❌ Long transaction holding locks
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  -- Complex calculation taking 30 seconds
  WAITFOR DELAY '00:00:30';
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- ✅ Short transaction
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- Do complex calculations outside transaction
```

#### 3. Use Lower Isolation Levels

```sql
-- SERIALIZABLE increases deadlock risk
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- Lower isolation = fewer locks = fewer deadlocks
```

#### 4. Use NOWAIT or Timeout

```sql
-- Fail immediately instead of waiting
BEGIN;
  SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
  -- Error if locked, handle gracefully
COMMIT;

-- SQL Server: Set lock timeout
SET LOCK_TIMEOUT 5000;  -- 5 seconds
BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE id = 1;
  -- Error after 5 seconds if can't acquire lock
COMMIT;
```

### Handling Deadlocks

```sql
-- Retry pattern (application code)
max_retries = 3
for attempt in 1..max_retries:
  try:
    BEGIN TRANSACTION
      UPDATE accounts SET balance = balance - 100 WHERE id = 1
      UPDATE accounts SET balance = balance + 100 WHERE id = 2
    COMMIT
    break  -- Success

  catch DeadlockError:
    ROLLBACK
    if attempt == max_retries:
      raise
    -- Wait with exponential backoff
    sleep(2^attempt * 100ms)
    -- Retry
```

## Transaction Performance

### Keep Transactions Short

```sql
-- ❌ Long transaction
BEGIN;
  UPDATE large_table SET processed = 1;  -- Millions of rows
  -- Locks held for long time
COMMIT;

-- ✅ Batch processing
batch_size = 1000
WHILE EXISTS (SELECT 1 FROM large_table WHERE processed = 0 LIMIT 1):
  BEGIN;
    UPDATE large_table SET processed = 1
    WHERE id IN (
      SELECT id FROM large_table
      WHERE processed = 0
      LIMIT @batch_size
    );
  COMMIT;
  -- Small transactions, locks released frequently
```

### Avoid Locking Inside Transactions

```sql
-- ❌ External call inside transaction
BEGIN;
  UPDATE orders SET status = 'processing' WHERE id = 1;
  -- Call external payment API (slow!)
  CALL external_payment_api();
  UPDATE orders SET status = 'paid' WHERE id = 1;
COMMIT;

-- ✅ External call outside transaction
BEGIN;
  UPDATE orders SET status = 'processing' WHERE id = 1;
COMMIT;

-- Call API (no locks held)
CALL external_payment_api();

BEGIN;
  UPDATE orders SET status = 'paid' WHERE id = 1;
COMMIT;
```

### Use Appropriate Isolation Level

```sql
-- ❌ Unnecessary SERIALIZABLE
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  SELECT * FROM products WHERE id = 1;  -- Simple read
COMMIT;

-- ✅ Use READ COMMITTED for simple reads
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
  SELECT * FROM products WHERE id = 1;
COMMIT;

-- ✅ Use SERIALIZABLE only when necessary
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  -- Critical financial calculation requiring perfect consistency
  INSERT INTO daily_totals
  SELECT CURRENT_DATE, SUM(amount) FROM transactions;
COMMIT;
```

### Read-Only Transactions

```sql
-- Mark transactions as read-only for optimization
START TRANSACTION READ ONLY;
  SELECT customer_id, SUM(total)
  FROM orders
  GROUP BY customer_id;
COMMIT;

-- Benefits:
-- - No locks acquired
-- - Better query optimization
-- - Can run on read replicas
```

### Monitor Long-Running Transactions

```sql
-- PostgreSQL: Find long transactions
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
  wait_time / 1000.0 as wait_time_sec,
  wait_resource
FROM sys.dm_exec_requests
WHERE blocking_session_id > 0;

-- Kill long transaction (use carefully!)
-- PostgreSQL
SELECT pg_terminate_backend(pid);

-- SQL Server
KILL session_id;
```

## Platform-Specific Notes

::: details PostgreSQL

**Transaction Syntax**:

```sql
BEGIN;  -- or START TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**Default Isolation**: READ COMMITTED

**MVCC**: Uses Multi-Version Concurrency Control for high concurrency

**Serializable Isolation**:

```sql
-- Uses Serializable Snapshot Isolation (SSI)
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  SELECT SUM(balance) FROM accounts;
  -- May fail with serialization error if conflict detected
COMMIT;
```

**Advisory Locks** (application-level):

```sql
-- Acquire lock
SELECT pg_advisory_lock(12345);

-- Try lock (non-blocking)
SELECT pg_try_advisory_lock(12345);

-- Release lock
SELECT pg_advisory_unlock(12345);
```

**Transaction ID**:

```sql
SELECT txid_current();  -- Get current transaction ID
```

**Prepared Transactions** (two-phase commit):

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
PREPARE TRANSACTION 'transaction_123';

-- Later: commit or rollback
COMMIT PREPARED 'transaction_123';
-- or
ROLLBACK PREPARED 'transaction_123';
```

:::

::: details MySQL

**Transaction Syntax**:

```sql
START TRANSACTION;  -- or BEGIN
  -- statements
COMMIT;  -- or ROLLBACK
```

**Default Isolation**: REPEATABLE READ (InnoDB)

**Storage Engines**:

- **InnoDB**: Full ACID support, row-level locking
- **MyISAM**: No transaction support, table-level locking

**Locking Reads**:

```sql
-- Lock rows for update
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- Shared lock
SELECT * FROM accounts WHERE id = 1 FOR SHARE;

-- Lock in share mode (older syntax)
SELECT * FROM accounts WHERE id = 1 LOCK IN SHARE MODE;

-- Skip locked rows
SELECT * FROM jobs WHERE status = 'pending'
LIMIT 10 FOR UPDATE SKIP LOCKED;
```

**Autocommit**:

```sql
-- Check autocommit
SELECT @@autocommit;

-- Disable
SET autocommit = 0;

-- Enable
SET autocommit = 1;
```

**Consistent Snapshot**:

```sql
-- Start transaction with snapshot
START TRANSACTION WITH CONSISTENT SNAPSHOT;
-- All reads see snapshot at transaction start
```

**Gap Locks** (REPEATABLE READ):

```sql
-- Locks gaps between index entries to prevent phantoms
BEGIN;
  SELECT * FROM orders
  WHERE customer_id BETWEEN 100 AND 200
  FOR UPDATE;
  -- Locks rows AND gaps, prevents inserts in range
COMMIT;
```

:::

::: details SQL Server

**Transaction Syntax**:

```sql
BEGIN TRANSACTION;  -- or BEGIN TRAN
  -- statements
COMMIT TRANSACTION;  -- or ROLLBACK TRANSACTION
```

**Default Isolation**: READ COMMITTED

**Named Transactions**:

```sql
BEGIN TRANSACTION transfer_funds;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT TRANSACTION transfer_funds;
```

**Isolation Levels**:

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Snapshot isolation (requires configuration)
ALTER DATABASE mydb SET ALLOW_SNAPSHOT_ISOLATION ON;
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;

-- Read committed snapshot (MVCC-like)
ALTER DATABASE mydb SET READ_COMMITTED_SNAPSHOT ON;
```

**Lock Hints**:

```sql
-- Update lock
SELECT * FROM accounts WITH (UPDLOCK) WHERE id = 1;

-- No lock (dirty read)
SELECT * FROM accounts WITH (NOLOCK);

-- Row lock
SELECT * FROM accounts WITH (ROWLOCK) WHERE id = 1;

-- Table lock
SELECT * FROM accounts WITH (TABLOCK);

-- Hold lock until transaction end
SELECT * FROM accounts WITH (HOLDLOCK) WHERE id = 1;
```

**Savepoints**:

```sql
BEGIN TRANSACTION;
  SAVE TRANSACTION savepoint1;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  ROLLBACK TRANSACTION savepoint1;
COMMIT TRANSACTION;
```

**Error Handling**:

```sql
BEGIN TRANSACTION;
BEGIN TRY
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
```

:::

::: details Oracle

**Transaction Syntax**:

```sql
-- No explicit BEGIN (transactions start automatically)
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
COMMIT;  -- or ROLLBACK
```

**Default Isolation**: READ COMMITTED

**Isolation Levels**:

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SET TRANSACTION READ ONLY;
```

**Locking**:

```sql
-- Lock for update
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- No wait
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;

-- Wait specified time
SELECT * FROM accounts WHERE id = 1 FOR UPDATE WAIT 5;

-- Skip locked
SELECT * FROM jobs WHERE status = 'pending'
FOR UPDATE SKIP LOCKED;
```

**Savepoints**:

```sql
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
SAVEPOINT sp1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
ROLLBACK TO SAVEPOINT sp1;
COMMIT;
```

**Flashback Query** (read historical data):

```sql
-- Query as of timestamp
SELECT * FROM accounts
AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '5' MINUTE)
WHERE id = 1;

-- Query as of SCN
SELECT * FROM accounts AS OF SCN 123456 WHERE id = 1;
```

**Autonomous Transactions**:

```sql
CREATE OR REPLACE PROCEDURE log_audit(msg VARCHAR2) AS
PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  INSERT INTO audit_log (message) VALUES (msg);
  COMMIT;  -- Independent of calling transaction
END;
```

:::

::: details SQLite

**Transaction Syntax**:

```sql
BEGIN;  -- or BEGIN TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**Default Isolation**: SERIALIZABLE

**Transaction Types**:

```sql
-- Deferred (default): Lock on first read/write
BEGIN DEFERRED TRANSACTION;

-- Immediate: Write lock immediately
BEGIN IMMEDIATE TRANSACTION;

-- Exclusive: Exclusive lock immediately
BEGIN EXCLUSIVE TRANSACTION;
```

**Locking**:

- File-level locking
- One writer at a time
- Multiple concurrent readers (except exclusive lock)

**WAL Mode** (better concurrency):

```sql
PRAGMA journal_mode = WAL;
-- Readers don't block writers
-- Writers don't block readers
-- Writers still block writers
```

**Busy Timeout**:

```sql
-- Wait up to 5 seconds for lock
PRAGMA busy_timeout = 5000;
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

**Limitations**:

- No row-level locking
- Limited concurrent writes
- No explicit isolation level control

:::

::: details BigQuery

**Transaction Support**: Limited (Beta)

**Syntax**:

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT TRANSACTION;
```

**Limitations**:

- Single region only
- Max 20,000 DML statements per transaction
- 6 hour time limit
- No savepoints
- No explicit isolation level control

**Automatic Snapshot Consistency**:

```sql
-- Queries automatically see consistent snapshot
SELECT * FROM large_table WHERE date = CURRENT_DATE();
-- Consistent view even during concurrent inserts
```

**Time Travel**:

```sql
-- Query historical data (up to 7 days)
SELECT * FROM `project.dataset.table`
FOR SYSTEM_TIME AS OF
  TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);
```

:::

::: details Snowflake

**Transaction Syntax**:

```sql
BEGIN;  -- or BEGIN TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**Default Isolation**: Snapshot isolation (READ COMMITTED with MVCC)

**MVCC Benefits**:

- Reads never block writes
- Writes never block reads
- No dirty reads
- Snapshot isolation by default

**Multi-Statement Transactions**:

```sql
BEGIN TRANSACTION;
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
  INSERT INTO sales (product_id, quantity) VALUES (1, 1);
COMMIT;
```

**Zero-Copy Cloning**:

```sql
-- Instant ACID-compliant copy
CREATE TABLE accounts_backup CLONE accounts;
-- No storage duplication initially
```

**Time Travel**:

```sql
-- Query historical data
SELECT * FROM accounts AT(OFFSET => -60*5);  -- 5 minutes ago

-- Clone from past
CREATE TABLE accounts_restore CLONE accounts
AT(TIMESTAMP => '2024-01-15 14:30:00'::TIMESTAMP);

-- Undrop
UNDROP TABLE accounts;
```

**Limitations**:

- No savepoints
- No explicit isolation level control
- Transactions limited to explicit BEGIN/COMMIT block

:::

::: details DuckDB

**Transaction Syntax**:

```sql
BEGIN;  -- or START TRANSACTION
  -- statements
COMMIT;  -- or ROLLBACK
```

**Default Isolation**: SERIALIZABLE (MVCC with snapshot isolation)

**ACID Support**: Full ACID compliance with WAL

**Concurrency**:

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
-- Force checkpoint (flush WAL)
CHECKPOINT;

-- Configure WAL size
SET wal_autocheckpoint = 16777216;  -- 16 MB
```

**In-Memory vs Persistent**:

```sql
-- In-memory (no durability)
duckdb :memory:

-- Persistent (full ACID)
duckdb mydb.duckdb
```

:::

## Best Practices

### 1. Keep Transactions Short and Focused

```sql
-- ✅ Good: Short, focused transaction
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- ❌ Bad: Long transaction with unrelated operations
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE customer_stats SET last_transaction = NOW();
  INSERT INTO audit_log (message) VALUES ('Transfer');
  UPDATE system_config SET last_update = NOW();
  -- Sleep or external call
COMMIT;
```

### 2. Always Handle Errors

```sql
-- ✅ Good: Explicit error handling
BEGIN;
  BEGIN TRY
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
    COMMIT;
  END TRY
  BEGIN CATCH
    ROLLBACK;
    -- Log error and re-raise
    THROW;
  END CATCH
```

### 3. Use Appropriate Isolation Levels

```sql
-- ✅ Default (READ COMMITTED) for most operations
BEGIN;
  INSERT INTO orders (customer_id, total) VALUES (1, 500);
COMMIT;

-- ✅ REPEATABLE READ for consistent reports
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id;
  -- Multi-step report with consistent data
COMMIT;

-- ✅ SERIALIZABLE for critical operations
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  -- Financial reconciliation
COMMIT;
```

### 4. Acquire Locks in Consistent Order

```sql
-- ✅ Always lock in same order (prevents deadlocks)
-- Order by ID ascending
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = LEAST(@id1, @id2);
  UPDATE accounts SET balance = balance + 100 WHERE id = GREATEST(@id1, @id2);
COMMIT;
```

### 5. Use Savepoints for Complex Transactions

```sql
-- ✅ Good: Savepoints for logical units
BEGIN;
  INSERT INTO customers (name) VALUES ('John');
  SAVEPOINT customer_created;

  BEGIN TRY
    INSERT INTO premium_accounts (customer_id) VALUES (LAST_INSERT_ID());
  END TRY
  BEGIN CATCH
    ROLLBACK TO SAVEPOINT customer_created;
    -- Create standard account instead
    INSERT INTO standard_accounts (customer_id) VALUES (LAST_INSERT_ID());
  END CATCH

COMMIT;
```

### 6. Avoid User Interaction in Transactions

```sql
-- ❌ Bad: Transaction open during user interaction
BEGIN;
  SELECT * FROM inventory WHERE id = 1 FOR UPDATE;
  -- Wait for user to confirm (locks held!)
COMMIT;

-- ✅ Good: No locks during user interaction
-- Read without lock
SELECT quantity, version FROM inventory WHERE id = 1;

-- User confirms in UI (no transaction)

-- Quick transaction when ready
BEGIN;
  UPDATE inventory SET quantity = quantity - 1, version = version + 1
  WHERE id = 1 AND version = @original_version;
COMMIT;
```

### 7. Monitor and Set Timeouts

```sql
-- PostgreSQL
SET statement_timeout = '30s';
SET idle_in_transaction_session_timeout = '5min';

-- SQL Server
SET LOCK_TIMEOUT 10000;  -- 10 seconds

-- Prevent runaway transactions
```

### 8. Batch Large Operations

```sql
-- ✅ Process in batches
batch_size = 1000
WHILE EXISTS (SELECT 1 FROM large_table WHERE processed = 0 LIMIT 1):
  BEGIN;
    UPDATE large_table SET processed = 1
    WHERE id IN (
      SELECT id FROM large_table
      WHERE processed = 0
      LIMIT @batch_size
    );
  COMMIT;
  -- Brief pause
  SLEEP(0.1);
```

## Common Pitfalls

### 1. Forgetting COMMIT or ROLLBACK

```sql
-- ❌ Transaction left open
BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE id = 1;
  -- Connection drops, transaction hangs

-- ✅ Always ensure cleanup
try:
  BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE id = 1;
  COMMIT;
catch:
  ROLLBACK;
finally:
  // Close connection
```

### 2. Implicit Commits (MySQL)

```sql
-- ❌ DDL causes implicit commit
BEGIN;
  UPDATE accounts SET balance = balance + 100 WHERE id = 1;
  CREATE TABLE temp (id INT);  -- Implicit COMMIT!
  UPDATE accounts SET balance = balance - 100 WHERE id = 2;
ROLLBACK;  -- Only rolls back second UPDATE!

-- Operations causing implicit commits:
-- DDL: CREATE, ALTER, DROP, TRUNCATE
-- Account: CREATE USER, GRANT, REVOKE
-- LOCK TABLES, UNLOCK TABLES
```

### 3. Lost Updates

```sql
-- ❌ Lost update (read-then-update)
-- Transaction A
SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000
-- Calculate: 1000 - 100 = 900

-- Transaction B
SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000
-- Calculate: 1000 - 50 = 950
UPDATE accounts SET balance = 950 WHERE id = 1;
COMMIT;

-- Transaction A continues
UPDATE accounts SET balance = 900 WHERE id = 1;  -- Overwrites B's change!
COMMIT;
-- Lost Transaction B's update

-- ✅ Solution: Atomic operation
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

-- ✅ Or: Lock for update
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = ... WHERE id = 1;
```

### 4. Unnecessary SERIALIZABLE

```sql
-- ❌ Overkill
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  SELECT * FROM products WHERE id = 1;  -- Simple read
COMMIT;

-- ✅ Use lower isolation when possible
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
  SELECT * FROM products WHERE id = 1;
COMMIT;
```

### 5. Long Transactions

```sql
-- ❌ Long-running transaction
BEGIN;
  -- Process millions of rows
  UPDATE huge_table SET processed = 1;
  -- Locks held for minutes/hours
COMMIT;

-- ✅ Batch processing
WHILE EXISTS (SELECT 1 FROM huge_table WHERE processed = 0 LIMIT 1):
  BEGIN;
    UPDATE huge_table SET processed = 1
    WHERE id IN (SELECT id FROM huge_table WHERE processed = 0 LIMIT 1000);
  COMMIT;
```

## See Also

- [ACID Properties](/concepts/acid) - Detailed coverage of Atomicity, Consistency, Isolation, Durability
- [Indexes](/concepts/indexes) - Indexes impact transaction performance and locking
- [Query Performance](/concepts/performance) - Optimize queries within transactions
- [Joins](/concepts/joins) - Efficient joins reduce transaction time
- [Basics](/concepts/basics) - SQL fundamentals including basic transaction syntax
