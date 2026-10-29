# Kudex — the autonomous confidential economy

Kudex is building an autonomous, confidential settlement protocol and agent-native
institutional RFQ marketplace on Portaldot V3. Its four pillars are confidential
settlement, negotiated liquidity, bounded financial agents and structured credit/default
management. Public AMMs are not the primary product or a current engineering priority.

The current restoration report is [here](ENGINEERING_RESTORATION_2026-10-29.md).
Historical observations remain in the October 28 engineering review.

## Product workspaces and truthful authority

| Workspace | Actual boundary |
| --- | --- |
| Overview | Institutional task entry; no invented balance, return, TVL or solvency |
| Confidential settlement | Privacy unavailable; public custody linked separately |
| RFQ marketplace | Local signed invitations, signed quotes, deterministic comparison, exact approvals, public full-fill settlement/cancellation and receipt reconciliation |
| Credit & RWA | No verified offering; links to public custody; new test-only facility contracts have no deployment or legal backing |
| Kudex Agents | Read-only AI copilot; deposit-only permissions preserved; separate RFQ-only mandate UI/contracts, no hosted worker |
| Risk & DaaS | Actual local adapter/admin controls, not independently monitored credit or native legal recovery |
| Compliance | Cryptographic viewing/disclosure unavailable |
| Activity | Bounded public recent observations, not private account ledger or durable index |
| Developer infrastructure | Native/EVM identity, network/deployment observations and secondary bridge status |

The original immutable RFQ router, custody vault, deposit-only executor, timelocked
registry and risk adapter remain intact. New RFQ execution authority is in a separate
contract. No source change upgrades deployed bytecode. KTEST is unbacked test collateral;
no real collateral, yield or investor onboarding is authorized.

## Delivery gates

Local compiled contracts and injected test signers establish test behavior only.
Public deployment needs the owner's preferred native signing path, verified account
mapping/signing capability, funding/storage fees, exact constructors, source/runtime
pins and explicit authorization. A mapped H160 is not an EVM private key.

Hosted private quote delivery requires authenticated recipients, verified solver
eligibility, durable expiry/cancellation/nonces, tenant access controls, retention and
reorg-aware settlement reconciliation. Local exports are not that service.

Recurring agents require authenticated durable queues, idempotency and policy/account
serialization, secure operators, persistent nonce/submission journals, replacement and
reorg handling, revocation, monitoring and emergency controls. Manual delegate execution
is not background automation. Limits are token-denominated, not oracle-free USD limits.

Confidential settlement requires reviewed circuits, setup, proof artifacts, nullifier/
root handling, note discovery/recovery/disclosure and runtime proof verification.
Precompile probes establish primitives, not privacy. Credit requires genuine issuer/
asset/legal/servicing evidence; deterministic test accounting is not underwriting.

Commercial rates (RFQ 0.10%, routing 0.05%, auditor subscription $799/month and origination
0.25%) remain proposed assumptions. No new fee collection or fictional billing is enabled.
