---
title: PIVOT and UNPIVOT Operations
description: Transform rows to columns (PIVOT) and columns to rows (UNPIVOT) for data reshaping and analysis
databases: [PostgreSQL, MySQL, SQL Server, Oracle, SQLite, BigQuery, Snowflake, DuckDB, Databricks, Spark SQL]
difficulty: intermediate
tags: [pivot, unpivot, data-transformation, conditional-aggregation, columns-to-rows, rows-to-columns, reshaping]
---

# PIVOT and UNPIVOT Operations

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- PIVOT: Transform rows to columns (using CASE statements - universal approach)
SELECT
  category,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue ELSE 0 END) AS Q2,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue ELSE 0 END) AS Q3,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue ELSE 0 END) AS Q4
FROM sales
GROUP BY category;

-- PIVOT: Using native syntax (SQL Server, Oracle, Snowflake, DuckDB, etc.)
SELECT *
FROM sales
PIVOT (SUM(revenue) FOR quarter IN ('Q1', 'Q2', 'Q3', 'Q4'));

-- UNPIVOT: Transform columns to rows (using UNION ALL - universal approach)
SELECT category, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT category, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT category, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT category, 'Q4', Q4 FROM quarterly_sales;

-- UNPIVOT: Using native syntax
SELECT *
FROM quarterly_sales
UNPIVOT (revenue FOR quarter IN (Q1, Q2, Q3, Q4));
```

## Overview

PIVOT and UNPIVOT are data transformation operations that reshape data by changing the relationship between rows and columns:

- **PIVOT** transforms rows into columns, commonly used to create cross-tabulation reports, summary matrices, or to convert normalized data into a denormalized format for reporting
- **UNPIVOT** transforms columns into rows, useful for normalizing data, preparing data for analysis, or converting wide-format data into long-format

These operations are essential for data analysis, reporting, and ETL processes. While some databases provide native PIVOT/UNPIVOT syntax, all databases support these transformations through standard SQL techniques using CASE statements, aggregations, and UNION operations.

## PIVOT Operations

### Syntax (Universal Approach with CASE)

The most portable way to pivot data uses conditional aggregation with CASE statements:

```sql
SELECT
  <grouping_columns>,
  AGG_FUNC(CASE WHEN <pivot_column> = <value1> THEN <value_column> END) AS <column1>,
  AGG_FUNC(CASE WHEN <pivot_column> = <value2> THEN <value_column> END) AS <column2>,
  ...
FROM <table>
GROUP BY <grouping_columns>;
```

### Basic PIVOT Examples

**Example 1: Sales by Quarter**

```sql
-- Sample data
CREATE TABLE sales (
  product VARCHAR(50),
  quarter VARCHAR(10),
  revenue DECIMAL(10,2)
);

INSERT INTO sales VALUES
  ('Laptop', 'Q1', 50000),
  ('Laptop', 'Q2', 65000),
  ('Laptop', 'Q3', 55000),
  ('Laptop', 'Q4', 75000),
  ('Phone', 'Q1', 30000),
  ('Phone', 'Q2', 35000),
  ('Phone', 'Q3', 40000),
  ('Phone', 'Q4', 45000);

-- PIVOT using CASE statements
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS Q1_revenue,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue ELSE 0 END) AS Q2_revenue,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue ELSE 0 END) AS Q3_revenue,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue ELSE 0 END) AS Q4_revenue
FROM sales
GROUP BY product;

-- Result:
-- product | Q1_revenue | Q2_revenue | Q3_revenue | Q4_revenue
-- Laptop  |   50000.00 |   65000.00 |   55000.00 |   75000.00
-- Phone   |   30000.00 |   35000.00 |   40000.00 |   45000.00
```

**Example 2: Employee Skills Matrix**

```sql
-- Sample data
CREATE TABLE employee_skills (
  employee_name VARCHAR(50),
  skill VARCHAR(50),
  proficiency_level INT
);

INSERT INTO employee_skills VALUES
  ('Alice', 'Python', 5),
  ('Alice', 'SQL', 4),
  ('Alice', 'Java', 3),
  ('Bob', 'Python', 4),
  ('Bob', 'SQL', 5),
  ('Bob', 'JavaScript', 4);

