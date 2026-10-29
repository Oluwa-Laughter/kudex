// Compiled app + real local contracts. All signing is restricted to this child Anvil.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { keccak256, zeroAddress } from 'viem';
import { localChain } from './helpers-local-chain.mjs';
import { erc20Abi } from 'viem';
// Next dev updates generated type references; restore exactly what this test found.
const generatedFiles = ['tsconfig.json', 'next-env.d.ts', 'AGENTS.md'];
const previous = await Promise.all(
  generatedFiles.map(async (path) => {
    try {
      return await readFile(path);
    } catch (error) {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    }
  }),
);
const env = await localChain();
let server, browser;
try {
  const { client, accounts, deploy } = env;
  const maker = accounts[0],
    taker = accounts[1];
  const buy = await deploy('KudexTestToken'),
    pay = await deploy('KudexTestToken'),
    router = await deploy('KudexRFQMarket');
  const executor = await deploy('KudexRfqExecutor', [router]);
  await env.wait(
    await env.wallet.writeContract({
      address: pay,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [taker, 5000000n],
    }),
  );
  const rpc = client.chain.rpcUrls.default.http[0];
  const vars = {
    ...process.env,
    KUDEX_LOCAL_VAULT_TEST: '1',
    NEXT_PUBLIC_PORTALDOT_RPC_HTTP: rpc,
    NEXT_PUBLIC_PORTALDOT_CHAIN_ID: '420420777',
    NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS: '18',
    NEXT_PUBLIC_RFQ_ROUTER_ADDRESS: router,
    NEXT_PUBLIC_RFQ_EXECUTOR_ADDRESS: executor,
    NEXT_PUBLIC_RFQ_EXECUTOR_CODE_HASH: keccak256(
      await client.getBytecode({ address: executor }),
    ),
    NEXT_PUBLIC_RFQ_CODE_HASH: keccak256(await client.getBytecode({ address: router })),
    NEXT_PUBLIC_RFQ_ASSET_PINS: JSON.stringify({
      [buy.toLowerCase()]: keccak256(await client.getBytecode({ address: buy })),
      [pay.toLowerCase()]: keccak256(await client.getBytecode({ address: pay })),
    }),
  };
  server = spawn('pnpm', ['exec', 'next', 'dev', '-p', '3018'], {
    env: vars,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error('Local test app startup timeout')),
      45000,
    );
    server.once('exit', () => {
      clearTimeout(timer);
      reject(Error('Local test app exited'));
    });
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Ready in')) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  const errors = [];
  async function signerPage(owner) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ rpc, owner }) => {
        const listeners = new Map();
        window.ethereum = {
          isMetaMask: true,
          on: (event, fn) => listeners.set(event, fn),
          removeListener: (event) => listeners.delete(event),
          request: async ({ method, params }) => {
            if (method === 'eth_requestAccounts' || method === 'eth_accounts')
              return [owner];
            if (method === 'wallet_requestPermissions')
              return [{ parentCapability: 'eth_accounts' }];
            if (method === 'wallet_getPermissions')
              return [{ parentCapability: 'eth_accounts' }];
            if (method === 'wallet_switchEthereumChain') return null;
            const response = await fetch(rpc, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params: params ?? [],
              }),
            });
            const body = await response.json();
            if (body.error)
              throw Object.assign(Error(body.error.message), { code: body.error.code });
            return body.result;
          },
        };
      },
      { rpc, owner },
    );
    return page;
  }
  const makerPage = await signerPage(maker),
    page = await signerPage(taker);
  for (const p of [makerPage, page])
    await p.route('**/api/portaldot/account?*', (route) =>
      route.fulfill({
        status: 503,
        json: { error: 'Local EVM test: native mapping unavailable' },
      }),
    );
  async function connect(p) {
    await p.goto('http://localhost:3018/app/marketplace');
    await p.getByRole('button', { name: 'Connect wallets', exact: true }).click();
    await p.getByRole('button', { name: 'Injected', exact: true }).click();
    await p.keyboard.press('Escape');
  }
  await connect(makerPage);
  await connect(page);
  // Real wallet signature for an invitation; no hosted delivery is simulated.
  for (const [label, value] of [
    ['Counterparty solver address', maker],
    ['Requested asset address', buy],
    ['Payment asset address', pay],
    ['Minimum receipt (base units)', '2000000'],
    ['Maximum payment (base units)', '1000000'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole('button', { name: 'Sign request invitation', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Invitation signature verified' }),
  ).toBeVisible({ timeout: 30000 });
  const invitation = JSON.parse(await page.locator('#signed-request-json').inputValue());
  assert.equal(invitation.request.requester.toLowerCase(), taker.toLowerCase());
  await makerPage.getByRole('tab', { name: 'Create an offer', exact: true }).click();
  for (const [label, value] of [
    ['Token you offer', buy],
    ['Token you request', pay],
    ['Amount you offer', '2'],
    ['Amount you request', '1'],
  ])
    await makerPage.getByLabel(label, { exact: true }).fill(value);
  await makerPage
    .getByRole('button', { name: 'Review offer terms', exact: true })
    .click();
  await makerPage
    .getByRole('button', { name: 'Sign exact terms in wallet', exact: true })
    .click();
  await expect(
    makerPage.getByLabel('Signed offer JSON', { exact: true }),
  ).not.toHaveValue('', { timeout: 30000 });
  const offer = await makerPage
    .getByLabel('Signed offer JSON', { exact: true })
    .inputValue();
  await makerPage
    .getByRole('button', { name: 'Read and review offer', exact: true })
    .click();
  await makerPage
    .getByRole('button', { name: 'Approve exact offered amount', exact: true })
    .click();
  await expect(
    makerPage.getByRole('status').filter({ hasText: 'Token allowance confirmed' }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole('tab', { name: 'Review an offer', exact: true }).click();
  await page.getByLabel('Signed offer JSON', { exact: true }).fill(offer);
  await page.getByRole('button', { name: 'Read and review offer', exact: true }).click();
  await page.getByRole('button', { name: 'Approve exact payment', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Token allowance confirmed' }),
  ).toBeVisible({ timeout: 30000 });
  await page
    .getByRole('button', { name: 'Fill complete offer in wallet', exact: true })
    .click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /Offer settlement (confirmed|finalized)/ }),
  ).toBeVisible({ timeout: 30000 });
  assert.equal(
    await client.readContract({
      address: buy,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [taker],
    }),
    2000000n,
  );
  assert.equal(
    await client.readContract({
      address: pay,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [taker],
    }),
    4000000n,
  );
  assert.equal(
    await client.readContract({
      address: pay,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [taker, router],
    }),
    0n,
  );
  await page.goto('http://localhost:3018/app/agents');
  await page.getByRole('tab', { name: 'RFQ mandates', exact: true }).click();
  for (const [label, value] of [
    ['RFQ delegate', accounts[2]],
    ['Permitted maker', maker],
    ['Buy token', buy],
    ['Pay token', pay],
    ['Minimum buy ratio units', '2'],
    ['Reference payment ratio units', '1'],
    ['Per-trade payment cap', '1000000'],
    ['Daily payment cap', '2000000'],
    ['Total payment budget', '3000000'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole('button', { name: 'Authorize RFQ mandate in wallet', exact: true })
    .click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /RfqPolicyCreated (confirmed|finalized)/ }),
  ).toBeVisible({ timeout: 30000 });
  const policyId = await page
    .getByLabel('On-chain RFQ policy ID', { exact: true })
    .inputValue();
  await page
    .getByRole('button', { name: 'Approve remaining RFQ budget', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: /Approval (confirmed|finalized)/ }),
  ).toBeVisible({ timeout: 30000 });
  await makerPage.getByRole('tab', { name: 'Create an offer', exact: true }).click();
  await makerPage
    .getByRole('button', { name: 'Review offer terms', exact: true })
    .click();
  await makerPage
    .getByRole('button', { name: 'Sign exact terms in wallet', exact: true })
    .click();
  await makerPage
    .getByRole('button', { name: 'Read and review offer', exact: true })
    .click();
  const delegatedQuote = await makerPage
    .getByLabel('Signed offer JSON', { exact: true })
    .inputValue();
  await makerPage
    .getByRole('button', { name: 'Approve exact offered amount', exact: true })
    .click();
  await expect(
    makerPage.getByRole('status').filter({ hasText: 'Token allowance confirmed' }),
  ).toBeVisible({ timeout: 30000 });
  const delegatePage = await signerPage(accounts[2]);
  await delegatePage.route('**/api/portaldot/account?*', (route) =>
    route.fulfill({ status: 503, json: { error: 'Local EVM test' } }),
  );
  await connect(delegatePage);
  await delegatePage.goto('http://localhost:3018/app/agents');
  await delegatePage.getByRole('tab', { name: 'RFQ mandates', exact: true }).click();
  await delegatePage.getByLabel('On-chain RFQ policy ID', { exact: true }).fill(policyId);
  await delegatePage
    .getByLabel('Delegate signed quote JSON', { exact: true })
    .fill(delegatedQuote);
  await delegatePage
    .getByRole('button', { name: 'Execute permitted quote as delegate', exact: true })
    .click();
  await expect(
    delegatePage
      .getByRole('status')
      .filter({ hasText: /RfqExecuted (confirmed|finalized)/ }),
  ).toBeVisible({ timeout: 30000 });
  assert.equal(
    await client.readContract({
      address: buy,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [taker],
    }),
    4000000n,
  );
  assert.equal(
    await client.readContract({
      address: pay,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [taker],
    }),
    3000000n,
  );
  assert.equal(
    await client.readContract({
      address: pay,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [executor, router],
    }),
    0n,
  );
  await page.getByRole('button', { name: 'Revoke RFQ mandate', exact: true }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /RfqPolicyRevoked (confirmed|finalized)/ }),
  ).toBeVisible({ timeout: 30000 });
  assert.deepEqual(errors, []);
  await mkdir('test-results/local-rfq', { recursive: true });
  await page.screenshot({ path: 'test-results/local-rfq/settled.png', fullPage: true });
  console.log(
    'PASS: browser request signature → maker quote signature → exact maker/taker approvals → simulation → compiled router settlement → verified receipt → actual balances → separately authorized bounded delegate quote → mandate revocation. Isolated local Anvil only.',
  );
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once('exit', resolve));
    server.kill('SIGTERM');
    await stopped;
  }
  env.close();
  await Promise.all(
    generatedFiles.map((path, i) =>
      previous[i] === undefined
        ? rm(path, { force: true })
        : writeFile(path, previous[i]),
    ),
  );
}
