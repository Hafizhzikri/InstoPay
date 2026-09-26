/**
 * InstoPay backend server
 * Handles Circle User-Controlled Wallet API calls
 * API key stays server-side — never exposed to the browser
 */
import { createServer } from 'http';
import { initiateUserControlledWalletsClient, Blockchain } from '@circle-fin/user-controlled-wallets';

const PORT = 3001;
const apiKey = process.env.CIRCLE_API_KEY ?? '';

if (!apiKey) {
  console.error('[server] CIRCLE_API_KEY is not set in .env');
  process.exit(1);
}

const circle = initiateUserControlledWalletsClient({ apiKey });

// ── helpers ──────────────────────────────────────────────────────────────────
function json(res: ReturnType<typeof createServer>['listeners'] extends never[] ? never : Parameters<Parameters<typeof createServer>[0]>[1], status: number, data: unknown) {
  (res as import('http').ServerResponse).writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  (res as import('http').ServerResponse).end(JSON.stringify(data));
}

async function readBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c: Buffer) => { raw += c.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// ── server ───────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    (res as import('http').ServerResponse).writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    (res as import('http').ServerResponse).end();
    return;
  }

  const url = req.url ?? '';
  const r = res as import('http').ServerResponse;

  try {
    // POST /api/wallet/device-token  — exchange deviceId for deviceToken
    if (url === '/api/wallet/device-token' && req.method === 'POST') {
      const body = await readBody(req) as { deviceId: string };
      const resp = await circle.createDeviceTokenForSocialLogin({ deviceId: body.deviceId });
      json(r, 200, resp.data);
      return;
    }

    // POST /api/wallet/token  — create userToken for PIN flow
    if (url === '/api/wallet/token' && req.method === 'POST') {
      const body = await readBody(req) as { userId: string };
      try {
        const resp = await circle.createUserToken({ userId: body.userId });
        json(r, 200, resp.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { code?: number; message?: string } } };
        json(r, 500, { error: e?.response?.data?.message ?? 'Token creation failed', code: e?.response?.data?.code });
      }
      return;
    }

    // POST /api/wallet/device-token-pin  — create device token for PIN flow
    if (url === '/api/wallet/device-token-pin' && req.method === 'POST') {
      const body = await readBody(req) as { userId: string };
      const resp = await circle.createDeviceToken({ userId: body.userId });
      json(r, 200, resp.data);
      return;
    }

    // POST /api/wallet/initialize  — init user & create wallet challenge
    if (url === '/api/wallet/initialize' && req.method === 'POST') {
      const body = await readBody(req) as { userToken: string; blockchain?: string };
      const blockchain = (body.blockchain === 'ARC-MAINNET' ? 'ARC-MAINNET' : 'ARC-TESTNET') as Blockchain;
      try {
        const resp = await circle.createUserPinWithWallets({
          userToken: body.userToken,
          blockchains: [blockchain],
          accountType: 'EOA',
        });
        json(r, 200, resp.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { code?: number; message?: string }; status?: number } };
        const code = e?.response?.data?.code;
        if (code === 155106) {
          // User already initialized — return existing wallets
          const wallets = await circle.listWallets({ userToken: body.userToken });
          json(r, 200, { code: 155106, wallets: wallets.data?.wallets ?? [] });
        } else {
          json(r, 500, { error: e?.response?.data?.message ?? 'Initialize failed', code });
        }
      }
      return;
    }

    // POST /api/wallet/list  — list wallets for userToken
    if (url === '/api/wallet/list' && req.method === 'POST') {
      const body = await readBody(req) as { userToken: string };
      const resp = await circle.listWallets({ userToken: body.userToken });
      json(r, 200, { wallets: resp.data?.wallets ?? [] });
      return;
    }

    // POST /api/wallet/balance  — get USDC balance
    if (url === '/api/wallet/balance' && req.method === 'POST') {
      const body = await readBody(req) as { walletId: string; userToken: string };
      const resp = await circle.getWalletTokenBalance({ walletId: body.walletId, userToken: body.userToken });
      json(r, 200, { tokenBalances: resp.data?.tokenBalances ?? [] });
      return;
    }

    // POST /api/wallet/execute  — create contract execution challenge
    if (url === '/api/wallet/execute' && req.method === 'POST') {
      const body = await readBody(req) as {
        userToken: string;
        walletId: string;
        contractAddress: string;
        abiFunctionSignature: string;
        abiParameters: string[];
        amount?: string;
      };
      const resp = await circle.createContractExecutionTransaction({
        userToken: body.userToken,
        walletId: body.walletId,
        contractAddress: body.contractAddress,
        abiFunctionSignature: body.abiFunctionSignature,
        abiParameters: body.abiParameters,
        ...(body.amount ? { amount: body.amount } : {}),
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      });
      json(r, 200, resp.data);
      return;
    }

    // POST /api/wallet/transfer  — create USDC transfer challenge (approve/transfer)
    if (url === '/api/wallet/transfer' && req.method === 'POST') {
      const body = await readBody(req) as {
        userToken: string;
        walletId: string;
        destinationAddress: string;
        amount: string;
        tokenId?: string;
      };
      const resp = await circle.createTransaction({
        userToken: body.userToken,
        walletId: body.walletId,
        destinationAddress: body.destinationAddress,
        amounts: [body.amount],
        tokenId: body.tokenId ?? '',
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      });
      json(r, 200, resp.data);
      return;
    }

    // POST /api/wallet/tx-status  — poll transaction status
    if (url === '/api/wallet/tx-status' && req.method === 'POST') {
      const body = await readBody(req) as { userToken: string; id: string };
      const resp = await circle.getTransaction({ userToken: body.userToken, id: body.id });
      json(r, 200, resp.data);
      return;
    }

    json(r, 404, { error: 'Not found' });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[server] Error:', e.message);
    json(r, 500, { error: e.message ?? 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`[InstoPay server] Running on http://localhost:${PORT}`);
});