-- Create a skills matrix
SELECT
  employee_name,
  MAX(CASE WHEN skill = 'Python' THEN proficiency_level END) AS Python,
  MAX(CASE WHEN skill = 'SQL' THEN proficiency_level END) AS SQL,
  MAX(CASE WHEN skill = 'Java' THEN proficiency_level END) AS Java,
  MAX(CASE WHEN skill = 'JavaScript' THEN proficiency_level END) AS JavaScript
FROM employee_skills
GROUP BY employee_name;

-- Result:
-- employee_name | Python | SQL | Java | JavaScript
-- Alice         |      5 |   4 |    3 |       NULL
-- Bob           |      4 |   5 | NULL |          4
```

### Advanced PIVOT Examples

**Example 3: Multiple Aggregations**

```sql
-- Sales with both revenue and quantity
CREATE TABLE detailed_sales (
  product VARCHAR(50),
  quarter VARCHAR(10),
  revenue DECIMAL(10,2),
  quantity INT
);

-- PIVOT with multiple aggregations
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1_revenue,
  SUM(CASE WHEN quarter = 'Q1' THEN quantity END) AS Q1_quantity,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2_revenue,
  SUM(CASE WHEN quarter = 'Q2' THEN quantity END) AS Q2_quantity,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue END) AS Q3_revenue,
  SUM(CASE WHEN quarter = 'Q3' THEN quantity END) AS Q3_quantity,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue END) AS Q4_revenue,
  SUM(CASE WHEN quarter = 'Q4' THEN quantity END) AS Q4_quantity
FROM detailed_sales
GROUP BY product;
```

**Example 4: Dynamic Pivot with Running Totals**

```sql
-- Pivot with calculated columns
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue END) AS Q4,
  SUM(CASE WHEN quarter IN ('Q1', 'Q2') THEN revenue END) AS H1_total,
  SUM(CASE WHEN quarter IN ('Q3', 'Q4') THEN revenue END) AS H2_total,
  SUM(revenue) AS annual_total
