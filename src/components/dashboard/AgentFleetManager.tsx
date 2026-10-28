export function AgentFleetManager() {
  return (
    <section className="panel space-y-4">
      <h2 className="text-xl font-semibold">Automation service unavailable</h2>
      <p>
        No durable execution worker is configured. No autonomous deployments, trades, or
        profits are being reported.
      </p>
      <p className="text-sm text-muted-foreground">
        Use the policy builder and registry controls to authorize or revoke a deposit-only
        policy and submit a single deposit from its exact delegate wallet. Policy drafts
        grant no authority. Automated swaps, arbitrage, payroll, and credit rebalancing
        are not implemented.
      </p>
      <button className="quiet-link opacity-50" disabled>
        Activate automation unavailable
      </button>
    </section>
  );
}
