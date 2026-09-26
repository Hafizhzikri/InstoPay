import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  ExternalLink,
  UserPlus,
  Briefcase,
  Hash,
} from 'lucide-react';
import { useAccount, useSwitchChain } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { toast } from 'sonner';
import {
  useEmployees,
  useRegisterEmployee,
  useUpdateEmployee,
  useRemoveEmployee,
} from '../hooks/usePayrollContract';
import type { OnchainEmployee } from '../hooks/usePayrollContract';
import { buildTxExplorerUrl } from '@/onchain-facts';
import { useChain } from '../hooks/useChain';
import { getChainConfig } from '../contract';

// Name encoding: "Nama||Position||NIK"
const SEP = '||';
function encodeName(name: string, jabatan: string, nik: string): string {
  if (!jabatan && !nik) return name;
  return `${name}${SEP}${jabatan}${SEP}${nik}`;
}
function decodeName(raw: string): { name: string; jabatan: string; nik: string } {
  const parts = raw.split(SEP);
  if (parts.length === 3) return { name: parts[0], jabatan: parts[1], nik: parts[2] };
  return { name: raw, jabatan: '', nik: '' };
}

function parseOnchainError(error: unknown): string {
  const msg = (error as Error)?.message?.toLowerCase() ?? '';
  if (msg.includes('user rejected') || msg.includes('denied')) return 'Transaction cancelled.';
  if (msg.includes('insufficient')) return 'Insufficient balance.';
  if (msg.includes('alreadyregistered')) return 'Employee already registered.';
  if (msg.includes('zeroaddress')) return 'Wallet address cannot be empty.';
  if (msg.includes('zeroamount')) return 'Salary cannot be zero.';
  return 'Transaction failed. Please try again.';
}

// Bottom sheet
interface SheetProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode }
function BottomSheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.section
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)', maxHeight: '92dvh', overflowY: 'auto' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="w-10 h-1 rounded-full mx-auto absolute top-3 left-1/2 -translate-x-1/2" style={{ background: 'var(--border-strong)' }} />
              <p className="font-bold text-base mt-2" style={{ color: 'var(--ink)' }}>{title}</p>
              <button onClick={onClose} className="size-7 flex items-center justify-center rounded-full" style={{ background: 'var(--surface-muted)' }}>
                <X className="size-4" style={{ color: 'var(--muted)' }} />
              </button>
            </div>
            <div className="px-5 pb-8">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Input field
