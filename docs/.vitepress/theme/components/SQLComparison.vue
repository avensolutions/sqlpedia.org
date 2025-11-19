<template>
  <div class="sql-comparison">
    <div class="comparison-header">
      <h3>📊 SQL Dialect Comparison</h3>
      <p class="comparison-description">
        Compare SQL syntax across different database systems
      </p>
    </div>

    <div class="dialect-selector">
      <label>Select dialects to compare:</label>
      <div class="dialect-checkboxes">
        <label
          v-for="db in availableDialects"
          :key="db.value"
          class="dialect-checkbox"
        >
          <input
            type="checkbox"
            :value="db.value"
            v-model="selectedDialects"
            :disabled="
              selectedDialects.length >= 3 &&
              !selectedDialects.includes(db.value)
            "
          />
          {{ db.label }}
        </label>
      </div>
      <p class="hint">Select up to 3 dialects to compare</p>
    </div>

    <div class="comparison-grid" v-if="selectedDialects.length > 0">
      <div
        v-for="dialect in selectedDialects"
        :key="dialect"
        class="comparison-column"
      >
        <div class="column-header">
          <h4>{{ getDialectLabel(dialect) }}</h4>
        </div>
        <div class="column-content">
          <pre><code>{{ getExample(dialect) }}</code></pre>
        </div>
        <div class="column-notes" v-if="getNotes(dialect)">
          <h5>Notes:</h5>
          <p>{{ getNotes(dialect) }}</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Select dialects above to see the comparison</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Dialect {
  label: string;
  value: string;
}

interface Example {
  [key: string]: string;
}

interface Notes {
  [key: string]: string;
}

interface Props {
  dialects?: string[];
  example?: {
    examples: Example;
    notes?: Notes;
  };
}

const props = withDefaults(defineProps<Props>(), {
  dialects: () => ["postgresql", "mysql", "sqlserver"],
});

// Available database dialects
const availableDialects: Dialect[] = [
  { label: "PostgreSQL", value: "postgresql" },
  { label: "MySQL", value: "mysql" },
  { label: "SQL Server", value: "sqlserver" },
  { label: "Oracle", value: "oracle" },
  { label: "SQLite", value: "sqlite" },
  { label: "BigQuery", value: "bigquery" },
  { label: "Snowflake", value: "snowflake" },
  { label: "DuckDB", value: "duckdb" },
];

// Selected dialects
const selectedDialects = ref<string[]>(props.dialects);

// Default example (Window Functions)
const defaultExample = {
  examples: {
    postgresql: `-- Window function with ROWS frame
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    mysql: `-- Window function (MySQL 8.0+)
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    sqlserver: `-- Window function with ROWS frame
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    oracle: `-- Window function
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    sqlite: `-- Window function (SQLite 3.25+)
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    bigquery: `-- Window function
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    snowflake: `-- Window function
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
    duckdb: `-- Window function
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
  },
  notes: {
    postgresql:
      "Full support for all window frame types. Most feature-complete implementation.",
    mysql:
      "Window functions added in MySQL 8.0. Earlier versions not supported.",
    sqlserver:
      "Supports ROWS and RANGE frames. Highly optimized for analytical queries.",
    oracle: "Pioneered window functions in SQL. Very mature implementation.",
    sqlite: "Window functions added in SQLite 3.25.0 (2018-09-15).",
    bigquery:
      "Fully supports standard SQL window functions with excellent performance.",
    snowflake:
      "Cloud-optimized window functions with automatic performance tuning.",
    duckdb:
      "Full window function support with excellent performance for analytical queries.",
  },
};

// Methods
const getDialectLabel = (value: string): string => {
  const dialect = availableDialects.find((d) => d.value === value);
  return dialect ? dialect.label : value;
};

const getExample = (dialect: string): string => {
  const exampleData = props.example || defaultExample;
  return (
    exampleData.examples[dialect] || "-- Example not available for this dialect"
  );
};

const getNotes = (dialect: string): string => {
  const exampleData = props.example || defaultExample;
  return exampleData.notes?.[dialect] || "";
};
</script>

<style scoped>
.sql-comparison {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
}

.comparison-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand-1);
}

.comparison-description {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.dialect-selector {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.dialect-selector label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.dialect-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.dialect-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: normal;
}

.dialect-checkbox:hover {
  background-color: var(--vp-c-bg-mute);
}

.dialect-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.dialect-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.85em;
  color: var(--vp-c-text-3);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.comparison-column {
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.column-header {
  background-color: var(--vp-c-brand-soft);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.column-header h4 {
  margin: 0;
  color: var(--vp-c-brand-1);
  font-size: 1em;
}

.column-content {
  padding: 1rem;
  background-color: var(--vp-c-bg-mute);
  overflow-x: auto;
}

.column-content pre {
  margin: 0;
}

.column-content code {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 0.85em;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.column-notes {
  padding: 1rem;
  background-color: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
}

.column-notes h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.column-notes p {
  margin: 0;
  font-size: 0.85em;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 768px) {
  .dialect-checkboxes {
    grid-template-columns: 1fr;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
