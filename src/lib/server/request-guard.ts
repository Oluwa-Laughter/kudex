import { createHash } from 'node:crypto';
const buckets = new Map<string, { count: number; reset: number }>();
export class RequestRejected extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
/** Backstop only: configure a shared platform limit before public traffic. */
export function guardRequest(request: Request, limit = 12) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new RequestRejected('Use the agent from the Kudex application.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    throw new RequestRejected('Cross-site requests are not supported.', 403);
  const now = Date.now();
  for (const [key, value] of buckets) if (value.reset <= now) buckets.delete(key);
  const ip =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    'local';
  const key = createHash('sha256')
    .update(ip.split(',')[0].trim() + '|' + new URL(request.url).pathname)
    .digest('hex');
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= 2048)
      throw new RequestRejected('The service is busy. Try again later.', 429);
    bucket = { count: 0, reset: now + 60_000 };
    buckets.set(key, bucket);
  }
  if (++bucket.count > limit)
    throw new RequestRejected('Too many requests. Try again in a minute.', 429);
}
export async function readSmallJson(
  request: Request,
  maxBytes = 12_000,
): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new RequestRejected('Send a JSON request.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestRejected('Request body is required.', 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestRejected('The message is too long.', 413);
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof RequestRejected) throw error;
    throw new RequestRejected('The request is not valid JSON.', 400);
  } finally {
    reader.releaseLock();
  }
}
export function requestError(error: unknown) {
  const status = error instanceof RequestRejected ? error.status : 503;
  return Response.json(
    {
      error:
        error instanceof RequestRejected
          ? error.message
          : 'The live service did not complete this check. Try again shortly.',
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(status === 429 ? { 'Retry-After': '60' } : {}),
      },
    },
  );
}
