---
title: MySQL
description: The world's most popular open source database
difficulty: intermediate
tags: [mysql, database, open-source]
---

# MySQL

## Overview

MySQL is the world's most popular open source database, powering many of the world's largest websites and applications. Known for its reliability, ease of use, and performance, MySQL is a great choice for web applications, content management systems, and more.

### Key Features

- **Proven Reliability**: Trusted by major companies worldwide
- **Ease of Use**: Simple setup and administration
- **High Performance**: Optimized for web applications
- **Replication**: Master-slave and group replication
- **InnoDB Storage Engine**: ACID-compliant transactions
- **Full-Text Search**: Built-in text search capabilities
- **JSON Support**: Native JSON data type (MySQL 5.7+)
- **Window Functions**: Added in MySQL 8.0

## Getting Started

### Installation

::: code-group

```bash [Ubuntu/Debian]
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

```bash [macOS (Homebrew)]
brew install mysql
brew services start mysql
```

```bash [Docker]
docker run --name mysql \
  -e MYSQL_ROOT_PASSWORD=mysecretpassword \
  -p 3306:3306 \
  -d mysql:8.0
```

:::

### Connecting

```bash
# Connect to MySQL
mysql -u root -p

# Connect to specific database
mysql -u username -p database_name

# Connection string
mysql://username:password@localhost:3306/database_name
```

## MySQL-Specific Features

### AUTO_INCREMENT

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL
);

-- Get last inserted ID
SELECT LAST_INSERT_ID();
```

### Multiple Storage Engines

```sql
-- InnoDB (default, ACID-compliant)
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_date DATE
) ENGINE=InnoDB;

-- MyISAM (fast, but no transactions)
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message TEXT
) ENGINE=MyISAM;
```

### Full-Text Search

```sql
-- Create full-text index
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  FULLTEXT(title, content)
);

-- Full-text search
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('mysql database' IN NATURAL LANGUAGE MODE);

-- Boolean mode search
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('+mysql -oracle' IN BOOLEAN MODE);
```

### JSON Support (MySQL 5.7+)

```sql
-- Create table with JSON column
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  profile JSON
);

-- Insert JSON data
INSERT INTO users (username, profile)
VALUES ('john_doe', '{"age": 30, "city": "New York", "interests": ["coding", "gaming"]}');

-- Query JSON data
SELECT
  username,
  JSON_EXTRACT(profile, '$.age') as age,
  JSON_EXTRACT(profile, '$.city') as city
FROM users;

-- Using -> operator (MySQL 5.7+)
SELECT
  username,
  profile->'$.age' as age,
  profile->>'$.city' as city  -- ->> returns unquoted value
FROM users;
```

## Common Operations

### Database Management

```sql
-- Create database
CREATE DATABASE myapp;

-- Show databases
SHOW DATABASES;

-- Use database
USE myapp;

-- Drop database
DROP DATABASE myapp;
```

### User Management

```sql
-- Create user
CREATE USER 'myuser'@'localhost' IDENTIFIED BY 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON myapp.* TO 'myuser'@'localhost';

-- Show grants
SHOW GRANTS FOR 'myuser'@'localhost';

-- Revoke privileges
REVOKE INSERT ON myapp.* FROM 'myuser'@'localhost';

-- Change password
ALTER USER 'myuser'@'localhost' IDENTIFIED BY 'newpassword';
```

## Best Practices

### 1. Use InnoDB Storage Engine

```sql
-- ✅ Use InnoDB for ACID compliance
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10,2)
) ENGINE=InnoDB;
```

### 2. Define Character Sets

```sql
-- Set at database level
CREATE DATABASE myapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Set at table level
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Use Prepared Statements

```sql
-- Safer and faster with prepared statements
PREPARE stmt FROM 'SELECT * FROM users WHERE username = ?';
SET @username = 'john_doe';
EXECUTE stmt USING @username;
DEALLOCATE PREPARE stmt;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="mysql" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Comparison with PostgreSQL
- [SQL Server](/databases/sqlserver/) - Comparison with SQL Server
- [Window Functions](/concepts/window-functions/) - MySQL 8.0+ feature
- [Performance](/concepts/performance/) - Query optimization

---

**Note**: This is a stub page. Content will be expanded in future updates. Contributions welcome!
