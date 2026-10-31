'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { isAddress, parseAbiItem, zeroAddress } from 'viem';
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiRepeat,
  FiSend,
  FiShield,
} from 'react-icons/fi';
import { AGENT_EXECUTOR } from '@/lib/agent/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { truncateAddress } from '@/lib/utils';

const rfqExecutorEnv = process.env.NEXT_PUBLIC_RFQ_EXECUTOR_ADDRESS;
const RFQ_EXECUTOR =
  rfqExecutorEnv && isAddress(rfqExecutorEnv) ? rfqExecutorEnv : zeroAddress;

const depositExecutedEvent = parseAbiItem(
  'event DepositExecuted(bytes32 indexed policyId, address indexed owner, address indexed vault, uint256 assets, uint256 shares)',
);
const rfqExecutedEvent = parseAbiItem(
  'event RfqExecuted(bytes32 indexed id, bytes32 indexed orderHash, address indexed owner, uint256 paid, uint256 received)',
);

export function AgentFleetManager({
  onSelectTab,
}: {
  onSelectTab?: (tab: string) => void;
}) {
  const client = usePublicClient({ chainId: portaldotTestnet.id });

  const actionLog = useQuery({
    queryKey: ['agent-action-log', AGENT_EXECUTOR, RFQ_EXECUTOR],
    enabled:
      Boolean(client) && (AGENT_EXECUTOR !== zeroAddress || RFQ_EXECUTOR !== zeroAddress),
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      if (!client) return [];
      const head = await client.getBlockNumber();
      const fromBlock = head > 499n ? head - 499n : 0n;
      const [deposits, swaps] = await Promise.all([
        AGENT_EXECUTOR !== zeroAddress
          ? client.getLogs({
              address: AGENT_EXECUTOR,
              event: depositExecutedEvent,
              fromBlock,
              toBlock: head,
            })
          : Promise.resolve([]),
        RFQ_EXECUTOR !== zeroAddress
          ? client.getLogs({
              address: RFQ_EXECUTOR,
              event: rfqExecutedEvent,
              fromBlock,
              toBlock: head,
            })
          : Promise.resolve([]),
      ]);

      return [
        ...deposits.map((log) => ({
          txHash: log.transactionHash,
          block: log.blockNumber?.toString() ?? '0',
          agent: 'Kudex Vault Auto-Pilot',
          action: 'Fixed-Yield Vault Deposit',
          volume: `${log.args.assets?.toString() ?? '0'} units`,
          owner: log.args.owner ?? zeroAddress,
        })),
        ...swaps.map((log) => ({
          txHash: log.transactionHash,
          block: log.blockNumber?.toString() ?? '0',
          agent: 'Kudex Swap Auto-Pilot',
          action: 'Best-Price Auto-Routing Swap',
          volume: `${log.args.paid?.toString() ?? '0'} → ${log.args.received?.toString() ?? '0'} units`,
          owner: log.args.owner ?? zeroAddress,
        })),
      ].sort((a, b) => Number(b.block) - Number(a.block));
    },
  });

  const capabilities = [
    {
      name: 'Vault Deposit Auto-Pilot',
      role: 'Fixed-Yield Business Vaults',
      icon: FiCpu,
      summary: 'Automatically moves idle cash into protected business vaults.',
      configured:
        AGENT_EXECUTOR !== zeroAddress && CONTRACT_ADDRESSES.vault !== zeroAddress,
      targetTab: 'builder',
      cta: 'Set Vault Spending Rule',
    },
    {
      name: 'Best-Price Swap Auto-Pilot',
      role: 'Best-Price Auto-Routing',
      icon: FiRepeat,
      summary: 'Executes zero-slippage swaps strictly inside your price and budget limits.',
      configured:
        RFQ_EXECUTOR !== zeroAddress && CONTRACT_ADDRESSES.rfqMarket !== zeroAddress,
      targetTab: 'swaps',
      cta: 'Set Swap Spending Rule',
    },
    {
      name: 'Private Payroll & Invoice Agent',
      role: 'Private Balances (Stealth Mode)',
      icon: FiSend,
      summary: 'Prepares private vendor and payroll transfers within approved caps.',
      configured: CONTRACT_ADDRESSES.vault !== zeroAddress,
      targetTab: 'controls',
      cta: 'Manage Active Rules',
    },
  ];

  return (
    <div className="space-y-7">
      <section className="grid gap-5 lg:grid-cols-3">
        {capabilities.map((agent) => (
          <article
            key={agent.name}
            className="panel flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <agent.icon size={20} aria-hidden="true" />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                    agent.configured
                      ? 'bg-primary/15 text-primary'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {agent.configured ? (
                    <>
                      <FiCheckCircle aria-hidden="true" />
                      <span>Active Contract</span>
                    </>
                  ) : (
                    <>
                      <FiClock aria-hidden="true" />
                      <span>Standby</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold">{agent.name}</h2>
                <p className="mt-1 text-sm font-medium text-primary">{agent.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {agent.summary}
                </p>
              </div>
            </div>

            {onSelectTab && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectTab(agent.targetTab)}
                  className="action-link w-full text-sm"
                >
                  {agent.cta}
                </button>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiShield className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold">Built-In Spending Limit Guarantees</h2>
          </div>
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('controls')}
              className="quiet-link text-sm text-destructive hover:text-destructive"
            >
              Open Revocation Controls
            </button>
          )}
        </div>
        <p className="text-base leading-relaxed text-muted-foreground">
          Give your Kudex Agent a budget and a time limit. It handles trades and payments
          in the background without asking you to click &apos;Approve&apos; on every step,
          and you can turn it off immediately at any moment.
        </p>
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiActivity className="text-accent" aria-hidden="true" />
            <h2 className="text-xl font-bold">On-Chain Auto-Pilot Activity Log</h2>
          </div>
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            Latest 500 blocks
          </span>
        </div>

        {!actionLog.data || actionLog.data.length === 0 ? (
          <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            No automated executions recorded in the recent 500-block window. Approved
            vault deposits and swaps appear here automatically.
          </p>
        ) : (
          <div className="table-region rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {actionLog.data.map((row) => (
                  <tr key={row.txHash}>
                    <td className="px-4 py-3 font-semibold">{row.agent}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.action}</td>
                    <td className="px-4 py-3 font-mono font-bold text-primary tabular-nums">
                      {row.volume}
                    </td>
                    <td className="px-4 py-3 font-mono">{truncateAddress(row.owner)}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">#{row.block}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
