# InstoPay — Onchain Payroll Infrastructure
### Presentation for Circle × Arc Studio Meeting
**Monday, October 2026 | Dave Musicant (Sr. Director, Engineering, Circle)**

---

## 1. The Problem

Every month, millions of companies run payroll through:
- Banks with **2–5 day settlement delays**
- Intermediaries that charge **1–3% fees per transaction**
- Opaque systems with **no verifiable audit trail**
- Cross-border payments that cost **$25–50 per transfer**

For employees in emerging markets (Southeast Asia, Africa, Latin America), waiting 3–5 days for salary — or losing 3% to fees — is not a minor inconvenience. It is a real economic problem.

> **The core question: Why is paying someone still a 3-day process in 2026?**

---

## 2. The Solution — InstoPay

**InstoPay** is an onchain payroll management system built on Arc blockchain, using USDC as the payment currency.

**One sentence:** InstoPay lets any company register employees and pay their salaries directly to employee wallets in a single blockchain transaction — no banks, no intermediaries, no delays.

### Key Properties
| Property | Traditional Payroll | InstoPay |
|---|---|---|
| Settlement time | 2–5 business days | < 3 seconds |
| Transaction fee | 1–3% | ~$0.001 gas (Arc) |
| Audit trail | Internal database | Public blockchain |
| Intermediaries | 3–5 parties | 0 |
| Cross-border | Complex, expensive | Same as domestic |
| Custody | Bank holds funds | Employer wallet only |

---

## 3. Why Arc + USDC?

This is the critical technical decision that makes InstoPay viable.

### Why USDC?
- **Stable value** — employees receive exactly what they're owed, no volatility risk
- **Global** — same USDC works in Jakarta, Lagos, São Paulo, New York
- **Circle-issued** — regulated, audited, redeemable 1:1 with USD

### Why Arc?
Arc is the only blockchain where **USDC is the native gas token**. This has two major implications for payroll:

1. **Predictable costs** — employers pay gas in USDC, the same currency as salaries. No need to hold ETH or any other volatile token just to pay gas fees.
2. **Sub-second finality** — Arc's fast finality means salary confirmation in < 1 second, not 12+ seconds on Ethereum mainnet.
3. **Stable fees** — Arc's fee model is predictable, making payroll cost forecasting straightforward.

> For a payroll system, predictability of cost and time is everything. Arc + USDC is the only combination that gives us both.

---

## 4. Architecture

### Smart Contract: Multi-Tenant Design
```
Every wallet = its own company
No global admin, no platform custody
```

The `PayrollOS` contract on Arc is **multi-tenant**: any wallet that connects becomes its own isolated "company." There is no platform owner or admin. The contract is a public utility.

```solidity
// Core flow
registerEmployee(wallet, salaryNet, name, active)
  → stored in mapping[msg.sender][wallet]

runPayrollSelected(period, wallets[])
  → USDC.transferFrom(employer, employee, salary)
  → emits SalaryPaid event per employee
  → stores PayrollRunData onchain
```

**Security properties:**
- `ReentrancyGuard` on all fund-moving functions
- Per-transfer `try/catch` — one failed transfer never blocks others
- Batch size capped at 50 employees (gas safety)
- No fund custody — USDC goes directly from employer to employee

### Frontend: React + wagmi + ConnectKit
- Mobile-first responsive design
- Connect any EVM wallet (MetaMask, WalletConnect)
- Real-time onchain data via wagmi hooks
- Payroll history stored permanently on blockchain

### Deployed Contracts
| Network | Address |
|---|---|
| Arc Testnet | `0xbf5888844ed7d8e2feb57cc1d405bd1cad8f85f6` |
| Arc Mainnet | `0x583F852E0b2Bb39B2A879E0B2CdEb1bAbC5Cbe4` |

---

## 5. Live Demo Flow

**What we will show in the meeting:**

### Step 1 — Connect Wallet (30 seconds)
- Open instopayapp.vercel.app
- Click "Connect Wallet" → MetaMask
- Dashboard shows live USDC balance from Arc Testnet

### Step 2 — Register an Employee (1 minute)
- Go to Employees → Add Employee
- Fill: Name, Position, Employee ID, Wallet Address, Net Salary (USDC)
- Click "Register on Blockchain"
- MetaMask confirmation → transaction confirmed in < 3 seconds
- Employee appears in the list, data read directly from smart contract

