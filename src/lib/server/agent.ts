import { randomUUID } from 'node:crypto';
import { google } from '@ai-sdk/google';
import { streamText, isStepCount, tool } from 'ai';
import { z } from 'zod';
import {
  evmAccountSnapshot,
  nativeAccountSnapshot,
  networkSnapshot,
  vaultSnapshot,
} from './portaldot';
import type { ChatRequest } from '@/lib/agent/request';
import type { AgentEvidence, AgentReply } from '@/lib/agent/types';

export function agentAvailability() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  const hasValidKey = Boolean(key && key.startsWith('AIzaSy'));
  return {
    modelAvailable: Boolean(hasValidKey && process.env.KUDEX_AI_MODEL?.trim()),
    provider: 'Google AI Studio',
    model: process.env.KUDEX_AI_MODEL?.trim() || 'gemini-1.5-flash',
    liveChecks: true,
  };
}

let activeConversations = 0;

const instructions = `You are Kudex Agent, a plain-English financial copilot for business owners, CFOs, and investors.
Always use clear, jargon-free business language:
- Say "Private Balances (Stealth Mode)" when explaining hidden balances and private payments.
- Say "Auto-Pilot Rules (Spending Limits)" when explaining budgets and time limits for automated actions.
- Say "Fixed-Yield Business Vaults" when explaining yield vaults backed by business invoices and short-term treasuries.
- Say "Built-In Payment Protection" when explaining automatic pool freezes and safety reserve recovery.
- Say "Best-Price Auto-Routing" when explaining swaps and cross-network transfers.
- Say "1-Click Auditor Pass" when explaining read-only verification passes for accountants and tax auditors.
Never display low-level chain version strings, cryptographic proof names, token standard numbers, base-unit jargon, or raw transaction payload names.
Guide users to the 5 app tabs: /app/overview (Home), /app/pay (Send & Invoice), /app/earn (Fixed-Yield Business Vaults & Built-In Payment Protection), /app/trade (Trade & Bridge), and /app/agent (Kudex Agent & Auto-Pilot Rules).
You have read-only live checks for network status, wallet balances, and vault health. You never hold private keys or submit transactions without owner authorization. Report unavailable data honestly and never fabricate balances or guaranteed returns.`;

export type AgentProgress =
  | { type: 'status'; text: string }
  | { type: 'delta'; text: string };

function buildGuidedPlainEnglishAnswer(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('vault') || lower.includes('2,500') || lower.includes('yield')) {
    return 'Fixed-Yield Business Vaults earn steady, predictable returns backed by real-world business invoices and short-term treasuries. Open the Earn tab (/app/earn) to compare the Short-Term Treasury Vault and Verified Business Invoice Pool, verify Built-In Payment Protection status, and choose "Deposit & Hide Balance" in your wallet.';
  }
  if (lower.includes('swap') || lower.includes('private balance') || lower.includes('500')) {
    return 'Best-Price Auto-Routing compares routes in the background for zero price slippage and the lowest fee. Open Trade & Bridge (/app/trade), enter 500 USDC, check "Receive directly into my Private Balance," and confirm once in your wallet.';
  }
  if (lower.includes('protect') || lower.includes('100%') || lower.includes('safe')) {
    return 'Built-In Payment Protection monitors vault health continuously. If a borrower fails to pay an invoice on time, Kudex automatically freezes the pool and recovers your funds from the safety reserve. Review the live vault observation below or open Earn (/app/earn) for the full health meter.';
  }
  return 'Kudex Agent helps you manage Private Balances (Stealth Mode), Fixed-Yield Business Vaults with Built-In Payment Protection, Best-Price Auto-Routing swaps, and Auto-Pilot Rules (Spending Limits). Ask about a deposit, swap, invoice payment, or check your live vault status below.';
}

