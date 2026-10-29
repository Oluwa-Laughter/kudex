'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import {
  FiArrowUp,
  FiCpu,
  FiActivity,
  FiUser,
  FiLayers,
  FiRepeat,
  FiSliders,
  FiX,
} from 'react-icons/fi';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import type { AgentReply } from '@/lib/agent/types';
interface Entry {
  id: string;
  question: string;
  reply?: AgentReply;
  error?: string;
  pending?: boolean;
  partial?: string;
}
const productPrompts = [
  {
    label: 'How do vault deposits and withdrawals work?',
    icon: FiLayers,
  },
  {
    label: 'How do RFQ requests, signed quotes and bounded mandates work?',
    icon: FiRepeat,
  },
  {
    label: 'How do I give a deposit agent bounded permissions?',
    icon: FiSliders,
  },
] as const;
const liveChecks = [
  { mode: 'network', label: 'Check the testnet', icon: FiActivity },
  { mode: 'account', label: 'Check wallet funding', icon: FiUser },
  { mode: 'vault', label: 'Inspect the vault', icon: FiLayers },
] as const;
const labels: Record<string, string> = {
  chainId: 'Chain ID',
  block: 'Observed block',
  observedAt: 'Observed at',
  gasTPOT: 'EVM gas balance (tPOT)',
  nativeFreeTPOT: 'Native free balance (tPOT)',
  finalizedBlock: 'Finalized block',
  contractAddress: 'Mapped contract address',
  depositFrozen: 'Deposits frozen',
  totalAssets: 'Total vault assets',
  symbol: 'Collateral symbol',
  status: 'Status',
  message: 'Next step',
  error: 'Check result',
  address: 'Account',
};
export function AgentConsole() {
  const { address } = useAccount();
  const { selected } = useNativeWallet();
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('');
  const controller = useRef<AbortController | null>(null);
  const availability = useQuery<{
    modelAvailable: boolean;
    provider: string;
    model: string | null;
  }>({
    queryKey: ['agent-availability'],
    queryFn: async () => {
      const r = await fetch('/api/agent/status');
      if (!r.ok) throw new Error('Could not check agent availability.');
      return r.json();
    },
    staleTime: 30_000,
    retry: 0,
  });
  useEffect(() => () => controller.current?.abort(), []);
  async function send(
    text: string,
    mode: 'ask' | 'network' | 'account' | 'vault' = 'ask',
  ) {
    if (pending || !text.trim()) return;
    const id = crypto.randomUUID();
    const abort = new AbortController();
    controller.current = abort;
    setEntries((current) => [
      ...current.slice(-9),
      { id, question: text, pending: true },
    ]);
    setMessage('');
    setPending(true);
    setStatus('Checking the requested information…');
    try {
      let history = entries
        .filter((entry) => entry.reply)
        .slice(-3)
        .flatMap((entry) => [
          { role: 'user', content: entry.question },
          { role: 'assistant', content: entry.reply!.text.slice(0, 2000) },
        ]);
      const context = {
        ...(selected ? { nativeAddress: selected.address } : {}),
        ...(address ? { evmAddress: address } : {}),
      };
      let body = JSON.stringify({ message: text, mode, history, context });
      while (new TextEncoder().encode(body).byteLength > 11000 && history.length) {
        history = history.slice(2);
        body = JSON.stringify({ message: text, mode, history, context });
      }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        signal: abort.signal,
        body,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'The agent could not complete the request.');
      }
      if (!response.body) throw new Error('The response stream was unavailable.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '',
        completed = false;
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === 'status') setStatus(event.text);
        if (event.type === 'delta')
          setEntries((current) =>
            current.map((entry) =>
              entry.id === id
                ? { ...entry, partial: (entry.partial ?? '') + event.text }
                : entry,
            ),
          );
        if (event.type === 'error') throw new Error(event.error);
        if (event.type === 'result') {
          completed = true;
          setEntries((current) =>
            current.map((entry) =>
              entry.id === id
                ? { ...entry, reply: event.result, pending: false, partial: undefined }
                : entry,
            ),
          );
        }
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let end;
          while ((end = buffer.indexOf('\n')) !== -1) {
            consume(buffer.slice(0, end));
            buffer = buffer.slice(end + 1);
          }
          if (buffer.length > 100000)
            throw new Error('The response exceeded the expected size.');
        }
        buffer += decoder.decode();
        if (buffer.trim()) consume(buffer);
      } finally {
        reader.releaseLock();
      }
      if (!completed) throw new Error('The response ended before completion. Try again.');
      setStatus('Response ready. Review the observations below.');
    } catch (error) {
      const reason = abort.signal.aborted
        ? 'Request stopped. No transaction was submitted.'
        : error instanceof Error
          ? error.message
          : 'The request failed.';
      setEntries((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, error: reason, pending: false } : entry,
        ),
      );
      setStatus(reason);
    } finally {
      setPending(false);
      controller.current = null;
    }
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5 sm:p-7">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FiCpu size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Kudex Agent</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {availability.data?.modelAvailable
                ? 'Product guidance with live vault and account reads'
                : 'Conversation setup pending · Live data checks available'}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm text-primary">
          Your wallet stays in control
        </span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="grid gap-3 lg:grid-cols-3">
          {productPrompts.map((prompt) => (
            <button
              key={prompt.label}
              disabled={pending || !availability.data?.modelAvailable}
              onClick={() => void send(prompt.label)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <prompt.icon
                className="shrink-0 text-primary"
                size={18}
                aria-hidden="true"
              />
              {prompt.label}
            </button>
          ))}
        </div>
        <details className="mt-4 rounded-xl border border-border px-4">
          <summary className="min-h-12 cursor-pointer py-3 text-sm font-medium">
            Check live network, wallet, or vault data
          </summary>
          <div className="grid gap-3 pb-4 sm:grid-cols-3">
            {liveChecks.map((check) => (
              <button
                key={check.mode}
                disabled={pending}
                onClick={() => void send(check.label, check.mode)}
                className="flex min-h-12 items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary disabled:opacity-50"
              >
                <check.icon
                  className="shrink-0 text-primary"
                  size={18}
                  aria-hidden="true"
                />
                {check.label}
              </button>
            ))}
          </div>
        </details>
        {!entries.length && (
          <div className="py-10 sm:py-14">
            <h3 className="max-w-lg text-2xl font-semibold sm:text-3xl">
              Move from product intent
              <br />
              to a reviewed next step.
            </h3>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              Ask how vaults, signed orders, and bounded agents fit together. Kudex Agent
              explains what the product can do today, checks live data when needed, and
              guides you to the right workflow. Every transaction still needs your wallet.
            </p>
          </div>
        )}
        <div className="mt-6 space-y-6" role="region" aria-label="Agent conversation">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="agent-response border-t border-border pt-6"
            >
              <p className="mb-4 text-sm font-semibold">{entry.question}</p>
              {entry.pending && entry.partial ? (
                <p className="max-w-3xl whitespace-pre-wrap leading-7">{entry.partial}</p>
              ) : entry.pending ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span
                    className="agent-working h-2 w-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  Reading the requested state…
                </div>
              ) : entry.error ? (
                <p role="alert" className="text-sm text-destructive">
                  {entry.error}
                </p>
              ) : (
                entry.reply && (
                  <>
                    <p className="max-w-3xl whitespace-pre-wrap leading-7">
                      {entry.reply.text}
                    </p>
                    <div className="mt-5 space-y-3">
                      {entry.reply.evidence.map((item) => (
                        <details
                          key={item.tool}
                          className="rounded-xl border border-border bg-background p-4"
                          open={entry.reply!.evidence.length === 1}
                        >
                          <summary className="min-h-11 cursor-pointer text-sm font-medium">
                            {item.title}{' '}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {item.status === 'observed' ? 'Observed' : 'Unavailable'}
                            </span>
                          </summary>
                          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                            {Object.entries(item.data)
                              .filter(([key]) => key in labels)
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className={
                                    typeof value === 'string' && value.length > 42
                                      ? 'sm:col-span-2'
                                      : ''
                                  }
                                >
                                  <dt className="text-sm text-muted-foreground">
                                    {labels[key]}
                                  </dt>
                                  <dd className="mt-1 break-all text-sm">
                                    {typeof value === 'boolean'
                                      ? value
                                        ? 'Yes'
                                        : 'No'
                                      : String(value)}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                          {Array.isArray(item.data.contracts) && (
                            <ul className="mt-4 space-y-2 text-sm">
                              {(
                                item.data.contracts as { name: string; status: string }[]
                              ).map((contract) => (
                                <li
                                  key={contract.name}
                                  className="flex flex-wrap justify-between gap-3 border-t border-border pt-2"
                                >
                                  <span>{contract.name}</span>
                                  <span className="text-muted-foreground">
                                    {contract.status.replaceAll('-', ' ')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </details>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {entry.reply.mode === 'gemini'
                        ? 'Gemini response'
                        : 'Guided live check'}{' '}
                      · {new Date(entry.reply.observedAt).toLocaleTimeString()} ·
                      Observations can change
                    </p>
                  </>
                )
              )}
            </article>
          ))}
        </div>
        {availability.data?.modelAvailable && (
          <form
            className="mt-7"
            onSubmit={(event) => {
              event.preventDefault();
              void send(message);
            }}
          >
            <label className="sr-only" htmlFor="agent-message">
              Ask Kudex Agent about the product or a workflow
            </label>
            <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-2">
              <textarea
                id="agent-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={1500}
                rows={2}
                placeholder="Ask about settlement, an RFQ, or agent permissions"
                className="min-h-12 min-w-0 flex-1 resize-y bg-transparent px-3 py-2 text-base"
                disabled={pending}
              />
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                type="submit"
                disabled={pending || !message.trim()}
                aria-label="Send message"
              >
                <FiArrowUp size={20} />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your messages, connected public addresses, and tool observations may be sent
              to Google. Never include keys or recovery phrases.
            </p>
          </form>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
          {pending && (
            <button className="quiet-link" onClick={() => controller.current?.abort()}>
              <FiX aria-hidden="true" />
              Stop request
            </button>
          )}
        </div>
        {availability.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {availability.error.message}
          </p>
        )}
      </div>
    </section>
  );
}
