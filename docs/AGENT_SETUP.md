# Kudex Agent: setup and operating boundaries

Current inventory, October 28 fixes, test evidence and release gates: [engineering review](ENGINEERING_REVIEW_2026-10-28.md). Earlier dated observations below are historical. The AMM workspace remains at `/app/marketplace`; signed RFQ is now `/app/rfq`.

## What is implemented

`/app/agents` now has three areas:

1. **Live assistant:** product guidance for vault capital, signed RFQ trading, and bounded delegate permissions. Gemini uses bounded network, account, and vault reads when live evidence is needed. Responses stream text and tool progress; unavailable observations remain unavailable. The testnet is the deployment environment, not the product's purpose.
2. **Build a policy:** prepare a deposit-only draft, check deployment/asset/governance settings, and request owner-signed policy creation after deployment. Downloading a draft creates no authority.
3. **Policy controls:** load a real policy ID, read its current limits, approve the remaining collateral budget, remove allowance, revoke the policy, or request one deposit signed by its exact delegate.

The model has no transaction, signing, shell, arbitrary RPC URL, or arbitrary contract-call tools. On-chain actions are separate user controls that refresh state, simulate, request a wallet signature, wait for a successful receipt, and refresh from the chain. Policy IDs come from the confirmed `PolicyCreated` receipt event, not an unconfirmed simulation result.

There is no hosted autonomous worker, durable job queue, or automatic retry. The existing keystore runner remains a one-attempt worker. Native extension signing is not implemented by the EVM policy controls. Sharing a native account or obtaining its mapped H160 does not provide an EVM signing key.

## Enable Google AI Studio conversation

Add server-only settings to your ignored `.env.local`:

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=
KUDEX_AI_MODEL=gemini-3.8-flash
```

Enter the key locally. Do not put it in `NEXT_PUBLIC_*`, a form, source control, screenshots, logs, or chat. Use a project key with appropriate restrictions and a provider budget.

Run:

```sh
pnpm agent:check
```

With a key set, this lists generation models available to that project. Gemini 3.8 Flash was selected from the actual catalog and verified with generation and a read-only function-calling probe in this session. Availability and quota can change; choose an accessible text/tool model if this model is unavailable to a new project. Then make an explicit small generation probe:

```sh
pnpm agent:check -- --probe
```

Restart the application after changing environment settings. The status endpoint reports configuration presence, not a successful provider health check. Invalid access, unsupported models, quota limits, or provider failures produce errors; they do not turn into fabricated live results. When the model is not configured, the three explicit live checks remain available.

References: [AI SDK Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google), [AI SDK tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling).

## Activate policy infrastructure

Deploy and verify the opt-in infrastructure described in [AGENTS_AND_UPGRADES.md](AGENTS_AND_UPGRADES.md). Set only verified public addresses:

```dotenv
NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS=
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=
```

The UI checks that the executor points to the configured registry, the vault remains approved, collateral and decimals match, and governance currently exposes a delay of at least two days. These consistency checks do not establish code provenance or an audit. Review the proxy implementation, ProxyAdmin ownership, storage layout, deployment receipts, and constructor arguments separately before publishing addresses.

Use **Authorize policy in wallet** as the owner, then **Policy controls** to inspect the ID. Approval and revocation are separate actions. The collateral allowance applies to the executor across all that owner's policies for that token; approving a single policy budget can constrain other policies too. After uncertainty or a timeout, reconcile receipts and policy state before repeating an action.

## Portaldot reads

Native account inspection verifies the known testnet genesis, runtime revive chain ID, native decimal property, and native-to-EVM ratio. It reads the account and runtime mapping against a finalized native block. It does not calculate an exact maximum transferable balance: fees, reserves/frozen funds, and account preservation requirements still apply.

During the October 17 integration check, the EVM endpoint returned chain `420420777` and block `75727`. Native `chain_getBlockHash`, runtime-version and metadata requests intermittently timed out even while `rpc_methods` responded. The native API returned HTTP 503 with an unknown balance rather than inventing one. This is an upstream integration blocker, not evidence of funding or lack of funding.

## Scaling controls and remaining work

- Requests have strict schemas and a real streamed-body byte limit. Users and models cannot choose arbitrary RPC endpoints.
- Conversation context is bounded; oldest pairs are removed before exceeding the request budget. Output is capped per step, with at most four model steps, no automatic provider retries, a request deadline, and a three-conversation per-process concurrency limit.
- Public reads share bounded short-lived snapshots with in-flight request coalescing. Failed snapshots are removed and are never reused as successful observations.
- Recent ERC-4626 deposit event scanning moved off individual browsers to a server endpoint: a bounded 500-block window in sequential 100-block chunks, shared for 30 seconds per process. It counts both ordinary and commitment-tagged deposits once through the standard Deposit event, keeps exact integer totals, and groups the chart by block windows without a timestamp request per deposit. An unconfigured RFQ router does not block vault-deposit telemetry. It replays the entire window instead of retaining orphaned logs from prior snapshots. A 12-block display lag is explicitly not a finality guarantee.
- Request-rate guards are per path and process. Forwarded IP headers are useful only behind a trusted proxy. They are not authentication, a global rate limiter, or a provider spending limit.

Before public scale: deploy shared rate limiting and provider spend controls, a durable reorg-aware event indexer and database, authenticated worker jobs, transaction reconciliation, per-policy serialization and signer nonce coordination, metrics/alerts, and operational key rotation. No multi-region load test, throughput target, security audit, or continuous worker operation is claimed.

## Verification and unresolved checks

The repository contains request validation/coalescing tests and browser tests for native-account UI fixtures, keyboard focus restoration, draft export, and streamed response rendering. Fixture responses prove UI behavior only; they do not verify a live extension, Google service, funding, or transaction signing.

Live Google conversation still needs the project key and chosen model. Policy activation, allowance changes, revocation and delegated deposits still need funded, verified deployments and real wallet acceptance. The native RPC path needs a successful current finalized-account read before claiming its production reliability.

## Separate RFQ mandates (October 29)

`/app/agents` → `RFQ mandates` targets the new immutable `KudexRfqExecutor`, not the
original deposit-only executor. No address is configured by this revision. A reviewed
runtime hash and router binding are required before operations; token pins are required
before authority or spending is granted.

The owner fixes delegate, maker, buy/pay tokens, rational minimum exchange rate,
per-action/daily/total token-unit payment caps and 24-hour expiry. The contract supports
at most 30-day policies. Daily periods are UTC timestamp days, not rolling 24-hour windows.
`minimumBuy / referencePay` is a minimum *base-unit* rate, with a rounded-up required
receipt. Tokens with different decimals require deliberate conversion; no USD valuation
or oracle is inferred. Review the full ratio and every cap before authorizing.

Owner policy authorization and allowance are separate wallet transactions. The exact
delegate can submit a signed eligible quote; the contract enforces limits and sends the
received tokens to the owner, clearing temporary router approval. The model does not
sign or hold credentials. Revocation stops new execution; allowance removal is separate.
Anyone holding the maker's bearer signature can independently fill the router order.

This is a manual testnet workflow with local browser/contract tests. It is not an active
hosted worker, zero-popup session service, private trade or deployment receipt. A durable
queue, account nonce manager, operator authorization, fee bounds, persistent submission
journal, reorg/replacement handling and current native wallet signing remain release gates.
