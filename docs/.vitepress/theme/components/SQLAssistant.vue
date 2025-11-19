<template>
  <div class="sql-assistant">
    <div class="assistant-header">
      <h3>🤖 SQL AI Assistant</h3>
      <p class="assistant-description">
        Generate, explain, optimize, or translate SQL queries using AI
      </p>
    </div>

    <div class="assistant-controls">
      <div class="control-row">
        <div class="control-group">
          <label for="task-mode">Task:</label>
          <select id="task-mode" v-model="taskMode" class="select-input">
            <option value="generate">Generate SQL</option>
            <option value="explain">Explain Query</option>
            <option value="optimize">Optimize Query</option>
            <option value="translate">Translate Dialect</option>
          </select>
        </div>

        <div class="control-group" v-if="taskMode === 'translate'">
          <label for="source-dialect">From:</label>
          <select
            id="source-dialect"
            v-model="sourceDialect"
            class="select-input"
          >
            <option v-for="db in databases" :key="db.value" :value="db.value">
              {{ db.label }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label for="target-dialect">
            {{ taskMode === "translate" ? "To:" : "Dialect:" }}
          </label>
          <select
            id="target-dialect"
            v-model="targetDialect"
            class="select-input"
          >
            <option v-for="db in databases" :key="db.value" :value="db.value">
              {{ db.label }}
            </option>
          </select>
        </div>

        <div class="control-group" v-if="showModelSelector">
          <label for="ai-model">Model:</label>
          <select id="ai-model" v-model="selectedModel" class="select-input">
            <option value="gpt-4">GPT-4 (Best)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 (Fast)</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="llama-3-8b">Llama 3 8B (Self-hosted)</option>
            <option value="codellama-7b">CodeLlama 7B (Self-hosted)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="assistant-input">
      <label for="user-prompt">
        {{ getPromptLabel() }}
      </label>
      <textarea
        id="user-prompt"
        v-model="userPrompt"
        :placeholder="getPlaceholder()"
        rows="4"
        class="prompt-textarea"
      ></textarea>

      <div class="context-input" v-if="taskMode === 'generate'">
        <label for="context-info">Context (optional):</label>
        <input
          id="context-info"
          v-model="contextInfo"
          type="text"
          placeholder="e.g., E-commerce database with customers, orders, products tables"
          class="text-input"
        />
      </div>
    </div>

    <div class="assistant-actions">
      <button
        @click="submitRequest"
        :disabled="isLoading || !userPrompt"
        class="submit-button"
      >
        {{ isLoading ? "Processing..." : "Submit" }}
      </button>
      <button v-if="result" @click="clearResult" class="clear-button">
        Clear
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="result" class="assistant-result">
      <div class="result-header">
        <h4>Result:</h4>
        <button @click="copyToClipboard" class="copy-button">
          {{ copied ? "✓ Copied" : "📋 Copy" }}
        </button>
      </div>

      <div class="result-content">
        <pre><code>{{ result }}</code></pre>
      </div>

      <div v-if="explanation" class="result-explanation">
        <h4>Explanation:</h4>
        <p>{{ explanation }}</p>
      </div>

      <div class="result-meta">
        <span class="meta-item">Model: {{ modelUsed }}</span>
        <span class="meta-item" v-if="cached">🚀 Cached response</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  mode?: "generate" | "explain" | "optimize" | "translate";
  defaultDialect?: string;
  showModelSelector?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "generate",
  defaultDialect: "postgresql",
  showModelSelector: true,
});

// State
const taskMode = ref(props.mode);
const sourceDialect = ref("mysql");
const targetDialect = ref(props.defaultDialect);
const selectedModel = ref("gpt-4");
const userPrompt = ref("");
const contextInfo = ref("");
const isLoading = ref(false);
const result = ref("");
const explanation = ref("");
const error = ref("");
const copied = ref(false);
const modelUsed = ref("");
const cached = ref(false);

// Database options
const databases = [
  { label: "PostgreSQL", value: "postgresql" },
  { label: "MySQL", value: "mysql" },
  { label: "SQL Server", value: "sqlserver" },
  { label: "Oracle", value: "oracle" },
  { label: "SQLite", value: "sqlite" },
  { label: "Spark SQL", value: "spark-sql" },
  { label: "Snowflake", value: "snowflake" },
  { label: "Databricks", value: "databricks" },
  { label: "BigQuery", value: "bigquery" },
  { label: "DuckDB", value: "duckdb" },
];

// Methods
const getPromptLabel = () => {
  switch (taskMode.value) {
    case "generate":
      return "Describe what you want the SQL query to do:";
    case "explain":
      return "Paste your SQL query to explain:";
    case "optimize":
      return "Paste your SQL query to optimize:";
    case "translate":
      return "Paste your SQL query to translate:";
    default:
      return "Enter your request:";
  }
};

const getPlaceholder = () => {
  switch (taskMode.value) {
    case "generate":
      return "e.g., Get top 10 customers by total order value in the last month";
    case "explain":
      return "Paste your SQL query here...";
    case "optimize":
      return "Paste your SQL query here...";
    case "translate":
      return "Paste your SQL query here...";
    default:
      return "Enter your request...";
  }
};

const submitRequest = async () => {
  if (!userPrompt.value.trim()) return;

  isLoading.value = true;
  error.value = "";
  result.value = "";
  explanation.value = "";
  cached.value = false;

  try {
    const response = await fetch("/.netlify/functions/sql-assist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userPrompt.value,
        task: taskMode.value,
        model: selectedModel.value,
        source_dialect: sourceDialect.value,
        target_dialect: targetDialect.value,
        context: contextInfo.value,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    const data = await response.json();
    result.value = data.result;
    explanation.value = data.explanation || "";
    modelUsed.value = data.model_used || selectedModel.value;
    cached.value = data.cached || false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "An error occurred";
  } finally {
    isLoading.value = false;
  }
};

const clearResult = () => {
  result.value = "";
  explanation.value = "";
  error.value = "";
  userPrompt.value = "";
  contextInfo.value = "";
  copied.value = false;
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
</script>

<style scoped>
.sql-assistant {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
}

.assistant-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand-1);
}

.assistant-description {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.assistant-controls {
  margin-bottom: 1rem;
}

.control-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 150px;
}

.control-group label {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.select-input,
.text-input {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9em;
}

.select-input:focus,
.text-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.assistant-input {
  margin-bottom: 1rem;
}

.assistant-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.prompt-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 0.9em;
  resize: vertical;
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.context-input {
  margin-top: 0.75rem;
}

.context-input label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.85em;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.assistant-actions {
  display: flex;
  gap: 0.5rem;
}

.submit-button,
.clear-button {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button {
  background-color: var(--vp-c-brand-1);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--vp-c-brand-2);
}

.submit-button:disabled {
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

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
}

.assistant-result {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.copy-button {
  padding: 0.25rem 0.75rem;
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s;
}

.copy-button:hover {
  background-color: var(--vp-c-divider);
}

.result-content {
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
}

.result-content pre {
  margin: 0;
}

.result-content code {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 0.9em;
  color: var(--vp-c-text-1);
}

.result-explanation {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--vp-c-brand-soft);
  border-radius: 4px;
}

.result-explanation h4 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand-1);
}

.result-explanation p {
  margin: 0;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.result-meta {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  font-size: 0.85em;
  color: var(--vp-c-text-3);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

@media (max-width: 768px) {
  .control-row {
    flex-direction: column;
  }

  .control-group {
    min-width: 100%;
  }
}
</style>
