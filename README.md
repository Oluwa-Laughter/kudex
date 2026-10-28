# Kudex

Kudex is financial infrastructure in development on **Portaldot V3 Testnet**. The current foundation is a public ERC-4626 custody vault, signed RFQ trading, an administrative risk freeze, a read-only Google AI assistant, and deposit-only contract permissions. There is no promised yield, principal protection, private settlement or autonomous profit.

The October 28 integrity revision removes browser-ledger execution, fabricated pools/settlements/metrics, local agent profits and the wallet's fallback faucet balance. The premium dark/light shell and branding remain; unsupported workspaces display explicit unavailable states.

| Capability | Current evidence |
| --- | --- |
| Network | Real RPC chain `420420777`; native runtime `3002`, EVM bytecode allowed, 14 native / 18 EVM decimals |
| Public vault | Exact separate approval, bounded deposit/redemption, matching receipts/events and refreshed actual shares; local contract/browser round trips tested |
| RFQ `/app/rfq` | Existing signed offers, exact approvals, full-fill settlement, cancellation and replay protection; local compiled-contract test |
| Agent permissions | Deposit-only policy contracts and wallet controls; public deployment required |
| Assistant | Configured Google conversation and bounded read tools; no custody or signer |
| AMM / LP | Disabled; no reviewed deployment or funded liquidity verified |
| Privacy / bridge / disclosure / credit tranches | Unimplemented or deliberately disabled |
| Worker / persistent indexer | Not implemented; existing event API scans a bounded recent chain window |

**No public-testnet deployment or funded financial transaction was performed in this revision.** Read-only runtime execution is not a public receipt or independent audit. New vault methods require a new immutable deployment.

Read the [current engineering report and threat model](docs/ENGINEERING_REVIEW_2026-10-28.md), [contract guide](contracts/README.md), and [Portaldot activation runbook](docs/PORTALDOT_TESTNET.md). Older dated review sections record historical states; the October 28 report is the current inventory.

## Setup and verification

Use Node 22 or later, pnpm 10 and Foundry. Copy `.env.example` to `.env.local`; keep deployment addresses and runtime hash pins empty until verified. Store server-only Google configuration locally. Never expose signing keys or model keys through public environment variables.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
forge test --root contracts
pnpm test:network
pnpm test:deployment
pnpm test:agents
pnpm test:agent-service
pnpm test:rfq
pnpm test:vault
pnpm test:rfq-runtime
pnpm test:vault-runtime
pnpm exec playwright install --with-deps chromium
pnpm test:ui
pnpm test:vault-ui
pnpm audit --prod --audit-level high
```

`test:vault-ui` starts its own local Anvil and isolated Next.js development server, deploys real compiled local contracts, injects an unlocked **local test signer**, and verifies a browser deposit/redemption against receipts and balances. It never uses a public signer. The ordinary Playwright suite uses the production build. Fixture network observations are labeled tests, not public execution evidence.

Run `pnpm dev`, then open `/app/overview`. Vaults are at `/app/vaults`, swaps/liquidity availability at `/app/marketplace`, advanced signed offers at `/app/rfq`, policies at `/app/agents`, and risk at `/app/protection`. Native extension identification does not enable EVM signing for a mapped address.

Read-only Portaldot checks:

```sh
pnpm check:network --rpc-only
pnpm inspect:portaldot
pnpm test:runtime
```

In a proxy-based environment using a Node version that supports it, set `NODE_USE_ENV_PROXY=1`. Do not change chain identity or gas units to work around transport errors. The runtime smoke diagnostic uses `eth_call` and temporary assets; it does not deploy anything.

## Deployment boundary

Run `pnpm prepare:deployment` to generate an offline unsigned review manifest with real compiled creation-code hashes and constructor schemas. Signer, collateral, final constructor inputs, addresses and transaction evidence remain unresolved. Select and review collateral, signer, gas/storage funding, constructor arguments and the final manifest first. Obtain explicit authorization before broadcasting. `Deploy.s.sol` wires the risk adapter as a revocable controller; the owner retains administration. Agent infrastructure is separate and governed by a timelock.

After an authorized deployment, `pnpm configure:deployment <foundry-broadcast-file>` checks compiled creation input, canonical finalized receipts, owner/controller relationships and bytecode. It records actual evidence and writes vault/collateral runtime hash pins. Rebuild the app to inline configuration. The vault checks these pins before spending and separately supports allowance removal. The importer does not establish an independent asset audit.

The [quickstart](public/kudex-quickstart.md), [agent setup](docs/AGENT_SETUP.md), and [agent governance](docs/AGENTS_AND_UPGRADES.md) explain supported workflows. Persistent indexing, durable jobs, reviewed AMM integration, live wallet coverage, independent contract review and operational controls remain release gates.
