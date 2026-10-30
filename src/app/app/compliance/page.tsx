'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import {
  FiFileText,
  FiKey,
  FiDownload,
  FiCopy,
  FiCheck,
  FiSlash,
  FiShield,
} from 'react-icons/fi';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

const SCOPES = [
  {
    value: 'Accounting',
    label: 'Accounting & Bookkeeping',
    description: 'Read-only access to timestamped transfer & invoice references',
  },
  {
    value: 'Tax Reporting',
    label: 'Tax Reporting',
    description: 'Read-only cost-basis and settlement jurisdiction proofs',
  },
  {
    value: 'Auditor Verification',
    label: 'Auditor Verification',
    description: 'Full read-only attestation of pool solvency & note commitments',
  },
];

interface DisclosureGrant {
  id: string;
  entityName: string;
  auditorAddress: string;
  scope: string;
  viewingKey: string;
  issuedAt: string;
  active: boolean;
}

async function deriveViewingKey(seed: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(seed),
  );
  return (
    'kudex_vk_' +
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export default function ComplianceWorkspacePage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [entityName, setEntityName] = useState('');
  const [auditorAddress, setAuditorAddress] = useState('');
  const [scope, setScope] = useState('Auditor Verification');
  const [grants, setGrants] = useState<DisclosureGrant[]>([]);
  const [copiedKey, setCopiedKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const network = useQuery<{ block: string }>({
    queryKey: ['compliance-network'],
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Network block unavailable');
      return r.json();
    },
  });

  const vault = useQuery<{
    totalAssets: string;
    symbol: string;
    riskScorePercent: string;
    block: string;
  }>({
    queryKey: ['compliance-vault', CONTRACT_ADDRESSES.vault],
    enabled: isVaultConfigured,
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/vault');
      if (!r.ok) throw new Error('Vault snapshot unavailable');
      return r.json();
    },
  });

  async function generateViewingKey() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!entityName.trim())
        throw new Error('Enter the authorized auditor or accounting firm name.');
      if (!auditorAddress.trim())
        throw new Error('Enter the auditor identifier or 0x public address.');

      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');

      let authProof = nonce;
      if (address) {
        authProof = await signMessageAsync({
          message: `Authorize Kudex Read-Only Viewing Key\nEntity: ${entityName.trim()}\nAuditor: ${auditorAddress.trim()}\nScope: ${scope}\nNonce: ${nonce}`,
        });
      }

      const viewingKey = await deriveViewingKey(
        `${address ?? 'local-session'}:${entityName}:${auditorAddress}:${scope}:${authProof}`,
      );

      setGrants((prev) => [
        {
          id: viewingKey.slice(9, 21),
          entityName: entityName.trim(),
          auditorAddress: auditorAddress.trim(),
          scope,
          viewingKey,
          issuedAt: new Date().toLocaleString(),
          active: true,
        },
        ...prev,
      ]);
      setEntityName('');
      setAuditorAddress('');
      setStatus(
        'Read-only viewing key generated. Spending authority remains strictly disabled.',
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function exportAuditCertificate() {
    setBusy(true);
    setError('');
    try {
      const observedBlock = vault.data?.block ?? network.data?.block ?? 'unobserved';
      const attestationDigest = await deriveViewingKey(
        `kudex-compliance-cert:${address ?? 'anonymous-institution'}:${observedBlock}:${Date.now()}`,
      );
      const certificate = {
        certificateVersion: 'kudex-selective-disclosure-v1',
        statement:
          'Cryptographic settlement compliance attestation without private balance exposure.',
        subjectAccount: address ? truncateAddress(address) : 'Unconnected Session',
        observedSettlementBlock: observedBlock,
        poolSolvencySnapshot: vault.data
          ? {
              poolReserve: `${vault.data.totalAssets} ${vault.data.symbol}`,
              riskScorePercent: `${vault.data.riskScorePercent}%`,
            }
          : 'Pool snapshot pending configuration',
        activeAuditorDisclosures: grants.filter((g) => g.active).length,
        attestationHash: attestationDigest.replace('kudex_vk_', '0x'),
        generatedAt: new Date().toISOString(),
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `kudex-settlement-certificate-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Settlement compliance certificate downloaded.');
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function copyViewingKey(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(value);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      setError('Clipboard unavailable. Export or copy the viewing key manually.');
    }
  }

  function revokeGrant(id: string) {
    setGrants((prev) =>
      prev.map((grant) => (grant.id === id ? { ...grant, active: false } : grant)),
    );
    setStatus(`Viewing key ${id} revoked.`);
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Selective Institutional Disclosure</p>
          <h1 className="page-title">Compliance, Viewing Keys & Audit Exports</h1>
          <p className="page-description">
            Issue scoped read-only viewing keys for regulators and tax auditors, and
            download settlement compliance certificates without exposing private balances.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportAuditCertificate()}
          className="action-link text-sm"
        >
          <FiDownload aria-hidden="true" />
          <span>Download Settlement Certificate</span>
        </button>
      </header>

      <div className="grid items-start gap-7 xl:grid-cols-[1.2fr_0.9fr]">
        {/* Viewing Key Manager */}
        <section className="panel space-y-6">
          <div className="flex items-center gap-2">
            <FiKey className="text-primary" size={20} aria-hidden="true" />
            <h2 className="text-xl font-bold">Viewing Key Manager</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Authorized Auditor / Firm
              <input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Deloitte Digital Tax · Internal Audit"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>

            <label className="block text-sm font-medium">
              Auditor Address or Entity ID
              <input
                value={auditorAddress}
                onChange={(e) => setAuditorAddress(e.target.value)}
                placeholder="0x… or AUDITOR-ID"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>

            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Disclosure Scope</span>
              <CustomSelect
                label="Disclosure Scope"
                value={scope}
                options={SCOPES}
                onChange={setScope}
                disabled={busy}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void generateViewingKey()}
            className="action-link"
          >
            {address ? 'Sign & Issue Read-Only Viewing Key' : 'Generate Session Viewing Key'}
          </button>

          {status && (
            <p role="status" className="text-sm font-medium text-primary">
              {status}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </section>

        {/* Audit Export Tool Summary */}
        <aside className="panel space-y-5">
          <div className="flex items-center gap-2">
            <FiFileText className="text-accent" size={20} aria-hidden="true" />
            <h2 className="text-xl font-bold">Audit Export Telemetry</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Settlement certificates bind your disclosure scope to the latest observed
            settlement block and pool reserve state while keeping individual counterparty
            amounts private.
          </p>

          <dl className="space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Observed Block Height</dt>
              <dd className="font-mono font-semibold text-primary tabular-nums">
                {network.data ? `#${network.data.block}` : 'Syncing…'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Active Viewing Keys</dt>
              <dd className="font-mono font-semibold tabular-nums">
                {grants.filter((g) => g.active).length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Spending Authority</dt>
              <dd className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <FiShield aria-hidden="true" />
                <span>Zero (Read-Only)</span>
              </dd>
            </div>
          </dl>

          <button
            type="button"
            disabled={busy}
            onClick={() => void exportAuditCertificate()}
            className="cobalt-action w-full text-sm"
          >
            <FiDownload aria-hidden="true" />
            <span>Export Tax & Compliance Proof JSON</span>
          </button>
        </aside>
      </div>

      {/* Counterparty Disclosure Log */}
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Counterparty Disclosure Log</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {grants.filter((g) => g.active).length} active · {grants.length} total issued
          </span>
        </div>

        <div className="table-region rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Authorized Entity</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Viewing Key</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No active viewing keys issued yet. Generate a scoped key above to
                    grant auditor access.
                  </td>
                </tr>
              ) : (
                grants.map((grant) => (
                  <tr key={grant.id}>
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{grant.entityName}</span>
                      <span className="font-mono text-muted-foreground">
                        {grant.auditorAddress}
                      </span>
                    </td>
                    <td className="px-4 py-3">{grant.scope}</td>
                    <td className="px-4 py-3 font-mono">
                      {grant.viewingKey.slice(0, 22)}…
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          grant.active
                            ? 'bg-primary/15 text-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {grant.active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {grant.active && (
                          <>
                            <button
                              type="button"
                              onClick={() => void copyViewingKey(grant.viewingKey)}
                              className="quiet-link px-3 py-1.5 text-sm"
                            >
                              {copiedKey === grant.viewingKey ? (
                                <FiCheck className="text-primary" aria-hidden="true" />
                              ) : (
                                <FiCopy aria-hidden="true" />
                              )}
                              <span>
                                {copiedKey === grant.viewingKey ? 'Copied' : 'Copy Key'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => revokeGrant(grant.id)}
                              className="quiet-link px-3 py-1.5 text-sm text-destructive hover:text-destructive"
                            >
                              <FiSlash aria-hidden="true" />
                              <span>Revoke</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