### Step 3 — Run Payroll (2 minutes)
- Go to Run Payroll
- Select period (e.g. "October 2026")
- Select which employees to pay (checkbox per employee)
- See total USDC required
- Step 1: Approve USDC → MetaMask → confirmed
- Step 2: Execute Payroll → MetaMask → confirmed
- Success: USDC transferred directly to employee wallets

### Step 4 — Verify on Explorer (30 seconds)
- Go to History
- See the payroll run: period, total, employee count
- Click "View Transaction" → Arc Testnet Explorer
- Show: transaction status, token transfers, event logs (SalaryPaid)

**Total demo time: ~4 minutes**

---

## 6. Market Opportunity

### Primary Market: SMEs in Emerging Markets
- **560 million** SMEs globally (IFC estimate)
- Average payroll: 5–50 employees
- Most don't have access to affordable cross-border payment rails
- USDC adoption growing fastest in Southeast Asia, Africa, LatAm

### Secondary Market: Remote-First Companies
- Distributed teams across multiple countries
- Traditional payroll requires separate bank accounts per country
- InstoPay: one transaction, all employees, regardless of location

### Tertiary Market: DAOs and Web3 Organizations
- Already use USDC for treasury management
- Need a structured, auditable payroll system
- InstoPay is the natural fit

---

## 7. Traction & Progress

Built entirely using **Arc Studio** in **one session**:

- ✅ Multi-tenant smart contract deployed on Arc Testnet + Mainnet
- ✅ Full frontend with employee management, payroll execution, history
- ✅ Attendance tracking module (AbsensiOS contract)
- ✅ Mobile-responsive design
- ✅ Live at instopayapp.vercel.app
- ✅ Open source: github.com/Hafizhzikri/InstoPay

**What Arc Studio enabled:**
- Smart contract written, audited, and deployed without manual Foundry setup
- Security review caught and fixed 2 critical vulnerabilities before deployment
- Full-stack onchain app from idea to live product in hours, not weeks

---

## 8. What We Need from Circle

### 1. Technical Partnership
- Access to Circle's developer resources for USDC integration
- Guidance on Circle's Payroll/Payments API if applicable
- Connection to Circle's enterprise BD team for pilot customers

### 2. Go-to-Market Support
- Feature in Circle's builder spotlight / case studies
- Introduction to companies exploring USDC payroll solutions
- Arc ecosystem grant consideration

### 3. Product Feedback
- How can InstoPay better leverage Circle's product suite?
- Is there appetite for a Circle-backed payroll SDK built on top of InstoPay's architecture?

---

## 9. Vision: Where InstoPay Goes

**v1 (Now):** Any company can run onchain payroll with USDC on Arc

**v2 (Q1 2027):**
- Attendance-based payroll calculation (already built: AbsensiOS)
- Multi-signature payroll approval (CFO + HR must both sign)
- Scheduled recurring payroll (Chainlink Automation)

**v3 (2027):**
- Employee self-service portal (view payslips, claim pending salary)
- Cross-chain payroll (CCTP — pay employees on Base, Arbitrum, etc.)
- Circle Developer-Controlled Wallets for companies without crypto wallets
- Fiat onramp integration (company loads USDC via Circle Onramp Kit)

**Ultimate vision:** InstoPay becomes the **Stripe Payroll for Web3** — the default infrastructure layer for any company that wants to pay employees in USDC, globally, instantly.

---

## 10. Why Now

- USDC adoption is at an all-time high globally
- Regulatory clarity for stablecoins improving in major markets
- Arc provides the technical foundation that makes this economically viable
- Remote work has created massive demand for borderless payroll
- Arc Studio makes it possible for a single builder to ship production-grade onchain infrastructure

---

## Contact

**Builder:** Ezza Susu Sgm
**Email:** ezzasususgm@gmail.com
**Project:** [instopayapp.vercel.app](https://instopayapp.vercel.app)
**GitHub:** [github.com/Hafizhzikri/InstoPay](https://github.com/Hafizhzikri/InstoPay)
**Built with:** Arc Studio by Circle
