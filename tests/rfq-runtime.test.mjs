import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  http,
} from 'viem';
import {
  parseSignedOffer,
  serializeSignedOffer,
  rfqHash,
  rfqDomain,
  rfqOrderTypes,
} from '../src/lib/contracts/orders.ts';

test(
  'exported maker offer settles on a local EVM, transfers exact amounts and cannot replay',
  { timeout: 30000 },
  async () => {
    const server = spawn(
      'anvil',
      ['--host', '127.0.0.1', '--port', '0', '--chain-id', '420420777'],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    );
    try {
      // Wait for this child to own its fresh ephemeral port. Never attach to an existing node.
      const port = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('The isolated local node did not start.')),
          10000,
        );
        const fail = () => {
          clearTimeout(timer);
          reject(new Error('The isolated local node exited before startup.'));
        };
        server.once('error', fail);
        server.once('exit', fail);
        server.stdout.on('data', (chunk) => {
          const match = chunk.toString().match(/Listening on 127\.0\.0\.1:(\d+)/);
          if (!match) return;
          clearTimeout(timer);
          server.removeListener('error', fail);
          server.removeListener('exit', fail);
          resolve(Number(match[1]));
        });
      });
      const chain = defineChain({
        id: 420420777,
        name: 'Local RFQ verification',
        nativeCurrency: { name: 'Test gas', symbol: 'TEST', decimals: 18 },
        rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
      });
      const transport = http(chain.rpcUrls.default.http[0], {
        timeout: 1000,
        retryCount: 0,
      });
      const client = createPublicClient({ chain, transport });
      assert.equal(await client.getChainId(), chain.id);
      const accounts = await createWalletClient({ chain, transport }).getAddresses();
      const maker = createWalletClient({ chain, transport, account: accounts[0] });
      const taker = createWalletClient({ chain, transport, account: accounts[1] });
      const tokenArtifact = JSON.parse(
        await readFile(
          new URL(
            '../contracts/out/KudexTestToken.sol/KudexTestToken.json',
            import.meta.url,
          ),
          'utf8',
        ),
      );
      const routerArtifact = JSON.parse(
        await readFile(
          new URL(
            '../contracts/out/KudexRFQMarket.sol/KudexRFQMarket.json',
            import.meta.url,
          ),
          'utf8',
        ),
      );
      const wait = async (hash) => {
        const receipt = await client.waitForTransactionReceipt({
          hash,
          pollingInterval: 30,
        });
        assert.equal(receipt.status, 'success');
        return receipt;
      };
      const deploy = async (artifact) => {
        const receipt = await wait(
          await maker.deployContract({
            abi: artifact.abi,
            bytecode: artifact.bytecode.object,
          }),
        );
        assert.ok(receipt.contractAddress);
        return receipt.contractAddress;
      };
      const tokenIn = await deploy(tokenArtifact),
        tokenOut = await deploy(tokenArtifact),
        router = await deploy(routerArtifact);
      const amountIn = 123456789n,
        amountOut = 98765432n;
      await wait(
        await maker.writeContract({
          address: tokenOut,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [accounts[1], amountOut],
        }),
      );
      await wait(
        await maker.writeContract({
          address: tokenIn,
          abi: erc20Abi,
          functionName: 'approve',
          args: [router, amountIn],
        }),
      );
      await wait(
        await taker.writeContract({
          address: tokenOut,
          abi: erc20Abi,
          functionName: 'approve',
          args: [router, amountOut],
        }),
      );
      const block = await client.getBlock();
      const order = {
        maker: accounts[0],
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        nonce: 42n,
        deadline: block.timestamp + 3600n,
      };
      const signature = await maker.signTypedData({
        domain: rfqDomain(chain.id, router),
        types: rfqOrderTypes,
        primaryType: 'Order',
        message: order,
      });
      const offer = parseSignedOffer(
        serializeSignedOffer({ chainId: chain.id, router, order, signature }),
        chain.id,
        router,
      );
      assert.equal(
        await client.readContract({
          address: router,
          abi: routerArtifact.abi,
          functionName: 'hashOrder',
          args: [offer.order],
        }),
        rfqHash(offer),
      );
      const request = await client.simulateContract({
        address: router,
        abi: routerArtifact.abi,
        functionName: 'fillOrder',
        args: [offer.order, offer.signature],
        account: accounts[1],
      });
      await wait(await taker.writeContract(request.request));
      assert.equal(
        await client.readContract({
          address: tokenIn,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accounts[1]],
        }),
        amountIn,
      );
      assert.equal(
        await client.readContract({
          address: tokenOut,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accounts[1]],
        }),
        0n,
      );
      assert.equal(
        await client.readContract({
          address: router,
          abi: routerArtifact.abi,
          functionName: 'nonceUsed',
          args: [accounts[0], 42n],
        }),
        true,
      );
      assert.equal(
        await client.readContract({
          address: router,
          abi: routerArtifact.abi,
          functionName: 'orderSettled',
          args: [rfqHash(offer)],
        }),
        true,
      );
      await assert.rejects(
        client.simulateContract({
          address: router,
          abi: routerArtifact.abi,
          functionName: 'fillOrder',
          args: [offer.order, offer.signature],
          account: accounts[1],
        }),
      );
    } finally {
      server.kill('SIGTERM');
    }
  },
);

