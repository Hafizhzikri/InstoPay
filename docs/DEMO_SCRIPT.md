# InstoPay — Demo Script
### Circle Meeting | Step-by-step guide

---

## Before the Meeting (Checklist)

- [ ] Open instopayapp.vercel.app in Chrome
- [ ] MetaMask installed and unlocked
- [ ] Switch MetaMask to **Arc Testnet** (chainId: 5042002)
- [ ] Have at least **100 USDC** in your wallet (get from Arc Studio "Get test USDC")
- [ ] Pre-register 2–3 test employees with realistic names and salaries
- [ ] Have Arc Testnet Explorer open in another tab: explorer.testnet.arc.io
- [ ] Have GitHub repo open: github.com/Hafizhzikri/InstoPay

---

## Demo Script (4 minutes)

### Opening (30 sec)
> "InstoPay solves a simple but expensive problem: paying employees still takes 2–5 days and costs 1–3% in fees. We rebuilt payroll on Arc blockchain using USDC. Let me show you how it works."

---

### Scene 1 — The Dashboard (30 sec)

**Show:** instopayapp.vercel.app

**Say:**
> "This is InstoPay. The wallet is connected to Arc Testnet. You can see the total USDC disbursed, number of active employees, and payroll run history — all read directly from the smart contract, not from a database."

**Point to:** Total Disbursed card, employee count, payroll run count

---

### Scene 2 — Adding an Employee (1 min)

**Navigate to:** Employees → click "Add Employee"

**Fill in:**
- Name: `Sarah Johnson`
- Position: `Software Engineer`
- Employee ID: `EMP-2026-001`
- Wallet: `0x742d35Cc6634C0532925a3b8D4C9b55D35a9876` *(use a real test address)*
- Salary: `500` USDC

**Click:** "Register on Blockchain"

**Say:**
> "I'm registering Sarah as an employee. This transaction writes her wallet address and salary directly to the smart contract on Arc. No database, no backend — the blockchain is the source of truth."

**After MetaMask confirms:**
> "Done. That took about 2 seconds. Sarah's record is now permanently on-chain."

---

### Scene 3 — Running Payroll (2 min)

**Navigate to:** Run Payroll

**Say:**
> "Now let's pay everyone. I select the period — this is just a label that gets recorded on-chain for accounting purposes."

**Select period:** October 2026

**Check employees:** Select all active employees

**Point to summary:**
> "The contract calculates the total: 3 employees, 1,500 USDC total. My wallet balance is shown, and the current allowance is zero."

**Click "Approve USDC":**
> "First transaction: I'm authorizing the contract to move USDC from my wallet. This is the standard ERC-20 approve pattern — the contract never holds funds, it just gets permission to transfer."

*(Wait for MetaMask, confirm)*

**Click "Execute Payroll":**
> "Second transaction: the contract calls transferFrom for each selected employee. One transaction, three payments."

*(Wait for MetaMask, confirm)*

> "Done. 1,500 USDC just moved from my wallet to three employee wallets. Let's verify."

---

### Scene 4 — Verify on Explorer (30 sec)

**Navigate to:** History

**Show:** The completed payroll run card

**Click "View Transaction":**

*(Opens Arc Explorer)*

**Point to:**
- Status: ✅ Success
- Token Transfers tab: 3 USDC transfers
- Logs tab: `SalaryPaid` events with employee addresses and amounts

**Say:**
> "This is the immutable record. Every salary payment, every period, permanently on-chain. Any auditor, any employee, anyone can verify this. No spreadsheet, no trust required."

---

### Scene 5 — The Contract (optional, if engineers are interested)

**Open:** github.com/Hafizhzikri/InstoPay/blob/main/contracts/PayrollOS.sol

**Point to:**
> "The contract is multi-tenant — there's no global owner or admin. Every wallet that connects becomes its own isolated company. The contract is a public utility on Arc."

> "Key security features: ReentrancyGuard, per-transfer try/catch so one failed payment never blocks others, batch size capped at 50."

---

## Talking Points for Q&A

**"Why Arc instead of Ethereum or Base?"**
> Arc is the only chain where USDC is the native gas token. For a payroll system, this means employers pay fees in the same currency as salaries — no need to hold ETH just to pay gas. Plus sub-second finality and predictable fees.

**"How does the employer load USDC?"**
> Currently via any wallet. The v2 roadmap includes Circle Onramp Kit integration so companies can load USDC directly with a bank transfer or card.

**"What about companies without crypto wallets?"**
> That's exactly what Circle Developer-Controlled Wallets solves. In v2, we can abstract the wallet entirely — the employer just logs in with email, Circle manages the wallet custody.

**"Is this audited?"**
> Built-in security review caught and fixed two critical vulnerabilities before deployment: an unbounded loop DoS and a batch-reverting-on-single-failure issue. Not a formal third-party audit yet — that's on the roadmap for mainnet production use.

**"How does it handle taxes?"**
> Net salary only currently — the employer is responsible for calculating net pay after taxes. A tax calculation module is on the v2 roadmap for specific jurisdictions.

**"What's the business model?"**
> Three options under consideration: (1) small protocol fee per payroll run, (2) premium features (multi-sig, scheduling, analytics) on subscription, (3) white-label licensing to HR software companies. Open to Circle's input on what fits the ecosystem best.

---

## Key Numbers to Remember

| Metric | Value |
|---|---|
| Settlement time | < 3 seconds |
| Gas cost per payroll run (Arc) | ~$0.005 |
| Traditional wire transfer fee | $25–50 |
| Traditional payroll settlement | 2–5 business days |
| Contract deployed on | Arc Testnet + Mainnet |
| Lines of Solidity | ~400 |
| Time to build with Arc Studio | 1 session |

---

## After the Meeting

Send a follow-up email with:
1. Link to live demo: instopayapp.vercel.app
2. Link to GitHub: github.com/Hafizhzikri/InstoPay
3. This pitch doc as PDF
4. Your vision for what a Circle partnership could look like

Good luck, Ezza. You built something real.
