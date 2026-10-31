import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Batch Payroll CSV validator, Saved Contacts, 1-Click Auditor Pass, and Wallet-Less /verify Portal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('/app/pay');
  await expect(
    page.getByRole('button', { name: 'Restore Private Balance from Network' }),
  ).toBeVisible();

  // Open Batch Payroll & Vendor Run tab
  await page.getByRole('tab', { name: 'Batch Payroll & Vendor Run' }).click();

  const csvBox = page.getByLabel(
    /Payroll & Vendor CSV \(`Recipient Name, Address, Amount, Reference`\)/,
  );

  // Paste CSV with a duplicate address first and verify duplicate detection blocks execution
  await csvBox.fill(
    [
      'Recipient Name, Address, Amount, Reference',
      'Northstar Logistics, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 1250.00, Freight',
      'Duplicate Supplier, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 500.00, Duplicate',
    ].join('\n'),
  );
  await expect(
    page.getByText('Duplicate recipient address (matches row #1).'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Execute Atomic Batch Payroll/ }),
  ).toBeDisabled();

  // Replace with valid multi-recipient CSV and verify exact total cost calculation
  await page.getByRole('button', { name: 'Load CSV Example' }).click();
  await expect(page.getByText('$2,090.50 USDC', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Execute Atomic Batch Payroll ($2,090.50 USDC)',
    }),
  ).toBeEnabled();

  // Open Saved Contacts tab and add a new supplier contact
  await page.getByRole('tab', { name: 'Saved Contacts' }).click();
  await page.getByLabel('Vendor or Employee Name').fill('Horizon Packaging Corp');
  await page
    .getByLabel('Wallet Address')
    .fill('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  await page.getByLabel('Default Payment Reference').fill('Monthly Packaging Supply');
  await page.getByRole('button', { name: 'Save Contact to Address Book' }).click();
  await expect(page.getByText('Horizon Packaging Corp')).toBeVisible();

  // Create an Invoice so we have a disclosed record + Download Payment Receipt button
  await page.getByRole('tab', { name: 'Create & Pay Invoices' }).click();
  await page.getByRole('button', { name: 'Horizon Packaging Corp' }).click();
  await page.getByLabel('Invoice Amount (USDC)').fill('3400.00');
  await page.getByRole('button', { name: 'Create Invoice' }).click();
  await expect(
    page.getByRole('button', { name: 'Download Payment Receipt' }).first(),
  ).toBeVisible();

  // Generate a 1-Click Auditor Pass and follow its link directly into /verify
  await page.getByRole('tab', { name: '1-Click Auditor Pass' }).click();
  await page.getByLabel('Accountant or Audit Firm').fill('KPMG Tax & Audit');
  await page.getByLabel('Auditor Email or Wallet ID').fill('audit@kpmg.example');
  await page.getByRole('button', { name: 'Generate 1-Click Auditor Pass' }).click();

  const portalLink = page.getByRole('link', { name: 'Open Auditor Portal' }).first();
  await expect(portalLink).toBeVisible();
  await portalLink.click();

  // Wallet-Less Public Auditor Portal (/verify?pass=...)
  await expect(page).toHaveURL(/\/verify\?pass=kudex_pass_v1\./);
  await expect(
    page.getByRole('heading', { name: 'Verified Financial Statement' }),
  ).toBeVisible();
  await expect(page.getByText('KPMG Tax & Audit', { exact: true })).toBeVisible();
  await expect(page.getByText('$3,400.00', { exact: true })).toBeVisible();
  await expect(page.getByText('$3,400.00 USDC', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Download CSV for Accounting (QuickBooks / Xero Format)',
    }),
  ).toBeVisible();

  // WCAG 2 AA accessibility and responsive overflow check on /verify (320px & 1280px)
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  }
});

test('Earn real-yield metrics and Kudex Agent Persistent Auto-Pilot Workflows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  // Verify UPGRADE 5 metrics on /app/earn
  await page.goto('/app/earn');
  await expect(page.getByText(/1 Vault Share = \d+\.\d{4} USD/)).toBeVisible();
  await expect(
    page.getByText('Real-Time Revenue Distributed to Depositors'),
  ).toBeVisible();
  await expect(page.getByText('Payment Protection Reserve Balance')).toBeVisible();

  // Verify UPGRADE 4 workflows and live check pass on /app/agent
  await page.goto('/app/agent');
  await expect(
    page.getByRole('heading', { name: 'Active Auto-Pilot Workflows' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Auto-Sweep Idle Cash' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Scheduled Recurring Payment' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Target-Rate Auto-Swap' }),
  ).toBeVisible();

  await page.getByLabel('Enable Scheduled Recurring Payment').check();
  await page.getByLabel('Enable Target-Rate Auto-Swap').check();
  await page
    .getByRole('button', { name: 'Save & Activate Auto-Pilot Rules' })
    .click();
  await page.getByRole('button', { name: 'Run Auto-Pilot Check Now' }).click();

  await expect(
    page.getByRole('heading', { name: 'Latest Auto-Pilot Evaluation Pass' }),
  ).toBeVisible();

  // Responsive & WCAG 2 AA check at 320px on /app/agent with workflows expanded
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});
