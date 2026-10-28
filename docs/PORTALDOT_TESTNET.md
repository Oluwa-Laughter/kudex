# Portaldot V3 activation

Current inventory, October 28 fixes, test evidence and release gates: [engineering review](ENGINEERING_REVIEW_2026-10-28.md). Earlier dated observations below are historical. The AMM workspace remains at `/app/marketplace`; signed RFQ is now `/app/rfq`.

Updated 2026-10-17. The network is reachable. Contract publication is still pending funding and wallet signatures.

## Verified network

| Setting | Value / observation |
| --- | --- |
| EVM HTTP | `https://test-evm-rpc-v3.portaldot.dev` |
| Native WebSocket | `wss://test-node-v3.portaldot.dev` |
| Node console | `https://node-console.portaldot.dev/` |
| EVM chain ID | `420420777` |
| Native genesis hash | `0xd4f9acbcf7f52388d8b095abe3c198d19fc510e0343e643e87cfbccb155283bd` |
| Runtime | `portaldot-v3`, spec version `3002` |
| Native currency | `tPOT`, 14 decimals, SS58 prefix 42 |
| Ethereum RPC currency | `tPOT`, 18 decimals |
| Denomination evidence | `revive.nativeToEthRatio = 10000` |
| Bytecode support | `revive.allowEVMBytecode = true` |
| Native account mapping | `revive.autoMap = true`; explicit mapping is a documented no-op in this mode |

The EVM endpoint answered chain, block, gas-price, fee-history, balance, nonce, logs, code and call probes. The localhost-origin HTTP probe returned `Access-Control-Allow-Origin: *`. This does not establish every production origin or wallet behavior. Native HTTP on the same node host was separately tested and is used by CLI inspection because large runtime-metadata replies timed out through the WebSocket proxy.

A block-zero EVM query failed because the RPC had discarded that historical state. Do not build indexing or deployment logic that assumes this provider is archival. Native `chain_getBlockHash(0)` remains available.

## Native Portaldot account ownership

A native SS58 account can instantiate Solidity contracts through `revive.instantiateWithCode` and call contracts through `revive.call`. The runtime exposes an H160 contract-facing address for that account via `ReviveApi_address`. This does not create a separate EVM key. A native signer signs Substrate extrinsics; an Ethereum wallet cannot sign as an unrelated sr25519 native account.

The public native wallet supplied for registration was checked and had **zero free tPOT** at inspection time. Submission to the faucet is not evidence that the allocation has arrived. The earlier EVM wallet also had zero gas balance. Recheck before taking any funding action:

```sh
pnpm inspect:portaldot --native-address <your-native-address> --evm-address <optional-EVM-address>
```

`--evm-address` is optional. The tool reads the runtime account mapping; it does not manufacture a mapping from a substring of an SS58 address. It never signs or submits transactions. For an EVM account it can report the associated native funding address, but verify ownership and current mapping before transferring funds. No bridge is assumed.

The app wallet connector is currently EVM-based. Native deployment preparation is provided below; native browser-wallet transaction integration is a separate remaining task. The Portaldot wallet must expose a supported native signing interface, or native extrinsic tooling must be used. The wallet repository's README alone does not establish browser injection compatibility.

## Native deployment preparation

Compile first:

```sh
forge build --root contracts
```

Use `prepare:native` to simulate ONE native constructor and prepare an unsigned `revive.instantiateWithCode` payload. Supply an explicit maximum storage deposit in native tPOT. There is no implicit unlimited storage allowance, default spending budget, seed entry, or signing function in the helper.

```sh
pnpm prepare:native \
  --contract KudexTestToken \
  --origin <your-native-address> \
  --storage-cap <maximum-storage-deposit-in-tPOT>
```

Choose the storage cap after reviewing the runtime costs and available balance; code storage and account deposits can be substantial. The command rejects a zero-funded origin. After funding, it uses `ReviveApi_instantiate` to estimate execution, rejects constructor errors/reverts, adds 20% weight headroom, and reports the partial transaction fee separately from the storage cap. Its funded native signing/finalization path has not yet been tested.

