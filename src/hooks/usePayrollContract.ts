/**
 * Hooks for PayrollOS — multi-chain (Arc Testnet & Arc Mainnet).
 * chainId is read dynamically from the connected wallet via useChain().
 */
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { erc20Abi, parseUnits, formatUnits } from 'viem';
import { arcTestnet } from 'viem/chains';
import { arcMainnet } from '../config';
import {
  PAYROLLOS_ABI,
  USDC_DECIMALS,
  ARC_TESTNET_CHAIN_ID,
  ARC_MAINNET_CHAIN_ID,
  getChainConfig,
} from '../contract';
import { useChain } from './useChain';

// ── Add chain to wallet helper ────────────────────────────────────────────────
// Only adds the chain matching the requested chainId — never forces a switch.
async function ensureChain(chainId: number): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) return;
  // Pick the correct chain definition
  const chain = chainId === ARC_MAINNET_CHAIN_ID ? arcMainnet : arcTestnet;
  // Only call wallet_addEthereumChain if the chainId matches what we want
  if (chain.id !== chainId) return; // safety: never add wrong chain
  try {
    await (window.ethereum as {
      request: (args: { method: string; params: unknown[] }) => Promise<unknown>
    }).request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chainId.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.http,
        blockExplorerUrls: [chain.blockExplorers.default.url],
      }],
    });
  } catch { /* already added or unsupported */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OnchainEmployee {
  wallet: `0x${string}`;
  salaryNet: bigint;
  name: string;
  active: boolean;
  salaryNetFormatted: string;
}

export interface OnchainPayrollRun {
  runId: bigint;
  period: string;
  totalAmount: bigint;
  employeeCount: bigint;
  timestamp: bigint;
  totalAmountFormatted: string;
  date: Date;
}

// ── Read hooks ────────────────────────────────────────────────────────────────

export function useEmployees(company: `0x${string}` | undefined) {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);

  const { data, isLoading, refetch, error } = useReadContract({
    address: payrollosAddress,
    abi: PAYROLLOS_ABI,
    functionName: 'getEmployees',
    args: company ? [company] : undefined,
    query: { enabled: !!company && !!payrollosAddress },
    chainId,
  });

  const employees: OnchainEmployee[] = data
    ? (data as { wallet: `0x${string}`; salaryNet: bigint; name: string; active: boolean }[]).map(
        (e) => ({
          wallet: e.wallet,
          salaryNet: e.salaryNet,
          name: e.name,
          active: e.active,
          salaryNetFormatted: formatUnits(e.salaryNet, USDC_DECIMALS),
        })
      )
    : [];

  return { employees, isLoading, refetch, error };
}

export function useRunCount(company: `0x${string}` | undefined) {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);

  const { data, isLoading } = useReadContract({
    address: payrollosAddress,
    abi: PAYROLLOS_ABI,
    functionName: 'getRunCount',
    args: company ? [company] : undefined,
    query: { enabled: !!company && !!payrollosAddress },
    chainId,
  });
  return { runCount: data as bigint | undefined, isLoading };
}

export function usePayrollRun(company: `0x${string}` | undefined, runId: bigint | undefined) {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);

  const { data, isLoading } = useReadContract({
    address: payrollosAddress,
    abi: PAYROLLOS_ABI,
    functionName: 'getPayrollRun',
    args: company && runId !== undefined ? [company, runId] : undefined,
    query: { enabled: !!company && runId !== undefined && !!payrollosAddress },
    chainId,
  });

  let run: OnchainPayrollRun | undefined;
  if (data) {
    const r = data as { runId: bigint; period: string; totalAmount: bigint; employeeCount: bigint; timestamp: bigint };
    run = {
      runId: r.runId,
      period: r.period,
      totalAmount: r.totalAmount,
      employeeCount: r.employeeCount,
      timestamp: r.timestamp,
      totalAmountFormatted: formatUnits(r.totalAmount, USDC_DECIMALS),
      date: new Date(Number(r.timestamp) * 1000),
    };
  }
  return { run, isLoading };
}

