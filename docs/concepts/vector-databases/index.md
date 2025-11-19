---
title: Vector Databases
description: Comprehensive guide to vector databases, embeddings, and similarity search including pgvector, Pinecone, Weaviate, and other platforms
databases: [PostgreSQL, Pinecone, Weaviate, Milvus, Qdrant, Chroma, MongoDB, SingleStore]
difficulty: intermediate
tags: [vector-database, embeddings, similarity-search, semantic-search, pgvector, pinecone, weaviate, milvus, qdrant, chroma, rag, llm, ai-search, nearest-neighbor, cosine-similarity, vector-index, hnsw]
---

# Vector Databases

<div class="difficulty-badge difficulty-intermediate">Intermediate</div>

Vector databases are specialized systems designed to store, index, and query high-dimensional vector embeddings efficiently. They enable similarity search, semantic search, and are essential for modern AI applications like Retrieval Augmented Generation (RAG), recommendation systems, and semantic search engines.

## Quick Reference

### PostgreSQL with pgvector

```sql
-- Install pgvector extension
CREATE EXTENSION vector;

-- Create table with vector column
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)  -- 1536 dimensions (OpenAI ada-002)
);

-- Insert vectors
INSERT INTO documents (content, embedding)
VALUES
  ('Machine learning tutorial', '[0.1, 0.2, 0.3, ...]'),
  ('Database optimization guide', '[0.4, 0.5, 0.6, ...]');

-- Similarity search with cosine distance
SELECT content, 1 - (embedding <=> '[0.1, 0.2, 0.3, ...]') AS similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, 0.3, ...]'
LIMIT 5;

-- Create HNSW index for fast similarity search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Euclidean distance (L2)
SELECT * FROM documents
ORDER BY embedding <-> '[0.1, 0.2, ...]'
LIMIT 5;

-- Inner product (dot product)
SELECT * FROM documents
ORDER BY embedding <#> '[0.1, 0.2, ...]'
LIMIT 5;

-- Hybrid search (vector + keyword)
SELECT content,
       1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity,
       ts_rank(to_tsvector(content), query) AS text_rank
FROM documents, plainto_tsquery('machine learning') query
WHERE to_tsvector(content) @@ query
ORDER BY (1 - (embedding <=> '[0.1, 0.2, ...]')) * 0.7 +
         ts_rank(to_tsvector(content), query) * 0.3 DESC
LIMIT 10;
```

### Pinecone (Native Vector Database)

```python
# Python SDK
import pinecone

# Initialize
pinecone.init(api_key="your-api-key", environment="us-west1-gcp")

# Create index
pinecone.create_index(
    name="documents",
    dimension=1536,
    metric="cosine"
)

# Connect to index
index = pinecone.Index("documents")

# Upsert vectors
index.upsert(vectors=[
    ("doc1", [0.1, 0.2, 0.3, ...], {"content": "Machine learning tutorial"}),
    ("doc2", [0.4, 0.5, 0.6, ...], {"content": "Database guide"})
])

# Query similar vectors
results = index.query(
    vector=[0.1, 0.2, 0.3, ...],
    top_k=5,
    include_metadata=True
)

# Query with metadata filtering
results = index.query(
    vector=[0.1, 0.2, 0.3, ...],
    top_k=5,
    filter={"category": "tutorial", "year": {"$gte": 2023}},
    include_metadata=True
)
```

### Weaviate (Multi-Modal Vector Database)

```graphql
# GraphQL API
# Create schema
{
  "class": "Document",
  "vectorizer": "text2vec-openai",
  "properties": [
    {"name": "content", "dataType": ["text"]},
    {"name": "category", "dataType": ["string"]}
  ]
}

# Insert data
mutation {
  createDocument(input: {
    content: "Machine learning tutorial",
    category: "AI"
  }) {
    id
  }
}

# Semantic search
{
  Get {
    Document(
      nearText: {
        concepts: ["artificial intelligence"]
      }
      limit: 5
    ) {
      content
      category
      _additional {
        distance
        certainty
      }
    }
  }
}

# Hybrid search
{
  Get {
    Document(
      hybrid: {
        query: "machine learning"
        alpha: 0.7  # 0.7 vector, 0.3 keyword
      }
      limit: 5
    ) {
      content
    }
  }
}
```

### Qdrant

```python
# Python SDK
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Initialize client
client = QdrantClient(host="localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
)

# Insert points
client.upsert(
    collection_name="documents",
    points=[
        PointStruct(
            id=1,
            vector=[0.1, 0.2, 0.3, ...],
            payload={"content": "Machine learning tutorial", "year": 2023}
        )
    ]
)

# Search
results = client.search(
    collection_name="documents",
    query_vector=[0.1, 0.2, 0.3, ...],
    limit=5,
    query_filter={
        "must": [
            {"key": "year", "range": {"gte": 2023}}
        ]
    }
)
```

### MongoDB Atlas Vector Search