The output includes `callHex` for decoding in compatible native extrinsic tooling. Select the same SS58 origin, verify the method, constructor and storage cap, then sign with the native wallet. Preparation is not submission. Regenerate immediately before signing; record finalized extrinsic/block evidence and actual contract addresses rather than treating a simulated address as a deployment.

Deploy in this order, using finalized addresses as constructor arguments:

| Contract | `--args` JSON |
| --- | --- |
| KudexTestToken (optional, unbacked test collateral) | `[]` |
| Groth16Verifier (deliberately disabled privacy placeholder) | `[]` |
| KudexVault | `["COLLATERAL_ADDRESS","Kudex Public Treasury Vault","kVAULT","VERIFIER_ADDRESS"]` |
| KudexRFQMarket | `[]` |
| KudexDaaSAdapter | `["VAULT_ADDRESS"]` |

Then use a separately reviewed native `revive.call` to invoke `vault.setDefaultController(adapter)`. The vault and adapter owner should resolve to the native account's contract-facing address. Use native finalized-event evidence to verify deployments and wiring before configuring application addresses. **The EVM Foundry receipt importer below does not accept native extrinsic records.**

The test token has six decimals and a fixed initial supply allocated to its actual creator. It is restricted to chain 420420777 and makes no USD, RWA or yield claim. It is not automatically enabled. The contract can be replaced by an existing verified collateral token.

## Alternative: EVM keystore deployment

This is optional; a native account is a valid deployment path. If using an EVM signer, first fund its runtime-associated account and use a local encrypted Foundry keystore or hardware wallet. No key needs to be shared with anyone.

Set `PORTALDOT_COLLATERAL_ADDRESS` to real deployed collateral, or explicitly set `KUDEX_DEPLOY_TEST_ASSET=true` to deploy KTEST for testing. These are actual testnet contracts, not browser-simulated balances.

After building and reviewing a dry run:

```sh
forge script --root contracts script/Deploy.s.sol:DeployKudex \
  --rpc-url https://test-evm-rpc-v3.portaldot.dev \
  --account kudex-testnet --sender <your-EVM-address>
```

Add `--broadcast` only when ready to publish reviewed transactions using the funded signer. The script is restricted to the announced testnet and sets the default-controller link while retaining owner administration. It does not read a private key from `.env.local`.

After ALL transactions confirm:

```sh
pnpm configure:deployment contracts/broadcast/Deploy.s.sol/420420777/run-latest.json
pnpm check:network
pnpm build
```

The importer checks chain identity, creation receipts, exact constructor transaction input against local compiled artifacts, code presence, asset address, owners, verifier, adapter registration and default-controller wiring. It writes a public deployment manifest and updates local public addresses only after those checks. Raw broadcast traces are ignored by Git. This importer is prepared but its successful live import path awaits an actual deployment.

## Repeatable verification

```sh
pnpm check:network --rpc-only
pnpm test:network
pnpm test:deployment
forge test --root contracts
pnpm test:runtime
pnpm build
```

`test:runtime` executes the compiled diagnostic on the live EVM RPC using a read-only `eth_call` and temporary state overrides. It creates diagnostic assets only inside that discarded state. At block **72525**, it passed vault deposit/withdrawal, ERC-1271 RFQ settlement, nonce/replay and unsigned-order rejection, default freeze with exits available, and the disabled verifier check. It did not send a transaction, create durable assets or establish a live application deployment.

Current local suite: 29 Solidity tests, five denomination/network regression tests and three deployment-import rejection tests pass. The production build and local HTTP checks for readiness/vault/marketing content also pass; the production dependency audit reports no high or critical advisories and three moderate wallet-dependency findings. Browser wallet signing, funded native deployment, successful manifest import and live application deposit/withdrawal receipts remain to be verified.
