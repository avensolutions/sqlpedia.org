---
title: Analytics Patterns in SQL
description: >-
  Comprehensive guide to common SQL analytics patterns for business
  intelligence, data analysis, and reporting
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
  - patterns
  - analytics
  - metrics
  - cohorts
  - retention
  - funnel
  - time-series
  - rfm
  - segmentation
  - growth
---

# Analytics Patterns in SQL

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

## Quick Reference

```sql
-- Time-series analysis: Daily active users
SELECT
  DATE(activity_date) as date,
  COUNT(DISTINCT user_id) as daily_active_users
FROM user_activities
GROUP BY DATE(activity_date)
ORDER BY date;

-- Cohort analysis: User retention
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signup_date) as cohort_month
  FROM users
)
SELECT
  cohort_month,
  COUNT(DISTINCT user_id) as cohort_size
FROM cohorts
GROUP BY cohort_month;

-- Funnel analysis: Conversion rates
SELECT
  COUNT(DISTINCT CASE WHEN step = 'view' THEN user_id END) as views,
  COUNT(DISTINCT CASE WHEN step = 'add_to_cart' THEN user_id END) as add_to_cart,
  COUNT(DISTINCT CASE WHEN step = 'checkout' THEN user_id END) as checkouts,
  COUNT(DISTINCT CASE WHEN step = 'purchase' THEN user_id END) as purchases
FROM user_events;

-- RFM Analysis: Customer segmentation
SELECT
  customer_id,
  MAX(order_date) as recency,
  COUNT(*) as frequency,
  SUM(amount) as monetary
FROM orders
GROUP BY customer_id;
```

## Overview

Analytics patterns are reusable SQL query templates that solve common business intelligence and data analysis problems. These patterns help you extract insights from your data, measure business performance, understand user behavior, and make data-driven decisions.

This guide covers essential analytics patterns used in modern data analysis, from basic metrics to advanced cohort and funnel analysis. Whether you're analyzing e-commerce data, SaaS metrics, or user behavior, these patterns provide a solid foundation for your analytical work.

## Time-Series Analysis

Time-series analysis examines data points collected over time to identify trends, patterns, and seasonality.

### Daily, Weekly, Monthly Aggregations

```sql
-- Daily active users (DAU)
SELECT
  DATE(activity_timestamp) as date,
  COUNT(DISTINCT user_id) as daily_active_users
FROM user_activities
WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(activity_timestamp)
ORDER BY date;

-- Weekly active users (WAU)
SELECT
  DATE_TRUNC('week', activity_timestamp) as week,
  COUNT(DISTINCT user_id) as weekly_active_users
FROM user_activities
WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', activity_timestamp)
ORDER BY week;

-- Monthly active users (MAU)
SELECT
  DATE_TRUNC('month', activity_timestamp) as month,
  COUNT(DISTINCT user_id) as monthly_active_users,
  COUNT(*) as total_activities,
  ROUND(COUNT(*) * 1.0 / NULLIF(COUNT(DISTINCT user_id), 0), 2) as activities_per_user
FROM user_activities
WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', activity_timestamp)
ORDER BY month;

-- Multi-period view
SELECT
  DATE(activity_timestamp) as date,
  COUNT(DISTINCT user_id) as dau,
  COUNT(DISTINCT user_id) OVER (
    ORDER BY DATE(activity_timestamp)
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as wau_rolling_7day,
  COUNT(DISTINCT user_id) OVER (
    ORDER BY DATE(activity_timestamp)
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ) as mau_rolling_30day
FROM user_activities
WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(activity_timestamp)
ORDER BY date;
```

### Growth Rates and Trends

