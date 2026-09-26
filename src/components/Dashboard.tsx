import { motion } from 'framer-motion';
import { useEffect } from 'react';
import {
  Users,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  CalendarDays,
  UserX,
  Wallet,
  Loader2,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';
// Wallet still used in the not-connected screen below
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import type { View } from '../types';
import {
  useEmployees,
  useRunCount,
  useTotalDisbursed,
  useActiveEmployeeCount,
  useUsdcAllowance,
} from '../hooks/usePayrollContract';

import { useChain } from '../hooks/useChain';

interface Props {
  onNav: (v: View) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  i,
}: {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  i: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      initial="hidden"
      animate="show"
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
          <Icon className="size-4" style={{ color: 'var(--accent)' }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      <p className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{sub}</p>}
    </motion.div>
  );
}

export function Dashboard({ onNav }: Props) {
  const { address, isConnected } = useAccount();
  const { chainName } = useChain();

  const { employees, isLoading: empLoading, refetch: refetchEmpDash } = useEmployees(address);
  const { runCount, isLoading: runLoading } = useRunCount(address);
  const { totalDisbursedFormatted, isLoading: disbLoading } = useTotalDisbursed(address);
  const { activeCount, isLoading: activeLoading } = useActiveEmployeeCount(address);
  const { allowanceFormatted } = useUsdcAllowance();

  const loading = empLoading || runLoading || disbLoading || activeLoading;

  // Inactive employees calculated from blockchain data: total - active
  const activeNum = activeCount !== undefined ? Number(activeCount) : 0;
  const inactiveCount = Math.max(0, employees.length - activeNum);

  useEffect(() => { if (address) void refetchEmpDash(); }, [address, refetchEmpDash]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Wallet className="size-8" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Connect Your Wallet</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Connect your wallet to view your payroll data
          </p>
        </div>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Hero balance card */}
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        animate="show"
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        <div className="absolute -top-6 -right-6 size-32 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="absolute -bottom-4 -left-4 size-24 rounded-full opacity-10" style={{ background: '#fff' }} />
        <p className="text-xs font-medium opacity-75 mb-1">Total Disbursed</p>
        <div className="flex items-end gap-2">
          {disbLoading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <>
              <span className="text-3xl font-bold display">
                {Number(totalDisbursedFormatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-medium opacity-75 mb-1">USDC</span>
            </>
          )}
        </div>
        <p className="text-xs mt-2 opacity-60">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''} · {chainName}
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Employees" value={loading ? '...' : String(employees.length)} sub="registered" i={1} />
        <StatCard icon={CheckCircle2} label="Active" value={loading ? '...' : String(activeCount ?? 0)} sub="active employees" i={2} />
        <StatCard icon={CalendarDays} label="Payroll Run" value={loading ? '...' : String(runCount ?? 0)} sub="total runs" i={3} />
        <StatCard icon={UserX} label="Inactive" value={loading ? '...' : String(inactiveCount)} sub="inactive employees" i={4} />
      </div>

      {/* Allowance info */}
      {!loading && (
        <motion.div
          variants={fadeUp}
          custom={5}
          initial="hidden"
          animate="show"
          className="rounded-2xl p-3 flex items-center gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--success-soft)' }}>
            <DollarSign className="size-3.5" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>USDC Allowance</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {Number(allowanceFormatted).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC
            </p>
          </div>
        </motion.div>
      )}



      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-4" style={{ color: 'var(--muted)' }}>
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Reading data from blockchain...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <motion.div
          variants={fadeUp}
          custom={5}
          initial="hidden"
          animate="show"
          className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Users className="size-10" style={{ color: 'var(--subtle)' }} />
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>No employees yet</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Register your first employee to start onchain payroll.
          </p>
          <button
            onClick={() => onNav('employees')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            Add Employee
          </button>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        variants={fadeUp}
        custom={6}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => onNav('employees')}
          className="rounded-2xl p-4 text-left transition-all active:scale-[0.97]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Users className="size-5 mb-2" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Manage Employees</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Add, edit, remove</p>
        </button>
        <button
          onClick={() => onNav('run-payroll')}
          className="rounded-2xl p-4 text-left transition-all active:scale-[0.97]"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <ArrowUpRight className="size-5 mb-2" />
          <p className="text-sm font-semibold">Run Payroll</p>
          <p className="text-xs mt-0.5 opacity-75">Transfer USDC onchain</p>
        </button>
      </motion.div>

      {/* ── About InstoPay ───────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        custom={7}
        initial="hidden"
        animate="show"
        className="rounded-3xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header banner */}
        <div className="relative px-5 pt-6 pb-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a3aff 0%, #2563eb 60%, #3b82f6 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 size-40 rounded-full opacity-10" style={{ background: '#fff' }} />
          <div className="absolute -bottom-6 -left-6 size-28 rounded-full opacity-10" style={{ background: '#fff' }} />
          <div className="absolute top-4 right-20 size-16 rounded-full opacity-5" style={{ background: '#fff' }} />

          {/* Logo mark */}
          <div className="relative flex items-center gap-3 mb-4">
            <div className="size-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              {/* Custom SVG coin icon */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2" />
                <text x="14" y="19" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="Space Grotesk, sans-serif">$</text>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>InstoPay</p>
              <p className="text-white text-xs" style={{ opacity: 0.7 }}>Onchain Payroll System</p>
            </div>
          </div>

          <p className="relative text-white text-sm leading-relaxed" style={{ opacity: 0.9, maxWidth: '28ch' }}>
            Transparent, secure, and instant blockchain-based payroll management solution.
          </p>
        </div>

        {/* Feature grid */}
        <div className="p-4 grid grid-cols-2 gap-3" style={{ background: 'var(--surface)' }}>
          {[
            {
              icon: Zap,
              title: 'Instant Transfer',
              desc: 'Salary is sent directly to employee wallets in seconds via USDC.',
              color: '#f59e0b',
              bg: '#fef3c7',
            },
            {
              icon: ShieldCheck,
              title: 'Transparent & Secure',
              desc: 'Every transaction is permanently recorded on blockchain, tamper-proof.',
              color: '#10b981',
              bg: '#d1fae5',
            },
            {
              icon: Globe,
              title: 'Multi-Network',
              desc: 'Supports Arc Testnet & Arc Mainnet. Switch networks anytime.',
              color: '#6366f1',
              bg: '#e0e7ff',
            },
            {
              icon: Lock,
              title: 'Non-Custodial',
              desc: 'Your funds stay in your wallet. InstoPay never holds USDC.',
              color: '#ef4444',
              bg: '#fee2e2',
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="rounded-2xl p-3"
              style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}>
              <div className="size-8 rounded-xl flex items-center justify-center mb-2"
                style={{ background: bg }}>
                <Icon className="size-4" style={{ color }} />
              </div>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Workflow steps */}
        <div className="px-4 pb-4" style={{ background: 'var(--surface)' }}>
          <p className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Alur Kerja</p>
          <div className="space-y-2">
            {[
              { step: '01', label: 'Register employees', sub: 'Name, position, ID, wallet, salary' },
              { step: '02', label: 'Record monthly attendance', sub: 'Present, leave, excused, absent' },
              { step: '03', label: 'Approve USDC', sub: 'Allow the contract to move USDC' },
              { step: '04', label: 'Run payroll', sub: 'One transaction for all employees' },
            ].map(({ step, label, sub }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="size-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>
                </div>
                <CheckCircle2 className="size-4 shrink-0" style={{ color: 'var(--success)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--canvas)', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full" style={{ background: 'var(--success)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Powered by Arc · USDC</span>
          </div>
          <button
            onClick={() => onNav('run-payroll')}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Get Started <ArrowUpRight className="size-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
