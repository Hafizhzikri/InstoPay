import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  CalendarDays,
  DollarSign,
  Users,
} from 'lucide-react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { formatUnits, parseAbiItem } from 'viem';
import { useRunCount } from '../hooks/usePayrollContract';
import { PAYROLLOS_ABI, USDC_DECIMALS, getChainConfig } from '../contract';
import { useChain } from '../hooks/useChain';
import { buildTxExplorerUrl } from '@/onchain-facts';
import { useEffect, useState } from 'react';

interface RunData {
  runId: bigint;
  period: string;
  totalAmount: bigint;
  employeeCount: bigint;
  timestamp: bigint;
}

// Mainnet contract emits PayrollExecuted; testnet contract emits PayrollRun
// We try PayrollExecuted first, then fallback to PayrollRun
const PAYROLL_EXECUTED_EVENT = parseAbiItem(
  'event PayrollExecuted(address indexed company, uint256 indexed runId, string period, uint256 totalAmount, uint256 employeeCount)'
);
const PAYROLL_RUN_EVENT = parseAbiItem(
  'event PayrollRun(address indexed company, uint256 indexed runId, string period, uint256 totalAmount, uint256 employeeCount, uint256 timestamp)'
);

/**
 * Returns the tx hash for a specific payroll run.
 * Priority:
 *   1. localStorage — instant, no RPC (written by RunPayroll on success)
 *   2. Scan getLogs backwards in 500-block chunks from current head.
 *      Arc Testnet RPC rejects ranges > 10 000 blocks, so we never ask for more.
 */
function usePayrollRunTxHash(company: `0x${string}`, runId: bigint, chainId: number) {
  const publicClient = usePublicClient({ chainId });
  const { payrollosAddress, isMainnet } = getChainConfig(chainId);

  // Use chain+company+runId as cache key so mainnet/testnet don't collide
  const storageKey = `payroll_tx_${chainId}_${company.toLowerCase()}_${runId.toString()}`;
  const cached = (() => {
    try { return localStorage.getItem(storageKey) as `0x${string}` | null; }
    catch { return null; }
  })();

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(cached ?? undefined);
  const [searching, setSearching] = useState(!cached);

  useEffect(() => {
    if (txHash) { setSearching(false); return; }
    if (!publicClient || !payrollosAddress) { setSearching(false); return; }
    let cancelled = false;
    setSearching(true);

    async function scan() {
      if (!publicClient || !payrollosAddress) return;

      const latestBig = await publicClient.getBlockNumber();
      const latest = Number(latestBig);
      const CHUNK = 500;
      const MAX_CHUNKS = 400;

      // Mainnet uses PayrollExecuted event; testnet uses PayrollRun
      const primaryEvent = isMainnet ? PAYROLL_EXECUTED_EVENT : PAYROLL_RUN_EVENT;
      const fallbackEvent = isMainnet ? PAYROLL_RUN_EVENT : PAYROLL_EXECUTED_EVENT;

      for (let i = 0; i < MAX_CHUNKS; i++) {
        if (cancelled) return;
        const toBlock = BigInt(latest - i * CHUNK);
        const fromBlock = BigInt(Math.max(0, latest - (i + 1) * CHUNK));

        // Try primary event first, then fallback
        for (const event of [primaryEvent, fallbackEvent]) {
          try {
            const logs = await publicClient.getLogs({
              address: payrollosAddress,
              event,
              args: { company, runId },
              fromBlock,
              toBlock,
            });

            if (logs.length > 0 && logs[0].transactionHash) {
              const hash = logs[0].transactionHash;
              if (!cancelled) {
                setTxHash(hash);
                setSearching(false);
                try { localStorage.setItem(storageKey, hash); } catch { /* ignore */ }
              }
              return;
            }
          } catch {
            // Range error or rate-limit — skip, keep scanning
          }
        }

        await new Promise((r) => setTimeout(r, 120));
      }

      if (!cancelled) setSearching(false);
    }

    void scan();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, company, runId, storageKey, payrollosAddress, isMainnet]);

  return { txHash, searching };
}

function PayrollRunCard({ company, runId, chainId, chainName, explorerBase }: {
  company: `0x${string}`; runId: bigint; chainId: number; chainName: string; explorerBase: string;
}) {
  const { payrollosAddress } = getChainConfig(chainId);
  const { data, isLoading } = useReadContract({
    address: payrollosAddress,
    abi: PAYROLLOS_ABI,
    functionName: 'getPayrollRun',
    args: [company, runId],
    query: { enabled: !!payrollosAddress },
    chainId,
  });

  const { txHash, searching } = usePayrollRunTxHash(company, runId, chainId);
  const run = data as RunData | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Loader2 className="size-4 animate-spin" style={{ color: 'var(--muted)' }} />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading run #${runId.toString()}... </span>
      </div>
    );
  }

  if (!run || run.timestamp === 0n) return null;

  const date = new Date(Number(run.timestamp) * 1000);
  const totalFormatted = formatUnits(run.totalAmount, USDC_DECIMALS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--success-soft)' }}>
            <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{run.period}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
          Completed
        </span>
      </div>

      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <DollarSign className="size-3" style={{ color: 'var(--subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Total</span>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
            {Number(totalFormatted).toLocaleString('en-US', {
              minimumFractionDigits: Number(totalFormatted) % 1 === 0 ? 0 : 2,
              maximumFractionDigits: 2,
            })} USDC
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <Users className="size-3" style={{ color: 'var(--subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Employees</span>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{run.employeeCount.toString()}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <CalendarDays className="size-3" style={{ color: 'var(--subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Run #</span>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>#{run.runId.toString()}</p>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--subtle)' }}>Onchain · {chainName}</span>

        {/* Show spinner while searching for tx hash */}
        {searching && !txHash && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
            <Loader2 className="size-3 animate-spin" />
            Searching tx...
          </span>
        )}

        {/* Once found, show the tx link */}
        {txHash && (
          <a
            href={buildTxExplorerUrl(chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            View Transaction <ExternalLink className="size-3" />
          </a>
        )}

        {/* Fallback: search finished but no hash found */}
        {!searching && !txHash && (
          <a
            href={`${explorerBase}/address/${payrollosAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            ArcScan <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export function History() {
  const { address, isConnected } = useAccount();
  const { chainId, chainName, explorerBase } = useChain();
  const { runCount, isLoading } = useRunCount(address);

  const runIds: bigint[] = [];
  if (runCount !== undefined && runCount > 0n) {
    for (let i = 1n; i <= runCount; i++) runIds.push(i);
    runIds.reverse();
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect your wallet to view payroll history.</p>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Payroll History</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          {isLoading ? 'Loading...' : `${runCount?.toString() ?? '0'} payroll runs recorded on blockchain`}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-8" style={{ color: 'var(--muted)' }}>
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Reading from blockchain...</span>
        </div>
      )}

      {!isLoading && runIds.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12">
          <CalendarDays className="size-10" style={{ color: 'var(--subtle)' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>No history yet</p>
          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
            Process your first payroll to see history here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {address && runIds.map((id) => (
          <PayrollRunCard key={id.toString()} company={address} runId={id} chainId={chainId} chainName={chainName} explorerBase={explorerBase} />
        ))}
      </div>
    </div>
  );
}
