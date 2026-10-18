'use client';
import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { FiCpu, FiSliders, FiShield } from 'react-icons/fi';
import { AgentConsole } from './AgentConsole';
import { AgentPolicyBuilder } from './AgentPolicyBuilder';
import { AgentPolicyManager } from './AgentPolicyManager';
import { NativeAccountCard } from './NativeAccountCard';
const tabs = [
  { value: 'assistant', label: 'Live assistant', icon: FiCpu },
  { value: 'builder', label: 'Build a policy', icon: FiSliders },
  { value: 'controls', label: 'Policy controls', icon: FiShield },
];
export function AgentWorkspace() {
  const [createdId, setCreatedId] = useState<`0x${string}`>();
  return (
    <div className="space-y-8">
      <header className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">Kudex Agent</p>
          <h1 className="page-title">
            Capital workflows
            <br />
            under your control.
          </h1>
          <p className="page-description">
            Get product guidance, explore supported vault activity, and define what a
            delegate may do. Kudex Agent does not sign or execute transactions for you.
          </p>
        </div>
        <p className="max-w-xs border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
          Public vaults and signed settlement.
          <br />
          Bounded agent permissions.
          <br />
          Confidential credit in development.
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
