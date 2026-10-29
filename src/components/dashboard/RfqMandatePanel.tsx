'use client';
import { useRef, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import {
  erc20Abi,
  isAddress,
  parseEventLogs,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import { rfqExecutorAbi } from '@/lib/contracts/rfq-executor-abi';
import { parseSignedOffer } from '@/lib/contracts/orders';
import { assertRfqProvenance } from '@/lib/contracts/rfq-execution';
import {
  CONTRACT_ADDRESSES,
  RFQ_CODE_HASH,
  RFQ_ASSET_PINS,
} from '@/lib/contracts/addresses';
import { receiptFinality } from '@/lib/contracts/vault-client';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { getReadableErrorMessage } from '@/lib/utils';
const executorValue = process.env.NEXT_PUBLIC_RFQ_EXECUTOR_ADDRESS;
const executor: Address =
  executorValue && isAddress(executorValue) ? executorValue : zeroAddress;
const executorHash = process.env.NEXT_PUBLIC_RFQ_EXECUTOR_CODE_HASH;
const fieldNames = {
  delegate: 'RFQ delegate',
  maker: 'Permitted maker',
  buyToken: 'Buy token',
  payToken: 'Pay token',
  minimumBuy: 'Minimum buy ratio units',
  referencePay: 'Reference payment ratio units',
  perActionCap: 'Per-trade payment cap',
  dailyCap: 'Daily payment cap',
  totalCap: 'Total payment budget',
};
type Fields = Record<keyof typeof fieldNames, string>;
export function RfqMandatePanel() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [fields, setFields] = useState<Fields>({
    delegate: '',
    maker: '',
    buyToken: '',
    payToken: '',
    minimumBuy: '',
    referencePay: '',
    perActionCap: '',
    dailyCap: '',
    totalCap: '',
  });
  const [id, setId] = useState('');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [observation, setObservation] = useState('');
  const lock = useRef(false);
  type Submitted = {
    hash: Hex;
    target: Address;
    event: 'RfqPolicyCreated' | 'RfqPolicyRevoked' | 'RfqExecuted' | 'Approval';
    policyId?: Hex;
    amount?: bigint;
    orderHash?: Hex;
    owner: Address;
    beneficiary?: Address;
    paid?: bigint;
    received?: bigint;
  };
  const pending = useRef<Submitted | undefined>(undefined);
  const [submitted, setSubmitted] = useState<Hex>();
  const ready = !!address && chainId === portaldotTestnet.id && executor !== zeroAddress;
  async function reconcile() {
    const e = pending.current;
    if (!client || !e)
      throw Error('No submitted operation to reconcile in this session.');
    const receipt = await client.waitForTransactionReceipt({ hash: e.hash });
    if (
      receipt.status !== 'success' ||
      receipt.transactionHash !== e.hash ||
      receipt.to?.toLowerCase() !== e.target.toLowerCase() ||
      receipt.from.toLowerCase() !== e.owner.toLowerCase()
    )
      throw Error('Receipt identity/status mismatch; inspect before retrying.');
    const logs = receipt.logs.filter(
      (l) => l.address.toLowerCase() === e.target.toLowerCase(),
    );
    if (e.event === 'Approval') {
      if (
        !parseEventLogs({ abi: erc20Abi, eventName: 'Approval', logs }).some(
          ({ args }) =>
            args.owner.toLowerCase() === e.owner.toLowerCase() &&
            args.spender.toLowerCase() === executor.toLowerCase() &&
            args.value === e.amount,
        )
      )
        throw Error('Matching allowance event missing.');
    } else {
      const events = parseEventLogs({ abi: rfqExecutorAbi, logs });
      const match = events.find(
        (event) =>
          event.eventName === e.event &&
          'id' in event.args &&
          (!e.policyId || event.args.id === e.policyId) &&
          (!e.orderHash ||
            ('orderHash' in event.args && event.args.orderHash === e.orderHash)),
      );
      if (!match) throw Error('Matching mandate event missing.');
      if (
        match.eventName === 'RfqExecuted' &&
        (match.args.owner.toLowerCase() !== e.beneficiary?.toLowerCase() ||
          match.args.paid !== e.paid ||
          match.args.received !== e.received)
      )
        throw Error('RFQ execution terms or beneficiary mismatch.');
      if (match.eventName === 'RfqPolicyCreated') {
        if (match.args.owner.toLowerCase() !== e.owner.toLowerCase())
          throw Error('Policy owner mismatch.');
        setId(match.args.id);
      }
    }
    const finality = await receiptFinality(client, receipt);
    if (finality === 'unknown')
      throw Error('Noncanonical receipt; requires reconciliation.');
    pending.current = undefined;
    setSubmitted(undefined);
    setStatus(`${e.event} ${finality}. No hosted strategy was activated.`);
  }
  async function act(
    action: 'create' | 'read' | 'revoke' | 'approve' | 'clear' | 'execute' | 'reconcile',
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (action === 'reconcile') {
        await reconcile();
        return;
      }
      if (pending.current) throw Error('Reconcile the submitted operation first.');
      if (!client || !address || !ready)
        throw Error(
          'A reviewed RFQ executor deployment and the correct EVM wallet are required.',
        );
      await assertRfqProvenance(client, executor, executorHash, {}, []);
      if (
        (
          await client.readContract({
            address: executor,
            abi: rfqExecutorAbi,
            functionName: 'router',
          })
        ).toLowerCase() !== CONTRACT_ADDRESSES.rfqMarket.toLowerCase()
      )
        throw Error('Executor/router binding mismatch.');
      const block = await client.getBlock();
      const send = async (
        request: Parameters<typeof writeContractAsync>[0],
        event: Submitted['event'],
        target: Address,
        extra: Partial<Submitted> = {},
      ) => {
        setStatus('Review the exact operation in your wallet.');
        const hash = await writeContractAsync(request);
        pending.current = { hash, target, event, owner: address, ...extra };
        setSubmitted(hash);
        setStatus('Submitted; waiting for matching receipt.');
        await reconcile();
      };
      if (action === 'create') {
        for (const k of ['delegate', 'maker', 'buyToken', 'payToken'] as const)
          if (!isAddress(fields[k]) || fields[k].toLowerCase() === zeroAddress)
            throw Error('Enter valid nonzero addresses.');
        const number = (key: keyof Fields, max: bigint) => {
          if (!/^[1-9]\d{0,77}$/.test(fields[key]))
            throw Error('Caps and ratios use positive integer token base units.');
          const value = BigInt(fields[key]);
          if (value > max) throw Error('Policy amount exceeds supported bounds.');
          return value;
        };
        const terms = {
          delegate: fields.delegate as Address,
          maker: fields.maker as Address,
          buyToken: fields.buyToken as Address,
          payToken: fields.payToken as Address,
          expiresAt: block.timestamp + 86400n,
          minimumBuy: number('minimumBuy', (1n << 128n) - 1n),
          referencePay: number('referencePay', (1n << 128n) - 1n),
          perActionCap: number('perActionCap', (1n << 256n) - 1n),
          dailyCap: number('dailyCap', (1n << 256n) - 1n),
          totalCap: number('totalCap', (1n << 256n) - 1n),
        };
        await assertRfqProvenance(
          client,
          CONTRACT_ADDRESSES.rfqMarket,
          RFQ_CODE_HASH,
          RFQ_ASSET_PINS,
          [terms.buyToken, terms.payToken],
        );
        const sim = await client.simulateContract({
          address: executor,
          abi: rfqExecutorAbi,
          functionName: 'createPolicy',
          args: [terms],
          account: address,
        });
        await send(
          { ...sim.request, chainId: portaldotTestnet.id },
          'RfqPolicyCreated',
          executor,
          { policyId: sim.result },
        );
        return;
      }
      if (!/^0x[\da-f]{64}$/i.test(id))
        throw Error('Enter a real on-chain RFQ policy ID.');
      const policyId = id as Hex;
      const p = await client.readContract({
        address: executor,
        abi: rfqExecutorAbi,
        functionName: 'policy',
        args: [policyId],
        blockNumber: block.number,
      });
      if (p.owner === zeroAddress) throw Error('RFQ policy not found.');
      const daily = p.day === block.timestamp / 86400n ? p.daySpent : 0n;
      setObservation(
        `Owner ${p.owner}. Delegate ${p.terms.delegate}. Spent ${p.spent} of ${p.terms.totalCap}; today ${daily} of ${p.terms.dailyCap} payment base units. ${p.revoked ? 'Revoked' : block.timestamp >= p.terms.expiresAt ? 'Expired' : 'Active at observed block ' + block.number}.`,
      );
      if (action === 'read') return;
      if (action === 'revoke') {
        if (p.owner.toLowerCase() !== address.toLowerCase())
          throw Error('Only the policy owner may revoke.');
        const sim = await client.simulateContract({
          address: executor,
          abi: rfqExecutorAbi,
          functionName: 'revokePolicy',
          args: [policyId],
          account: address,
        });
        await send(
          { ...sim.request, chainId: portaldotTestnet.id },
          'RfqPolicyRevoked',
          executor,
          { policyId },
        );
        return;
      }
      if (action === 'approve' || action === 'clear') {
        if (p.owner.toLowerCase() !== address.toLowerCase())
          throw Error('Only the paying owner may change this allowance.');
        const allowance = await client.readContract({
          address: p.terms.payToken,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, executor],
        });
        if (action === 'approve' && (p.revoked || block.timestamp >= p.terms.expiresAt))
          throw Error('Cannot approve an inactive mandate.');
        if (action === 'approve' && allowance !== 0n)
          throw Error('Remove the existing allowance before granting a new budget.');
        const amount = action === 'clear' ? 0n : p.terms.totalCap - p.spent;
        if (action === 'approve')
          await assertRfqProvenance(
            client,
            CONTRACT_ADDRESSES.rfqMarket,
            RFQ_CODE_HASH,
            RFQ_ASSET_PINS,
            [p.terms.buyToken, p.terms.payToken],
          );
        const sim = await client.simulateContract({
          address: p.terms.payToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [executor, amount],
          account: address,
        });
        await send(
          { ...sim.request, chainId: portaldotTestnet.id },
          'Approval',
          p.terms.payToken,
          { amount },
        );
        return;
      }
      if (p.terms.delegate.toLowerCase() !== address.toLowerCase())
        throw Error('Connect the exact authorized delegate wallet.');
      const offer = parseSignedOffer(
        raw,
        portaldotTestnet.id,
        CONTRACT_ADDRESSES.rfqMarket,
      );
      await assertRfqProvenance(client, offer.router, RFQ_CODE_HASH, RFQ_ASSET_PINS, [
        offer.order.tokenIn,
        offer.order.tokenOut,
      ]);
      const sim = await client.simulateContract({
        address: executor,
        abi: rfqExecutorAbi,
        functionName: 'execute',
        args: [policyId, offer.order, offer.signature],
        account: address,
      });
      const { rfqHash } = await import('@/lib/contracts/orders');
      await send(
        { ...sim.request, chainId: portaldotTestnet.id },
        'RfqExecuted',
        executor,
        {
          policyId,
          orderHash: rfqHash(offer),
          beneficiary: p.owner,
          paid: offer.order.amountOut,
          received: offer.order.amountIn,
        },
      );
    } catch (e) {
      setError(getReadableErrorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="panel space-y-6">
      <h2 className="text-2xl font-semibold">RFQ trading mandates</h2>
      <p className="max-w-prose text-muted-foreground">
        A separate RFQ-only executor fixes the maker, pair, minimum exchange ratio and
        payment budgets. All amounts are token base units, never USD. New mandates expire
        in 24 hours. The original deposit-only executor cannot trade.
      </p>
      {executor === zeroAddress && (
        <p role="status">
          RFQ executor deployment unavailable. No trading mandate is active through this
          interface.
        </p>
      )}
      <fieldset disabled={busy || !ready} className="grid gap-4 md:grid-cols-2">
        {Object.entries(fieldNames).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="field-input mt-2"
              value={fields[key as keyof Fields]}
              onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            />
          </label>
        ))}
      </fieldset>
      <button
        disabled={busy || !ready || !!submitted}
        className="action-link"
        onClick={() => void act('create')}
      >
        Authorize RFQ mandate in wallet
      </button>
      <label className="block">
        On-chain RFQ policy ID
        <input
          className="field-input mt-2"
          disabled={busy || !!submitted}
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        {(['read', 'approve', 'clear', 'revoke'] as const).map((action) => (
          <button
            className="quiet-link"
            key={action}
            disabled={busy || !ready || !!submitted}
            onClick={() => void act(action)}
          >
            {
              {
                read: 'Read mandate',
                approve: 'Approve remaining RFQ budget',
                clear: 'Remove RFQ executor allowance',
                revoke: 'Revoke RFQ mandate',
              }[action]
            }
          </button>
        ))}
      </div>
      {observation && <p className="break-all text-sm">{observation}</p>}
      <label className="block">
        Delegate signed quote JSON
        <textarea
          className="field-input mt-2 min-h-32"
          maxLength={12000}
          disabled={busy || !!submitted}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
      </label>
      <button
        className="action-link"
        disabled={busy || !ready || !!submitted}
        onClick={() => void act('execute')}
      >
        Execute permitted quote as delegate
      </button>
      {submitted && (
        <div>
          <p className="break-all">Submitted: {submitted}</p>
          <button
            className="quiet-link"
            disabled={busy}
            onClick={() => void act('reconcile')}
          >
            Reconcile RFQ mandate transaction
          </button>
        </div>
      )}
      {status && <p role="status">{status}</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Manual, public testnet execution only. No hosted background signer, recurring
        strategy or cross-device journal is configured. Submitted references in this panel
        last only for this mounted session; inspect receipts before retrying after reload.
        Revocation stops further execution but token allowance must be removed separately.
        Delegated credentials remain sensitive.
      </p>
    </section>
  );
}
