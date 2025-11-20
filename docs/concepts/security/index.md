---
title: Database Security & Access Control
description: >-
  Comprehensive guide to database security including RBAC, ABAC, FGAC, row-level
  security, column masking, and dynamic views for data protection
databases:
  - PostgreSQL
  - MySQL
  - SQL Server
  - Oracle
  - SQLite
  - BigQuery
  - Snowflake
  - DuckDB
difficulty: advanced
tags:
  - concepts
  - security
  - rbac
  - abac
  - fgac
  - row-level-security
  - rls
  - column-masking
  - dynamic-views
  - authorized-views
  - access-control
  - data-masking
  - permissions
  - roles
  - policies
  - data-protection
  - privacy
---

# Database Security & Access Control

<div class="difficulty-badge difficulty-advanced">Advanced</div>

## Quick Reference

```sql
-- Role-Based Access Control (RBAC)
CREATE ROLE analyst;
GRANT SELECT ON sales TO analyst;
GRANT analyst TO user_alice;

-- Row-Level Security (RLS) - PostgreSQL
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_isolation ON customers
  FOR SELECT
  USING (sales_rep_id = current_user_id());

-- Column Masking - SQL Server
CREATE TABLE customers (
  ssn VARCHAR(11) MASKED WITH (FUNCTION = 'partial(0,"XXX-XX-",4)')
);

-- Dynamic Views for Access Control
CREATE VIEW sales_by_region AS
SELECT * FROM sales
WHERE region = CURRENT_USER_REGION();

-- Fine-Grained Access Control - Oracle VPD
BEGIN
  DBMS_RLS.ADD_POLICY(
    object_name => 'employees',
    policy_name => 'emp_policy',
    function_schema => 'security',
    policy_function => 'employee_security'
  );
END;

-- Attribute-Based Access Control (ABAC)
-- Application-level logic with database support
SELECT * FROM documents
WHERE security_level <= USER_CLEARANCE_LEVEL()
  AND department IN (USER_DEPARTMENTS());
```

## Overview

Database security involves protecting data from unauthorized access, modification, or deletion. Modern databases provide multiple layers of security controls to implement defense-in-depth strategies.

**Why Database Security Matters**:

- **Data protection**: Prevent unauthorized access to sensitive information
- **Compliance**: Meet regulatory requirements (GDPR, HIPAA, SOX, PCI-DSS)
- **Privacy**: Protect personally identifiable information (PII)
- **Auditability**: Track who accesses what data and when
- **Minimize breach impact**: Limit damage if credentials are compromised

**Key Security Concepts**:

- **RBAC (Role-Based Access Control)**: Assign permissions to roles, not individuals
- **ABAC (Attribute-Based Access Control)**: Access based on user/data attributes
- **FGAC (Fine-Grained Access Control)**: Row and column-level restrictions
- **RLS (Row-Level Security)**: Automatic filtering based on policies
- **Column Masking**: Hide or obfuscate sensitive column data
- **Dynamic Views**: Parameterized views for user-specific data access

## Role-Based Access Control (RBAC)

RBAC is the foundation of database security. Instead of granting permissions directly to users, you create roles with specific permissions and assign users to those roles.

### Benefits of RBAC

- **Simplified management**: Change role permissions once, affects all members
- **Consistency**: Ensures users in same role have identical permissions
- **Separation of duties**: Prevent any single user from having too much access
- **Auditable**: Easy to see what each role can do
- **Scalable**: Add new users quickly by assigning appropriate roles

### Creating Roles

```sql
-- PostgreSQL, MySQL 8.0+, SQL Server
CREATE ROLE data_analyst;
CREATE ROLE data_engineer;
CREATE ROLE report_viewer;

-- With password (for login roles in PostgreSQL)
CREATE ROLE analyst LOGIN PASSWORD 'secure_password';

-- Oracle (CREATE ROLE is simpler)
CREATE ROLE sales_role;
```

### Granting Permissions to Roles

```sql
-- Grant table-level permissions
GRANT SELECT ON sales TO data_analyst;
GRANT SELECT, INSERT, UPDATE ON orders TO data_engineer;
GRANT SELECT ON reports TO report_viewer;

-- Grant schema-level permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO data_analyst;

-- Grant database-level permissions (PostgreSQL)
GRANT CONNECT ON DATABASE mydb TO data_analyst;

-- Grant specific column access (SQL Server, PostgreSQL)
GRANT SELECT (customer_id, order_date, total) ON orders TO report_viewer;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION calculate_metrics() TO data_analyst;
GRANT EXECUTE ON PROCEDURE process_orders() TO data_engineer;
```

### Assigning Roles to Users

```sql
-- PostgreSQL, MySQL
GRANT data_analyst TO alice;
GRANT data_engineer TO bob;
GRANT report_viewer TO charlie;

-- Grant multiple roles
GRANT data_analyst, report_viewer TO david;

-- SQL Server
ALTER ROLE data_analyst ADD MEMBER alice;
ALTER ROLE data_engineer ADD MEMBER bob;

-- Oracle
GRANT sales_role TO alice;
GRANT WITH ADMIN OPTION sales_role TO bob;  -- Bob can grant role to others
```

### Role Hierarchies

Create role hierarchies for complex permission structures.

```sql
-- PostgreSQL: Role inheritance
CREATE ROLE base_user;
CREATE ROLE analyst;
CREATE ROLE senior_analyst;

GRANT SELECT ON public_data TO base_user;
GRANT base_user TO analyst;  -- analyst inherits base_user permissions
GRANT analyst TO senior_analyst;  -- senior_analyst inherits both

-- Grant to user with inheritance
GRANT senior_analyst TO alice;
-- alice now has all permissions from senior_analyst, analyst, and base_user

-- SQL Server: Similar hierarchy
CREATE ROLE junior_analyst;
CREATE ROLE senior_analyst;

GRANT SELECT ON sales TO junior_analyst;
GRANT SELECT, INSERT, UPDATE ON sales TO senior_analyst;

-- Users in senior_analyst get additional permissions
ALTER ROLE senior_analyst ADD MEMBER junior_analyst_role;
```

### Default Roles

