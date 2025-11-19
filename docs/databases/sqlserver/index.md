---
title: SQL Server
description: Comprehensive guide to Microsoft SQL Server - Enterprise-grade relational database management system
difficulty: intermediate
tags: [sqlserver, microsoft, database, enterprise]
---

# SQL Server

## Overview

Microsoft SQL Server is a comprehensive, enterprise-grade relational database management system (RDBMS) developed by Microsoft. It's widely used in enterprise environments for mission-critical applications, offering robust security, high availability, and advanced analytics capabilities.

### Key Features

- **Enterprise-Grade Performance**: Optimized for large-scale applications
- **Advanced Security**: Row-level security, data encryption, and Always Encrypted
- **High Availability**: Always On availability groups, failover clustering
- **Business Intelligence**: Integration with Power BI, SSRS, and SSAS
- **In-Memory Performance**: In-Memory OLTP and columnstore indexes
- **JSON and XML Support**: Native support for semi-structured data
- **T-SQL**: Powerful Transact-SQL language extensions
- **Cross-Platform**: Available on Windows, Linux, and Docker

## Getting Started

### Installation

::: code-group

```bash [Windows]
# Download SQL Server from Microsoft
# https://www.microsoft.com/en-us/sql-server/sql-server-downloads

# Install SQL Server Developer Edition (free)
# Follow the installation wizard
```

```bash [Linux (Ubuntu)]
# Import the GPG keys
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -

# Register the SQL Server Ubuntu repository
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2022.list)"

# Install SQL Server
sudo apt-get update
sudo apt-get install -y mssql-server

# Run setup
sudo /opt/mssql/bin/mssql-conf setup
```

```bash [Docker]
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

:::

### Connecting

```bash
# Using sqlcmd (command-line tool)
sqlcmd -S localhost -U sa -P YourPassword

# Using Azure Data Studio (cross-platform GUI)
# Download from: https://docs.microsoft.com/en-us/sql/azure-data-studio/

# Connection string
Server=localhost;Database=master;User Id=sa;Password=YourPassword;
```

## SQL Server-Specific Features

### T-SQL Extensions

```sql
-- Variable declaration
DECLARE @counter INT = 0;
DECLARE @name NVARCHAR(50);

-- SET vs SELECT for assignment
SET @counter = 1;
SELECT @name = FirstName FROM Employees WHERE EmployeeID = 1;

-- WHILE loops
WHILE @counter <= 10
BEGIN
    PRINT 'Counter: ' + CAST(@counter AS VARCHAR);
    SET @counter = @counter + 1;
END;

-- TRY...CATCH error handling
BEGIN TRY
    -- Risky operation
    INSERT INTO Users (Email) VALUES ('test@example.com');
END TRY
BEGIN CATCH
    SELECT
        ERROR_NUMBER() AS ErrorNumber,
        ERROR_MESSAGE() AS ErrorMessage,
        ERROR_SEVERITY() AS ErrorSeverity,
        ERROR_STATE() AS ErrorState;
END CATCH;
```

### OUTPUT Clause

```sql
-- INSERT with OUTPUT
DECLARE @InsertedIDs TABLE (ID INT, Name NVARCHAR(100));

INSERT INTO Products (ProductName, Price)
OUTPUT INSERTED.ProductID, INSERTED.ProductName INTO @InsertedIDs
VALUES ('New Product', 99.99);

SELECT * FROM @InsertedIDs;

-- UPDATE with OUTPUT
UPDATE Inventory
SET Quantity = Quantity - 5
OUTPUT
    DELETED.ProductID,
    DELETED.Quantity AS OldQuantity,
    INSERTED.Quantity AS NewQuantity
WHERE ProductID = 101;

-- DELETE with OUTPUT
DELETE FROM OldRecords
OUTPUT DELETED.RecordID, DELETED.RecordDate
WHERE RecordDate < '2020-01-01';
```

### MERGE Statement

```sql
-- Synchronize target table with source
MERGE INTO TargetTable AS target
USING SourceTable AS source
ON target.ID = source.ID
WHEN MATCHED THEN
    UPDATE SET
        target.Name = source.Name,
        target.UpdatedDate = GETDATE()
