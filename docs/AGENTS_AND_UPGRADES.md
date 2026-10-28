# Bounded agents and upgrade governance

Current inventory, October 28 fixes, test evidence and release gates: [engineering review](ENGINEERING_REVIEW_2026-10-28.md). Earlier dated observations below are historical. The AMM workspace remains at `/app/marketplace`; signed RFQ is now `/app/rfq`.

## Release boundary

This repository now includes a deposit-only delegate executor and an upgradeable vault-policy registry. Neither is deployed by the main deployment script. Their tests are local; no live agent policy or background worker is activated. The web policy builder exports a draft and provides a separate owner-signed policy creation control after infrastructure checks. Policy controls support allowance changes, revocation, and one delegate-signed deposit after deployment. See [AGENT_SETUP.md](AGENT_SETUP.md) for the Google assistant and current UI paths.

The existing `KudexVault` and `KudexRFQMarket` remain immutable. They use constructor initialization and must not be put behind a proxy. Vault changes require a separately deployed version and explicit user migration. Confidential transfers remain disabled.

## Why the upgrade boundary is narrow

A `TransparentUpgradeableProxy` wraps only `KudexPolicyRegistry`, which holds an approved-vault mapping and no user funds. Its implementation disables initializers; the proxy initializes atomically. Both its governor and the proxy's `ProxyAdmin` owner are a `TimelockController`, initially configured for a two-day delay with no bootstrap admin. Only the nominated governance address can propose and execute operations. In production, use a reviewed multisig, independent reviewers, and a published operation feed.

The delay is initially two days. Governance can change it only through a timelocked self-call; this is governance trust, not an unchangeable two-day guarantee. Upgrades and allowlist changes must be reviewed before scheduling. No unreviewed upgrade is safe merely because a proxy is standard. Future upgrades require a storage-layout diff, regression suite, fork rehearsal, and bytecode verification; current tests demonstrate storage preservation for the included test V2 only.

Registry removal blocks future delegated deposits into a vault. It does not unwind deposits, revoke token allowances, or recover assets. An upgrade can alter registry behavior after the delay; the immutable executor still fixes each policy's vault, collateral, delegate, recipient, and limits.

References: [OpenZeppelin proxy contracts](https://docs.openzeppelin.com/contracts/5.x/api/proxy), [Writing upgradeable contracts](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable).

## Executor authority

`KudexAgentExecutor.createPolicy(delegate, vault, expiresAt, perActionCap, dailyCap, totalCap)` is called by the owner. The owner is `msg.sender`; no caller can create a policy on another owner's behalf. The vault must be approved and its asset must be a contract. Policies expire after at most 30 days.

Execution requires the exact delegate, an unrevoked/unexpired policy, continuing registry approval, and an unchanged vault asset. Caps use collateral base units and `0 < perAction <= daily <= total`. Daily accounting resets at UTC midnight, not over a rolling 24-hour window; up to two daily caps can occur around a midnight boundary. All policies are independent: creating multiple policies multiplies the aggregate authority. Allowances are a separate cumulative constraint.

Only the exact requested collateral is pulled from the owner. The executor grants the vault an exact temporary allowance, deposits for the owner, clears its vault allowance, checks received shares, and leaves no new residual collateral. Fee-on-transfer tokens are unsupported. Asset failure or vault revert rolls back budget and allowance updates atomically. There are no arbitrary calls, withdrawals, recipient changes, or administrator fund-sweep functions. Revoke with `revokePolicy(id)` and revoke the token allowance as a separate action.

Vault approval is a trust decision: a malicious approved vault can misrepresent its assets and shares. These checks are not a substitute for reviewing the vault. Share output can move before transaction inclusion; a minimum-share slippage parameter is not part of this first executor. Support only the reviewed public custody vault, without strategies or fees, until minimum-output protection is implemented.

## Deployment, after funding

1. Review the testnet contracts and signer. Verify Portaldot chain `420420777` and known genesis through the native inspector.
2. Set public `KUDEX_GOVERNOR_ADDRESS` to the governance account's actual contract-facing address. Deploy `contracts/script/DeployAgentInfrastructure.s.sol` with Foundry and a local keystore or supported hardware signer. The script is opt-in and testnet-only.
3. Record and independently verify the timelock, registry implementation, proxy, proxy admin, and executor bytecode and constructor arguments. Check admin ownership, governor, and delay. Extend the deployment verifier before exposing these addresses as activated in the web app.
4. Schedule `setVaultApproved(vault, true)` on the registry through the timelock. Wait for the delay, review, then execute. There is intentionally no instant bootstrap allowlist bypass.
5. Owner checks `asset()` and token decimals, then calls `createPolicy`. Record the emitted policy ID. A native account must sign an actual Substrate `revive.call` extrinsic from its extension; a mapped H160 is not an EVM signer. Existing native deployment preparation covers the core contracts only; the new infrastructure needs its own verified native construction flow before native use.
6. Owner grants a bounded collateral allowance to the executor. Fund the delegate's signing path. Confirm funding; do not infer it from wallet connection.

Do not feed a downloaded policy draft directly into a signer. Recheck expiry, addresses, decimals, registry approval, budgets, code provenance, and chain.

## Local deposit worker

Build artifacts with `forge build --root contracts`. The runner simulates one bounded deposit and prints only public execution details:

```sh
pnpm agent:run --executor 0xExecutor --policy 0xPolicyId --amount-base-units 1000000
```

To explicitly sign one attempt using a matching local Foundry keystore:

```sh
pnpm agent:run --executor 0xExecutor --policy 0xPolicyId --amount-base-units 1000000 --execute --account kudex-agent
```

Use actual addresses and a 32-byte policy ID. The runner verifies chain, policy limits, expiry, simulation, and signer identity. It uses no private-key environment variable. The EVM keystore runner is not a native extension signer. It is not scheduled, hosted, or an LLM agent; each invocation is one attempt. There is no automated retry: an uncertain submission must be reconciled by receipt and on-chain policy counters before another attempt, since a second valid deposit is a new authorized spend.

A production worker still needs authenticated job submission, durable transaction tracking, per-policy serialization, reconciliation after process failure, alerting, fee/nonce management, policy-event indexing, and monitored revocation. Do not introduce automatic retry until these are implemented. Agents are bounded by the contract, not by model instructions.

## Verification

- Agent contract tests: owner-only revocation, delegate authorization, cap enforcement, UTC rollover, expiry, revoked/removed vault rejection, failed-deposit rollback, received shares, cleared allowance, and fuzzed per-action rejection.
- Registry tests: locked/repeated initialization, unauthorized writes/upgrades, timelock delay, and V2 storage preservation.
- Web draft tests: exact token precision, fixed chain, explicit draft status, expiry bounds, invalid accounts and inconsistent caps.
- Runtime compatibility for the new governance and agent infrastructure still needs a funded deployment or dedicated live read-only constructor test. Existing core-vault runtime smoke evidence does not validate the new proxy stack.