```sql
-- PostgreSQL: Built-in roles
GRANT pg_read_all_data TO analyst;     -- Read all tables
GRANT pg_write_all_data TO engineer;   -- Read/write all tables
GRANT pg_monitor TO monitoring_user;   -- Monitor database

-- MySQL: Built-in roles
GRANT SELECT ON *.* TO 'user'@'localhost';  -- Read-only access

-- SQL Server: Fixed database roles
ALTER ROLE db_datareader ADD MEMBER alice;   -- Read all tables
ALTER ROLE db_datawriter ADD MEMBER bob;     -- Read/write all tables
ALTER ROLE db_owner ADD MEMBER admin_user;   -- Full control

-- Oracle: Pre-defined roles
GRANT CONNECT TO user1;          -- Connect to database
GRANT RESOURCE TO user2;         -- Create objects
GRANT DBA TO admin_user;         -- Full admin access
```

### Revoking Permissions

```sql
-- Revoke specific permissions
REVOKE SELECT ON sales FROM data_analyst;
REVOKE INSERT, UPDATE ON orders FROM data_engineer;

-- Revoke all permissions
REVOKE ALL PRIVILEGES ON customers FROM report_viewer;

-- Revoke role from user
REVOKE data_analyst FROM alice;

-- SQL Server
ALTER ROLE data_analyst DROP MEMBER alice;

-- Drop role (must revoke from all users first)
DROP ROLE data_analyst;
```

### Practical RBAC Example

```sql
-- E-commerce application role structure

-- 1. Create roles
CREATE ROLE customer_service;
CREATE ROLE warehouse_staff;
CREATE ROLE finance_team;
CREATE ROLE admin;

-- 2. Grant permissions to customer_service
GRANT SELECT ON customers TO customer_service;
GRANT SELECT, UPDATE ON orders TO customer_service;
GRANT SELECT ON products TO customer_service;
-- Cannot see financial details
REVOKE SELECT ON payment_methods FROM customer_service;

-- 3. Grant permissions to warehouse_staff
GRANT SELECT ON orders TO warehouse_staff;
GRANT SELECT, UPDATE ON inventory TO warehouse_staff;
GRANT SELECT ON products TO warehouse_staff;
-- Cannot see customer personal information
REVOKE SELECT ON customers FROM warehouse_staff;

-- 4. Grant permissions to finance_team
GRANT SELECT ON orders TO finance_team;
GRANT SELECT ON payment_methods TO finance_team;
GRANT SELECT ON refunds TO finance_team;
GRANT SELECT, INSERT ON invoices TO finance_team;
-- Can see financial data but not customer PII

-- 5. Admin gets everything
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

-- 6. Assign users to roles
GRANT customer_service TO alice, bob;
GRANT warehouse_staff TO charlie, david;
GRANT finance_team TO eve, frank;
GRANT admin TO admin_user;
```

### Checking Permissions

```sql
-- PostgreSQL: Check granted roles
SELECT * FROM pg_roles WHERE rolname = 'data_analyst';

-- Check table privileges
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants
WHERE grantee = 'data_analyst';

-- MySQL: Show grants
SHOW GRANTS FOR 'alice'@'localhost';
SHOW GRANTS FOR data_analyst;

-- SQL Server: Check role membership
SELECT DP1.name AS DatabaseRoleName,
       DP2.name AS DatabaseUserName
FROM sys.database_role_members AS DRM
INNER JOIN sys.database_principals AS DP1 ON DRM.role_principal_id = DP1.principal_id
INNER JOIN sys.database_principals AS DP2 ON DRM.member_principal_id = DP2.principal_id;

-- Check permissions
SELECT * FROM sys.database_permissions
WHERE grantee_principal_id = USER_ID('alice');

-- Oracle: Check granted roles
SELECT * FROM dba_role_privs WHERE grantee = 'ALICE';

-- Check table privileges
SELECT * FROM dba_tab_privs WHERE grantee = 'ALICE';
```

## Row-Level Security (RLS)

Row-Level Security automatically filters rows based on the user executing the query. Unlike views, RLS policies are enforced at the database level and cannot be bypassed.

### PostgreSQL Row-Level Security

PostgreSQL has the most mature RLS implementation.

```sql
-- Enable RLS on table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own customers
CREATE POLICY customer_isolation ON customers
  FOR SELECT
  USING (sales_rep_id = current_setting('app.current_user_id')::integer);

-- Users can only update their own customers
CREATE POLICY customer_update ON customers
  FOR UPDATE
  USING (sales_rep_id = current_setting('app.current_user_id')::integer)
  WITH CHECK (sales_rep_id = current_setting('app.current_user_id')::integer);

-- Users can only insert customers assigned to them
CREATE POLICY customer_insert ON customers
  FOR INSERT
  WITH CHECK (sales_rep_id = current_setting('app.current_user_id')::integer);

-- Managers can see all customers in their region
CREATE POLICY manager_access ON customers
  FOR SELECT
  USING (
    region = current_setting('app.user_region')
    AND current_setting('app.user_role') = 'manager'
  );
```

### Setting User Context

```sql
-- Set session variables for RLS policies
-- Application sets these after authentication
SET app.current_user_id = '123';
SET app.user_region = 'WEST';
SET app.user_role = 'sales_rep';

-- Now queries are automatically filtered
SELECT * FROM customers;
-- Only returns customers where sales_rep_id = 123
```

### Policy Types

```sql
-- PERMISSIVE policies (OR logic - any matching policy grants access)
CREATE POLICY own_records ON sales
  FOR SELECT
  USING (sales_rep_id = current_user_id());

CREATE POLICY manager_records ON sales
  FOR SELECT
  USING (current_user_role() = 'manager');
-- User gets access if EITHER policy matches

-- RESTRICTIVE policies (AND logic - all must match)
CREATE POLICY dept_restriction ON sales
  AS RESTRICTIVE
  FOR SELECT
  USING (department = current_user_department());

CREATE POLICY active_only ON sales
  AS RESTRICTIVE
  FOR SELECT
  USING (status = 'active');
-- User must satisfy BOTH conditions
```

### Bypassing RLS (Admin Access)

```sql
-- Grant bypass privilege to admin role
GRANT BYPASS RLS ON customers TO admin_role;

-- Or make specific role exempt
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
-- Now even table owner must follow RLS policies

-- Temporarily disable for admin operations
SET row_security = OFF;  -- Requires superuser or BYPASS RLS privilege
SELECT * FROM customers;  -- Sees all rows
SET row_security = ON;
```

### Multi-Tenant RLS Example

