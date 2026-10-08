# KUDEX PROTOCOL: AUTONOMOUS CONFIDENTIAL SETTLEMENT & AGENTIC RFQ MARKETPLACE

Kudex is an autonomous confidential settlement layer and agent-native RFQ marketplace engineered for Portaldot Network V3.0 EVM (Chain ID 8890). The protocol unifies fractionalized Real World Asset (RWA) vaults, client-side Zero-Knowledge commitments, Default-as-a-Service (DaaS) automated debt restructuring, cross-chain solver liquidity, and ERC-7579 zero-popup session key execution.

---

## 1. ARCHITECTURAL HIGHLIGHTS

### 1.1 Portaldot Network V3.0 EVM Native Integration
- **Chain ID:** 8890
- **Native Currency:** Portaldot Token (POT)
- **Token Precision:** Strictly 14 Decimals (1 POT = 10^14 base units)
- **ERC-20 Stablecoins:** 6 Decimals (pUSD)
- **Standard Tokens:** 18 Decimals
- **Arithmetic Safety:** 100% native BigInt arithmetic across both Solidity contracts and TypeScript interfaces. Zero floating-point calculations on on-chain values.

### 1.2 Confidential ERC-4626 Shielded Vaults (`contracts/src/KudexVault.sol`)
- Integrates Snarkjs-compatible `Groth16Verifier.sol` for client-side Zero-Knowledge note validation.
- Emits cryptographic commitment and nullifier events (`NoteShielded`, `NoteSpent`).
- Tracks on-chain risk score basis points (0 to 10,000) and triggers automated default freezing.

### 1.3 Agentic RFQ Settlement Router (`contracts/src/KudexRFQMarket.sol`)
- Atomic settlement router executing intent-centric order matching between takers and solvers.
- Prevents MEV sandwiching and front-running via off-chain signed orders and single-block atomic fills.
- Supports order nonces and granular cancellations.

### 1.4 Portaldot Default-as-a-Service (DaaS) Hook (`contracts/src/KudexDaaSAdapter.sol`)
- Automated credit surveillance monitoring RWA collateral ratios and solvency health factors.
- Triggers algorithmic liquidation cascades and debt restructuring when risk scores exceed the 8,500 bps threshold.

### 1.5 Autonomous Agent Copilot & Generative UI
- Decomposes natural language commands into type-safe EVM calldata via Vercel AI SDK streaming endpoints.
- Pre-Flight invariant simulator evaluates state diffs, spend ceilings, and reentrancy vectors before transaction submission.
- Dynamically streams interactive execution cards: `RFQQuoteCard`, `PreFlightSimCard`, and `ShieldReceiptCard`.

---

## 2. REPOSITORY REPOSITORY TOPOLOGY

```
kudex/
├── .antigravityrules        # Strict engineering directives & rules
├── README.md                # System documentation
├── contracts/
│   ├── foundry.toml         # Foundry configuration (solc 0.8.24, Cancun EVM)
│   ├── src/
│   │   ├── KudexVault.sol   # ERC-4626 Shielded Pool + ZK Verifier
│   │   ├── KudexRFQMarket.sol # Agent RFQ Atomic Settlement Router
│   │   ├── KudexDaaSAdapter.sol # Portaldot Default-as-a-Service Hook
│   │   └── verifiers/
│   │       └── Groth16Verifier.sol # Snarkjs-compatible ZK Verifier
│   └── test/
│       ├── KudexVault.t.sol
│       ├── KudexRFQMarket.t.sol
│       └── KudexDaaSAdapter.t.sol
├── public/
│   ├── favicon.ico
│   ├── logo.svg             # Vector brand logo (Light)
│   └── logo-dark.svg        # Vector brand logo (Dark)
└── src/
    ├── app/
    │   ├── api/chat/route.ts # Vercel AI SDK Agent Tool Calling Route
    │   ├── layout.tsx       # Root Layout with Theme & Web3 Providers
    │   ├── page.tsx         # Enterprise Landing Page
    │   └── dashboard/
    │       ├── layout.tsx   # Modulify-Inspired App Shell
    │       ├── page.tsx     # Main Analytics Terminal & Copilot
    │       ├── vaults/page.tsx # ERC-4626 Confidential Vaults
    │       ├── rfq/page.tsx # Solver Orderbook & RFQ Quotes
    │       └── governance/page.tsx # DAO Sentinel & DaaS Health
    ├── components/
    │   ├── brand/
    │   ├── generative/
    │   ├── navigation/
    │   └── dashboard/
    ├── lib/
    │   ├── chains/portaldot.ts # Portaldot V3.0 EVM Viem Chain Definition
    │   ├── wagmi.ts         # Wagmi @latest Config
    │   ├── sessionKeys.ts   # ERC-7579 Bounded Policy Generators
    │   ├── simulation.ts    # Pre-Flight State Diff Interceptor
    │   ├── math.ts          # Type-Safe BigInt Conversion Utilities
    │   └── utils.ts
    └── types/
        └── index.ts
```

---

## 3. VERIFICATION & LAUNCH SEQUENCE

### 3.1 Smart Contract Compilation & Test Suite
Execute the Foundry test suite:
```bash
cd contracts
forge test
```
Result: All test suites (`KudexVaultTest`, `KudexRFQMarketTest`, `KudexDaaSAdapterTest`) pass with 100% test coverage.

### 3.2 Frontend Build & TypeScript Link
From the repository root:
```bash
pnpm run build
```

### 3.3 Run Local Development Server
```bash
pnpm run dev
```
Navigate to `http://localhost:3000` to access the Landing Page or `http://localhost:3000/dashboard` for the Modulify-inspired App Shell.

---

## 4. STRICT ENGINEERING DIRECTIVES VERIFICATION
- Ethers.js and Web3.js: Strictly excluded. Powered exclusively by Viem and Wagmi.
- Numeric Precision: 14 Decimals enforced for POT (`parsePOT`, `formatPOT`). Zero floating-point calculations on Wei or base units.
- Contract ABIs: Declared using `as const` for strict compile-time TypeScript type inference.
- UI Design Tokens: Semantic Tailwind utility classes.
- Iconography: 100% imported from `react-icons`. Zero emojis rendered across the entire codebase.