```javascript
// Create vector search index
db.documents.createSearchIndex({
  name: "vector_index",
  type: "vectorSearch",
  definition: {
    fields: [{
      type: "vector",
      path: "embedding",
      numDimensions: 1536,
      similarity: "cosine"
    }]
  }
});

// Vector search with aggregation
db.documents.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.1, 0.2, 0.3, ...],
      numCandidates: 100,
      limit: 5
    }
  },
  {
    $project: {
      content: 1,
      category: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
]);

// Hybrid search (vector + text)
db.documents.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.1, 0.2, 0.3, ...],
      numCandidates: 100,
      limit: 10,
      filter: { category: "AI" }
    }
  }
]);
```

## Overview

### What are Vector Databases?

Vector databases are purpose-built systems for storing and querying **vector embeddings** - numerical representations of unstructured data like text, images, audio, or video. Unlike traditional databases that use exact matches or simple comparisons, vector databases perform **similarity search** to find semantically related items.

**Key Concepts:**

- **Embeddings**: Dense numerical vectors (e.g., [0.23, -0.45, 0.78, ...]) that represent the semantic meaning of data
- **Similarity Search**: Finding items with similar embeddings using distance metrics
- **High-Dimensional Indexing**: Specialized data structures (HNSW, IVF) for fast approximate nearest neighbor search
- **Distance Metrics**: Cosine similarity, Euclidean distance, dot product

### Why Vector Databases?

Traditional databases struggle with semantic similarity queries:

```sql
-- Traditional keyword search - limited
SELECT * FROM articles WHERE content LIKE '%machine learning%';

-- Vector search - finds semantically similar content
-- Even if exact keywords don't match
SELECT * FROM articles
ORDER BY embedding <=> get_embedding('artificial intelligence')
LIMIT 5;
-- Returns: "neural networks", "deep learning", "AI models" etc.
```

**Use Cases:**

1. **Semantic Search**: Find documents by meaning, not just keywords
2. **RAG (Retrieval Augmented Generation)**: Provide relevant context to LLMs
3. **Recommendation Systems**: Find similar products, content, or users
4. **Question Answering**: Match questions to relevant answers
5. **Image/Video Search**: Find visually similar media
6. **Anomaly Detection**: Identify outliers in high-dimensional data
7. **Deduplication**: Find near-duplicate content

## Vector Database Categories

### 1. SQL Extensions

Add vector capabilities to traditional SQL databases.

**PostgreSQL + pgvector**
- Most popular SQL-based solution
- Integrates seamlessly with existing PostgreSQL infrastructure
- Supports ACID transactions, joins with relational data
- Multiple distance metrics and index types

**Other SQL Extensions:**
- **SingleStore**: Vector search with columnar storage
- **DuckDB**: `vss` extension for analytical workloads
- **ClickHouse**: Vector similarity functions
- **Oracle**: Vector search in 23ai

**Advantages:**
- Use existing database skills and tools
- Combine vector and relational queries
- ACID guarantees
- Mature ecosystem

**Limitations:**
- May not match native vector DB performance at scale
- Limited to database's scalability model

### 2. Native Vector Databases

Purpose-built for vector operations.

**Pinecone**
- Fully managed cloud service
- Excellent performance and scalability
- Simple API, minimal configuration
- Pod-based and serverless options

**Weaviate**
- Open-source, multi-modal support
- Built-in vectorization modules
- GraphQL API
- Hybrid search capabilities

**Milvus**
- Open-source, highly scalable
- GPU acceleration support
- Multiple index types
- Kubernetes-native

**Qdrant**
- Open-source, Rust-based
- Rich filtering capabilities
- High performance
- Easy self-hosting

**Chroma**
- Embedded database for AI applications
- Simple Python API
- Great for prototyping
- Local-first development

### 3. Multi-Modal Databases

**MongoDB Atlas Vector Search**
- Add vector search to document database
- Combine with MongoDB's flexible schema
- Aggregation pipeline integration

**Elasticsearch with Dense Vectors**
- Add to existing search infrastructure
- Combine with full-text search

**ArangoDB**
- Multi-model (graph + document + vector)
- Combine graph traversal with vector search

## Platform-Specific Guides

### PostgreSQL with pgvector

pgvector is the most widely adopted SQL-based vector solution.

**Installation:**

```sql
-- Ubuntu/Debian
sudo apt install postgresql-15-pgvector

-- Enable extension
CREATE EXTENSION vector;
```

**Vector Operations:**

```sql
-- Create table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  embedding vector(768),  -- Dimension must match your model
  category TEXT,
  price DECIMAL
);

-- Insert with embeddings
INSERT INTO products (name, description, embedding, category, price)
VALUES (
  'Laptop',
  'High-performance laptop for developers',
  '[0.1, 0.2, ...]'::vector,
  'Electronics',
  999.99
);

-- Cosine similarity (most common for normalized embeddings)
-- Returns values from 0 (identical) to 2 (opposite)
SELECT name, embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM products
ORDER BY distance
LIMIT 5;

-- Euclidean distance (L2)
SELECT name, embedding <-> '[0.1, 0.2, ...]'::vector AS distance
FROM products
ORDER BY distance
LIMIT 5;

-- Inner product (negative dot product)
-- Useful for unnormalized vectors
SELECT name, embedding <#> '[0.1, 0.2, ...]'::vector AS distance
FROM products
ORDER BY distance
LIMIT 5;

-- Exact nearest neighbors with filtering
SELECT name, description, price,
       1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM products
WHERE category = 'Electronics' AND price < 1000
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

**Indexing for Performance:**

```sql
-- HNSW (Hierarchical Navigable Small World)
-- Fast, good recall, more memory
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON products USING hnsw (embedding vector_l2_ops);
CREATE INDEX ON products USING hnsw (embedding vector_ip_ops);

