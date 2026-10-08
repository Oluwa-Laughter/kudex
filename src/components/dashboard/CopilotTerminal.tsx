'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RFQQuoteCard } from '@/components/generative/RFQQuoteCard';
import { PreFlightSimCard } from '@/components/generative/PreFlightSimCard';
import { ShieldReceiptCard } from '@/components/generative/ShieldReceiptCard';
import {
  FiSend,
  FiTerminal,
  FiCpu,
  FiUser,
  FiZap,
  FiShield,
  FiActivity,
  FiCornerDownLeft,
} from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  args: any;
  result?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
}

const QUICK_PROMPTS = [
  { label: 'Swap 100 pUSD for wPOT', icon: FiZap },
  { label: 'Simulate 500 pUSD Senior Vault Deposit', icon: FiActivity },
  { label: 'Shield deposit into Confidential Pool', icon: FiShield },
];

export function CopilotTerminal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Kudex Sentinel initialized on Portaldot V3.0 EVM (Chain ID 8890). All transactions are mathematically verified and bounded by native BigInt limits. How may I assist your portfolio today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (contentToSend: string) => {
    if (!contentToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: contentToSend.trim(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      toolInvocations: [],
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to stream response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      const toolMap = new Map<string, ToolInvocation>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          // Vercel AI SDK Data Stream protocol
          // 0: text content
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulatedContent += text;
            } catch {
              accumulatedContent += line.slice(2);
            }
          }
          // 9: tool call
          else if (line.startsWith('9:')) {
            try {
              const toolCall = JSON.parse(line.slice(2));
              toolMap.set(toolCall.toolCallId, {
                toolName: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                args: toolCall.args,
              });
            } catch (err) {
              console.error('Error parsing tool call', err);
            }
          }
          // a: tool result
          else if (line.startsWith('a:')) {
            try {
              const { toolCallId, result } = JSON.parse(line.slice(2));
              const existing = toolMap.get(toolCallId);
              if (existing) {
                existing.result = result;
              } else {
                toolMap.set(toolCallId, {
                  toolCallId,
                  toolName: 'unknown',
                  args: {},
                  result,
                });
              }
            } catch (err) {
              console.error('Error parsing tool result', err);
            }
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: accumulatedContent,
                  toolInvocations: Array.from(toolMap.values()),
                }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Copilot request failed:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  'Communication error encountered with Portaldot Sentinel node. Please verify RPC connection and retry.',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Terminal Header */}
      <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RiRobot2Line className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                KUDEX SENTINEL COPILOT
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400">
              Autonomous RFQ Decomposer & Pre-Flight Invariant Auditor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-500">
            <FiTerminal className="w-3 3" />
            <span>Portaldot 14-Decimals Enforced</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCpu className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-4 text-xs font-sans leading-relaxed ${
                  isUser
                    ? 'bg-neutral-900 text-white dark:bg-emerald-600 dark:text-white rounded-tr-none'
                    : 'bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 rounded-tl-none border border-neutral-200 dark:border-neutral-700/60'
                }`}
              >
                {/* Text Content */}
                {message.content && (
                  <div className="whitespace-pre-wrap font-sans">
                    {message.content}
                  </div>
                )}

                {/* Generative Tool Invocations */}
                {message.toolInvocations?.map((toolInvocation) => {
                  const { toolName, toolCallId, result } = toolInvocation;

                  if (toolName === 'getRFQQuote') {
                    if (result) {
                      return <RFQQuoteCard key={toolCallId} quote={result} />;
                    }
                    return (
                      <div key={toolCallId} className="my-2 p-3 rounded-lg bg-neutral-200/50 dark:bg-neutral-700/50 text-[11px] font-mono animate-pulse">
                        Solving optimum RFQ execution across Portaldot liquidity...
                      </div>
                    );
                  }

                  if (toolName === 'runPreFlightSimulation') {
                    if (result) {
                      return <PreFlightSimCard key={toolCallId} simulation={result} />;
                    }
                    return (
                      <div key={toolCallId} className="my-2 p-3 rounded-lg bg-neutral-200/50 dark:bg-neutral-700/50 text-[11px] font-mono animate-pulse">
                        Simulating pre-flight state diffs on Portaldot node...
                      </div>
                    );
                  }

                  if (toolName === 'shieldDepositReceipt') {
                    if (result) {
                      return <ShieldReceiptCard key={toolCallId} receipt={result} />;
                    }
                    return (
                      <div key={toolCallId} className="my-2 p-3 rounded-lg bg-neutral-200/50 dark:bg-neutral-700/50 text-[11px] font-mono animate-pulse">
                        Generating client-side Zero-Knowledge note commitment...
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiUser className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FiCpu className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-xs font-mono text-neutral-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sentinel synthesizing intent & solver routes...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-5 py-2.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-950/20 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-neutral-400 flex-shrink-0 uppercase">Suggested:</span>
        {QUICK_PROMPTS.map((qp) => {
          const Icon = qp.icon;
          return (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.label)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 transition flex-shrink-0"
            >
              <Icon className="w-3 h-3 text-emerald-500" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sentinel to swap, simulate invariant safety, or shield vault assets..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium transition shadow-sm"
        >
          <span>Send</span>
          <FiCornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
