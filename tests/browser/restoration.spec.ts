import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 1280]) {
  test(`5-tab user-first OS, navigation, plain-English copy, and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });

    // Landing page verification
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Private, Automated Finance for Modern Businesses.',
    );
    await expect(
      page.getByRole('heading', { name: 'Pay & Get Paid Privately' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Earn Protected Yield' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Put Money on Auto-Pilot' }),
    ).toBeVisible();

    // TAB 1: Home (/app/overview)
    await page.goto('/app/overview');
    await expect(
      page.getByRole('link', { name: 'Send Private Payment' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Deposit to Earn' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ask Kudex Agent' })).toBeVisible();

    if (width < 1024) {
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    }
    for (const label of [
      'Home',
      'Send & Invoice',
      'Earn',
      'Trade & Bridge',
      'Kudex Agent',
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

    // TAB 2: Send & Invoice (/app/pay)
    await page.goto('/app/pay');
    await expect(
      page.getByText(
        'Stealth Mode Active: Amount and balance are hidden from the public ledger.',
      ),
    ).toBeVisible();
    await page.getByRole('tab', { name: '1-Click Auditor Pass' }).click();
    await expect(
      page.getByRole('button', { name: /Generate .*Auditor Pass/i }),
    ).toBeVisible();

    // TAB 3: Earn (/app/earn)
    await page.goto('/app/earn');
    await expect(
      page.getByRole('heading', { name: 'Short-Term Treasury Vault' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Verified Business Invoice Pool' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Deposit & Hide Balance' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Withdraw to Wallet' }),
    ).toBeVisible();

    // TAB 4: Trade & Bridge (/app/trade)
    await page.goto('/app/trade');
    await expect(page.getByRole('button', { name: 'Instant Swap' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Move Across Networks' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Background bots compared routes to lock in zero price slippage and the lowest fee.',
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel(/Receive directly into my Private Balance\./),
    ).toBeVisible();

    // TAB 5: Kudex Agent (/app/agent)
    await page.goto('/app/agent');
    await expect(
      page.getByRole('button', {
        name: 'Put $2,500 into the highest-yielding business vault',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Swap 500 USDC and hide it in my Private Balance',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Check if my active vaults are 100% protected',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Turn Off Auto-Pilot Immediately' }),
    ).toBeVisible();
  });
}
