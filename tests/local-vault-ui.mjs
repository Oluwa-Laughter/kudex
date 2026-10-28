// Compiled app + real local contracts. All signing is restricted to this child Anvil.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { keccak256, zeroAddress } from 'viem';
import { localChain } from './helpers-local-chain.mjs';
import { readVault } from '../src/lib/contracts/vault-client.ts';
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
  const owner = accounts[0],
    asset = await deploy('KudexTestToken');
  const vault = await deploy('KudexVault', [asset, 'Public vault', 'KV', zeroAddress]);
  const rpc = client.chain.rpcUrls.default.http[0];
  const initial = await readVault(client, vault, asset, owner);
  const vars = {
    ...process.env,
    KUDEX_LOCAL_VAULT_TEST: '1',
    NEXT_PUBLIC_PORTALDOT_RPC_HTTP: rpc,
    NEXT_PUBLIC_PORTALDOT_CHAIN_ID: '420420777',
    NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS: '18',
    NEXT_PUBLIC_VAULT_ADDRESS: vault,
    NEXT_PUBLIC_USDC_ADDRESS: asset,
    NEXT_PUBLIC_VAULT_CODE_HASH: keccak256(await client.getBytecode({ address: vault })),
    NEXT_PUBLIC_COLLATERAL_CODE_HASH: keccak256(
      await client.getBytecode({ address: asset }),
    ),
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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
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
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params ?? [] }),
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
  // The native mapping service is not part of this local EVM signing story.
  await page.route('**/api/portaldot/account?*', (route) =>
    route.fulfill({
      status: 503,
      json: { error: 'Local EVM test: native mapping unavailable' },
    }),
  );
  await page.goto('http://localhost:3018/app/vaults');
  await page.getByRole('button', { name: 'Connect wallets', exact: true }).click();
  await page.getByRole('button', { name: 'Injected', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'On-chain position', exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByLabel('Collateral amount', { exact: true }).fill('12.345678');
  await page
    .getByRole('button', { name: 'Review vault transaction', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Approve exact deposit amount', exact: true })
    .click();
  await expect(page.getByText(/Allowance update (confirmed|finalized)\./)).toBeVisible({
    timeout: 30000,
  });
  await page
    .getByRole('button', { name: 'Review vault transaction', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirm deposit in wallet', exact: true })
    .click();
  await expect(page.getByText(/Deposit (confirmed|finalized)\./)).toBeVisible({
    timeout: 30000,
  });
  const deposited = await readVault(client, vault, asset, owner);
  assert.equal(deposited.shares, 12345678n);
  assert.equal(deposited.allowance, 0n);
  await page.getByLabel('Operation', { exact: true }).selectOption('redeem');
  await page.getByLabel('Shares to redeem', { exact: true }).fill('12.345678');
  await page
    .getByRole('button', { name: 'Review vault transaction', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirm redeem in wallet', exact: true })
    .click();
  await expect(page.getByText(/Redemption (confirmed|finalized)\./)).toBeVisible({
    timeout: 30000,
  });
  const final = await readVault(client, vault, asset, owner);
  assert.equal(final.shares, 0n);
  assert.equal(final.balance, initial.balance);
  assert.deepEqual(errors, []);
  await mkdir('test-results/local-vault', { recursive: true });
  await page.screenshot({
    path: 'test-results/local-vault/round-trip.png',
    fullPage: true,
  });
  console.log(
    'PASS: browser → injected local signer → compiled vault → verified receipts → chain-refreshed position → full redemption. Local Anvil only.',
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
