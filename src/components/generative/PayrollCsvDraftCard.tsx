'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiCheck, FiCopy, FiUsers } from 'react-icons/fi';
import { useAddressBookStore } from '@/lib/payroll/csvParser';

export function PayrollCsvDraftCard({ defaultAmount = '1000.00' }: { defaultAmount?: string }) {
  const { contacts } = useAddressBookStore();
  const [copied, setCopied] = useState(false);

  const csvContent =
    contacts.length > 0
      ? [
          'Recipient Name, Address, Amount, Reference',
          ...contacts.map((c) => {
            const safeName = c.name.includes(',') ? `"${c.name}"` : c.name;
            const safeRef = c.defaultReference.includes(',')
              ? `"${c.defaultReference}"`
              : c.defaultReference;
            return `${safeName}, ${c.address}, ${defaultAmount}, ${safeRef}`;
          }),
        ].join('\n')
      : [
          'Recipient Name, Address, Amount, Reference',
          `Vendor or Employee Name, 0x0000000000000000000000000000000000000001, ${defaultAmount}, Monthly Payroll Settlement`,
        ].join('\n');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted browser contexts
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-secondary p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FiUsers className="text-primary" aria-hidden="true" />
          <span>Batch Payroll &amp; Vendor Draft</span>
        </div>
        <span className="emerald-badge">
          {contacts.length > 0
            ? `${contacts.length} Saved Contacts Included`
            : 'CSV Template Ready'}
        </span>
      </div>

      <pre className="overflow-x-auto rounded-xl border border-border bg-card p-3.5 font-mono text-sm text-foreground">
        {csvContent}
      </pre>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="quiet-link text-sm"
        >
          {copied ? <FiCheck className="text-primary" aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          <span>{copied ? 'Copied CSV' : 'Copy CSV Schedule'}</span>
        </button>

        <Link
          className="action-link text-sm"
          href={`/app/pay?tab=batch${contacts.length > 0 ? `&csv=${encodeURIComponent(csvContent)}` : ''}`}
        >
          <span>Open in Batch Payroll</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
