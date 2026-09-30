import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  BookOpen,
  Zap,
  Users,
  DollarSign,
  ClipboardList,
  History,
  Settings,
  ShieldCheck,
  Globe,
  Code,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ── Docs content ──────────────────────────────────────────────────────────────

interface DocSection {
  id: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  content: React.ReactNode;
}

function Code_({ children }: { children: string }) {
  return (
    <code
      className="px-1.5 py-0.5 rounded text-xs font-mono"
      style={{ background: 'var(--surface-muted)', color: 'var(--accent)', border: '1px solid var(--border)' }}
    >
      {children}
    </code>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div
        className="size-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono mt-0.5"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        {String(n).padStart(2, '0')}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(37,99,235,0.15)' }}
    >
      {children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
      style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}
    >
      💡 {children}
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
    >
      ⚠️ {children}
    </div>
  );
}

const SECTIONS: DocSection[] = [
  {
    id: 'intro',
    icon: BookOpen,
    title: 'Introduction',
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <strong>InstoPay</strong> is an onchain payroll management system built on Arc blockchain.
          It lets any company manage employees and distribute salaries directly in <strong>USDC</strong> —
          no banks, no intermediaries, instant transfer.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Zap, title: 'Instant', desc: 'USDC lands in employee wallets in seconds', color: '#f59e0b', bg: '#fef3c7' },
            { icon: ShieldCheck, title: 'Transparent', desc: 'Every payroll permanently on blockchain', color: '#10b981', bg: '#d1fae5' },
            { icon: Globe, title: 'Multi-Network', desc: 'Arc Testnet & Arc Mainnet supported', color: '#6366f1', bg: '#e0e7ff' },
            { icon: ShieldCheck, title: 'Non-Custodial', desc: 'InstoPay never holds your USDC', color: '#ef4444', bg: '#fee2e2' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="rounded-xl p-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <div className="size-7 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
                <Icon className="size-3.5" style={{ color }} />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
        <Note>
          InstoPay is <strong>multi-tenant</strong> — every wallet that connects becomes its own independent company.
          Your employee data is isolated from other users.
        </Note>
      </div>
    ),
  },
  {
    id: 'quickstart',
    icon: Zap,
    title: 'Quick Start',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Get your first payroll done in 4 steps — takes under 5 minutes.
        </p>
        <div className="space-y-3">
          <Step n={1} title="Connect Wallet"
            desc="Click 'Connect Wallet' in the top-right corner. Select MetaMask or any injected wallet. InstoPay supports Arc Testnet and Arc Mainnet." />
          <Step n={2} title="Add Employees"
            desc="Go to Employees → Add. Fill in name, position, NIK, wallet address, and net salary in USDC. Each entry is stored permanently on the blockchain." />
          <Step n={3} title="Approve USDC"
            desc="On the Run Payroll page, click 'Approve USDC'. This grants the InstoPay contract permission to move USDC from your wallet to employees. You only approve the exact amount needed." />
          <Step n={4} title="Run Payroll"
            desc="Select which employees to pay, choose the pay period, then click 'Run Payroll'. One transaction — USDC is sent instantly to all selected employee wallets." />
        </div>
        <Tip>
          On Arc Testnet, click <strong>Get test USDC</strong> in the Arc Studio sidebar to receive free testnet USDC for testing.
        </Tip>
      </div>
    ),
  },
  {
    id: 'employees',
    icon: Users,
    title: 'Managing Employees',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          The Employees page is your team registry. All data lives onchain.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl p-3 space-y-1" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Fields stored onchain</p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--muted)' }}>
              <li>• <strong>Name</strong> — full name of the employee</li>
              <li>• <strong>Position (Jabatan)</strong> — job title</li>
              <li>• <strong>NIK</strong> — employee identification number</li>
              <li>• <strong>Wallet address</strong> — USDC will be sent here</li>
              <li>• <strong>Net salary</strong> — amount in USDC (6 decimals)</li>
              <li>• <strong>Active status</strong> — active employees are eligible for payroll</li>
            </ul>
          </div>
          <Step n={1} title="Add employee" desc="Tap the '+' button. Fill the form and click 'Register to Blockchain'. Confirm in MetaMask." />
          <Step n={2} title="Edit employee" desc="Tap the pencil icon on any employee card. Change salary, position, or status. Each edit is a new transaction." />
          <Step n={3} title="Remove employee" desc="Tap the trash icon. This removes the employee from the contract — they won't appear in future payroll runs." />
        </div>
        <Warn>
          The wallet address is where USDC gets sent. Double-check it before saving — blockchain transactions cannot be reversed.
        </Warn>
      </div>
    ),
  },
  {
    id: 'attendance',
    icon: ClipboardList,
    title: 'Attendance System',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          InstoPay has a built-in onchain attendance system. Attendance data is used to calculate proportional salary.
        </p>
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Status codes</p>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            {[
              { code: '0', label: 'Belum (Not yet)' },
              { code: '1', label: 'Hadir (Present)' },
              { code: '2', label: 'Cuti (Leave)' },
              { code: '3', label: 'Izin (Excused)' },
              { code: '4', label: 'Tidak Masuk (Absent)' },
            ].map(({ code, label }) => (
              <div key={code} className="flex items-center gap-2">
                <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{code}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--ink)' }}>Salary formula</p>
          <p className="text-xs font-mono px-2 py-1.5 rounded" style={{ background: 'var(--canvas)', color: 'var(--accent)' }}>
            salary = (Hadir + Cuti + Izin) / workingDays × salaryNet
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Default: 26 working days/month. No attendance recorded = full salary paid.
          </p>
        </div>
        <Tip>
          You can change the default working days per company using <Code_>setWorkingDays</Code_> on the AttendanceOS contract.
        </Tip>
      </div>
    ),
  },
  {
    id: 'payroll',
    icon: DollarSign,
    title: 'Running Payroll',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Payroll is a two-step process: Approve, then Execute.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Step 1 — Approve USDC</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              You allow the InstoPay contract to move exactly the total USDC needed.
              This calls <Code_>USDC.approve(contractAddress, totalAmount)</Code_> on the USDC token contract.
            </p>
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Step 2 — Run Payroll</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Select which employees to pay, choose a pay period label (e.g. "September 2026"), then execute.
              The contract calls <Code_>safeTransferFrom</Code_> from your wallet to each employee.
            </p>
          </div>
        </div>
        <Note>
          <strong>Pay period</strong> is an administrative label stored permanently onchain as a reference for each payroll run.
          It does not affect the transfer amount — it is just a record like "October 2026".
        </Note>
        <Warn>
          If a transfer to one employee fails (e.g. blocked address), the rest of the batch continues.
          Failed transfers are recorded as <Code_>SalaryFailed</Code_> events onchain.
        </Warn>
      </div>
    ),
  },
  {
    id: 'history',
    icon: History,
    title: 'Payroll History',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Every payroll run is permanently stored on the blockchain. The History page reads directly from the contract.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Period', desc: 'The pay period label you set when running payroll' },
            { label: 'Total USDC', desc: 'Sum of all successful transfers in that run' },
            { label: 'Employees paid', desc: 'Number of employees who received salary' },
            { label: 'Run #', desc: 'Sequential run ID for your company on the contract' },
            { label: 'Timestamp', desc: 'Block timestamp when the transaction was confirmed' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 text-xs">
              <span className="font-semibold shrink-0 w-28" style={{ color: 'var(--ink)' }}>{label}</span>
              <span style={{ color: 'var(--muted)' }}>{desc}</span>
            </div>
          ))}
        </div>
        <Tip>
          Click the ArcScan link on any history entry to view the full transaction details including individual transfers on the blockchain explorer.
        </Tip>
      </div>
    ),
  },
  {
    id: 'contracts',
    icon: Code,
    title: 'Smart Contracts',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          InstoPay is powered by two onchain contracts — both verified on Arc.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>PayrollOS — Testnet</p>
            <a href="https://explorer.testnet.arc.io/address/0xbf5888844ed7d8e2feb57cc1d405bd1cad8f85f6"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-mono break-all"
              style={{ color: 'var(--accent)' }}>
              0xbf5888844ed7d8e2feb57cc1d405bd1cad8f85f6
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>PayrollOS — Mainnet</p>
            <a href="https://explorer.arc.io/address/0x583F852E3D8017BaA214c9eeDCedD86c3825c57C"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-mono break-all"
              style={{ color: 'var(--accent)' }}>
              0x583F852E3D8017BaA214c9eeDCedD86c3825c57C
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>AttendanceOS — Testnet</p>
            <a href="https://explorer.testnet.arc.io/address/0x6c020b13c311da70558a417d4c8d3b1e343268b6"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-mono break-all"
              style={{ color: 'var(--accent)' }}>
              0x6c020b13c311da70558a417d4c8d3b1e343268b6
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--ink)' }}>Key functions</p>
          <div className="space-y-1">
            {[
              'registerEmployee(wallet, salaryNet, name, active)',
              'updateEmployee(wallet, salaryNet, name, active)',
              'removeEmployee(wallet)',
              'runPayrollSelected(period, wallets[])',
              'getEmployees(company)',
              'getPayrollRun(company, runId)',
            ].map((fn) => (
              <p key={fn} className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{fn}</p>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings & Network',
    content: (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          The Settings page shows your connected wallet info and live contract state.
        </p>
        <div className="space-y-3">
          <Step n={1} title="Switching networks"
            desc="InstoPay auto-detects whether your wallet is on Arc Testnet or Arc Mainnet. Use the 'Switch to Mainnet' / 'Switch to Testnet' button in the sidebar to change networks." />
          <Step n={2} title="Wallet info"
            desc="Your wallet address, USDC balance, and current USDC allowance are shown in real-time. Data is read directly from the blockchain, not cached." />
          <Step n={3} title="Contract info"
            desc="The Settings page shows the active PayrollOS and USDC contract addresses with direct links to the blockchain explorer." />
        </div>
        <Note>
          InstoPay is <strong>non-custodial</strong> — your private key never leaves your wallet. The contract only moves USDC when you explicitly approve and execute a payroll transaction.
        </Note>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'FAQ',
    content: (
      <div className="space-y-3">
        {[
          {
            q: 'Do I need to create an account?',
            a: 'No. InstoPay is fully decentralized. Just connect your wallet — your wallet address IS your account.',
          },
          {
            q: 'Can other users see my employee data?',
            a: 'Employee data is stored onchain so technically readable via RPC. However, only your wallet can manage your employees — other wallets have read-only access. Do not store sensitive personal data onchain.',
          },
          {
            q: 'What if a payroll transfer fails for one employee?',
            a: 'The batch continues. The failed transfer is recorded as a SalaryFailed event onchain. Other employees still receive their salary.',
          },
          {
            q: 'Can I run payroll for only some employees?',
            a: 'Yes. On the Run Payroll page, use the checkboxes to select exactly which employees to pay. Only selected employees receive USDC.',
          },
          {
            q: 'What is USDC Allowance?',
            a: 'Allowance is how much USDC you have pre-approved for the contract to spend. You need to approve at least the total amount of the upcoming payroll run.',
          },
          {
            q: 'Is there a fee?',
            a: 'InstoPay charges no fee. You only pay the Arc network gas fee (in USDC) for each transaction. Gas fees on Arc are minimal and predictable.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="rounded-xl p-3 space-y-1"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{q}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

// ── Modal component ───────────────────────────────────────────────────────────

interface DocsModalProps {
  open: boolean;
  onClose: () => void;
}

export function DocsModal({ open, onClose }: DocsModalProps) {
  const [activeId, setActiveId] = useState('intro');
  const [navOpen, setNavOpen] = useState(false);

  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-3 bottom-3 top-12 z-50 flex flex-col rounded-3xl overflow-hidden md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[680px] md:top-10 md:bottom-10"
            style={{ background: 'var(--canvas)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#1a3aff,#3b82f6)' }}>
                  <BookOpen className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--ink)', fontFamily: 'Space Grotesk,sans-serif' }}>InstoPay Docs</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Documentation & Guide</p>
                </div>
              </div>
              <button onClick={onClose}
                className="size-8 flex items-center justify-center rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <X className="size-4" style={{ color: 'var(--muted)' }} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar — desktop */}
              <nav className="hidden md:flex flex-col w-52 shrink-0 py-3 overflow-y-auto"
                style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
                {SECTIONS.map((s) => {
                  const SIcon = s.icon;
                  const isActive = s.id === activeId;
                  return (
                    <button key={s.id}
                      onClick={() => setActiveId(s.id)}
                      className="flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-xl text-left transition-all"
                      style={{
                        background: isActive ? 'var(--accent-soft)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--muted)',
                      }}>
                      <SIcon className="size-3.5 shrink-0" />
                      <span className="text-xs font-medium">{s.title}</span>
                      {isActive && <ChevronRight className="size-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile nav */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile nav toggle */}
                <button
                  className="md:hidden flex items-center gap-2 px-4 py-3 text-sm font-medium shrink-0"
                  style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink)', background: 'var(--surface)' }}
                  onClick={() => setNavOpen((p) => !p)}
                >
                  <ActiveIcon className="size-4" style={{ color: 'var(--accent)' }} />
                  <span className="flex-1 text-left">{active.title}</span>
                  {navOpen ? <ChevronUp className="size-4" style={{ color: 'var(--muted)' }} /> : <ChevronDown className="size-4" style={{ color: 'var(--muted)' }} />}
                </button>

                {/* Mobile nav dropdown */}
                <AnimatePresence>
                  {navOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden shrink-0 md:hidden"
                      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
                    >
                      {SECTIONS.map((s) => {
                        const SIcon = s.icon;
                        return (
                          <button key={s.id}
                            onClick={() => { setActiveId(s.id); setNavOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                            style={{ color: s.id === activeId ? 'var(--accent)' : 'var(--muted)' }}>
                            <SIcon className="size-3.5 shrink-0" />
                            <span className="text-xs font-medium">{s.title}</span>
                            {s.id === activeId && <ChevronRight className="size-3 ml-auto" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--accent-soft)' }}>
                      <ActiveIcon className="size-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--ink)', fontFamily: 'Space Grotesk,sans-serif' }}>
                      {active.title}
                    </h2>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeId}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {active.content}
                    </motion.div>
                  </AnimatePresence>

                  {/* Pagination */}
                  <div className="flex justify-between mt-8 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {SECTIONS.findIndex((s) => s.id === activeId) > 0 ? (
                      <button
                        onClick={() => setActiveId(SECTIONS[SECTIONS.findIndex((s) => s.id === activeId) - 1].id)}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-xl"
                        style={{ background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                        ← Prev
                      </button>
                    ) : <div />}
                    {SECTIONS.findIndex((s) => s.id === activeId) < SECTIONS.length - 1 ? (
                      <button
                        onClick={() => setActiveId(SECTIONS[SECTIONS.findIndex((s) => s.id === activeId) + 1].id)}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-xl text-white"
                        style={{ background: 'var(--accent)' }}>
                        Next →
                      </button>
                    ) : <div />}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
