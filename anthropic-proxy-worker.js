// =====================================================================
// Anthropic API Proxy — for Anyway ISM
// =====================================================================
//
// Why this exists:
//   - ISM needs to call Claude (Anthropic API) to parse online ticket confirmations
//     from Wizz, FlyOne, HiSky, Ryanair, easyJet, etc.
//   - Anthropic API requires an API key. Putting the key in client-side HTML
//     would expose it to anyone visiting the site — they could spend your credits.
//   - This Worker holds the key as a secret (set via Cloudflare dashboard, never
//     in the code), accepts requests from ISM, forwards them to Anthropic, and
//     returns the response.
//
// Security model:
//   - API key is stored as a Cloudflare Worker SECRET (env.ANTHROPIC_API_KEY)
//   - Worker only accepts POST /v1/messages requests (the only endpoint ISM needs)
//   - Optional: restrict by Origin header (we leave this OFF for now — easy to add)
//
// How to deploy:
//
//   1. Go to https://dash.cloudflare.com → Workers & Pages → Create application → Create Worker
//   2. Name it "ism-ai-proxy" (or any name you like), click "Deploy" with default code
//   3. After deploy → click "Edit code" → paste THIS file's contents (replace everything)
//   4. Click "Save and deploy"
//   5. Go back to Worker overview → Settings → Variables and Secrets
//   6. Click "Add" → type "Secret" → name: ANTHROPIC_API_KEY → value: your sk-ant-... key
//   7. Click "Deploy" to apply the secret
//   8. Copy the Worker URL (e.g. https://ism-ai-proxy.your-subdomain.workers.dev)
//   9. In ISM (next batch), paste this URL when prompted
//
// Cost: Anthropic charges per request. Typical Wizz parse ≈ $0.003 (3/10 of a cent).
// 200 parses/month ≈ $0.60. Cloudflare Worker free tier covers 100,000 requests/day.
// =====================================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed. Use POST /v1/messages.');
    }

    // Sanity check: API key is configured
    if (!env.ANTHROPIC_API_KEY) {
      return jsonError(500, 'Server misconfigured: ANTHROPIC_API_KEY secret is missing. Set it in Cloudflare → Worker → Settings → Variables and Secrets.');
    }

    // Parse the body (we expect Anthropic /v1/messages format)
    let body;
    try {
      body = await request.text();
      if (!body) throw new Error('empty body');
      // Validate it's JSON
      JSON.parse(body);
    } catch (e) {
      return jsonError(400, 'Invalid JSON body: ' + e.message);
    }

    // Forward to Anthropic
    try {
      const upstream = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: body
      });

      const responseText = await upstream.text();

      return new Response(responseText, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      });
    } catch (err) {
      return jsonError(502, 'Upstream Anthropic API call failed: ' + (err.message || 'unknown error'));
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonError(status, message) {
  return new Response(
    JSON.stringify({ error: { type: 'proxy_error', message } }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders()
      }
    }
  );
}
