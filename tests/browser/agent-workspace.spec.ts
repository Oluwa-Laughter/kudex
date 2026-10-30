import { test, expect } from '@playwright/test';

const nativeAddress = '5Di9KJM56vFGFzwpq3UDhwsFkvUvVkTW5bogPzyYgP5hXzFd';

test('wallet dialog restores focus, native account context loads, and mobile menu is keyboard operable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.addInitScript(
    ({ address }) => {
      window.injectedWeb3 = {
        portaldot: {
          enable: async () => ({
            accounts: {
              get: async () => [{ address, name: 'Browser test native account' }],
            },
          }),
        },
      };
    },
    { address: nativeAddress },
  );
  await page.route('**/api/portaldot/account?*', (route) =>
    route.fulfill({
      json: {
        address: nativeAddress,
        contractAddress: '0x1111111111111111111111111111111111111111',
        nativeFreeTPOT: '0',
        nativeFrozenTPOT: '0',
        nativeSpendableUpperBoundTPOT: '0',
        finalizedBlock: '123',
        finalizedHash: '0x' + '11'.repeat(32),
        observedAt: new Date().toISOString(),
      },
    }),
  );
  await page.goto('/app/agents');
  const wallet = page.getByRole('button', { name: 'Connect wallets', exact: true });
  await wallet.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('button', { name: 'Connect Native Extension', exact: true })
    .click();
  await expect(page.getByText(nativeAddress, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Native account', exact: true }),
  ).toBeFocused();
  await expect(page.getByText('Native free balance', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Workspace navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open navigation', exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});

test('policy draft can be reviewed and exported without activating any on-chain authority', async ({
  page,
}) => {
  await page.goto('/app/agents');
  await page.getByRole('tab', { name: 'Session Keys & Policies', exact: true }).click();
  for (const [label, value] of [
    ['Contract-facing owner', '0x1111111111111111111111111111111111111111'],
    ['Agent delegate', '0x2222222222222222222222222222222222222222'],
    ['Vault address', '0x3333333333333333333333333333333333333333'],
    ['Collateral token', '0x4444444444444444444444444444444444444444'],
    ['Per-deposit cap', '1'],
    ['Daily cap', '2'],
    ['Total budget', '10'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Review policy', exact: true }).click();
  await expect(page.getByText('Draft · Not authorized', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Authorize policy in wallet', exact: true }),
  ).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download policy draft', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('kudex-agent-policy-draft.json');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Per-deposit cap', { exact: true })).toHaveValue('1');
});

test('KUDEX AGENT conversation consumes progress and text chunks while keeping tool observations distinct', async ({
  page,
}) => {
  await page.route('**/api/agent/status', (route) =>
    route.fulfill({
      json: { modelAvailable: true, provider: 'Google AI Studio', model: 'test-fixture' },
    }),
  );
  const events = [
    { type: 'status', text: 'Reading test fixture…' },
    { type: 'delta', text: 'Review your account.' },
    {
      type: 'result',
      result: {
        id: 'fixture',
        mode: 'gemini',
        text: 'Review your account.',
        evidence: [
          {
            tool: 'account',
            title: 'Wallet funding and mapping',
            status: 'unavailable',
            data: { error: 'Test fixture: native RPC unavailable.' },
          },
        ],
        observedAt: new Date().toISOString(),
        modelAvailable: true,
      },
    },
  ];
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      contentType: 'application/x-ndjson',
      body: events.map((event) => JSON.stringify(event)).join('\n') + '\n',
    }),
  );
  await page.goto('/app/agents');
  await page
    .getByLabel('Ask KUDEX AGENT about the product or a workflow', { exact: true })
    .fill('What blocks my deposit?');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByText('Review your account.', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Test fixture: native RPC unavailable.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Response ready. Review the observations below.', { exact: true }),
  ).toBeVisible();
});
