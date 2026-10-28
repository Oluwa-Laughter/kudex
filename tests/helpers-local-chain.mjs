import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
export async function localChain() {
  const server = spawn(
    'anvil',
    ['--host', '127.0.0.1', '--port', '0', '--chain-id', '420420777'],
    { stdio: ['ignore', 'pipe', 'ignore'] },
  );
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Local chain startup timeout')), 10000);
      const fail = () => {
        clearTimeout(timer);
        reject(Error('Local chain startup failure'));
      };
      server.once('error', fail);
      server.once('exit', fail);
      server.stdout.on('data', (chunk) => {
        const match = chunk.toString().match(/Listening on 127\.0\.0\.1:(\d+)/);
        if (match) {
          clearTimeout(timer);
          server.removeListener('exit', fail);
          resolve(Number(match[1]));
        }
      });
    });
    const chain = defineChain({
      id: 420420777,
      name: 'Isolated local contract verification',
      nativeCurrency: { name: 'Test', symbol: 'TEST', decimals: 18 },
      rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
    });
    const transport = http(chain.rpcUrls.default.http[0], {
      retryCount: 0,
      timeout: 2000,
    });
    const client = createPublicClient({ chain, transport, pollingInterval: 25 });
    const accounts = await createWalletClient({ chain, transport }).getAddresses();
    const wallet = createWalletClient({ chain, transport, account: accounts[0] });
    const wait = async (hash) => {
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Local transaction reverted');
      return receipt;
    };
    const artifact = async (name) =>
      JSON.parse(
        await readFile(
          new URL(`../contracts/out/${name}.sol/${name}.json`, import.meta.url),
          'utf8',
        ),
      );
    const deploy = async (name, args = []) => {
      const a = await artifact(name);
      const r = await wait(
        await wallet.deployContract({ abi: a.abi, bytecode: a.bytecode.object, args }),
      );
      if (!r.contractAddress) throw Error('Missing deployment address');
      return r.contractAddress;
    };
    return {
      client,
      wallet,
      accounts,
      wait,
      deploy,
      artifact,
      close: () => server.kill('SIGTERM'),
    };
  } catch (error) {
    server.kill('SIGTERM');
    throw error;
  }
}