```sql
-- Multi-tenant SaaS application
CREATE TABLE accounts (
  account_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  account_name VARCHAR(255),
  balance DECIMAL(10, 2)
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Each tenant can only see their own accounts
CREATE POLICY tenant_isolation ON accounts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::integer)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::integer);

-- Application sets tenant context per request
SET app.tenant_id = '42';

-- Now all queries are automatically scoped to tenant 42
SELECT * FROM accounts;  -- Only tenant 42's accounts
INSERT INTO accounts (tenant_id, account_name, balance)
VALUES (42, 'Acme Corp', 10000.00);  -- Must match tenant_id
```

### SQL Server Row-Level Security

```sql
-- Create security predicate function
CREATE FUNCTION dbo.fn_security_predicate(@sales_rep_id INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS result
WHERE @sales_rep_id = CAST(SESSION_CONTEXT(N'user_id') AS INT)
   OR IS_ROLEMEMBER('manager') = 1;
GO

-- Create security policy
CREATE SECURITY POLICY SalesRepFilter
ADD FILTER PREDICATE dbo.fn_security_predicate(sales_rep_id) ON dbo.Sales,
ADD BLOCK PREDICATE dbo.fn_security_predicate(sales_rep_id) ON dbo.Sales AFTER INSERT,
ADD BLOCK PREDICATE dbo.fn_security_predicate(sales_rep_id) ON dbo.Sales AFTER UPDATE
WITH (STATE = ON);

-- Set user context
EXEC sp_set_session_context @key = N'user_id', @value = 123;

-- Queries are automatically filtered
SELECT * FROM Sales;
-- Only returns rows where sales_rep_id = 123 OR user is manager
```

### Oracle Virtual Private Database (VPD)

Oracle's Fine-Grained Access Control (FGAC) via VPD is similar to RLS.

```sql
-- Create security policy function
CREATE OR REPLACE FUNCTION employee_security(
  schema_name VARCHAR2,
  table_name VARCHAR2
) RETURN VARCHAR2
IS
  predicate VARCHAR2(2000);
BEGIN
  predicate := 'department_id = SYS_CONTEXT(''USERENV'', ''CLIENT_IDENTIFIER'')';
  RETURN predicate;
END;
/

-- Apply policy to table
BEGIN
  DBMS_RLS.ADD_POLICY(
    object_schema => 'HR',
    object_name => 'EMPLOYEES',
    policy_name => 'emp_dept_policy',
    function_schema => 'HR',
    policy_function => 'employee_security',
    statement_types => 'SELECT, INSERT, UPDATE, DELETE'
  );
END;
/

-- Set user context
EXEC DBMS_SESSION.SET_IDENTIFIER('10');  -- Department ID

-- Queries are filtered
SELECT * FROM employees;
-- Only returns employees in department 10
```

## Column Masking & Data Redaction

Column masking hides or obfuscates sensitive data based on user privileges. The actual data remains unchanged, but unauthorized users see masked values.

### SQL Server Dynamic Data Masking

```sql
-- Create table with masked columns
CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) MASKED WITH (FUNCTION = 'email()'),
  phone VARCHAR(15) MASKED WITH (FUNCTION = 'partial(1,"XXX-XXX-",4)'),
  ssn VARCHAR(11) MASKED WITH (FUNCTION = 'partial(0,"XXX-XX-",4)'),
  credit_card VARCHAR(16) MASKED WITH (FUNCTION = 'partial(0,"XXXX-XXXX-XXXX-",4)'),
  salary DECIMAL(10,2) MASKED WITH (FUNCTION = 'default()'),
  birth_date DATE MASKED WITH (FUNCTION = 'default()')
);

-- Insert data (stored unmasked)
INSERT INTO customers VALUES
(1, 'John Doe', 'john.doe@email.com', '555-123-4567', '123-45-6789', '1234567890123456', 75000.00, '1985-06-15');

-- Regular user sees masked data
SELECT * FROM customers;
-- Result:
-- name: John Doe
-- email: jXXX@XXXX.com
-- phone: 5XXX-XXX-4567
-- ssn: XXX-XX-6789
-- credit_card: XXXX-XXXX-XXXX-3456
-- salary: 0.00
-- birth_date: 1900-01-01

-- Grant unmask permission
GRANT UNMASK TO privileged_user;

-- Privileged user sees real data
SELECT * FROM customers;
-- Result: actual unmasked data
```

### Masking Functions

```sql
-- Default masking (zeros for numbers, default date for dates)
column_name DATATYPE MASKED WITH (FUNCTION = 'default()')

-- Email masking (exposes first character)
email VARCHAR(100) MASKED WITH (FUNCTION = 'email()')
-- john.doe@email.com → jXXX@XXXX.com

-- Partial masking (custom exposure)
phone VARCHAR(15) MASKED WITH (FUNCTION = 'partial(prefix_length, "padding", suffix_length)')
-- 555-123-4567 → 5XXX-XXX-4567

-- Random masking (for numeric ranges)
age INT MASKED WITH (FUNCTION = 'random(1, 100)')
-- 45 → random value between 1 and 100

-- Custom string
notes VARCHAR(500) MASKED WITH (FUNCTION = 'partial(0,"[REDACTED]",0)')
-- "Sensitive information" → [REDACTED]
```

### Adding Masking to Existing Columns

```sql
-- Add masking to existing column
ALTER TABLE customers
ALTER COLUMN ssn ADD MASKED WITH (FUNCTION = 'partial(0,"XXX-XX-",4)');

-- Remove masking
ALTER TABLE customers
ALTER COLUMN ssn DROP MASKED;

-- Modify masking function
ALTER TABLE customers
ALTER COLUMN email
DROP MASKED;

ALTER TABLE customers
ALTER COLUMN email
ADD MASKED WITH (FUNCTION = 'partial(2,"XXXX",2)');
```

### Oracle Data Redaction