-- IVF (Inverted File Index)
-- Less memory, requires training
CREATE INDEX ON products USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Tune based on row count

-- Index parameters
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
-- m: connections per layer (higher = better recall, more memory)
-- ef_construction: search depth during construction

-- Query-time tuning
SET hnsw.ef_search = 40;  -- Higher = better recall, slower queries
```

**Advanced Patterns:**

```sql
-- Multi-vector search (e.g., text + image embeddings)
CREATE TABLE multimodal_items (
  id SERIAL PRIMARY KEY,
  text_embedding vector(768),
  image_embedding vector(512)
);

SELECT id,
       0.6 * (text_embedding <=> $1::vector) +
       0.4 * (image_embedding <=> $2::vector) AS combined_distance
FROM multimodal_items
ORDER BY combined_distance
LIMIT 10;

-- Reranking pattern (fast first pass, precise second pass)
WITH candidates AS (
  SELECT id, embedding
  FROM products
  ORDER BY embedding <=> $1::vector
  LIMIT 100
)
SELECT p.*, 1 - (c.embedding <=> $1::vector) AS exact_similarity
FROM candidates c
JOIN products p ON p.id = c.id
ORDER BY exact_similarity DESC
LIMIT 10;

-- Temporal vector search
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  embedding vector(768),
  timestamp TIMESTAMPTZ
);

-- Recent similar events
SELECT *
FROM events
WHERE timestamp > NOW() - INTERVAL '7 days'
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

### Pinecone

Pinecone is a fully managed vector database with excellent developer experience.

**Setup:**

```python
import pinecone

# Initialize
pinecone.init(
    api_key="your-api-key",
    environment="us-west1-gcp"
)

# Create index
pinecone.create_index(
    name="products",
    dimension=768,
    metric="cosine",  # or "euclidean", "dotproduct"
    pod_type="p1.x1"  # Performance tier
)

index = pinecone.Index("products")
```

**Basic Operations:**

```python
# Upsert (insert/update) vectors
index.upsert(vectors=[
    ("prod1", [0.1, 0.2, ...], {"name": "Laptop", "price": 999.99}),
    ("prod2", [0.3, 0.4, ...], {"name": "Mouse", "price": 29.99})
])

# Batch upsert
vectors = [
    (f"doc{i}", embedding, {"text": text, "category": cat})
    for i, (embedding, text, cat) in enumerate(data)
]
index.upsert(vectors=vectors, batch_size=100)

# Query
results = index.query(
    vector=[0.1, 0.2, ...],
    top_k=10,
    include_metadata=True,
    include_values=False  # Don't return vectors
)

for match in results.matches:
    print(f"ID: {match.id}, Score: {match.score}")
    print(f"Metadata: {match.metadata}")
```

**Advanced Features:**

```python
# Metadata filtering
results = index.query(
    vector=[0.1, 0.2, ...],
    top_k=10,
    filter={
        "category": {"$eq": "Electronics"},
        "price": {"$lte": 1000},
        "in_stock": True
    },
    include_metadata=True
)

# Namespaces (data isolation)
index.upsert(vectors=vectors, namespace="production")
index.query(vector=query_vector, namespace="production", top_k=5)

# Fetch by ID
index.fetch(ids=["prod1", "prod2"])

# Delete
index.delete(ids=["prod1"])
index.delete(filter={"category": "obsolete"})

# Stats
stats = index.describe_index_stats()
print(f"Total vectors: {stats.total_vector_count}")
```

### Weaviate

Weaviate offers multi-modal support and built-in vectorization.

**Schema Definition:**

```python
import weaviate

client = weaviate.Client("http://localhost:8080")

# Define schema
schema = {
    "class": "Product",
    "vectorizer": "text2vec-openai",  # Auto-vectorize text
    "moduleConfig": {
        "text2vec-openai": {
            "model": "ada",
            "modelVersion": "002"
        }
    },
    "properties": [
        {"name": "name", "dataType": ["text"]},
        {"name": "description", "dataType": ["text"]},
        {"name": "price", "dataType": ["number"]},
        {"name": "category", "dataType": ["string"]}
    ]
}

client.schema.create_class(schema)
```

**CRUD Operations:**

```python
# Create (auto-vectorizes)
client.data_object.create(
    class_name="Product",
    data_object={
        "name": "Laptop",
        "description": "High-performance laptop",
        "price": 999.99,
        "category": "Electronics"
    }
)

# Batch import
with client.batch as batch:
    batch.batch_size = 100
    for product in products:
        batch.add_data_object(product, "Product")
```

**Semantic Search:**

