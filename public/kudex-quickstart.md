# Kudex user quickstart

Kudex is a settlement product in development on Portaldot V3 testnet. Start with the public vault. Current balances, deposits, and withdrawals are public. There is no promised yield, principal protection, or live RWA investment.

## 1. Check readiness

Open `/app/overview` to choose a vault, signed-offer, or agent workflow. Network and wallet readiness is a supporting section: expand it to check the RPC connection, network, and configured contracts. A working RPC alone does not mean Kudex has been deployed. Missing addresses stay unavailable.

## 2. Understand your wallet

The organizer distributes test tokens to your native Portaldot address beginning with `5`. Your Portaldot extension can share that account with Kudex for identification if it exposes the standard native extension interface. When the native RPC responds, Kudex reads a finalized balance observation and the runtime mapping. An unavailable read means the current balance is unknown.

The current vault transaction form uses an EVM signing wallet. Native extension signing in that form is not integrated. The runtime maps native accounts to contract-facing `0x` addresses, but that mapping does not create an EVM private key. Never import recovery phrases into another wallet to guess a mapping. Connection does not prove funding.

Portaldot V3 testnet's EVM chain ID is `420420777`. Native balances use 14 decimals; the EVM gas interface uses 18. Use current verified network instructions for funding and signing.

## 3. Review the vault

Open `/app/vaults` after deployment. Check the collateral symbol, token precision, available balance, and contract address. Test collateral is not a dollar-backed stablecoin or ownership of a real-world asset.

Enter a deposit amount and choose **Review vault transaction**. Review the amount, estimated shares, owner account, vault, and network. Estimates can change before inclusion. Your wallet displays gas fees.

## 4. Authorize and confirm

Choose **Approve exact deposit amount** when required, review again after the approval, then **Confirm deposit in wallet**. A deposit may need an exact-amount token approval first. Approval is not a deposit. Review the separate deposit transaction and wait for a successful receipt. Balances refresh from the chain. A rejected signature, RPC error, or reverted transaction is a failure.

## 5. Withdraw

Choose **Redeem shares**, enter available shares, review minimum asset output and expiry, then confirm redemption in your wallet. A default freeze can stop new deposits; withdrawals remain subject to asset availability.

## 6. Prepare an agent policy

Open `/app/agents`. Choose the contract-facing owner, delegate, vault, collateral address and verified decimals. Set per-deposit, UTC-day, and lifetime caps, plus an expiry of at most 30 days. Review and download the draft. After infrastructure deployment, use Authorize policy in wallet from the matching owner EVM signing account. Policy controls can load the confirmed ID, approve the remaining budget, revoke the policy, remove token allowance, or request one deposit from the exact delegate.

Downloading a draft authorizes nothing. Before activation, the policy registry and executor must be deployed and verified; the vault must be approved; the owner must create the policy on-chain and grant a bounded allowance; a funded delegate must sign a permitted deposit. Continuous automation requires a separately operated worker. The first executor can only deposit and sends shares to the owner. It cannot withdraw or issue arbitrary calls.

Revoke the on-chain policy and any remaining token allowance when finished. The local draft is not a kill switch.

## 7. Trade a signed offer

Open `/app/rfq`. The maker chooses Create an offer, enters the two token addresses, exact offered/requested amounts, and expiry, then reviews the loaded token metadata. Signing creates a shareable JSON offer, not a trade or a token reservation. Download the export. Anyone holding the signature may take the full offer.

Review your own export to check funding and approve the maker's exact outgoing amount to the router. The taker imports that export, checks all terms and token addresses, connects the paying wallet, and refreshes the review. The taker approves the exact payment separately, then fills the complete offer. The app refreshes state, simulates, and checks for a successful receipt with the matching settlement event. Used, expired, or cancelled offers cannot be filled.

Maker `tokenIn/amountIn` is what the taker receives; maker `tokenOut/amountOut` is what the taker pays. Allowances are shared across offers, not reserved to one order. The maker can cancel the nonce on-chain; removing token allowance is a separate action. Current offers are public and have no partial fill, auction, recipient restriction, or solver price feed. Transfer-tax and rebasing tokens are unsupported.

## Current scope

- Public vault: code tested; funded deployment and verified addresses required.
- Native wallet: standard extension account identification; native in-app transactions pending.
- Bounded agents: live read-only assistant tools, optional Google AI Studio conversation, policy builder, wallet authorization and lifecycle controls, deposit executor code, and a one-attempt local worker. On-chain activation requires funded, verified deployment. No hosted autonomous worker is running.
- RFQ: maker signing/export, imported-offer review, exact approvals, cancellation, and full-fill wallet paths. Router deployment and funded wallet acceptance are required. No hosted orderbook or solver feed.
- Confidential transfers, RWA credit tranches, bridging, selective disclosure: in development and unavailable.

## Common blockers

- **No test tokens:** await the organizer's allocation to your registered native address.
- **No contract configured:** wait for verified deployments; never substitute arbitrary addresses.
- **Approval succeeded, no deposit:** check the separate deposit receipt.
- **Native account connected, no vault transaction:** the current vault form uses EVM signing; native signing is a separate integration.
- **Agent draft saved, no activity:** a draft has no on-chain authority and starts no worker.

Only use test assets. Keep private keys and recovery phrases in your wallet or protected keystore; Kudex never needs them entered into a form.

## Ask the assistant

Open Agents → Live assistant for vault, signed-order, and bounded-permission guidance. With Google conversation configured by the operator, you can ask in your own words. Live reads are used for network, wallet, or vault claims; replies stream with observations and timestamps. The assistant cannot sign transactions or grant allowances. If the native RPC is unavailable, your balance remains unknown.

Pending vault transaction hashes are retained only for receipt reconciliation, never as a record of success. If a receipt cannot be read, keep the hash and inspect wallet activity before another submission. Vault spending requires runtime code hashes imported from finalized deployment evidence.
