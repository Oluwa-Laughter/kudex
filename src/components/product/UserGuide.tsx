import Link from 'next/link';
import { FiArrowRight, FiDownload, FiInfo } from 'react-icons/fi';

const steps = [
  [
    'Choose your vault',
    'Open Vaults to review the collateral and the available deposit or withdrawal path. The app enables transactions only after the relevant deployment is configured.',
  ],
  [
    'Understand your wallet',
    'The Portaldot extension holds your native account. Test tokens are distributed to your registered address beginning with 5. The current vault form uses an EVM wallet; native extension transaction signing is not integrated into that form yet.',
  ],
  [
    'Verify the vault and asset',
    'After deployment, check the asset symbol, decimals, token balance, and withdrawal limit. Test collateral is not a dollar-backed stablecoin or an RWA investment.',
  ],
  [
    'Review and authorize',
    'Enter a precise deposit amount. If an allowance is needed, approve only that amount. Approval and deposit are separate transactions; an approval alone does not deposit funds.',
  ],
  [
    'Wait for the result',
    'Keep the wallet open while signing. Check the successful transaction receipt, then refreshed balances. Rejected signatures, RPC errors, and reverted transactions stay failures.',
  ],
  [
    'Withdraw when available',
    'Choose Redeem shares, check the maximum redeemable shares, review minimum asset output, and confirm. New deposits can be paused during default; withdrawals remain subject to available assets.',
  ],
];
export function UserGuide() {
  return (
    <article>
      <p className="eyebrow">Kudex user guide</p>
      <h1 className="page-title">Find your flow through Kudex.</h1>
      <p className="page-description">
        Manage vault capital, trade signed offers, and define bounded agent permissions.
        Start with a supported workflow and follow it through to a confirmed receipt.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link className="action-link" href="/app/overview">
          Choose a workflow <FiArrowRight aria-hidden="true" />
        </Link>
        <a className="quiet-link" href="/kudex-quickstart.md" download>
          <FiDownload aria-hidden="true" />
          Download this guide
        </a>
      </div>
      <aside className="mt-9 flex max-w-3xl gap-3 rounded-2xl bg-secondary p-5">
        <FiInfo className="mt-1 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-6">
          This is a testnet product. Current deposits and balances are public. Private
          transfers, credit tranches, bridging, and autonomous execution require further
          implementation or deployment.
        </p>
      </aside>
      <h2 className="mt-10 text-2xl font-semibold">Deposit and withdraw vault capital</h2>
      <ol className="mt-6 grid gap-5 lg:grid-cols-2">
        {steps.map(([title, text], i) => (
          <li className="panel" key={title}>
            <span className="font-mono text-sm text-primary">Step {i + 1}</span>
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Trade a signed offer</h2>
        <ol className="mt-6 divide-y divide-border border-t border-border">
          {[
            [
              'Create exact terms',
              'In RFQ trading, choose Create an offer. Enter two token contract addresses, the amount you offer, the amount you request, and an expiry. Review the loaded token details before signing. No market price is invented for you.',
            ],
            [
              'Sign, export, and fund',
              'The maker signs the full offer in the wallet, downloads the JSON, and shares it with a counterparty. Signing neither reserves tokens nor creates an allowance. The maker can review their own export and approve the exact offered amount separately. Anyone holding the signature may fill it.',
            ],
            [
              'Review as the taker',
              'Paste the export into Review an offer. Check the maker, both token addresses, quantities, expiry, router, and nonce state. The taker receives the offered token and pays the requested token. Connect the paying wallet, then refresh the review.',
            ],
            [
              'Approve payment, then fill',
              'Approve only the required payment amount if needed. After both sides have funds and allowance, choose Fill complete offer in wallet. The app simulates the exchange and reports success only after a matching settlement receipt. Orders fill in full; partial fills and private swaps are unavailable.',
            ],
            [
              'Cancel or remove permission',
              'The maker can cancel the nonce on-chain. This invalidates every offer sharing that nonce. Token allowance is separate: remove router allowance when it is no longer needed. Shared allowances are not a budget for one offer.',
            ],
          ].map(([title, text], index) => (
            <li key={title} className="grid gap-3 py-6 sm:grid-cols-[14rem_1fr]">
              <h3 className="font-semibold">
                {index + 1}. {title}
              </h3>
              <p className="max-w-3xl leading-7 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
        <Link className="action-link mt-6" href="/app/rfq">
          Open RFQ trading <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">When something needs attention</h2>
        <div className="mt-6 divide-y divide-border border-t border-border">
          {[
            [
              'My native wallet is connected, but I cannot deposit',
              'Native extension signing and EVM wallet signing are separate paths. Do not assume a mapped 0x address can be used in MetaMask. Wait for a supported native signing flow or use a separately funded EVM account under verified network instructions.',
            ],
            [
              'My wallet has no test tokens',
              'The organizer distributes tokens to registered native addresses. Until funding arrives, explore readiness and prepare policy drafts. Repeated transaction attempts will not create gas funds.',
            ],
            [
              'The contract is not configured',
              'Deployment is pending or this environment has no verified contract addresses. Do not substitute a random address. The vault should remain unavailable.',
            ],
            [
              'Approval succeeded but my vault balance did not change',
              'Approval permits a spender to move tokens. The deposit is a separate transaction. Review the deposit receipt before expecting shares.',
            ],
            [
              'How do I start an agent?',
              'Open Agents for product guidance and a bounded policy builder. After deployment, authorize the policy from the owner wallet, then use Policy controls to review allowance, revoke permission, or request one delegate-signed deposit. Continuous automation requires a separately operated worker. A draft download grants no authority.',
            ],
            [
              'Can the contracts be upgraded?',
              'The proposed first release keeps custody vaults immutable. A separate policy registry can be upgraded through a governance timelock. A new vault version requires explicit migration rather than silently changing existing vault code.',
            ],
          ].map(([title, text]) => (
            <details className="py-5" key={title}>
              <summary className="min-h-11 max-w-3xl pr-5 font-medium">{title}</summary>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{text}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