```python
# nearText - semantic search
result = (
    client.query
    .get("Product", ["name", "description", "price"])
    .with_near_text({"concepts": ["portable computer"]})
    .with_limit(5)
    .with_additional(["distance", "certainty"])
    .do()
)

# With filtering
result = (
    client.query
    .get("Product", ["name", "price"])
    .with_near_text({"concepts": ["laptop"]})
    .with_where({
        "path": ["price"],
        "operator": "LessThan",
        "valueNumber": 1000
    })
    .with_limit(10)
    .do()
)

# Hybrid search (vector + BM25)
result = (
    client.query
    .get("Product", ["name", "description"])
    .with_hybrid(
        query="gaming laptop",
        alpha=0.7  # 0 = pure BM25, 1 = pure vector
    )
    .with_limit(5)
    .do()
)

# Multi-modal search (text + image)
result = (
    client.query
    .get("Product", ["name"])
    .with_near_image({"image": "base64_encoded_image"})
    .with_limit(5)
    .do()
)
```

### Milvus

Milvus is a high-performance, cloud-native vector database.

**Setup:**

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType

# Connect
connections.connect("default", host="localhost", port="19530")

# Define schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=768),
    FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
    FieldSchema(name="price", dtype=DataType.FLOAT)
]

schema = CollectionSchema(fields, description="Product catalog")
collection = Collection("products", schema)
```

**Insert and Index:**

```python
# Insert data
entities = [
    [[0.1, 0.2, ...], [0.3, 0.4, ...]],  # embeddings
    ["Laptop", "Mouse"],  # names
    [999.99, 29.99]  # prices
]

collection.insert(entities)

# Create index
index_params = {
    "index_type": "HNSW",
    "metric_type": "COSINE",
    "params": {"M": 16, "efConstruction": 256}
}

collection.create_index("embedding", index_params)
collection.load()
```

**Search:**

```python
search_params = {"metric_type": "COSINE", "params": {"ef": 64}}

results = collection.search(
    data=[[0.1, 0.2, ...]],
    anns_field="embedding",
    param=search_params,
    limit=10,
    output_fields=["name", "price"]
)

for hits in results:
    for hit in hits:
        print(f"ID: {hit.id}, Distance: {hit.distance}")
        print(f"Name: {hit.entity.get('name')}")

# With filtering
results = collection.search(
    data=[[0.1, 0.2, ...]],
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr="price < 1000",  # Filter expression
    output_fields=["name", "price"]
)
```

### Qdrant

Qdrant offers rich filtering and high performance.

**Collections:**

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, Range

client = QdrantClient(url="http://localhost:6333")

# Create collection
client.create_collection(
    collection_name="products",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

# Upsert points
points = [
    PointStruct(
        id=1,
        vector=[0.1, 0.2, ...],
        payload={
            "name": "Laptop",
            "price": 999.99,
            "category": "Electronics",
            "tags": ["portable", "computing"]
        }
    )
]

client.upsert(collection_name="products", points=points)
```

**Search with Filtering:**

```python
# Basic search
results = client.search(
    collection_name="products",
    query_vector=[0.1, 0.2, ...],
    limit=5
)

# Advanced filtering
results = client.search(
    collection_name="products",
    query_vector=[0.1, 0.2, ...],
    query_filter=Filter(
        must=[
            FieldCondition(
                key="price",
                range=Range(gte=100, lte=1000)
            ),
            FieldCondition(
                key="category",
                match={"value": "Electronics"}
            )
        ]
    ),
    limit=10
)

# Search with payload selection
results = client.search(
    collection_name="products",
    query_vector=[0.1, 0.2, ...],
    limit=5,
    with_payload=["name", "price"],  # Only return these fields
    with_vectors=False  # Don't return vectors
)

# Recommendation (find similar to given IDs)
results = client.recommend(
    collection_name="products",
    positive=[1, 2],  # Similar to these
    negative=[5],  # But not like this
    limit=10
)
```

## Distance Metrics and Similarity

### Understanding Distance Metrics

Different metrics suit different use cases:

**Cosine Similarity** (Most Common)
- Measures angle between vectors, ignores magnitude
- Range: -1 (opposite) to 1 (identical)
- Best for: Normalized embeddings, text similarity
- Distance: `1 - cosine_similarity`

```sql
-- pgvector cosine distance (0 = identical, 2 = opposite)
SELECT embedding <=> '[0.1, 0.2, ...]' FROM documents;
```

**Euclidean Distance (L2)**
- Measures straight-line distance
- Range: 0 (identical) to ∞
- Best for: When magnitude matters, image embeddings

```sql
-- pgvector L2 distance
SELECT embedding <-> '[0.1, 0.2, ...]' FROM documents;
```

**Inner Product (Dot Product)**
- Measures alignment and magnitude
- Range: -∞ to ∞ (higher = more similar)
- Best for: Unnormalized vectors, learned metrics

```sql
-- pgvector inner product (returns negative)
SELECT embedding <#> '[0.1, 0.2, ...]' FROM documents;
```

### Distance Metrics Comparison

