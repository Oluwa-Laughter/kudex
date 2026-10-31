import { create } from 'zustand';
import { formatUnits, isAddress, parseUnits, zeroAddress, type Address } from 'viem';

export const MAX_BATCH_PAYROLL_ROWS = 50;

export interface PayrollRow {
  rowNumber: number;
  recipientName: string;
  address: string;
  amount: string;
  reference: string;
  amountUnits: bigint;
  isDuplicateAddress: boolean;
  duplicateOfRow?: number;
  errors: string[];
}

export interface ParsedPayrollBatch {
  rows: PayrollRow[];
  validRows: PayrollRow[];
  hasErrors: boolean;
  duplicateCount: number;
  exceedsMaxBatch: boolean;
  totalUnits: bigint;
  totalFormatted: string;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isHeaderRow(cells: string[]): boolean {
  if (cells.length < 2) return false;
  const first = cells[0].toLowerCase();
  const second = cells[1].toLowerCase();
  return (
    (first.includes('recipient') || first.includes('name') || first.includes('vendor')) &&
    (second.includes('address') || second.includes('wallet'))
  );
}

/**
 * Parses and validates CSV payroll / vendor payout text (`Recipient Name, Address, Amount, Reference`).
 */
export function parsePayrollCsv(rawCsv: string, decimals = 6): ParsedPayrollBatch {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      rows: [],
      validRows: [],
      hasErrors: false,
      duplicateCount: 0,
      exceedsMaxBatch: false,
      totalUnits: 0n,
      totalFormatted: '0.00',
    };
  }

  const firstCells = splitCsvLine(lines[0]);
  const startIndex = isHeaderRow(firstCells) ? 1 : 0;
  const dataLines = lines.slice(startIndex);

  const firstSeenRowByAddress = new Map<string, number>();
  const rows: PayrollRow[] = [];
  let duplicateCount = 0;
  let totalUnits = 0n;

  dataLines.forEach((line, idx) => {
    const rowNumber = idx + 1;
    const cells = splitCsvLine(line);
    const recipientName = cells[0] ?? '';
    const address = cells[1] ?? '';
    const amountRaw = (cells[2] ?? '').replace(/^\$/, '').replace(/,/g, '');
    const reference = cells[3] ?? 'Payroll & Vendor Settlement';

    const errors: string[] = [];
    if (!recipientName) {
      errors.push('Missing recipient or vendor name.');
    }
    if (!isAddress(address) || address.toLowerCase() === zeroAddress) {
      errors.push('Invalid wallet address (must start with 0x).');
    }

    let amountUnits = 0n;
    if (!amountRaw || !/^\d+(\.\d+)?$/.test(amountRaw)) {
      errors.push('Enter a valid positive payment amount.');
    } else {
      const fractional = amountRaw.split('.')[1] ?? '';
      if (fractional.length > decimals) {
        errors.push(`Amount exceeds ${decimals} decimal places.`);
      } else {
        amountUnits = parseUnits(amountRaw, decimals);
        if (amountUnits <= 0n) {
          errors.push('Payment amount must be greater than zero.');
        }
      }
    }

    let isDuplicateAddress = false;
    let duplicateOfRow: number | undefined;
    if (isAddress(address) && address.toLowerCase() !== zeroAddress) {
      const key = address.toLowerCase();
      const existing = firstSeenRowByAddress.get(key);
      if (existing !== undefined) {
        isDuplicateAddress = true;
        duplicateOfRow = existing;
        duplicateCount += 1;
        errors.push(`Duplicate recipient address (matches row #${existing}).`);
      } else {
        firstSeenRowByAddress.set(key, rowNumber);
      }
    }

    if (errors.length === 0) {
      totalUnits += amountUnits;
    }

    rows.push({
      rowNumber,
      recipientName,
      address,
      amount: amountRaw,
      reference,
      amountUnits,
      isDuplicateAddress,
      duplicateOfRow,
      errors,
    });
  });

  const exceedsMaxBatch = rows.length > MAX_BATCH_PAYROLL_ROWS;
  const validRows = rows.filter((r) => r.errors.length === 0);
  const hasErrors = exceedsMaxBatch || rows.some((r) => r.errors.length > 0);

  return {
    rows,
    validRows,
    hasErrors,
    duplicateCount,
    exceedsMaxBatch,
    totalUnits,
    totalFormatted: Number(formatUnits(totalUnits, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}

export interface SavedContact {
  id: string;
  name: string;
  address: Address;
  category: 'Employee' | 'Supplier' | 'Contractor';
  defaultReference: string;
}

const CONTACTS_STORAGE_KEY = 'kudex-saved-contacts-v1';

const DEFAULT_CONTACTS: SavedContact[] = [
  {
    id: 'contact-northstar',
    name: 'Northstar Logistics LLC',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    category: 'Supplier',
    defaultReference: 'Monthly Freight & Fulfillment Retainer',
  },
  {
    id: 'contact-meridian',
    name: 'Meridian Cloud Systems',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    category: 'Supplier',
    defaultReference: 'Infrastructure & Hosting Invoice',
  },
];

function loadSavedContacts(): SavedContact[] {
  if (typeof window === 'undefined') return DEFAULT_CONTACTS;
  try {
    const raw = window.localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACTS;
    const parsed = JSON.parse(raw) as SavedContact[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONTACTS;
  } catch {
    return DEFAULT_CONTACTS;
  }
}

function persistContacts(contacts: SavedContact[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch {
    // Ignore storage quota errors
  }
}

interface AddressBookState {
  contacts: SavedContact[];
  hydrate: () => void;
  addContact: (contact: Omit<SavedContact, 'id'>) => void;
  removeContact: (id: string) => void;
}

export const useAddressBookStore = create<AddressBookState>((set) => ({
  contacts: DEFAULT_CONTACTS,
  hydrate: () => set({ contacts: loadSavedContacts() }),
  addContact: (entry) =>
    set((state) => {
      const next: SavedContact[] = [
        {
          ...entry,
          id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        },
        ...state.contacts.filter(
          (c) => c.address.toLowerCase() !== entry.address.toLowerCase(),
        ),
      ];
      persistContacts(next);
      return { contacts: next };
    }),
  removeContact: (id) =>
    set((state) => {
      const next = state.contacts.filter((c) => c.id !== id);
      persistContacts(next);
      return { contacts: next };
    }),
}));

export interface PrintableReceiptInput {
  receiptId: string;
  kind: string;
  payerLabel: string;
  recipientLabel: string;
  amountLabel: string;
  reference: string;
  timestampIso: string;
  transactionHash?: string;
  commitment?: string;
  verificationUrl: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildPrintablePaymentReceiptHtml(item: PrintableReceiptInput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Kudex Payment Receipt — ${escapeHtml(item.receiptId)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 40px auto; max-width: 720px; padding: 0 24px; line-height: 1.6; }
    .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 999px; padding: 4px 12px; font-size: 13px; font-weight: 700; }
    h1 { margin: 12px 0 4px; font-size: 26px; }
    .sub { color: #475569; margin: 0 0 24px; font-size: 15px; }
    dl { display: grid; grid-template-columns: 200px 1fr; row-gap: 12px; column-gap: 16px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin: 0; }
    dt { color: #475569; font-weight: 600; font-size: 14px; }
    dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; word-break: break-all; font-size: 14px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; }
    @media print { body { margin: 0; } .card { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Verified Kudex Settlement Receipt</span>
    <h1>${escapeHtml(item.kind)}</h1>
    <p class="sub">Issued ${escapeHtml(new Date(item.timestampIso).toUTCString())}</p>
    <dl>
      <dt>Receipt ID</dt><dd>${escapeHtml(item.receiptId)}</dd>
      <dt>Payer</dt><dd>${escapeHtml(item.payerLabel)}</dd>
      <dt>Recipient / Vendor</dt><dd>${escapeHtml(item.recipientLabel)}</dd>
      <dt>Settled Amount</dt><dd>${escapeHtml(item.amountLabel)}</dd>
      <dt>Payment Reference</dt><dd>${escapeHtml(item.reference)}</dd>
      <dt>Settlement Timestamp</dt><dd>${escapeHtml(item.timestampIso)}</dd>
      ${item.transactionHash ? `<dt>Transaction Hash</dt><dd>${escapeHtml(item.transactionHash)}</dd>` : ''}
      ${item.commitment ? `<dt>Stealth Commitment</dt><dd>${escapeHtml(item.commitment)}</dd>` : ''}
      <dt>Auditor Verification Link</dt><dd><a href="${escapeHtml(item.verificationUrl)}">${escapeHtml(item.verificationUrl)}</a></dd>
    </dl>
    <div class="footer">
      Verify this receipt independently without a wallet at ${escapeHtml(item.verificationUrl)}
    </div>
  </div>
</body>
</html>`;
}

export function downloadPaymentReceipt(item: PrintableReceiptInput) {
  const html = buildPrintablePaymentReceiptHtml(item);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `kudex-receipt-${item.receiptId}.html`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
