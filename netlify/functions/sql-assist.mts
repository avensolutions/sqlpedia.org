import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Rate limiting using simple in-memory store (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cache for responses (for production, use better caching like Netlify Blobs or Redis)
const responseCache = new Map<string, { result: string; explanation?: string; timestamp: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface SQLAssistRequest {
  prompt: string;
  task: 'generate' | 'explain' | 'optimize' | 'translate';
  model: string;
  source_dialect?: string;
  target_dialect: string;
  context?: string;
}

interface SQLAssistResponse {
  result: string;
  explanation?: string;
  model_used: string;
  cached: boolean;
}

// Get client IP for rate limiting
function getClientIP(event: HandlerEvent): string {
  return event.headers['x-forwarded-for']?.split(',')[0] ||
         event.headers['client-ip'] ||
         'unknown';
}

// Check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Generate cache key
function getCacheKey(request: SQLAssistRequest): string {
  const key = JSON.stringify({
    prompt: request.prompt,
    task: request.task,
    source_dialect: request.source_dialect,
    target_dialect: request.target_dialect,
  });
  return Buffer.from(key).toString('base64');
}

// Check cache
function checkCache(cacheKey: string): { result: string; explanation?: string } | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { result: cached.result, explanation: cached.explanation };
  }
  return null;
}

// Save to cache
function saveToCache(cacheKey: string, result: string, explanation?: string): void {
  responseCache.set(cacheKey, {
    result,
    explanation,
    timestamp: Date.now()
  });
}

// Call AI provider (OpenAI, Anthropic, or self-hosted)
async function callAIProvider(request: SQLAssistRequest): Promise<{ result: string; explanation?: string }> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback to mock response for demo purposes
    return generateMockResponse(request);
  }

  // Build the prompt based on task type
  const systemPrompt = buildSystemPrompt(request.task);
  const userPrompt = buildUserPrompt(request);

  try {
    // Example using OpenAI (adapt for other providers)
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: request.model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Parse response to extract SQL and explanation
      return parseAIResponse(aiResponse, request.task);
    }

    // For Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
          ]
        })
      });

      const data = await response.json();
      const aiResponse = data.content[0].text;

      return parseAIResponse(aiResponse, request.task);
    }

  } catch (error) {
    console.error('AI API Error:', error);
    return generateMockResponse(request);
  }

  return generateMockResponse(request);
}

// Build system prompt based on task
function buildSystemPrompt(task: string): string {
  const prompts = {
    generate: 'You are an expert SQL developer. Generate SQL queries based on user requirements. Output only the SQL query without any markdown formatting or explanations unless asked.',
    explain: 'You are an expert SQL educator. Explain SQL queries in clear, concise language. Break down complex queries into understandable parts.',
    optimize: 'You are an expert SQL performance tuner. Analyze SQL queries and suggest optimizations. Provide the optimized query and explain the improvements.',
    translate: 'You are an expert in SQL dialects. Translate SQL queries accurately between different database systems, accounting for syntax differences and dialect-specific features.'
  };
  return prompts[task as keyof typeof prompts] || prompts.generate;
}

// Build user prompt
function buildUserPrompt(request: SQLAssistRequest): string {
  const { task, prompt, source_dialect, target_dialect, context } = request;

  let userPrompt = '';

  switch (task) {
    case 'generate':
      userPrompt = `Generate a ${target_dialect} SQL query for the following requirement:\n\n${prompt}`;
      if (context) {
        userPrompt += `\n\nContext: ${context}`;
      }
      userPrompt += '\n\nProvide the SQL query and a brief explanation.';
      break;

    case 'explain':
      userPrompt = `Explain this ${target_dialect} SQL query:\n\n${prompt}\n\nProvide a clear explanation of what this query does.`;
      break;

    case 'optimize':
      userPrompt = `Optimize this ${target_dialect} SQL query:\n\n${prompt}\n\nProvide the optimized query and explain the improvements.`;
      break;

    case 'translate':
      userPrompt = `Translate this SQL query from ${source_dialect} to ${target_dialect}:\n\n${prompt}\n\nProvide the translated query and note any important differences.`;
      break;
  }

  return userPrompt;
}

// Parse AI response
function parseAIResponse(response: string, task: string): { result: string; explanation?: string } {
  // Try to extract SQL code block
  const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/);

  if (sqlMatch) {
    const result = sqlMatch[1].trim();
    const explanation = response.replace(/```sql\n[\s\S]*?\n```/, '').trim();
    return { result, explanation: explanation || undefined };
  }

  // If no code block, return the whole response as result for explain tasks
  if (task === 'explain') {
    return { result: '', explanation: response.trim() };
  }

  // Otherwise, try to extract SQL from the response
  return { result: response.trim() };
}

// Generate mock response for demo/development
function generateMockResponse(request: SQLAssistRequest): { result: string; explanation?: string } {
  const { task, target_dialect } = request;

  const mockResponses = {
    generate: {
      result: `-- Generated ${target_dialect} query\nSELECT \n  c.customer_id,\n  c.customer_name,\n  SUM(o.total_amount) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.customer_name\nORDER BY total_spent DESC\nLIMIT 10;`,
      explanation: 'This query retrieves the top 10 customers by total spending. It joins the customers and orders tables, aggregates the order totals, and sorts by the total amount.'
    },
    explain: {
      result: '',
      explanation: 'This query performs the following operations:\n1. Joins the customers and orders tables\n2. Groups results by customer\n3. Calculates the sum of order totals for each customer\n4. Sorts by total spending in descending order\n5. Limits output to top 10 customers'
    },
    optimize: {
      result: `-- Optimized ${target_dialect} query\nSELECT \n  c.customer_id,\n  c.customer_name,\n  COALESCE(SUM(o.total_amount), 0) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nWHERE c.status = 'active'\nGROUP BY c.customer_id, c.customer_name\nHAVING SUM(o.total_amount) > 0\nORDER BY total_spent DESC\nLIMIT 10;`,
      explanation: 'Optimizations applied:\n1. Added COALESCE to handle NULL values\n2. Added WHERE clause to filter inactive customers early\n3. Added HAVING clause to exclude customers with no orders\n4. Consider adding indexes on customer_id and status columns'
    },
    translate: {
      result: `-- Translated to ${target_dialect}\nSELECT \n  c.customer_id,\n  c.customer_name,\n  SUM(o.total_amount) as total_spent\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.customer_name\nORDER BY total_spent DESC\nLIMIT 10;`,
      explanation: `Translated from ${request.source_dialect} to ${target_dialect}. Note: Most SQL is standard, but watch for dialect-specific functions like date handling, string concatenation, or JSON operations.`
    }
  };

  return mockResponses[task as keyof typeof mockResponses] || mockResponses.generate;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(event);
    if (!checkRateLimit(clientIP)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a minute.'
        })
      };
    }

    // Parse request
    const request: SQLAssistRequest = JSON.parse(event.body || '{}');

    // Validate request
    if (!request.prompt || !request.task || !request.target_dialect) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: prompt, task, and target_dialect'
        })
      };
    }

    // Check cache
    const cacheKey = getCacheKey(request);
    const cachedResponse = checkCache(cacheKey);

    if (cachedResponse) {
      const response: SQLAssistResponse = {
        ...cachedResponse,
        model_used: request.model,
        cached: true
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    }

    // Call AI provider
    const aiResponse = await callAIProvider(request);

    // Save to cache
    saveToCache(cacheKey, aiResponse.result, aiResponse.explanation);

    // Build response
    const response: SQLAssistResponse = {
      result: aiResponse.result,
      explanation: aiResponse.explanation,
      model_used: request.model,
      cached: false
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
