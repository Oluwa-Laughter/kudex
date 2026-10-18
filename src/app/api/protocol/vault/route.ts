import { vaultSnapshot } from '@/lib/server/portaldot';
import { guardRequest, requestError } from '@/lib/server/request-guard';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    guardRequest(request, 60);
    const data = await vaultSnapshot();
    return Response.json(data, {
      status: data.status === 'observed' ? 200 : 409,
      headers: {
        'Cache-Control':
          data.status === 'observed' ? 'public, s-maxage=5, max-age=0' : 'no-store',
      },
    });
  } catch (error) {
    return requestError(error);
  }
}
