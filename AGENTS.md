# PayrollOS — InstoPay

> Built with Arc Studio - money-powered apps in minutes

## What This App Does

Onchain payroll management system on Arc Testnet. The owner registers employees (wallet address + net USDC salary) to a smart contract, approves USDC spending, then runs payroll which transfers USDC directly to each active employee wallet.

## Deployed Contracts

| Contract | Address | Chain | Explorer |
|---|---|---|---|
| InstoPay/PayrollOS (v6, ACTIVE) | 0xbf5888844ed7d8e2feb57cc1d405bd1cad8f85f6 | Arc Testnet | https://explorer.testnet.arc.io/address/0xbf5888844ed7d8e2feb57cc1d405bd1cad8f85f6 |
| PayrollOS (v5, deprecated) | 0x58cceb223184904cfb4cc58c8d1c47a4abfbc9cd | Arc Testnet | — |
| PayrollOS (v4, deprecated) | 0x9ead0a0417f76de9287c964b01fe8a38045c7973 | Arc Testnet | — |
| PayrollOS (v3, deprecated) | 0x05d5a01cfc6508b9dda2ebd6cc7ba1381af7889c | Arc Testnet | — |

### PayrollOS v6 Constructor Args
- `usdcToken`: 0x3600000000000000000000000000000000000000 (USDC on Arc Testnet via onchain-facts)
- No owner — fully multi-tenant, any wallet is its own company

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, artifact in `contracts/out/PayrollOS.sol/PayrollOS.json`.
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) at 0x3600000000000000000000000000000000000000 (from `@/onchain-facts`)
- Toasts: Sonner

## Attendance System

AttendanceOS contract deployed at `0x6c020b13c311da70558a417d4c8d3b1e343268b6` (Arc Testnet).
Env var: `VITE_ATTENDANCE_ADDRESS=0x6c020b13c311da70558a417d4c8d3b1e343268b6`

Status codes: 0=Belum, 1=Hadir, 2=Cuti, 3=Izin, 4=Tidak Masuk
Default working days: 26/bulan (configurable per company via `setWorkingDays`).
Proportional salary = (Hadir + Cuti + Izin) / workingDays × salaryNet
No attendance data recorded → full salary paid (safe default).

| Contract | Address | Chain | Explorer |
|---|---|---|---|
| AttendanceOS | 0x6c020b13c311da70558a417d4c8d3b1e343268b6 | Arc Testnet | https://explorer.testnet.arc.io/address/0x6c020b13c311da70558a417d4c8d3b1e343268b6 |

## Key Files

- `src/App.tsx` - Main app composition with error boundary
- `src/types.ts` - TypeScript types
- `src/contract.ts` - Contract address, ABI, USDC address
- `src/components/` - Layout, Dashboard, Employees, RunPayroll, History, Settings
- `src/hooks/usePayrollContract.ts` - All wagmi read/write hooks

## Name Encoding Convention

Contract stores a single `name` string. We encode jabatan & NIK:
- Format: `"Nama Lengkap||Jabatan||NIK"`
- Plain names (no separator) are treated as name-only for backward compat.

## To Run

```bash
bun install
bun run dev
```

## Arc Mainnet Contracts
- PayrollOS:    0x583F852E3D8017BaA214c9eeDCedD86c3825c57C
- AttendanceOS: 0x6A38F938cBEeC1db69B0D20D22D6831D0fB01c3E
- Explorer: https://explorer.arc.io
