import { chatRequestSchema } from '@/lib/agent/request';
import { answerAgent } from '@/lib/server/agent';
import {
  guardRequest,
  readSmallJson,
  requestError,
  RequestRejected,
} from '@/lib/server/request-guard';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    guardRequest(request, 10);
    const input = chatRequestSchema.safeParse(await readSmallJson(request));
    if (!input.success)
      throw new RequestRejected(
        'Check the message, connected account, and conversation size.',
        400,
      );
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]);
    if (request.headers.get('accept')?.includes('application/x-ndjson')) {
      let cancelled = false;
      const abort = new AbortController();
      const streamSignal = AbortSignal.any([signal, abort.signal]);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const emit = (event: unknown) => {
            if (!cancelled)
              controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          };
          try {
            const result = await answerAgent(input.data, streamSignal, emit);
            emit({ type: 'result', result });
          } catch {
            emit({
              type: 'error',
              error:
                'The live request could not be completed. Try again shortly. No transaction was submitted.',
            });
          } finally {
            if (!cancelled) controller.close();
          }
        },
        cancel() {
          cancelled = true;
          abort.abort();
        },
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Cache-Control': 'no-store, no-transform',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const result = await answerAgent(input.data, signal);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return requestError(error);
  }
}
