export interface AgentEvidence {
  tool: string;
  title: string;
  status: 'observed' | 'unavailable';
  data: Record<string, unknown>;
}
export interface AgentReply {
  id: string;
  mode: 'gemini' | 'guided';
  text: string;
  evidence: AgentEvidence[];
  observedAt: string;
  modelAvailable: boolean;
}