export function useTotalDisbursed(company: `0x${string}` | undefined) {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);

  const { data, isLoading } = useReadContract({
    address: payrollosAddress,
    abi: PAYROLLOS_ABI,
    functionName: 'getTotalDisbursed',
    args: company ? [company] : undefined,
    query: { enabled: !!company && !!payrollosAddress },
    chainId,
  });
  const raw = data as bigint | undefined;
  return {
    totalDisbursed: raw,
    totalDisbursedFormatted: raw ? formatUnits(raw, USDC_DECIMALS) : '0',
    isLoading,
  };
}

export function useActiveEmployeeCount(company: `0x${string}` | undefined) {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);

  const { data, isLoading } = useReadContract({
    address: payrollosAddress,
    abi: PAYROLLOS_ABI,
    functionName: 'getActiveEmployeeCount',
    args: company ? [company] : undefined,
    query: { enabled: !!company && !!payrollosAddress },
    chainId,
  });
  return { activeCount: data as bigint | undefined, isLoading };
}

export function useOwnerUsdcBalance() {
  const { address } = useAccount();
  const { chainId } = useChain();
  const { usdcAddress } = getChainConfig(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId,
  });
  return {
    balance: data,
    balanceFormatted: data ? formatUnits(data, USDC_DECIMALS) : '0',
    isLoading,
    refetch,
  };
}

export function useUsdcAllowance() {
  const { address } = useAccount();
  const { chainId } = useChain();
  const { usdcAddress, payrollosAddress } = getChainConfig(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, payrollosAddress] : undefined,
    query: { enabled: !!address && !!payrollosAddress },
    chainId,
  });
  return {
    allowance: data,
    allowanceFormatted: data ? formatUnits(data, USDC_DECIMALS) : '0',
    isLoading,
    refetch,
  };
}

// ── Write hooks ───────────────────────────────────────────────────────────────

export function useRegisterEmployee() {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = (wallet: `0x${string}`, salaryNet: string, name: string) => {
    if (!payrollosAddress) { console.error('PayrollOS contract not deployed on this chain. Set VITE_PAYROLLOS_MAINNET_ADDRESS in .env'); return; }
    const salaryRaw = parseUnits(salaryNet, USDC_DECIMALS);
    void ensureChain(chainId).then(() => {
      writeContract({ address: payrollosAddress, abi: PAYROLLOS_ABI, chainId, functionName: 'registerEmployee', args: [wallet, salaryRaw, name, true] });
    });
  };
  return { register, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useUpdateEmployee() {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const update = (wallet: `0x${string}`, salaryNet: string, name: string, active: boolean) => {
    const salaryRaw = parseUnits(salaryNet, USDC_DECIMALS);
    void ensureChain(chainId).then(() => {
      writeContract({ address: payrollosAddress, abi: PAYROLLOS_ABI, chainId, functionName: 'updateEmployee', args: [wallet, salaryRaw, name, active] });
    });
  };
  return { update, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRemoveEmployee() {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const remove = (wallet: `0x${string}`) => {
    void ensureChain(chainId).then(() => {
      writeContract({ address: payrollosAddress, abi: PAYROLLOS_ABI, chainId, functionName: 'removeEmployee', args: [wallet] });
    });
  };
  return { remove, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useApproveUsdc() {
  const { chainId } = useChain();
  const { usdcAddress, payrollosAddress } = getChainConfig(chainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amount: bigint) => {
    void ensureChain(chainId).then(() => {
      writeContract({ address: usdcAddress, abi: erc20Abi, chainId, functionName: 'approve', args: [payrollosAddress, amount] });
    });
  };
  return { approve, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRunPayroll() {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const runPayroll = (period: string) => {
    void ensureChain(chainId).then(() => {
      writeContract({ address: payrollosAddress, abi: PAYROLLOS_ABI, chainId, functionName: 'runPayroll', args: [period, 0n, 0n] });
    });
  };
  return { runPayroll, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRunPayrollSelected() {
  const { chainId } = useChain();
  const { payrollosAddress } = getChainConfig(chainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const runPayrollSelected = (period: string, wallets: `0x${string}`[]) => {
    void ensureChain(chainId).then(() => {
      writeContract({ address: payrollosAddress, abi: PAYROLLOS_ABI, chainId, functionName: 'runPayrollSelected', args: [period, wallets] });
    });
  };
  return { runPayrollSelected, hash, isPending, isConfirming, isSuccess, error, reset };
}

// Re-export chain IDs for convenience
export { ARC_TESTNET_CHAIN_ID, ARC_MAINNET_CHAIN_ID };