WHEN NOT MATCHED BY TARGET THEN
    INSERT (ID, Name, CreatedDate)
    VALUES (source.ID, source.Name, GETDATE())
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
OUTPUT $action, INSERTED.*, DELETED.*;
```

### Common Table Expressions (CTEs)

```sql
-- Recursive CTE for hierarchical data
WITH EmployeeHierarchy AS (
    -- Anchor member: top-level managers
    SELECT
        EmployeeID,
        EmployeeName,
        ManagerID,
        1 AS Level
    FROM Employees
    WHERE ManagerID IS NULL

    UNION ALL

    -- Recursive member
    SELECT
        e.EmployeeID,
        e.EmployeeName,
        e.ManagerID,
        eh.Level + 1
    FROM Employees e
    INNER JOIN EmployeeHierarchy eh ON e.ManagerID = eh.EmployeeID
)
SELECT * FROM EmployeeHierarchy
ORDER BY Level, EmployeeName;

-- Multiple CTEs
WITH Sales_CTE AS (
    SELECT CustomerID, SUM(TotalAmount) AS TotalSales
    FROM Orders
    GROUP BY CustomerID
),
AvgSales_CTE AS (
    SELECT AVG(TotalSales) AS AvgSales
    FROM Sales_CTE
)
SELECT c.CustomerName, s.TotalSales, a.AvgSales
FROM Customers c
INNER JOIN Sales_CTE s ON c.CustomerID = s.CustomerID
CROSS JOIN AvgSales_CTE a
WHERE s.TotalSales > a.AvgSales;
```

### Window Functions

```sql
-- Advanced window functions with OVER clause
SELECT
    EmployeeName,
    Department,
    Salary,
    -- Ranking functions
    ROW_NUMBER() OVER (PARTITION BY Department ORDER BY Salary DESC) AS RowNum,
    RANK() OVER (PARTITION BY Department ORDER BY Salary DESC) AS Rank,
    DENSE_RANK() OVER (PARTITION BY Department ORDER BY Salary DESC) AS DenseRank,
    NTILE(4) OVER (PARTITION BY Department ORDER BY Salary DESC) AS Quartile,
    -- Offset functions
    LAG(Salary, 1, 0) OVER (PARTITION BY Department ORDER BY Salary) AS PrevSalary,
    LEAD(Salary, 1, 0) OVER (PARTITION BY Department ORDER BY Salary) AS NextSalary,
    FIRST_VALUE(Salary) OVER (PARTITION BY Department ORDER BY Salary DESC) AS HighestSalary,
    LAST_VALUE(Salary) OVER (
        PARTITION BY Department
        ORDER BY Salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS LowestSalary,
    -- Aggregate functions
    SUM(Salary) OVER (PARTITION BY Department) AS DeptTotalSalary,
    AVG(Salary) OVER (PARTITION BY Department) AS DeptAvgSalary,
    COUNT(*) OVER (PARTITION BY Department) AS DeptEmployeeCount
FROM Employees;
```

### Temporal Tables (System-Versioned Tables)

```sql
-- Create temporal table for automatic history tracking
CREATE TABLE Employees
(
    EmployeeID INT PRIMARY KEY,
    EmployeeName NVARCHAR(100) NOT NULL,
    Department NVARCHAR(50),
    Salary DECIMAL(10,2),
    ValidFrom DATETIME2 GENERATED ALWAYS AS ROW START NOT NULL,
    ValidTo DATETIME2 GENERATED ALWAYS AS ROW END NOT NULL,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo)
)
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.EmployeesHistory));

-- Query current data
SELECT * FROM Employees;

-- Query historical data
SELECT * FROM Employees
FOR SYSTEM_TIME AS OF '2024-01-01 12:00:00';

-- Query changes over time
SELECT * FROM Employees
FOR SYSTEM_TIME BETWEEN '2024-01-01' AND '2024-12-31';