```sql
-- Month-over-month growth
WITH monthly_metrics AS (
  SELECT
    DATE_TRUNC('month', order_date) as month,
    SUM(amount) as revenue,
    COUNT(DISTINCT customer_id) as customers,
    COUNT(*) as orders
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '24 months'
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT
  month,
  revenue,
  customers,
  orders,
  LAG(revenue) OVER (ORDER BY month) as prev_month_revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) as revenue_change,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) /
    NULLIF(LAG(revenue) OVER (ORDER BY month), 0),
    2
  ) as revenue_growth_pct,
  ROUND(
    100.0 * (customers - LAG(customers) OVER (ORDER BY month)) /
    NULLIF(LAG(customers) OVER (ORDER BY month), 0),
    2
  ) as customer_growth_pct
FROM monthly_metrics
ORDER BY month;

-- Year-over-year comparison
WITH monthly_revenue AS (
  SELECT
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(MONTH FROM order_date) as month,
    SUM(amount) as revenue
  FROM orders
  GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
)
SELECT
  year,
  month,
  revenue,
  LAG(revenue, 12) OVER (ORDER BY year, month) as revenue_last_year,
  revenue - LAG(revenue, 12) OVER (ORDER BY year, month) as yoy_change,
  ROUND(
    100.0 * (revenue - LAG(revenue, 12) OVER (ORDER BY year, month)) /
    NULLIF(LAG(revenue, 12) OVER (ORDER BY year, month), 0),
    2
  ) as yoy_growth_pct
FROM monthly_revenue
ORDER BY year, month;

-- Cumulative growth
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as total_users,
  ROUND(
    100.0 * COUNT(*) /
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)),
    2
  ) as pct_of_total
FROM users
WHERE created_at >= '2023-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### Moving Averages and Smoothing

```sql
-- Simple moving average (SMA)
SELECT
  DATE(order_date) as date,
  SUM(amount) as daily_revenue,
  AVG(SUM(amount)) OVER (
    ORDER BY DATE(order_date)
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as sma_7day,
  AVG(SUM(amount)) OVER (
    ORDER BY DATE(order_date)
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ) as sma_30day
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(order_date)
ORDER BY date;

-- Exponential moving average approximation
WITH daily_revenue AS (
  SELECT
    DATE(order_date) as date,
    SUM(amount) as revenue,
    ROW_NUMBER() OVER (ORDER BY DATE(order_date)) as day_num
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE(order_date)
)
SELECT
  date,
  revenue,
  -- Simple moving average
  AVG(revenue) OVER (
    ORDER BY day_num
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as sma_7day,
  -- Weighted moving average (recent days weighted more)
  (
    revenue * 4 +
    COALESCE(LAG(revenue, 1) OVER (ORDER BY day_num), revenue) * 3 +
    COALESCE(LAG(revenue, 2) OVER (ORDER BY day_num), revenue) * 2 +
    COALESCE(LAG(revenue, 3) OVER (ORDER BY day_num), revenue) * 1
  ) / 10.0 as wma_4day
FROM daily_revenue
ORDER BY date;

-- Trend detection with linear regression components
WITH daily_stats AS (
  SELECT
    DATE(order_date) as date,
    SUM(amount) as revenue,
    ROW_NUMBER() OVER (ORDER BY DATE(order_date)) as x
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE(order_date)
)
SELECT
  date,
  revenue,
  -- Simple trend line using window functions
  AVG(revenue) OVER () +
  (x - AVG(x) OVER ()) *
  (SUM((revenue - AVG(revenue) OVER ()) * (x - AVG(x) OVER ())) OVER () /
   NULLIF(SUM(POWER(x - AVG(x) OVER (), 2)) OVER (), 0)) as trend_line,
  revenue - (
    AVG(revenue) OVER () +
    (x - AVG(x) OVER ()) *
    (SUM((revenue - AVG(revenue) OVER ()) * (x - AVG(x) OVER ())) OVER () /
     NULLIF(SUM(POWER(x - AVG(x) OVER (), 2)) OVER (), 0))
  ) as deviation_from_trend
FROM daily_stats
ORDER BY date;
```

## Cohort Analysis

Cohort analysis tracks groups of users who share a common characteristic over time, typically used to measure retention and engagement.

### Basic Cohort Retention

```sql
-- Monthly cohort retention analysis
WITH user_cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signup_date) as cohort_month
  FROM users
),
user_activities AS (
  SELECT
    user_id,
    DATE_TRUNC('month', activity_date) as activity_month
  FROM activities
  GROUP BY user_id, DATE_TRUNC('month', activity_date)
)
SELECT
  uc.cohort_month,
  COUNT(DISTINCT uc.user_id) as cohort_size,
  EXTRACT(MONTH FROM AGE(ua.activity_month, uc.cohort_month)) as months_since_signup,
  COUNT(DISTINCT ua.user_id) as active_users,
  ROUND(
    100.0 * COUNT(DISTINCT ua.user_id) / COUNT(DISTINCT uc.user_id),
    2
  ) as retention_rate
FROM user_cohorts uc
LEFT JOIN user_activities ua ON uc.user_id = ua.user_id
WHERE uc.cohort_month >= '2024-01-01'
GROUP BY uc.cohort_month, months_since_signup
ORDER BY uc.cohort_month, months_since_signup;