```sql
-- Full redaction (replace with default value)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema => 'HR',
    object_name => 'EMPLOYEES',
    column_name => 'SALARY',
    policy_name => 'redact_salary',
    function_type => DBMS_REDACT.FULL,
    expression => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''HR_ADMIN'''
  );
END;
/

-- Partial redaction (mask part of value)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema => 'HR',
    object_name => 'EMPLOYEES',
    column_name => 'PHONE_NUMBER',
    policy_name => 'redact_phone',
    function_type => DBMS_REDACT.PARTIAL,
    function_parameters => DBMS_REDACT.REDACT_US_PHONE_L7,  -- Last 7 digits
    expression => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''HR_ADMIN'''
  );
END;
/

-- Random redaction (replace with random value)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema => 'HR',
    object_name => 'EMPLOYEES',
    column_name => 'SALARY',
    policy_name => 'random_salary',
    function_type => DBMS_REDACT.RANDOM,
    expression => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''HR_ADMIN'''
  );
END;
/

-- Regular expression redaction
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema => 'HR',
    object_name => 'EMPLOYEES',
    column_name => 'EMAIL',
    policy_name => 'redact_email',
    function_type => DBMS_REDACT.REGEXP,
    regexp_pattern => '(.*)@(.*)',
    regexp_replace_string => '\1@XXXXX',
    expression => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''HR_ADMIN'''
  );
END;
/
```

### PostgreSQL Column-Level Encryption

PostgreSQL doesn't have built-in masking, but you can use encryption:

```sql
-- Enable pgcrypto extension
CREATE EXTENSION pgcrypto;

-- Create table with encrypted columns
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  ssn BYTEA,  -- Encrypted
  credit_card BYTEA  -- Encrypted
);

-- Insert with encryption
INSERT INTO customers (name, ssn, credit_card)
VALUES (
  'John Doe',
  pgp_sym_encrypt('123-45-6789', 'encryption_key'),
  pgp_sym_encrypt('1234-5678-9012-3456', 'encryption_key')
);

-- Decrypt with proper key (privileged users only)
SELECT
  name,
  pgp_sym_decrypt(ssn, 'encryption_key') AS ssn,
  pgp_sym_decrypt(credit_card, 'encryption_key') AS credit_card
FROM customers;

-- Create view with masking logic
CREATE VIEW customers_masked AS
SELECT
  customer_id,
  name,
  CASE
    WHEN current_user = 'admin' THEN pgp_sym_decrypt(ssn, 'encryption_key')
    ELSE 'XXX-XX-' || RIGHT(pgp_sym_decrypt(ssn, 'encryption_key'), 4)
  END AS ssn,
  CASE
    WHEN current_user = 'admin' THEN pgp_sym_decrypt(credit_card, 'encryption_key')
    ELSE 'XXXX-XXXX-XXXX-' || RIGHT(pgp_sym_decrypt(credit_card, 'encryption_key'), 4)
  END AS credit_card
FROM customers;
```

## Dynamic & Authorized Views

Views provide logical access control by presenting filtered or transformed data. Dynamic views use session context to customize data per user.

### Basic Security Views

```sql
-- View that filters sensitive columns
CREATE VIEW customers_public AS
SELECT
  customer_id,
  name,
  city,
  state
  -- Excludes ssn, credit_card, phone
FROM customers;

GRANT SELECT ON customers_public TO public;
REVOKE SELECT ON customers FROM public;

-- View that filters rows
CREATE VIEW my_orders AS
SELECT *
FROM orders
WHERE customer_id = CURRENT_USER_ID();

-- Users only see their own orders
```

### Dynamic Views with Session Variables

```sql
-- PostgreSQL: View using session context
CREATE VIEW sales_by_region AS
SELECT *
FROM sales
WHERE region = current_setting('app.user_region', TRUE);

-- Set user's region
SET app.user_region = 'WEST';

-- User only sees WEST region sales
SELECT * FROM sales_by_region;

-- View with multiple context variables
CREATE VIEW accessible_documents AS
SELECT *
FROM documents
WHERE security_level <= current_setting('app.user_clearance')::integer
  AND (
    is_public = TRUE
    OR owner_id = current_setting('app.user_id')::integer
    OR department = current_setting('app.user_department')
  );
```

### Views with User Functions

```sql
-- Create function to get current user's attributes
CREATE FUNCTION current_user_department()
RETURNS VARCHAR
LANGUAGE SQL STABLE
AS $$
  SELECT department
  FROM users
  WHERE user_id = current_setting('app.user_id')::integer;
$$;

CREATE FUNCTION current_user_clearance()
RETURNS INTEGER
LANGUAGE SQL STABLE
AS $$
  SELECT security_clearance
  FROM users
  WHERE user_id = current_setting('app.user_id')::integer;
$$;

-- Create view using these functions
CREATE VIEW authorized_files AS
SELECT *
FROM files
WHERE department = current_user_department()
  AND security_level <= current_user_clearance();
```

### BigQuery Authorized Views

BigQuery has built-in support for authorized views to grant access to underlying table data.

```sql
-- Create dataset for views
CREATE SCHEMA analytics_views;

-- Create view in analytics_views that queries restricted data
CREATE VIEW analytics_views.sales_summary AS
SELECT
  region,
  DATE_TRUNC(sale_date, MONTH) as month,
  SUM(amount) as total_sales,
  COUNT(*) as transaction_count
FROM restricted_data.sales
GROUP BY region, month;

-- Grant access to view (not underlying table)
GRANT `roles/bigquery.dataViewer`
ON SCHEMA analytics_views
TO 'user:analyst@company.com';

-- Authorize view to access underlying restricted data
-- (Done via BigQuery console or API, grants view permission to read source)

-- Analyst can query view but not underlying table
SELECT * FROM analytics_views.sales_summary;  -- ✅ Allowed
SELECT * FROM restricted_data.sales;  -- ❌ Denied
```

### Snowflake Secure Views

```sql
-- Create secure view (query definition hidden, no query optimization across view boundary)
CREATE SECURE VIEW customers_secure AS
SELECT
  customer_id,
  name,
  CASE
    WHEN CURRENT_ROLE() IN ('ADMIN', 'FINANCE')
      THEN email
      ELSE 'REDACTED'
  END AS email,
  CASE
    WHEN CURRENT_ROLE() IN ('ADMIN', 'FINANCE')
      THEN phone
      ELSE 'XXX-XXX-' || RIGHT(phone, 4)
  END AS phone
FROM customers_raw;

-- Grant access to secure view
GRANT SELECT ON customers_secure TO ROLE analyst;

-- Analysts see masked data, admins see real data
```

### Materialized Views with Security

