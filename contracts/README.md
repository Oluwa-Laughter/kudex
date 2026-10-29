# Kudex smart contracts

Kudex targets Portaldot V3 testnet (`420420777`) through Revive's EVM interface. These contracts are not independently audited or mainnet-ready. Test collateral has no promised monetary value.

| Contract | Responsibility | Authority / limitation |
| --- | --- | --- |
| `KudexVault` | Public ERC-4626 custody; bounded deposit/redeem; exact asset-transfer checks | Immutable custody; owner sets risk and default controller. Default freezes new deposits, not available withdrawals. No yield or credit waterfall. |
| `KudexRFQMarket` | Signed full-fill atomic exchanges | EIP-712 domain, EOA/ERC-1271, one-use maker nonce and cancellation; exact token transfer checks. No hosted solver or AMM. |
| `KudexDaaSAdapter` | Evaluate owner-reported score and enforce deposit freeze | Authorized sentinels; vault must authorize the adapter as controller. No debt recovery. |
| `KudexAgentExecutor` | Deposit-only delegation | Owner, delegate, approved vault/asset, per-action/day/lifetime budgets, expiry and revocation. Shares go to owner; no arbitrary calls or withdrawals. No minimum-share argument yet. |
| `KudexPolicyRegistry` | Timelocked vault allowlist | Opt-in transparent proxy; timelock controls allowlist and upgrades. Does not hold assets. |
| `KudexTestToken` | Fixed-supply unbacked test collateral | Deployment restricted to this testnet. Not a stablecoin. |
| `Groth16Verifier` | Disabled privacy boundary | Returns false; confidential transfers remain disabled even with another permissive verifier. |

From the repository root:

```sh
forge build --root contracts
forge test --root contracts
pnpm test:vault-runtime
pnpm test:rfq-runtime
pnpm test:vault-ui
```

The vault suite includes minimum-output/deadline rollback, malicious transfer-tax rejection, unauthorized administration, fuzz round trips and stateful accounting. The RFQ suite exercises signatures, replay, domain separation and transfer rollback. Policy tests enforce caps, revocation and delayed governance.

The app uses `depositWithMinimum(assets, receiver, minShares, deadline)` and `redeemWithMinimum(shares, receiver, minAssets, deadline)`. Share and asset quantities are integer base units; token/share decimals come from contracts. Direct standard ERC-4626 entry points remain available and do not enforce caller-specific minimum output. Fee-on-transfer/rebasing/malicious assets are unsupported. `shieldDeposit` is a public deposit plus commitment event; it is not privacy.

`script/Deploy.s.sol` deploys the public stack and wires the risk controller without transferring vault ownership. `script/DeployAgentInfrastructure.s.sol` prepares the separate timelocked registry and deposit-only executor. Use encrypted-keystore or hardware-wallet signing; never commit keys. No script invocation in this change broadcast a public transaction.

Generate the offline artifact review with `pnpm prepare:deployment`. It does not connect to RPC or sign; unresolved signer/asset fields are not deployment evidence.

Before any broadcast: inspect current runtime, verify compilation, review asset and constructor inputs, confirm signer/funding, prepare the exact manifest, simulate, and obtain explicit authorization. See [Portaldot activation](../docs/PORTALDOT_TESTNET.md). After authorized deployment, `pnpm configure:deployment <broadcast-file>` verifies compiled creation input, canonical finalized receipts, code, ownership and wiring, then writes runtime hash pins and public configuration. Rebuild the app after import. Missing finalized-history support blocks import; it must not silently downgrade to finality assumptions.

The October 28 vault change requires a new deployment. Existing immutable vaults are not upgraded by changing source or ABIs. New creation artifacts must be rebuilt before preparing native payloads. Never substitute invented deployment addresses.

Read [the current engineering review](../docs/ENGINEERING_REVIEW_2026-10-28.md) for evidence, threat model and outstanding release gates.

## RFQ-first restoration extensions

- `KudexRfqExecutor` is a **separate**, immutable fixed-router executor. Each owner policy
  fixes delegate/maker/pair, minimum rational base-unit exchange rate (rounded up), UTC-day,
  action and lifetime payment caps, expiry and revocation. No arbitrary calls, receiver,
  withdrawal, fee extraction or deposit-policy privilege escalation. Acquired tokens go
  directly to the policy owner and temporary router allowances are cleared. Policies and
  exact transfers are tested locally, including failed signature, cancelled/replayed quote,
  price/expiry/cap failures and taxed-token rollback. It is not a hosted worker.
- `KudexTestCreditFacility` is an immutable, unbacked, zero-interest chain-420420777 test
  facility. Fixed senior/junior targets and funding/maturity/grace terms, permissioned
  subscription, one-time debtor disbursement, failed-raise refunds, actual repayment,
  cumulative senior-first claims and objective default/recovery. No issuer attestation,
  legal title, yield, DaaS call, off-chain asset seizure or owner cash rescue.
- `testnet/CryptoProbe.sol` and `testnet/RestorationSmoke.sol` are constructor diagnostics
  used through `eth_call` only. Their ABI return bytes are not deployed runtime contracts.

All new custody/execution bytecode needs independent review and separately authorized
new deployments. Existing deployment scripts are **not** silently expanded to publish
these extensions. `NEXT_PUBLIC_RFQ_EXECUTOR_*` remains blank. See
[credit design](../docs/CREDIT_AND_DAAS.md) and
[confidentiality specification](../docs/CONFIDENTIALITY_PROTOCOL.md).