-- Query all historical versions
SELECT * FROM Employees
FOR SYSTEM_TIME ALL
WHERE EmployeeID = 100;
```

### JSON Support

```sql
-- Store JSON data
CREATE TABLE Products (
    ProductID INT PRIMARY KEY,
    ProductName NVARCHAR(100),
    Attributes NVARCHAR(MAX) CHECK (ISJSON(Attributes) = 1)
);

-- Insert JSON
INSERT INTO Products (ProductID, ProductName, Attributes)
VALUES (1, 'Laptop', N'{"brand":"Dell","ram":"16GB","storage":"512GB SSD"}');

-- Query JSON data
SELECT
    ProductID,
    ProductName,
    JSON_VALUE(Attributes, '$.brand') AS Brand,
    JSON_VALUE(Attributes, '$.ram') AS RAM,
    JSON_QUERY(Attributes, '$') AS AllAttributes
FROM Products;

-- Modify JSON
UPDATE Products
SET Attributes = JSON_MODIFY(Attributes, '$.ram', '32GB')
WHERE ProductID = 1;

-- Convert query results to JSON
SELECT ProductID, ProductName, Attributes
FROM Products
FOR JSON PATH, ROOT('Products');

-- Parse JSON array
DECLARE @json NVARCHAR(MAX) = N'[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]';

SELECT *
FROM OPENJSON(@json)
WITH (
    id INT '$.id',
    name NVARCHAR(50) '$.name'
);
```

### XML Support

```sql
-- XML data type
CREATE TABLE Documents (
    DocumentID INT PRIMARY KEY,
    Content XML
);

-- Insert XML
INSERT INTO Documents (DocumentID, Content)
VALUES (1, '<book><title>SQL Server Guide</title><author>John Doe</author></book>');

-- Query XML using XQuery
SELECT
    Content.value('(/book/title)[1]', 'NVARCHAR(100)') AS Title,
    Content.value('(/book/author)[1]', 'NVARCHAR(100)') AS Author
FROM Documents;

-- Modify XML
UPDATE Documents
SET Content.modify('replace value of (/book/title/text())[1] with "Advanced SQL Server"')
WHERE DocumentID = 1;

-- Convert query results to XML
SELECT ProductID, ProductName, Price
FROM Products
FOR XML PATH('Product'), ROOT('Products');
```

### In-Memory OLTP

```sql
-- Create memory-optimized table
CREATE TABLE OrdersMemory
(
    OrderID INT NOT NULL PRIMARY KEY NONCLUSTERED HASH WITH (BUCKET_COUNT = 1000000),
    CustomerID INT NOT NULL,
    OrderDate DATETIME2 NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL,
    INDEX IX_CustomerID NONCLUSTERED (CustomerID)
)
WITH (MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_AND_DATA);

-- Create natively compiled stored procedure
CREATE PROCEDURE InsertOrder
    @OrderID INT,
    @CustomerID INT,
    @TotalAmount DECIMAL(10,2)
WITH NATIVE_COMPILATION, SCHEMABINDING
AS
BEGIN ATOMIC WITH (
    TRANSACTION ISOLATION LEVEL = SNAPSHOT,
    LANGUAGE = N'us_english'
)
    INSERT INTO dbo.OrdersMemory (OrderID, CustomerID, OrderDate, TotalAmount)
    VALUES (@OrderID, @CustomerID, SYSDATETIME(), @TotalAmount);
END;
```

### Columnstore Indexes

```sql
-- Create clustered columnstore index (for data warehouse)
CREATE CLUSTERED COLUMNSTORE INDEX CCI_Sales
ON FactSales;

-- Create nonclustered columnstore index
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Sales
ON Sales (ProductID, SaleDate, Quantity, Amount);

-- Query benefits from columnstore
SELECT
    ProductID,
    YEAR(SaleDate) AS SaleYear,
    SUM(Quantity) AS TotalQuantity,
    SUM(Amount) AS TotalAmount
FROM FactSales
GROUP BY ProductID, YEAR(SaleDate);
```

### Partitioning

```sql
-- Create partition function
CREATE PARTITION FUNCTION SalesDateRange (DATE)
AS RANGE RIGHT FOR VALUES
    ('2023-01-01', '2023-04-01', '2023-07-01', '2023-10-01', '2024-01-01');

