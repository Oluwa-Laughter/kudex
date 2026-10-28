import Link from 'next/link';
export interface RFQQuoteProps {
  quote: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    estimatedReceive: string;
    solver: string;
    estimatedGasPOT: string;
    routerAddress: `0x${string}`;
    maxSlippageBps?: number;
  };
  onExecuted?: (txHash: `0x${string}`) => void;
}
// AI-provided amounts and router addresses are untrusted. Never turn them into calldata.
export function RFQQuoteCard(_props: RFQQuoteProps) {
  return (
    <div className="panel space-y-3">
      <p>
        AI suggestions are not executable quotes. Import a complete signed offer and
        verify its exact terms in the RFQ workspace.
      </p>
      <Link className="quiet-link" href="/app/rfq">
        Review a signed RFQ offer
      </Link>
    </div>
  );
}
