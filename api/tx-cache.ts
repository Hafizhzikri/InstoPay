/**
 * Vercel Serverless Function — /api/tx-cache
 *
 * GET  /api/tx-cache?chainId=5042002&company=0x...&runId=1
 *   → { txHash: "0x..." } or { txHash: null }
 *
 * POST /api/tx-cache
 *   body: { chainId, company, runId, txHash }
 *   → { ok: true }
 *
 * Storage: Upstash Redis via REST API (no SDK needed)
 * Key format: tx:{chainId}:{company_lowercase}:{runId}
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL!;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const json = await res.json() as { result: string | null };
  return json.result;
}

async function redisSet(key: string, value: string): Promise<void> {
  await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);

  if (req.method === 'GET') {
    const chainId = url.searchParams.get('chainId');
    const company = url.searchParams.get('company')?.toLowerCase();
    const runId = url.searchParams.get('runId');

    if (!chainId || !company || !runId) {
      return new Response(JSON.stringify({ error: 'Missing params' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = `tx:${chainId}:${company}:${runId}`;
    const txHash = await redisGet(key);

    return new Response(JSON.stringify({ txHash: txHash ?? null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const body = await req.json() as {
      chainId: number;
      company: string;
      runId: number;
      txHash: string;
    };

    const { chainId, company, runId, txHash } = body;

    if (!chainId || !company || !runId || !txHash) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate txHash format
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return new Response(JSON.stringify({ error: 'Invalid txHash' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = `tx:${chainId}:${company.toLowerCase()}:${runId}`;
    await redisSet(key, txHash);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