```sql
-- PostgreSQL: Materialized view for performance with RLS
CREATE MATERIALIZED VIEW sales_summary AS
SELECT
  region,
  DATE_TRUNC('month', sale_date) as month,
  SUM(amount) as total_sales
FROM sales
GROUP BY region, month;

-- Enable RLS on materialized view
ALTER MATERIALIZED VIEW sales_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY region_filter ON sales_summary
  FOR SELECT
  USING (region = current_setting('app.user_region'));

-- Refresh periodically
REFRESH MATERIALIZED VIEW sales_summary;

-- Users see only their region's summary
```

### Parameterized View Pattern

```sql
-- Create table-valued function instead of view for parameterized access
CREATE FUNCTION get_customer_orders(p_customer_id INTEGER)
RETURNS TABLE (
  order_id INTEGER,
  order_date DATE,
  total DECIMAL(10,2),
  status VARCHAR(50)
)
LANGUAGE SQL STABLE
AS $$
  SELECT order_id, order_date, total, status
  FROM orders
  WHERE customer_id = p_customer_id
    AND (
      customer_id = current_setting('app.user_id')::integer
      OR current_setting('app.user_role') = 'admin'
    );
$$;

-- Call with parameter
SELECT * FROM get_customer_orders(123);
-- Returns orders only if user owns them or is admin
```

## Attribute-Based Access Control (ABAC)

ABAC makes access decisions based on attributes of users, resources, and environment. It's more flexible than RBAC but typically requires application-level logic.

### ABAC Concepts

**User Attributes**: Role, department, clearance level, location, time of day

**Resource Attributes**: Classification, owner, department, sensitivity

**Environment Attributes**: Time, location, IP address, device type

**Action**: Read, write, delete, export

### ABAC with Database Support

```sql
-- Create attributes table
CREATE TABLE user_attributes (
  user_id INTEGER PRIMARY KEY,
  department VARCHAR(50),
  clearance_level INTEGER,
  region VARCHAR(50),
  is_manager BOOLEAN
);

CREATE TABLE document_attributes (
  document_id INTEGER PRIMARY KEY,
  classification VARCHAR(50),  -- public, internal, confidential, secret
  department VARCHAR(50),
  owner_id INTEGER
);

-- ABAC policy function
CREATE FUNCTION check_document_access(
  p_document_id INTEGER,
  p_user_id INTEGER
) RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM document_attributes d
    JOIN user_attributes u ON u.user_id = p_user_id
    WHERE d.document_id = p_document_id
      AND (
        -- Rule 1: Public documents accessible to all
        d.classification = 'public'
        -- Rule 2: Internal documents accessible to same department
        OR (d.classification = 'internal' AND d.department = u.department)
        -- Rule 3: Confidential requires clearance level 2+
        OR (d.classification = 'confidential' AND u.clearance_level >= 2)
        -- Rule 4: Secret requires clearance level 4+
        OR (d.classification = 'secret' AND u.clearance_level >= 4)
        -- Rule 5: Owner always has access
        OR d.owner_id = u.user_id
        -- Rule 6: Managers in same department have access
        OR (u.is_manager = TRUE AND d.department = u.department)
      )
  );
$$;

-- Create secure view using ABAC logic
CREATE VIEW accessible_documents AS
SELECT d.*
FROM documents d
WHERE check_document_access(d.document_id, current_setting('app.user_id')::integer);
```

### Time-Based Access Control (TBAC)

```sql
-- Add temporal attributes
CREATE TABLE user_access_windows (
  user_id INTEGER,
  resource_type VARCHAR(50),
  start_time TIME,
  end_time TIME,
  allowed_days VARCHAR(20)  -- e.g., 'Mon,Tue,Wed,Thu,Fri'
);

-- Time-based access function
CREATE FUNCTION check_time_based_access(
  p_user_id INTEGER,
  p_resource_type VARCHAR
) RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_access_windows
    WHERE user_id = p_user_id
      AND resource_type = p_resource_type
      AND CURRENT_TIME BETWEEN start_time AND end_time
      AND POSITION(TO_CHAR(CURRENT_DATE, 'Dy') IN allowed_days) > 0
  );
$$;

-- Create view with time-based access
CREATE VIEW time_restricted_reports AS
SELECT *
FROM sensitive_reports
WHERE check_time_based_access(
  current_setting('app.user_id')::integer,
  'sensitive_reports'
);
```

### Context-Based Access Control

```sql
-- Store access context
CREATE TABLE access_contexts (
  user_id INTEGER,
  ip_address INET,
  device_type VARCHAR(50),
  is_vpn BOOLEAN,
  risk_score INTEGER
);

-- Context-based policy
CREATE FUNCTION check_context_access(
  p_user_id INTEGER,
  p_data_sensitivity INTEGER
) RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM access_contexts
    WHERE user_id = p_user_id
      AND (
        -- Low sensitivity: any context allowed
        (p_data_sensitivity = 1)
        -- Medium sensitivity: VPN required
        OR (p_data_sensitivity = 2 AND is_vpn = TRUE)
        -- High sensitivity: VPN + low risk + corporate device
        OR (p_data_sensitivity = 3
            AND is_vpn = TRUE
            AND risk_score < 30
            AND device_type = 'corporate')
      )
  );
$$;
```

### Combining RBAC and ABAC

```sql
-- Hybrid approach: RBAC for basic access, ABAC for fine-grained control
CREATE VIEW hybrid_secure_data AS
SELECT *
FROM sensitive_data
WHERE
  -- RBAC: User must have appropriate role
  current_setting('app.user_role') IN ('analyst', 'manager', 'admin')
  -- ABAC: Additional attribute-based checks
  AND (
    -- Attribute check 1: Clearance level
    security_level <= current_setting('app.user_clearance')::integer
    -- Attribute check 2: Department match
    AND (department = current_setting('app.user_department')
         OR current_setting('app.user_role') = 'admin')
    -- Attribute check 3: Time restriction
    AND CURRENT_TIME BETWEEN TIME '08:00:00' AND TIME '18:00:00'
  );
```

## Fine-Grained Access Control (FGAC)

FGAC encompasses multiple techniques for controlling access at the row and column level. It combines elements of RLS, column masking, and dynamic views.

### Oracle Virtual Private Database (VPD)

Most comprehensive FGAC implementation.

