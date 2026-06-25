// =====================================================================
// Anthropic API Proxy — safer Cloudflare Worker for Anyway ISM
// =====================================================================
//
// Compatible with the current ISM index.html:
//   fetch(proxyUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body })
//
// Recommended Cloudflare secret:
//   ANTHROPIC_API_KEY = sk-ant-...
//
// Optional Cloudflare variable:
//   ALLOWED_ORIGINS =
//     https://liliantomita-cloud.github.io,
//     http://localhost:5173,
//     http://127.0.0.1:5173
//
// If ALLOWED_ORIGINS is missing, the worker allows:
//   - https://liliantomita-cloud.github.io
//   - local development origins
//   - requests with no Origin header (useful for curl/testing)
//
// Note: Origin checks reduce casual browser abuse, but they are not full
// authentication. Also configure Cloudflare rate limiting/WAF if this URL is public.
// =====================================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://liliantomita-cloud.github.io',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8000',
];
const ALLOWED_MODELS = new Set([
  'claude-haiku-4-5',
  'claude-3-5-haiku-latest',
  'claude-3-5-haiku-20241022',
]);
const MAX_BODY_BYTES = 250_000;
const MAX_TOKENS_CAP = 3000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = allowedOrigins(env);
    const originOk = isOriginAllowed(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: originOk ? 204 : 403,
        headers: corsHeaders(originOk ? origin : '', allowed),
      });
    }

    if (!originOk) {
      return jsonError(403, 'Origin not allowed', origin, allowed);
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed. Use POST.', origin, allowed);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return jsonError(500, 'Server misconfigured: ANTHROPIC_API_KEY secret is missing.', origin, allowed);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonError(413, 'Request too large.', origin, allowed);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return jsonError(400, 'Invalid JSON body: ' + (err.message || 'parse error'), origin, allowed);
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return jsonError(400, validationError, origin, allowed);
    }

    payload.max_tokens = Math.min(Number(payload.max_tokens || 1000), MAX_TOKENS_CAP);

    try {
      const upstream = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await upstream.text();
      return new Response(responseText, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
          ...corsHeaders(origin, allowed),
        },
      });
    } catch (err) {
      return jsonError(502, 'Upstream Anthropic API call failed: ' + (err.message || 'unknown error'), origin, allowed);
    }
  },
};

function allowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || '';
  const fromEnv = raw.split(',').map(s => s.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(origin, allowed) {
  if (!origin) return true;
  if (allowed.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Request body must be a JSON object.';
  if (!payload.model || typeof payload.model !== 'string') return 'Missing model.';
  if (!ALLOWED_MODELS.has(payload.model)) return 'Model not allowed: ' + payload.model;
  if (!Array.isArray(payload.messages) || payload.messages.length === 0) return 'Missing messages array.';
  if (payload.messages.length > 4) return 'Too many messages.';
  if (payload.system && typeof payload.system !== 'string') return 'System prompt must be a string.';
  for (const msg of payload.messages) {
    if (!msg || typeof msg !== 'object') return 'Invalid message entry.';
    if (!['user', 'assistant'].includes(msg.role)) return 'Invalid message role.';
    if (typeof msg.content !== 'string') return 'Only string message content is allowed.';
  }
  return '';
}

function corsHeaders(origin, allowed) {
  const allowOrigin = origin || allowed[0] || 'https://liliantomita-cloud.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonError(status, message, origin, allowed) {
  return new Response(
    JSON.stringify({ error: { type: 'proxy_error', message } }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin || '', allowed || DEFAULT_ALLOWED_ORIGINS),
      },
    }
  );
}
