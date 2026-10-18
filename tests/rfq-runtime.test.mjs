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
