import Link from 'next/link';
import {
  FiArrowRight,
  FiLayers,
  FiSliders,
  FiEye,
  FiCheck,
  FiArrowDown,
} from 'react-icons/fi';
import { HeroReveal } from '@/components/product/HeroReveal';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-5 sm:px-10 lg:px-16">
      <HeroReveal>
        <section className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:py-28">
          <div>
            <p data-hero-part className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Settlement for people and agents
            </p>
            <h1
              data-hero-part
              className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl lg:text-7xl"
            >
              Your capital.
              <br />
              <span className="text-primary">Your conditions.</span>
            </h1>
            <p
              data-hero-part
              className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground"
            >
              Vault capital, signed liquidity offers, and bounded agents in one settlement
              workspace. Built on Portaldot, with confidential payments and structured
              real-world credit as the next product layers.
            </p>
            <div data-hero-part className="mt-9 flex flex-wrap gap-3">
              <Link className="action-link" href="/app/overview">
                Explore the workspace <FiArrowRight aria-hidden="true" />
              </Link>
              <Link className="quiet-link" href="/how-it-works">
                Understand the flow
              </Link>
            </div>
            <p data-hero-part className="mt-5 text-sm text-muted-foreground">
              Testnet release. Current asset balances and trades are public; funding and
              verified deployments are required to transact.
            </p>
          </div>
          <div
            data-hero-part
            className="relative rounded-[2rem] border border-border bg-card p-6 sm:p-9"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="font-medium">An authorization, made clear</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                Conceptual flow
              </span>
            </div>
            {[
              {
                icon: FiLayers,
                title: 'Choose a vault',
                text: 'Know the asset and where it goes.',
              },
              {
                icon: FiSliders,
                title: 'Set the conditions',
                text: 'Choose an action, a cap, and an expiry.',
              },
              {
                icon: FiEye,
                title: 'Confirm the result',
                text: 'Read the receipt and keep control.',
              },
            ].map((item, index) => (
              <div key={item.title}>
                {index > 0 && (
                  <div className="ml-6 py-3 text-muted-foreground">
                    <FiArrowDown aria-hidden="true" />
                  </div>
                )}
                <div className="flex gap-4 rounded-2xl border border-border bg-background p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <item.icon size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-normal">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
            <p className="mt-7 flex items-start gap-2 text-sm text-muted-foreground">
              <FiCheck className="mt-1 shrink-0 text-primary" aria-hidden="true" />
              Agent authorization is a separate step. Connecting a wallet grants no
              spending permission.
            </p>
          </div>
        </section>
      </HeroReveal>
      <section className="border-y border-border py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [
              'Capital with clear terms',
              'Review the asset, quantity, counterparty, and authorization before you sign.',
            ],
            [
              'One complete exchange',
              'Signed RFQ offers exchange both token legs in one transaction, with nonce and expiry controls.',
            ],
            [
              'Control before automation',
              'Agent policies are explicit, bounded, and revocable. Deployment and worker activation are separate.',
            ],
          ].map(([title, text]) => (
            <div key={title}>
              <h2 className="text-base font-semibold tracking-normal">{title}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-20 sm:py-24">
        <p className="eyebrow">A deliberate starting point</p>
        <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
          Less guessing.
          <br />A clear path from intent to receipt.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Set your trade terms',
              text: 'Create a signed offer or review a counterparty’s exact quantities before a full token exchange.',
              href: '/app/marketplace',
              link: 'Explore RFQ trading',
            },
            {
              n: '02',
              title: 'Use the public vault',
              text: 'Review an exact token allowance, deposit test collateral, and withdraw available assets.',
              href: '/app/vaults',
              link: 'Explore vaults',
            },
            {
              n: '03',
              title: 'Prepare a bounded agent',
              text: 'Define the limits first. Review your policy before any on-chain authorization.',
              href: '/app/agents',
              link: 'Set up a policy',
            },
          ].map((item) => (
            <article key={item.n} className="panel flex flex-col">
              <span className="font-mono text-sm text-primary">{item.n}</span>
              <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
              <p className="mb-7 mt-3 text-muted-foreground">{item.text}</p>
              <Link
                className="mt-auto flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                href={item.href}
              >
                {item.link}
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="grid gap-8 rounded-[2rem] bg-secondary p-7 sm:p-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">The longer view</p>
          <h2 className="text-3xl font-semibold">
            Settlement designed
            <br />
            to earn your trust.
          </h2>
        </div>
        <div>
          <p className="max-w-xl leading-7 text-muted-foreground">
            Confidential transfers, structured credit, and cross-chain solver liquidity
            are the next layers of Kudex. Their privacy, accounting, and routing systems
            require further implementation and review. The current vault and RFQ flows
            settle public tokens.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
            href="/how-it-works"
          >
            See what is available <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
