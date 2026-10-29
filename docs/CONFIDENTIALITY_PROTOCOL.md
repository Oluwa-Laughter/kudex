# Confidential settlement protocol candidate and activation gates

This is a specification/research boundary, not a deployed shielded pool. The existing
Groth16 verifier and vault confidential-transfer entry point remain fail-closed.

## Runtime evidence and proving-system decision

On 2026-10-29 the `CryptoProbe` constructor was executed entirely in a read-only
Portaldot V3 `eth_call` with an ephemeral caller-balance override. At block 242074,
five known-answer tests passed: BN254 addition identity, scalar multiplication by
one, nonidentity pairing returning false, cancelling pairings returning true, and
malformed G1 point rejection. See `PORTALDOT_CRYPTO_PROBES.json` for the block hash.
Direct calls had previously failed with `Invalid call: Payment`; those failures are
retained in `PORTALDOT_CRYPTO_DIRECT_PROBES.json` and are not evidence of absent
precompiles. Specifications: [EIP-196](https://eips.ethereum.org/EIPS/eip-196),
[EIP-197](https://eips.ethereum.org/EIPS/eip-197). General Revive documentation is
[here](https://docs.polkadot.com/smart-contracts/precompiles/); actual target-runtime
measurements take precedence over assumptions about another chain.

BN254 Groth16 is a viable *candidate*, not an approved system: constant verifier size
and three pairings fit these primitives, but circuit soundness, trusted setup,
compiler/tool versions, public input encoding and actual proof verification remain
unverified. A universal-setup alternative reduces circuit-specific ceremony needs
but needs its own verifier, gas/runtime evidence and tooling review. Transparent
systems avoid a trusted setup but have larger proofs and require separate cost and
hash-function analysis. Do not activate any verifier merely from precompile support.

## Proposed note and transaction relation

Use one reviewed exact-transfer collateral per pool initially, two inputs and two
outputs, fixed Merkle depth and strictly bounded integers. A note commits to protocol
version, chain, pool, asset, value, recipient spending public key, a high-entropy
secret and blinding. Select a reviewed circuit-native hash and key scheme before
freezing field encodings; keccak-derived browser identifiers are not substitutes.

Public inputs must include chain/pool/version domain, asset, accepted tree root,
input nullifiers, output commitments, public withdrawal recipient/amount, relayer fee
and any external-call binding. Private witnesses include note secrets, values,
spending authorization and Merkle paths. Constrain every range and binding, valid
ownership, membership for real inputs, unambiguous dummy-input treatment, distinct
real nullifiers, conservation `sum(inputs)+publicDeposit = sum(outputs)+publicWithdrawal+fee`
and appropriate empty-note encoding. Hash-to-field must not silently truncate bits.

The on-chain pool must own custody, maintain an incremental commitment tree and a
bounded accepted-root history, reject unknown roots and reused/duplicate nullifiers,
mark nullifiers before external transfers, insert outputs atomically and verify exact
asset movements. A failing second transfer must roll back every nullifier and tree
update. Migration requires explicit version/domain separation and backing accounting.
No circuit, setup, proof artifact or production note commitment implementing this
relation has yet been supplied by this repository.

## Discovery, recovery and restricted disclosure

A separate audited recipient-encryption design must bind ciphertext to note
commitment/domain and support authenticated encryption, distinct spending/viewing
keys, sender authentication policy and key rotation. Recipient scanning of encrypted
output announcements leaks access patterns unless separately mitigated. Backups must
be encrypted under user-controlled keys, never browser plaintext or server/LMM keys.
Wrong-password/tamper handling must fail closed. Lost secrets may mean lost funds.

Viewing capabilities must be scoped by purpose, recipient, domain and selected
records. Decrypting a selected note is not a full-history authorization or proof of
solvency. Revocation cannot erase already disclosed information. Auditors require
verifiable inclusion, amount/ownership evidence and freshness; a dashboard badge or
random viewing-key string supplies none of these guarantees.

## Threats and required tests

Soundness and setup compromise; malformed/noncanonical fields or curve points;
missing range/balance constraints; duplicate nullifiers; cross-pool/chain replay;
root-history manipulation; stolen spending/viewing keys; malicious collateral;
front-running altered public recipients/fees; relayer censorship; prover memory and
backup leakage; RPC/indexer inconsistency; governance compromise.

Activation requires independent circuit review, reproducible tool/artifact hashes,
setup provenance, independently generated positive and negative proof vectors,
mutation/fuzz tests of every public input, double-spend and rollback tests, real
runtime verification and gas/prover measurements, recovery/disclosure tests and an
authorized funded testnet journey. Neither a local mock nor this precompile probe
meets those gates.

Deposits/withdrawals expose public ERC-20 amounts and addresses. Timing, gas payers,
small anonymity sets, RFQ settlement terms and network access can identify users.
Private negotiation is not private settlement. No perfect anonymity, hidden mempool,
zero MEV, guaranteed solvency or confidential DaaS action is claimed.
