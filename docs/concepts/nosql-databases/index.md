---
title: NoSQL Databases
description: >-
  Comprehensive guide to NoSQL databases including document stores, key-value
  stores, column-family databases, and their SQL interfaces
databases:
  - MongoDB
  - Cassandra
  - Redis
  - DynamoDB
  - Couchbase
  - HBase
  - CouchDB
  - Neo4j
  - ArangoDB
difficulty: intermediate
tags:
  - concepts
  - nosql-databases
  - nosql
  - document-store
  - key-value
  - column-family
  - mongodb
  - cassandra
  - redis
  - dynamodb
  - couchbase
  - cap-theorem
  - eventual-consistency
  - sql-on-nosql
---

# NoSQL Databases

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

NoSQL (Not Only SQL) databases represent a diverse family of database management systems designed to handle data models and scalability requirements that differ from traditional relational databases. This guide explores the major NoSQL database types, their SQL-like interfaces, and when to use them.

## Quick Reference

### MongoDB (Document Store)

```javascript
// MongoDB Query Language (MQL)
// Insert a document
db.users.insertOne({
  name: "Alice Johnson",
  email: "alice@example.com",
  age: 30,
  tags: ["developer", "python"]
})

// Find with filtering
db.users.find({ age: { $gte: 25 } })

// Aggregation pipeline
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customer_id", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])

// MongoDB SQL Interface (Atlas SQL)
SELECT name, email, age
FROM users
WHERE age >= 25
ORDER BY age DESC
```

### Cassandra (Column-Family Store)

```sql
-- CQL (Cassandra Query Language) - SQL-like syntax
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP
)

-- Insert data
INSERT INTO users (user_id, name, email, created_at)
VALUES (uuid(), 'Bob Smith', 'bob@example.com', toTimestamp(now()))

-- Query with filtering
SELECT * FROM users WHERE user_id = 123e4567-e89b-12d3-a456-426614174000

-- Time-series pattern
CREATE TABLE sensor_data (
  sensor_id UUID,
  reading_time TIMESTAMP,
  temperature DOUBLE,
  PRIMARY KEY (sensor_id, reading_time)
) WITH CLUSTERING ORDER BY (reading_time DESC)
```

### Redis (Key-Value Store)

```bash
# Redis Commands
# Set a key-value pair
SET user:1001 "Alice Johnson"

# Get a value
GET user:1001

# Hash operations
HSET user:1001 name "Alice" email "alice@example.com" age 30
HGET user:1001 name
HGETALL user:1001

# List operations
LPUSH notifications:user:1001 "New message"
LRANGE notifications:user:1001 0 9

# RedisJSON - SQL-like queries
JSON.SET user:1001 $ '{"name":"Alice","age":30,"skills":["Python","SQL"]}'
JSON.GET user:1001
```

### Amazon DynamoDB (Key-Value/Document Store)

```javascript
// AWS SDK for JavaScript v3
import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

// Put item
await client.send(new PutItemCommand({
  TableName: "Users",
  Item: {
    userId: { S: "user123" },
    name: { S: "Charlie Brown" },
    email: { S: "charlie@example.com" }
  }
}));

// Query with partition key
await client.send(new QueryCommand({
  TableName: "Users",
  KeyConditionExpression: "userId = :uid",
  ExpressionAttributeValues: {
    ":uid": { S: "user123" }
  }
}));

// PartiQL (SQL-compatible query language for DynamoDB)
SELECT * FROM Users WHERE userId = 'user123'

INSERT INTO Users VALUE {'userId': 'user456', 'name': 'Diana'}

UPDATE Users SET age = 28 WHERE userId = 'user123'
```

### Couchbase (Document Store)

```sql
-- N1QL (SQL for JSON) - Couchbase's SQL-like query language
SELECT name, email, age
FROM users
WHERE age >= 25 AND city = 'New York'
ORDER BY age DESC

-- Join documents
SELECT u.name, o.order_id, o.total
FROM users u
JOIN orders o ON KEYS u.order_ids
WHERE u.user_id = 'user123'

-- Index creation
CREATE INDEX idx_age ON users(age) WHERE type = 'user'

-- Full-text search
SELECT META().id, name, description
FROM products
WHERE SEARCH(description, "laptop", {"index": "product_fts"})
```

## Overview

### What are NoSQL Databases?

NoSQL databases are non-relational database systems designed to:

- **Scale Horizontally**: Distribute data across multiple servers easily
- **Handle Semi-Structured Data**: Work with flexible schemas and varying data structures
- **Optimize for Specific Use Cases**: Specialize in particular data access patterns
- **Support High Throughput**: Handle massive read/write volumes
- **Enable Distributed Systems**: Operate across multiple data centers and cloud regions

### Why NoSQL Matters

**For Modern Applications:**
- Web-scale applications requiring horizontal scalability
- Real-time data processing and analytics
- Flexible schema requirements during rapid development
- Geographic distribution and multi-region deployments
- High-availability requirements with acceptable eventual consistency

**Performance Benefits:**
- Optimized data models for specific access patterns
- Reduced join operations through data denormalization
- Linear scalability by adding nodes
- Lower latency for specific query patterns

### Key Concepts

**CAP Theorem:**
- **Consistency**: All nodes see the same data at the same time
- **Availability**: Every request receives a response
- **Partition Tolerance**: System continues operating despite network partitions

*Note: You can only guarantee two of three simultaneously*

**BASE vs ACID:**
- **Basically Available**: System guarantees availability
- **Soft State**: State may change over time without input
- **Eventually Consistent**: System will become consistent over time

**Common Trade-offs:**
- Consistency for availability
- ACID transactions for scalability
- Normalization for query performance
- Complex queries for simple data models

## NoSQL Database Categories

### 1. Document Stores

**Description**: Store data as documents (JSON, BSON, XML) with flexible schemas.

**Popular Databases:**
- **MongoDB**: Most popular document database with rich query language
- **Couchbase**: Document database with SQL-like N1QL query language
- **CouchDB**: HTTP-based document store with eventual consistency
- **Amazon DocumentDB**: MongoDB-compatible cloud service
- **Azure Cosmos DB**: Multi-model database with document API

**Key Characteristics:**
```javascript
// Document structure example
{
  "_id": "order_12345",
  "customer": {
    "name": "Alice Johnson",
    "email": "alice@example.com"
  },
  "items": [
    { "product": "Laptop", "quantity": 1, "price": 1200 },
    { "product": "Mouse", "quantity": 2, "price": 25 }
  ],
  "total": 1250,
  "status": "shipped",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Best For:**
- Content management systems
- E-commerce product catalogs
- User profiles and preferences
- Real-time analytics
- Mobile and web applications

### 2. Key-Value Stores

**Description**: Simplest NoSQL model storing data as key-value pairs.

**Popular Databases:**
- **Redis**: In-memory key-value store with rich data structures
- **Amazon DynamoDB**: Fully managed key-value and document database
- **Memcached**: High-performance distributed memory caching
- **Riak**: Distributed key-value store with high availability
- **etcd**: Distributed key-value store for configuration management

**Key Characteristics:**
```python
# Key-value pattern
key = "user:1001:session"
value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Redis example with expiration
SET session:user_1001 "session_data" EX 3600