-- Create partition scheme
CREATE PARTITION SCHEME SalesDateScheme
AS PARTITION SalesDateRange
ALL TO ([PRIMARY]);

-- Create partitioned table
CREATE TABLE Sales
(
    SaleID INT,
    SaleDate DATE NOT NULL,
    Amount DECIMAL(10,2),
    PRIMARY KEY (SaleID, SaleDate)
)
ON SalesDateScheme(SaleDate);

-- Query specific partition
SELECT * FROM Sales
WHERE SaleDate >= '2023-01-01' AND SaleDate < '2023-04-01';

-- View partition information
SELECT
    OBJECT_NAME(p.object_id) AS TableName,
    p.partition_number,
    p.rows,
    prv.value AS BoundaryValue
FROM sys.partitions p
LEFT JOIN sys.partition_range_values prv ON p.partition_id = prv.boundary_id
WHERE OBJECT_NAME(p.object_id) = 'Sales'
ORDER BY p.partition_number;
```

## Performance Optimization

### Execution Plans

```sql
-- Show estimated execution plan
SET SHOWPLAN_ALL ON;
GO
SELECT * FROM Users WHERE Email = 'john@example.com';
GO
SET SHOWPLAN_ALL OFF;
GO

-- Show actual execution plan with statistics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT
    u.Username,
    COUNT(o.OrderID) AS OrderCount
FROM Users u
LEFT JOIN Orders o ON u.UserID = o.UserID
GROUP BY u.Username;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Use graphical execution plan in SSMS
-- Ctrl+M to include actual execution plan
```

### Indexes

```sql
-- Clustered index (one per table)
CREATE CLUSTERED INDEX IX_Orders_OrderDate
ON Orders(OrderDate);

-- Nonclustered index
CREATE NONCLUSTERED INDEX IX_Customers_Email
ON Customers(Email);

-- Covering index (includes additional columns)
CREATE NONCLUSTERED INDEX IX_Orders_CustomerID_Include
ON Orders(CustomerID)
INCLUDE (OrderDate, TotalAmount);

-- Filtered index
CREATE NONCLUSTERED INDEX IX_Orders_Active
ON Orders(OrderDate)
WHERE Status = 'Active';

-- Unique index
CREATE UNIQUE NONCLUSTERED INDEX UX_Users_Email
ON Users(Email);

-- Index with included columns
CREATE NONCLUSTERED INDEX IX_Products_Category
ON Products(CategoryID)
INCLUDE (ProductName, Price);
```

### Statistics and Maintenance

```sql
-- Update statistics
UPDATE STATISTICS Customers;

-- Update statistics with full scan
UPDATE STATISTICS Orders WITH FULLSCAN;

-- Rebuild index
ALTER INDEX IX_Orders_OrderDate ON Orders REBUILD;

-- Reorganize index
ALTER INDEX IX_Customers_Email ON Customers REORGANIZE;

-- Rebuild all indexes on a table
ALTER INDEX ALL ON Products REBUILD;

-- Update statistics for all tables in database
EXEC sp_updatestats;
```

### Query Optimization Tips

```sql
-- Use SARGable queries (Search ARGument able)
-- ❌ Not SARGable - function on column
SELECT * FROM Orders WHERE YEAR(OrderDate) = 2024;

-- ✅ SARGable - better performance
SELECT * FROM Orders
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';

-- Use EXISTS instead of IN for better performance
-- ❌ Slower with large subqueries
SELECT * FROM Customers
WHERE CustomerID IN (SELECT CustomerID FROM LargeOrdersTable);

-- ✅ Faster
SELECT * FROM Customers c
WHERE EXISTS (SELECT 1 FROM LargeOrdersTable o WHERE o.CustomerID = c.CustomerID);

-- Avoid SELECT *
-- ❌ Retrieves unnecessary data
SELECT * FROM Users;

-- ✅ Only retrieve needed columns
SELECT UserID, Username, Email FROM Users;

