import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 1280]) {
  test(`enterprise workspaces, navigation, and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/app/overview');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Confidential Settlement & Treasury Operations',
    );
    await expect(
      page.getByRole('link', { name: 'Request Liquidity', exact: false }),
    ).toBeVisible();

    await page.goto('/app/marketplace');
    await expect(
      page.getByRole('tab', { name: 'Create an RFQ', exact: true }),
    ).toHaveAttribute('data-state', 'active');
    await expect(
      page.getByRole('button', { name: 'Sign request invitation', exact: true }),
    ).toBeDisabled();

    if (width < 1024) {
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    }
    for (const label of [
      'Overview',
      'Marketplace',
      'Bridge',
      'Settlement',
      'Agents',
      'Vaults',
      'Compliance',
      'Protection',
    ]) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    if (width < 1024) {
      await page.keyboard.press('Escape');
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);

    await page.goto('/app/bridge');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Bridge & Solver Settlement',
    );

    await page.goto('/app/settlement');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Private Settlement & Corporate Invoicing',
    );

    await page.goto('/app/compliance');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Compliance, Viewing Keys & Audit Exports',
    );

    await page.goto('/app/protection');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Solvency & Automated Debt Restructuring',
    );

    await page.goto('/app/agents');
    await page.getByRole('tab', { name: 'RFQ mandates', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Authorize RFQ mandate in wallet', exact: true }),
    ).toBeDisabled();
  });
}