-- Cohort retention with pivot
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', created_at) as cohort_month,
    DATE_TRUNC('month', created_at) as month_0
  FROM users
),
activity_months AS (
  SELECT DISTINCT
    c.user_id,
    c.cohort_month,
    DATE_TRUNC('month', a.activity_date) as activity_month,
    EXTRACT(MONTH FROM AGE(
      DATE_TRUNC('month', a.activity_date),
      c.cohort_month
    )) as month_number
  FROM cohorts c
  INNER JOIN user_activities a ON c.user_id = a.user_id
  WHERE a.activity_date >= c.cohort_month
)
SELECT
  cohort_month,
  COUNT(DISTINCT CASE WHEN month_number = 0 THEN user_id END) as month_0,
  COUNT(DISTINCT CASE WHEN month_number = 1 THEN user_id END) as month_1,
  COUNT(DISTINCT CASE WHEN month_number = 2 THEN user_id END) as month_2,
  COUNT(DISTINCT CASE WHEN month_number = 3 THEN user_id END) as month_3,
  COUNT(DISTINCT CASE WHEN month_number = 6 THEN user_id END) as month_6,
  COUNT(DISTINCT CASE WHEN month_number = 12 THEN user_id END) as month_12,
  -- Retention percentages
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_number = 1 THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN month_number = 0 THEN user_id END), 0), 2) as month_1_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_number = 3 THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN month_number = 0 THEN user_id END), 0), 2) as month_3_retention
FROM activity_months
GROUP BY cohort_month
ORDER BY cohort_month;
```

### Revenue Cohorts

```sql
-- Cohort lifetime value analysis
WITH user_cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signup_date) as cohort_month
  FROM users
),
cohort_revenue AS (
  SELECT
    uc.cohort_month,
    uc.user_id,
    DATE_TRUNC('month', o.order_date) as revenue_month,
    EXTRACT(MONTH FROM AGE(
      DATE_TRUNC('month', o.order_date),
      uc.cohort_month
    )) as months_since_signup,
    SUM(o.amount) as revenue
  FROM user_cohorts uc
  INNER JOIN orders o ON uc.user_id = o.customer_id
  WHERE o.status = 'completed'
  GROUP BY uc.cohort_month, uc.user_id, DATE_TRUNC('month', o.order_date)
)
SELECT
  cohort_month,
  months_since_signup,
  COUNT(DISTINCT user_id) as paying_users,
  SUM(revenue) as total_revenue,
  ROUND(AVG(revenue), 2) as avg_revenue_per_user,
  SUM(SUM(revenue)) OVER (
    PARTITION BY cohort_month
    ORDER BY months_since_signup
  ) as cumulative_ltv,
  ROUND(
    SUM(SUM(revenue)) OVER (
      PARTITION BY cohort_month
      ORDER BY months_since_signup
    ) / FIRST_VALUE(COUNT(DISTINCT user_id)) OVER (
      PARTITION BY cohort_month
      ORDER BY months_since_signup
    ),
    2
  ) as avg_cumulative_ltv
FROM cohort_revenue
GROUP BY cohort_month, months_since_signup
ORDER BY cohort_month, months_since_signup;
```

## Funnel Analysis

Funnel analysis measures conversion rates through a multi-step process, identifying where users drop off.

### Basic Conversion Funnel

```sql
-- E-commerce conversion funnel
SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) as step_1_page_views,
  COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN user_id END) as step_2_product_views,
  COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) as step_3_add_to_cart,
  COUNT(DISTINCT CASE WHEN event_type = 'checkout_start' THEN user_id END) as step_4_checkout_start,
  COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) as step_5_purchase,

  -- Conversion rates
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END), 0),
    2
  ) as step_1_to_2_conversion,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN user_id END), 0),
    2
  ) as step_2_to_3_conversion,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'checkout_start' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END), 0),
    2
  ) as step_3_to_4_conversion,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'checkout_start' THEN user_id END), 0),
    2
  ) as step_4_to_5_conversion,

  -- Overall conversion
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END), 0),
    2
  ) as overall_conversion_rate
FROM user_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days';

-- Funnel with time-based segmentation
SELECT
  DATE(event_timestamp) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) as visitors,
  COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) as add_to_cart,
  COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) as purchases,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END), 0),
    2
  ) as conversion_rate
FROM user_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(event_timestamp)
ORDER BY date;
```

### Advanced Funnel with Session Tracking

```sql
-- Session-based funnel analysis
WITH session_events AS (
  SELECT
    session_id,
    user_id,
    MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as has_page_view,
    MAX(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END) as has_product_view,
    MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as has_add_to_cart,
    MAX(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) as has_checkout,
    MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as has_purchase,
    MIN(event_timestamp) as session_start,
    MAX(event_timestamp) as session_end
  FROM user_events
  WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY session_id, user_id
),
funnel_stages AS (
  SELECT
    session_id,
    user_id,
    session_start,
    session_end,
    EXTRACT(EPOCH FROM (session_end - session_start)) / 60 as session_duration_minutes,
    CASE
      WHEN has_purchase = 1 THEN 5
      WHEN has_checkout = 1 THEN 4
      WHEN has_add_to_cart = 1 THEN 3
      WHEN has_product_view = 1 THEN 2
      WHEN has_page_view = 1 THEN 1
      ELSE 0
    END as max_stage_reached
  FROM session_events
)
SELECT
  max_stage_reached,
  CASE max_stage_reached
    WHEN 5 THEN 'Purchase'
    WHEN 4 THEN 'Checkout'
    WHEN 3 THEN 'Add to Cart'
    WHEN 2 THEN 'Product View'
    WHEN 1 THEN 'Page View'
    ELSE 'No Activity'
  END as stage_name,
  COUNT(*) as sessions,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG(session_duration_minutes), 2) as avg_session_duration,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct_of_sessions,
  SUM(COUNT(*)) OVER (ORDER BY max_stage_reached DESC) as cumulative_sessions
