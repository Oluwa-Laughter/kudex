// Real browser + injected wallet + real local contracts on Anvil.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { keccak256, zeroAddress } from 'viem';
import { localChain } from './helpers-local-chain.mjs';

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
  const owner = accounts[0];

  const pusd = await deploy('KudexTestToken');
  const potStaking = await deploy('KudexPOTStaking', [pusd]);
  const businessRegistry = await deploy('KudexBusinessRegistry');
  const vault = await deploy('KudexVault', [
    pusd,
    'Treasury Liquidity Vault',
    'kUSDC',
    zeroAddress,
  ]);
  const rfqMarket = await deploy('KudexRFQMarket');
  const invoiceEscrow = await deploy('KudexInvoiceEscrow', [
    vault,
    owner,
    potStaking,
  ]);
  const daasAdapter = await deploy('KudexDaaSAdapter', [vault]);

  const rpc = client.chain.rpcUrls.default.http[0];

  const vars = {
    ...process.env,
    PORT: '3019',
    NEXT_PUBLIC_PORTALDOT_RPC_HTTP: rpc,
    NEXT_PUBLIC_PORTALDOT_CHAIN_ID: '420420777',
    NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS: '18',
    NEXT_PUBLIC_VAULT_ADDRESS: vault,
    NEXT_PUBLIC_USDC_ADDRESS: pusd,
    NEXT_PUBLIC_RFQ_ROUTER_ADDRESS: rfqMarket,
    NEXT_PUBLIC_DAAS_ADAPTER_ADDRESS: daasAdapter,
    NEXT_PUBLIC_INVOICE_ESCROW_ADDRESS: invoiceEscrow,
    NEXT_PUBLIC_BUSINESS_REGISTRY_ADDRESS: businessRegistry,
    NEXT_PUBLIC_POT_STAKING_ADDRESS: potStaking,
    NEXT_PUBLIC_VAULT_CODE_HASH: keccak256(await client.getBytecode({ address: vault })),
    NEXT_PUBLIC_COLLATERAL_CODE_HASH: keccak256(
      await client.getBytecode({ address: pusd }),
    ),
  };

  server = spawn('pnpm', ['exec', 'next', 'dev', '-p', '3019'], {
    env: vars,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error('Local Portaldot test app startup timeout')),
      45000,
    );
    server.once('exit', () => {
      clearTimeout(timer);
      reject(Error('Local Portaldot test app exited'));
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

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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
          if (method === 'eth_chainId') return '0x190f1ca9';
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

  // Mock native mapping endpoint
  await page.route('**/api/portaldot/account?*', (route) =>
    route.fulfill({
      status: 503,
      json: { error: 'Local EVM test: native mapping unavailable' },
    }),
  );

  // 1. Navigate to /app/pay and connect injected wallet
  await page.goto('http://localhost:3019/app/pay');
  await page.getByRole('button', { name: 'Connect wallets', exact: true }).click();
  await page.getByRole('button', { name: 'Injected', exact: true }).click();
  await page.keyboard.press('Escape');

  // 2. Open Saved Contacts and register Verified Business On-Chain
  await page.getByRole('tab', { name: 'Saved Contacts' }).click();
  await page.getByLabel('Company or Trading Name').fill('Horizon Maritime Services');
  await page.getByLabel('Business Category').fill('Maritime Logistics');
  await page.getByRole('button', { name: 'Register Business On-Chain' }).click();
  await expect(
    page.getByText(/Verified business "Horizon Maritime Services" registered on-chain/),
  ).toBeVisible({ timeout: 30000 });

  // 3. Open Create & Pay Invoices and create an on-chain escrow invoice
  await page.getByRole('tab', { name: 'Create & Pay Invoices' }).click();
  await page.getByLabel('Vendor Name').fill('Horizon Maritime Services');
  await page.getByLabel('Invoice Amount (USDC)').fill('5200.00');
  await page.getByRole('button', { name: 'Create Invoice' }).click();
  await expect(
    page.getByText(/On-chain invoice created/),
  ).toBeVisible({ timeout: 30000 });

  // 4. Navigate to Earn tab via workspace navigation to preserve connected wallet
  await page.getByRole('link', { name: 'Earn' }).click();
  await expect(
    page.getByRole('heading', { name: '0% Fee Business Transfers & Swaps Membership' }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Lock POT for 0% Fees' }).click();
  await expect(
    page.getByText(/Locked 100 POT on-chain/),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('0.00% (Fee-Free)')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('0% Fee Tier Active')).toBeVisible({ timeout: 15000 });

  // 5. Click Activity History in workspace header to verify live indexed ledger
  const activityBtn = page.getByRole('button', { name: /Activity History/ });
  await expect(activityBtn).toBeVisible();
  await activityBtn.click();

  await expect(
    page.getByRole('heading', { name: 'On-Chain Activity & Receipt Center' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Verified Business Registered/ }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole('heading', { name: 'On-Chain Business Invoice Created' }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole('heading', { name: 'POT Locked · 0% Fee Tier Active' }),
  ).toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Close activity drawer' }).click();

  assert.deepEqual(errors, []);

  await mkdir('test-results/local-portaldot', { recursive: true });
  await page.screenshot({
    path: 'test-results/local-portaldot/live-ledger.png',
    fullPage: true,
  });

  console.log(
    'PASS: browser -> injected local signer -> on-chain business registry -> on-chain invoice escrow -> 14-decimal POT staking fee waiver -> live event-indexed Activity Drawer. 100% real Anvil logs.',
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