FROM sales
GROUP BY product;
```

**Example 5: Pivot with Filtering and Conditions**

```sql
-- Pivot only high-value transactions
SELECT
  product,
  COUNT(CASE WHEN quarter = 'Q1' AND revenue > 1000 THEN 1 END) AS Q1_high_value_count,
  COUNT(CASE WHEN quarter = 'Q2' AND revenue > 1000 THEN 1 END) AS Q2_high_value_count,
  AVG(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1_avg_revenue,
  AVG(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2_avg_revenue
FROM sales
GROUP BY product;
```

## UNPIVOT Operations

### Syntax (Universal Approach with UNION)

The most portable way to unpivot data uses UNION ALL:

```sql
SELECT <id_columns>, '<column_name1>' AS <category_column>, <column1> AS <value_column>
FROM <table>
UNION ALL
SELECT <id_columns>, '<column_name2>', <column2>
FROM <table>
UNION ALL
SELECT <id_columns>, '<column_name3>', <column3>
FROM <table>;
```

### Basic UNPIVOT Examples

**Example 1: Converting Quarterly Columns to Rows**

```sql
-- Sample pivoted data
CREATE TABLE quarterly_sales (
  product VARCHAR(50),
  Q1 DECIMAL(10,2),
  Q2 DECIMAL(10,2),
  Q3 DECIMAL(10,2),
  Q4 DECIMAL(10,2)
);

INSERT INTO quarterly_sales VALUES
  ('Laptop', 50000, 65000, 55000, 75000),
  ('Phone', 30000, 35000, 40000, 45000);

-- UNPIVOT using UNION ALL
SELECT product, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT product, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT product, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT product, 'Q4', Q4 FROM quarterly_sales
ORDER BY product, quarter;

-- Result:
-- product | quarter | revenue
-- Laptop  | Q1      | 50000.00
-- Laptop  | Q2      | 65000.00
-- Laptop  | Q3      | 55000.00
-- Laptop  | Q4      | 75000.00
-- Phone   | Q1      | 30000.00
-- Phone   | Q2      | 35000.00
-- Phone   | Q3      | 40000.00
-- Phone   | Q4      | 45000.00
```

**Example 2: Skills Matrix to Individual Records**

```sql
-- Sample skills matrix
CREATE TABLE skills_matrix (
  employee_name VARCHAR(50),
  Python INT,
  SQL INT,
  Java INT,
  JavaScript INT
);

-- UNPIVOT to normalize the data
SELECT employee_name, 'Python' AS skill, Python AS proficiency_level
FROM skills_matrix
WHERE Python IS NOT NULL
UNION ALL
SELECT employee_name, 'SQL', SQL
FROM skills_matrix
WHERE SQL IS NOT NULL
UNION ALL
SELECT employee_name, 'Java', Java
FROM skills_matrix
WHERE Java IS NOT NULL
UNION ALL
SELECT employee_name, 'JavaScript', JavaScript
FROM skills_matrix
WHERE JavaScript IS NOT NULL
ORDER BY employee_name, skill;
```

### Advanced UNPIVOT Examples

**Example 3: UNPIVOT Multiple Column Sets**

```sql
-- Table with revenue and quantity columns
CREATE TABLE sales_summary (
  product VARCHAR(50),
  Q1_revenue DECIMAL(10,2),
  Q1_quantity INT,
  Q2_revenue DECIMAL(10,2),
  Q2_quantity INT
);

-- UNPIVOT both metrics
SELECT product, 'Q1' AS quarter, Q1_revenue AS revenue, Q1_quantity AS quantity
FROM sales_summary
UNION ALL
SELECT product, 'Q2', Q2_revenue, Q2_quantity
FROM sales_summary
ORDER BY product, quarter;
```

**Example 4: Using CROSS JOIN for UNPIVOT**

```sql
-- Alternative UNPIVOT approach using CROSS JOIN (works in most databases)
SELECT
  qs.product,
  q.quarter,
  CASE q.quarter
    WHEN 'Q1' THEN qs.Q1
    WHEN 'Q2' THEN qs.Q2
    WHEN 'Q3' THEN qs.Q3
    WHEN 'Q4' THEN qs.Q4
  END AS revenue
FROM quarterly_sales qs
CROSS JOIN (
  SELECT 'Q1' AS quarter
  UNION ALL SELECT 'Q2'
  UNION ALL SELECT 'Q3'
  UNION ALL SELECT 'Q4'
) q;
```

## Platform-Specific Notes

::: details SQL Server

SQL Server provides native PIVOT and UNPIVOT operators:

```sql
-- PIVOT syntax
SELECT product, [Q1], [Q2], [Q3], [Q4]
FROM (
  SELECT product, quarter, revenue
  FROM sales
) AS SourceTable
PIVOT (
  SUM(revenue)
  FOR quarter IN ([Q1], [Q2], [Q3], [Q4])
) AS PivotTable;

-- UNPIVOT syntax
SELECT product, quarter, revenue
FROM quarterly_sales
UNPIVOT (
  revenue FOR quarter IN (Q1, Q2, Q3, Q4)
) AS UnpivotTable;
```

**Note**: Column names in the IN clause must be enclosed in square brackets if they contain special characters or match keywords.
:::

::: details Oracle

Oracle supports PIVOT and UNPIVOT with similar syntax:

```sql
-- PIVOT syntax
SELECT *
FROM (
  SELECT product, quarter, revenue
  FROM sales
)
PIVOT (
  SUM(revenue)
  FOR quarter IN ('Q1' AS Q1, 'Q2' AS Q2, 'Q3' AS Q3, 'Q4' AS Q4)
);

-- UNPIVOT syntax
SELECT *
FROM quarterly_sales
UNPIVOT (
  revenue FOR quarter IN (Q1, Q2, Q3, Q4)
);

-- UNPIVOT with INCLUDE NULLS to preserve NULL values
SELECT *
FROM quarterly_sales
UNPIVOT INCLUDE NULLS (
  revenue FOR quarter IN (Q1, Q2, Q3, Q4)
);
```

**Note**: Oracle allows aliasing pivot values with the AS clause.
:::

::: details PostgreSQL

PostgreSQL doesn't have native PIVOT/UNPIVOT syntax. Use the tablefunc extension for crosstab, or use CASE/UNION approaches:

```sql
-- Install tablefunc extension
CREATE EXTENSION IF NOT EXISTS tablefunc;

-- Using crosstab for PIVOT
SELECT *
FROM crosstab(
  'SELECT product, quarter, revenue FROM sales ORDER BY 1, 2',
  'SELECT DISTINCT quarter FROM sales ORDER BY 1'
) AS ct(product VARCHAR, Q1 NUMERIC, Q2 NUMERIC, Q3 NUMERIC, Q4 NUMERIC);

-- UNPIVOT using UNION ALL (standard approach)
SELECT product, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT product, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT product, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT product, 'Q4', Q4 FROM quarterly_sales;
```

**Note**: The crosstab function requires the query to be ordered by the first column, then the second.
:::

::: details MySQL

MySQL doesn't have native PIVOT/UNPIVOT operators. Use CASE statements and UNION approaches:

```sql
-- PIVOT using CASE statements
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue ELSE 0 END) AS Q2,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue ELSE 0 END) AS Q3,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue ELSE 0 END) AS Q4
FROM sales
GROUP BY product;