FROM funnel_stages
GROUP BY max_stage_reached
ORDER BY max_stage_reached DESC;
```

### Funnel Drop-off Analysis

```sql
-- Identify where users drop off in the funnel
WITH funnel_steps AS (
  SELECT
    user_id,
    session_id,
    BOOL_OR(event_type = 'landing') as reached_landing,
    BOOL_OR(event_type = 'signup_start') as reached_signup_start,
    BOOL_OR(event_type = 'signup_complete') as reached_signup_complete,
    BOOL_OR(event_type = 'first_action') as reached_first_action,
    MIN(event_timestamp) as first_event
  FROM user_events
  WHERE event_timestamp >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY user_id, session_id
),
step_completion AS (
  SELECT
    CASE
      WHEN reached_first_action THEN 'Completed: First Action'
      WHEN reached_signup_complete THEN 'Dropped: After Signup'
      WHEN reached_signup_start THEN 'Dropped: During Signup'
      WHEN reached_landing THEN 'Dropped: At Landing'
      ELSE 'No Activity'
    END as completion_status,
    COUNT(*) as sessions,
    COUNT(DISTINCT user_id) as users
  FROM funnel_steps
  GROUP BY completion_status
)
SELECT
  completion_status,
  sessions,
  users,
  ROUND(100.0 * sessions / SUM(sessions) OVER (), 2) as pct_of_sessions,
  ROUND(100.0 * users / SUM(users) OVER (), 2) as pct_of_users
FROM step_completion
ORDER BY
  CASE
    WHEN completion_status LIKE 'Completed%' THEN 1
    WHEN completion_status LIKE 'Dropped: After%' THEN 2
    WHEN completion_status LIKE 'Dropped: During%' THEN 3
    WHEN completion_status LIKE 'Dropped: At%' THEN 4
    ELSE 5
  END;
```

## RFM Analysis

RFM (Recency, Frequency, Monetary) analysis segments customers based on their purchase behavior.

### Basic RFM Calculation

```sql
-- Calculate RFM scores for each customer
WITH rfm_base AS (
  SELECT
    customer_id,
    MAX(order_date) as last_order_date,
    COUNT(*) as order_count,
    SUM(amount) as total_spent,
    AVG(amount) as avg_order_value
  FROM orders
  WHERE status = 'completed'
    AND order_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    last_order_date,
    CURRENT_DATE - last_order_date as days_since_last_order,
    order_count,
    total_spent,
    avg_order_value,
    -- Recency score (5 = most recent, 1 = least recent)
    NTILE(5) OVER (ORDER BY last_order_date DESC) as recency_score,
    -- Frequency score (5 = most frequent, 1 = least frequent)
    NTILE(5) OVER (ORDER BY order_count ASC) as frequency_score,
    -- Monetary score (5 = highest spend, 1 = lowest spend)
    NTILE(5) OVER (ORDER BY total_spent ASC) as monetary_score
  FROM rfm_base
)
SELECT
  customer_id,
  last_order_date,
  days_since_last_order,
  order_count,
  ROUND(total_spent, 2) as total_spent,
  ROUND(avg_order_value, 2) as avg_order_value,
  recency_score,
  frequency_score,
  monetary_score,
  CONCAT(recency_score, frequency_score, monetary_score) as rfm_segment,
  recency_score + frequency_score + monetary_score as rfm_total_score
