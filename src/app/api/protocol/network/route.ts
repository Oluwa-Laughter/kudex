import { networkSnapshot } from '@/lib/server/portaldot';
import { guardRequest, requestError } from '@/lib/server/request-guard';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    guardRequest(request, 60);
    const data = await networkSnapshot();
    return Response.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=10, max-age=0',
      },
    });
  } catch (error) {
    return requestError(error);
  }
}