```python
import numpy as np

# Example vectors
v1 = np.array([1, 0, 0])
v2 = np.array([0.7, 0.7, 0])
v3 = np.array([2, 0, 0])  # Same direction as v1, different magnitude

# Cosine similarity - focuses on direction
cos_sim = lambda a, b: np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
print(cos_sim(v1, v2))  # ~0.7
print(cos_sim(v1, v3))  # 1.0 (same direction!)

# Euclidean distance - considers magnitude
euclidean = lambda a, b: np.linalg.norm(a - b)
print(euclidean(v1, v2))  # ~0.76
print(euclidean(v1, v3))  # 1.0 (different due to magnitude)

# Dot product - both direction and magnitude
dot_prod = lambda a, b: np.dot(a, b)
print(dot_prod(v1, v2))  # 0.7
print(dot_prod(v1, v3))  # 2.0 (magnitude matters)
```

## Index Types and Performance

### HNSW (Hierarchical Navigable Small World)

**Characteristics:**
- Fast queries, excellent recall
- Higher memory usage
- No training required
- Best for: Most use cases

**Configuration:**

```sql
-- pgvector
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops)
WITH (
  m = 16,              -- Connections per layer (4-64)
  ef_construction = 64 -- Build-time search depth (10-500)
);

-- Query-time tuning
SET hnsw.ef_search = 40;  -- Query-time search depth
```

**Tuning Guidelines:**
- `m`: Higher = better recall, more memory (16 is good default)
- `ef_construction`: Higher = better index quality, slower build (64-128 typical)
- `ef_search`: Higher = better recall, slower queries (40-100 typical)

### IVF (Inverted File Index)

**Characteristics:**
- Lower memory footprint
- Requires training on representative data
- Approximate search
- Best for: Large datasets with memory constraints

```sql
-- pgvector IVF
CREATE INDEX ON products USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Number of clusters

-- lists = rows / 1000 is a good starting point
-- Increase for better recall, decrease for faster queries
```

### Performance Optimization

**Dimensionality Reduction:**

```python
from sklearn.decomposition import PCA

# Reduce from 1536 to 768 dimensions
pca = PCA(n_components=768)
reduced_embeddings = pca.fit_transform(high_dim_embeddings)

# Can significantly improve query speed with minimal accuracy loss
```

**Quantization:**

```python
# Pinecone serverless (automatic quantization)
pinecone.create_index(
    name="products",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1")
)
# Automatically uses quantization for cost/performance balance
```

**Batching:**

```sql
-- Bad: One query at a time
SELECT * FROM products ORDER BY embedding <=> $1 LIMIT 5;

-- Good: Batch with LATERAL join
SELECT q.id, p.name, p.embedding <=> q.vec AS distance
FROM query_vectors q
CROSS JOIN LATERAL (
  SELECT * FROM products
  ORDER BY embedding <=> q.vec
  LIMIT 5
) p;
```

## Use Cases and Patterns

### 1. Semantic Search

Find documents by meaning, not keywords.

```sql
-- Traditional keyword search
SELECT * FROM articles
WHERE title ILIKE '%machine learning%'
   OR content ILIKE '%machine learning%';

-- Semantic search - finds related concepts
CREATE OR REPLACE FUNCTION semantic_search(query_text TEXT, max_results INT)
RETURNS TABLE (
  article_id INT,
  title TEXT,
  snippet TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    LEFT(a.content, 200) AS snippet,
    1 - (a.embedding <=> get_embedding(query_text)) AS similarity
  FROM articles a
  ORDER BY a.embedding <=> get_embedding(query_text)
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM semantic_search('artificial intelligence', 10);
-- Returns: neural networks, deep learning, machine learning, etc.
```

### 2. RAG (Retrieval Augmented Generation)

Provide relevant context to LLMs.

```python
import openai
from pgvector.psycopg2 import register_vector

# Get embedding for user question
question = "How do I optimize PostgreSQL queries?"
question_embedding = openai.Embedding.create(
    input=question,
    model="text-embedding-ada-002"
)["data"][0]["embedding"]

# Find relevant documentation
cursor.execute("""
    SELECT content, 1 - (embedding <=> %s) AS similarity
    FROM documentation
    WHERE 1 - (embedding <=> %s) > 0.7  -- Similarity threshold
    ORDER BY embedding <=> %s
    LIMIT 5
""", (question_embedding, question_embedding, question_embedding))

context_docs = cursor.fetchall()
context = "\n\n".join([doc[0] for doc in context_docs])

# Generate answer with context
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "Answer based on the provided documentation."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    ]
)
```

### 3. Recommendation System

Find similar items based on user behavior.

