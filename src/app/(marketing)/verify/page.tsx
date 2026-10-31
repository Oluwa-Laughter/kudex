'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createPublicClient, http } from 'viem';
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiKey,
  FiPrinter,
  FiRefreshCw,
  FiShield,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import {
  decodeAuditorPass,
  formatQuickBooksXeroCsv,
  verifyAuditorPassOnChain,
  type VerifiedAuditStatement,
} from '@/lib/audit/auditorPass';
import { truncateAddress } from '@/lib/utils';

function VerifyPortalContent() {
  const searchParams = useSearchParams();
  const urlPass = searchParams.get('pass') ?? '';

  const [passInput, setPassInput] = useState(urlPass);
  const [statement, setStatement] = useState<VerifiedAuditStatement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  // Standalone public Viem client — zero wallet connection required
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: portaldotTestnet,
        transport: http(undefined, { timeout: 10_000, retryCount: 0 }),
      }),
    [],
  );

  const runVerification = useCallback(
    async (rawCode: string) => {
      setBusy(true);
      setError('');
      setStatus('');
      try {
        const decoded = decodeAuditorPass(rawCode);
        const verified = await verifyAuditorPassOnChain(decoded, publicClient);
        setStatement(verified);
        setStatus(
          verified.vaultReachable
            ? `Verified ${verified.rows.length} disclosed ledger ${
                verified.rows.length === 1 ? 'entry' : 'entries'
              } directly against the settlement vault at block #${verified.observedBlock}.`
            : `Decoded ${verified.rows.length} disclosed ledger ${
                verified.rows.length === 1 ? 'entry' : 'entries'
              } from signed read-only auditor pass.`,
        );
      } catch (cause) {
        setStatement(null);
        setError(
          cause instanceof Error
            ? cause.message
            : 'Auditor Pass could not be verified. Check the pasted code and try again.',
        );
      } finally {
        setBusy(false);
      }
    },
    [publicClient],
  );

  useEffect(() => {
    if (urlPass.trim()) {
      setPassInput(urlPass.trim());
      void runVerification(urlPass.trim());
    }
  }, [urlPass, runVerification]);

  function handleDownloadAccountingCsv() {
    if (!statement) return;
    const csvContent = formatQuickBooksXeroCsv(statement);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kudex-audit-statement-${statement.payload.issuedAt.slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Accounting CSV exported in QuickBooks / Xero format.');
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-10 px-4 py-12 sm:px-8 sm:py-16">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="emerald-badge">
            <FiShield aria-hidden="true" />
            <span>Wallet-Less Public Auditor Portal</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
            <FiKey className="text-primary" aria-hidden="true" />
            <span>1-Click Auditor Pass · Read-Only</span>
          </span>
        </div>

        <h1 className="page-title">Verify &amp; Audit Financial Statements</h1>
        <p className="page-description">
          Share a read-only pass with your accountant or tax auditor so they can verify
          your payments without having access to spend your money. No browser wallet or
          account sign-in is required.
        </p>
      </header>

      {/* Auditor Pass Input Form */}
      <section className="panel space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Inspect a 1-Click Auditor Pass</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste the read-only pass code or shareable verification link provided by the
              business owner or CFO.
            </p>
          </div>
          <Link href="/app/pay" className="quiet-link text-sm">
            <span>Issue a new pass in Send &amp; Invoice</span>
            <FiExternalLink aria-hidden="true" />
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runVerification(passInput);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="auditor-pass-input" className="mb-2 block text-sm font-medium">
              1-Click Auditor Pass Code or Verification Link
            </label>
            <textarea
              id="auditor-pass-input"
              rows={3}
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="kudex_pass_v1.eyJ2IjoxLC..."
              spellCheck={false}
              disabled={busy}
              className="field-input font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || !passInput.trim()}
              className="action-link disabled:opacity-40"
            >
              <FiRefreshCw className={busy ? 'animate-spin' : ''} aria-hidden="true" />
              <span>
                {busy ? 'Verifying On-Chain Commitments…' : 'Verify Financial Statement'}
              </span>
            </button>

            {statement && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadAccountingCsv}
                  className="quiet-link text-sm"
                >
                  <FiDownload aria-hidden="true" />
                  <span>Download CSV for Accounting (QuickBooks / Xero Format)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="quiet-link text-sm"
                >
                  <FiPrinter aria-hidden="true" />
                  <span>Print Statement</span>
                </button>
              </>
            )}
          </div>
        </form>

        {status && (
          <p role="status" className="text-sm font-semibold text-primary">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </section>

      {/* Verified Financial Statement Output */}
      {statement ? (
        <section
          aria-labelledby="verified-statement-heading"
          className="panel space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div className="min-w-0 space-y-1">
              <p className="eyebrow">Institutional Audit Record</p>
              <h2 id="verified-statement-heading" className="text-2xl font-bold">
                Verified Financial Statement
              </h2>
              <p className="text-sm text-muted-foreground">
                Prepared for{' '}
                <strong className="text-foreground">
                  {statement.payload.auditorName}
                </strong>{' '}
                ({statement.payload.auditorContact}) · Issued{' '}
                {new Date(statement.payload.issuedAt).toUTCString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="emerald-badge">
                <FiCheckCircle aria-hidden="true" />
                <span>
                  {statement.signatureValid === true
                    ? 'Owner Signature Verified'
                    : 'Read-Only Pass Decoded'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
                <span>Spending Access: None</span>
              </span>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Disclosing Account</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {statement.payload.organization}
              </dd>
              {statement.payload.ownerAddress && (
                <dd className="mt-0.5 font-mono text-sm text-muted-foreground">
                  {truncateAddress(statement.payload.ownerAddress)}
                </dd>
              )}
            </div>

            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Verification Scope</dt>
              <dd className="mt-1 font-bold text-foreground">
                {statement.payload.scope}
              </dd>
            </div>

            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Total Disclosed Volume</dt>
              <dd className="mt-1 text-2xl font-bold text-primary tabular-nums">
                $
                {statement.totalDisclosedAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </dd>
            </div>

            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">On-Chain Anchors Checked</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {statement.verifiedCount} / {statement.rows.length}
              </dd>
            </div>
          </dl>

          {/* Ledger Table */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Verified financial statement ledger"
            className="table-region rounded-xl border border-border"
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Settlement Date</th>
                  <th className="px-4 py-3">Payee / Counterparty</th>
                  <th className="px-4 py-3">Invoice / Reference</th>
                  <th className="px-4 py-3">Disclosed Amount</th>
                  <th className="px-4 py-3">Stealth Reference</th>
                  <th className="px-4 py-3">On-Chain Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statement.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      This auditor pass was issued with zero disclosed payment entries in
                      the selected scope.
                    </td>
                  </tr>
                ) : (
                  statement.rows.map((row, idx) => (
                    <tr key={`${row.commitment}-${idx}`}>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {row.date.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {row.payee}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.reference}</td>
                      <td className="px-4 py-3 font-bold text-foreground tabular-nums">
                        $
                        {Number(row.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {row.currency}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {truncateAddress(row.commitment)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.commitmentRecordedOnChain
                              ? 'emerald-badge'
                              : 'inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-foreground'
                          }
                        >
                          {row.commitmentRecordedOnChain ? (
                            <FiCheckCircle aria-hidden="true" />
                          ) : (
                            <FiClock className="text-primary" aria-hidden="true" />
                          )}
                          <span>{row.verificationLabel}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="panel flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <FiFileText className="mt-1 shrink-0 text-primary" size={22} aria-hidden="true" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-bold">Ready for Independent Audit Review</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Paste a 1-Click Auditor Pass above or open a shared{' '}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm">
                  /verify?pass=...
                </code>{' '}
                link to verify private business payments and export QuickBooks or Xero
                accounting records.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function VerifyAuditorPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-8">
          <div className="panel text-sm text-muted-foreground">
            Loading Public Auditor Portal…
          </div>
        </div>
      }
    >
      <VerifyPortalContent />
    </Suspense>
  );
}
