/**
 * Attendance.tsx — InstoPay Attendance Module
 * Stores all attendance data onchain (AttendanceOS contract).
 * Persists across browsers and devices because data lives on blockchain.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  Save,
  Loader2,
  AlertCircle,
  BarChart3,
  Settings2,
  ChevronDown,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAccount, useSwitchChain } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { toast } from 'sonner';
import { useEmployees } from '../hooks/usePayrollContract';
import {
  useMonthAttendance,
  useMonthSummary,
  useBatchSetAttendance,
  useWorkingDays,
  useSetWorkingDays,
  STATUS_META,
  ATTENDANCE_ADDRESS,
  type AttendanceStatus,
} from '../hooks/useAttendanceContract';
import { useChain } from '../hooks/useChain';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year: number, month: number) { // month: 1-12
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) { // 0=Sun
  return new Date(year, month - 1, 1).getDay();
}

function decodeName(raw: string): string { return raw.split('||')[0] ?? raw; }

// ── Status Chip ───────────────────────────────────────────────────────────────

function StatusChip({ status, size = 'md' }: { status: AttendanceStatus; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  const small = size === 'sm';
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${small ? 'px-1.5 py-0 text-[10px]' : 'px-2.5 py-0.5 text-xs'}`}
      style={{ background: m.bg, color: m.color }}
    >
      {small ? m.short : m.label}
    </span>
  );
}

// ── Status Toggle: cycle through 0→1→2→3→4→0 ─────────────────────────────────
const CYCLE: AttendanceStatus[] = [0, 1, 4, 3, 2];
function nextStatus(s: AttendanceStatus): AttendanceStatus {
  const idx = CYCLE.indexOf(s);
  return CYCLE[(idx + 1) % CYCLE.length] ?? 0;
}

// ── Calendar Day Cell ─────────────────────────────────────────────────────────

interface DayCellProps {
  day: number;
  status: AttendanceStatus;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  saving: boolean;
  onClick: () => void;
}

function DayCell({ day, status, isToday, isWeekend, isPast, saving, onClick }: DayCellProps) {
  const m = STATUS_META[status];
  const hasStatus = status !== 0;

  return (
    <button
      onClick={onClick}
      disabled={saving}
      title={`${day} — ${m.label} (click to change)`}
      className="relative flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 select-none"
      style={{
        aspectRatio: '1',
        background: hasStatus ? m.bg : isWeekend ? 'var(--surface-muted)' : 'var(--surface)',
        border: isToday
          ? '2px solid var(--accent)'
          : hasStatus
          ? `1.5px solid ${m.color}33`
          : '1.5px solid var(--border)',
        opacity: isPast && !hasStatus ? 0.45 : 1,
        cursor: saving ? 'wait' : 'pointer',
      }}
    >
      {saving && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <Loader2 className="size-3 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      )}
      <span
        className="text-[11px] font-semibold leading-none"
        style={{ color: hasStatus ? m.color : isToday ? 'var(--accent)' : 'var(--ink-2)' }}
      >
        {day}
      </span>
      {hasStatus && (
        <span className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: m.color }}>
          {m.short}
        </span>
      )}
      {isToday && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </button>
  );
}

// ── Monthly Summary Bar ───────────────────────────────────────────────────────

function SummaryBar({ present, leave, excused, absent, workingDays }: {
  present: number; leave: number; excused: number; absent: number; workingDays: number;
}) {
  const items = [
    { value: present,  meta: STATUS_META[1] },
    { value: leave,    meta: STATUS_META[2] },
    { value: excused,  meta: STATUS_META[3] },
    { value: absent,   meta: STATUS_META[4] },
  ];
  const paid = present + leave + excused; // present + leave + excused counted for salary
  const ratio = workingDays > 0 ? Math.min(paid / workingDays, 1) : 0;

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>Monthly Summary</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {paid}/{workingDays} days
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: ratio >= 1 ? '#16a34a' : 'var(--accent)' }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="text-center">
            <div
              className="rounded-xl py-2 mb-1"
              style={{ background: item.meta.bg }}
            >
              <p className="text-base font-bold" style={{ color: item.meta.color }}>{item.value}</p>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{item.meta.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface-muted)' }}>
        <Info className="size-3 shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Proportional salary = (Present + Leave + Excused) ÷ {workingDays} days × Base Salary.
          Absent is not counted.
        </p>
      </div>
    </div>
  );
}

// ── Employee Selector ─────────────────────────────────────────────────────────

interface EmployeeSelectorProps {
  employees: { wallet: `0x${string}`; name: string; active: boolean }[];
  selected: `0x${string}` | null;
  onSelect: (w: `0x${string}`) => void;
}

function EmployeeSelector({ employees, selected, onSelect }: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const active = employees.filter((e) => e.active);
  const current = active.find((e) => e.wallet === selected);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium"
        style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Users className="size-4" style={{ color: 'var(--accent)' }} />
          {current ? decodeName(current.name) : 'Select Employee'}
        </div>
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
            {active.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No active employees.</p>
            )}
            {active.map((emp) => (
              <button
                key={emp.wallet}
                onClick={() => { onSelect(emp.wallet); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                style={{
                  background: selected === emp.wallet ? 'var(--accent-soft)' : 'transparent',
                  color: selected === emp.wallet ? 'var(--accent)' : 'var(--ink)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  className="size-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {decodeName(emp.name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold leading-none">{decodeName(emp.name)}</p>
                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--muted)' }}>
                    {emp.wallet.slice(0, 6)}...{emp.wallet.slice(-4)}
                  </p>
                </div>
                {selected === emp.wallet && <CheckCircle2 className="size-4 ml-auto" style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Batch Save Modal ──────────────────────────────────────────────────────────

interface BatchSaveProps {
  pending: Map<number, AttendanceStatus>; // day → status
  employee: `0x${string}`;
  year: number;
  month: number;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function BatchSaveBar({ pending, onSave, onCancel, isSaving }: BatchSaveProps) {
  if (pending.size === 0) return null;
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
      style={{ background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 280 }}
    >
      <div className="size-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
        <Save className="size-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-white text-xs font-semibold">{pending.size} unsaved changes</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Save to blockchain at once</p>
      </div>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
      >
        Cancel
      </button>
      <button
        onClick={() => { void onSave(); }}
        disabled={isSaving}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
        Save
      </button>
    </motion.div>
  );
}

// ── Working Days Settings ─────────────────────────────────────────────────────

function WorkingDaysSetting({ company }: { company: `0x${string}` }) {
  const { workingDays } = useWorkingDays(company);
  const { setWorkingDays, isPending, isConfirming, isSuccess, error } = useSetWorkingDays();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(workingDays));

  useEffect(() => { setVal(String(workingDays)); }, [workingDays]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isSuccess) { toast.success('Working days saved to blockchain'); setEditing(false); }
  }, [isSuccess]); // eslint-disable-line react(set-state-in-effect)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (error) toast.error('Failed to save working days');
  }, [error]);

  const busy = isPending || isConfirming;

  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <Settings2 className="size-4 shrink-0" style={{ color: 'var(--accent)' }} />
      <div className="flex-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>Working Days / Month</p>
        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Standard for proportional salary calculation</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="number"
            min={1}
            max={31}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-14 text-center text-sm font-bold rounded-lg px-2 py-1.5 outline-none"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--accent)' }}
          />
          <button
            onClick={() => {
              const n = parseInt(val, 10);
              if (isNaN(n) || n < 1 || n > 31) { toast.error('Enter 1–31'); return; }
              void setWorkingDays(n);
            }}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {busy ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="px-2 py-1.5 rounded-lg text-xs" style={{ color: 'var(--muted)' }}>Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{workingDays}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>days</span>
          <button
            onClick={() => setEditing(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--surface-muted)', color: 'var(--accent)', border: '1px solid var(--border)' }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4].map((s) => {
        const m = STATUS_META[s];
        return (
          <div key={s} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: m.bg }}>
            <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.short}</span>
            <span className="text-[10px]" style={{ color: m.color }}>{m.label}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'var(--surface-muted)' }}>
        <span className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>—</span>
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Not Set</span>
      </div>
    </div>
  );
}

// ── Main Calendar View ────────────────────────────────────────────────────────

interface CalendarViewProps {
  company: `0x${string}`;
  employee: `0x${string}`;
  year: number;
  month: number;
}

function CalendarView({ company, employee, year, month }: CalendarViewProps) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  const { days: onchainDays, isLoading, refetch } = useMonthAttendance(company, employee, year, month);
  const { summary, refetch: refetchSummary } = useMonthSummary(company, employee, year, month);
  const { workingDays } = useWorkingDays(company);

  // Local pending changes (not yet saved)
  const [pending, setPending] = useState<Map<number, AttendanceStatus>>(new Map());
  // Merge onchain + pending for display
  const merged: AttendanceStatus[] = onchainDays.map((s, idx) => {
    const day = idx + 1;
    return pending.has(day) ? (pending.get(day) as AttendanceStatus) : s;
  });

  const { batchSet, isPending: batchPending, isConfirming: batchConfirming, isSuccess: batchSuccess, error: batchError } = useBatchSetAttendance();
  const isBatchSaving = batchPending || batchConfirming;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (batchSuccess) {
      toast.success('Attendance saved to blockchain!');
      setPending(new Map()); // eslint-disable-line react(set-state-in-effect)
      void refetch();
      void refetchSummary();
    }
  }, [batchSuccess]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (batchError) toast.error('Failed to save attendance. Please try again.');
  }, [batchError]);

  function handleDayClick(day: number) {
    const current = pending.get(day) ?? onchainDays[day - 1] ?? 0;
    const next = nextStatus(current);
    setPending((prev) => {
      const m = new Map(prev);
      // If next matches onchain, remove from pending (no change needed)
      if (next === onchainDays[day - 1]) {
        m.delete(day);
      } else {
        m.set(day, next);
      }
      return m;
    });
  }

  async function handleBatchSave() {
    if (pending.size === 0) return;
    const dayArr = Array.from(pending.keys());
    const statusArr = dayArr.map((d) => pending.get(d) as AttendanceStatus);
    await batchSet(employee, year, month, dayArr, statusArr);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month); // 0=Sun

  // Build calendar grid (max 6 weeks × 7 days)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <SummaryBar
        present={summary.hadir}
        leave={summary.cuti}
        excused={summary.izin}
        absent={summary.absen}
        workingDays={workingDays}
      />

      {/* Legend */}
      <div className="flex items-center justify-between">
        <Legend />
        <button
          onClick={() => { void refetch(); void refetchSummary(); }}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
          style={{ color: 'var(--muted)', background: 'var(--surface-muted)' }}
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      {/* Info: tap hint */}
      <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface-muted)' }}>
        <Info className="size-3 shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
          Click a date to change status (Empty → Present → Absent → Excused → Leave → Empty).
          Changes are batched and saved to blockchain in a single transaction.
        </p>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className="text-center py-2 text-[11px] font-semibold"
                style={{ color: i === 0 || i === 6 ? '#dc2626' : 'var(--muted)' }}
              >
                {d}
              </div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const dow = (firstDow + day - 1) % 7;
              const isWeekend = dow === 0 || dow === 6;
              const isPast = isCurrentMonth
                ? day < todayDay
                : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1);
              const status = merged[day - 1] ?? 0;
              return (
                <DayCell
                  key={day}
                  day={day}
                  status={status}
                  isToday={day === todayDay}
                  isWeekend={isWeekend}
                  isPast={isPast}
                  saving={false}
                  onClick={() => handleDayClick(day)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Pending changes bar */}
      <AnimatePresence>
        {pending.size > 0 && (
          <BatchSaveBar
            pending={pending}
            employee={employee}
            year={year}
            month={month}
            onSave={handleBatchSave}
            onCancel={() => setPending(new Map())}
            isSaving={isBatchSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function Attendance() {
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { chainId, chainName, isSupportedArcChain } = useChain();
  const { employees, isLoading: empLoading } = useEmployees(address);
  const activeEmployees = employees.filter((e) => e.active);

  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedWallet, setSelectedWallet] = useState<`0x${string}` | null>(null);

  // Auto-select first employee when list loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeEmployees.length > 0 && !selectedWallet) {
      setSelectedWallet(activeEmployees[0].wallet); // eslint-disable-line react(set-state-in-effect)
    }
  }, [activeEmployees.length]);

  const isWrongChain = !isSupportedArcChain;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="size-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
          <CalendarDays className="size-8" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: 'var(--ink)' }}>Employee Attendance</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Connect your wallet to view & manage attendance.</p>
        </div>
        <ConnectKitButton />
      </div>
    );
  }

  if (isWrongChain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="size-10" style={{ color: 'var(--warning)' }} />
        <p className="font-semibold" style={{ color: 'var(--ink)' }}>Switch to {chainName}</p>
        <button
          onClick={() => switchChain({ chainId })}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          Switch Network
        </button>
      </div>
    );
  }

  if (!ATTENDANCE_ADDRESS) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <AlertCircle className="size-10" style={{ color: 'var(--warning)' }} />
        <p className="font-semibold" style={{ color: 'var(--ink)' }}>Attendance Contract Not Configured</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>VITE_ATTENDANCE_ADDRESS not set in .env</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Employee Attendance</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Data stored onchain — never lost even if you change browser.</p>
      </div>

      {/* Working days setting */}
      <WorkingDaysSetting company={address!} />

      {/* Employee selector */}
      {empLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="size-4 animate-spin" style={{ color: 'var(--muted)' }} />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading employees...</span>
        </div>
      ) : activeEmployees.length === 0 ? (
        <div className="rounded-2xl px-4 py-6 text-center space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Users className="size-8 mx-auto" style={{ color: 'var(--muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>No active employees</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Add employees in the Employees menu first.</p>
        </div>
      ) : (
        <EmployeeSelector
          employees={activeEmployees}
          selected={selectedWallet}
          onSelect={setSelectedWallet}
        />
      )}

      {/* Month navigator */}
      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          onClick={prevMonth}
          className="size-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'var(--surface-muted)' }}
        >
          <ChevronLeft className="size-4" style={{ color: 'var(--ink)' }} />
        </button>
        <div className="text-center">
          <p className="font-bold text-sm display" style={{ color: 'var(--ink)' }}>{MONTHS[month - 1]} {year}</p>
          {year === today.getFullYear() && month === today.getMonth() + 1 && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--accent)' }}>This month</p>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="size-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'var(--surface-muted)' }}
        >
          <ChevronRight className="size-4" style={{ color: 'var(--ink)' }} />
        </button>
      </div>

      {/* Calendar */}
      {selectedWallet && address ? (
        <CalendarView
          company={address}
          employee={selectedWallet}
          year={year}
          month={month}
        />
      ) : (
        <div className="rounded-2xl py-12 flex flex-col items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CalendarDays className="size-10" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Select an employee to view the attendance calendar.</p>
        </div>
      )}
    </div>
  );
}
