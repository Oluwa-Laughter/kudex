import Link from 'next/link';
import { NetworkReadiness } from '@/components/dashboard/NetworkReadiness';
import { NativeAccountCard } from '@/components/dashboard/NativeAccountCard';
export default function Page() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">Developer infrastructure</h1>
        <p className="page-description">
          Inspect chain identity, deployment availability and native account boundaries.
          These observations are not deployment or settlement receipts.
        </p>
      </header>
      <NetworkReadiness />
      <NativeAccountCard />
      <Link className="quiet-link" href="/app/how-it-works">
        Protocol guide
      </Link>
      <Link className="quiet-link" href="/app/bridge">
        Bridge development status
      </Link>
    </div>
  );
}
