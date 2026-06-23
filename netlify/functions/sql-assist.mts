import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// ============================================================================
// Configuration (all overridable via Netlify environment variables)
// ============================================================================

// Gemini is the only provider. The model is forced here and the client's
// requested model is ignored, so nobody can select a model off the free tier.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// Origins allowed to call this endpoint. Locked to the public site by default.
// Add http://localhost:5173 here (or via env) for local development.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "https://sqlpedia.org,https://www.sqlpedia.org,https://sqlpedia.com,https://www.sqlpedia.com,https://sqlpedia.net,https://www.sqlpedia.net"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Soft daily budget used only for alerting. This is NOT a billing cap - the
// real cost ceiling is the no-billing Gemini key, which simply 429s when the
// Google-side quota is exhausted. Set this near the free-tier requests/day.
const DAILY_REQUEST_LIMIT = Number(process.env.DAILY_REQUEST_LIMIT || "1000");
const ALERT_THRESHOLD_PCT = Number(process.env.ALERT_THRESHOLD_PCT || "80");

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_OUTPUT_TOKENS = 600;

interface SQLAssistRequest {
  prompt: string;
  task: "generate" | "explain" | "optimize" | "translate";
  model?: string; // ignored - model is forced server-side
  source_dialect?: string;
  target_dialect: string;
  context?: string;
  turnstile_token?: string;
}

interface SQLAssistResponse {
  result: string;
  explanation?: string;
  model_used: string;
  cached: boolean;
  degraded?: boolean;
  notice?: string;
}

// ============================================================================
// Persistence helpers (Netlify Blobs - survives across function instances,
// unlike an in-memory Map which resets on every cold start)
// ============================================================================

const today = () => new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD

function usageStore() {
  return getStore("ai-usage");
}
function cacheStore() {
  return getStore("ai-cache");
}

async function getDailyCount(): Promise<number> {
  try {
    const raw = await usageStore().get(`count:${today()}`);
    return Number(raw || 0);
  } catch {
    return 0;
  }
}

async function bumpDailyCount(): Promise<number> {
  try {
    const store = usageStore();
    const key = `count:${today()}`;
    const next = (Number((await store.get(key)) || 0)) + 1;
    await store.set(key, String(next));
    return next;
  } catch {
    return 0;
  }
}

// Send a Slack alert at most once per day per kind.
async function alertOnce(kind: "soft" | "exceeded", text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    const store = usageStore();
    const flagKey = `alerted:${today()}:${kind}`;
    if (await store.get(flagKey)) return; // already alerted today
    await store.set(flagKey, "1");
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error("Slack alert failed:", e);
  }
}

// Evaluate thresholds after a successful call and alert if needed.
async function checkThresholds(count: number): Promise<void> {
  const softAt = Math.floor((DAILY_REQUEST_LIMIT * ALERT_THRESHOLD_PCT) / 100);
  if (count >= DAILY_REQUEST_LIMIT) {
    await alertOnce(
      "exceeded",
      `:rotating_light: SQLpedia AI: soft daily limit reached (${count}/${DAILY_REQUEST_LIMIT} Gemini requests). Serving fallback responses for the rest of the day.`
    );
  } else if (count >= softAt) {
    await alertOnce(
      "soft",
      `:warning: SQLpedia AI: ${count}/${DAILY_REQUEST_LIMIT} Gemini requests today (>=${ALERT_THRESHOLD_PCT}% of the daily budget).`
    );
  }
}

// ============================================================================
// Caching
// ============================================================================

function getCacheKey(request: SQLAssistRequest): string {
  const key = JSON.stringify({
    prompt: request.prompt,
    task: request.task,
    source_dialect: request.source_dialect,
    target_dialect: request.target_dialect,
  });
  return Buffer.from(key).toString("base64url");
}

async function checkCache(
  cacheKey: string
): Promise<{ result: string; explanation?: string } | null> {
  try {
    const cached = await cacheStore().get(cacheKey, { type: "json" });
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { result: cached.result, explanation: cached.explanation };
    }
  } catch {
    // ignore cache read failures
  }
  return null;
}

async function saveToCache(
  cacheKey: string,
  result: string,
  explanation?: string
): Promise<void> {
  try {
    await cacheStore().setJSON(cacheKey, {
      result,
      explanation,
      timestamp: Date.now(),
    });
  } catch {
    // ignore cache write failures
  }
}