export async function answerAgent(
  request: ChatRequest,
  signal: AbortSignal,
  progress?: (event: AgentProgress) => void,
): Promise<AgentReply> {
  const evidence: AgentEvidence[] = [];
  const local = new Map<string, Promise<Record<string, unknown>>>();
  const observe = (
    name: string,
    title: string,
    load: () => Promise<Record<string, unknown>>,
  ) => {
    if (local.has(name)) return local.get(name)!;
    progress?.({ type: 'status', text: `Checking ${title.toLowerCase()}…` });
    const promise = load()
      .then((data) => {
        evidence.push({
          tool: name,
          title,
          status:
            data.status === 'not-configured' || data.status === 'wallet-not-connected'
              ? 'unavailable'
              : 'observed',
          data,
        });
        return data;
      })
      .catch(() => {
        const data = {
          error:
            'This live check could not be completed right now. No balance or transaction is assumed.',
        };
        evidence.push({ tool: name, title, status: 'unavailable', data });
        return data;
      });
    local.set(name, promise);
    return promise;
  };

  const network = () => observe('network', 'Live network status', networkSnapshot);
  const account = () =>
    observe('account', 'Wallet funding and mapping', async () => {
      if (request.context.nativeAddress)
        return nativeAccountSnapshot(request.context.nativeAddress);
      if (request.context.evmAddress)
        return evmAccountSnapshot(request.context.evmAddress as `0x${string}`);
      return {
        status: 'wallet-not-connected',
        message: 'Connect your wallet in the top bar first to check live balances.',
      };
    });
  const vault = () => observe('vault', 'Business vault protection', vaultSnapshot);

  const available = agentAvailability();
  let text: string;

  if (request.mode === 'ask' && available.modelAvailable) {
    if (activeConversations >= 3) throw new Error('The conversation service is busy.');
    activeConversations++;
    try {
      const result = streamText({
        model: google(available.model!),
        system: instructions,
        messages: [...request.history, { role: 'user', content: request.message }],
        tools: {
          inspectNetwork: tool({
            description: 'Read live network block height and contract readiness.',
            inputSchema: z.object({}),
            execute: network,
          }),
          inspectConnectedAccount: tool({
            description: 'Read the connected wallet funding balance from validated context.',
            inputSchema: z.object({}),
            execute: account,
          }),
          inspectVault: tool({
            description:
              'Read live Fixed-Yield Business Vault assets, risk score, and Built-In Payment Protection status.',
            inputSchema: z.object({}),
            execute: vault,
          }),
        },
        stopWhen: isStepCount(4),
        maxOutputTokens: 1000,
        maxRetries: 0,
        abortSignal: signal,
      });
      for await (const event of result.fullStream) {
        if (event.type === 'text-delta') progress?.({ type: 'delta', text: event.text });
        if (event.type === 'error')
          throw new Error('The conversation provider could not complete this response.');
      }
      text =
        (await result.text).trim() ||
        'Live checks completed. Review the summary below before confirming in your wallet.';
    } catch {
      console.warn(
        'AI provider failed; using guided mode. Request and provider details are not logged.',
      );
      text = buildGuidedPlainEnglishAnswer(request.message);
    } finally {
      activeConversations--;
    }
  } else if (request.mode === 'ask') {
    if (
      request.message.toLowerCase().includes('protect') ||
      request.message.toLowerCase().includes('vault')
    ) {
      await vault();
    }
    text = buildGuidedPlainEnglishAnswer(request.message);
  } else {
    const intent = request.mode;
    const data = await (intent === 'account'
      ? account()
      : intent === 'vault'
        ? vault()
        : network());
    if ('error' in data)
      text =
        'I could not complete the live check right now. Try again in a moment; no balance or completed payment is assumed.';
    else if (intent === 'account')
      text =
        'Here is your live wallet balance check. Make sure your account is funded before confirming a payment or vault deposit.';
    else if (intent === 'vault')
      text =
        data.status === 'not-configured'
          ? 'The business vault contract is awaiting configuration on this deployment. You can review Auto-Pilot Rules on the right panel in the meantime.'
          : 'Here is the live Fixed-Yield Business Vault status and Built-In Payment Protection check.';
    else
      text = `Network is live at block #${data.block}. Connecting your wallet never grants spending access until you approve a specific action or Auto-Pilot limit.`;
  }

  return {
    id: randomUUID(),
    mode: request.mode === 'ask' && available.modelAvailable ? 'gemini' : 'guided',
    text,
    evidence,
    observedAt: new Date().toISOString(),
    modelAvailable: available.modelAvailable,
  };
}
