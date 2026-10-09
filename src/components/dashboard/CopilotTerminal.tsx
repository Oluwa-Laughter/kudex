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
        'KUDEX AGENT initialized on the primary settlement network. All transactions are mathematically verified and bounded by native execution policies. How may I assist your portfolio today?',
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
    <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] shadow-lg flex flex-col h-[650px] overflow-hidden">
      {/* Terminal Header */}
      <div className="px-5 py-4 border-b border-[#21293D] flex items-center justify-between bg-[#161C2B]/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00E599]/10 text-[#00E599]">
            <RiRobot2Line className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-neutral-100">
                KUDEX AGENT
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-[#00E599]/10 text-[#00E599]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse" />
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Autonomous Settlement & Solvency Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#161C2B] text-xs font-mono text-neutral-400 border border-[#21293D]">
            <FiTerminal className="w-3.5 h-3.5 text-[#00E599]" />
            <span>Real-Time Execution</span>
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
                <div className="w-8 h-8 rounded-xl bg-[#00E599]/10 text-[#00E599] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#00E599]/20">
                  <FiCpu className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm font-sans leading-relaxed ${
                  isUser
                    ? 'bg-[#2E68FF] text-white rounded-tr-none'
                    : 'bg-[#161C2B] text-neutral-200 rounded-tl-none border border-[#21293D]'
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
            <div className="w-8 h-8 rounded-xl bg-[#00E599]/10 text-[#00E599] flex items-center justify-center flex-shrink-0 border border-[#00E599]/20">
              <FiCpu className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#161C2B] border border-[#21293D] text-sm font-mono text-neutral-300 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-ping" />
              <span>KUDEX AGENT synthesizing intent & solver routes...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-5 py-3 border-t border-[#21293D] bg-[#0E121B] flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-mono text-neutral-400 flex-shrink-0 uppercase">Suggested:</span>
        {QUICK_PROMPTS.map((qp) => {
          const Icon = qp.icon;
          return (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.label)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs text-neutral-300 hover:text-white hover:border-[#00E599] transition flex-shrink-0"
            >
              <Icon className="w-3.5 h-3.5 text-[#00E599]" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[#21293D] bg-[#0E121B] flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask KUDEX AGENT to route quotes, simulate safety, or protect vault assets..."
          className="flex-1 px-4 py-3 rounded-xl border border-[#21293D] bg-[#161C2B] text-sm focus:outline-none focus:ring-2 focus:ring-[#00E599]/40 text-neutral-100 placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00E599] hover:bg-[#00c985] disabled:opacity-50 text-[#06080D] text-sm font-semibold transition shadow-md shadow-[#00E599]/10"
        >
          <span>Send</span>
          <FiCornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