-- Use WITH (NOLOCK) for dirty reads (when appropriate)
SELECT * FROM LargeTable WITH (NOLOCK)
WHERE Status = 'Active';
```

## Data Types

### Numeric Types

| Type         | Range                                                   | Description               |
| ------------ | ------------------------------------------------------- | ------------------------- |
| TINYINT      | 0 to 255                                                | 1-byte integer            |
| SMALLINT     | -32,768 to 32,767                                       | 2-byte integer            |
| INT          | -2,147,483,648 to 2,147,483,647                         | 4-byte integer            |
| BIGINT       | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | 8-byte integer            |
| DECIMAL(p,s) | -10^38+1 to 10^38-1                                     | Fixed precision and scale |
| NUMERIC(p,s) | -10^38+1 to 10^38-1                                     | Same as DECIMAL           |
| FLOAT(n)     | -1.79E+308 to 1.79E+308                                 | Floating point number     |
| REAL         | -3.40E+38 to 3.40E+38                                   | 4-byte floating point     |
| MONEY        | -922,337,203,685,477.5808 to 922,337,203,685,477.5807   | Currency values           |

### String Types

| Type          | Description                          | Max Length        |
| ------------- | ------------------------------------ | ----------------- |
| CHAR(n)       | Fixed-length                         | 8,000 characters  |
| VARCHAR(n)    | Variable-length                      | 8,000 characters  |
| VARCHAR(MAX)  | Variable-length                      | 2^31-1 characters |
| NCHAR(n)      | Fixed-length Unicode                 | 4,000 characters  |
| NVARCHAR(n)   | Variable-length Unicode              | 4,000 characters  |
| NVARCHAR(MAX) | Variable-length Unicode              | 2^30-1 characters |
| TEXT          | Variable-length (deprecated)         | 2^31-1 characters |
| NTEXT         | Variable-length Unicode (deprecated) | 2^30-1 characters |

### Date/Time Types

| Type           | Format                               | Range                                |
| -------------- | ------------------------------------ | ------------------------------------ |
| DATE           | YYYY-MM-DD                           | 0001-01-01 to 9999-12-31             |
| TIME           | HH:MM:SS.nnnnnnn                     | 00:00:00.0000000 to 23:59:59.9999999 |
| DATETIME       | YYYY-MM-DD HH:MM:SS.nnn              | 1753-01-01 to 9999-12-31             |
| DATETIME2      | YYYY-MM-DD HH:MM:SS.nnnnnnn          | 0001-01-01 to 9999-12-31             |
| SMALLDATETIME  | YYYY-MM-DD HH:MM:SS                  | 1900-01-01 to 2079-06-06             |
| DATETIMEOFFSET | YYYY-MM-DD HH:MM:SS.nnnnnnn +/-HH:MM | 0001-01-01 to 9999-12-31             |

### Other Types

- **UNIQUEIDENTIFIER**: GUID/UUID
- **BIT**: Boolean (0, 1, or NULL)
- **BINARY(n)**: Fixed-length binary data
- **VARBINARY(n)**: Variable-length binary data
- **VARBINARY(MAX)**: Large binary data
- **XML**: XML data
- **GEOGRAPHY**: Spatial data (round-earth)
- **GEOMETRY**: Spatial data (flat-earth)
- **HIERARCHYID**: Hierarchical data

## Common Operations

### Database Management

```sql
-- Create database
CREATE DATABASE MyApp;

-- Use database
USE MyApp;

-- List all databases
SELECT name FROM sys.databases;

-- Database properties
EXEC sp_helpdb 'MyApp';

-- Drop database
DROP DATABASE MyApp;

-- Backup database
BACKUP DATABASE MyApp
TO DISK = 'C:\Backups\MyApp.bak'
WITH FORMAT, COMPRESSION;

-- Restore database
RESTORE DATABASE MyApp
FROM DISK = 'C:\Backups\MyApp.bak'
WITH REPLACE;
```

### Schema Management

```sql
-- Create schema
CREATE SCHEMA Sales;

