import Link from 'next/link';
import { FiArrowRight, FiBookOpen } from 'react-icons/fi';
import { portaldotTestnet, PORTALDOT_NATIVE_WS } from '@/lib/chains/portaldot';

const contracts = [
  [
    'Public vault',
    'Immutable ERC-4626 custody with deposit, mint, withdraw, redeem, and an administrative deposit freeze. Public shares and balances.',
  ],
  [
    'RFQ settlement',
    'Immutable EIP-712 router. Signed exact-input/exact-output terms, full atomic fills, maker cancellation, one-use maker nonces, and ERC-1271 maker validation.',
  ],
  [
    'Bounded delegate',
    'Immutable deposit-only executor. Approved vaults, per-action/UTC-day/lifetime caps, expiry, owner revocation, and shares returned to the owner.',
  ],
  [
    'Policy registry',
    'Upgradeable approved-vault registry governed through a timelock. Custody contracts are not placed behind this proxy.',
  ],
  [
    'Risk adapter',
    'Registered vaults and authorized sentinels. Reads an owner-supplied score and can trigger a deposit freeze. No debt recovery or liquidation accounting.',
  ],
];

export default function DeveloperDocsPage() {
  return (
    <article className="mx-auto max-w-5xl px-5 py-14 sm:px-10 sm:py-20">
      <p className="eyebrow">
        <FiBookOpen aria-hidden="true" /> Developer reference
      </p>
      <h1 className="text-4xl font-semibold sm:text-5xl">
        Build on the actual protocol surface.
      </h1>
      <p className="page-description">
        Kudex’s current implementation and integration boundaries. Testnet compatibility,
        deployed contracts, and completed product capabilities are separate checks.
      </p>
      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-semibold">Network and execution</h2>
        <p className="leading-7 text-muted-foreground">
          Portaldot remains the underlying network. Revive provides its EVM-compatible
          contract path. Native accounts use SS58 addresses and 14-decimal POT; EVM RPC
          gas quantities use 18 decimals. The runtime mapping does not create an EVM
          private key.
        </p>
        <dl className="panel grid gap-5">
          {[
            ['EVM chain ID', portaldotTestnet.id.toString()],
            ['EVM RPC', portaldotTestnet.rpcUrls.default.http[0]],
            ['Native WebSocket', PORTALDOT_NATIVE_WS],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-all font-mono text-sm tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          The original 8890 chain configuration and retired endpoint are superseded.
          Application contract addresses are environment configuration; this page does not
          invent deployments.
        </p>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Contract interfaces</h2>
        <dl className="mt-6 divide-y divide-border border-t border-border">
          {contracts.map(([title, text]) => (
            <div key={title} className="grid gap-3 py-6 sm:grid-cols-[12rem_1fr]">
              <dt className="font-semibold">{title}</dt>
              <dd className="leading-7 text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-semibold">Signed offer integration</h2>
        <p className="leading-7 text-muted-foreground">
          The signed domain is KudexRFQMarket, version 1, bound to the configured chain
          and router. The Order fields are maker, tokenIn, tokenOut, amountIn, amountOut,
          deadline, and nonce. The maker offers tokenIn/amountIn and receives
          tokenOut/amountOut. Quantities, nonce, and expiry travel as integer strings in
          the kudex-rfq-v1 JSON envelope.
        </p>
        <p className="leading-7 text-muted-foreground">
          Use the marketplace’s export format for interchange. A signature is open to any
          taker who holds it. The maker and taker approve their outgoing token to the
          router separately. There are no partial fills, recipient restrictions, auctions,
          fees, or price oracle in this router. Removing allowance and cancelling a nonce
          are separate operations.
        </p>
      </section>
      <section className="mt-12 rounded-2xl bg-secondary p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Subsystems still in development</h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          The privacy path is disabled until there is a reviewed circuit, generated
          verifier, membership tree, value conservation, nullifier rules, recovery, and
          redemption. RWA issuance and waterfall accounting, cross-chain message
          verification, viewing keys, and hosted autonomous workers are not implemented
          product capabilities.
        </p>
      </section>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link className="action-link" href="/app/marketplace">
          Open signed-offer workspace <FiArrowRight aria-hidden="true" />
        </Link>
        <Link className="quiet-link" href="/how-it-works">
          Read the user guide
        </Link>
      </div>
    </article>
  );
}