```sql
-- Create policy function
CREATE OR REPLACE FUNCTION sales_security_policy(
  schema_var IN VARCHAR2,
  table_var IN VARCHAR2
) RETURN VARCHAR2
IS
  predicate VARCHAR2(2000);
  v_user_role VARCHAR2(50);
  v_user_dept VARCHAR2(50);
BEGIN
  -- Get user attributes
  v_user_role := SYS_CONTEXT('app_ctx', 'user_role');
  v_user_dept := SYS_CONTEXT('app_ctx', 'user_dept');

  -- Build predicate based on role
  IF v_user_role = 'ADMIN' THEN
    -- Admins see everything
    predicate := '1=1';
  ELSIF v_user_role = 'MANAGER' THEN
    -- Managers see their department
    predicate := 'department = ''' || v_user_dept || '''';
  ELSIF v_user_role = 'SALES_REP' THEN
    -- Sales reps see only their own records
    predicate := 'sales_rep_id = SYS_CONTEXT(''USERENV'', ''SESSION_USER'')';
  ELSE
    -- Others see nothing
    predicate := '1=0';
  END IF;

  RETURN predicate;
END;
/

-- Apply VPD policy
BEGIN
  DBMS_RLS.ADD_POLICY(
    object_schema => 'SALES',
    object_name => 'ORDERS',
    policy_name => 'sales_order_policy',
    function_schema => 'SECURITY',
    policy_function => 'sales_security_policy',
    statement_types => 'SELECT, INSERT, UPDATE, DELETE',
    policy_type => DBMS_RLS.CONTEXT_SENSITIVE,
    update_check => TRUE
  );
END;
/

-- Set application context
BEGIN
  DBMS_SESSION.SET_CONTEXT('app_ctx', 'user_role', 'SALES_REP');
  DBMS_SESSION.SET_CONTEXT('app_ctx', 'user_dept', 'WEST');
END;
/
```

### Column-Level FGAC

```sql
-- Oracle: Column-sensitive VPD
BEGIN
  DBMS_RLS.ADD_POLICY(
    object_schema => 'HR',
    object_name => 'EMPLOYEES',
    policy_name => 'salary_policy',
    function_schema => 'SECURITY',
    policy_function => 'salary_security',
    statement_types => 'SELECT',
    sec_relevant_cols => 'SALARY,BONUS',  -- Policy applies only when these columns accessed
    sec_relevant_cols_opt => DBMS_RLS.ALL_ROWS  -- Return all rows, hide column values
  );
END;
/

-- When user queries salary/bonus without permission, columns return NULL
```

### SQL Server FGAC with Inline Table-Valued Functions

```sql
-- Create inline table-valued function for row filtering
CREATE FUNCTION dbo.fn_sales_security(@sales_rep_id INT, @region VARCHAR(50))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
  SELECT 1 AS has_access
  FROM dbo.user_security us
  WHERE us.user_id = CAST(SESSION_CONTEXT(N'user_id') AS INT)
    AND (
      -- User's own records
      @sales_rep_id = us.user_id
      -- Or user's region (for managers)
      OR (@region = us.region AND us.role = 'MANAGER')
      -- Or admin
      OR us.role = 'ADMIN'
    );
GO

-- Create security policy
CREATE SECURITY POLICY dbo.sales_security_policy
ADD FILTER PREDICATE dbo.fn_sales_security(sales_rep_id, region) ON dbo.sales,
ADD BLOCK PREDICATE dbo.fn_sales_security(sales_rep_id, region) ON dbo.sales AFTER INSERT,
ADD BLOCK PREDICATE dbo.fn_sales_security(sales_rep_id, region) ON dbo.sales AFTER UPDATE
WITH (STATE = ON);
```

### PostgreSQL FGAC with RLS + Views

```sql
-- Combine RLS with views for comprehensive FGAC
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Row-level policy
CREATE POLICY employee_access ON employees
  FOR ALL
  USING (
    department = current_setting('app.user_dept')
    OR employee_id = current_setting('app.user_id')::integer
    OR current_setting('app.user_role') = 'HR_ADMIN'
  );

-- Create view for column-level security
CREATE VIEW employees_view AS
SELECT
  employee_id,
  first_name,
  last_name,
  department,
  hire_date,
  CASE
    WHEN current_setting('app.user_role') IN ('HR_ADMIN', 'PAYROLL')
      THEN salary
    WHEN employee_id = current_setting('app.user_id')::integer
      THEN salary
    ELSE NULL
  END AS salary,
  CASE
    WHEN current_setting('app.user_role') = 'HR_ADMIN'
      THEN ssn
    ELSE 'XXX-XX-' || RIGHT(ssn, 4)
  END AS ssn
FROM employees;

-- Grant access to view, not base table
GRANT SELECT ON employees_view TO app_users;
REVOKE ALL ON employees FROM app_users;
```

## Best Practices

### 1. Defense in Depth

```sql
-- Layer multiple security controls

-- Layer 1: Network security (firewall, VPN)
-- Layer 2: Authentication (strong passwords, MFA)
-- Layer 3: RBAC (role-based permissions)
CREATE ROLE data_analyst;
GRANT SELECT ON sales TO data_analyst;

-- Layer 4: Row-level security
CREATE POLICY analyst_region ON sales
  FOR SELECT
  USING (region = current_user_region());

-- Layer 5: Column masking
ALTER TABLE sales
ALTER COLUMN customer_email
ADD MASKED WITH (FUNCTION = 'email()');

-- Layer 6: Audit logging
CREATE TABLE audit_log (
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_name VARCHAR(100),
  action VARCHAR(50),
  table_name VARCHAR(100),
  record_id INTEGER
);

-- Layer 7: Encryption at rest and in transit
```

### 2. Principle of Least Privilege

```sql
-- Grant minimum necessary permissions

-- ❌ Bad: Overly permissive
GRANT ALL PRIVILEGES ON DATABASE mydb TO analyst;

-- ✅ Good: Specific permissions only
GRANT SELECT ON sales TO analyst;
GRANT SELECT (order_id, customer_id, order_date, total) ON orders TO analyst;
-- Explicitly exclude sensitive columns
```

### 3. Regular Access Reviews

```sql
-- Create view to audit permissions
CREATE VIEW permission_audit AS
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE grantee NOT IN ('postgres', 'root', 'admin')
ORDER BY grantee, table_name;

-- Review regularly
SELECT * FROM permission_audit;

-- Check for unused accounts
SELECT grantee, MAX(last_login) as last_login
FROM user_activity
GROUP BY grantee
HAVING MAX(last_login) < CURRENT_DATE - INTERVAL '90 days';
```

