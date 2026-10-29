import { VolumeChart } from '@/components/dashboard/VolumeChart';
export default function Page() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">Protocol activity</h1>
        <p className="page-description">
          Public, chain-derived recent observations. This feed is protocol-wide, not a
          private treasury ledger or a complete account history.
        </p>
      </header>
      <VolumeChart />
    </div>
  );
}
