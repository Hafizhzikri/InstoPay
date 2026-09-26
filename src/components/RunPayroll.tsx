import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Square,
  CheckSquare,
  Calendar,
  Info,
} from 'lucide-react';
import { useAccount, useSwitchChain } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { formatUnits } from 'viem';
import {
  useEmployees,
  useRunCount,
  useOwnerUsdcBalance,
  useUsdcAllowance,
  useApproveUsdc,
  useRunPayrollSelected,
} from '../hooks/usePayrollContract';
import {
  useWorkingDays,
  useAllEmployeesMonthAttendance,
  ATTENDANCE_ADDRESS,
  STATUS_META,
} from '../hooks/useAttendanceContract';
import { USDC_DECIMALS, PAYROLLOS_ADDRESS } from '../contract';
import { useChain } from '../hooks/useChain';
import { buildTxExplorerUrl } from '@/onchain-facts';

function decodeName(raw: string): string { return raw.split('||')[0] ?? raw; }
function decodeJabatan(raw: string): string { return raw.split('||')[1] ?? ''; }

function parseOnchainError(error: unknown): string {
  const msg = (error as Error)?.message?.toLowerCase() ?? '';
  if (msg.includes('user rejected') || msg.includes('denied')) return 'Transaction cancelled.';
  if (msg.includes('insufficient')) return 'Insufficient balance.';
  if (msg.includes('allowance') || msg.includes('insufficientallowance')) return 'Insufficient USDC allowance. Please approve first.';
  if (msg.includes('emptyselection')) return 'Select at least one employee.';
  if (msg.includes('emptyperiod')) return 'Payroll period cannot be empty.';
  return 'Transaction failed. Please try again.';
}

// Period picker
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function periodFromMonthYear(month: number, year: number): string { return `${MONTHS[month]} ${year}`; }

