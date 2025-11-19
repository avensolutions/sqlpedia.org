<template>
  <div class="code-playground">
    <div class="playground-header">
      <h3>💻 SQL Code Playground</h3>
      <p class="playground-description">
        Interactive SQL editor (Coming Soon - Currently Read-Only)
      </p>
    </div>

    <div class="playground-controls">
      <div class="control-group">
        <label for="playground-dialect">Dialect:</label>
        <select
          id="playground-dialect"
          v-model="selectedDialect"
          class="select-input"
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
          <option value="duckdb">DuckDB</option>
        </select>
      </div>
    </div>

    <div class="playground-editor">
      <div class="editor-header">
        <span>SQL Query</span>
        <button @click="formatQuery" class="format-button">Format</button>
      </div>
      <textarea
        v-model="sqlQuery"
        :placeholder="placeholder"
        class="sql-editor"
        rows="10"
      ></textarea>
    </div>

    <div class="playground-actions">
      <button
        @click="runQuery"
        :disabled="!allowExecution || isRunning"
        class="run-button"
        :title="
          allowExecution
            ? 'Run query'
            : 'Query execution not available in this demo'
        "
      >
        {{ isRunning ? "Running..." : "▶ Run Query" }}
      </button>
      <button @click="clearEditor" class="clear-button">Clear</button>
    </div>

    <div v-if="sampleData" class="sample-data">
      <h4>Sample Data:</h4>
      <div class="data-preview">
        <pre><code>{{ formatSampleData() }}</code></pre>
      </div>
    </div>

    <div v-if="result" class="playground-result">
      <h4>Results:</h4>
      <div class="result-table">
        <table>
          <thead>
            <tr>
              <th v-for="col in result.columns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in result.rows" :key="idx">
              <td v-for="col in result.columns" :key="col">{{ row[col] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="result-info">
        {{ result.rows.length }} row(s) returned in {{ result.executionTime }}ms
      </div>
    </div>

    <div v-if="error" class="error-message">
      <strong>Error:</strong> {{ error }}
    </div>

    <div class="playground-footer">
      <p class="info-note">
        ℹ️ This is a demo playground. Full query execution with DuckDB WASM
        coming in future release.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  dialect?: string;
  sampleData?: any;
  allowExecution?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dialect: "postgresql",
  allowExecution: false,
});

// State
const selectedDialect = ref(props.dialect);
const sqlQuery = ref("");
const isRunning = ref(false);
const result = ref<any>(null);
const error = ref("");

const placeholder = `-- Enter your SQL query here
SELECT * FROM customers
WHERE country = 'USA'
ORDER BY customer_name
LIMIT 10;`;

// Methods
const formatQuery = () => {
  // Basic SQL formatting (placeholder for future enhancement)
  sqlQuery.value = sqlQuery.value
    .replace(/\bSELECT\b/gi, "SELECT")
    .replace(/\bFROM\b/gi, "FROM")
    .replace(/\bWHERE\b/gi, "WHERE")
    .replace(/\bORDER BY\b/gi, "ORDER BY")
    .replace(/\bGROUP BY\b/gi, "GROUP BY");
};

const runQuery = async () => {
  if (!props.allowExecution) {
    error.value =
      "Query execution is not enabled. This is a demonstration component.";
    return;
  }

  isRunning.value = true;
  error.value = "";
  result.value = null;

  try {
    // Placeholder for future DuckDB WASM integration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock result
    result.value = {
      columns: ["id", "name", "value"],
      rows: [
        { id: 1, name: "Example", value: 100 },
        { id: 2, name: "Sample", value: 200 },
      ],
      executionTime: 42,
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : "An error occurred";
  } finally {
    isRunning.value = false;
  }
};

const clearEditor = () => {
  sqlQuery.value = "";
  result.value = null;
  error.value = "";
};

const formatSampleData = () => {
  if (!props.sampleData) return "";
  return JSON.stringify(props.sampleData, null, 2);
};
</script>

<style scoped>
.code-playground {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
}

.playground-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand-1);
}

.playground-description {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.playground-controls {
  margin-bottom: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.select-input {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.playground-editor {
  margin-bottom: 1rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.format-button {
  padding: 0.25rem 0.75rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
}

.format-button:hover {
  background-color: var(--vp-c-bg-soft);
}

.sql-editor {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0 0 4px 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 0.9em;
  resize: vertical;
}

.sql-editor:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.playground-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.run-button,
.clear-button {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.run-button {
  background-color: var(--vp-c-brand-1);
  color: white;
}

.run-button:hover:not(:disabled) {
  background-color: var(--vp-c-brand-2);
}

.run-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-button {
  background-color: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.clear-button:hover {
  background-color: var(--vp-c-divider);
}

.sample-data {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}

.sample-data h4 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-2);
}

.data-preview {
  overflow-x: auto;
}

.data-preview pre {
  margin: 0;
  font-size: 0.85em;
}

.playground-result {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}

.playground-result h4 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

.result-table {
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.result-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.result-table th,
.result-table td {
  padding: 0.5rem;
  text-align: left;
  border: 1px solid var(--vp-c-divider);
}

.result-table th {
  background-color: var(--vp-c-brand-soft);
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.result-info {
  font-size: 0.85em;
  color: var(--vp-c-text-3);
}

.error-message {
  padding: 1rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  margin-bottom: 1rem;
}

.playground-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.info-note {
  margin: 0;
  font-size: 0.85em;
  color: var(--vp-c-text-3);
  font-style: italic;
}
</style>
