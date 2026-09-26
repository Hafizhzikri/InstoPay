/**
 * Hooks for AttendanceOS — multi-chain (Arc Testnet & Arc Mainnet).
 * Multi-tenant: every wallet is its own "company".
 * Status codes: 0=Belum, 1=Hadir, 2=Cuti, 3=Izin, 4=Absen
 */
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { useState, useCallback } from 'react';
import { getChainConfig } from '../contract';
import { useChain } from './useChain';
import ATTENDANCE_ARTIFACT from '../../contracts/out/AttendanceOS.sol/AttendanceOS.json';

// Testnet address (fallback) — mainnet address comes from .env
export const ATTENDANCE_ADDRESS = import.meta.env.VITE_ATTENDANCE_ADDRESS as `0x${string}`;
export const ATTENDANCE_ABI = ATTENDANCE_ARTIFACT.abi;

// Dynamic helper — returns the contract address for the active chain
function useAttendanceAddress(): `0x${string}` {
  const { chainId } = useChain();
  return getChainConfig(chainId).attendanceAddress;
}

export const ATTENDANCE_CONTRACT = {
  address: ATTENDANCE_ADDRESS,
  abi: ATTENDANCE_ABI,
} as const;

// ── Status constants ──────────────────────────────────────────────────────────
export const STATUS_NONE  = 0;
export const STATUS_HADIR = 1;
export const STATUS_CUTI  = 2;
export const STATUS_IZIN  = 3;
export const STATUS_ABSEN = 4;

export type AttendanceStatus = 0 | 1 | 2 | 3 | 4;

export interface AttendanceStatusMeta {
  label: string;
  short: string;
  color: string;
  bg: string;
  emoji: string;
}

export const STATUS_META: Record<number, AttendanceStatusMeta> = {
  0: { label: 'Not Set',  short: '-',  color: 'var(--muted)',   bg: 'var(--surface-muted)', emoji: '—'  },
  1: { label: 'Present', short: 'P',  color: '#16a34a',        bg: '#dcfce7',               emoji: '✓'  },
  2: { label: 'Leave',   short: 'L',  color: '#2563eb',        bg: '#dbeafe',               emoji: '⛱'  },
  3: { label: 'Excused', short: 'E',  color: '#d97706',        bg: '#fef3c7',               emoji: '📝' },
  4: { label: 'Absent',  short: 'X',  color: '#dc2626',        bg: '#fee2e2',               emoji: '✗'  },
};

// ── Summary type ──────────────────────────────────────────────────────────────
export interface AttendanceSummary {
  hadir: number;
  cuti: number;
  izin: number;
  absen: number;
  total: number; // hadir + cuti + izin + absen (days with any record)
}

// ── Read: monthly attendance (31-day array) ───────────────────────────────────
export function useMonthAttendance(
  company: `0x${string}` | undefined,
  employee: `0x${string}` | undefined,
  year: number,
  month: number // 1-12
) {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const { data, isLoading, refetch } = useReadContract({
    address: addr, abi: ATTENDANCE_ABI,
    functionName: 'getMonthAttendance',
    args: company && employee ? [company, employee, year, month] : undefined,
    query: { enabled: !!company && !!employee && !!addr },
    chainId,
  });

  const days: AttendanceStatus[] = data
    ? (data as readonly number[]).map((s) => (s as AttendanceStatus))
    : (Array.from({ length: 31 }, () => 0));

  return { days, isLoading, refetch };
}

// ── Read: monthly summary ─────────────────────────────────────────────────────
export function useMonthSummary(
  company: `0x${string}` | undefined,
  employee: `0x${string}` | undefined,
  year: number,
  month: number
) {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const { data, isLoading, refetch } = useReadContract({
    address: addr, abi: ATTENDANCE_ABI,
    functionName: 'getMonthSummary',
    args: company && employee ? [company, employee, year, month] : undefined,
    query: { enabled: !!company && !!employee && !!addr },
    chainId,
  });

  const summary: AttendanceSummary = data
    ? {
        hadir: Number((data as [bigint, bigint, bigint, bigint])[0]),
        cuti:  Number((data as [bigint, bigint, bigint, bigint])[1]),
        izin:  Number((data as [bigint, bigint, bigint, bigint])[2]),
        absen: Number((data as [bigint, bigint, bigint, bigint])[3]),
        total: 0,
      }
    : { hadir: 0, cuti: 0, izin: 0, absen: 0, total: 0 };

  summary.total = summary.hadir + summary.cuti + summary.izin + summary.absen;

  return { summary, isLoading, refetch };
}