FROM rfm_scores
ORDER BY rfm_total_score DESC;
```

### RFM Customer Segmentation

```sql
-- Segment customers into actionable groups based on RFM
WITH rfm_base AS (
  SELECT
    customer_id,
    MAX(order_date) as last_order_date,
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM orders
  WHERE status = 'completed'
    AND order_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    last_order_date,
    order_count,
    total_spent,
    NTILE(5) OVER (ORDER BY last_order_date DESC) as r_score,
    NTILE(5) OVER (ORDER BY order_count ASC) as f_score,
    NTILE(5) OVER (ORDER BY total_spent ASC) as m_score
  FROM rfm_base
),
rfm_segments AS (
  SELECT
    customer_id,
    last_order_date,
    order_count,
    total_spent,
    r_score,
    f_score,
    m_score,
    CASE
      -- Champions: Best customers
      WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
      -- Loyal Customers: Frequent shoppers
      WHEN r_score >= 3 AND f_score >= 4 THEN 'Loyal Customers'
      -- Potential Loyalists: Recent customers with potential
      WHEN r_score >= 4 AND f_score >= 2 AND f_score <= 3 THEN 'Potential Loyalists'
      -- New Customers: Recent first-time buyers
      WHEN r_score >= 4 AND f_score <= 1 THEN 'New Customers'
      -- Promising: Recent shoppers with average frequency
      WHEN r_score >= 3 AND f_score >= 2 AND f_score <= 3 THEN 'Promising'
      -- Need Attention: Above average recency, frequency, and monetary
      WHEN r_score >= 3 AND f_score <= 2 THEN 'Need Attention'
      -- About to Sleep: Below average recency
      WHEN r_score = 2 THEN 'About to Sleep'
      -- At Risk: Low recency, used to be good customers
      WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
      -- Cannot Lose Them: Made big purchases, haven't returned
      WHEN r_score <= 2 AND m_score >= 4 THEN 'Cannot Lose Them'
      -- Hibernating: Low recency, frequency, and monetary
      WHEN r_score <= 2 AND f_score <= 2 THEN 'Hibernating'
      ELSE 'Other'
    END as customer_segment
  FROM rfm_scores
)
SELECT
  customer_segment,
  COUNT(*) as customer_count,
  ROUND(AVG(total_spent), 2) as avg_total_spent,
  ROUND(AVG(order_count), 2) as avg_order_count,
  ROUND(AVG(CURRENT_DATE - last_order_date), 0) as avg_days_since_last_order,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct_of_customers,
  ROUND(SUM(total_spent), 2) as segment_revenue,
  ROUND(100.0 * SUM(total_spent) / SUM(SUM(total_spent)) OVER (), 2) as pct_of_revenue
FROM rfm_segments
GROUP BY customer_segment
ORDER BY segment_revenue DESC;
```

## User Segmentation

Segmenting users based on behavior, demographics, or other characteristics.

### Behavioral Segmentation

```sql
-- Segment users by activity level
WITH user_activity AS (
  SELECT
    user_id,
    COUNT(DISTINCT DATE(activity_timestamp)) as active_days,
    COUNT(*) as total_activities,
    MIN(activity_timestamp) as first_activity,
    MAX(activity_timestamp) as last_activity,
    CURRENT_DATE - MAX(DATE(activity_timestamp)) as days_since_last_activity
  FROM user_activities
  WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY user_id
),
activity_segments AS (
  SELECT
    user_id,
    active_days,
    total_activities,
    days_since_last_activity,
    ROUND(total_activities * 1.0 / NULLIF(active_days, 0), 2) as activities_per_day,
    CASE
      WHEN days_since_last_activity <= 1 THEN 'Very Active'
      WHEN days_since_last_activity <= 7 THEN 'Active'
      WHEN days_since_last_activity <= 30 THEN 'Casual'
      WHEN days_since_last_activity <= 60 THEN 'At Risk'
      ELSE 'Dormant'
    END as recency_segment,
    CASE
      WHEN active_days >= 60 THEN 'Power User'
      WHEN active_days >= 30 THEN 'Regular User'
      WHEN active_days >= 10 THEN 'Occasional User'
      ELSE 'New/Rare User'
    END as frequency_segment
  FROM user_activity
)
SELECT
  recency_segment,
  frequency_segment,
  COUNT(*) as users,
  ROUND(AVG(active_days), 1) as avg_active_days,
  ROUND(AVG(total_activities), 1) as avg_total_activities,
  ROUND(AVG(activities_per_day), 2) as avg_activities_per_day
FROM activity_segments
GROUP BY recency_segment, frequency_segment
ORDER BY
  CASE recency_segment
    WHEN 'Very Active' THEN 1
    WHEN 'Active' THEN 2
    WHEN 'Casual' THEN 3
    WHEN 'At Risk' THEN 4
    WHEN 'Dormant' THEN 5
  END,
  CASE frequency_segment
    WHEN 'Power User' THEN 1
    WHEN 'Regular User' THEN 2
    WHEN 'Occasional User' THEN 3
    WHEN 'New/Rare User' THEN 4
  END;
