import artifact from '../contracts/out/PayrollOS.sol/PayrollOS.json';
import attendanceArtifact from '../contracts/out/AttendanceOS.sol/AttendanceOS.json';
import { getUsdc } from '@/onchain-facts';

// ── Chain IDs ────────────────────────────────────────────────────────────────
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_MAINNET_CHAIN_ID = 5042;

// ── ABIs ─────────────────────────────────────────────────────────────────────
export const PAYROLLOS_ABI       = artifact.abi;
export const ATTENDANCEOS_ABI    = attendanceArtifact.abi;

// ── Contract addresses per chain ─────────────────────────────────────────────
// PayrollOS — same bytecode, deployed at different addresses per chain
// Testnet:  deployed by Arc Studio platform deployer (existing)
// Mainnet:  must be deployed by the user — set VITE_PAYROLLOS_MAINNET_ADDRESS in .env
const PAYROLLOS_TESTNET  = '0xbf5888844ed7d8e2feb57cc1d405bd1cad8f85f6' as const;
const PAYROLLOS_MAINNET  = (import.meta.env.VITE_PAYROLLOS_MAINNET_ADDRESS ?? '') as `0x${string}`;

// AttendanceOS — same pattern
const ATTENDANCE_TESTNET = (import.meta.env.VITE_ATTENDANCE_ADDRESS ?? '') as `0x${string}`;
const ATTENDANCE_MAINNET = (import.meta.env.VITE_ATTENDANCE_MAINNET_ADDRESS ?? '') as `0x${string}`;

// ── Per-chain config helper ───────────────────────────────────────────────────
export function getChainConfig(chainId: number) {
  const isMainnet = chainId === ARC_MAINNET_CHAIN_ID;

  const payrollosAddress   = isMainnet ? PAYROLLOS_MAINNET  : PAYROLLOS_TESTNET;
  const attendanceAddress  = isMainnet ? ATTENDANCE_MAINNET : ATTENDANCE_TESTNET;

  const usdcFact = getUsdc(chainId) ?? getUsdc(ARC_TESTNET_CHAIN_ID)!;

  return {
    chainId,
    isMainnet,
    payrollosAddress,
    attendanceAddress,
    usdcAddress:   usdcFact.address as `0x${string}`,
    usdcDecimals:  usdcFact.decimals,
    explorerBase:  isMainnet ? 'https://explorer.arc.io' : 'https://explorer.testnet.arc.io',
    chainLabel:    isMainnet ? 'Arc Mainnet' : 'Arc Testnet',
  };
}

// ── Legacy testnet exports (backward compat — hooks will use getChainConfig) ─
export const PAYROLLOS_ADDRESS = PAYROLLOS_TESTNET;
export const USDC_ADDRESS      = (() => {
  const f = getUsdc(ARC_TESTNET_CHAIN_ID);
  if (!f) throw new Error('USDC not on Arc Testnet');
  return f.address as `0x${string}`;
})();
export const USDC_DECIMALS = 6;

export const PAYROLLOS = {
  address: PAYROLLOS_TESTNET,
  abi: PAYROLLOS_ABI,
} as const;
