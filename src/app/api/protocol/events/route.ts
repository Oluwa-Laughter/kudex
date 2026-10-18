import { recentProtocolEvents } from '@/lib/server/protocol-events';
import { guardRequest, requestError } from '@/lib/server/request-guard';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    guardRequest(request, 30);
    const data = await recentProtocolEvents();
    return Response.json(data, {
      status: data.status === 'observed' ? 200 : 409,
      headers: {
        'Cache-Control':
          data.status === 'observed' ? 'public, s-maxage=15, max-age=0' : 'no-store',
      },
    });
  } catch (error) {
    return requestError(error);
  }
}