```

### Value-Based Segmentation

```sql
-- Segment customers by lifetime value
WITH customer_value AS (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as lifetime_value,
    AVG(amount) as avg_order_value,
    MIN(order_date) as first_order_date,
    MAX(order_date) as last_order_date,
    EXTRACT(DAY FROM (MAX(order_date) - MIN(order_date))) as customer_lifetime_days
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
),
value_segments AS (
  SELECT
    customer_id,
    lifetime_value,
    order_count,
    avg_order_value,
    customer_lifetime_days,
    CASE
      WHEN lifetime_value >= PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY lifetime_value) OVER ()
        THEN 'VIP (Top 5%)'
      WHEN lifetime_value >= PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY lifetime_value) OVER ()
        THEN 'High Value (Top 20%)'
      WHEN lifetime_value >= PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY lifetime_value) OVER ()
        THEN 'Medium Value (Top 50%)'
      ELSE 'Low Value'
    END as value_segment,
    NTILE(10) OVER (ORDER BY lifetime_value) as value_decile
  FROM customer_value
)
SELECT
  value_segment,
  COUNT(*) as customers,
  ROUND(AVG(lifetime_value), 2) as avg_ltv,
  ROUND(MIN(lifetime_value), 2) as min_ltv,
  ROUND(MAX(lifetime_value), 2) as max_ltv,
  ROUND(AVG(order_count), 1) as avg_orders,
  ROUND(AVG(avg_order_value), 2) as avg_order_value,
  ROUND(SUM(lifetime_value), 2) as total_revenue,
  ROUND(100.0 * SUM(lifetime_value) / SUM(SUM(lifetime_value)) OVER (), 2) as pct_of_revenue
FROM value_segments
GROUP BY value_segment
ORDER BY avg_ltv DESC;
```

## Retention Metrics

Measuring how well you keep users engaged over time.

### Basic Retention Rate

```sql
-- N-day retention rate
WITH user_signup AS (
  SELECT
    user_id,
    DATE(created_at) as signup_date
  FROM users
),
user_return AS (
  SELECT DISTINCT
    us.user_id,
    us.signup_date,
    DATE(ua.activity_date) as return_date,
    DATE(ua.activity_date) - us.signup_date as days_after_signup
  FROM user_signup us
  LEFT JOIN user_activities ua
    ON us.user_id = ua.user_id
    AND DATE(ua.activity_date) > us.signup_date
)
SELECT
  signup_date,
  COUNT(DISTINCT user_id) as signups,
  COUNT(DISTINCT CASE WHEN days_after_signup = 1 THEN user_id END) as day_1_retained,
  COUNT(DISTINCT CASE WHEN days_after_signup = 7 THEN user_id END) as day_7_retained,
  COUNT(DISTINCT CASE WHEN days_after_signup = 30 THEN user_id END) as day_30_retained,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN days_after_signup = 1 THEN user_id END) /
    NULLIF(COUNT(DISTINCT user_id), 0), 2) as day_1_retention_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN days_after_signup = 7 THEN user_id END) /
    NULLIF(COUNT(DISTINCT user_id), 0), 2) as day_7_retention_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN days_after_signup = 30 THEN user_id END) /
    NULLIF(COUNT(DISTINCT user_id), 0), 2) as day_30_retention_rate
FROM user_return
WHERE signup_date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY signup_date
ORDER BY signup_date;
```

### Rolling Retention

```sql
-- Rolling retention (did user return within N days window)
WITH user_signup AS (
  SELECT
    user_id,
    DATE(created_at) as signup_date
  FROM users
),
user_activities_by_day AS (
  SELECT DISTINCT
    user_id,
    DATE(activity_date) as activity_date
  FROM user_activities
)
SELECT
  us.signup_date,
  COUNT(DISTINCT us.user_id) as cohort_size,
  -- Day 1-7 rolling retention
  COUNT(DISTINCT CASE
    WHEN ua.activity_date BETWEEN us.signup_date + 1 AND us.signup_date + 7
    THEN us.user_id
  END) as returned_day_1_to_7,
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN ua.activity_date BETWEEN us.signup_date + 1 AND us.signup_date + 7
    THEN us.user_id
  END) / NULLIF(COUNT(DISTINCT us.user_id), 0), 2) as retention_day_1_to_7,
  -- Day 8-14 rolling retention
  COUNT(DISTINCT CASE
    WHEN ua.activity_date BETWEEN us.signup_date + 8 AND us.signup_date + 14
    THEN us.user_id
  END) as returned_day_8_to_14,
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN ua.activity_date BETWEEN us.signup_date + 8 AND us.signup_date + 14
    THEN us.user_id
  END) / NULLIF(COUNT(DISTINCT us.user_id), 0), 2) as retention_day_8_to_14,
  -- Day 15-30 rolling retention
  COUNT(DISTINCT CASE
    WHEN ua.activity_date BETWEEN us.signup_date + 15 AND us.signup_date + 30
    THEN us.user_id
  END) as returned_day_15_to_30,
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN ua.activity_date BETWEEN us.signup_date + 15 AND us.signup_date + 30
    THEN us.user_id
  END) / NULLIF(COUNT(DISTINCT us.user_id), 0), 2) as retention_day_15_to_30
