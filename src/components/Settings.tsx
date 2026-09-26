import { motion } from 'framer-motion';
import {
  Wallet,
  FileCode2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Coins,
  Users,
  ReceiptText,
  Zap,
  ShieldCheck,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { toast } from 'sonner';
import {
  USDC_DECIMALS,
  getChainConfig,
} from '../contract';
import { useChain } from '../hooks/useChain';
import {
  useActiveEmployeeCount,
  useRunCount,
  useTotalDisbursed,
  useOwnerUsdcBalance,
} from '../hooks/usePayrollContract';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.22, ease: 'easeOut' } }),
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={handleCopy} className="size-6 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-muted)' }}>
      {copied ? <CheckCircle2 className="size-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="size-3.5" style={{ color: 'var(--muted)' }} />}
    </button>
  );
}

function AddressRow({ label, address, explorer }: { label: string; address: string; explorer?: string }) {
  const short = `${address.slice(0, 10)}...${address.slice(-6)}`;
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-xs font-medium mono mt-0.5" style={{ color: 'var(--ink-2)' }}>{short}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <CopyButton value={address} label={label} />
        {explorer && (
          <a href={explorer} target="_blank" rel="noopener noreferrer" className="size-6 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-muted)' }}>
            <ExternalLink className="size-3.5" style={{ color: 'var(--accent)' }} />
          </a>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, i }: { icon: LucideIcon; label: string; value: string; sub?: string; i: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      initial="hidden"
      animate="show"
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4" style={{ color: 'var(--accent)' }} />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{sub}</p>}
    </motion.div>
  );
}

export function Settings() {
  const { address, isConnected } = useAccount();
  const { chainId, chainName, explorerBase, isMainnet } = useChain();
  const { payrollosAddress, usdcAddress } = getChainConfig(chainId);

  const { activeCount } = useActiveEmployeeCount(address);
  const { runCount } = useRunCount(address);
  const { totalDisbursedFormatted } = useTotalDisbursed(address);
  const { balanceFormatted } = useOwnerUsdcBalance();

  const { data: usdcSupplyRaw } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'totalSupply',
    chainId,
  });
  const usdcSupply = usdcSupplyRaw ? formatUnits(usdcSupplyRaw, USDC_DECIMALS) : undefined;

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show">
        <h1 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Wallet info, onchain contracts, and statistics</p>
      </motion.div>

      {/* Wallet */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
        className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Connected Wallet</p>

        {!isConnected ? (
          <div className="flex items-center gap-3 py-2">
            <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
              <Wallet className="size-5" style={{ color: 'var(--subtle)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect your wallet via the button in the top right corner to view account info</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--accent)' }}>
                {address ? address.slice(2, 4).toUpperCase() : '--'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mono truncate" style={{ color: 'var(--ink)' }}>{address}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: isMainnet ? 'rgba(245,158,11,0.15)' : 'var(--success-soft)',
                    color: isMainnet ? '#d97706' : 'var(--success)',
                  }}>{chainName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {balanceFormatted ?? '...'} USDC
                  </span>
                </div>
              </div>
              {address && <CopyButton value={address} label="Alamat wallet" />}
            </div>
          </>
        )}
      </motion.div>

      {/* Onchain stats */}
      {isConnected && (
        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Onchain Statistics</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Active Employees" value={String(activeCount ?? '...')} i={0} />
            <StatCard icon={ReceiptText} label="Payroll Run" value={String(runCount ?? '...')} i={1} />
            <StatCard icon={Coins} label="Total Disbursed" value={`${Number(totalDisbursedFormatted).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`} i={2} />
            {usdcSupply && <StatCard icon={Zap} label="USDC Supply" value={`${Number(usdcSupply).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} sub="total supply" i={3} />}
          </div>
        </motion.div>
      )}

      {/* Contract info */}
      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
        className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Onchain Contracts</p>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
            <FileCode2 className="size-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>InstoPay</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>Active · Multi-tenant</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>· {chainName}</span>
            </div>
          </div>
          <a href={`${explorerBase}/address/${payrollosAddress}`} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            Explorer <ExternalLink className="size-3" />
          </a>
        </div>

        <AddressRow label="PayrollOS Contract" address={payrollosAddress} explorer={`${explorerBase}/address/${payrollosAddress}`} />
        <AddressRow label="USDC Token" address={usdcAddress} />

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-muted)' }}>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Chain</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink)' }}>{chainName}</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-muted)' }}>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Chain ID</p>
            <p className="text-xs font-medium mt-0.5 mono" style={{ color: 'var(--ink)' }}>{chainId}</p>
          </div>
        </div>
      </motion.div>

      {/* Deploy info */}
      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show"
        className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Deployment Info</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Deploy Date</span>
            <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>September 23, 2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Status</span>
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
              <ShieldCheck className="size-3" />Verified
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Version</span>
            <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>v6 (ACTIVE)</span>
          </div>
        </div>
      </motion.div>

      {/* App info */}
      <motion.div variants={fadeUp} custom={5} initial="hidden" animate="show" className="text-center space-y-1 py-4">
        <p className="font-bold display" style={{ color: 'var(--ink)' }}>InstoPay</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Onchain Payroll · v1.0.0</p>
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>Contract running 100% onchain on {chainName}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Globe className="size-3" style={{ color: 'var(--subtle)' }} />
          <a href={`${explorerBase}/address/${payrollosAddress}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--accent)' }}>
            explorer.testnet.arc.io
          </a>
        </div>
      </motion.div>
    </div>
  );
}
