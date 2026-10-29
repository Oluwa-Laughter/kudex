# Dependency change in the restoration round

A fresh October 29 production audit found four advisories: one high and three moderate.
The high advisory, [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f),
affects `decode-uri-component <=0.5.0` through wagmi/connectors → optional WalletConnect/
Reown providers → WalletConnect utils → query-string 7.1.3. Untrusted URL/query input
reaches this decoder; injected-only tests do not establish WalletConnect immunity.

The fixed upstream 0.5.1 is ESM-only whereas query-string 7 uses CommonJS `require`.
A blind version override breaks that API. The targeted override uses upstream 0.5.1
and a checked-in pnpm patch adding `index.cjs` and conditional exports. The CJS body is
exactly upstream `index.js` with `export default function` changed to
`module.exports = function`; no decoding algorithm is invented here. The upstream MIT
license is retained. Lockfile patch hashes bind the compatibility build. Initial patch
generation omitted the new CJS file; actual require tests caught it and the final patch
explicitly includes that file. This failure is not counted as a passing check.

`tests/dependency-compat.test.mjs` loads the actual transitive query-string dependency,
checks valid and malformed sequences against the ESM build, checks query parsing and
serialization, verifies exact algorithm-source equivalence and exercises 100,000
percent-encoded bytes with a malformed suffix under a two-second local bound. This is
a regression bound, not a complete performance or wallet-vendor certification.

The final production audit output is in `verification/dependency-audit.txt`. Two moderate
UUID issues remain in optional wallet/mobile dependencies; an audit threshold pass is
not a clean dependency inventory. No cryptographic or core wallet major upgrade was
forced. Real WalletConnect mobile/provider acceptance remains a release gate. Maintain
or remove this patch when upstream callers support the ESM API directly.
