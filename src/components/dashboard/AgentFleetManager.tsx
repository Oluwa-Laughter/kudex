'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { isAddress, parseAbiItem, zeroAddress } from 'viem';
import {
  FiCpu,
  FiShield,
  FiRepeat,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiActivity,
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
      const [deposits, rfqs] = await Promise.all([
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
          agent: 'Yield Optimizer Agent',
          action: 'Bounded Vault Deposit',
          volume: `${log.args.assets?.toString() ?? '0'} base units`,
          owner: log.args.owner ?? zeroAddress,
        })),
        ...rfqs.map((log) => ({
          txHash: log.transactionHash,
          block: log.blockNumber?.toString() ?? '0',
          agent: 'RFQ Solver Sentinel',
          action: 'Mandate Quote Execution',
          volume: `${log.args.paid?.toString() ?? '0'} -> ${log.args.received?.toString() ?? '0'} base`,
          owner: log.args.owner ?? zeroAddress,
        })),
      ].sort((a, b) => Number(b.block) - Number(a.block));
    },
  });

  const fleet = [
    {
      name: 'Yield Optimizer Agent',
      role: 'Pool Liquidity & Tranche Allocation',
      icon: FiCpu,
      whitelistedFn: 'KudexAgentExecutor.execute(policyId, assets)',
      configured: AGENT_EXECUTOR !== zeroAddress && CONTRACT_ADDRESSES.vault !== zeroAddress,
      targetTab: 'builder',
      cta: 'Configure Deposit Policy',
    },
    {
      name: 'RFQ Solver Sentinel',
      role: 'Bounded Peer-to-Solver Execution',
      icon: FiRepeat,
      whitelistedFn: 'KudexRfqExecutor.execute(id, order, signature)',
      configured:
        RFQ_EXECUTOR !== zeroAddress && CONTRACT_ADDRESSES.rfqMarket !== zeroAddress,
      targetTab: 'rfq',
      cta: 'Configure RFQ Mandate',
    },
    {
      name: 'Payroll Dispatcher',
      role: 'Confidential A2B Note Settlement',
      icon: FiSend,
      whitelistedFn: 'KudexVault.shieldDeposit(assets, commitment)',
      configured: CONTRACT_ADDRESSES.vault !== zeroAddress,
      targetTab: 'controls',
      cta: 'Manage Session Keys',
    },
  ];

  return (
    <div className="space-y-7">
      <section className="grid gap-5 lg:grid-cols-3">
        {fleet.map((agent) => (
          <article key={agent.name} className="panel flex flex-col justify-between space-y-5">
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
                      <span>Contract Ready</span>
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
                <p className="mt-1 text-sm text-muted-foreground">{agent.role}</p>
              </div>

              <div className="rounded-xl bg-secondary p-3">
                <span className="block text-sm text-muted-foreground">
                  Whitelisted Scope
                </span>
                <p className="mt-1 break-all font-mono text-sm text-foreground">
                  {agent.whitelistedFn}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab(agent.targetTab)}
                  className="action-link w-full text-sm"
                >
                  {agent.cta}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiShield className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold">Emergency Session Shutdown</h2>
          </div>
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('controls')}
              className="quiet-link text-sm text-destructive hover:text-destructive"
            >
              Open One-Click Revocation Controls
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every KUDEX AGENT operates strictly inside owner-signed session bounds (2h, 24h,
          or 7d expiry, per-trade and daily caps). Owners can revoke any active session
          key in a single transaction without waiting for delegate cooperation.
        </p>
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiActivity className="text-accent" aria-hidden="true" />
            <h2 className="text-xl font-bold">On-Chain Agent Action Log</h2>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            Latest 500 blocks
          </span>
        </div>

        {!actionLog.data || actionLog.data.length === 0 ? (
          <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            No automated delegate executions recorded in the recent 500-block window.
            Authorized policy deposits and RFQ mandate fills stream here automatically.
          </p>
        ) : (
          <div className="table-region rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {actionLog.data.map((row) => (
                  <tr key={row.txHash}>
                    <td className="px-4 py-3 font-semibold">{row.agent}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.action}</td>
                    <td className="px-4 py-3 font-mono text-primary tabular-nums">
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