-- Create table in schema
CREATE TABLE Sales.Orders (
    OrderID INT PRIMARY KEY,
    Amount DECIMAL(10,2)
);

-- Transfer table to different schema
ALTER SCHEMA Sales TRANSFER dbo.Products;

-- Drop schema
DROP SCHEMA Sales;
```

### User Management

```sql
-- Create login (server-level)
CREATE LOGIN myuser WITH PASSWORD = 'SecureP@ssw0rd!';

-- Create user (database-level)
CREATE USER myuser FOR LOGIN myuser;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON SCHEMA::dbo TO myuser;
GRANT EXECUTE ON SCHEMA::dbo TO myuser;

-- Grant role membership
ALTER ROLE db_datareader ADD MEMBER myuser;
ALTER ROLE db_datawriter ADD MEMBER myuser;

-- Revoke permissions
REVOKE INSERT ON SCHEMA::dbo FROM myuser;

-- Drop user and login
DROP USER myuser;
DROP LOGIN myuser;
```

### Table Variables and Temp Tables

```sql
-- Table variable (scope: batch)
DECLARE @TempCustomers TABLE (
    CustomerID INT,
    CustomerName NVARCHAR(100)
);

INSERT INTO @TempCustomers VALUES (1, 'Alice'), (2, 'Bob');
SELECT * FROM @TempCustomers;

-- Local temporary table (scope: session)
CREATE TABLE #TempOrders (
    OrderID INT,
    OrderDate DATE,
    Amount DECIMAL(10,2)
);

INSERT INTO #TempOrders VALUES (1, '2024-01-15', 99.99);
SELECT * FROM #TempOrders;
DROP TABLE #TempOrders;

-- Global temporary table (scope: all sessions)
CREATE TABLE ##GlobalTemp (
    ID INT,
    Value NVARCHAR(50)
);
```

## Security Features

### Row-Level Security

```sql
-- Create security policy
CREATE FUNCTION dbo.fn_SecurityPredicate(@UserID INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_SecurityPredicate_result
WHERE @UserID = CAST(SESSION_CONTEXT(N'UserID') AS INT);

-- Apply security policy
CREATE SECURITY POLICY SalesFilter
ADD FILTER PREDICATE dbo.fn_SecurityPredicate(SalesPersonID)
ON dbo.Sales
WITH (STATE = ON);

-- Set user context
EXEC sp_set_session_context @key = N'UserID', @value = 5;

-- Now queries only return rows for UserID = 5
SELECT * FROM Sales;
```

### Always Encrypted

```sql
-- Create column master key
CREATE COLUMN MASTER KEY CMK_Auto
WITH (
    KEY_STORE_PROVIDER_NAME = 'MSSQL_CERTIFICATE_STORE',
    KEY_PATH = 'CurrentUser/my/A66BB0F6DD70BDFF02B62D0F87E340288E6F9305'
);

-- Create column encryption key
CREATE COLUMN ENCRYPTION KEY CEK_Auto
WITH VALUES (
    COLUMN_MASTER_KEY = CMK_Auto,
    ALGORITHM = 'RSA_OAEP',
    ENCRYPTED_VALUE = 0x016E000001630075007200720...
);

-- Create table with encrypted columns
CREATE TABLE Customers (
    CustomerID INT PRIMARY KEY,
    Name NVARCHAR(100),
    SSN NVARCHAR(11) COLLATE Latin1_General_BIN2
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = CEK_Auto,
            ENCRYPTION_TYPE = DETERMINISTIC,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        )
);
```

### Dynamic Data Masking

```sql
-- Create table with masked columns
CREATE TABLE Users (
    UserID INT PRIMARY KEY,
    Email NVARCHAR(100) MASKED WITH (FUNCTION = 'email()'),
    Phone NVARCHAR(20) MASKED WITH (FUNCTION = 'partial(1,"XXX-XXX-",4)'),
    CreditCard NVARCHAR(20) MASKED WITH (FUNCTION = 'default()'),
    Salary DECIMAL(10,2) MASKED WITH (FUNCTION = 'random(10000, 100000)')
);