-- UNPIVOT using UNION ALL
SELECT product, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT product, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT product, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT product, 'Q4', Q4 FROM quarterly_sales;
```

**Tip**: For dynamic pivots, consider using prepared statements with dynamic SQL.
:::

::: details BigQuery

BigQuery doesn't support PIVOT/UNPIVOT natively (as of 2024). Use CASE statements and arrays:

```sql
-- PIVOT using CASE
SELECT
  product,
  SUM(IF(quarter = 'Q1', revenue, 0)) AS Q1,
  SUM(IF(quarter = 'Q2', revenue, 0)) AS Q2,
  SUM(IF(quarter = 'Q3', revenue, 0)) AS Q3,
  SUM(IF(quarter = 'Q4', revenue, 0)) AS Q4
FROM sales
GROUP BY product;

-- UNPIVOT using UNION ALL
SELECT product, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT product, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT product, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT product, 'Q4', Q4 FROM quarterly_sales;

-- Alternative: Using UNNEST for UNPIVOT
SELECT
  product,
  quarter,
  revenue
FROM quarterly_sales,
UNNEST([
  STRUCT('Q1' AS quarter, Q1 AS revenue),
  STRUCT('Q2', Q2),
  STRUCT('Q3', Q3),
  STRUCT('Q4', Q4)
]);
```

**Note**: The UNNEST approach is more efficient for large datasets.
:::

::: details Snowflake

Snowflake provides native PIVOT and UNPIVOT operators:

```sql
-- PIVOT syntax
SELECT *
FROM sales
PIVOT (SUM(revenue) FOR quarter IN ('Q1', 'Q2', 'Q3', 'Q4'))
AS p (product, Q1, Q2, Q3, Q4);

-- UNPIVOT syntax
SELECT *
FROM quarterly_sales
UNPIVOT (revenue FOR quarter IN (Q1, Q2, Q3, Q4));

-- Dynamic PIVOT (using ANY keyword)
SELECT *
FROM sales
PIVOT (SUM(revenue) FOR quarter IN (ANY))
ORDER BY product;
```

**Note**: Snowflake's dynamic PIVOT with ANY automatically creates columns for all distinct values.
:::

::: details DuckDB

DuckDB supports both PIVOT and UNPIVOT operations:

```sql
-- PIVOT syntax
PIVOT sales
ON quarter
USING SUM(revenue)
GROUP BY product;

-- Alternative PIVOT syntax
SELECT *
FROM (
  PIVOT sales
  ON quarter IN ('Q1', 'Q2', 'Q3', 'Q4')
  USING SUM(revenue)
  GROUP BY product
);

-- UNPIVOT syntax
UNPIVOT quarterly_sales
ON Q1, Q2, Q3, Q4
INTO
  NAME quarter
  VALUE revenue;

-- Alternative UNPIVOT syntax
SELECT *
FROM (
  UNPIVOT quarterly_sales
  ON COLUMNS(* EXCLUDE (product))
  INTO
    NAME quarter
    VALUE revenue
);
```

**Note**: DuckDB's UNPIVOT can use COLUMNS(*) to automatically unpivot all columns except specified ones.
:::

::: details Databricks / Spark SQL

Databricks and Spark SQL support PIVOT operations with aggregation:

```sql
-- PIVOT syntax
SELECT *
FROM (
  SELECT product, quarter, revenue
  FROM sales
)
PIVOT (
  SUM(revenue)
  FOR quarter IN ('Q1', 'Q2', 'Q3', 'Q4')
);

