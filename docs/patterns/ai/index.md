---
title: AI Patterns in SQL
description: >-
  Comprehensive guide to SQL patterns for AI and machine learning applications,
  including vector search, embeddings, feature engineering, and RAG systems
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
  - patterns
  - ai
  - machine-learning
  - vector-search
  - embeddings
  - rag
  - semantic-search
  - feature-engineering
  - ml-pipelines
---

# AI Patterns in SQL

<div class="difficulty-badge difficulty-advanced">Advanced</div>

## Quick Reference

```sql
-- Vector similarity search
SELECT
  id,
  content,
  embedding <-> query_embedding AS distance
FROM documents
ORDER BY embedding <-> query_embedding
LIMIT 10;

-- Feature engineering for ML
SELECT
  user_id,
  COUNT(*) as total_orders,
  AVG(amount) as avg_order_value,
  MAX(order_date) as last_order_date,
  EXTRACT(DAY FROM CURRENT_DATE - MAX(order_date)) as days_since_last_order
FROM orders
GROUP BY user_id;

-- Training/test split
SELECT
  *,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) <= COUNT(*) OVER () * 0.8
    THEN 'train'
    ELSE 'test'
  END as dataset_split
FROM ml_dataset;

-- Semantic search with embeddings
WITH query_embedding AS (
  SELECT embedding FROM embeddings WHERE id = 'query_123'
)
SELECT
  d.id,
  d.title,
  d.content,
  1 - (d.embedding <=> qe.embedding) as cosine_similarity
FROM documents d, query_embedding qe
ORDER BY d.embedding <=> qe.embedding
LIMIT 20;
```

## Overview

AI and machine learning are increasingly integrated with SQL databases for data preparation, feature engineering, model serving, and intelligent search. Modern databases now support vector operations, embeddings storage, and specialized functions that enable AI applications directly within the database layer.

This guide covers essential SQL patterns for AI applications:
- Vector similarity search for semantic retrieval
- Feature engineering for machine learning models
- Training data preparation and management
- RAG (Retrieval Augmented Generation) system patterns
- Embedding storage and management
- ML model inference integration

Whether you're building recommendation systems, semantic search engines, or preparing data for ML pipelines, these patterns provide production-ready solutions for AI-powered applications.

## Vector Similarity Search

Vector similarity search enables semantic search by comparing embeddings (numerical representations) of text, images, or other data.

### PostgreSQL with pgvector

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector column
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding vector(1536),  -- OpenAI ada-002 dimension
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast similarity search
-- IVFFlat index (good for large datasets)
CREATE INDEX ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- HNSW index (better recall, more memory)
CREATE INDEX ON documents
USING hnsw (embedding vector_cosine_ops);

-- L2 distance (Euclidean)
SELECT
  id,
  content,
  embedding <-> '[0.1, 0.2, ...]'::vector as l2_distance
FROM documents
ORDER BY embedding <-> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- Cosine distance (1 - cosine similarity)
SELECT
  id,
  content,
  1 - (embedding <=> '[0.1, 0.2, ...]'::vector) as cosine_similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- Inner product