```sql
-- Product recommendations
CREATE TABLE user_interactions (
  user_id INT,
  product_id INT,
  interaction_type TEXT,
  timestamp TIMESTAMPTZ
);

-- Generate user embedding (average of interacted products)
CREATE OR REPLACE FUNCTION get_user_recommendations(p_user_id INT, max_results INT)
RETURNS TABLE (
  product_id INT,
  product_name TEXT,
  similarity FLOAT
) AS $$
DECLARE
  user_embedding vector(768);
BEGIN
  -- Calculate user's interest vector
  SELECT AVG(p.embedding)::vector(768) INTO user_embedding
  FROM user_interactions ui
  JOIN products p ON p.id = ui.product_id
  WHERE ui.user_id = p_user_id
    AND ui.interaction_type IN ('view', 'purchase')
    AND ui.timestamp > NOW() - INTERVAL '90 days';

  -- Find similar products
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    1 - (p.embedding <=> user_embedding) AS similarity
  FROM products p
  WHERE p.id NOT IN (
    SELECT product_id FROM user_interactions
    WHERE user_id = p_user_id
  )
  ORDER BY p.embedding <=> user_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

### 4. Hybrid Search (Vector + Keyword)

Combine semantic understanding with exact matches.

```sql
-- Hybrid search with configurable weights
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(768),
  vector_weight FLOAT DEFAULT 0.7,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id INT,
  content TEXT,
  combined_score FLOAT,
  vector_score FLOAT,
  text_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    (vector_weight * (1 - (d.embedding <=> query_embedding)) +
     (1 - vector_weight) * ts_rank(to_tsvector('english', d.content),
                                     plainto_tsquery('english', query_text))
    ) AS combined_score,
    1 - (d.embedding <=> query_embedding) AS vector_score,
    ts_rank(to_tsvector('english', d.content),
            plainto_tsquery('english', query_text)) AS text_score
  FROM documents d
  WHERE to_tsvector('english', d.content) @@ plainto_tsquery('english', query_text)
     OR (d.embedding <=> query_embedding) < 0.5  -- Distance threshold
  ORDER BY combined_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

### 5. Deduplication

Find near-duplicate content.

```sql
-- Find potential duplicates
WITH duplicates AS (
  SELECT
    d1.id AS doc1_id,
    d2.id AS doc2_id,
    1 - (d1.embedding <=> d2.embedding) AS similarity
  FROM documents d1
  JOIN documents d2 ON d1.id < d2.id
  WHERE (d1.embedding <=> d2.embedding) < 0.1  -- Very similar
)
SELECT
  d1.content AS original,
  d2.content AS duplicate,
  dup.similarity
FROM duplicates dup
JOIN documents d1 ON d1.id = dup.doc1_id
JOIN documents d2 ON d2.id = dup.doc2_id
ORDER BY similarity DESC;
```

### 6. Multi-Lingual Search

Search across languages using multilingual embeddings.

```python
# Using multilingual model (e.g., text-embedding-3-large)
from openai import OpenAI

client = OpenAI()

# English query
query_en = "database optimization"
embedding = client.embeddings.create(
    input=query_en,
    model="text-embedding-3-large"
).data[0].embedding

# Finds documents in any language (Spanish, French, German, etc.)
cursor.execute("""
    SELECT title, language, content
    FROM multilingual_docs
    ORDER BY embedding <=> %s
    LIMIT 10
""", (embedding,))
```

## Creating Embeddings

### OpenAI Embeddings

```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key")

# Single text
response = client.embeddings.create(
    input="Your text here",
    model="text-embedding-3-large"  # or text-embedding-3-small, text-embedding-ada-002
)
embedding = response.data[0].embedding

# Batch processing
texts = ["Text 1", "Text 2", "Text 3", ...]
response = client.embeddings.create(
    input=texts,
    model="text-embedding-3-large"
)
embeddings = [item.embedding for item in response.data]

# Dimensionality reduction (3-large supports this)
response = client.embeddings.create(
    input="Your text here",
    model="text-embedding-3-large",
    dimensions=768  # Reduce from 3072 to 768
)
```

**Model Comparison:**
- `text-embedding-3-large`: 3072 dims, best performance
- `text-embedding-3-small`: 1536 dims, good balance
- `text-embedding-ada-002`: 1536 dims, legacy but still good

### Open Source Embeddings

```python
from sentence_transformers import SentenceTransformer

# Load model
model = SentenceTransformer('all-MiniLM-L6-v2')  # 384 dims

# Generate embeddings
texts = ["First text", "Second text"]
embeddings = model.encode(texts)

# Popular models:
# - all-MiniLM-L6-v2: Fast, 384 dims
# - all-mpnet-base-v2: Better quality, 768 dims
# - multi-qa-MiniLM-L6-cos-v1: Optimized for Q&A
# - paraphrase-multilingual-MiniLM-L12-v2: 50+ languages
```

### Chunking Strategies

For long documents, split into chunks before embedding:

```python
def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

# Process document
document = "Very long document text..."
chunks = chunk_text(document)
embeddings = [get_embedding(chunk) for chunk in chunks]

# Store with metadata
for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
    cursor.execute("""
        INSERT INTO document_chunks (doc_id, chunk_num, content, embedding)
        VALUES (%s, %s, %s, %s)
    """, (doc_id, i, chunk, embedding))
```

## Performance Considerations

### Query Optimization

```sql
-- 1. Use appropriate index
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Pre-filter when possible
SELECT * FROM documents
WHERE category = 'tech'  -- Filter first
ORDER BY embedding <=> $1
LIMIT 10;

-- 3. Use covering indexes
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
INCLUDE (title, created_at);

-- 4. Limit result set
SELECT * FROM documents
ORDER BY embedding <=> $1
LIMIT 20;  -- Don't fetch more than needed
```

