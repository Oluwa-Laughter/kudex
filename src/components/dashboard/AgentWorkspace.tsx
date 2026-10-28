'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { FiCpu, FiSliders, FiShield, FiActivity } from 'react-icons/fi';
import { AgentFleetManager } from './AgentFleetManager';
import { AgentConsole } from './AgentConsole';
import { AgentPolicyBuilder } from './AgentPolicyBuilder';
import { AgentPolicyManager } from './AgentPolicyManager';
import { NativeAccountCard } from './NativeAccountCard';

const tabs = [
  { value: 'fleet', label: 'Autonomous Fleet', icon: FiActivity },
  { value: 'assistant', label: 'AI Assistant', icon: FiCpu },
  { value: 'builder', label: 'Session Keys & Policies', icon: FiSliders },
  { value: 'controls', label: 'Policy Registry Controls', icon: FiShield },
];

export function AgentWorkspace() {
  const [createdId, setCreatedId] = useState<`0x${string}`>();

  return (
    <div className="space-y-8">
      <header className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">Kudex Autonomous Engine</p>
          <h1 className="page-title">
            Programmatic Agents
            <br />
            under your cryptographic control.
          </h1>
          <p className="page-description">
            Inspect verified observations with the assistant, prepare deposit-only
            policies, and manage permissions through the exact owner or delegate wallet.
          </p>
        </div>
        <p className="max-w-xs border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
          Deposit-only contract permissions.
          <br />
          Cryptographic Session Spend Ceilings.
          <br />
          Automation service awaiting implementation.
        </p>
      </header>

      <Tabs.Root defaultValue="assistant">
        <Tabs.List
          aria-label="Agent workspace"
          className="mb-7 flex flex-wrap gap-2 border-b border-border pb-4"
        >
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="relative flex min-h-12 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary"
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
          value="fleet"
          forceMount
          className="space-y-7 data-[state=inactive]:hidden"
        >
          <AgentFleetManager />
        </Tabs.Content>

        <Tabs.Content
          value="assistant"
          forceMount
          className="space-y-7 data-[state=inactive]:hidden"
        >
          <AgentConsole />
          <NativeAccountCard />
        </Tabs.Content>

        <Tabs.Content value="builder" forceMount className="data-[state=inactive]:hidden">
          <AgentPolicyBuilder onCreated={setCreatedId} />
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
