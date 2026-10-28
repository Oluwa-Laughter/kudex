import { test, expect } from '@playwright/test';

test('malformed RFQ exports cannot enable settlement and expiry selection stays within the workspace', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/app/rfq');
  await expect(page.getByRole('heading', { name: 'Trade on your terms.' })).toBeVisible();
  await page
    .getByLabel('Signed offer JSON', { exact: true })
    .fill('{"format":"kudex-rfq-v1"}');
  await page.getByRole('button', { name: 'Read and review offer', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'The offer format' }),
  ).toContainText('invalid');
  await expect(
    page.getByRole('button', { name: 'Fill complete offer in wallet', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Create an offer', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Review offer terms', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Offer expiry', exact: true }).click();
  await page.getByRole('menuitem', { name: '7 days', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Offer expiry', exact: true }),
  ).toContainText('7 days');
  await expect(page.getByRole('menu')).not.toBeVisible();
  await page.getByRole('tab', { name: 'Review an offer', exact: true }).click();
  await expect(page.getByLabel('Signed offer JSON', { exact: true })).toHaveValue(
    '{"format":"kudex-rfq-v1"}',
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