# Hash structure
HSET user:1001 name "Alice" email "alice@example.com" last_login "2025-01-15"
```

**Best For:**
- Session management
- Caching layers
- Real-time counters and metrics
- Message queues
- Shopping cart data
- User preferences

### 3. Column-Family Stores

**Description**: Store data in columns grouped into column families, optimized for write-heavy workloads.

**Popular Databases:**
- **Apache Cassandra**: Highly scalable, distributed database
- **Apache HBase**: Hadoop-based column store
- **ScyllaDB**: C++ rewrite of Cassandra for better performance
- **Google Bigtable**: Fully managed wide-column store
- **Azure Cosmos DB**: Multi-model with Cassandra API

**Key Characteristics:**
```sql
-- Cassandra table structure
CREATE TABLE user_activities (
  user_id UUID,
  activity_date DATE,
  activity_time TIMESTAMP,
  activity_type TEXT,
  details TEXT,
  PRIMARY KEY ((user_id, activity_date), activity_time)
) WITH CLUSTERING ORDER BY (activity_time DESC)

-- Wide-row example
user_id | activity_date | activity_time        | activity_type | details
--------|---------------|---------------------|---------------|----------
123     | 2025-01-15   | 2025-01-15 10:30:00 | login        | "web"
123     | 2025-01-15   | 2025-01-15 10:35:00 | view_product | "prod_456"
123     | 2025-01-15   | 2025-01-15 10:40:00 | add_to_cart  | "prod_456"
```

**Best For:**
- Time-series data
- Event logging and analytics
- IoT sensor data
- Social media feeds
- Recommendation systems
- Write-heavy applications

### 4. Graph Databases

**Description**: Store data as nodes and relationships, optimized for traversing connections.

**Popular Databases:**
- **Neo4j**: Leading native graph database
- **Amazon Neptune**: Fully managed graph database
- **ArangoDB**: Multi-model database with graph support
- **JanusGraph**: Distributed graph database
- **TigerGraph**: High-performance graph analytics

For detailed coverage, see [Graph Databases Guide](/concepts/graph-databases/).

**Quick Example:**
```cypher
// Cypher (Neo4j)
CREATE (alice:Person {name: 'Alice', age: 30})
CREATE (bob:Person {name: 'Bob', age: 35})
CREATE (alice)-[:FOLLOWS]->(bob)

// Find friends of friends
MATCH (user:Person {name: 'Alice'})-[:FOLLOWS]->(:Person)-[:FOLLOWS]->(fof:Person)
RETURN DISTINCT fof.name
```

**Best For:**
- Social networks
- Fraud detection
- Recommendation engines
- Knowledge graphs
- Network analysis
- Identity and access management

## SQL Interfaces for NoSQL Databases

Many NoSQL databases now provide SQL or SQL-like query interfaces, bridging the gap between NoSQL flexibility and SQL familiarity.

### MongoDB Atlas SQL Interface

```sql
-- Standard SQL queries on MongoDB collections
SELECT
  customer.name,
  COUNT(*) as order_count,
  SUM(total) as total_spent
FROM orders
WHERE status = 'completed'
GROUP BY customer.name
HAVING total_spent > 1000
ORDER BY total_spent DESC

-- Join operations
SELECT
  u.name,
  u.email,
  o.order_id,
  o.total
FROM users u
JOIN orders o ON u._id = o.customer_id
WHERE o.status = 'pending'
```

### Couchbase N1QL

```sql
-- N1QL is full SQL for JSON documents
-- Standard SQL with JSON path expressions
SELECT
  name,
  address.city,
  ARRAY_LENGTH(orders) as order_count
FROM customers
WHERE address.country = 'USA'
  AND ANY order IN orders SATISFIES order.total > 100 END

-- Window functions
SELECT
  product_id,
  sale_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY product_id
    ORDER BY sale_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as rolling_7day_sales
FROM sales

-- Full-text search
SELECT name, description, price
FROM products
WHERE SEARCH(products, {
  "query": {
    "match": "wireless headphones",
    "field": "description"
  }
})
```

### DynamoDB PartiQL

```sql
-- PartiQL: SQL-compatible query language for DynamoDB
-- SELECT with conditions
SELECT *
FROM Orders
WHERE CustomerId = 'cust_123'
  AND OrderDate BETWEEN '2025-01-01' AND '2025-01-31'

-- INSERT
INSERT INTO Users VALUE {
  'UserId': 'user_789',
  'Name': 'Eva Green',
  'Email': 'eva@example.com',
  'Age': 28
}

-- UPDATE with conditions
UPDATE Products
SET Price = Price * 0.9, OnSale = true
WHERE Category = 'Electronics' AND Stock > 10

-- DELETE
DELETE FROM Sessions
WHERE UserId = 'user_123' AND ExpiresAt < '2025-01-15'
```

### Cassandra CQL

```sql
-- CQL (Cassandra Query Language) is SQL-like
CREATE KEYSPACE ecommerce
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 3
}

CREATE TABLE products (
  category TEXT,
  product_id UUID,
  name TEXT,
  price DECIMAL,
  inventory INT,
  PRIMARY KEY (category, product_id)
)

-- Queries must use partition key
SELECT * FROM products
WHERE category = 'Electronics'

-- Batch operations
BEGIN BATCH
  INSERT INTO products (category, product_id, name, price)
  VALUES ('Electronics', uuid(), 'Laptop', 1299.99);

  UPDATE inventory
  SET quantity = quantity - 1
  WHERE product_id = 123e4567-e89b-12d3-a456-426614174000;
APPLY BATCH;

-- Materialized views
CREATE MATERIALIZED VIEW products_by_price AS
  SELECT category, product_id, name, price
  FROM products
  WHERE price IS NOT NULL AND category IS NOT NULL AND product_id IS NOT NULL
  PRIMARY KEY (price, category, product_id)
```

### Apache Drill (Multi-Source SQL)

```sql
-- Query across NoSQL and SQL databases
-- Query MongoDB
SELECT * FROM mongo.mydb.users WHERE age > 25

-- Query JSON files
SELECT customer.name, order.total
FROM dfs.`/data/orders/*.json`
WHERE order.status = 'completed'

-- Join MongoDB with PostgreSQL
SELECT
  m.name,
  m.email,
  p.order_total
