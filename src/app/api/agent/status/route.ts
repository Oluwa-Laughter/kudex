import { agentAvailability } from '@/lib/server/agent';
export function GET() {
  return Response.json(agentAvailability(), { headers: { 'Cache-Control': 'no-store' } });
}
