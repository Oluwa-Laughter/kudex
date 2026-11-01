import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Activity Drawer, On-Chain Activity Ledger, POT Staking Card, and 5-Step Payment Protection Tracker', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  // 1. Visit Overview and verify Live On-Chain Activity & Receipt Center
  await page.goto('/app/overview');
  await expect(
    page.getByRole('heading', { name: 'On-Chain Activity & Receipts' }),
  ).toBeVisible();

  // Scope filter tabs
  await expect(page.getByRole('tab', { name: /All Network Activity/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /My Account Activity/ })).toBeVisible();

  // Category filter pills
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Payments', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invoices', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vaults', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Swaps', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Protection', exact: true })).toBeVisible();

  // 2. Open Activity History slide-over drawer from workspace header
  const activityBtn = page.getByRole('button', { name: /Activity History/ });
  await expect(activityBtn).toBeVisible();
  await activityBtn.click();

  await expect(
    page.getByRole('heading', { name: 'On-Chain Activity & Receipt Center' }),
  ).toBeVisible();
  await expect(
    page.getByText('Live event-indexed receipts read directly from network blocks.'),
  ).toBeVisible();

  // Close drawer
  await page.getByRole('button', { name: 'Close activity drawer' }).click();

  // 3. Visit Earn tab and verify POT Membership & 5-Step DaaS Tracker
  await page.goto('/app/earn');
  await expect(
    page.getByRole('heading', { name: '0% Fee Business Transfers & Swaps Membership' }),
  ).toBeVisible();
  await expect(
    page.getByText('100 POT', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '5-Step Built-In Payment Protection Tracker' }),
  ).toBeVisible();
  await expect(page.getByText('Stage 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Triggered', { exact: true })).toBeVisible();
  await expect(page.getByText('Validated', { exact: true })).toBeVisible();
  await expect(page.getByText('Deposits Paused', { exact: true })).toBeVisible();
  await expect(page.getByText('Reserve Merged', { exact: true })).toBeVisible();
  await expect(page.getByText('Recovery Active', { exact: true })).toBeVisible();

  // 4. Visit Pay tab and verify Verified Business Directory & On-Chain Invoices
  await page.goto('/app/pay');
  await page.getByRole('tab', { name: 'Saved Contacts' }).click();
  await expect(
    page.getByRole('heading', { name: 'Verified Business Directory (On-Chain)' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Register Verified Business On-Chain' }),
  ).toBeVisible();

  await page.getByRole('tab', { name: 'Create & Pay Invoices' }).click();
  await expect(
    page.getByRole('heading', { name: 'Pay or Approve On-Chain Invoice' }),
  ).toBeVisible();

  // 5. Responsive overflow & Axe WCAG 2 AA check at 320px and 1280px on /app/overview
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/app/overview');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  }
});
