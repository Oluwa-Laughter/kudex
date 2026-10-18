import { contextSchema } from '@/lib/agent/request';
import { nativeAccountSnapshot } from '@/lib/server/portaldot';
import { guardRequest, requestError, RequestRejected } from '@/lib/server/request-guard';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    guardRequest(request, 20);
    const address = new URL(request.url).searchParams.get('address');
    const parsed = contextSchema.safeParse({ nativeAddress: address });
    if (!parsed.success || !parsed.data.nativeAddress)
      throw new RequestRejected('Select a valid native Portaldot address.', 400);
    const result = await nativeAccountSnapshot(parsed.data.nativeAddress);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RequestRejected) return requestError(error);
    return Response.json(
      {
        error:
          'The native RPC did not complete this account read. Your balance is unknown. Try again shortly.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