SELECT
  id,
  content,
  (embedding <#> '[0.1, 0.2, ...]'::vector) * -1 as inner_product
FROM documents
ORDER BY embedding <#> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

### Vector Search with Filtering

```sql
-- Combine vector search with metadata filtering
SELECT
  d.id,
  d.content,
  d.metadata->>'category' as category,
  d.embedding <=> $1 as distance
FROM documents d
WHERE
  d.metadata->>'category' = 'technology'
  AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY d.embedding <=> $1
LIMIT 20;

-- Hybrid search: Vector + keyword matching
WITH vector_results AS (
  SELECT
    id,
    content,
    embedding <=> $1 as vector_score
  FROM documents
  ORDER BY embedding <=> $1
  LIMIT 100
),
keyword_results AS (
  SELECT
    id,
    content,
    ts_rank(to_tsvector('english', content), query) as keyword_score
  FROM documents, plainto_tsquery('english', $2) query
  WHERE to_tsvector('english', content) @@ query
)
SELECT
  COALESCE(v.id, k.id) as id,
  COALESCE(v.content, k.content) as content,
  COALESCE(v.vector_score, 1.0) as vector_score,
  COALESCE(k.keyword_score, 0.0) as keyword_score,
  (COALESCE(v.vector_score, 1.0) * 0.7 +
   COALESCE(k.keyword_score, 0.0) * 0.3) as combined_score
FROM vector_results v
FULL OUTER JOIN keyword_results k ON v.id = k.id
ORDER BY combined_score ASC
LIMIT 20;
```

### Multi-Vector Search

```sql
-- Store multiple embeddings per document (e.g., chunks)
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id),
  chunk_index INTEGER,
  content TEXT,
  embedding vector(1536),
  UNIQUE(document_id, chunk_index)
);

-- Search across chunks and aggregate by document
WITH chunk_matches AS (
  SELECT
    document_id,
    content,
    embedding <=> $1 as distance,
    ROW_NUMBER() OVER (
      PARTITION BY document_id
      ORDER BY embedding <=> $1
    ) as chunk_rank
  FROM document_chunks
)
SELECT
  d.id,
  d.title,
  d.metadata,
  MIN(cm.distance) as best_chunk_distance,
  AVG(cm.distance) as avg_chunk_distance,
  array_agg(
    cm.content
    ORDER BY cm.distance
    LIMIT 3
  ) as top_matching_chunks
FROM documents d
INNER JOIN chunk_matches cm ON d.id = cm.document_id
WHERE cm.chunk_rank <= 5  -- Consider top 5 chunks per document
GROUP BY d.id, d.title, d.metadata
ORDER BY best_chunk_distance
LIMIT 10;
```

## RAG (Retrieval Augmented Generation) Patterns

RAG systems combine vector search with LLM generation for context-aware responses.

### Basic RAG Retrieval

```sql
-- RAG context retrieval with relevance scoring
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  source_document VARCHAR(255),
  chunk_text TEXT,
  chunk_metadata JSONB,
  embedding vector(1536),
  token_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retrieve relevant context for RAG
WITH ranked_chunks AS (
  SELECT
    id,
    chunk_text,
    chunk_metadata,
    token_count,
    1 - (embedding <=> $1) as relevance_score,
    SUM(token_count) OVER (
      ORDER BY embedding <=> $1
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as cumulative_tokens
  FROM knowledge_base
  WHERE
    -- Optional: Filter by metadata
    chunk_metadata->>'domain' = $2
  ORDER BY embedding <=> $1
)
SELECT
  id,
  chunk_text,
  chunk_metadata,
  relevance_score,
  cumulative_tokens
FROM ranked_chunks
WHERE
  cumulative_tokens <= 4000  -- Stay within context window
  AND relevance_score >= 0.7  -- Minimum relevance threshold
ORDER BY relevance_score DESC;
```

### Multi-Query RAG

```sql
-- Generate diverse context by combining multiple query perspectives
CREATE TABLE user_queries (
  id SERIAL PRIMARY KEY,
  original_query TEXT,
  query_variations TEXT[],
  query_embedding vector(1536),
  variation_embeddings vector(1536)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retrieve using multiple query angles
WITH query_variations AS (
  SELECT
    unnest(variation_embeddings) as embedding,
    generate_subscripts(variation_embeddings, 1) as variation_index
  FROM user_queries
  WHERE id = $1
),
diverse_results AS (
  SELECT DISTINCT
    kb.id,
    kb.chunk_text,
    kb.chunk_metadata,
    MIN(kb.embedding <=> qv.embedding) as best_distance
  FROM knowledge_base kb
  CROSS JOIN query_variations qv
  GROUP BY kb.id, kb.chunk_text, kb.chunk_metadata
  ORDER BY best_distance
  LIMIT 20
)
SELECT
  id,
  chunk_text,
  chunk_metadata,
  best_distance,
  1 - best_distance as relevance_score
FROM diverse_results
ORDER BY best_distance;
```

### Conversational RAG with History

```sql
-- Store conversation history for context-aware retrieval
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversation_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  role VARCHAR(20),  -- 'user' or 'assistant'
  content TEXT,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retrieve context considering conversation history
WITH conversation_context AS (
  SELECT
    embedding,
    content
  FROM conversation_messages
  WHERE conversation_id = $1
  ORDER BY created_at DESC
  LIMIT 5
),
current_query_embedding AS (
  SELECT $2::vector as embedding
),
weighted_embedding AS (
  -- Combine current query with recent conversation context
  SELECT
    (
      (SELECT embedding FROM current_query_embedding) * 0.7 +
      AVG(embedding) * 0.3
    ) as combined_embedding
  FROM conversation_context
)
SELECT
  kb.id,
  kb.chunk_text,
  kb.chunk_metadata,
  kb.embedding <=> we.combined_embedding as distance
FROM knowledge_base kb
CROSS JOIN weighted_embedding we
ORDER BY kb.embedding <=> we.combined_embedding
LIMIT 15;
```

### RAG with Source Attribution

```sql
-- Track and return source documents for citation
CREATE TABLE rag_retrievals (
  id SERIAL PRIMARY KEY,
  query_id INTEGER,
  query_text TEXT,
  retrieved_chunks INTEGER[],
  generation_used BOOLEAN,
  feedback_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retrieve with full source tracking
WITH retrieval AS (
  SELECT
    kb.id,
    kb.chunk_text,
    kb.source_document,
    kb.chunk_metadata,
    kb.embedding <=> $1 as distance,
    ROW_NUMBER() OVER (ORDER BY kb.embedding <=> $1) as rank
  FROM knowledge_base kb
  ORDER BY kb.embedding <=> $1
  LIMIT 10
)
INSERT INTO rag_retrievals (query_id, query_text, retrieved_chunks)
SELECT
  $2,  -- query_id
  $3,  -- query_text
  array_agg(id ORDER BY rank)
FROM retrieval
RETURNING *;

-- Retrieve results with citations
SELECT
  r.id,
  r.chunk_text,
  r.source_document,
  r.chunk_metadata->>'page' as page_number,
  r.chunk_metadata->>'section' as section,
  r.distance,
  r.rank
FROM retrieval r
ORDER BY r.rank;
```

## Feature Engineering for ML

Transform raw data into features suitable for machine learning models.

### Time-Based Features

```sql
-- Extract temporal features from timestamps
SELECT
  user_id,
  order_date,
  -- Date components
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(MONTH FROM order_date) as month,
  EXTRACT(DAY FROM order_date) as day,
  EXTRACT(DOW FROM order_date) as day_of_week,
  EXTRACT(HOUR FROM order_date) as hour,

  -- Cyclical encoding (important for ML)
  SIN(2 * PI() * EXTRACT(MONTH FROM order_date) / 12) as month_sin,
  COS(2 * PI() * EXTRACT(MONTH FROM order_date) / 12) as month_cos,
  SIN(2 * PI() * EXTRACT(DOW FROM order_date) / 7) as dow_sin,
  COS(2 * PI() * EXTRACT(DOW FROM order_date) / 7) as dow_cos,
  SIN(2 * PI() * EXTRACT(HOUR FROM order_date) / 24) as hour_sin,
  COS(2 * PI() * EXTRACT(HOUR FROM order_date) / 24) as hour_cos,

  -- Business time features
  CASE
    WHEN EXTRACT(DOW FROM order_date) IN (0, 6) THEN 1
    ELSE 0
  END as is_weekend,

  CASE
    WHEN EXTRACT(HOUR FROM order_date) BETWEEN 9 AND 17 THEN 1
    ELSE 0
  END as is_business_hours,

  -- Time since features
  EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - order_date) / 86400 as days_since_order
FROM orders;
```

### Aggregation Features

```sql
-- Customer behavior aggregation features
WITH customer_stats AS (
  SELECT
    customer_id,
    -- Count features
    COUNT(*) as total_orders,
    COUNT(DISTINCT DATE(order_date)) as active_days,
    COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '30 days'
          THEN 1 END) as orders_last_30d,
    COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '90 days'
          THEN 1 END) as orders_last_90d,

    -- Monetary features
    SUM(amount) as total_spent,
    AVG(amount) as avg_order_value,
    STDDEV(amount) as stddev_order_value,
    MIN(amount) as min_order_value,
    MAX(amount) as max_order_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as median_order_value,

    -- Recency features
    MAX(order_date) as last_order_date,
    MIN(order_date) as first_order_date,
    EXTRACT(DAY FROM CURRENT_DATE - MAX(order_date)) as days_since_last_order,
    EXTRACT(DAY FROM CURRENT_DATE - MIN(order_date)) as customer_lifetime_days,

    -- Frequency features
    COUNT(*) * 1.0 / NULLIF(
      EXTRACT(DAY FROM CURRENT_DATE - MIN(order_date)), 0
    ) as orders_per_day,

    -- Trend features
    REGR_SLOPE(
      amount,
      EXTRACT(EPOCH FROM order_date)
    ) as spending_trend
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY customer_id
)
SELECT
  customer_id,
  total_orders,
  active_days,
  orders_last_30d,
  orders_last_90d,
  total_spent,
  avg_order_value,
  stddev_order_value,
  median_order_value,
  days_since_last_order,
  customer_lifetime_days,
  orders_per_day,
  spending_trend,

  -- Derived ratio features
  ROUND(orders_last_30d * 1.0 / NULLIF(orders_last_90d, 0), 3) as order_velocity_ratio,
  ROUND(active_days * 1.0 / NULLIF(customer_lifetime_days, 0), 3) as engagement_ratio,

  -- Bucketed features (category encoding)
  CASE
    WHEN total_spent > 10000 THEN 'high_value'
    WHEN total_spent > 1000 THEN 'medium_value'
    ELSE 'low_value'
  END as value_segment
FROM customer_stats;
```

### Window Function Features

```sql
-- Rolling statistics and lag features
SELECT
  order_id,
  customer_id,
  order_date,
  amount,

  -- Lag features (previous values)
  LAG(amount, 1) OVER w as prev_order_amount,
  LAG(amount, 2) OVER w as prev_2_order_amount,
  LAG(order_date, 1) OVER w as prev_order_date,

  -- Time between orders
  EXTRACT(DAY FROM
    order_date - LAG(order_date, 1) OVER w
  ) as days_since_prev_order,

  -- Rolling aggregations (trailing windows)
  AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING
  ) as avg_prev_5_orders,

  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN 29 PRECEDING AND 1 PRECEDING
  ) as sum_prev_30_orders,

  COUNT(*) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
  ) as order_sequence_number,

  -- Expanding window (cumulative)
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as cumulative_spent,

  -- Rank features
  PERCENT_RANK() OVER (
    PARTITION BY DATE_TRUNC('month', order_date)
    ORDER BY amount
  ) as percentile_rank_in_month
FROM orders
WINDOW w AS (PARTITION BY customer_id ORDER BY order_date)
ORDER BY customer_id, order_date;
```

### Category Encoding

```sql
-- One-hot encoding for categorical variables
SELECT
  customer_id,
  -- One-hot encoding for category
  CASE WHEN category = 'electronics' THEN 1 ELSE 0 END as cat_electronics,
  CASE WHEN category = 'clothing' THEN 1 ELSE 0 END as cat_clothing,
  CASE WHEN category = 'food' THEN 1 ELSE 0 END as cat_food,
  CASE WHEN category = 'other' THEN 1 ELSE 0 END as cat_other,

  -- Frequency encoding (replace category with its frequency)
  COUNT(*) OVER (PARTITION BY category) * 1.0 /
    COUNT(*) OVER () as category_frequency,

  -- Target encoding (mean of target variable per category)
  AVG(converted::INTEGER) OVER (PARTITION BY category) as category_conversion_rate
FROM user_events;

-- Label encoding (assign integer to each category)
WITH category_labels AS (
  SELECT
    category,
    DENSE_RANK() OVER (ORDER BY category) - 1 as category_label
  FROM products
  GROUP BY category
)
SELECT
  p.product_id,
  p.category,
  cl.category_label
FROM products p
LEFT JOIN category_labels cl ON p.category = cl.category;
```

## Training Data Preparation

### Train/Validation/Test Split

```sql
-- Stratified split maintaining class distribution
WITH stratified_split AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY target_class
      ORDER BY RANDOM()
    ) as row_num,
    COUNT(*) OVER (PARTITION BY target_class) as class_count
  FROM ml_dataset
)
SELECT
  *,
  CASE
    WHEN row_num <= class_count * 0.7 THEN 'train'
    WHEN row_num <= class_count * 0.85 THEN 'validation'
    ELSE 'test'
  END as dataset_split
FROM stratified_split;

-- Time-based split (important for time series)
WITH time_splits AS (
  SELECT
    *,
    NTILE(10) OVER (ORDER BY event_date) as time_decile
  FROM ml_dataset
)
SELECT
  *,
  CASE
    WHEN time_decile <= 7 THEN 'train'
    WHEN time_decile = 8 THEN 'validation'
    ELSE 'test'
  END as dataset_split
FROM time_splits;
```

### Handling Imbalanced Data

```sql
-- Undersampling majority class
WITH class_counts AS (
  SELECT
    target_class,
    COUNT(*) as count,
    MIN(COUNT(*)) OVER () as minority_count
  FROM ml_dataset
  GROUP BY target_class
),
balanced_sample AS (
  SELECT
    d.*,
    ROW_NUMBER() OVER (
      PARTITION BY d.target_class
      ORDER BY RANDOM()
    ) as rn
  FROM ml_dataset d
  INNER JOIN class_counts cc ON d.target_class = cc.target_class
)
SELECT
  id,
  features,
  target_class
FROM balanced_sample bs
INNER JOIN class_counts cc ON bs.target_class = cc.target_class
WHERE bs.rn <= cc.minority_count;

-- Oversampling with SMOTE-like duplication
WITH minority_class AS (
  SELECT *
  FROM ml_dataset
  WHERE target_class = 'positive'
),
majority_count AS (
  SELECT COUNT(*) as count
  FROM ml_dataset
  WHERE target_class = 'negative'
),
replicated_minority AS (
  SELECT
    mc.*,
    generate_series(1, (SELECT count FROM majority_count) / COUNT(*) OVER ()) as replica
  FROM minority_class mc
)
SELECT
  id,
  features,
  target_class,
  'minority' as source
FROM replicated_minority
UNION ALL
SELECT
  id,
  features,
  target_class,
  'majority' as source
FROM ml_dataset
WHERE target_class = 'negative';
```

### Feature Normalization

```sql
-- Min-max normalization (scale to 0-1)
WITH feature_stats AS (
  SELECT
    MIN(feature_value) as min_val,
    MAX(feature_value) as max_val
  FROM ml_dataset
)
SELECT
  id,
  feature_value,
  (feature_value - min_val) / NULLIF(max_val - min_val, 0) as normalized_value
FROM ml_dataset, feature_stats;

-- Z-score normalization (standardization)
WITH feature_stats AS (
  SELECT
    AVG(feature_value) as mean_val,
    STDDEV(feature_value) as stddev_val
  FROM ml_dataset
)
SELECT
  id,
  feature_value,
  (feature_value - mean_val) / NULLIF(stddev_val, 0) as standardized_value
FROM ml_dataset, feature_stats;

-- Robust scaling (using median and IQR)
WITH feature_percentiles AS (
  SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY feature_value) as q1,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY feature_value) as median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY feature_value) as q3
  FROM ml_dataset
)
SELECT
  id,
  feature_value,
  (feature_value - median) / NULLIF(q3 - q1, 0) as robust_scaled_value
FROM ml_dataset, feature_percentiles;
```

## Embedding Management

### Storing and Versioning Embeddings

```sql
-- Embedding management table
CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50),  -- 'document', 'user', 'product', etc.
  entity_id INTEGER,
  embedding_model VARCHAR(100),  -- 'text-embedding-ada-002', etc.
  embedding_version INTEGER,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, embedding_model, embedding_version)
);

CREATE INDEX idx_embeddings_entity
  ON embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_vector
  ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Insert embeddings with version control
INSERT INTO embeddings (
  entity_type,
  entity_id,
  embedding_model,
  embedding_version,
  embedding,
  metadata
)
SELECT
  'document',
  id,
  'text-embedding-ada-002',
  1,
  $1,  -- embedding vector
  jsonb_build_object(
    'content_length', LENGTH(content),
    'language', detected_language
  )
FROM documents
ON CONFLICT (entity_type, entity_id, embedding_model, embedding_version)
DO UPDATE SET
  embedding = EXCLUDED.embedding,
  metadata = EXCLUDED.metadata,
  created_at = CURRENT_TIMESTAMP;
```

### Batch Embedding Operations

```sql
-- Find entities missing embeddings
SELECT
  d.id,
  d.content,
  d.updated_at
FROM documents d
LEFT JOIN embeddings e
  ON e.entity_type = 'document'
  AND e.entity_id = d.id
  AND e.embedding_model = 'text-embedding-ada-002'
WHERE
  e.id IS NULL
  OR d.updated_at > e.created_at
ORDER BY d.updated_at DESC
LIMIT 1000;

-- Bulk update embeddings efficiently
WITH embedding_batch AS (
  SELECT
    unnest($1::INTEGER[]) as entity_id,
    unnest($2::vector[]) as embedding
)
UPDATE embeddings e
SET
  embedding = eb.embedding,
  created_at = CURRENT_TIMESTAMP
FROM embedding_batch eb
WHERE
  e.entity_type = 'document'
  AND e.entity_id = eb.entity_id
  AND e.embedding_model = 'text-embedding-ada-002';
```

### Embedding Quality Metrics

```sql
-- Analyze embedding distribution and quality
WITH embedding_stats AS (
  SELECT
    entity_type,
    embedding_model,
    COUNT(*) as total_embeddings,
    AVG(array_length(embedding::text::float[], 1)) as avg_dimension,

    -- Compute average norm (magnitude)
    AVG(
      SQRT(
        (SELECT SUM(val * val)
         FROM unnest(embedding::real[]) as val)
      )
    ) as avg_norm,

    -- Diversity: average pairwise distance
    (
      SELECT AVG(e1.embedding <=> e2.embedding)
      FROM embeddings e1, embeddings e2
      WHERE e1.entity_type = embeddings.entity_type
        AND e2.entity_type = embeddings.entity_type
        AND e1.id < e2.id
      LIMIT 10000
    ) as avg_pairwise_distance
  FROM embeddings
  GROUP BY entity_type, embedding_model
)
SELECT
  entity_type,
  embedding_model,
  total_embeddings,
  ROUND(avg_dimension::numeric, 2) as avg_dimension,
  ROUND(avg_norm::numeric, 4) as avg_norm,
  ROUND(avg_pairwise_distance::numeric, 4) as avg_diversity
FROM embedding_stats;
```

## Model Serving and Inference

### Storing Model Predictions

```sql
-- Store ML model predictions
CREATE TABLE model_predictions (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  prediction_class VARCHAR(100),
  prediction_score DECIMAL(10, 8),
  prediction_probabilities JSONB,
  features_used JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  feedback_label VARCHAR(100),
  feedback_timestamp TIMESTAMP
);

CREATE INDEX idx_predictions_entity
  ON model_predictions(entity_type, entity_id);
CREATE INDEX idx_predictions_model
  ON model_predictions(model_name, model_version, created_at);

-- Insert prediction
INSERT INTO model_predictions (
  model_name,
  model_version,
  entity_type,
  entity_id,
  prediction_class,
  prediction_score,
  prediction_probabilities,
  features_used
)
VALUES (
  'churn_predictor',
  'v2.1.0',
  'customer',
  12345,
  'will_churn',
  0.87,
  '{"will_churn": 0.87, "will_retain": 0.13}'::jsonb,
  '{"orders_last_30d": 0, "days_since_last_order": 45}'::jsonb
);
```

### Model Performance Monitoring

```sql
-- Track model performance over time
WITH prediction_performance AS (
  SELECT
    model_name,
    model_version,
    DATE_TRUNC('day', created_at) as prediction_date,
    COUNT(*) as total_predictions,

    -- Accuracy (when feedback is available)
    COUNT(CASE
      WHEN feedback_label IS NOT NULL
        AND prediction_class = feedback_label
      THEN 1
    END) as correct_predictions,

    COUNT(CASE WHEN feedback_label IS NOT NULL THEN 1 END) as predictions_with_feedback,

    -- Average confidence
    AVG(prediction_score) as avg_confidence,
    STDDEV(prediction_score) as stddev_confidence,

    -- Distribution of predictions
    COUNT(CASE WHEN prediction_class = 'positive' THEN 1 END) as predicted_positive,
    COUNT(CASE WHEN prediction_class = 'negative' THEN 1 END) as predicted_negative
  FROM model_predictions
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY model_name, model_version, DATE_TRUNC('day', created_at)
)
SELECT
  model_name,
  model_version,
  prediction_date,
  total_predictions,
  predictions_with_feedback,
  ROUND(
    100.0 * correct_predictions /
    NULLIF(predictions_with_feedback, 0),
    2
  ) as accuracy_pct,
  ROUND(avg_confidence::numeric, 4) as avg_confidence,
  ROUND(stddev_confidence::numeric, 4) as stddev_confidence,
  predicted_positive,
  predicted_negative,
  ROUND(
    100.0 * predicted_positive /
    NULLIF(total_predictions, 0),
    2
  ) as positive_rate_pct
FROM prediction_performance
ORDER BY model_name, model_version, prediction_date;
```

### A/B Testing ML Models

```sql
-- A/B test different model versions
CREATE TABLE model_experiments (
  id SERIAL PRIMARY KEY,
  experiment_name VARCHAR(100),
  model_variant VARCHAR(50),  -- 'control', 'variant_a', 'variant_b'
  user_id INTEGER,
  prediction_class VARCHAR(100),
  prediction_score DECIMAL(10, 8),
  actual_outcome VARCHAR(100),
  outcome_value DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assign users to experiment variants
INSERT INTO model_experiments (
  experiment_name,
  model_variant,
  user_id,
  prediction_class,
  prediction_score
)
SELECT
  'churn_model_v3_test',
  CASE
    WHEN MOD(user_id, 3) = 0 THEN 'control'
    WHEN MOD(user_id, 3) = 1 THEN 'variant_a'
    ELSE 'variant_b'
  END,
  user_id,
  prediction_class,
  prediction_score
FROM ml_predictions
WHERE user_id IS NOT NULL;

-- Analyze experiment results
SELECT
  experiment_name,
  model_variant,
  COUNT(*) as sample_size,

  -- Performance metrics
  ROUND(
    100.0 * COUNT(CASE WHEN prediction_class = actual_outcome THEN 1 END) /
    COUNT(*),
    2
  ) as accuracy_pct,

  -- Business metrics
  AVG(outcome_value) as avg_outcome_value,
  SUM(outcome_value) as total_outcome_value,

  -- Statistical significance prep
  AVG(CASE WHEN actual_outcome = 'positive' THEN 1 ELSE 0 END) as conversion_rate,
  STDDEV(CASE WHEN actual_outcome = 'positive' THEN 1 ELSE 0 END) as stddev_conversion
FROM model_experiments
WHERE actual_outcome IS NOT NULL
GROUP BY experiment_name, model_variant
ORDER BY experiment_name, model_variant;
```

## Recommendation Systems

### Collaborative Filtering

```sql
-- User-based collaborative filtering
WITH user_similarity AS (
  SELECT
    u1.user_id as user1_id,
    u2.user_id as user2_id,
    -- Cosine similarity based on interaction vectors
    (
      COUNT(CASE WHEN u1.product_id = u2.product_id THEN 1 END) * 1.0 /
      (
        SQRT(COUNT(DISTINCT u1.product_id)) *
        SQRT(COUNT(DISTINCT u2.product_id))
      )
    ) as similarity_score
  FROM user_interactions u1
  INNER JOIN user_interactions u2
    ON u1.product_id = u2.product_id
    AND u1.user_id < u2.user_id
  GROUP BY u1.user_id, u2.user_id
  HAVING COUNT(CASE WHEN u1.product_id = u2.product_id THEN 1 END) >= 3
)
SELECT
  us.user1_id as target_user,
  ui.product_id as recommended_product,
  AVG(us.similarity_score * ui.rating) as weighted_score,
  COUNT(*) as similar_users_count
FROM user_similarity us
INNER JOIN user_interactions ui
  ON us.user2_id = ui.user_id
WHERE NOT EXISTS (
  -- Exclude products user has already interacted with
  SELECT 1
  FROM user_interactions ui2
  WHERE ui2.user_id = us.user1_id
    AND ui2.product_id = ui.product_id
)
GROUP BY us.user1_id, ui.product_id
HAVING COUNT(*) >= 3
ORDER BY target_user, weighted_score DESC;
```

### Content-Based Recommendations

```sql
-- Recommend based on content similarity
WITH user_preferences AS (
  SELECT
    user_id,
    AVG(embedding) as avg_preference_embedding
  FROM user_interactions ui
  INNER JOIN product_embeddings pe
    ON ui.product_id = pe.product_id
  WHERE ui.rating >= 4
  GROUP BY user_id
)
SELECT
  up.user_id,
  p.product_id,
  p.name,
  1 - (p.embedding <=> up.avg_preference_embedding) as similarity_score
FROM user_preferences up
CROSS JOIN products p
WHERE NOT EXISTS (
  SELECT 1
  FROM user_interactions ui
  WHERE ui.user_id = up.user_id
    AND ui.product_id = p.product_id
)
ORDER BY up.user_id, similarity_score DESC
LIMIT 10;
```

### Hybrid Recommendations

```sql
-- Combine collaborative and content-based approaches
WITH collaborative_scores AS (
  -- Collaborative filtering scores
  SELECT
    user_id,
    product_id,
    predicted_score as collab_score
  FROM collaborative_filtering_results
),
content_scores AS (
  -- Content-based scores
  SELECT
    user_id,
    product_id,
    similarity_score as content_score
  FROM content_based_results
),
popularity_scores AS (
  -- Popularity baseline
  SELECT
    product_id,
    COUNT(*) * 1.0 / (SELECT COUNT(DISTINCT user_id) FROM user_interactions) as popularity
  FROM user_interactions
  WHERE rating >= 4
  GROUP BY product_id
)
SELECT
  COALESCE(cs.user_id, cbs.user_id) as user_id,
  COALESCE(cs.product_id, cbs.product_id) as product_id,
  COALESCE(cs.collab_score, 0) * 0.5 +
  COALESCE(cbs.content_score, 0) * 0.3 +
  COALESCE(ps.popularity, 0) * 0.2 as hybrid_score
FROM collaborative_scores cs
FULL OUTER JOIN content_scores cbs
  ON cs.user_id = cbs.user_id
  AND cs.product_id = cbs.product_id
LEFT JOIN popularity_scores ps
  ON COALESCE(cs.product_id, cbs.product_id) = ps.product_id
ORDER BY user_id, hybrid_score DESC;
```

## Best Practices

### 1. Vector Index Selection

```sql
-- ✅ Good: Choose appropriate index for your use case

-- IVFFlat: Good for large datasets, faster build time
CREATE INDEX ON embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- lists ≈ sqrt(total_rows)

-- HNSW: Better recall, slower build, more memory
CREATE INDEX ON embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Distance operator selection:
-- <-> for L2 distance (Euclidean)
-- <=> for cosine distance (1 - cosine similarity)
-- <#> for inner product (dot product)
```

### 2. Efficient Feature Materialization

```sql
-- ✅ Good: Materialize features for repeated use
CREATE MATERIALIZED VIEW customer_features AS
SELECT
  customer_id,
  COUNT(*) as total_orders,
  SUM(amount) as total_spent,
  AVG(amount) as avg_order_value,
  MAX(order_date) as last_order_date,
  EXTRACT(DAY FROM CURRENT_DATE - MAX(order_date)) as days_since_last_order
FROM orders
GROUP BY customer_id;

CREATE UNIQUE INDEX ON customer_features(customer_id);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY customer_features;
```

### 3. Handle NULL Values in Features

```sql
-- ✅ Good: Explicit NULL handling
SELECT
  customer_id,
  COALESCE(email_open_rate, 0) as email_open_rate,
  COALESCE(days_since_last_order, 999) as days_since_last_order,
  CASE
    WHEN total_orders IS NULL THEN 1  -- Missing indicator
    ELSE 0
  END as total_orders_is_null
FROM customer_features;
```

### 4. Version Control for ML Artifacts

```sql
-- ✅ Good: Track model and embedding versions
CREATE TABLE ml_model_registry (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  model_type VARCHAR(50),
  training_date TIMESTAMP,
  feature_columns TEXT[],
  hyperparameters JSONB,
  performance_metrics JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only one active version per model
CREATE UNIQUE INDEX idx_active_model
  ON ml_model_registry(model_name)
  WHERE is_active = TRUE;
```

### 5. Monitor Data Drift

```sql
-- Track feature distribution changes over time
CREATE TABLE feature_statistics (
  id SERIAL PRIMARY KEY,
  feature_name VARCHAR(100),
  snapshot_date DATE,
  mean_value DECIMAL(15, 6),
  stddev_value DECIMAL(15, 6),
  min_value DECIMAL(15, 6),
  max_value DECIMAL(15, 6),
  null_count INTEGER,
  total_count INTEGER,
  percentiles JSONB,  -- Store p25, p50, p75, p90, p95, p99
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compute and store feature statistics
INSERT INTO feature_statistics (
  feature_name,
  snapshot_date,
  mean_value,
  stddev_value,
  min_value,
  max_value,
  null_count,
  total_count,
  percentiles
)
SELECT
  'avg_order_value',
  CURRENT_DATE,
  AVG(avg_order_value),
  STDDEV(avg_order_value),
  MIN(avg_order_value),
  MAX(avg_order_value),
  COUNT(*) FILTER (WHERE avg_order_value IS NULL),
  COUNT(*),
  jsonb_build_object(
    'p25', PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY avg_order_value),
    'p50', PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY avg_order_value),
    'p75', PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY avg_order_value),
    'p95', PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY avg_order_value)
  )
FROM customer_features;
```

## Common Pitfalls

### 1. Data Leakage in Feature Engineering

```sql
-- ❌ Bad: Using future information
SELECT
  customer_id,
  order_date,
  AVG(amount) OVER (PARTITION BY customer_id) as avg_order_value  -- Includes future orders!
FROM orders;

-- ✅ Good: Only use past information
SELECT
  customer_id,
  order_date,
  AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
  ) as avg_past_order_value
FROM orders;
```

### 2. Inefficient Vector Searches

```sql
-- ❌ Bad: No index, sequential scan
SELECT * FROM embeddings
ORDER BY embedding <-> $1
LIMIT 10;

-- ✅ Good: Use proper index
CREATE INDEX ON embeddings
USING ivfflat (embedding vector_cosine_ops);

SELECT * FROM embeddings
ORDER BY embedding <-> $1
LIMIT 10;
```

### 3. Ignoring Class Imbalance

```sql
-- ❌ Bad: Random split with imbalanced classes
SELECT
  *,
  CASE WHEN RANDOM() < 0.8 THEN 'train' ELSE 'test' END as split
FROM ml_dataset;

-- ✅ Good: Stratified split
SELECT
  *,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY target_class ORDER BY RANDOM())
         <= COUNT(*) OVER (PARTITION BY target_class) * 0.8
    THEN 'train'
    ELSE 'test'
  END as split
FROM ml_dataset;
```

## Try It Yourself

<SQLAssistant mode="generate" default-dialect="postgresql" :show-model-selector="false" />

## See Also

- [Vector Databases](/concepts/vector-databases/) - Dedicated vector database concepts
- [Window Functions](/concepts/window-functions/) - Essential for feature engineering
- [Aggregations](/concepts/aggregations/) - Aggregating data for ML features
- [CTEs](/concepts/ctes/) - Complex feature engineering queries
- [Analytics Patterns](/patterns/analytics/) - Analytical patterns for ML
- [Performance](/concepts/performance/) - Optimizing ML data queries