test(
  'separate RFQ delegate policy executes compiled contracts, clears allowance and respects revocation',
  { timeout: 30000 },
  async () => {
    const { localChain } = await import('./helpers-local-chain.mjs');
    const { verifyRfqReceipt } = await import('../src/lib/contracts/rfq-execution.ts');
    const env = await localChain();
    try {
      const { client, accounts, deploy, artifact, wait, wallet } = env;
      const buy = await deploy('KudexTestToken'),
        pay = await deploy('KudexTestToken'),
        router = await deploy('KudexRFQMarket'),
        executor = await deploy('KudexRfqExecutor', [router]);
      const maker = createWalletClient({
        chain: client.chain,
        transport: http(client.chain.rpcUrls.default.http[0]),
        account: accounts[1],
      });
      const delegate = createWalletClient({
        chain: client.chain,
        transport: http(client.chain.rpcUrls.default.http[0]),
        account: accounts[2],
      });
      const a = await artifact('KudexRfqExecutor');
      const { rfqExecutorAbi } = await import('../src/lib/contracts/rfq-executor-abi.ts');
      assert.deepEqual(
        rfqExecutorAbi,
        a.abi.filter((x) => ['function', 'event', 'error'].includes(x.type)),
      );
      const write = async (w, address, abi, functionName, args) =>
        wait(await w.writeContract({ address, abi, functionName, args }));
      await write(wallet, buy, erc20Abi, 'transfer', [accounts[1], 200n]);
      await write(maker, buy, erc20Abi, 'approve', [router, 200n]);
      await write(wallet, pay, erc20Abi, 'approve', [executor, 100n]);
      const now = (await client.getBlock()).timestamp;
      const terms = {
        delegate: accounts[2],
        maker: accounts[1],
        buyToken: buy,
        payToken: pay,
        expiresAt: now + 3600n,
        minimumBuy: 2n,
        referencePay: 1n,
        perActionCap: 50n,
        dailyCap: 75n,
        totalCap: 100n,
      };
      const sim = await client.simulateContract({
        address: executor,
        abi: a.abi,
        functionName: 'createPolicy',
        args: [terms],
        account: accounts[0],
      });
      const id = sim.result;
      await wait(await wallet.writeContract(sim.request));
      const order = {
        maker: accounts[1],
        tokenIn: buy,
        tokenOut: pay,
        amountIn: 100n,
        amountOut: 50n,
        deadline: now + 1800n,
        nonce: 1n,
      };
      const signature = await maker.signTypedData({
        domain: rfqDomain(client.chain.id, router),
        types: rfqOrderTypes,
        primaryType: 'Order',
        message: order,
      });
      const tx = await client.simulateContract({
        address: executor,
        abi: a.abi,
        functionName: 'execute',
        args: [id, order, signature],
        account: accounts[2],
      });
      const receipt = await wait(await delegate.writeContract(tx.request));
      const { parseEventLogs } = await import('viem');
      const events = parseEventLogs({
        abi: a.abi,
        eventName: 'RfqExecuted',
        logs: receipt.logs.filter(
          (l) => l.address.toLowerCase() === executor.toLowerCase(),
        ),
      });
      assert.equal(events.length, 1);
      assert.equal(events[0].args.id, id);
      assert.equal(events[0].args.received, 100n);
      assert.equal(events[0].args.paid, 50n);
      for (const token of [buy, pay])
        assert.equal(
          await client.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [executor],
          }),
          0n,
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
      const policy = await client.readContract({
        address: executor,
        abi: a.abi,
        functionName: 'policy',
        args: [id],
      });
      assert.equal(policy.spent, 50n);
      await write(wallet, executor, a.abi, 'revokePolicy', [id]);
      await assert.rejects(
        client.simulateContract({
          address: executor,
          abi: a.abi,
          functionName: 'execute',
          args: [id, { ...order, nonce: 2n }, signature],
          account: accounts[2],
        }),
      );
    } finally {
      env.close();
    }
  },
);
