import Link from 'next/link';
import { FiArrowRight, FiInfo } from 'react-icons/fi';

export interface ProductStoryProps {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  steps: { title: string; text: string }[];
  limitations: string[];
}

export function ProductStory({
  eyebrow,
  title,
  description,
  status,
  steps,
  limitations,
}: ProductStoryProps) {
  return (
    <article className="mx-auto max-w-screen-2xl px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="max-w-4xl text-4xl font-semibold sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="page-description">{description}</p>

      <div className="mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-secondary p-5">
        <FiInfo className="mt-1 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-6">{status}</p>
      </div>

      <section className="mt-16 grid gap-7 lg:grid-cols-[.7fr_1.3fr]">
        <h2 className="text-2xl font-semibold">How the workflow fits together</h2>
        <ol className="divide-y divide-border border-t border-border">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-5 py-7">
              <span className="pt-1 font-mono text-sm text-primary">0{index + 1}</span>
              <div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 rounded-2xl border border-border p-6 sm:p-9">
        <h2 className="text-xl font-semibold">Know before you start</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {limitations.map((text) => (
            <li className="flex gap-3 text-sm leading-6 text-muted-foreground" key={text}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {text}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link className="action-link" href="/app/overview">
          Open workspace <FiArrowRight aria-hidden="true" />
        </Link>
        <Link className="quiet-link" href="/how-it-works">
          Read the user guide
        </Link>
      </div>
    </article>
  );
}