FROM mongo.db.customers m
JOIN postgres.public.order_summaries p
  ON m.customer_id = p.customer_id
```

### Presto/Trino (Distributed SQL)

```sql
-- Query multiple data sources with standard SQL
-- MongoDB connector
SELECT name, age, email
FROM mongodb.catalog.users
WHERE age BETWEEN 25 AND 40

-- Cassandra connector
SELECT user_id, COUNT(*) as event_count
FROM cassandra.analytics.user_events
WHERE event_date >= DATE '2025-01-01'
GROUP BY user_id

-- Cross-database join
SELECT
  m.user_name,
  m.email,
  COUNT(c.event_id) as total_events
FROM mongodb.app.users m
JOIN cassandra.events.user_activities c
  ON m.user_id = CAST(c.user_id AS VARCHAR)
GROUP BY m.user_name, m.email
```

## Detailed Platform Guides

### MongoDB

**Overview**: The most popular document database with a rich ecosystem and mature tooling.

**Data Model:**
```javascript
// Flexible schema - documents in same collection can vary
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "type": "user",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "profile": {
    "age": 30,
    "city": "San Francisco"
  },
  "interests": ["coding", "hiking", "photography"],
  "created_at": ISODate("2025-01-15T10:30:00Z")
}
```

**Query Examples:**

::: details MongoDB Query Language (MQL)

```javascript
// Find operations
db.users.find({ "profile.age": { $gte: 25, $lte: 40 } })

db.users.find({
  interests: { $in: ["coding", "design"] },
  "profile.city": "San Francisco"
}).limit(10)

// Update operations
db.users.updateOne(
  { email: "alice@example.com" },
  {
    $set: { "profile.age": 31 },
    $push: { interests: "gardening" }
  }
)

// Aggregation pipeline
db.orders.aggregate([
  { $match: { status: "completed", order_date: { $gte: ISODate("2025-01-01") } } },
  { $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer_info"
  }},
  { $unwind: "$customer_info" },
  { $group: {
      _id: "$customer_info.name",
      total_orders: { $sum: 1 },
      total_amount: { $sum: "$total" },
      avg_order: { $avg: "$total" }
  }},
  { $sort: { total_amount: -1 } },
  { $limit: 10 }
])

// Text search
db.articles.createIndex({ title: "text", content: "text" })
db.articles.find({ $text: { $search: "mongodb nosql database" } })

// Geospatial queries
db.restaurants.createIndex({ location: "2dsphere" })
db.restaurants.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-122.4, 37.8] },
      $maxDistance: 5000  // 5km
    }
  }
})
```

:::

**SQL Interface (Atlas SQL / MongoDB Connector for BI):**

::: details MongoDB Atlas SQL

```sql
-- Standard SQL on MongoDB collections
SELECT
  customer_info.name,
  customer_info.email,
  COUNT(*) as order_count,
  SUM(total) as total_spent,
  AVG(total) as avg_order_value
FROM orders
WHERE status = 'completed'
  AND order_date >= '2025-01-01'
GROUP BY customer_info.name, customer_info.email
HAVING total_spent > 1000
ORDER BY total_spent DESC
LIMIT 10

-- Nested document querying
SELECT
  name,
  profile.age,
  profile.city,
  ARRAY_LENGTH(interests) as interest_count
FROM users
WHERE profile.age BETWEEN 25 AND 40
  AND profile.city = 'San Francisco'

-- Array operations
SELECT
  name,
  email,
  interest
FROM users
CROSS JOIN UNNEST(interests) AS interest
WHERE interest IN ('coding', 'design')
```

:::

**Indexing:**
```javascript
// Single field index
db.users.createIndex({ email: 1 })

// Compound index
db.orders.createIndex({ customer_id: 1, order_date: -1 })

// Multikey index (for arrays)
db.users.createIndex({ interests: 1 })

// Text index
db.articles.createIndex({ title: "text", content: "text" })

// Geospatial index
db.locations.createIndex({ coordinates: "2dsphere" })

// TTL index (automatic expiration)
db.sessions.createIndex({ created_at: 1 }, { expireAfterSeconds: 3600 })
```

**Transactions:**
```javascript
// Multi-document ACID transactions (MongoDB 4.0+)
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    await accounts.updateOne(
      { account_id: "A" },
      { $inc: { balance: -100 } },
      { session }
    );

    await accounts.updateOne(
      { account_id: "B" },
      { $inc: { balance: 100 } },
      { session }
    );
  });
} finally {
  await session.endSession();
}
```

### Cassandra

**Overview**: Highly scalable, distributed column-family database designed for high availability with no single point of failure.

**Data Model:**
```sql
-- Wide-row model optimized for queries
CREATE TABLE user_events (
  user_id UUID,           -- Partition key
  event_date DATE,        -- Partition key
  event_time TIMESTAMP,   -- Clustering column
  event_type TEXT,
  details TEXT,
  metadata MAP<TEXT, TEXT>,
  PRIMARY KEY ((user_id, event_date), event_time)
) WITH CLUSTERING ORDER BY (event_time DESC)
```

**Query Examples:**

::: details Cassandra CQL

```sql
-- Queries must include partition key
SELECT * FROM user_events
WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
  AND event_date = '2025-01-15'

-- Range query on clustering column
SELECT * FROM user_events
WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
  AND event_date = '2025-01-15'
  AND event_time >= '2025-01-15 10:00:00'
  AND event_time < '2025-01-15 11:00:00'

-- Collection operations
UPDATE users
SET interests = interests + {'photography', 'hiking'}
WHERE user_id = 123e4567-e89b-12d3-a456-426614174000

-- Counter columns
CREATE TABLE page_views (
  page_id UUID PRIMARY KEY,
  view_count COUNTER
)

UPDATE page_views
SET view_count = view_count + 1
WHERE page_id = 123e4567-e89b-12d3-a456-426614174000

-- Batch operations
BEGIN BATCH
  INSERT INTO users (user_id, name, email)
  VALUES (uuid(), 'Charlie', 'charlie@example.com');

  INSERT INTO user_events (user_id, event_date, event_time, event_type)
  VALUES (uuid(), '2025-01-15', toTimestamp(now()), 'signup');
APPLY BATCH;

-- Time-to-live (TTL)
INSERT INTO sessions (session_id, user_id, data)
VALUES (uuid(), uuid(), 'session_data')
USING TTL 3600;  -- Expires after 1 hour

-- Lightweight transactions (compare-and-set)
INSERT INTO users (user_id, email, name)
VALUES (uuid(), 'alice@example.com', 'Alice')
IF NOT EXISTS
```

:::

**Secondary Indexes:**
```sql
-- Secondary index (use sparingly)
CREATE INDEX ON users (email);

-- SASI index (more flexible)
CREATE CUSTOM INDEX ON users (name)
USING 'org.apache.cassandra.index.sasi.SASIIndex';

