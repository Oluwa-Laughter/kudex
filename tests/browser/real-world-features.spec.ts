import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Treasury Cashflow & Runway Forecaster, Request & Receive checkout link, live Trade pair flip, and actionable Agent CSV workflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  // 1. Overview: Treasury Cashflow & Runway Forecaster
  await page.goto('/app/overview');
  await expect(
    page.getByRole('heading', {
      name: 'Working Capital, Receivables & Runway Forecaster',
    }),
  ).toBeVisible();
  await page.getByLabel('Monthly Payroll & Operating Burn ($ USD)').fill('10000');
  await expect(page.getByText('Estimated Cash Runway')).toBeVisible();

  // 2. Pay: Request & Receive Checkout Link -> Pre-filled Payer Checkout View
  await page.goto('/app/pay');
  await page.getByRole('tab', { name: 'Request & Receive' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Create a Shareable Payment Request Link',
    }),
  ).toBeVisible();

  await page
    .getByLabel('Receiving Wallet Address')
    .fill('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  await page.getByLabel('Requested Amount (USDC)').fill('1450.00');
  await page
    .getByLabel('Payment Reference / Memo')
    .fill('Q4 Retainer Milestone');

  await page.getByRole('link', { name: 'Preview Payer View' }).click();
  await expect(page).toHaveURL(/\/app\/pay\?payTo=0x70997970C51812dc3A010C7d01b50e0d17dc79C8/);
  await expect(page.getByText('Payment Request Loaded from Link')).toBeVisible();
  await expect(page.getByLabel('Recipient Wallet Address')).toHaveValue(
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  );
  await expect(page.getByLabel('Payment Amount (USDC)')).toHaveValue('1450.00');
  await expect(
    page.getByLabel(/Private Memo/),
  ).toHaveValue('Q4 Retainer Milestone');

  // 3. Trade: URL prefill + Invert Swap Pair button + Quote Feed Source & AMM savings
  await page.goto('/app/trade?mode=swap&pay=750&from=USDC&to=USDT&private=1');
  await expect(page.getByLabel('You Pay', { exact: true })).toHaveValue('750');
  await expect(page.getByText('Savings vs Public AMM (~0.35%)')).toBeVisible();
  await page.getByRole('button', { name: 'Invert swap assets' }).click();
  await expect(
    page.getByRole('button', { name: /Swap USDT for USDC/ }),
  ).toBeVisible();

  // 4. Agent: Actionable Payroll CSV Draft + Pre-Filled Deep Link
  await page.goto('/app/agent');
  await page
    .getByRole('button', {
      name: 'Draft a batch payroll CSV schedule for my saved contacts',
    })
    .click();
  await expect(page.getByText('Batch Payroll & Vendor Draft')).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole('link', { name: 'Open in Batch Payroll' }).click();
  await expect(page).toHaveURL(/\/app\/pay\?tab=batch/);

  // 5. Responsive & Axe WCAG 2 AA check at 320px on Request & Receive
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/app/pay');
  await page.getByRole('tab', { name: 'Request & Receive' }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});
