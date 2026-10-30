'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { FiCpu, FiSliders, FiShield, FiActivity, FiRepeat } from 'react-icons/fi';
import { RfqMandatePanel } from './RfqMandatePanel';
import { AgentFleetManager } from './AgentFleetManager';
import { AgentConsole } from './AgentConsole';
import { AgentPolicyBuilder } from './AgentPolicyBuilder';
import { AgentPolicyManager } from './AgentPolicyManager';
import { NativeAccountCard } from './NativeAccountCard';

const tabs = [
  { value: 'assistant', label: 'KUDEX AGENT', icon: FiCpu },
  { value: 'fleet', label: 'Active Agents', icon: FiActivity },
  { value: 'builder', label: 'Session Keys & Policies', icon: FiSliders },
  { value: 'rfq', label: 'RFQ mandates', icon: FiRepeat },
  { value: 'controls', label: 'Revocation & Controls', icon: FiShield },
];

export function AgentWorkspace() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [createdId, setCreatedId] = useState<`0x${string}`>();

  return (
    <div className="space-y-8">
      <header className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">Autonomous Execution Infrastructure</p>
          <h1 className="page-title">KUDEX AGENT Fleet & Session Policies</h1>
          <p className="page-description">
            Delegate bounded treasury deposits and RFQ execution with strict time
            expirations, cumulative spend caps, and instant one-click revocation.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="block font-semibold text-primary">Cryptographic Guardrails</span>
          <span className="text-muted-foreground">
            Function-whitelisted · Instant owner kill-switch
          </span>
        </div>
      </header>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List
          aria-label="Agent workspace"
          className="mb-7 flex flex-wrap gap-2 border-b border-border pb-4"
        >
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="workspace-tab relative"
            >
              <tab.icon size={18} aria-hidden="true" />
              {tab.label}
              {tab.value === 'controls' && createdId && (
                <span
                  className="h-2 w-2 rounded-full bg-primary"
                  role="img"
                  aria-label="New policy created"
                />
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content
          value="assistant"
          forceMount
          className="space-y-7 data-[state=inactive]:hidden"
        >
          <AgentConsole />
          <NativeAccountCard />
        </Tabs.Content>

        <Tabs.Content
          value="fleet"
          forceMount
          className="space-y-7 data-[state=inactive]:hidden"
        >
          <AgentFleetManager onSelectTab={setActiveTab} />
        </Tabs.Content>

        <Tabs.Content value="builder" forceMount className="data-[state=inactive]:hidden">
          <AgentPolicyBuilder onCreated={setCreatedId} />
        </Tabs.Content>

        <Tabs.Content value="rfq" forceMount className="data-[state=inactive]:hidden">
          <RfqMandatePanel />
        </Tabs.Content>

        <Tabs.Content
          value="controls"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <AgentPolicyManager createdId={createdId} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