-- Search with secondary index
SELECT * FROM users WHERE email = 'alice@example.com';
```

**Materialized Views:**
```sql
-- Automatic denormalization
CREATE MATERIALIZED VIEW users_by_email AS
  SELECT user_id, name, email, created_at
  FROM users
  WHERE email IS NOT NULL AND user_id IS NOT NULL
  PRIMARY KEY (email, user_id);

-- Query the materialized view
SELECT * FROM users_by_email WHERE email = 'alice@example.com';
```

**Tunable Consistency:**
```sql
-- Per-query consistency levels
SELECT * FROM users WHERE user_id = ?
CONSISTENCY QUORUM;

-- Available levels: ANY, ONE, TWO, THREE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM
INSERT INTO users (user_id, name) VALUES (?, ?)
CONSISTENCY ONE;
```

### Redis

**Overview**: In-memory key-value store known for exceptional performance, supporting rich data structures.

**Data Structures:**

::: details Redis Commands

```bash
# Strings
SET user:1001:name "Alice Johnson"
GET user:1001:name
INCR page:views:homepage
SETEX session:user_1001 3600 "session_data"  # With expiration

# Hashes (maps)
HSET user:1001 name "Alice" email "alice@example.com" age 30
HGET user:1001 name
HGETALL user:1001
HINCRBY user:1001 login_count 1

# Lists
LPUSH notifications:user:1001 "New message from Bob"
RPUSH tasks:queue "task_1" "task_2" "task_3"
LRANGE notifications:user:1001 0 9  # Get first 10
LPOP tasks:queue  # Process task from queue

# Sets
SADD user:1001:interests "coding" "hiking" "photography"
SMEMBERS user:1001:interests
SISMEMBER user:1001:interests "coding"  # Returns 1 if exists

# Set operations
SINTER user:1001:interests user:1002:interests  # Common interests
SUNION user:1001:interests user:1002:interests  # All interests
SDIFF user:1001:interests user:1002:interests   # Unique to user 1001

# Sorted Sets (scored sets)
ZADD leaderboard 1000 "player1" 1500 "player2" 800 "player3"
ZRANGE leaderboard 0 9  # Top 10 by score
ZREVRANGE leaderboard 0 9  # Top 10 descending
ZINCRBY leaderboard 50 "player1"  # Add to score
ZRANK leaderboard "player1"  # Get rank

# HyperLogLog (cardinality estimation)
PFADD unique:visitors:2025-01-15 "user1" "user2" "user3"
PFCOUNT unique:visitors:2025-01-15  # Approximate count

# Geospatial
GEOADD locations -122.4 37.8 "San Francisco" -118.2 34.0 "Los Angeles"
GEODIST locations "San Francisco" "Los Angeles" mi
GEORADIUS locations -122.4 37.8 100 mi  # Find within 100 miles

# Bitmaps
SETBIT user:1001:visited:2025-01-15 0 1  # Mark page 0 visited
GETBIT user:1001:visited:2025-01-15 0
BITCOUNT user:1001:visited:2025-01-15  # Count pages visited

# Streams (log-like data structure)
XADD events:login * user_id 1001 timestamp 1705330000
XREAD STREAMS events:login 0  # Read all entries
XRANGE events:login - +  # Get all entries
```

:::

**RedisJSON (JSON support):**

::: details RedisJSON

```bash
# Store JSON documents
JSON.SET user:1001 $ '{
  "name": "Alice Johnson",
  "age": 30,
  "email": "alice@example.com",
  "address": {
    "city": "San Francisco",
    "state": "CA"
  },
  "interests": ["coding", "hiking"]
}'

# Get full document
JSON.GET user:1001

# Get specific path
JSON.GET user:1001 $.address.city

# Update specific field
JSON.SET user:1001 $.age 31

# Array operations
JSON.ARRAPPEND user:1001 $.interests '"photography"'
JSON.ARRLEN user:1001 $.interests

# Numeric operations
JSON.NUMINCRBY user:1001 $.age 1
```

:::

**Redis Search (Full-text search):**

::: details RediSearch

```bash
# Create index
FT.CREATE idx:users ON JSON PREFIX 1 user: SCHEMA
  $.name AS name TEXT
  $.email AS email TAG
  $.age AS age NUMERIC
  $.address.city AS city TAG

# Full-text search
FT.SEARCH idx:users "Alice"

# Filtered search
FT.SEARCH idx:users "@city:{San Francisco} @age:[25 40]"

# Aggregation
FT.AGGREGATE idx:users "*"
  GROUPBY 1 @city
  REDUCE COUNT 0 AS count
  SORTBY 2 @count DESC
```

:::

**Pub/Sub:**
```bash
# Publisher
PUBLISH notifications:user:1001 "New message"

# Subscriber
SUBSCRIBE notifications:user:1001

