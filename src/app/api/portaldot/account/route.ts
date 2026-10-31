import { isAddress } from 'viem';
import { contextSchema } from '@/lib/agent/request';
import { nativeAccountSnapshot, evmAccountSnapshot } from '@/lib/server/portaldot';
import { guardRequest, requestError, RequestRejected } from '@/lib/server/request-guard';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    guardRequest(request, 20);
    const searchParams = new URL(request.url).searchParams;
    const address = searchParams.get('address') || searchParams.get('native');
    const evm = searchParams.get('evm');

    if (evm && isAddress(evm)) {
      const result = await evmAccountSnapshot(evm as `0x${string}`);
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (address && isAddress(address)) {
      const result = await evmAccountSnapshot(address as `0x${string}`);
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    }

    const parsed = contextSchema.safeParse({ nativeAddress: address });
    if (!parsed.success || !parsed.data.nativeAddress)
      throw new RequestRejected('Select a valid native account address or 0x wallet address.', 400);

    const result = await nativeAccountSnapshot(parsed.data.nativeAddress);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RequestRejected) return requestError(error);
    return Response.json(
      {
        error:
          'The Portaldot RPC did not complete this account read. Try again shortly.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