-- Dynamic PIVOT
SELECT *
FROM sales
PIVOT (
  SUM(revenue)
  FOR quarter IN (SELECT DISTINCT quarter FROM sales)
);

-- UNPIVOT using STACK function
SELECT product, quarter, revenue
FROM quarterly_sales
LATERAL VIEW STACK(4,
  'Q1', Q1,
  'Q2', Q2,
  'Q3', Q3,
  'Q4', Q4
) AS quarter, revenue;
```

**Note**: The STACK function is a Spark-specific feature for unpivoting data efficiently.
:::

::: details SQLite

SQLite doesn't have native PIVOT/UNPIVOT. Use CASE statements and UNION approaches:

```sql
-- PIVOT using CASE
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue ELSE 0 END) AS Q2,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue ELSE 0 END) AS Q3,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue ELSE 0 END) AS Q4
FROM sales
GROUP BY product;

-- UNPIVOT using UNION ALL
SELECT product, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT product, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT product, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT product, 'Q4', Q4 FROM quarterly_sales;
```

**Note**: For better performance with large datasets, ensure proper indexes on the pivoting columns.
:::

## Performance Considerations

### PIVOT Performance

1. **Indexing**: Create indexes on the grouping columns and pivot columns
   ```sql
   CREATE INDEX idx_sales_product_quarter ON sales(product, quarter);
   ```

2. **Aggregation Optimization**: Use appropriate aggregate functions
   - `SUM()` with CASE is generally faster than `MAX()` when you know values are unique
   - Avoid unnecessary ELSE clauses; `NULL` is the default

3. **Column Count**: Excessive pivot columns can impact performance
   - Consider limiting the number of pivot columns
   - For many columns, consider alternative data structures

4. **Native vs. CASE**: Native PIVOT operators are generally optimized
   - However, CASE-based pivots offer more flexibility
   - Test both approaches for your specific use case

### UNPIVOT Performance

1. **UNION ALL Efficiency**: Each UNION adds overhead
   ```sql
   -- More efficient: Filter NULL values to reduce row count
   SELECT product, 'Q1' AS quarter, Q1 AS revenue
   FROM quarterly_sales
   WHERE Q1 IS NOT NULL
   UNION ALL
   SELECT product, 'Q2', Q2
   FROM quarterly_sales
   WHERE Q2 IS NOT NULL;
   ```

2. **CROSS JOIN Alternative**: Can be more efficient for many columns
   ```sql
   -- Scans the table once instead of multiple times
   SELECT
     qs.product,
     q.quarter,
     CASE q.quarter
       WHEN 'Q1' THEN qs.Q1
       WHEN 'Q2' THEN qs.Q2
       WHEN 'Q3' THEN qs.Q3
       WHEN 'Q4' THEN qs.Q4
     END AS revenue
   FROM quarterly_sales qs
   CROSS JOIN (VALUES ('Q1'), ('Q2'), ('Q3'), ('Q4')) AS q(quarter);
   ```

3. **Native UNPIVOT**: Use database-specific UNPIVOT when available
   - Generally more optimized than UNION approaches
   - Single table scan vs. multiple scans

### General Optimization Tips

1. **Materialized Views**: For frequently accessed pivoted data
   ```sql
   CREATE MATERIALIZED VIEW sales_pivot AS
   SELECT
     product,
     SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1,
     SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2,
     SUM(CASE WHEN quarter = 'Q3' THEN revenue END) AS Q3,
     SUM(CASE WHEN quarter = 'Q4' THEN revenue END) AS Q4
   FROM sales
   GROUP BY product;
   ```

2. **Partitioning**: For large tables, consider partitioning by pivot columns

3. **Query Plan Analysis**: Always examine execution plans
   ```sql
   EXPLAIN ANALYZE
   SELECT product,
     SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1
   FROM sales
   GROUP BY product;
   ```

## Common Pitfalls

### Pitfall 1: Using SUM() with ELSE 0 vs. No ELSE

```sql
-- ❌ Incorrect: ELSE 0 can produce misleading results
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS Q1
FROM sales
GROUP BY product;
-- Returns 0 for products with no Q1 sales