# Pattern subscription
PSUBSCRIBE notifications:*
```

### DynamoDB

**Overview**: Fully managed, serverless key-value and document database by AWS with single-digit millisecond latency.

**Table Structure:**

::: details DynamoDB Table Design

```javascript
// Table with partition key and sort key
{
  TableName: "Orders",
  KeySchema: [
    { AttributeName: "CustomerId", KeyType: "HASH" },    // Partition key
    { AttributeName: "OrderDate", KeyType: "RANGE" }      // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: "CustomerId", AttributeType: "S" },
    { AttributeName: "OrderDate", AttributeType: "S" },
    { AttributeName: "Status", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "StatusIndex",
      KeySchema: [
        { AttributeName: "Status", KeyType: "HASH" },
        { AttributeName: "OrderDate", KeyType: "RANGE" }
      ],
      Projection: { ProjectionType: "ALL" }
    }
  ]
}
```

:::

**Query Operations:**

::: details DynamoDB SDK Examples

```javascript
import { DynamoDBClient, PutItemCommand, GetItemCommand,
         QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

// Put item
await client.send(new PutItemCommand({
  TableName: "Orders",
  Item: {
    CustomerId: { S: "cust_123" },
    OrderDate: { S: "2025-01-15T10:30:00Z" },
    OrderId: { S: "order_789" },
    Items: { L: [
      { M: {
        ProductId: { S: "prod_456" },
        Quantity: { N: "2" },
        Price: { N: "49.99" }
      }}
    ]},
    Total: { N: "99.98" },
    Status: { S: "pending" }
  }
}));

// Get item
await client.send(new GetItemCommand({
  TableName: "Orders",
  Key: {
    CustomerId: { S: "cust_123" },
    OrderDate: { S: "2025-01-15T10:30:00Z" }
  }
}));

// Query with partition key
await client.send(new QueryCommand({
  TableName: "Orders",
  KeyConditionExpression: "CustomerId = :cid AND OrderDate >= :date",
  ExpressionAttributeValues: {
    ":cid": { S: "cust_123" },
    ":date": { S: "2025-01-01" }
  }
}));

// Query Global Secondary Index
await client.send(new QueryCommand({
  TableName: "Orders",
  IndexName: "StatusIndex",
  KeyConditionExpression: "Status = :status",
  ExpressionAttributeValues: {
    ":status": { S: "pending" }
  }
}));

// Update item
await client.send(new UpdateItemCommand({
  TableName: "Orders",
  Key: {
    CustomerId: { S: "cust_123" },
    OrderDate: { S: "2025-01-15T10:30:00Z" }
  },
  UpdateExpression: "SET Status = :status, UpdatedAt = :now",
  ExpressionAttributeValues: {
    ":status": { S: "shipped" },
    ":now": { S: new Date().toISOString() }
  }
}));

// Conditional update
await client.send(new UpdateItemCommand({
  TableName: "Orders",
  Key: { CustomerId: { S: "cust_123" }, OrderDate: { S: "2025-01-15T10:30:00Z" } },
  UpdateExpression: "SET Status = :newstatus",
  ConditionExpression: "Status = :oldstatus",
  ExpressionAttributeValues: {
    ":newstatus": { S: "shipped" },
    ":oldstatus": { S: "pending" }
  }
}));
```

:::

**PartiQL Queries:**

::: details DynamoDB PartiQL

```sql
-- SELECT queries
SELECT * FROM Orders
WHERE CustomerId = 'cust_123' AND OrderDate >= '2025-01-01'

SELECT CustomerId, OrderDate, Total, Status
FROM Orders
WHERE CustomerId = 'cust_123'

-- INSERT
INSERT INTO Orders VALUE {
  'CustomerId': 'cust_456',
  'OrderDate': '2025-01-15T10:30:00Z',
  'OrderId': 'order_999',
  'Total': 199.99,
  'Status': 'pending'
}

-- UPDATE
UPDATE Orders
SET Status = 'shipped', ShippedDate = '2025-01-16'
WHERE CustomerId = 'cust_123' AND OrderDate = '2025-01-15T10:30:00Z'

-- DELETE
DELETE FROM Orders
WHERE CustomerId = 'cust_123' AND OrderDate = '2025-01-15T10:30:00Z'

-- Conditional operations
UPDATE Orders
SET Status = 'cancelled'
WHERE CustomerId = 'cust_123'
  AND OrderDate = '2025-01-15T10:30:00Z'
  AND Status = 'pending'
```

:::

**DynamoDB Streams:**
```javascript
// Enable streams for change data capture
{
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: "NEW_AND_OLD_IMAGES"
  }
}

// Process stream events (Lambda trigger)
exports.handler = async (event) => {
  for (const record of event.Records) {
    console.log('DynamoDB Record:', record.dynamodb);
    if (record.eventName === 'INSERT') {
      // Process new item
    } else if (record.eventName === 'MODIFY') {
      // Process update
    }
  }
};
```

### Couchbase

**Overview**: Distributed document database with strong consistency options and powerful N1QL (SQL for JSON).

**N1QL Query Examples:**

::: details Couchbase N1QL

```sql
-- Standard SQL operations
SELECT name, email, address.city
FROM users
WHERE address.country = 'USA' AND age >= 25
ORDER BY name
LIMIT 100

-- Array operations
SELECT
  name,
  ARRAY_LENGTH(orders) as order_count,
  ARRAY item.name FOR item IN orders END as order_items
FROM customers
WHERE ANY order IN orders SATISFIES order.total > 100 END

-- Joins
SELECT u.name, u.email, o.order_id, o.total
FROM users u
JOIN orders o ON KEYS u.order_ids
WHERE o.status = 'completed'

-- Aggregations
SELECT
  address.city,
  COUNT(*) as customer_count,
  AVG(age) as avg_age
FROM customers
WHERE address.country = 'USA'
GROUP BY address.city
HAVING customer_count > 10

-- Window functions
SELECT
  product_id,
  sale_date,
  amount,
  ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sale_date) as sale_number,
  SUM(amount) OVER (
    PARTITION BY product_id
    ORDER BY sale_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as rolling_7day_total
FROM sales

-- Subqueries
SELECT name, email
FROM users u
WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.id) > 5

-- UPSERT (insert or update)
UPSERT INTO users (KEY, VALUE)
VALUES ("user::1001", {
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "updated_at": NOW_STR()
})

-- MERGE (conditional upsert)
MERGE INTO users USING [
  { "id": "user::1001", "name": "Alice", "age": 30 },
  { "id": "user::1002", "name": "Bob", "age": 35 }
] AS source ON KEYS source.id
WHEN MATCHED THEN UPDATE SET users.age = source.age
WHEN NOT MATCHED THEN INSERT source

-- CTEs (Common Table Expressions)
WITH active_customers AS (
  SELECT customer_id, COUNT(*) as order_count
  FROM orders
  WHERE order_date >= DATE_ADD_STR(NOW_STR(), -90, 'day')
  GROUP BY customer_id
  HAVING order_count >= 3
)
SELECT u.name, u.email, ac.order_count
FROM users u
JOIN active_customers ac ON KEYS u.customer_id
```

:::

**Full-Text Search:**

::: details Couchbase FTS

```sql
-- Create FTS index (via Admin Console or REST API)
-- Then query with SEARCH function

-- Simple text search
SELECT META().id, name, description
FROM products
WHERE SEARCH(products, "laptop", {"index": "products_fts"})

-- Advanced search with scoring
SELECT
  META().id,
  name,
  description,
  SEARCH_SCORE() as relevance
FROM products
WHERE SEARCH(products, {
  "query": {
    "match": "wireless headphones bluetooth",
    "field": "description"
  }
}, {"index": "products_fts"})
ORDER BY relevance DESC

-- Faceted search
SELECT
  category,
  COUNT(*) as count
FROM products
WHERE SEARCH(products, "laptop", {"index": "products_fts"})
GROUP BY category
```

:::

**Transactions:**
```sql
-- ACID transactions across documents
BEGIN TRANSACTION;

UPDATE accounts
SET balance = balance - 100
WHERE account_id = 'acct_001';

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 'acct_002';

INSERT INTO transactions (KEY, VALUE)
VALUES (UUID(), {
  "from": "acct_001",
  "to": "acct_002",
  "amount": 100,
  "timestamp": NOW_STR()
});