interface InputFieldProps {
  label: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  mono?: boolean; hint?: string;
}
function InputField({ label, icon, value, onChange, placeholder, type = 'text', inputMode, mono, hint }: InputFieldProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
        {icon}<span>{label}</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ${mono ? 'mono' : ''}`}
        style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
      />
      {hint && <p className="text-xs" style={{ color: 'var(--subtle)' }}>{hint}</p>}
    </div>
  );
}

// Employee card
function EmployeeCard({ emp, onEdit, onRemove }: { emp: OnchainEmployee; onEdit: (e: OnchainEmployee) => void; onRemove: (w: `0x${string}`) => void }) {
  const { name, jabatan, nik } = decodeName(emp.name);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--accent)' }}>
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{name}</p>
          {jabatan && (
            <div className="flex items-center gap-1 mt-0.5">
              <Briefcase className="size-3" style={{ color: 'var(--subtle)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{jabatan}</span>
            </div>
          )}
          <p className="text-xs mt-0.5 mono" style={{ color: 'var(--subtle)' }}>
            {emp.wallet.slice(0, 8)}...{emp.wallet.slice(-6)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: emp.active ? 'var(--success-soft)' : 'var(--surface-muted)',
              color: emp.active ? 'var(--success)' : 'var(--muted)',
            }}
          >
            {emp.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          {nik && (
            <div className="flex items-center gap-1">
              <Hash className="size-3" style={{ color: 'var(--subtle)' }} />
              <span className="text-xs mono" style={{ color: 'var(--muted)' }}>NIK {nik}</span>
            </div>
          )}
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Net Salary</p>
          <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
            {Number(emp.salaryNetFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onEdit(emp)} className="size-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-muted)' }}>
            <Pencil className="size-3.5" style={{ color: 'var(--muted)' }} />
          </button>
          <button onClick={() => onRemove(emp.wallet)} className="size-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--danger-soft)' }}>
            <Trash2 className="size-3.5" style={{ color: 'var(--danger)' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function Employees() {
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { chainId, chainName, isSupportedArcChain, isMainnet } = useChain();
  const { employees, isLoading, refetch } = useEmployees(address);
  const { payrollosAddress } = getChainConfig(chainId);
  const isContractMissing = isMainnet && !payrollosAddress;

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<OnchainEmployee | null>(null);
  const [_removeTarget, setRemoveTarget] = useState<`0x${string}` | null>(null);

  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formWallet, setFormWallet] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formActive, setFormActive] = useState(true);

  const { register, isPending: regPending, isConfirming: regConfirming, isSuccess: regSuccess, error: regError, reset: regReset, hash: regHash } = useRegisterEmployee();
  const { update, isPending: updPending, isConfirming: updConfirming, isSuccess: updSuccess, error: updError, reset: updReset, hash: updHash } = useUpdateEmployee();
  const { remove, isPending: remPending, isConfirming: remConfirming, isSuccess: remSuccess, error: remError, reset: remReset } = useRemoveEmployee();

  const prevRegSuccess = useRef(false);
  const prevUpdSuccess = useRef(false);
  const prevRemSuccess = useRef(false);

  const doClose = useCallback(() => setShowAdd(false), []);
  const doCloseEdit = useCallback(() => setEditTarget(null), []);
  const doCloseRemove = useCallback(() => setRemoveTarget(null), []);

  useEffect(() => {
    if (regSuccess && !prevRegSuccess.current) {
      prevRegSuccess.current = true;
      toast.success('Employee successfully registered on blockchain!');
      doClose(); void refetch();
    }
    if (!regSuccess) prevRegSuccess.current = false;
  });
  useEffect(() => {
    if (updSuccess && !prevUpdSuccess.current) {
      prevUpdSuccess.current = true;
      toast.success('Employee data updated successfully!');
      doCloseEdit(); void refetch();
    }
    if (!updSuccess) prevUpdSuccess.current = false;
  });
  useEffect(() => {
    if (remSuccess && !prevRemSuccess.current) {
      prevRemSuccess.current = true;
      toast.success('Employee removed successfully.');
      doCloseRemove(); remReset(); void refetch();
    }
    if (!remSuccess) prevRemSuccess.current = false;
  });

  const isWrongChain = !isSupportedArcChain;

  const filtered = employees.filter((e) => {
    const { name, jabatan, nik } = decodeName(e.name);
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || jabatan.toLowerCase().includes(q) || nik.includes(q) || e.wallet.toLowerCase().includes(q);
  });

  function openAdd() {
    setFormName(''); setFormPosition(''); setFormNik('');
    setFormWallet(''); setFormSalary(''); setFormActive(true);
    regReset(); setShowAdd(true);
  }
  function openEdit(emp: OnchainEmployee) {
    const { name, jabatan, nik } = decodeName(emp.name);
    setFormName(name); setFormPosition(jabatan); setFormNik(nik);
    setFormWallet(emp.wallet); setFormSalary(emp.salaryNetFormatted); setFormActive(emp.active);
    updReset(); setEditTarget(emp);
  }
  function closeAdd() { setShowAdd(false); regReset(); }
  function closeEdit() { setEditTarget(null); updReset(); }

  function handleRegister() {
    if (isWrongChain) { switchChain({ chainId }); return; }
    if (!formWallet.startsWith('0x') || formWallet.length !== 42) { toast.error('Invalid wallet address.'); return; }
    if (!formSalary || isNaN(Number(formSalary)) || Number(formSalary) <= 0) { toast.error('Salary must be greater than 0.'); return; }
    register(formWallet as `0x${string}`, formSalary, encodeName(formName.trim(), formPosition.trim(), formNik.trim()));
  }
  function handleUpdate() {
    if (isWrongChain) { switchChain({ chainId }); return; }
    if (!editTarget) return;
    update(editTarget.wallet, formSalary, encodeName(formName.trim(), formPosition.trim(), formNik.trim()), formActive);
  }
  function handleRemove(wallet: `0x${string}`) {
    if (isWrongChain) { switchChain({ chainId }); return; }
    setRemoveTarget(wallet); remove(wallet);
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect your wallet to view onchain employees.</p>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold display" style={{ color: 'var(--ink)' }}>Employees</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {isLoading ? 'Loading...' : `${employees.length} registered on blockchain`}
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={isContractMissing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      {/* Wrong chain */}
      {isWrongChain && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
          <AlertCircle className="size-4 shrink-0" />
          <span>Switch to {chainName} to perform transactions.</span>
          <button onClick={() => switchChain({ chainId })} className="ml-auto text-xs font-semibold">Switch</button>
        </div>
      )}

      {/* Mainnet contract not deployed */}
      {isContractMissing && (
        <div className="flex items-start gap-2 px-3 py-3 rounded-xl text-xs" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Contract not deployed on Arc Mainnet</p>
            <p className="mt-0.5">Deploy PayrollOS to Arc Mainnet, then add <code className="font-mono">VITE_PAYROLLOS_MAINNET_ADDRESS=0x...</code> to the <code className="font-mono">.env</code> file and restart the app.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Search className="size-4 shrink-0" style={{ color: 'var(--subtle)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, position, ID, or wallet..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--ink)' }}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-8" style={{ color: 'var(--muted)' }}>
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Reading from blockchain...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <UserPlus className="size-10" style={{ color: 'var(--subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {search ? 'Not found' : 'No employees registered yet'}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {filtered.map((emp) => (
              <EmployeeCard key={emp.wallet} emp={emp} onEdit={openEdit} onRemove={handleRemove} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Remove status */}
      {(remPending || remConfirming) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
          <Loader2 className="size-4 animate-spin" />
          <span>{remPending ? 'Confirming in wallet...' : 'Removing from blockchain...'}</span>
        </div>
      )}
      {remError && (
        <p className="text-xs px-1" style={{ color: 'var(--danger)' }}>{parseOnchainError(remError)}</p>
      )}

      {/* Add sheet */}
      <BottomSheet open={showAdd} onClose={closeAdd} title="Register Employee">
        <div className="space-y-4 mt-2">
          <InputField label="Full Name" icon={<UserPlus className="size-3.5" />} value={formName} onChange={setFormName} placeholder="Budi Santoso" />
          <InputField label="Position" icon={<Briefcase className="size-3.5" />} value={formPosition} onChange={setFormPosition} placeholder="Software Engineer" />
          <InputField label="NIK" icon={<Hash className="size-3.5" />} value={formNik} onChange={setFormNik} placeholder="3171XXXXXXXXXX0001" mono hint="Company Employee ID Number" />
          <InputField label="Wallet Address" value={formWallet} onChange={setFormWallet} placeholder="0x..." mono />
          <InputField label="Net Salary (USDC)" value={formSalary} onChange={setFormSalary} placeholder="1000.00" inputMode="decimal" />

          {regError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{parseOnchainError(regError)}</p>}
          {regSuccess && regHash && (
            <a
              href={buildTxExplorerUrl(chainId, regHash)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--success)' }}
            >
              <CheckCircle2 className="size-3.5" />
              Success · View on ArcScan
              <ExternalLink className="size-3" />
            </a>
          )}

          <button
            onClick={handleRegister}
            disabled={regPending || regConfirming}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', opacity: regPending || regConfirming ? 0.7 : 1 }}
          >
            {regPending ? <><Loader2 className="size-4 animate-spin" /> Confirming in wallet...</>
              : regConfirming ? <><Loader2 className="size-4 animate-spin" /> Saving to blockchain...</>
              : isWrongChain ? `Switch to ${chainName}`
              : 'Register on Blockchain'}
          </button>
        </div>
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet open={!!editTarget} onClose={closeEdit} title="Edit Employee">
        <div className="space-y-4 mt-2">
          <InputField label="Full Name" icon={<UserPlus className="size-3.5" />} value={formName} onChange={setFormName} placeholder="Budi Santoso" />
          <InputField label="Position" icon={<Briefcase className="size-3.5" />} value={formPosition} onChange={setFormPosition} placeholder="Software Engineer" />
          <InputField label="NIK" icon={<Hash className="size-3.5" />} value={formNik} onChange={setFormNik} placeholder="3171XXXXXXXXXX0001" mono />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Wallet</p>
            <p className="text-xs mono px-3 py-2 rounded-xl" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>{editTarget?.wallet}</p>
          </div>
          <InputField label="Net Salary (USDC)" value={formSalary} onChange={setFormSalary} placeholder="1000.00" inputMode="decimal" />
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Status</p>
            <button
              onClick={() => setFormActive(!formActive)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: formActive ? 'var(--success-soft)' : 'var(--surface-muted)',
                color: formActive ? 'var(--success)' : 'var(--muted)',
              }}
            >
              {formActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          {updError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{parseOnchainError(updError)}</p>}
          {updSuccess && updHash && (
            <a href={buildTxExplorerUrl(chainId, updHash)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--success)' }}>
              <CheckCircle2 className="size-3.5" />Saved · View on ArcScan<ExternalLink className="size-3" />
            </a>
          )}

          <button
            onClick={handleUpdate}
            disabled={updPending || updConfirming}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', opacity: updPending || updConfirming ? 0.7 : 1 }}
          >
            {updPending ? <><Loader2 className="size-4 animate-spin" /> Confirming in wallet...</>
              : updConfirming ? <><Loader2 className="size-4 animate-spin" /> Updating...</>
              : isWrongChain ? `Switch to ${chainName}`
              : 'Save Changes'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