-- Grant unmask permission
GRANT UNMASK TO ManagerRole;
```

## High Availability

### Always On Availability Groups

```sql
-- Create availability group
CREATE AVAILABILITY GROUP AG1
WITH (AUTOMATED_BACKUP_PREFERENCE = SECONDARY)
FOR DATABASE MyApp
REPLICA ON
    'Server1' WITH (
        ENDPOINT_URL = 'TCP://Server1:5022',
        AVAILABILITY_MODE = SYNCHRONOUS_COMMIT,
        FAILOVER_MODE = AUTOMATIC
    ),
    'Server2' WITH (
        ENDPOINT_URL = 'TCP://Server2:5022',
        AVAILABILITY_MODE = SYNCHRONOUS_COMMIT,
        FAILOVER_MODE = AUTOMATIC
    );

-- Failover
ALTER AVAILABILITY GROUP AG1 FAILOVER;
```

## SQL Server vs Other Databases

<SQLComparison :dialects="['sqlserver', 'postgresql', 'mysql']" />

| Feature          | SQL Server                    | PostgreSQL               | MySQL                          |
| ---------------- | ----------------------------- | ------------------------ | ------------------------------ |
| License          | Commercial (Express/Dev free) | Open Source              | Open Source (GPL) / Commercial |
| Platform         | Windows, Linux                | Cross-platform           | Cross-platform                 |
| T-SQL Extensions | Yes                           | No (PL/pgSQL)            | No (procedures)                |
| JSON Support     | Native                        | Native JSONB             | Native                         |
| XML Support      | Advanced native               | Native                   | Basic                          |
| Window Functions | Full support                  | Full support             | Full (8.0+)                    |
| Temporal Tables  | Yes                           | No (extension available) | No                             |
| In-Memory OLTP   | Yes                           | No                       | No                             |
| Columnstore      | Yes                           | No                       | No                             |
| Full-Text Search | Advanced                      | Built-in                 | Built-in                       |
| Replication      | Always On, Mirroring          | Streaming, Logical       | Async, Semi-sync               |

## Best Practices

### 1. Use Appropriate Data Types

```sql
-- ✅ Use specific types
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) NOT NULL,
    CreatedDate DATETIME2 DEFAULT SYSDATETIME()
);

-- ❌ Avoid overly generic types
CREATE TABLE Users (
    UserID NVARCHAR(50),
    Email NVARCHAR(MAX),
    CreatedDate NVARCHAR(100)
);
```

### 2. Use Constraints

```sql
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Customers(CustomerID),
    OrderDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Status NVARCHAR(20) CHECK (Status IN ('Pending', 'Processing', 'Shipped', 'Delivered')),
    TotalAmount DECIMAL(10,2) CHECK (TotalAmount >= 0)
);
```

### 3. Use Stored Procedures

```sql
CREATE PROCEDURE GetCustomerOrders
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        o.OrderID,
        o.OrderDate,
        o.TotalAmount
    FROM Orders o
    WHERE o.CustomerID = @CustomerID
    ORDER BY o.OrderDate DESC;
END;

-- Execute
EXEC GetCustomerOrders @CustomerID = 123;
```

### 4. Handle Transactions Properly

```sql
BEGIN TRANSACTION;

BEGIN TRY
    -- Your operations
    UPDATE Accounts SET Balance = Balance - 100 WHERE AccountID = 1;
    UPDATE Accounts SET Balance = Balance + 100 WHERE AccountID = 2;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="sqlserver" :show-model-selector="false" />

## See Also

- [PostgreSQL](/databases/postgresql/) - Comparison with PostgreSQL
- [MySQL](/databases/mysql/) - Comparison with MySQL
- [Window Functions](/concepts/window-functions/) - Advanced analytical queries
- [Performance](/concepts/performance/) - Query optimization
- [Joins](/concepts/joins/) - Join operations

## Resources

- [Official Documentation](https://docs.microsoft.com/en-us/sql/)
- [T-SQL Reference](https://docs.microsoft.com/en-us/sql/t-sql/)
- [SQL Server Downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/)