COMMIT TRANSACTION;
```

## When to Use NoSQL vs SQL

### Use NoSQL When:

**Scalability Requirements:**
- Need to scale horizontally across many servers
- Managing web-scale data (terabytes to petabytes)
- High write throughput requirements
- Need geographic distribution

**Data Model:**
- Schema is flexible or frequently changing
- Semi-structured or unstructured data
- Hierarchical or nested data structures
- Data doesn't fit well into tables

**Performance:**
- Single-digit millisecond latency requirements
- Simple query patterns with known access paths
- Denormalization is acceptable for performance

**Development:**
- Rapid prototyping with changing requirements
- Object-document mapping for application objects
- Modern development with JSON/REST APIs

### Use SQL When:

**Data Requirements:**
- Complex relationships between entities
- Need ACID transactions across multiple records
- Strong consistency is critical
- Data integrity constraints are important

**Query Patterns:**
- Ad-hoc analytical queries
- Complex joins across multiple tables
- Need for aggregations and reporting
- Queries unknown at design time

**Organizational:**
- Team expertise in SQL
- Existing SQL-based tools and ecosystem
- Regulatory compliance requiring strict ACID
- Need for standard query language

### Hybrid Approaches

Many modern applications use both:

```javascript
// Example architecture
{
  // PostgreSQL for transactional data
  "users": "PostgreSQL",
  "orders": "PostgreSQL",
  "payments": "PostgreSQL",

  // MongoDB for product catalog
  "products": "MongoDB",
  "reviews": "MongoDB",

  // Redis for caching and sessions
  "sessions": "Redis",
  "cart": "Redis",

  // Cassandra for time-series events
  "clickstream": "Cassandra",
  "analytics_events": "Cassandra",

  // Elasticsearch for search
  "product_search": "Elasticsearch"
}
```

## Use Cases by NoSQL Type

### Document Stores (MongoDB, Couchbase)

**Content Management:**
```javascript
// Flexible schema for different content types
{
  "content_type": "article",
  "title": "Getting Started with NoSQL",
  "author": { "name": "Alice", "id": "user_123" },
  "tags": ["nosql", "databases", "tutorial"],
  "body": "...",
  "published_at": "2025-01-15T10:00:00Z",
  "comments": [
    { "user": "Bob", "text": "Great article!", "timestamp": "..." }
  ]
}

{
  "content_type": "video",
  "title": "NoSQL Database Tutorial",
  "duration": 1200,
  "thumbnail_url": "...",
  "transcripts": [...],
  "subtitles": {"en": "...", "es": "..."}
}
```

**Product Catalogs:**
```javascript
// Variable attributes per product
{
  "product_id": "prod_123",
  "name": "Wireless Headphones",
  "category": "Electronics",
  "price": 129.99,
  "specs": {
    "bluetooth": "5.0",
    "battery_life": "30 hours",
    "noise_cancellation": true
  },
  "reviews": [...],
  "inventory": { "warehouse_a": 50, "warehouse_b": 30 }
}

{
  "product_id": "prod_456",
  "name": "Running Shoes",
  "category": "Footwear",
  "price": 89.99,
  "specs": {
    "size": "10",
    "color": "Blue",
    "material": "Mesh"
  }
}
```

**User Profiles:**
```javascript
{
  "user_id": "user_789",
  "email": "alice@example.com",
  "profile": {
    "name": "Alice Johnson",
    "avatar_url": "...",
    "bio": "..."
  },
  "preferences": {
    "theme": "dark",
    "notifications": { "email": true, "push": false }
  },
  "activity": {
    "last_login": "2025-01-15T10:30:00Z",
    "login_count": 156
  }
}
```

### Key-Value Stores (Redis, DynamoDB)

**Session Management:**
```python
# Redis session storage
import redis
import json

r = redis.Redis()

# Store session
session_data = {
    "user_id": "user_123",
    "authenticated": True,
    "cart_items": ["prod_1", "prod_2"],
    "created_at": "2025-01-15T10:00:00Z"
}
r.setex(f"session:{session_id}", 3600, json.dumps(session_data))

# Retrieve session
session = json.loads(r.get(f"session:{session_id}"))
```

**Caching:**
```python
# Cache-aside pattern
def get_user(user_id):
    # Try cache first
    cached = r.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # Cache miss - query database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # Store in cache
    r.setex(f"user:{user_id}", 300, json.dumps(user))
    return user
```

**Real-time Leaderboards:**
```python
# Redis sorted sets for rankings
# Add player score
r.zadd("leaderboard:global", {"player_123": 15000})

# Get top 10
top_players = r.zrevrange("leaderboard:global", 0, 9, withscores=True)

# Get player rank
rank = r.zrevrank("leaderboard:global", "player_123")

# Get score range
players_in_range = r.zrangebyscore("leaderboard:global", 10000, 20000)
```

**Rate Limiting:**
```python
# Token bucket rate limiting
def check_rate_limit(user_id, max_requests=100, window=3600):
    key = f"ratelimit:{user_id}"
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    count, _ = pipe.execute()
    return count[0] <= max_requests
```

### Column-Family Stores (Cassandra, HBase)

**Time-Series Data:**
```sql
-- IoT sensor data
CREATE TABLE sensor_readings (
  sensor_id UUID,
  reading_date DATE,
  reading_time TIMESTAMP,
  temperature DOUBLE,
  humidity DOUBLE,
  pressure DOUBLE,
  PRIMARY KEY ((sensor_id, reading_date), reading_time)
) WITH CLUSTERING ORDER BY (reading_time DESC)

-- Query recent readings
SELECT * FROM sensor_readings
WHERE sensor_id = 123e4567-e89b-12d3-a456-426614174000
  AND reading_date = '2025-01-15'
  AND reading_time >= '2025-01-15 10:00:00'
ORDER BY reading_time DESC
LIMIT 100
```

**Event Logging:**
```sql
-- Application logs
CREATE TABLE application_logs (
  app_id TEXT,
  log_date DATE,
  log_time TIMEUUID,
  level TEXT,
  message TEXT,
  metadata MAP<TEXT, TEXT>,
  PRIMARY KEY ((app_id, log_date), log_time)
) WITH CLUSTERING ORDER BY (log_time DESC)

-- Query today's errors
SELECT * FROM application_logs
WHERE app_id = 'web_app'
  AND log_date = '2025-01-15'
  AND level = 'ERROR'
```

**Social Media Feeds:**
```sql
-- User activity feed
CREATE TABLE user_feed (
  user_id UUID,
  activity_time TIMEUUID,
  activity_type TEXT,
  actor_id UUID,
  content TEXT,
  metadata MAP<TEXT, TEXT>,
  PRIMARY KEY (user_id, activity_time)
) WITH CLUSTERING ORDER BY (activity_time DESC)

-- Get recent feed items
SELECT * FROM user_feed
WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
ORDER BY activity_time DESC
LIMIT 50
```

## Performance Considerations

### Indexing Strategies

**MongoDB:**
```javascript
// Create appropriate indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.orders.createIndex({ customer_id: 1, order_date: -1 })

// Analyze query performance
db.users.find({ email: "alice@example.com" }).explain("executionStats")