### Partitioning

```sql
-- Partition by category for better performance
CREATE TABLE documents (
  id SERIAL,
  content TEXT,
  embedding vector(768),
  category TEXT
) PARTITION BY LIST (category);

CREATE TABLE documents_tech PARTITION OF documents
  FOR VALUES IN ('tech', 'programming');

CREATE TABLE documents_business PARTITION OF documents
  FOR VALUES IN ('business', 'finance');

-- Create index on each partition
CREATE INDEX ON documents_tech USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON documents_business USING hnsw (embedding vector_cosine_ops);

-- Query automatically uses correct partition
SELECT * FROM documents
WHERE category = 'tech'
ORDER BY embedding <=> $1
LIMIT 10;
```

### Caching Strategies

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def get_cached_embedding(text: str):
    """Cache frequently requested embeddings"""
    return openai.Embedding.create(
        input=text,
        model="text-embedding-3-large"
    )["data"][0]["embedding"]

# Or use Redis
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379)

def get_embedding_with_redis_cache(text: str):
    key = f"emb:{hashlib.md5(text.encode()).hexdigest()}"
    cached = redis_client.get(key)

    if cached:
        return json.loads(cached)

    embedding = openai.Embedding.create(
        input=text,
        model="text-embedding-3-large"
    )["data"][0]["embedding"]

    redis_client.setex(key, 86400, json.dumps(embedding))  # 24h TTL
    return embedding
```

## Common Pitfalls

### 1. Dimension Mismatch

```sql
-- BAD: Inserting wrong dimensions
CREATE TABLE docs (embedding vector(768));
INSERT INTO docs VALUES ('[0.1, 0.2]');  -- ERROR: dimension mismatch

-- GOOD: Ensure dimensions match
-- Use same model consistently
-- Validate dimensions before insert
```

### 2. Using Wrong Distance Metric

```python
# BAD: Using cosine distance on unnormalized vectors
# OpenAI embeddings are normalized, but others may not be

# GOOD: Normalize vectors if using cosine
import numpy as np

def normalize(vector):
    return vector / np.linalg.norm(vector)

embedding = normalize(raw_embedding)
```

### 3. Not Using Indexes

```sql
-- BAD: Sequential scan on large table (very slow)
SELECT * FROM documents ORDER BY embedding <=> $1 LIMIT 10;

-- GOOD: Create index first
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
```

### 4. Ignoring Index Build Time

```sql
-- Building index on large table blocks inserts
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Better: Build concurrently (PostgreSQL 14+)
CREATE INDEX CONCURRENTLY ON documents USING hnsw (embedding vector_cosine_ops);
```

### 5. Embedding Stale Data

```sql
-- BAD: Embeddings don't update when content changes
UPDATE documents SET content = 'New content' WHERE id = 1;
-- embedding is now stale!

-- GOOD: Update embedding when content changes
CREATE OR REPLACE FUNCTION update_embedding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.embedding = get_embedding(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doc_embedding
  BEFORE UPDATE OF content ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_embedding();
```

### 6. Not Considering Costs

```python
# BAD: Embedding every request
query_embedding = get_embedding(user_query)  # API call every time

# GOOD: Cache embeddings for repeated queries
# Use cheaper models for less critical tasks
# Batch embedding generation
```

## Best Practices

### 1. Choose the Right Database

**Use PostgreSQL + pgvector when:**
- You need ACID transactions
- Complex joins with relational data
- Existing PostgreSQL infrastructure
- Cost-conscious (open source)

**Use Native Vector DB (Pinecone, Weaviate) when:**
- Primary workload is vector search
- Need horizontal scalability
- Want managed service
- Willing to pay for convenience

### 2. Optimize Embedding Model

```python
# Development: Use smaller, faster models
model = "text-embedding-3-small"  # 1536 dims, cheaper

# Production: Evaluate trade-offs
model = "text-embedding-3-large"  # 3072 dims, better quality

# Consider dimensionality reduction
response = openai.Embedding.create(
    input=text,
    model="text-embedding-3-large",
    dimensions=768  # Reduce dimensions, save storage/compute
)
```

### 3. Index Configuration

```sql
-- Development: Smaller index for fast iteration
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 8, ef_construction = 32);

