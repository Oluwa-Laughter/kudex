import Link from 'next/link';
import { NetworkReadiness } from '@/components/dashboard/NetworkReadiness';
import { NativeAccountCard } from '@/components/dashboard/NativeAccountCard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
export default function Page() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Portaldot V3 Testnet</p>
        <h1 className="page-title">Your on-chain workspace</h1>
        <p className="page-description">
          Inspect actual accounts, deployment readiness, and bounded chain observations.
          Missing data remains unavailable.
        </p>
      </header>
      <NetworkReadiness />
      <NativeAccountCard />
      <VolumeChart />
      <div className="flex flex-wrap gap-4">
        <Link className="action-link" href="/app/vaults">
          Public vault
        </Link>
        <Link className="quiet-link" href="/app/rfq">
          Signed RFQ offers
        </Link>
        <Link className="quiet-link" href="/app/agents">
          Agent permissions
        </Link>
      </div>
    </div>
  );
}