// Monitor index usage
db.users.aggregate([{ $indexStats: {} }])
```

**Cassandra:**
```sql
-- Partition key is always indexed
-- Add secondary indexes sparingly
CREATE INDEX users_email_idx ON users (email);

-- Prefer materialized views for query flexibility
CREATE MATERIALIZED VIEW users_by_email AS
  SELECT * FROM users
  WHERE email IS NOT NULL AND user_id IS NOT NULL
  PRIMARY KEY (email, user_id);
```

**Redis:**
```bash
# Use appropriate data structures
# Hashes for objects (more memory efficient than JSON strings)
HSET user:1001 name "Alice" email "alice@example.com"

# Sorted sets for rankings/scores
ZADD leaderboard 1000 "player1"

# Use RediSearch for complex queries
FT.CREATE idx:users ON HASH PREFIX 1 user: SCHEMA name TEXT email TAG
```

### Data Modeling Best Practices

**Denormalization:**
```javascript
// MongoDB: Embed related data to avoid joins
{
  "order_id": "order_123",
  "customer": {
    "id": "cust_456",
    "name": "Alice Johnson",  // Denormalized
    "email": "alice@example.com"  // Denormalized
  },
  "items": [
    {
      "product_id": "prod_789",
      "name": "Laptop",  // Denormalized
      "price": 1299.99
    }
  ],
  "total": 1299.99
}
```

**Reference Pattern:**
```javascript
// When data is large or frequently updated, use references
{
  "order_id": "order_123",
  "customer_id": "cust_456",  // Reference
  "item_ids": ["item_1", "item_2"],  // References
  "total": 1299.99
}

// Retrieve with application-level join or $lookup
db.orders.aggregate([
  { $match: { order_id: "order_123" } },
  { $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer"
  }}
])
```

**Cassandra Query-First Design:**
```sql
-- Design tables based on queries
-- Query: Get user's recent orders
CREATE TABLE orders_by_user (
  user_id UUID,
  order_date DATE,
  order_time TIMESTAMP,
  order_id UUID,
  total DECIMAL,
  PRIMARY KEY ((user_id, order_date), order_time)
) WITH CLUSTERING ORDER BY (order_time DESC)

-- Query: Get order details
CREATE TABLE orders_by_id (
  order_id UUID PRIMARY KEY,
  user_id UUID,
  items LIST<FROZEN<order_item>>,
  total DECIMAL,
  status TEXT
)
```

### Caching Strategies

**Cache-Aside:**
```python
def get_product(product_id):
    # Check cache
    cached = redis.get(f"product:{product_id}")
    if cached:
        return json.loads(cached)

    # Query database
    product = mongodb.products.find_one({"_id": product_id})

    # Update cache
    redis.setex(f"product:{product_id}", 600, json.dumps(product))
    return product
```

**Write-Through:**
```python
def update_product(product_id, updates):
    # Update database
    mongodb.products.update_one(
        {"_id": product_id},
        {"$set": updates}
    )

    # Update cache
    product = mongodb.products.find_one({"_id": product_id})
    redis.setex(f"product:{product_id}", 600, json.dumps(product))
```

**Write-Behind:**
```python
def add_to_cart(user_id, product_id):
    # Update cache immediately
    redis.lpush(f"cart:{user_id}", product_id)

    # Queue database update
    queue.publish("cart_updates", {
        "user_id": user_id,
        "product_id": product_id,
        "action": "add"
    })
```

## Common Pitfalls

### 1. Not Understanding the CAP Theorem

```javascript
// ❌ Expecting strong consistency in eventually consistent systems
const balance1 = await dynamodb.get({ UserId: "user_123" })
await dynamodb.update({ UserId: "user_123", Balance: balance1 - 100 })
// Race condition - balance may have changed!

// ✅ Use conditional updates
await dynamodb.update({
  Key: { UserId: "user_123" },
  UpdateExpression: "SET Balance = Balance - :amount",
  ConditionExpression: "Balance >= :amount",
  ExpressionAttributeValues: { ":amount": 100 }
})
```

### 2. Over-Denormalization

```javascript
// ❌ Duplicating large, frequently updated data
{
  "order_id": "order_123",
  "customer": {
    "name": "Alice",
    "email": "alice@example.com",
    "full_address": {...},  // Large nested object
    "order_history": [...]  // Frequently updated
  }
}