// ── Read: working days ────────────────────────────────────────────────────────
export function useWorkingDays(company: `0x${string}` | undefined) {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const { data, isLoading } = useReadContract({
    address: addr, abi: ATTENDANCE_ABI,
    functionName: 'getWorkingDays',
    args: company ? [company] : undefined,
    query: { enabled: !!company && !!addr },
    chainId,
  });
  return { workingDays: data ? Number(data) : 26, isLoading };
}

// ── Write: set single attendance ──────────────────────────────────────────────
export function useSetAttendance() {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash, chainId });

  const setAttendance = useCallback(async (
    employee: `0x${string}`,
    year: number,
    month: number,
    day: number,
    status: AttendanceStatus
  ) => {
    setError(null);
    setIsPending(true);
    try {
      const txHash = await writeContractAsync({
        address: addr, abi: ATTENDANCE_ABI,
        functionName: 'setAttendance',
        args: [employee, year, month, day, status],
        chainId,
      });
      setHash(txHash);
    } catch (e) {
      setError(e);
    } finally {
      setIsPending(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeContractAsync, addr, chainId]);

  return { setAttendance, hash, isPending, isConfirming, isSuccess, error };
}

// ── Write: batch set attendance ───────────────────────────────────────────────
export function useBatchSetAttendance() {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash, chainId });

  const batchSet = useCallback(async (
    employee: `0x${string}`,
    year: number,
    month: number,
    days: number[],
    statuses: AttendanceStatus[]
  ) => {
    setError(null);
    setIsPending(true);
    try {
      const txHash = await writeContractAsync({
        address: addr, abi: ATTENDANCE_ABI,
        functionName: 'setAttendanceBatch',
        args: [employee, year, month, days, statuses],
        chainId,
      });
      setHash(txHash);
    } catch (e) {
      setError(e);
    } finally {
      setIsPending(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeContractAsync, addr, chainId]);

  return { batchSet, hash, isPending, isConfirming, isSuccess, error };
}

// ── Write: set working days ───────────────────────────────────────────────────
export function useSetWorkingDays() {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash, chainId });

  const setWorkingDays = useCallback(async (days: number) => {
    setError(null);
    setIsPending(true);
    try {
      const txHash = await writeContractAsync({
        address: addr, abi: ATTENDANCE_ABI,
        functionName: 'setWorkingDays',
        args: [days],
        chainId,
      });
      setHash(txHash);
    } catch (e) {
      setError(e);
    } finally {
      setIsPending(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeContractAsync, addr, chainId]);

  return { setWorkingDays, isPending, isConfirming, isSuccess, error };
}

// ── Utility: fetch all employees' month attendance (used in RunPayroll) ───────
export function useAllEmployeesMonthAttendance(
  company: `0x${string}` | undefined,
  employeeWallets: `0x${string}`[],
  year: number,
  month: number
) {
  const { chainId } = useChain();
  const addr = useAttendanceAddress();
  const publicClient = usePublicClient({ chainId });
  const [data, setData] = useState<Record<string, AttendanceSummary>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Stable key for wallet list to avoid re-render on every render
  const walletsKey = employeeWallets.join(',');

  const refetch = useCallback(async () => {
    if (!publicClient || !company || !addr || employeeWallets.length === 0) return;
    setIsLoading(true);
    try {
      const results = await Promise.all(
        employeeWallets.map((wallet) =>
          publicClient.readContract({
            address: addr, abi: ATTENDANCE_ABI,
            functionName: 'getMonthSummary',
            args: [company, wallet, year, month],
          }).then((res) => {
            const raw = res as readonly [bigint, bigint, bigint, bigint];
            const summary: AttendanceSummary = {
              hadir: Number(raw[0]),
              cuti:  Number(raw[1]),
              izin:  Number(raw[2]),
              absen: Number(raw[3]),
              total: 0,
            };
            summary.total = summary.hadir + summary.cuti + summary.izin + summary.absen;
            return { wallet, summary };
          }).catch(() => ({
            wallet,
            summary: { hadir: 0, cuti: 0, izin: 0, absen: 0, total: 0 },
          }))
        )
      );
      const map: Record<string, AttendanceSummary> = {};
      results.forEach(({ wallet, summary }) => { map[wallet.toLowerCase()] = summary; });
      setData(map);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, company, walletsKey, year, month, addr]);

  return { attendanceData: data, isLoading, refetch };
}
