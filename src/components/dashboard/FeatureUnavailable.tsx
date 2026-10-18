import Link from 'next/link';
import { FiArrowRight, FiBookOpen, FiTool } from 'react-icons/fi';
export function FeatureUnavailable({
  title,
  description,
  requirements,
}: {
  title: string;
  description: string;
  requirements: string[];
}) {
  return (
    <section className="space-y-9">
      <header>
        <p className="eyebrow">
          <FiTool aria-hidden="true" />
          In development
        </p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </header>
      <div className="grid gap-7 lg:grid-cols-[1.3fr_1fr]">
        <section className="panel">
          <h2 className="text-xl font-semibold">What needs to be ready</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This workflow is not enabled on this deployment. Here is what is needed before
            you can use it.
          </p>
          <ol className="mt-7 divide-y divide-border">
            {requirements.map((item, i) => (
              <li key={item} className="flex gap-4 py-5">
                <span className="font-mono text-sm text-primary">0{i + 1}</span>
                <p className="text-sm leading-6">{item}</p>
              </li>
            ))}
          </ol>
        </section>
        <aside className="rounded-2xl bg-secondary p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Keep exploring</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            See the public vault workflow or prepare an agent policy draft while this
            feature is being built.
          </p>
          <div className="mt-6 flex flex-col items-start gap-3">
            <Link className="action-link" href="/app/vaults">
              Explore the vault <FiArrowRight aria-hidden="true" />
            </Link>
            <Link className="quiet-link" href="/app/how-it-works">
              <FiBookOpen aria-hidden="true" />
              Read the user guide
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
              href="/app/agents"
            >
              Prepare an agent policy <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
