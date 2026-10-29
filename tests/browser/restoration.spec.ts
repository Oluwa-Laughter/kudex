import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [320, 1280])
  test(`institutional RFQ workspace, navigation and privacy boundaries at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/app/overview');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Your private financial operations,',
    );
    await expect(
      page.getByRole('link', { name: 'Request private liquidity', exact: false }),
    ).toBeVisible();
    await page.goto('/app/marketplace');
    await expect(
      page.getByRole('tab', { name: 'Create an RFQ', exact: true }),
    ).toHaveAttribute('data-state', 'active');
    await expect(
      page.getByRole('button', { name: 'Sign request invitation', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText(/an invitation does not enforce taker exclusivity/),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Swap & Liquidity', exact: true }),
    ).toHaveCount(0);
    if (width < 1024)
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await expect(
      page.getByRole('link', { name: 'RFQ Marketplace', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Credit & RWA', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Bridge Gateway', exact: true }),
    ).toHaveCount(0);
    if (width < 1024) await page.keyboard.press('Escape');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/restored-rfq-${width}.png`,
      fullPage: true,
    });
    await page.goto('/app/credit');
    await expect(
      page.getByText(/No verified issuer or investable credit facility/),
    ).toBeVisible();
    await page.goto('/app/agents');
    await page.getByRole('tab', { name: 'RFQ mandates', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Authorize RFQ mandate in wallet', exact: true }),
    ).toBeDisabled();
    await expect(page.getByText(/RFQ executor deployment unavailable/)).toBeVisible();
  });
