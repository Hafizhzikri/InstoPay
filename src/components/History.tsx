import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ExternalLink,
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
import { useState, useEffect } from 'react';

interface RunData {
  runId: bigint;
  period: string;
  totalAmount: bigint;
  employeeCount: bigint;
  timestamp: bigint;
}


/**
 * Returns the tx hash for a specific payroll run.
 * 1. Check localStorage first (instant).
 * 2. If not cached, scan onchain for PayrollRun event with matching runId (once).
 *    Cache result (or "not_found") to localStorage so we never scan again for this run.
 */
const PAYROLL_RUN_EVENT = parseAbiItem(
  'event PayrollRun(address indexed company, uint256 indexed runId, string period, uint256 totalAmount, uint256 employeeCount, uint256 timestamp)'
);

function usePayrollRunTxHash(company: `0x${string}`, runId: bigint, chainId: number) {
  const storageKey = `payroll_tx_${chainId}_${company.toLowerCase()}_${runId.toString()}`;
  const notFoundKey = `payroll_tx_nf_${chainId}_${company.toLowerCase()}_${runId.toString()}`;
  const publicClient = usePublicClient({ chainId });
  const { payrollosAddress } = getChainConfig(chainId);

  const getCached = () => {
    try { return localStorage.getItem(storageKey) as `0x${string}` | null; }
    catch { return null; }
  };
  const isNotFound = () => {
    try { return localStorage.getItem(notFoundKey) === '1'; }
    catch { return false; }
  };

  // Clear stale "not_found" cache so re-scan happens with correct event name
  const clearStaleCache = () => {
    try {
      if (localStorage.getItem(notFoundKey) === '1') {
        localStorage.removeItem(notFoundKey);
      }
    } catch { /* ignore */ }
  };
  clearStaleCache();

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(getCached() ?? undefined);
  const [searching, setSearching] = useState(!getCached() && !isNotFound());

  useEffect(() => {
    // Already have hash or already confirmed not found
    if (getCached() || isNotFound()) {
      setSearching(false);
      return;
    }
    if (!publicClient || !payrollosAddress) { setSearching(false); return; }

    let cancelled = false;
    const scan = async () => {
      setSearching(true);
      try {
        const latest = await publicClient.getBlockNumber();
        // Scan last 200,000 blocks — covers extensive Arc Testnet history
        const from = latest > 200000n ? latest - 200000n : 0n;
        const logs = await publicClient.getLogs({
          address: payrollosAddress,
          event: PAYROLL_RUN_EVENT,
          args: { company, runId },
          fromBlock: from,
          toBlock: 'latest',
        });
        if (cancelled) return;
        if (logs.length > 0 && logs[0].transactionHash) {
          const hash = logs[0].transactionHash;
          try { localStorage.setItem(storageKey, hash); } catch { /* ignore */ }
          setTxHash(hash);
        } else {
          // Not found in last 50k blocks — cache as not_found
          try { localStorage.setItem(notFoundKey, '1'); } catch { /* ignore */ }
        }
      } catch {
        // RPC error — just skip
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    void scan();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, company, runId.toString(), payrollosAddress]);

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
        <div className="size-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading run #{runId.toString()}...</span>
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

        {txHash ? (
          <a
            href={`${explorerBase}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            View Transaction <ExternalLink className="size-3" />
          </a>
        ) : searching ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
            <span className="size-3 rounded-full border border-t-transparent animate-spin inline-block" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            Finding tx...
          </span>
        ) : (
          <a
            href={`${explorerBase}/address/${payrollosAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--muted)' }}
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
          <div className="size-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
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