// ============================================================================
// Cloudflare Turnstile verification
// ============================================================================

// Returns true if the human-check passes (or if Turnstile is not configured,
// e.g. local dev without a secret key).
async function verifyTurnstile(
  token: string | undefined,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured -> skip (dev)
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      }
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile verification error:", e);
    return false;
  }
}

// ============================================================================
// Gemini provider
// ============================================================================

class QuotaExceededError extends Error {}

async function callGemini(
  request: SQLAssistRequest
): Promise<{ result: string; explanation?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // No key configured -> demo/mock mode
    return generateMockResponse(request);
  }

  const systemPrompt = buildSystemPrompt(request.task);
  const userPrompt = buildUserPrompt(request);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    }),
  });

  // 429 (Too Many Requests) / 403 RESOURCE_EXHAUSTED -> free-tier quota hit
  if (response.status === 429 || response.status === 403) {
    throw new QuotaExceededError(`Gemini quota response: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return parseAIResponse(text, request.task);
}

// ============================================================================
// Prompt building / parsing (provider-agnostic)
// ============================================================================

function buildSystemPrompt(task: string): string {
  const prompts: Record<string, string> = {
    generate:
      "You are an expert SQL developer. Generate SQL queries based on user requirements. Return the SQL query in a ```sql code block followed by a brief explanation.",
    explain:
      "You are an expert SQL educator. Explain SQL queries in clear, concise language. Break down complex queries into understandable parts.",
    optimize:
      "You are an expert SQL performance tuner. Analyze SQL queries and suggest optimizations. Return the optimized query in a ```sql code block and explain the improvements.",
    translate:
      "You are an expert in SQL dialects. Translate SQL queries accurately between database systems, accounting for syntax differences. Return the translated query in a ```sql code block and note important differences.",
  };
  return prompts[task] || prompts.generate;
}

function buildUserPrompt(request: SQLAssistRequest): string {
  const { task, prompt, source_dialect, target_dialect, context } = request;

  switch (task) {
    case "generate": {
      let p = `Generate a ${target_dialect} SQL query for the following requirement:\n\n${prompt}`;
      if (context) p += `\n\nContext: ${context}`;
      return p + "\n\nProvide the SQL query and a brief explanation.";
    }
    case "explain":
      return `Explain this ${target_dialect} SQL query:\n\n${prompt}\n\nProvide a clear explanation of what this query does.`;
    case "optimize":
      return `Optimize this ${target_dialect} SQL query:\n\n${prompt}\n\nProvide the optimized query and explain the improvements.`;
    case "translate":
      return `Translate this SQL query from ${source_dialect} to ${target_dialect}:\n\n${prompt}\n\nProvide the translated query and note any important differences.`;
    default:
      return prompt;
  }
}

function parseAIResponse(
  response: string,
  task: string
): { result: string; explanation?: string } {
  const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/);
  if (sqlMatch) {
    const result = sqlMatch[1].trim();
    const explanation = response.replace(/```sql\n[\s\S]*?\n```/, "").trim();
    return { result, explanation: explanation || undefined };
  }
  if (task === "explain") {
    return { result: "", explanation: response.trim() };
  }
  return { result: response.trim() };
}