-- Production: Better recall
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- Large scale: Tune per workload
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 256);
SET hnsw.ef_search = 64;
```

### 4. Monitoring and Observability

```sql
-- Track query performance
CREATE TABLE vector_query_log (
  query_id SERIAL PRIMARY KEY,
  query_text TEXT,
  execution_time_ms FLOAT,
  results_count INT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Log slow queries
CREATE OR REPLACE FUNCTION log_vector_query(
  query TEXT,
  exec_time FLOAT,
  results INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO vector_query_log (query_text, execution_time_ms, results_count)
  VALUES (query, exec_time, results);
END;
$$ LANGUAGE plpgsql;

-- Monitor index statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';
```

### 5. Testing and Evaluation

```python
# Evaluate retrieval quality
def evaluate_retrieval(test_queries, relevance_judgments):
    """Calculate recall@k and MRR"""
    recalls = []
    mrrs = []

    for query, relevant_docs in zip(test_queries, relevance_judgments):
        results = vector_search(query, k=10)
        result_ids = [r['id'] for r in results]

        # Recall@10
        relevant_found = set(result_ids) & set(relevant_docs)
        recall = len(relevant_found) / len(relevant_docs)
        recalls.append(recall)

        # MRR (Mean Reciprocal Rank)
        for i, doc_id in enumerate(result_ids):
            if doc_id in relevant_docs:
                mrrs.append(1 / (i + 1))
                break

    return {
        'recall@10': np.mean(recalls),
        'mrr': np.mean(mrrs)
    }
```

## When to Use Vector Databases

### Good Use Cases

✅ **Semantic/similarity search** - Find content by meaning
✅ **RAG systems** - Provide context to LLMs
✅ **Recommendations** - Find similar items
✅ **Question answering** - Match questions to answers
✅ **Content deduplication** - Find near-duplicates
✅ **Image/video search** - Visual similarity
✅ **Anomaly detection** - Find outliers
✅ **Personalization** - User behavior similarity

### When NOT to Use

❌ **Exact keyword matching** - Use full-text search instead
❌ **Structured queries** - Use traditional SQL
❌ **Small datasets** - Overkill for < 10K items
❌ **Real-time updates** - Index rebuilds can be slow
❌ **When explainability is critical** - Vector similarity is a black box
❌ **When deterministic results are required** - Approximate search varies

### Hybrid Approach Often Best

```sql
-- Combine vector search with traditional queries
WITH semantic_results AS (
  SELECT id, embedding <=> $1 AS distance
  FROM documents
  ORDER BY distance
  LIMIT 100
),
keyword_results AS (
  SELECT id, ts_rank(content_tsv, query) AS rank
  FROM documents, plainto_tsquery($2) query
  WHERE content_tsv @@ query
)
SELECT
  d.*,
  COALESCE(s.distance, 1) AS semantic_distance,
  COALESCE(k.rank, 0) AS keyword_rank
FROM documents d
LEFT JOIN semantic_results s ON s.id = d.id
LEFT JOIN keyword_results k ON k.id = d.id
WHERE s.id IS NOT NULL OR k.id IS NOT NULL
ORDER BY (COALESCE(s.distance, 1) * 0.7 + (1 - COALESCE(k.rank, 0)) * 0.3)
LIMIT 20;
```

## Getting Started

### Quick Start with pgvector

```bash
# Install PostgreSQL and pgvector
sudo apt install postgresql-15-pgvector

# Or use Docker
docker run -d \
  --name postgres-vector \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  ankane/pgvector
```

```sql
-- Connect and setup
CREATE EXTENSION vector;

-- Create table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)
);

-- Create index
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Insert data (use your embedding function)
INSERT INTO documents (content, embedding)
VALUES ('Sample text', '[0.1, 0.2, ...]');

-- Query
SELECT content
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

### Quick Start with Pinecone

```python
# Install
pip install pinecone-client

# Setup
import pinecone

pinecone.init(api_key="your-api-key")
pinecone.create_index("quickstart", dimension=1536, metric="cosine")

# Use
index = pinecone.Index("quickstart")
index.upsert([("id1", [0.1, 0.2, ...], {"text": "sample"})])
results = index.query(vector=[0.1, 0.2, ...], top_k=5)
```

### Quick Start with Weaviate

```bash
# Docker
docker run -d \
  --name weaviate \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  semitechnologies/weaviate:latest
```

```python
# Install
pip install weaviate-client

# Setup
import weaviate

client = weaviate.Client("http://localhost:8080")

# Create schema and use (see Platform Guide above)
```

## See Also

- [NoSQL Databases](/concepts/nosql-databases/) - Document stores, key-value stores
- [Graph Databases](/concepts/graph-databases/) - Relationship-focused databases
- [PostgreSQL](/databases/postgresql/) - Learn more about PostgreSQL features
- [Indexes](/concepts/indexes/) - Understanding database indexes
- [Query Performance](/concepts/performance/) - General optimization techniques

## Additional Resources

### Documentation
- [pgvector GitHub](https://github.com/pgvector/pgvector) - PostgreSQL extension
- [Pinecone Docs](https://docs.pinecone.io/) - Managed vector database
- [Weaviate Docs](https://weaviate.io/developers/weaviate) - Open-source vector search
- [Qdrant Docs](https://qdrant.tech/documentation/) - High-performance vector DB
- [Milvus Docs](https://milvus.io/docs) - Cloud-native vector database

### Learning Resources
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Sentence Transformers](https://www.sbert.net/) - Open-source embedding models
- [Vector Database Benchmarks](https://benchmark.vectorview.ai/)

### Tools
- [txtai](https://github.com/neuml/txtai) - All-in-one embeddings database
- [LanceDB](https://lancedb.com/) - Open-source embedded vector database
- [Vespa](https://vespa.ai/) - Big data + vector search platform