interface MonthYearPickerProps { value: string; onChange: (value: string) => void; }
function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const parts = value.split(' ');
  const initMonth = MONTHS.indexOf(parts[0] ?? 'Januari');
  const initYear = parseInt(parts[1] ?? String(new Date().getFullYear()), 10);

  const [_viewMonth, setViewMonth] = useState(initMonth >= 0 ? initMonth : new Date().getMonth());
  const [viewYear, setViewYear] = useState(isNaN(initYear) ? new Date().getFullYear() : initYear);
  const [open, setOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(false);
  const [yearInput, setYearInput] = useState(String(viewYear));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function commitYearInput() {
    const y = parseInt(yearInput, 10);
    if (!isNaN(y) && y >= 2000 && y <= 2099) setViewYear(y);
    else setYearInput(String(viewYear));
    setEditingYear(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium"
        style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2"><Calendar className="size-4" style={{ color: 'var(--accent)' }} />{value}</div>
        <ChevronDown className="size-4" style={{ color: 'var(--muted)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl overflow-hidden shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setViewYear((y) => y - 1)} className="size-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                <ChevronLeft className="size-4" style={{ color: 'var(--muted)' }} />
              </button>
              {editingYear ? (
                <input
                  autoFocus
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onBlur={commitYearInput}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitYearInput(); if (e.key === 'Escape') { setEditingYear(false); setYearInput(String(viewYear)); } }}
                  className="w-20 text-center text-sm font-bold rounded-lg px-2 py-1 outline-none"
                  style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--accent)' }}
                  maxLength={4}
                  inputMode="numeric"
                />
              ) : (
                <button onClick={() => { setEditingYear(true); setYearInput(String(viewYear)); }} className="text-sm font-bold px-3 py-1 rounded-lg" style={{ color: 'var(--ink)' }} title="Click to type year">
                  {viewYear}
                </button>
              )}
              <button onClick={() => setViewYear((y) => y + 1)} className="size-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                <ChevronRight className="size-4" style={{ color: 'var(--muted)' }} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-3">
              {MONTHS.map((m, i) => {
                const isSelected = value === periodFromMonthYear(i, viewYear);
                return (
                  <button
                    key={m}
                    onClick={() => { onChange(periodFromMonthYear(i, viewYear)); setViewMonth(i); setOpen(false); }}
                    className="rounded-xl py-2 text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: isSelected ? 'var(--accent)' : 'var(--surface-muted)',
                      color: isSelected ? '#fff' : 'var(--ink-2)',
                      border: isSelected ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {m.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-center pb-3" style={{ color: 'var(--subtle)' }}>Click the year number to type directly</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RunPayroll() {
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { chainId, chainName, isSupportedArcChain } = useChain();

  const { employees, isLoading: empLoading, refetch: refetchEmp } = useEmployees(address);
  const { runCount } = useRunCount(address);
  const { balance, balanceFormatted, isLoading: balLoading, refetch: refetchBal } = useOwnerUsdcBalance();
  const { allowance, allowanceFormatted, isLoading: allowLoading, refetch: refetchAllow } = useUsdcAllowance();

  const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess, error: approveError, hash: approveHash, reset: approveReset } = useApproveUsdc();

  const [runDone, setRunDone] = useState(false);
  const [runHashSaved, setRunHashSaved] = useState<`0x${string}` | undefined>();
  const [paidTotal, setPaidTotal] = useState('0');
  const [paidCount, setPaidCount] = useState(0);

  const { runPayrollSelected, isPending: runPending, isConfirming: runConfirming, isSuccess: runSuccess, error: runError, hash: runHash } = useRunPayrollSelected();

  const prevRunSuccess = useRef(false);
  useEffect(() => {
    if (runSuccess && !prevRunSuccess.current) {
      prevRunSuccess.current = true;
      setRunDone(true);
      if (runHash) {
        setRunHashSaved(runHash);
        // Persist tx hash so History page can link to the correct transaction
        // Key format: payroll_tx_<chainId>_<company>_<nextRunId>
        if (address) {
          const nextRunId = ((runCount ?? 0n) + 1n).toString();
          try {
            localStorage.setItem(
              `payroll_tx_${chainId}_${address.toLowerCase()}_${nextRunId}`,
              runHash
            );
          } catch { /* storage full or private mode — ignore */ }
        }
      }
      void refetchBal(); void refetchAllow(); void refetchEmp();
    }
    if (!runSuccess) prevRunSuccess.current = false;
  });

  useEffect(() => { if (runHash) setRunHashSaved(runHash); }, [runHash]);

  useEffect(() => {
    if (!address) return;
    void refetchEmp(); void refetchBal(); void refetchAllow();
    void refetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (approveSuccess) { void refetchAllow(); approveReset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveSuccess]);

  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return periodFromMonthYear(now.getMonth(), now.getFullYear());
  });

  const activeEmployees = employees.filter((e) => e.active);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Attendance integration (info only — does NOT change salary) ──────────
  const periodParts = period.split(' ');
  const periodMonthIdx = MONTHS.indexOf(periodParts[0] ?? '');
  const periodMonth = periodMonthIdx >= 0 ? periodMonthIdx + 1 : new Date().getMonth() + 1;
  const periodYear = parseInt(periodParts[1] ?? String(new Date().getFullYear()), 10);

  const { workingDays } = useWorkingDays(address);
  const { attendanceData, refetch: refetchAttendance } = useAllEmployeesMonthAttendance(
    address,
    activeEmployees.map((e) => e.wallet),
    periodYear,
    periodMonth
  );

  const hasAttendanceContract = !!ATTENDANCE_ADDRESS;

  useEffect(() => {
    if (activeEmployees.length > 0 && selected.size === 0) {
      setSelected(new Set(activeEmployees.map((e) => e.wallet)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmployees.length]);

  function toggleEmployee(wallet: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(wallet)) next.delete(wallet); else next.add(wallet); return next; });
  }
  function toggleAll() {
    if (selected.size === activeEmployees.length) setSelected(new Set());
    else setSelected(new Set(activeEmployees.map((e) => e.wallet)));
  }

  const selectedEmployees = activeEmployees.filter((e) => selected.has(e.wallet));

  // Salary is always full (attendance is for reference only, not deduction)
  const totalNet = selectedEmployees.reduce((sum, e) => sum + e.salaryNet, 0n);
  const totalNetFormatted = formatUnits(totalNet, USDC_DECIMALS);
  const hasAllowance = allowance !== undefined && allowance >= totalNet && totalNet > 0n;
  const hasSufficientBalance = balance !== undefined && balance >= totalNet;

  const isWrongChain = !isSupportedArcChain;
  const loading = empLoading || balLoading || allowLoading;

  function handleApprove() { if (isWrongChain) { switchChain({ chainId }); return; } approve(totalNet); }
  function handleRunPayroll() {
    if (isWrongChain) { switchChain({ chainId }); return; }
    if (selectedEmployees.length === 0 || !period.trim()) return;
    setPaidTotal(totalNetFormatted); setPaidCount(selectedEmployees.length);
    runPayrollSelected(period, selectedEmployees.map((e) => e.wallet));
  }
  function handleReset() { setRunDone(false); setRunHashSaved(undefined); setSelected(new Set(activeEmployees.map((e) => e.wallet))); }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect your wallet to process payroll.</p>
        <ConnectKitButton />
      </div>
    );
  }

  // Success screen
  if (runDone) {
    return (
      <div className="pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 text-center space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--success)' }}
        >
          <div className="size-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'var(--success-soft)' }}>
            <CheckCircle2 className="size-8" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Payroll Successful!</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Period: {period}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Employees paid</p>
              <p className="font-bold text-lg" style={{ color: 'var(--ink)' }}>{paidCount} employee(s)</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Total USDC</p>
              <p className="font-bold text-lg" style={{ color: 'var(--ink)' }}>
                {Number(paidTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {runHashSaved && (
            <a href={buildTxExplorerUrl(chainId, runHashSaved)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent)' }}>
              View transaction on ArcScan <ExternalLink className="size-3.5" />
            </a>
          )}
          <button onClick={handleReset} className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>
            New Payroll Run
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Run Payroll</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Select employees and transfer USDC</p>
        </div>
        <button onClick={() => { void refetchEmp(); void refetchBal(); void refetchAllow(); }} className="size-9 flex items-center justify-center rounded-xl" style={{ background: 'var(--surface-muted)' }}>
          <RefreshCw className="size-4" style={{ color: 'var(--muted)' }} />
        </button>
      </div>

      {isWrongChain && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
          <AlertCircle className="size-4 shrink-0" />
          <span>Switch to {chainName} to transact.</span>
          <button onClick={() => switchChain({ chainId })} className="ml-auto font-semibold">Switch</button>
        </div>
      )}

      {/* Attendance guide banner */}
      {hasAttendanceContract && (
        <div className="rounded-2xl p-3 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Info className="size-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>How to Enter Employee Attendance</p>
          </div>
          <ol className="text-xs space-y-1 pl-1" style={{ color: 'var(--muted)' }}>
            <li>1. Open the <strong style={{ color: 'var(--accent)' }}>Attendance</strong> menu in the left sidebar</li>
            <li>2. Select an employee and choose the appropriate month</li>
            <li>3. Click a date on the calendar to change status: <strong>Present (P)</strong> → <strong>Absent (X)</strong> → <strong>Excused (E)</strong> → <strong>Leave (L)</strong></li>
            <li>4. Click <strong>Save to Blockchain</strong> — data is permanently stored onchain</li>
            <li>5. Return here to view each employee's attendance summary before running payroll</li>
          </ol>
          <p className="text-[10px]" style={{ color: 'var(--subtle)' }}>Attendance is for reference only — salary transferred always equals the registered base salary.</p>
        </div>
      )}

      {/* Period */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Payroll Period</p>
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>Period is an administrative label recorded on blockchain. It does not affect the transfer amount.</span>
        </div>
        <MonthYearPicker value={period} onChange={(v) => { setPeriod(v); void refetchAttendance(); }} />
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>Selected: {period} · will be permanently stored on blockchain.</p>
      </div>

      {/* Employee selection */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={toggleAll} className="flex items-center gap-2">
            {selected.size === activeEmployees.length && activeEmployees.length > 0
              ? <CheckSquare className="size-4" style={{ color: 'var(--accent)' }} />
              : <Square className="size-4" style={{ color: 'var(--subtle)' }} />}
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Select Employees</span>
          </button>
          <span className="text-xs font-medium" style={{ color: selected.size > 0 ? 'var(--accent)' : 'var(--subtle)' }}>
            {selected.size}/{activeEmployees.length} selected
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 px-4 py-4" style={{ color: 'var(--muted)' }}>
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Reading from blockchain...</span>
          </div>
        )}

        {!loading && employees.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>No employees registered yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Open Employees menu → add an employee → return here.</p>
          </div>
        )}

        {!loading && employees.length > 0 && activeEmployees.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>All employees are inactive</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Activate employees in the Employees menu.</p>
          </div>
        )}

        {!loading && activeEmployees.length > 0 && (
          <div>
            {activeEmployees.map((emp) => {
              const isChecked = selected.has(emp.wallet);
              const name = decodeName(emp.name);
              const jabatan = decodeJabatan(emp.name);
              const att = attendanceData[emp.wallet.toLowerCase()];

              return (
                <motion.div
                  key={emp.wallet}
                  layout
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderTop: '1px solid var(--border)',
                    background: isChecked ? 'var(--accent-soft)' : 'var(--surface-muted)',
                  }}
                  onClick={() => toggleEmployee(emp.wallet)}
                >
                  {isChecked
                    ? <CheckSquare className="size-4 shrink-0" style={{ color: 'var(--accent)' }} />
                    : <Square className="size-4 shrink-0" style={{ color: 'var(--subtle)' }} />}
                  <div className="size-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--accent)' }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{name}</p>
                    {jabatan && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="size-3" style={{ color: 'var(--subtle)' }} />
                        <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>{jabatan}</span>
                      </div>
                    )}
                    {/* Attendance summary — info only */}
                    {hasAttendanceContract && att && att.total > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {att.hadir > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: STATUS_META[1].bg, color: STATUS_META[1].color }}>H:{att.hadir}</span>}
                        {att.cuti > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: STATUS_META[2].bg, color: STATUS_META[2].color }}>C:{att.cuti}</span>}
                        {att.izin > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: STATUS_META[3].bg, color: STATUS_META[3].color }}>I:{att.izin}</span>}
                        {att.absen > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: STATUS_META[4].bg, color: STATUS_META[4].color }}>X:{att.absen}</span>}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                          {att.hadir + att.cuti + att.izin}/{workingDays} hari
                        </span>
                      </div>
                    )}
                    {hasAttendanceContract && (!att || att.total === 0) && (
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--subtle)' }}>No attendance data this month</p>
                    )}
                  </div>
                  {/* Base salary — always full */}
                  <p className="text-xs font-semibold shrink-0" style={{ color: 'var(--ink)' }}>
                    {Number(emp.salaryNetFormatted).toLocaleString('en-US', { minimumFractionDigits: 0 })} USDC
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}


      </div>

      {/* Wallet summary */}
      {!loading && selectedEmployees.length > 0 && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Wallet Summary</p>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>USDC Balance</span>
            <span className="text-sm font-medium" style={{ color: hasSufficientBalance ? 'var(--success)' : 'var(--danger)' }}>
              {Number(balanceFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Allowance</span>
            <div className="flex items-center gap-1.5">
              {hasAllowance ? <ShieldCheck className="size-3.5" style={{ color: 'var(--success)' }} /> : null}
              <span className="text-sm font-medium" style={{ color: hasAllowance ? 'var(--success)' : 'var(--muted)' }}>
                {Number(allowanceFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient balance */}
      {!loading && !hasSufficientBalance && selectedEmployees.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>
            Insufficient balance. Need {Number(totalNetFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC.
            Click &quot;Get test USDC&quot; in the Arc Studio sidebar.
          </span>
        </div>
      )}

      {/* Step 1: Approve */}
      {!hasAllowance && !loading && selectedEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: 'var(--accent)' }}>1</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Approve USDC</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Allow the InstoPay contract to move {Number(totalNetFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC from your wallet to {selectedEmployees.length} selected employee(s).
          </p>
          {approveError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{parseOnchainError(approveError)}</p>}
          {approveSuccess && approveHash && (
            <a href={buildTxExplorerUrl(chainId, approveHash)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }}>
              <CheckCircle2 className="size-3.5" /> Approved · View on ArcScan
            </a>
          )}
          <button
            onClick={handleApprove}
            disabled={approvePending || approveConfirming}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', opacity: approvePending || approveConfirming ? 0.7 : 1 }}
          >
            {approvePending ? <><Loader2 className="size-4 animate-spin" /> Confirming...</>
              : approveConfirming ? <><Loader2 className="size-4 animate-spin" /> Processing...</>
              : <><ArrowRight className="size-4" /> Approve {Number(totalNetFormatted).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</>}
          </button>
        </motion.div>
      )}

      {/* Approved banner */}
      {hasAllowance && !loading && selectedEmployees.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
          <ShieldCheck className="size-4" />
          <span>USDC approved — ready to run payroll.</span>
        </div>
      )}

      {/* Step 2: Run payroll */}
      <div className="space-y-2">
        {runError && <p className="text-xs px-1" style={{ color: 'var(--danger)' }}>{parseOnchainError(runError)}</p>}
        <button
          onClick={handleRunPayroll}
          disabled={runPending || runConfirming || selectedEmployees.length === 0 || !hasAllowance}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{
            background: 'var(--accent)',
            opacity: runPending || runConfirming || selectedEmployees.length === 0 || !hasAllowance ? 0.6 : 1,
          }}
        >
          {runPending ? <><Loader2 className="size-4 animate-spin" /> Confirming in wallet...</>
            : runConfirming ? <><Loader2 className="size-4 animate-spin" /> Processing payroll...</>
            : isWrongChain ? `Switch to ${chainName}`
            : selectedEmployees.length === 0 ? 'Select Employees Dahulu'
            : !hasAllowance ? <><ArrowRight className="size-4" /> Approve USDC First</>
            : <><Play className="size-4" /> Pay Salary — {selectedEmployees.length} Employee(s) ({Number(totalNetFormatted).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC)</>}
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>
          Run #{(runCount ?? 0n).toString()} · {PAYROLLOS_ADDRESS.slice(0, 6)}...{PAYROLLOS_ADDRESS.slice(-4)}
        </p>
      </div>
    </div>
  );
}