// ✅ Balance embedding with references
{
  "order_id": "order_123",
  "customer_id": "cust_456",
  "customer_snapshot": {  // Only essential fields at order time
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

### 3. Ignoring Query Patterns in Design

```sql
-- ❌ Cassandra: Querying without partition key
SELECT * FROM orders WHERE status = 'pending'  -- Full table scan!

-- ✅ Design table for this query
CREATE TABLE orders_by_status (
  status TEXT,
  order_date DATE,
  order_id UUID,
  customer_id UUID,
  total DECIMAL,
  PRIMARY KEY ((status, order_date), order_id)
)
```

### 4. Not Using Indexes Properly

```javascript
// ❌ MongoDB: Querying without proper index
db.users.find({ "address.city": "San Francisco", age: { $gte: 25 } })
// If no compound index exists, only one field uses index

// ✅ Create compound index
db.users.createIndex({ "address.city": 1, age: 1 })
```

### 5. Inefficient Batch Operations

```python
# ❌ Individual operations in loop
for item in items:
    redis.set(f"item:{item.id}", json.dumps(item))

# ✅ Use pipeline
pipe = redis.pipeline()
for item in items:
    pipe.set(f"item:{item.id}", json.dumps(item))
pipe.execute()
```

### 6. Not Setting TTL for Temporary Data

```javascript
// ❌ Session data without expiration
await redis.set(`session:${sessionId}`, sessionData)

// ✅ Set appropriate TTL
await redis.setex(`session:${sessionId}`, 3600, sessionData)
```

### 7. Unbounded Array Growth

```javascript
// ❌ Unbounded arrays in documents
db.posts.update(
  { post_id: "post_123" },
  { $push: { comments: newComment } }  // Can grow indefinitely!
)

// ✅ Use separate collection or pagination
db.comments.insertOne({
  post_id: "post_123",
  comment: newComment,
  created_at: new Date()
})
```

## Best Practices

### 1. Data Modeling

**Understand Access Patterns First:**
```javascript
// Design schema based on how data will be queried
// Example: E-commerce application

// Query 1: Get user's recent orders
// Query 2: Get order details
// Query 3: Get product information
// Query 4: Search products

// Design tables/collections specifically for these queries
```

**Choose Appropriate Database Type:**
- Document store: Flexible schema, nested data
- Key-value: Simple lookups, caching
- Column-family: Time-series, high write throughput
- Graph: Connected data, relationship queries

### 2. Consistency Management

**Use Appropriate Consistency Levels:**
```sql
-- Cassandra: Balance consistency and availability
-- Strong consistency for financial data
SELECT * FROM accounts WHERE account_id = ?
CONSISTENCY QUORUM

-- Eventual consistency for analytics
SELECT * FROM page_views WHERE page_id = ?
CONSISTENCY ONE
```

**Implement Idempotency:**
```javascript
// Ensure operations can be safely retried
await mongodb.orders.updateOne(
  { order_id: "order_123", status: "pending" },
  {
    $set: {
      status: "processing",
      processed_at: new Date()
    }
  }
)
```

### 3. Scalability Planning

**Partition Keys:**
```sql
-- ❌ Poor partition key (hot partition)
CREATE TABLE orders (
  status TEXT,  -- Only a few values, uneven distribution
  order_id UUID,
  PRIMARY KEY (status, order_id)
)

-- ✅ Good partition key (even distribution)
CREATE TABLE orders (
  customer_id UUID,  -- Many values, even distribution
  order_date DATE,
  order_id UUID,
  PRIMARY KEY ((customer_id, order_date), order_id)
)
```

**Sharding Strategy:**
```javascript
// MongoDB: Choose appropriate shard key
sh.shardCollection("mydb.orders", { customer_id: 1 })  // Good: high cardinality
// Not: sh.shardCollection("mydb.orders", { status: 1 })  // Bad: low cardinality
```

### 4. Monitoring and Optimization

**Monitor Key Metrics:**
```javascript
// MongoDB: Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(10).sort({ ts: -1 })

// Cassandra: Monitor partition sizes
nodetool cfstats keyspace.table
```

**Regular Maintenance:**
```bash
# MongoDB: Analyze and optimize indexes
db.users.aggregate([{ $indexStats: {} }])

# Redis: Monitor memory usage
redis-cli info memory

# Cassandra: Run repairs regularly
nodetool repair
```

### 5. Security

**Authentication and Authorization:**
```javascript
// MongoDB: Enable authentication
mongod --auth

// Create users with specific roles
db.createUser({
  user: "appUser",
  pwd: "securePassword",
  roles: [
    { role: "readWrite", db: "myapp" }
  ]
})
```

**Encryption:**
```javascript
// Enable encryption at rest and in transit
// MongoDB: TLS/SSL connections
mongod --tlsMode requireTLS --tlsCertificateKeyFile /path/to/cert.pem

// DynamoDB: Encryption at rest enabled by default
{
  SSESpecification: {
    Enabled: true,
    SSEType: "KMS",
    KMSMasterKeyId: "arn:aws:kms:..."
  }
}
```

### 6. Backup and Recovery

```bash
# MongoDB: Regular backups
mongodump --out /backup/$(date +%Y%m%d)

# Redis: Persistence configuration
# RDB snapshots
save 900 1
save 300 10

# AOF (Append Only File)
appendonly yes
appendfsync everysec

# Cassandra: Snapshots
nodetool snapshot -t snapshot_$(date +%Y%m%d) keyspace_name
```

## Migration from SQL to NoSQL

### Assessment Phase

**Evaluate Current System:**
```sql
-- Identify frequently accessed queries
-- Example: PostgreSQL query statistics
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

**Identify Migration Candidates:**
- Tables with flexible schemas
- High-volume write operations
- Data requiring horizontal scaling
- Simple query patterns

### Data Modeling Translation

**SQL to Document Store:**
```sql
-- SQL: Normalized tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total DECIMAL
);
```

```javascript
// MongoDB: Embedded documents
{
  "_id": "user_123",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "recent_orders": [
    { "order_id": "order_456", "total": 99.99, "date": "2025-01-15" },
    { "order_id": "order_789", "total": 149.99, "date": "2025-01-10" }
  ]
}
```

**SQL to Column-Family:**
```sql
-- SQL: Time-series table
CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id INT,
  reading_time TIMESTAMP,
  temperature DOUBLE,
  humidity DOUBLE
);
```

```sql
-- Cassandra: Wide-row model
CREATE TABLE sensor_readings (
  sensor_id INT,
  reading_date DATE,
  reading_time TIMESTAMP,
  temperature DOUBLE,
  humidity DOUBLE,
  PRIMARY KEY ((sensor_id, reading_date), reading_time)
) WITH CLUSTERING ORDER BY (reading_time DESC);
```

### Migration Strategies

**1. Parallel Run:**
```python
# Write to both SQL and NoSQL
def create_order(order_data):
    # Write to PostgreSQL (source of truth during migration)
    sql_order_id = postgres.insert_order(order_data)

    # Write to MongoDB (new system)
    try:
        mongo.orders.insert_one({
            "_id": sql_order_id,
            **order_data
        })
    except Exception as e:
        logger.error(f"MongoDB write failed: {e}")

    return sql_order_id
```

**2. Event-Driven Sync:**
```python
# Use CDC (Change Data Capture) to sync
# Debezium, AWS DMS, or custom solution

def handle_postgres_change(event):
    if event.table == "orders":
        if event.operation == "INSERT":
            mongo.orders.insert_one(event.data)
        elif event.operation == "UPDATE":
            mongo.orders.update_one(
                {"_id": event.data["id"]},
                {"$set": event.data}
            )
```

**3. Bulk Migration:**
```python
# One-time data migration
def migrate_users():
    batch_size = 1000
    offset = 0

    while True:
        # Read from SQL
        users = postgres.query(
            "SELECT * FROM users LIMIT %s OFFSET %s",
            (batch_size, offset)
        )

        if not users:
            break

        # Transform and write to NoSQL
        docs = [transform_user(u) for u in users]
        mongo.users.insert_many(docs)

        offset += batch_size
        print(f"Migrated {offset} users")
```

## See Also

- [Graph Databases](/concepts/graph-databases/) - Deep dive into graph database systems
- [JSON and Complex Data Types](/concepts/data-types/) - Working with JSON in SQL databases
- [ACID Properties](/concepts/acid/) - Understanding transactional guarantees
- [Indexes](/concepts/indexes/) - Indexing strategies across database systems
- [Performance Optimization](/concepts/performance/) - Query optimization techniques

## Additional Resources

**MongoDB:**
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [MongoDB Documentation](https://docs.mongodb.com/)

**Cassandra:**
- [DataStax Academy](https://www.datastax.com/dev) - Free training
- [Apache Cassandra Documentation](https://cassandra.apache.org/doc/)

**Redis:**
- [Redis University](https://university.redis.com/) - Free courses
- [Redis Documentation](https://redis.io/documentation)

**DynamoDB:**
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

**General:**
- [NoSQL Databases: An Overview](https://aws.amazon.com/nosql/)
- [CAP Theorem Explained](https://www.ibm.com/cloud/learn/cap-theorem)
