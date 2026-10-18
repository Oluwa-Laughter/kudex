# Kudex

Kudex is a Portaldot settlement product in development, with a planned scope covering tokenized credit, signed RFQ trading and bounded agents. Privacy, RWA tranches, bridging and selective disclosure are not implemented production capabilities.

The current contract foundation contains a public ERC-4626 vault, an EIP-712 signed-order RFQ router, and an owner-scored risk adapter that can freeze new deposits. The app integrates public vault deposits/withdrawals, gated on verified network and contract configuration. Unsupported workflows display unavailable states rather than simulated success.

**Portaldot V3 is now connected:** EVM RPC `https://test-evm-rpc-v3.portaldot.dev`, chain ID `420420777`. Runtime inspection confirms native tPOT uses 14 decimals and the Ethereum interface uses 18. Contract logic passed read-only execution on the live runtime. Contract publication still needs a funded native or EVM signer. See [the activation runbook](docs/PORTALDOT_TESTNET.md).

Read [the implementation review and scaling roadmap](docs/READINESS.md) for security findings, fixes, remaining work and the network compatibility checklist. This is not an independently audited or production-ready protocol.

## Local checks

```sh
pnpm install --frozen-lockfile
pnpm build
forge test --root contracts
```

Copy `.env.example` to `.env.local`. The announced network values are included; deployment addresses stay empty until verified. Sign in a wallet or local keystore; do not put keys in public configuration. Run the read-only preflight once configuration is available:

```sh
node --env-file=.env.local scripts/check-network.mjs
```

Start the application with `pnpm dev`. The workspace is `/app/overview`; public vault actions are at `/app/vaults`. Empty or failed network configuration does not fabricate balances or successful transactions.

## Deployment

The Foundry script accepts an existing collateral token, or an explicitly enabled testnet-only KTEST deployment. A native SS58 deployment preparation helper is also available. It wires the risk adapter as a revocable default controller without transferring vault ownership. Contracts changed during this review require a new deployment.

The live runtime accepts EVM bytecode and passed the read-only diagnostic. Funded publication, wallet signing and final receipt checks are still required. The included verifier is deliberately fail-closed; confidential transfers are disabled.

## Repository

- `contracts/src`: public vault, signed RFQ router, risk adapter and disabled verifier.
- `contracts/test`: authorization, replay, vault and default regression tests.
- `src/app`: marketing, developer reference, product workspaces, streamed agent and bounded public read endpoints.
- `src/lib/contracts`: addresses, ABIs, typed order schema and deployment checks.
- `scripts/check-network.mjs`: read-only RPC identity and code-presence preflight.
- `docs/READINESS.md`: product status, security review, architecture and release gates.

## Product guides and bounded agents

Read the [user quickstart](public/kudex-quickstart.md) for wallet readiness, public vault deposits, withdrawals, and draft agent policies. The same guide is available in the product at `/how-it-works` and `/app/how-it-works`.

The refreshed workspace includes native extension account identification, a separate EVM signing connection, explicit transaction review, and a bounded agent policy builder. Native transaction signing in the vault form remains pending. Draft export activates no policy.

The [agent and upgrade runbook](docs/AGENTS_AND_UPGRADES.md) covers the new deposit-only executor, opt-in timelocked policy registry, signing boundaries, and remaining production requirements. The custody vault remains immutable. No new infrastructure has been deployed.

The [UI system and manual acceptance checklist](docs/UI_SYSTEM.md) records typography, interaction rules, motion, and visual checks still required.

See [product scope and delivery gates](docs/PRODUCT_SCOPE.md) for track fit, the architecture diagram, testnet activation, and the indexing/worker work required before scaling traffic. Repository tests and a working UI are not a production scaling certification.

## Live agent workspace

The agent now includes streamed Google AI Studio conversation when configured, live read-only Portaldot tools, finalized native account inspection, and wallet-driven policy authorization/lifecycle controls after deployment. See [Agent setup](docs/AGENT_SETUP.md) for the server-only key/model settings and the exact activation boundaries. A running model does not itself authorize spending.

Run `pnpm agent:check` to discover models available to your Google project, then `pnpm agent:check -- --probe` for a small provider check. The key must be entered locally; no model credential is required for the explicit live network checks.

Recent event scanning now uses a bounded shared server endpoint rather than one independent RPC scan per browser. This reduces per-instance request duplication; durable indexing and global limits remain release gates.

Use the [demo walkthrough](docs/DEMO_WALKTHROUGH.md) to explain the current product in under three minutes.

## Signed offers and product workspaces

The RFQ workspace at `/app/marketplace` now supports maker signing/export, imported-offer review, separate exact approvals, complete atomic fills, cancellation, and allowance removal. It requires a configured router and funded wallet; there is no hosted orderbook or invented solver price feed. See [RFQ settlement](docs/RFQ_SETTLEMENT.md) for the JSON contract and verification boundaries.

Run `pnpm test:rfq` for precision/import/signature checks and `pnpm test:rfq-runtime` for an isolated local-EVM settlement using the actual compiled contracts. Neither command uses user keys or sends a public-network transaction.

Overview and Kudex Agent lead with product workflows. Network readiness supports transaction setup. Pool protection reads the configured vault's administrative risk input and deposit-freeze state through a cached public endpoint; it does not claim debt recovery. `/docs` describes current interfaces, and `/pricing` labels the business model's proposed rates without activating billing or contract fees.
