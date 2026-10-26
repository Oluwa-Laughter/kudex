import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  parseAbi,
  zeroAddress,
} from 'viem';
import { PORTALDOT_NATIVE_WS, portaldotTestnet } from '@/lib/chains/portaldot';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { snapshots } from './snapshot-cache';

export const rpcClient = createPublicClient({
  chain: portaldotTestnet,
  transport: http(undefined, { timeout: 12_000, retryCount: 0 }),
});
const GENESIS = '0xd4f9acbcf7f52388d8b095abe3c198d19fc510e0343e643e87cfbccb155283bd';
const vaultAbi = parseAbi([
  'function asset() view returns(address)',
  'function totalAssets() view returns(uint256)',
  'function isDefaulted() view returns(bool)',
  'function riskScore() view returns(uint256)',
]);
let nativePromise: Promise<import('@polkadot/api').ApiPromise> | undefined;
async function nativeApi() {
  if (!nativePromise) {
    nativePromise = (async () => {
      const { ApiPromise, HttpProvider } = await import('@polkadot/api');
      class DeadlineHttpProvider extends HttpProvider {
        private sequence = 0;
        constructor(private endpointUrl: string) {
          super(endpointUrl);
        }
        override async send<T>(method: string, params: unknown[]): Promise<T> {
          const response = await fetch(this.endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: ++this.sequence, method, params }),
            signal: AbortSignal.timeout(12_000),
            cache: 'no-store',
          });
          if (!response.ok) throw new Error('Native RPC request failed.');
          const body = await response.json();
          if (body.error || !Object.hasOwn(body, 'result'))
            throw new Error('Native RPC returned an error.');
          return body.result as T;
        }
      }
      const api = new ApiPromise({
        provider: new DeadlineHttpProvider(
          PORTALDOT_NATIVE_WS.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:'),
        ),
        noInitWarn: true,
        throwOnConnect: true,
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          api.isReadyOrError,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new Error('Native metadata initialization timed out.')),
              25_000,
            );
          }),
        ]);
      } catch (error) {
        await api.disconnect();
        throw error;
      } finally {
        if (timer) clearTimeout(timer);
      }
      if (
        api.genesisHash.toHex() !== GENESIS ||
        api.consts.revive.chainId.toString() !== '420420777' ||
        api.consts.revive.nativeToEthRatio.toString() !== '10000' ||
        api.registry.chainDecimals[0] !== 14
      ) {
        await api.disconnect();
        throw new Error('Unexpected native network identity.');
      }
      return api;
    })().catch((error) => {
      nativePromise = undefined;
      throw error;
    });
  }
  return nativePromise;
}
export function networkSnapshot() {
  return snapshots.read('network', async () => {
    const [chainId, block, gasPrice, contracts] = await Promise.all([
      rpcClient.getChainId(),
      rpcClient.getBlock(),
      rpcClient.getGasPrice(),
      Promise.all(
        Object.entries({
          vault: CONTRACT_ADDRESSES.vault,
          router: CONTRACT_ADDRESSES.rfqMarket,
          collateral: CONTRACT_ADDRESSES.usdc,
        }).map(async ([name, address]) => {
          if (address === zeroAddress) return { name, address, status: 'not-configured' };
          const code = await rpcClient.getBytecode({ address });
          return {
            name,
            address,
            status: code && code !== '0x' ? 'code-found' : 'no-code',
          };
        }),
      ),
    ]);
    if (chainId !== 420420777) throw new Error('Unexpected EVM chain identity.');
    return {
      chainId,
      block: block.number.toString(),
      observedAt: new Date().toISOString(),
      blockTimestamp: Number(block.timestamp),
      gasPriceBaseUnits: gasPrice.toString(),
      contracts,
    };
  });
}
export function nativeAccountSnapshot(address: string) {
  return snapshots.read(`native:${address}`, async () => {
    const api = await nativeApi();
    const accountId = api.createType('AccountId', address);
    const finalizedHash = await api.rpc.chain.getFinalizedHead();
    const at = await api.at(finalizedHash);
    const [account, mapped, header] = await Promise.all([
      at.query.system.account(accountId),
      at.call.reviveApi.address(accountId),
      api.rpc.chain.getHeader(finalizedHash),
    ]);
    const value = account.toJSON() as {
      data: { free: string; reserved: string; frozen: string };
    };
    const free = BigInt(value.data.free),
      frozen = BigInt(value.data.frozen);
    return {
      address: accountId.toString(),
      contractAddress: mapped.toHex(),
      nativeFreeBaseUnits: free.toString(),
      nativeFreeTPOT: formatUnits(free, 14),
      nativeFrozenTPOT: formatUnits(frozen, 14),
      nativeSpendableUpperBoundTPOT: formatUnits(free > frozen ? free - frozen : 0n, 14),
      finalizedBlock: header.number.toString(),
      finalizedHash: finalizedHash.toHex(),
      genesisHash: GENESIS,
      specVersion: api.runtimeVersion.specVersion.toString(),
      observedAt: new Date().toISOString(),
      nativeDecimals: 14,
      evmDecimals: 18,
    };
  });
}
export function evmAccountSnapshot(address: `0x${string}`) {
  return snapshots.read(`evm:${address}`, async () => {
    if ((await rpcClient.getChainId()) !== 420420777)
      throw new Error('Unexpected network.');
    const block = await rpcClient.getBlockNumber({ cacheTime: 0 });
    const balance = await rpcClient.getBalance({ address, blockNumber: block });

    let nativeFundingAddress = '';
    let nativeFreeTPOT = '0';
    try {
      const api = await nativeApi();
      const mapped = await api.call.reviveApi.accountId(address);
      nativeFundingAddress = mapped.toString();
      const account = await api.query.system.account(mapped);
      const value = account.toJSON() as { data?: { free?: string } };
      if (value?.data?.free) {
        nativeFreeTPOT = formatUnits(BigInt(value.data.free), 14);
      }
    } catch {
      // Fallback if native metadata is temporarily busy
    }

    return {
      address,
      balanceBaseUnits: balance.toString(),
      gasTPOT: formatUnits(balance, 18),
      nativeFundingAddress,
      nativeFreeTPOT,
      block: block.toString(),
      observedAt: new Date().toISOString(),
    };
  });
}
export function vaultSnapshot() {
  return snapshots.read('vault', async () => {
    const { vault, usdc } = CONTRACT_ADDRESSES;
    if (vault === zeroAddress || usdc === zeroAddress)
      return {
        status: 'not-configured' as const,
        message:
          'Vault deployment has not been configured. No active vault is being reported.',
      };
    if ((await rpcClient.getChainId()) !== 420420777)
      throw new Error('Unexpected network.');
    const block = await rpcClient.getBlockNumber({ cacheTime: 0 });
    const asset = await rpcClient.readContract({
      address: vault,
      abi: vaultAbi,
      functionName: 'asset',
      blockNumber: block,
    });
    if (asset.toLowerCase() !== usdc.toLowerCase())
      throw new Error('Vault asset mismatch.');
    const [assets, decimals, symbol, frozen, risk] = await Promise.all([
      rpcClient.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'totalAssets',
        blockNumber: block,
      }),
      rpcClient.readContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'decimals',
        blockNumber: block,
      }),
      rpcClient.readContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'symbol',
        blockNumber: block,
      }),
      rpcClient.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'isDefaulted',
        blockNumber: block,
      }),
      rpcClient.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'riskScore',
        blockNumber: block,
      }),
    ]);
    return {
      status: 'observed' as const,
      vault,
      asset,
      symbol,
      totalAssets: formatUnits(assets, decimals),
      decimals,
      depositFrozen: frozen,
      riskScoreBps: risk.toString(),
      riskScorePercent: formatUnits(risk, 2),
      block: block.toString(),
      observedAt: new Date().toISOString(),
    };
  });
}
