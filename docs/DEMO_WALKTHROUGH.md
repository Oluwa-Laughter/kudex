# Kudex product walkthrough

Current inventory, October 28 fixes, test evidence and release gates: [engineering review](ENGINEERING_REVIEW_2026-10-28.md). Earlier dated observations below are historical. The AMM workspace remains at `/app/marketplace`; signed RFQ is now `/app/rfq`.

This script demonstrates Kudex's current product: vault discovery, maker-signed settlement offers, and a bounded assistant. Keep the walkthrough under three minutes. Use the live Portaldot test network when the required contracts and funded EVM account are available. Otherwise show the real product states and explain which deployment gate remains; never imply that a local test settled on the public network.

## Before recording

- Open the latest application build and connect the intended EVM account when available.
- Confirm configured token and router addresses against the deployment record. A configured address alone is not proof of deployment.
- If demonstrating a fill, check maker funding and allowance, taker funding and allowance, expiry, and current chain before recording.
- Keep transaction receipts visible until the application confirms the matching settlement event.

## 0:00–0:25 — Product and portfolio

“Kudex brings tokenized credit discovery, direct settlement, and bounded agent workflows into one workspace. Today I’ll show how counterparties create and settle an exact signed offer, and how the agent helps explain the workflow.”

Open Overview. Point out the product paths to vaults, marketplace, and the agent. Treat unavailable portfolio values as unavailable; do not present empty configuration as a healthy pool.

## 0:25–1:30 — Create and review a signed offer

Open Advanced signed RFQ at `/app/rfq` and choose Create an offer. Enter the offered and requested token addresses, exact amounts, and expiry. Review the direction of the trade, connected maker, token decimals, and expiry before signing.

Explain that the signature commits to the order and network. It does not reserve tokens or grant spending permission. Export the signed offer and show how the counterparty imports it. The review displays the exact terms and checks the live router, nonce, signature, balances, and allowances.

If the verified router is deployed and both accounts are ready, separately approve the required token allowance and fill. Show the successful receipt and matching settlement event. If they are not ready, show the specific missing condition without simulating a successful public-chain result.

## 1:30–2:05 — Vaults and protection

Open Vaults to show the configured pool information and deposit path. Explain that deposits require a verified vault, supported asset, wallet funds, and an owner-approved transaction. Open Protection to show the vault's observed risk score and pause state when a vault is configured. Label the observation with its block and time; this is monitoring data, not a promise of yield or safety.

## 2:05–2:40 — Kudex Agent and bounded actions

Open Kudex Agent and ask: “How do I make and settle an offer?” Show its product guidance and the linked workflow. Then open Agents to review a policy's owner, delegate, allowed vault, spending caps, and expiry. Explain that the agent can guide and inspect configured data, while wallet signatures remain explicit and policy changes require owner authorization.

## 2:40–3:00 — Current boundary

Close with the live repository and product guide. State plainly whether the recording used Portaldot testnet or local contract tests. Do not claim private fills, a hosted solver book, RWA yield, automated background execution, or production scale until those capabilities are deployed and independently verified.

## Current RFQ-first demonstration (October 29)

Earlier AMM positioning is superseded. Open Overview, then RFQ Marketplace. Show local
invitation creation, quote review, explicit public/bearer limitations and deployment
availability. A repeatable actual local signing/settlement/delegate/revocation journey
is `pnpm test:rfq-ui`; the preserved custody journey is `pnpm test:vault-ui`. Label both
as isolated local tests, never public Portaldot transactions. Credit has no verified
investor offering, private transfers remain disabled and no hosted agent worker runs.