-- ✅ Correct: No ELSE clause returns NULL for missing data
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1
FROM sales
GROUP BY product;
-- Returns NULL for products with no Q1 sales
```

**Why**: NULL properly indicates missing data, while 0 suggests a zero value.

### Pitfall 2: Forgetting to Aggregate

```sql
-- ❌ Incorrect: Missing aggregation function
SELECT
  product,
  CASE WHEN quarter = 'Q1' THEN revenue END AS Q1
FROM sales
GROUP BY product;
-- Error: revenue must appear in GROUP BY or be used in an aggregate

-- ✅ Correct: Use aggregation with GROUP BY
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1
FROM sales
GROUP BY product;
```

### Pitfall 3: UNPIVOT Creating Unnecessary Rows

```sql
-- ❌ Incorrect: Includes NULL values as rows
SELECT product, 'Q1' AS quarter, Q1 AS revenue FROM quarterly_sales
UNION ALL
SELECT product, 'Q2', Q2 FROM quarterly_sales
UNION ALL
SELECT product, 'Q3', Q3 FROM quarterly_sales
UNION ALL
SELECT product, 'Q4', Q4 FROM quarterly_sales;
-- Creates rows even when revenue is NULL

-- ✅ Correct: Filter out NULL values
SELECT product, 'Q1' AS quarter, Q1 AS revenue
FROM quarterly_sales WHERE Q1 IS NOT NULL
UNION ALL
SELECT product, 'Q2', Q2
FROM quarterly_sales WHERE Q2 IS NOT NULL
UNION ALL
SELECT product, 'Q3', Q3
FROM quarterly_sales WHERE Q3 IS NOT NULL
UNION ALL
SELECT product, 'Q4', Q4
FROM quarterly_sales WHERE Q4 IS NOT NULL;
```

### Pitfall 4: Hardcoding Pivot Values

```sql
-- ❌ Problematic: Hardcoded values may miss new categories
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2
FROM sales
GROUP BY product;
-- Misses Q3 and Q4 if they're added later

-- ✅ Better: Dynamic approaches or comprehensive value lists
-- Option 1: Use database-specific dynamic PIVOT (Snowflake example)
SELECT * FROM sales
PIVOT (SUM(revenue) FOR quarter IN (ANY));

-- Option 2: Query distinct values first
SELECT DISTINCT quarter FROM sales ORDER BY quarter;
-- Then build the PIVOT query based on results
```

### Pitfall 5: Incorrect Data Types in UNPIVOT

```sql
-- ❌ Incorrect: Mixing data types
CREATE TABLE mixed_metrics (
  product VARCHAR(50),
  revenue DECIMAL(10,2),
  quantity INT,
  rating VARCHAR(10)
);

-- This will fail or produce unexpected results
SELECT product, 'revenue' AS metric, revenue AS value FROM mixed_metrics
UNION ALL
SELECT product, 'quantity', quantity FROM mixed_metrics  -- Type mismatch!
UNION ALL
SELECT product, 'rating', rating FROM mixed_metrics;

-- ✅ Correct: Convert to common type
SELECT product, 'revenue' AS metric, CAST(revenue AS VARCHAR) AS value
FROM mixed_metrics
UNION ALL
SELECT product, 'quantity', CAST(quantity AS VARCHAR)
FROM mixed_metrics
UNION ALL
SELECT product, 'rating', rating
FROM mixed_metrics;
```

### Pitfall 6: Losing Information in PIVOT

```sql
-- ❌ Incorrect: Aggregating without proper grouping loses detail
CREATE TABLE sales_detail (
  product VARCHAR(50),
  region VARCHAR(50),
  quarter VARCHAR(10),
  revenue DECIMAL(10,2)
);

-- This loses region information
SELECT
  product,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1
FROM sales_detail
GROUP BY product;

-- ✅ Correct: Include all necessary grouping columns
SELECT
  product,
  region,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2
FROM sales_detail
GROUP BY product, region;
```

## Common Use Cases

### 1. Financial Reporting

```sql
-- Monthly revenue comparison across years
SELECT
  month_name,
  SUM(CASE WHEN year = 2023 THEN revenue END) AS "2023",
  SUM(CASE WHEN year = 2024 THEN revenue END) AS "2024",
  SUM(CASE WHEN year = 2025 THEN revenue END) AS "2025"
