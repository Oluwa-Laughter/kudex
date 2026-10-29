# Kudex — The Autonomous Confidential Economy

Kudex is an autonomous confidential-settlement and agent-native institutional RFQ
protocol in development on **Portaldot V3 Testnet**. Its four pillars are private
settlement, negotiated liquidity, bounded financial agents and structured credit/default
management. Current on-chain token movements are public. No yield, anonymity,
principal protection, active investor offering or autonomous profit is promised.

The RFQ-first restoration preserves the public ERC-4626 vault, original signed router,
deposit-only executor, policy governance, risk adapter and fail-closed verifier. It
adds local signed request invitations, stronger settlement provenance/reconciliation,
a separate bounded RFQ executor and a test-only senior/junior credit facility.

| Capability | Implementation and evidence boundary |
| --- | --- |
| Institutional marketplace `/app/marketplace` | Real request/quote wallet signatures, exact maker/taker approvals, simulation, public full fills, cancellation and checked receipts; compiled local browser journey |
| RFQ mandates `/app/agents` | Separate fixed-router, fixed maker/pair, rational price floor, caps, expiry/revocation; owner approval/delegate execution browser-tested locally; no hosted worker |
| Public custody `/app/vaults` | Preserved bounded ERC-4626 deposit/redemption, exact approvals, checked receipts and chain-derived positions; local browser journey |
| Confidential settlement | Disabled verifier preserved. Actual runtime BN254 primitives probed; reviewed circuit/setup/note recovery/proof verification still required |
| Credit & RWA | Zero-interest, unbacked test facility with senior-first repayment/default/recovery accounting; no verified issuer, deployed offering or investor legal claim |
| Risk & DaaS | Existing local administrator/sentinel freeze; no verified native DaaS recovery contract/interface |
| Activity | Bounded recent public chain observations, not a private ledger or durable indexer |
| AMM, bridge, disclosure, hosted automation | Outside the primary journey; unavailable |

**No public deployment or financial transaction was broadcast.** Real-fund and mainnet
actions are unauthorized. Read-only constructor diagnostics on the actual runtime are
not receipts or independent audits. New contracts require separately reviewed deployment.

Read the [restoration engineering report](docs/ENGINEERING_RESTORATION_2026-10-29.md),
[scope](docs/PRODUCT_SCOPE.md), [confidentiality specification and gates](docs/CONFIDENTIALITY_PROTOCOL.md),
[credit/DaaS boundaries](docs/CREDIT_AND_DAAS.md) and [RFQ design](docs/RFQ_SETTLEMENT.md).
The October 28 report remains historical evidence; its AMM roadmap is superseded.

## Setup and verification

Use Node 22 or later, pnpm 10 and Foundry. Copy `.env.example` to `.env.local`; keep deployment addresses and runtime hash pins empty until verified. Store server-only Google configuration locally. Never expose signing keys or model keys through public environment variables.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
forge test --root contracts
pnpm test:dependency
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
pnpm test:rfq-ui
pnpm test:vault-ui
pnpm audit --prod --audit-level high
```

`test:vault-ui` starts its own local Anvil and isolated Next.js development server, deploys real compiled local contracts, injects an unlocked **local test signer**, and verifies a browser deposit/redemption against receipts and balances. It never uses a public signer. The ordinary Playwright suite uses the production build. Fixture network observations are labeled tests, not public execution evidence.

Run `pnpm dev`, then open `/app/overview`. Public custody is at `/app/vaults`, the primary RFQ workflow at `/app/marketplace` (with `/app/rfq` retained), policies at `/app/agents`, credit availability at `/app/credit`, and infrastructure at `/app/infrastructure`. Native extension identification does not enable EVM signing for a mapped address.

Read-only Portaldot checks:

```sh
pnpm check:network --rpc-only
pnpm inspect:portaldot
pnpm test:runtime
```

In a proxy-based environment using a Node version that supports it, set `NODE_USE_ENV_PROXY=1`. Do not change chain identity or gas units to work around transport errors. The runtime smoke diagnostic uses `eth_call` and temporary assets; it does not deploy anything.

## Deployment boundary

Run `pnpm prepare:deployment` to generate an offline unsigned review manifest with real compiled creation-code hashes and constructor schemas. Signer, collateral, final constructor inputs, addresses and transaction evidence remain unresolved. Select and review collateral, signer, gas/storage funding, constructor arguments and the final manifest first. Obtain explicit authorization before broadcasting. `Deploy.s.sol` wires the risk adapter as a revocable controller; the owner retains administration. Agent infrastructure is separate and governed by a timelock.

After an authorized deployment, `pnpm configure:deployment <foundry-broadcast-file>` checks compiled creation input, canonical finalized receipts, owner/controller relationships and bytecode. It records actual evidence and writes vault/collateral and RFQ-router runtime hash pins. Rebuild the app to inline configuration. The vault checks these pins before spending and separately supports allowance removal. The importer does not establish an independent asset audit.

The [quickstart](public/kudex-quickstart.md), [agent setup](docs/AGENT_SETUP.md), and [agent governance](docs/AGENTS_AND_UPGRADES.md) explain supported workflows. Persistent indexing, authenticated private RFQ delivery, durable bounded jobs, live native signing coverage, independent review and operational controls remain release gates.


`pnpm test:rfq-ui` exercises actual local request/quote signing, maker/taker settlement,
then owner authorization, delegate execution and revocation using isolated child Anvil
signers. It is not live network or hardware/native wallet acceptance. `pnpm probe:cryptography`
and `pnpm test:restoration-runtime` are read-only Portaldot diagnostics; use
`NODE_USE_ENV_PROXY=1` only when required by the local network environment. Neither broadcasts.