### 4. Separate Environments

```sql
-- Production: Strict security
-- Development/Test: Relaxed for productivity, but use masked data

-- Production RLS policy
CREATE POLICY prod_customer_isolation ON customers
  FOR ALL
  USING (sales_rep_id = current_user_id());

-- Development: Use anonymized copy of production data
CREATE TABLE dev_customers AS
SELECT
  customer_id,
  'Customer_' || customer_id AS name,  -- Anonymized
  'user' || customer_id || '@example.com' AS email,  -- Fake email
  '555-' || LPAD(customer_id::TEXT, 7, '0') AS phone,  -- Fake phone
  SUBSTRING(MD5(RANDOM()::TEXT), 1, 11) AS ssn_hash  -- Hash instead of real SSN
FROM prod_customers;
```

### 5. Audit Everything

```sql
-- Enable audit logging for sensitive operations
CREATE TABLE security_audit (
  audit_id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_name VARCHAR(100),
  user_role VARCHAR(50),
  action VARCHAR(50),
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  success BOOLEAN
);

-- Create trigger for automatic auditing
CREATE OR REPLACE FUNCTION audit_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit (
    user_name,
    user_role,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    success
  ) VALUES (
    current_user,
    current_setting('app.user_role', TRUE),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    inet_client_addr(),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_customers
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION audit_sensitive_access();
```

### 6. Secure Session Management

```sql
-- Set session parameters securely at application login
-- Application code (pseudocode):
function authenticate_user(username, password):
  user = verify_credentials(username, password)

  -- Set session context
  db.execute("SET app.user_id = %s", user.id)
  db.execute("SET app.user_role = %s", user.role)
  db.execute("SET app.user_dept = %s", user.department)
  db.execute("SET app.user_region = %s", user.region)
  db.execute("SET app.user_clearance = %s", user.clearance_level)

  -- Prevent modification by application
  db.execute("SET SESSION AUTHORIZATION %s", user.db_username)

  return user
```

### 7. Document Security Policies

```sql
-- Create metadata table documenting security policies
CREATE TABLE security_policies (
  policy_id SERIAL PRIMARY KEY,
  table_name VARCHAR(100),
  policy_name VARCHAR(100),
  policy_type VARCHAR(50),  -- RLS, VPD, MASKING, RBAC
  description TEXT,
  created_date DATE,
  owner VARCHAR(100),
  compliance_requirement VARCHAR(100)  -- GDPR, HIPAA, PCI-DSS, etc.
);

-- Document each policy
INSERT INTO security_policies VALUES
(1, 'customers', 'customer_isolation', 'RLS',
 'Users can only access customers assigned to them',
 '2024-01-15', 'security_team', 'GDPR'),
(2, 'customers', 'email_masking', 'MASKING',
 'Email addresses masked for non-admin users',
 '2024-01-15', 'security_team', 'GDPR'),
(3, 'financial_records', 'finance_role_access', 'RBAC',
 'Only finance role can access financial records',
 '2024-01-15', 'security_team', 'SOX');
```

## Common Pitfalls

### 1. Bypassing Security Through Joins

```sql
-- ❌ Security bypass via join
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_isolation ON orders
  FOR SELECT
  USING (customer_id = current_user_id());

-- But if customers table has no RLS:
SELECT o.* FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
-- This might bypass order_isolation if customers table is not secured!

-- ✅ Secure all related tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_isolation ON customers
  FOR SELECT
  USING (customer_id = current_user_id() OR is_admin());
```

### 2. Forgetting FORCE ROW LEVEL SECURITY

```sql
-- ❌ Table owner can bypass RLS by default
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Owner queries table and sees all rows despite policies!

-- ✅ Force RLS even for table owner
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

-- Or grant BYPASSRLS to specific roles only
GRANT BYPASSRLS TO admin_role;
```

### 3. Exposing Data Through Error Messages

```sql
-- ❌ Error messages might leak information
SELECT * FROM customers WHERE ssn = '123-45-6789';
-- Error: "No rows returned" vs "Permission denied"
-- Attacker knows record exists but is hidden

-- ✅ Consistent error handling
-- Return empty result set instead of error for missing permissions
```

### 4. Not Validating Session Context

```sql
-- ❌ Application trusts user input for session context
-- User sends: user_id = 999 (not their ID)
SET app.user_id = 999;  -- Can set to any value!

-- ✅ Application validates and sets context server-side
-- After authentication:
function set_user_context(authenticated_user):
  -- Server validates authenticated_user
  db.execute("SET app.user_id = %s", authenticated_user.id)  -- Validated
  db.execute("SET SESSION AUTHORIZATION %s", authenticated_user.db_role)
```

### 5. Granting Excessive Permissions

```sql
-- ❌ Common mistakes
GRANT ALL ON DATABASE mydb TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT admin TO regular_user;

-- ✅ Minimal permissions
GRANT CONNECT ON DATABASE mydb TO app_user;
GRANT SELECT ON specific_table TO app_user;
GRANT analyst_role TO regular_user;  -- Limited role
```

### 6. Ignoring Stored Procedures and Functions

```sql
-- ❌ Function with SECURITY DEFINER runs with creator's privileges
CREATE FUNCTION get_all_customers()
RETURNS TABLE(...)
SECURITY DEFINER  -- Runs as function creator (often admin)
AS $$
  SELECT * FROM customers;  -- Bypasses RLS!
$$;

-- Regular user can call function and see all customers!

-- ✅ Use SECURITY INVOKER or add explicit checks
CREATE FUNCTION get_accessible_customers()
RETURNS TABLE(...)
SECURITY INVOKER  -- Runs with caller's privileges
AS $$
  SELECT * FROM customers;  -- RLS applies
$$;

-- Or add explicit security checks in SECURITY DEFINER functions
CREATE FUNCTION get_customer_by_id(p_customer_id INTEGER)
RETURNS TABLE(...)
SECURITY DEFINER
AS $$
BEGIN
  -- Explicit authorization check
  IF NOT is_authorized(p_customer_id, current_user) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY SELECT * FROM customers WHERE customer_id = p_customer_id;
END;
$$;
```

## Compliance Considerations

### GDPR (General Data Protection Regulation)