function generateMockResponse(request: SQLAssistRequest): {
  result: string;
  explanation?: string;
} {
  const { task, target_dialect } = request;
  const mockResponses: Record<string, { result: string; explanation: string }> = {
    generate: {
      result: `-- Generated ${target_dialect} query\nSELECT \n  c.customer_id,\n  c.customer_name,\n  SUM(o.total_amount) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.customer_name\nORDER BY total_spent DESC\nLIMIT 10;`,
      explanation:
        "This query retrieves the top 10 customers by total spending. It joins the customers and orders tables, aggregates the order totals, and sorts by the total amount.",
    },
    explain: {
      result: "",
      explanation:
        "This query performs the following operations:\n1. Joins the customers and orders tables\n2. Groups results by customer\n3. Calculates the sum of order totals for each customer\n4. Sorts by total spending in descending order\n5. Limits output to top 10 customers",
    },
    optimize: {
      result: `-- Optimized ${target_dialect} query\nSELECT \n  c.customer_id,\n  c.customer_name,\n  COALESCE(SUM(o.total_amount), 0) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nWHERE c.status = 'active'\nGROUP BY c.customer_id, c.customer_name\nHAVING SUM(o.total_amount) > 0\nORDER BY total_spent DESC\nLIMIT 10;`,
      explanation:
        "Optimizations applied:\n1. Added COALESCE to handle NULL values\n2. Added WHERE clause to filter inactive customers early\n3. Added HAVING clause to exclude customers with no orders\n4. Consider adding indexes on customer_id and status columns",
    },
    translate: {
      result: `-- Translated to ${target_dialect}\nSELECT \n  c.customer_id,\n  c.customer_name,\n  SUM(o.total_amount) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.customer_name\nORDER BY total_spent DESC\nLIMIT 10;`,
      explanation: `Translated from ${request.source_dialect} to ${target_dialect}. Note: Most SQL is standard, but watch for dialect-specific functions like date handling, string concatenation, or JSON operations.`,
    },
  };
  return mockResponses[task] || mockResponses.generate;
}

// ============================================================================
// HTTP handler
// ============================================================================

function getClientIP(event: HandlerEvent): string {
  return (
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["client-ip"] ||
    "unknown"
  );
}

function corsHeaders(origin: string | undefined): Record<string, string> {
  // Only echo back an origin we explicitly allow.
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

const DEGRADED_NOTICE =
  "The AI assistant has reached its daily free-tier limit. Showing a sample response instead - please try again tomorrow.";

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  const origin = event.headers.origin;
  const headers = corsHeaders(origin);

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Reject browser calls from origins we do not recognise. (Server-to-server
  // callers send no Origin header; those are stopped by Turnstile below.)
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Origin not allowed" }),
    };
  }

  try {
    const request: SQLAssistRequest = JSON.parse(event.body || "{}");

    // Human check
    const ip = getClientIP(event);
    const human = await verifyTurnstile(request.turnstile_token, ip);
    if (!human) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Human verification failed. Please try again." }),
      };
    }

    // Validate
    if (!request.prompt || !request.task || !request.target_dialect) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields: prompt, task, and target_dialect",
        }),
      };
    }

    // Cache hit -> free, no quota used
    const cacheKey = getCacheKey(request);
    const cachedResponse = await checkCache(cacheKey);
    if (cachedResponse) {
      const response: SQLAssistResponse = {
        ...cachedResponse,
        model_used: GEMINI_MODEL,
        cached: true,
      };
      return { statusCode: 200, headers, body: JSON.stringify(response) };
    }

    // If we have already blown through the soft daily budget, do not call the
    // API at all - serve a graceful fallback so the page never looks broken.
    if (DAILY_REQUEST_LIMIT > 0 && (await getDailyCount()) >= DAILY_REQUEST_LIMIT) {
      await checkThresholds(await getDailyCount());
      const mock = generateMockResponse(request);
      const response: SQLAssistResponse = {
        ...mock,
        model_used: GEMINI_MODEL,
        cached: false,
        degraded: true,
        notice: DEGRADED_NOTICE,
      };
      return { statusCode: 200, headers, body: JSON.stringify(response) };
    }

    // Call Gemini
    let aiResponse: { result: string; explanation?: string };
    try {
      aiResponse = await callGemini(request);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        // Google-side quota is exhausted - alert and degrade gracefully.
        await alertOnce(
          "exceeded",
          `:rotating_light: SQLpedia AI: Gemini returned a quota error (free-tier requests/day exhausted). Serving fallback responses.`
        );
        const mock = generateMockResponse(request);
        const response: SQLAssistResponse = {
          ...mock,
          model_used: GEMINI_MODEL,
          cached: false,
          degraded: true,
          notice: DEGRADED_NOTICE,
        };
        return { statusCode: 200, headers, body: JSON.stringify(response) };
      }
      throw err;
    }

    // Successful real call: count it, alert on thresholds, cache the result.
    const count = await bumpDailyCount();
    await checkThresholds(count);
    await saveToCache(cacheKey, aiResponse.result, aiResponse.explanation);

    const response: SQLAssistResponse = {
      result: aiResponse.result,
      explanation: aiResponse.explanation,
      model_used: GEMINI_MODEL,
      cached: false,
    };
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
