# Signed RFQ settlement

Current inventory, October 28 fixes, test evidence and release gates: [engineering review](ENGINEERING_REVIEW_2026-10-28.md). Earlier dated observations below are historical. The AMM workspace remains at `/app/marketplace`; signed RFQ is now `/app/rfq`.

Kudex's marketplace supports a direct maker/counterparty workflow. It has no hosted orderbook, solver quote service, price oracle, Dutch auction, private fill, or partial-fill mechanism. Terms come from the maker; no market price is fabricated.

## User flow

1. The maker enters two different deployed token addresses, exact offered/requested quantities, and an expiry. Token metadata is read from the configured network, not trusted from an imported JSON file.
2. Review uses integer token units. Signature creation checks the router's `hashOrder` against the locally computed EIP-712 hash, plus nonce state and expiry. The maker signs the exact domain and order through the connected EVM wallet. Signing does not approve or reserve funds.
3. The maker downloads a `kudex-rfq-v1` envelope and shares it. Anyone holding that signature may take the complete order. There is no taker restriction in the current contract.
4. The maker reviews their export to grant the exact offered-token allowance if needed. The taker imports it, reviews all terms, and separately approves the payment token. Allowances are shared per token/router, not reserved per offer.
5. Fill refreshes nonce, expiry, signature, balances, and allowances; compares token metadata to the reviewed version; simulates; requests a wallet transaction; and waits for a successful receipt containing the matching router/order/maker/taker event.
6. The maker can cancel the nonce. All orders sharing that nonce are invalidated. Allowance removal is a separate action.

## Interchange contract

- Domain: `KudexRFQMarket`, version `1`, configured chain and router.
- Fields: `maker`, `tokenIn`, `tokenOut`, `amountIn`, `amountOut`, `deadline`, `nonce`.
- The maker offers `tokenIn/amountIn` and receives `tokenOut/amountOut`; the taker receives the former and pays the latter.
- Decimal integer strings carry all uint256 values. Input precision is checked before parsing; quantities never pass through JavaScript Number.
- Envelope: `format`, `chainId`, `router`, `order`, `signature`. Unknown properties, wrong domains, zero/same-token addresses, malformed bytes, overflowing amounts, and oversized input are rejected.
- EOA checks mirror the router's 65-byte, canonical-v, low-s ECDSA restrictions. Contract makers are checked with ERC-1271 against the observed block. A contract maker may import an externally produced signature; the maker form uses the connected wallet's typed-data signing support.
- Atomic simulation/receipt checks remain necessary because balances, approvals, smart-wallet authorization, and expiry can change after review.

## Verification and remaining activation

`pnpm test:rfq` checks import boundaries, exact precision, export round trips, and signed-domain binding. `pnpm test:rfq-runtime` deploys actual compiled token/router contracts to an isolated local Anvil instance, signs through its unlocked fixture accounts, imports the exported terms, settles exact amounts, and checks consumed nonce/replay rejection. It neither loads user credentials nor connects to Portaldot.

The existing Foundry router suite covers authorization, cancellation, expiry, signature tampering, cross-chain/deployment replay, ERC-1271, self-fill rejection, exact received and sent amounts on both legs, and rollback when either transfer is inexact or the second token leg fails. These checks do not establish a funded Portaldot deployment or actual wallet acceptance. Those remain required, including rejected signatures, account/network changes, approval-only success, transaction replacement and failure recovery.

The exact-transfer guard deliberately rejects fee-on-transfer or rebasing behavior that makes the received amount differ from the signed amount. This is an execution invariant, not a general asset listing or token audit. The router is immutable; this guard requires deploying and verifying a new router before the Portaldot path can use it.

Only standard reviewed ERC-20 assets should be supported. Fee-on-transfer and rebasing assets can violate the expected economic exchange; arbitrary public token metadata is not an asset review. Contract code presence and a matching hash do not establish deployment provenance or an independent audit.

## Scaling toward a marketplace

A multi-user orderbook needs authenticated maker/solver submission, durable order storage, indexed cancellation/fill events, expiration, canonical-block reconciliation, cursor pagination, query limits, and abuse controls. A worker must reconcile nonce state before offering an order and again before execution. No generated bot ticker or database-free local list is presented as live liquidity.
