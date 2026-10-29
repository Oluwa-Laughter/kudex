# RFQ-first restoration design — 2026-10-29

Keep the existing emerald, slate and dark/light brand: light background #f4f6fa,
ink #141d2e, card #ffffff, emerald #006d4a, dark background #06080d and dark accent
#00e599. Preserve the repository heading/body fonts. Left-aligned institutional
workspaces prioritize a request/quote/review sequence over market-price tiles.
Availability and public settlement disclosures sit beside actions. Overview provides
financial tasks, not invented portfolio totals. Native identity and infrastructure
inspection remain secondary to those tasks. Existing public vault, signed router,
deposit-only permissions and fail-closed verifier are preserved.

Signed request envelopes are off-chain invitations, not spending permissions. Bind
requester, named solver, assets, minimum receipt, maximum payment, expiry and nonce
to chain and router. Export locally; no public request feed or sensitive logging.
Match imported signed quotes deterministically. The existing v1 router is bearer,
public, full-fill settlement: a named solver/request does NOT restrict its taker.
No private delivery or winner/counterparty anonymity claim follows from signatures.
A hosted inbox requires authenticated recipients, durable cancellation/nonces and
retention/access controls; do not emulate it with process memory or browser records.

Harden every RFQ write with reviewed code pins; verify receipt identity, expected
operation events, canonical block and finality separately. Unknown outcomes block
resubmission during reconciliation, rather than becoming settled UI records.

A separate RFQ delegate executor may expose only one fixed-router operation, with
fixed maker and asset pair, rational minimum exchange rate in token units, action/
daily/total caps, expiry and revocation. It must return all acquired tokens to the
owner, clear temporary allowances and reject inexact assets. It cannot add trading
rights to the original deposit-only executor. New bytecode requires new deployment.

Credit foundation: a separate test-only facility is a permissioned, fixed-capital,
zero-interest model, not a yield product. Immutable borrower/asset, reviewed document
reference (not proof of legal backing), senior/junior targets, funding cutoff and
maturity/grace fix terms. Approved subscriptions are refundable after a failed raise;
fully funded capital can only be disbursed once to the borrower. Actual repayments
and recoveries pay senior principal first, then junior, with cumulative proportional
claims. No unbounded investor iteration or owner rescue. Exact asset conservation
and rounding dust must be explicit. Maturity/grace permits objective on-chain default
classification, not seizure of off-chain collateral or native DaaS integration.
