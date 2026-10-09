'use client';

import React from 'react';
import Link from 'next/link';
import {
  FiBook,
  FiLock,
  FiActivity,
  FiLayers,
  FiKey,
  FiShield,
  FiCode,
  FiCheckCircle,
  FiTerminal,
  FiArrowRight,
  FiDollarSign,
  FiCpu,
} from 'react-icons/fi';

const LIFECYCLE_STEPS = [
  {
    step: '01',
    title: 'Asset Tokenization & Credit Structuring',
    icon: FiDollarSign,
    details:
      'Real-world debt claims—including supply-chain invoices, trade receivables, and equipment leasing—are structured into institutional credit pools. Overcollateralization ratios are maintained on-chain at 120% to 150% with continuous solvency surveillance.',
  },
  {
    step: '02',
    title: 'Client-Side Confidential Note Commitments',
    icon: FiLock,
    details:
      'Depositors generate cryptographic commitments and private nullifiers entirely within their browser. No plaintext balance or identity metadata touches the public mempool. On-chain verifiers validate mathematical solvency before minting or transferring custody.',
  },
  {
    step: '03',
    title: 'Default-as-a-Service (DaaS) Solvency Surveillance',
    icon: FiActivity,
    details:
      'Autonomous Sentinel bots continuously compute credit health factors using real-time risk scores. If debt position risk exceeds safe tolerances, the DaaS engine triggers algorithmic restructuring to absorb shortfalls through Junior tranches without sudden flash liquidations.',
  },
  {
    step: '04',
    title: 'Selective Disclosure & Auditor Viewing Keys',
    icon: FiKey,
    details:
      'Enterprises, payroll processors, and treasury desks can export selective viewing keys to regulators, tax authorities, or internal auditors. Auditors mathematically verify balance accuracy without exposing sensitive corporate payroll or counterparty trade secrets.',
  },
];

export default function EnterpriseDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Docs Header */}
      <div className="border-b border-[#21293D] pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00E599]/30 bg-[#00E599]/10 text-xs font-mono text-[#00E599] mb-4">
          <FiBook className="w-3.5 h-3.5" />
          <span>ENTERPRISE SPECIFICATION</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100 font-mono">
          Kudex Protocol Architecture
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
          The technical foundation of Kudex: autonomous confidential settlement, structured credit tranches,
          Default-as-a-Service (DaaS) solvency surveillance, and bounded agent session policies.
        </p>
      </div>

      {/* Section 1: End-to-End Asset Lifecycle */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2 font-mono">
            <FiLayers className="w-5 h-5 text-[#00E599]" />
            <span>1. End-to-End Confidential Settlement Lifecycle</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            How corporate funds flow from origin tokenization to private disbursement and auditor verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LIFECYCLE_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#00E599] px-2 py-0.5 rounded bg-[#00E599]/10 border border-[#00E599]/20">
                    PHASE {item.step}
                  </span>
                  <div className="p-2 rounded-lg bg-[#161C2B] text-neutral-300">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-neutral-100">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {item.details}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Mathematical Formulations */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2 font-mono">
            <FiTerminal className="w-5 h-5 text-[#2E68FF]" />
            <span>2. Invariant Math & Solvency Mechanics</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Deterministic on-chain formulas governing yield allocation, health factors, and precision.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#21293D] pb-2 text-neutral-400">
              <span className="font-bold text-neutral-200">Health Factor Formula</span>
              <span>DaaS Solvency</span>
            </div>
            <p className="text-neutral-300">
              HealthFactor = (TotalPoolCollateral &times; 10,000) &divide; (OutstandingDebt &times; RiskCeilingBps)
            </p>
            <p className="text-neutral-400 text-[11px] font-sans">
              Where RiskCeilingBps defaults to 8,500 bps (85%). If HealthFactor &lt; 1.15x, the DaaS hook
              initiates algorithmic debt haircut cascades across Junior tranches.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#21293D] pb-2 text-neutral-400">
              <span className="font-bold text-neutral-200">Confidential Note Commitment Invariant</span>
              <span>Zero-Leakage State</span>
            </div>
            <p className="text-neutral-300">
              CommitmentHash = PoseidonHash(Amount, SecretNullifier, RecipientPublicKey)
            </p>
            <p className="text-neutral-400 text-[11px] font-sans">
              Computed entirely in the user&apos;s client browser. The on-chain contract records only the resulting
              hash into the Merkle tree. Only holders of the secret nullifier can redeem or spend the note.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Viem Integration Example */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2 font-mono">
            <FiCode className="w-5 h-5 text-[#00E599]" />
            <span>3. Developer Integration (TypeScript / Viem)</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Example code for querying vault telemetry and executing confidential shield deposits:
          </p>
        </div>

        <div className="rounded-2xl border border-[#21293D] bg-[#06080D] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0E121B] border-b border-[#21293D] text-xs font-mono text-neutral-400">
            <span>integration.ts</span>
            <span className="text-[#00E599]">Strict BigInt / Viem</span>
          </div>
          <pre className="p-5 text-xs font-mono text-neutral-300 overflow-x-auto leading-relaxed">
{`import { createPublicClient, http, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';

// 1. Initialize public client
const client = createPublicClient({
  transport: http(process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP),
});

// 2. Query live vault telemetry
export async function getVaultSolvencyStatus() {
  const [totalAssets, riskScore, isDefaulted] = await Promise.all([
    client.readContract({
      address: CONTRACT_ADDRESSES.vault,
      abi: KUDEX_VAULT_ABI,
      functionName: 'totalAssets',
    }),
    client.readContract({
      address: CONTRACT_ADDRESSES.vault,
      abi: KUDEX_VAULT_ABI,
      functionName: 'riskScore',
    }),
    client.readContract({
      address: CONTRACT_ADDRESSES.vault,
      abi: KUDEX_VAULT_ABI,
      functionName: 'isDefaulted',
    }),
  ]);

  return {
    totalAssetsBigInt: totalAssets,
    riskScoreBps: Number(riskScore),
    isDefaulted,
  };
}`}
          </pre>
        </div>
      </section>

      {/* Section 4: Compliance & Auditor Viewing Keys */}
      <section className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-4">
        <div className="flex items-center gap-2 text-[#00E599] font-mono text-xs font-semibold uppercase">
          <FiShield className="w-4 h-4" />
          <span>Auditing & Regulatory Alignment</span>
        </div>
        <h3 className="text-xl font-bold text-neutral-100">
          Selective Viewing Keys for Enterprise Compliance
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Public confidentiality does not prevent regulatory compliance. Kudex enables treasury operators
          to generate asymmetric viewing keys. These keys permit read-only decryption of specific transaction sets,
          allowing auditors, tax examiners, and accounting software to verify financial records without
          broadcasting payroll amounts or vendor relationships to the public internet.
        </p>
        <div className="pt-2 flex items-center gap-4">
          <Link
            href="/app/compliance"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00E599] text-[#06080D] font-bold text-xs hover:bg-[#00c985] transition"
          >
            <span>Open Compliance Workspace</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