FROM monthly_revenue
GROUP BY month_name
ORDER BY
  CASE month_name
    WHEN 'January' THEN 1
    WHEN 'February' THEN 2
    -- ... etc
  END;
```

### 2. Survey Results Analysis

```sql
-- Survey responses by question and rating
SELECT
  question_text,
  COUNT(CASE WHEN rating = 1 THEN 1 END) AS "Very Dissatisfied",
  COUNT(CASE WHEN rating = 2 THEN 1 END) AS "Dissatisfied",
  COUNT(CASE WHEN rating = 3 THEN 1 END) AS "Neutral",
  COUNT(CASE WHEN rating = 4 THEN 1 END) AS "Satisfied",
  COUNT(CASE WHEN rating = 5 THEN 1 END) AS "Very Satisfied"
FROM survey_responses
GROUP BY question_text;
```

### 3. Inventory Status Dashboard

```sql
-- Product availability by warehouse
SELECT
  product_name,
  SUM(CASE WHEN warehouse = 'East' THEN quantity END) AS east_warehouse,
  SUM(CASE WHEN warehouse = 'West' THEN quantity END) AS west_warehouse,
  SUM(CASE WHEN warehouse = 'North' THEN quantity END) AS north_warehouse,
  SUM(CASE WHEN warehouse = 'South' THEN quantity END) AS south_warehouse,
  SUM(quantity) AS total_inventory
FROM inventory
GROUP BY product_name;
```

### 4. Time Series Data Normalization

```sql
-- Convert wide-format time series to long format for analysis
SELECT stock_symbol, '2024-01-01' AS trade_date, jan_01_price AS closing_price
FROM stock_prices WHERE jan_01_price IS NOT NULL
UNION ALL
SELECT stock_symbol, '2024-01-02', jan_02_price
FROM stock_prices WHERE jan_02_price IS NOT NULL
UNION ALL
SELECT stock_symbol, '2024-01-03', jan_03_price
FROM stock_prices WHERE jan_03_price IS NOT NULL;
-- ... etc
```

## Combining PIVOT with Other Techniques

### With CTEs

```sql
-- Calculate year-over-year growth using PIVOT
WITH pivoted_sales AS (
  SELECT
    product,
    SUM(CASE WHEN year = 2023 THEN revenue END) AS revenue_2023,
    SUM(CASE WHEN year = 2024 THEN revenue END) AS revenue_2024
  FROM annual_sales
  GROUP BY product
)
SELECT
  product,
  revenue_2023,
  revenue_2024,
  ROUND(((revenue_2024 - revenue_2023) / NULLIF(revenue_2023, 0)) * 100, 2) AS growth_pct
FROM pivoted_sales
WHERE revenue_2023 IS NOT NULL AND revenue_2024 IS NOT NULL;
```

### With Window Functions

```sql
-- Pivot with ranking within each group
SELECT
  category,
  SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter = 'Q3' THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter = 'Q4' THEN revenue END) AS Q4,
  RANK() OVER (ORDER BY SUM(revenue) DESC) AS revenue_rank
FROM sales
GROUP BY category;
```

### With JSON/Array Aggregation

```sql
-- PostgreSQL: PIVOT into JSON
SELECT
  product,
  json_build_object(
    'Q1', SUM(CASE WHEN quarter = 'Q1' THEN revenue END),
    'Q2', SUM(CASE WHEN quarter = 'Q2' THEN revenue END),
    'Q3', SUM(CASE WHEN quarter = 'Q3' THEN revenue END),
    'Q4', SUM(CASE WHEN quarter = 'Q4' THEN revenue END)
  ) AS quarterly_revenue
FROM sales
GROUP BY product;
```

## See Also

- [Aggregations](/concepts/aggregations/) - Understanding aggregate functions used in PIVOT operations
- [CTEs (Common Table Expressions)](/concepts/ctes/) - Using CTEs with PIVOT for complex transformations
- [Window Functions](/concepts/window-functions/) - Combining window functions with pivoted data
- [CASE Expressions](/concepts/basics/#conditional-logic) - Deep dive into CASE statements
- [GROUP BY and Grouping Sets](/concepts/aggregations/#grouping-sets) - Advanced grouping techniques