```sql
-- Implement right to access
CREATE VIEW user_data_export AS
SELECT
  customer_id,
  name,
  email,
  phone,
  address,
  order_history,
  preferences
FROM customers
WHERE customer_id = current_user_id();

-- Implement right to erasure (right to be forgotten)
CREATE PROCEDURE anonymize_customer(p_customer_id INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Replace PII with anonymized data
  UPDATE customers
  SET
    name = 'User_' || p_customer_id,
    email = 'deleted_' || p_customer_id || '@anonymized.com',
    phone = NULL,
    ssn = NULL,
    deletion_date = CURRENT_TIMESTAMP,
    is_anonymized = TRUE
  WHERE customer_id = p_customer_id;

  -- Keep transactional records for legal requirements
  -- But remove PII linkage
END;
$$;

-- Implement data minimization
-- Only collect and retain necessary data
-- Use RLS to limit access to PII
```

### HIPAA (Health Insurance Portability and Accountability Act)

```sql
-- Minimum necessary standard
CREATE POLICY hipaa_minimum_necessary ON patient_records
  FOR SELECT
  USING (
    -- Healthcare provider can see their patients
    (current_user_role() = 'provider' AND provider_id = current_user_id())
    -- Billing staff sees only billing data (use separate view)
    OR (current_user_role() = 'billing' AND FALSE)  -- Use billing_view instead
    -- Compliance officer sees all for audits
    OR current_user_role() = 'compliance_officer'
  );

-- De-identification for research
CREATE VIEW patient_records_deidentified AS
SELECT
  patient_id,  -- Replace with study_id
  DATE_TRUNC('year', birth_date) AS birth_year,  -- Remove exact birth date
  SUBSTRING(zip_code, 1, 3) || '00' AS zip_area,  -- First 3 digits only
  diagnosis_code,
  treatment_code
  -- Exclude: name, address, SSN, phone, dates (except year)
FROM patient_records;
```

### PCI-DSS (Payment Card Industry Data Security Standard)

```sql
-- Secure cardholder data
ALTER TABLE payment_methods
ALTER COLUMN card_number
ADD MASKED WITH (FUNCTION = 'partial(0,"XXXX-XXXX-XXXX-",4)');

-- Restrict access to cardholder data
CREATE ROLE pci_cardholder_data_access;
GRANT SELECT ON payment_methods TO pci_cardholder_data_access;
GRANT UNMASK ON payment_methods TO pci_cardholder_data_access;

-- Only specific roles get access
GRANT pci_cardholder_data_access TO payment_processor_role;

-- Audit all access to cardholder data
CREATE TRIGGER audit_payment_access
AFTER SELECT ON payment_methods
FOR EACH STATEMENT
EXECUTE FUNCTION log_cardholder_data_access();
```

## Platform-Specific Notes

::: details PostgreSQL

**Strengths**:

- Native Row-Level Security (RLS)
- Flexible policy system
- Session variables for context
- Excellent RBAC support

**RLS Example**:

```sql
ALTER TABLE data ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_policy ON data
  FOR ALL
  USING (user_id = current_setting('app.user_id')::integer);

-- Set context per session
SET app.user_id = '123';
```

**Limitations**:

- No built-in column masking (use views or encryption)
- RLS policies can impact performance on large tables
- Requires application to set session context

:::

::: details MySQL

**Strengths**:

- Good RBAC support (8.0+)
- Role hierarchies
- Column-level privileges

**Limitations**:

- No native Row-Level Security
- No built-in column masking
- Must implement FGAC via views

**Workaround for RLS**:

```sql
-- Use views with context variables
CREATE VIEW my_orders AS
SELECT * FROM orders
WHERE customer_id = @current_user_id;

-- Application sets variable
SET @current_user_id = 123;
```

:::

::: details SQL Server

**Strengths**:

- Native Row-Level Security
- Dynamic Data Masking
- Comprehensive security features
- Always Encrypted for column encryption

**RLS**:

```sql
CREATE SECURITY POLICY SalesPolicy
ADD FILTER PREDICATE dbo.fn_security(sales_rep_id) ON dbo.Sales
WITH (STATE = ON);
```

**Dynamic Data Masking**:

```sql
CREATE TABLE Customers (
  Email VARCHAR(100) MASKED WITH (FUNCTION = 'email()'),
  SSN VARCHAR(11) MASKED WITH (FUNCTION = 'partial(0,"XXX-XX-",4)')
);
```

:::

::: details Oracle

**Strengths**:

- Virtual Private Database (VPD) - most comprehensive FGAC
- Data Redaction
- Fine-grained auditing
- Label Security for multi-level security

**VPD Example**:

```sql
BEGIN
  DBMS_RLS.ADD_POLICY(
    object_name => 'EMPLOYEES',
    policy_name => 'emp_policy',
    function_schema => 'security',
    policy_function => 'employee_security'
  );
END;
```

**Best for**: Enterprise applications requiring sophisticated security

:::

::: details BigQuery

**Strengths**:

- Authorized Views
- Column-level security
- Row-level security (beta)
- Policy tags for data governance

**Authorized Views**:

```sql
CREATE VIEW analytics.sales_summary AS
SELECT region, SUM(amount) as total
FROM restricted.sales
GROUP BY region;

-- Grant view access, not underlying table
GRANT `roles/bigquery.dataViewer` ON analytics TO user;
```

**Limitations**:

- RLS is still in beta
- Limited fine-grained control compared to traditional databases

:::

::: details Snowflake

**Strengths**:

- Secure Views
- Row Access Policies
- Column-level security
- Dynamic Data Masking

**Row Access Policies**:

```sql
CREATE ROW ACCESS POLICY region_policy AS (region VARCHAR)
RETURNS BOOLEAN ->
  CURRENT_ROLE() = 'ADMIN'
  OR region = CURRENT_REGION();

ALTER TABLE sales ADD ROW ACCESS POLICY region_policy ON (region);
```

**Secure Views**:

```sql
CREATE SECURE VIEW customers_secure AS
SELECT
  CASE WHEN CURRENT_ROLE() = 'ADMIN'
    THEN email
    ELSE 'REDACTED'
  END AS email
FROM customers;
```

:::

## See Also

- [ACID Properties](/concepts/acid) - Transaction isolation supports security
- [Transactions](/concepts/transactions) - Locking and isolation levels
- [Indexes](/concepts/indexes) - Index considerations for security policies
- [Performance](/concepts/performance) - Performance impact of security features
- [Basics](/concepts/basics) - SQL fundamentals including grants and users
