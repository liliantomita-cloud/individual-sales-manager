// =====================================================================
// ECB FX Rates Proxy — for Anyway ISM
// =====================================================================
//
// Why this exists:
//   The European Central Bank publishes daily FX rates at:
//     https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
//   But ECB doesn't send CORS headers, so browsers block direct fetches.
//   This Worker re-emits the same XML with proper CORS headers.
//
// How to deploy (5 minutes, free):
//
//   1. Go to https://dash.cloudflare.com (sign up if needed — no credit card required for free tier)
//   2. Left sidebar → Workers & Pages → Create application → Create Worker
//   3. Give it a name like "ism-ecb-proxy", click "Deploy" with the default code
//   4. After deploy, click "Edit code" — paste THIS file's contents into the editor (replace everything)
//   5. Click "Save and deploy"
//   6. Copy the URL shown at the top (e.g. https://ism-ecb-proxy.your-subdomain.workers.dev)
//   7. In ISM → click FX badge → "📡 Fetch from ECB" → paste the URL when prompted
//
// Free tier: 100,000 requests/day. ISM uses ~5/day per user = effectively unlimited.
//
// Caching: each response is cached at Cloudflare's edge for 1 hour, so ECB receives
// at most 24 requests per day no matter how many users hit the proxy.
// =====================================================================

const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const upstream = await fetch(ECB_URL, {
        cf: {
          // Cloudflare-side cache: refresh every hour
          cacheTtl: 3600,
          cacheEverything: true
        }
      });

      if (!upstream.ok) {
        return new Response('ECB upstream returned ' + upstream.status, {
          status: 502,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const xml = await upstream.text();

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'public, max-age=3600' // browsers also cache for 1h
        }
      });
    } catch (err) {
      return new Response('Proxy error: ' + (err.message || 'unknown'), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