FROM user_signup us
LEFT JOIN user_activities_by_day ua ON us.user_id = ua.user_id
WHERE us.signup_date >= CURRENT_DATE - INTERVAL '90 days'
  AND us.signup_date <= CURRENT_DATE - INTERVAL '30 days'
GROUP BY us.signup_date
ORDER BY us.signup_date;
```

## Engagement Metrics

Measuring how users interact with your product.

### Session Metrics

```sql
-- Session analysis
WITH sessions AS (
  SELECT
    user_id,
    session_id,
    MIN(event_timestamp) as session_start,
    MAX(event_timestamp) as session_end,
    COUNT(*) as events_in_session,
    COUNT(DISTINCT page_url) as pages_viewed,
    EXTRACT(EPOCH FROM (MAX(event_timestamp) - MIN(event_timestamp))) / 60 as session_duration_minutes
  FROM user_events
  WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id, session_id
)
SELECT
  DATE(session_start) as date,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*) * 1.0 / NULLIF(COUNT(DISTINCT user_id), 0), 2) as sessions_per_user,
  ROUND(AVG(session_duration_minutes), 2) as avg_session_duration,
  ROUND(AVG(events_in_session), 2) as avg_events_per_session,
  ROUND(AVG(pages_viewed), 2) as avg_pages_per_session,
  -- Bounce rate (sessions with only 1 event)
  ROUND(100.0 * SUM(CASE WHEN events_in_session = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as bounce_rate
FROM sessions
GROUP BY DATE(session_start)
ORDER BY date;
```

### Feature Adoption

```sql
-- Track feature adoption over time
WITH daily_feature_usage AS (
  SELECT
    DATE(event_timestamp) as date,
    feature_name,
    COUNT(DISTINCT user_id) as users_using_feature,
    COUNT(*) as feature_uses
  FROM feature_events
  WHERE event_timestamp >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE(event_timestamp), feature_name
),
daily_active_users AS (
  SELECT
    DATE(activity_timestamp) as date,
    COUNT(DISTINCT user_id) as dau
  FROM user_activities
  WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE(activity_timestamp)
)
SELECT
  dfu.date,
  dfu.feature_name,
  dfu.users_using_feature,
  dfu.feature_uses,
  dau.dau as total_active_users,
  ROUND(100.0 * dfu.users_using_feature / NULLIF(dau.dau, 0), 2) as adoption_rate,
  ROUND(dfu.feature_uses * 1.0 / NULLIF(dfu.users_using_feature, 0), 2) as uses_per_user,
  -- 7-day moving average
  ROUND(AVG(dfu.users_using_feature) OVER (
    PARTITION BY dfu.feature_name
    ORDER BY dfu.date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) as ma_7day_users,
  ROUND(AVG(100.0 * dfu.users_using_feature / NULLIF(dau.dau, 0)) OVER (
    PARTITION BY dfu.feature_name
    ORDER BY dfu.date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) as ma_7day_adoption_rate
FROM daily_feature_usage dfu
JOIN daily_active_users dau ON dfu.date = dau.date
ORDER BY dfu.date, dfu.feature_name;
```

### Stickiness Ratio

```sql
-- DAU/MAU ratio (stickiness)
WITH daily_active AS (
  SELECT
    DATE(activity_timestamp) as date,
    user_id
  FROM user_activities
  WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '60 days'
  GROUP BY DATE(activity_timestamp), user_id
),
metrics_by_date AS (
  SELECT
    date,
    COUNT(DISTINCT user_id) as dau,
    COUNT(DISTINCT user_id) OVER (
      ORDER BY date
      ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as mau_30day
  FROM daily_active
  GROUP BY date
)
SELECT
  date,
  dau,
  mau_30day as mau,
  ROUND(100.0 * dau / NULLIF(mau_30day, 0), 2) as stickiness_ratio,
  -- 7-day average stickiness
  ROUND(AVG(100.0 * dau / NULLIF(mau_30day, 0)) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) as stickiness_7day_avg
FROM metrics_by_date
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;
```

## Best Practices

### 1. Use CTEs for Readability

```sql
-- ✅ Good: Clear, readable structure
WITH base_data AS (
  SELECT
    customer_id,
    order_date,
    amount
  FROM orders
  WHERE status = 'completed'
),
customer_metrics AS (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent
  FROM base_data
  GROUP BY customer_id
)
SELECT *
FROM customer_metrics
WHERE total_spent > 1000;

-- ❌ Bad: Complex nested query
SELECT customer_id, order_count, total_spent
FROM (
  SELECT customer_id, COUNT(*) as order_count, SUM(amount) as total_spent
  FROM (
    SELECT customer_id, order_date, amount
    FROM orders
    WHERE status = 'completed'
  ) sub1
  GROUP BY customer_id
) sub2
WHERE total_spent > 1000;
```

### 2. Handle NULLs Appropriately

```sql
-- ✅ Good: Explicit NULL handling
SELECT
  customer_id,
  COALESCE(SUM(amount), 0) as total_spent,
  ROUND(
    100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0),
    2
  ) as pct_of_orders
FROM orders
GROUP BY customer_id;
```

### 3. Filter Early

```sql
-- ✅ Good: Filter before aggregating
WITH filtered_orders AS (
  SELECT *
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
    AND status = 'completed'
)
SELECT
  customer_id,
  COUNT(*) as order_count
FROM filtered_orders
GROUP BY customer_id;

-- ❌ Less efficient: Aggregate then filter
SELECT
  customer_id,
  COUNT(*) as order_count
FROM orders
GROUP BY customer_id
HAVING MAX(order_date) >= CURRENT_DATE - INTERVAL '12 months';
```

### 4. Use Window Functions Wisely

```sql
-- ✅ Good: Reuse window definition
SELECT
  customer_id,
  order_date,
  amount,
  AVG(amount) OVER customer_window as avg_order_value,
  COUNT(*) OVER customer_window as order_count,
  SUM(amount) OVER customer_window as total_spent
FROM orders
WINDOW customer_window AS (PARTITION BY customer_id);

-- ❌ Repetitive: Define window multiple times
SELECT
  customer_id,
  order_date,
  amount,
  AVG(amount) OVER (PARTITION BY customer_id) as avg_order_value,
  COUNT(*) OVER (PARTITION BY customer_id) as order_count,
  SUM(amount) OVER (PARTITION BY customer_id) as total_spent
FROM orders;
```

### 5. Document Complex Metrics

```sql
-- ✅ Good: Clear comments
SELECT
  DATE_TRUNC('month', order_date) as month,
  COUNT(DISTINCT customer_id) as active_customers,
  -- LTV: Total revenue from customers who made first purchase this month
  -- tracked over subsequent 12 months
  SUM(amount) as cohort_revenue,
  -- Average revenue per customer in cohort
  ROUND(
    SUM(amount) / NULLIF(COUNT(DISTINCT customer_id), 0),
    2
  ) as avg_ltv_12months
FROM orders
WHERE order_date >= '2023-01-01'
GROUP BY DATE_TRUNC('month', order_date);
```

## Common Pitfalls

### 1. Double Counting in Joins

```sql
-- ❌ Problem: Duplicate counting due to JOIN
SELECT
  o.customer_id,
  COUNT(*) as order_count,  -- Wrong! Counts items, not orders
  SUM(o.amount) as total  -- Wrong! Sums amount multiple times
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.customer_id;

-- ✅ Solution: Aggregate at correct level
SELECT
  customer_id,
  COUNT(DISTINCT order_id) as order_count,
  SUM(amount) as total
FROM orders
GROUP BY customer_id;

-- ✅ Or use subquery/CTE
WITH order_totals AS (
  SELECT
    order_id,
    customer_id,
    amount
  FROM orders
)
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total
FROM order_totals
GROUP BY customer_id;
```

### 2. Incorrect Date Comparisons

```sql
-- ❌ Problem: Excludes partial days
WHERE order_date >= '2024-01-01'
  AND order_date <= '2024-01-31'  -- Misses orders after midnight on Jan 31

-- ✅ Solution: Use proper date range
WHERE order_date >= '2024-01-01'
  AND order_date < '2024-02-01'

-- ✅ Or use DATE_TRUNC
WHERE DATE_TRUNC('month', order_date) = '2024-01-01'
```

### 3. Forgetting Time Zones

```sql
-- ❌ Problem: UTC vs local time confusion
SELECT
  DATE(created_at) as date,  -- Uses UTC
  COUNT(*) as signups
FROM users
GROUP BY DATE(created_at);

-- ✅ Solution: Convert to local timezone
SELECT
  DATE(created_at AT TIME ZONE 'America/New_York') as date,
  COUNT(*) as signups
FROM users
GROUP BY DATE(created_at AT TIME ZONE 'America/New_York');
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Window Functions](/concepts/window-functions/) - Advanced window functions for analytics
- [Aggregations](/concepts/aggregations/) - Grouping and aggregating data
- [CTEs](/concepts/ctes/) - Common Table Expressions for complex queries
- [Subqueries](/concepts/subqueries/) - Nested queries for advanced analysis
- [Performance](/concepts/performance/) - Optimizing analytical queries
