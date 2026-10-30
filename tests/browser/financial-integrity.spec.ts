import { test, expect } from '@playwright/test';

test('legacy browser ledger cannot resurrect balances, filled swaps, privacy notes, or agent profits', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'kudex-protocol-v5',
      JSON.stringify({
        version: 0,
        state: {
          balances: { pUSD: 987654321 },
          orders: [{ id: 'fake', status: 'FILLED', txHash: '0xfake' }],
          notes: [{ id: 'fake', amount: '987654321', status: 'SHIELDED' }],
          agentBots: [
            {
              id: 'fake',
              name: 'Fabricated agent',
              status: 'RUNNING',
              totalProfitOrVolume: 987654321,
            },
          ],
          positions: { senior: { depositedAmount: 987654321 } },
        },
      }),
    ),
  );
  await page.setViewportSize({ width: 320, height: 850 });
  for (const path of [
    '/app/overview',
    '/app/marketplace',
    '/app/vaults',
    '/app/bridge',
    '/app/settlement',
    '/app/compliance',
    '/app/protection',
    '/app/agents',
  ]) {
    await page.goto(path);
    await expect(page.getByText(/987654321|Fabricated agent|0xfake/)).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
  }
  await page.goto('/app/marketplace');
  await expect(
    page.getByRole('button', { name: 'Sign request invitation', exact: true }),
  ).toBeDisabled();
});

test('failed native balance read displays unavailable rather than faucet allocation', async ({
  page,
}) => {
  const address = '5Di9KJM56vFGFzwpq3UDhwsFkvUvVkTW5bogPzyYgP5hXzFd';
  await page.addInitScript(
    ({ address }) => {
      window.injectedWeb3 = {
        portaldot: {
          enable: async () => ({ accounts: { get: async () => [{ address }] } }),
        },
      };
    },
    { address },
  );
  await page.route('**/api/portaldot/account?*', (route) =>
    route.fulfill({ status: 503, json: { error: 'Fixture: unavailable RPC' } }),
  );
  await page.goto('/app/agents');
  await page.getByRole('button', { name: 'Connect wallets', exact: true }).click();
  await page
    .getByRole('button', { name: 'Connect Native Extension', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByText('Unavailable', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('500.00 tPOT', { exact: true })).toHaveCount(0);
});

test('public marketing and solutions routes render cleanly without fabricated financial claims or banned jargon', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  for (const path of [
    '/',
    '/marketplace',
    '/bridge',
    '/pricing',
    '/docs',
    '/solutions/enterprise-payroll',
    '/solutions/credit-tranches',
    '/solutions/autonomous-agents',
    '/how-it-works',
  ]) {
    await page.goto(path);
    await expect(
      page.getByText(/\$24\.85M|\$142\.6M|22\.80% APY|8\.50% APY|Trade settled with 0%/),
    ).toHaveCount(0);
    await expect(
      page.getByText(/Portaldot V3|EVM 8890|Groth16|ERC-4626|ERC-7579|seal0|Vercel AI SDK/i),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
  }
});
