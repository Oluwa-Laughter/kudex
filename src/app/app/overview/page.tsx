import Link from 'next/link';
const tasks = [
  [
    '/app/marketplace',
    'Request private liquidity',
    'Sign an invitation for a named counterparty, review exact quotes and settle publicly.',
  ],
  [
    '/app/settlement',
    'Prepare confidential settlement',
    'Review the privacy boundary and public custody foundation. Private transfers remain disabled.',
  ],
  [
    '/app/agents',
    'Authorize a bounded agent',
    'Review deposit policies and agent-assisted RFQ terms. Trading delegation requires separate infrastructure.',
  ],
  [
    '/app/credit',
    'Inspect credit facilities',
    'Understand issuer, repayment and default requirements. No investment offerings are listed.',
  ],
  [
    '/app/activity',
    'Inspect settlement evidence',
    'Read chain-derived observations. Missing or pruned history remains unavailable.',
  ],
  [
    '/app/compliance',
    'Review disclosure controls',
    'Public receipts are evidence; cryptographic viewing permissions are still developing.',
  ],
];
export default function Page() {
  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow">Kudex · Portaldot V3 Testnet</p>
        <h1 className="page-title">
          Your private financial operations,
          <br />
          under your control.
        </h1>
        <p className="page-description">
          Negotiate liquidity, review settlement and bound delegated authority. Current
          token movements are public; confidential settlement is a development capability.
        </p>
      </header>
      <section aria-label="Financial workflows" className="grid gap-x-10 md:grid-cols-2">
        {tasks.map(([href, title, text]) => (
          <Link
            href={href}
            key={href}
            className="group border-t border-border py-7 focus-visible:rounded-lg"
          >
            <h2 className="text-xl font-semibold group-hover:text-primary">{title}</h2>
            <p className="mt-3 max-w-prose leading-7 text-muted-foreground">{text}</p>
          </Link>
        ))}
      </section>
      <p className="rounded-xl bg-secondary p-5 text-sm leading-6">
        Testnet only. No real funds. Execution requires verified contracts and the correct
        signing account. Native account mapping does not grant an EVM wallet signing
        rights.
      </p>
    </div>
  );
}
