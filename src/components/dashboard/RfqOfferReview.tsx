'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { decodeEventLog, erc20Abi, formatUnits, zeroAddress, type Hex } from 'viem';
import { FiDownload } from 'react-icons/fi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { kudexRFQMarketAbi } from '@/lib/contracts/abis';
import { parseSignedOffer } from '@/lib/contracts/orders';
import { inspectSignedOffer, type RfqInspection } from '@/lib/contracts/rfq-client';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { getReadableErrorMessage } from '@/lib/utils';

function offerStatus(data: RfqInspection) {
  if (data.settled) return 'Filled';
  if (data.cancelled) return 'Cancelled';
  if (data.used) return 'Nonce already used';
  if (data.expired) return 'Expired';
  if (!data.signatureValid) return 'Invalid signature';
  return 'Open signed offer';
}

export function RfqOfferReview({
  raw,
  onChange,
  onBusyChange,
}: {
  raw: string;
  onChange: (raw: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [review, setReview] = useState<{ raw: string; data: RfqInspection }>();
  const [busy, setBusy] = useState(false);
  function updateBusy(value: boolean) {
    setBusy(value);
    onBusyChange(value);
  }
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [hash, setHash] = useState<Hex>();
  const router = CONTRACT_ADDRESSES.rfqMarket;
  const signingReady = Boolean(
    address && chainId === portaldotTestnet.id && router !== zeroAddress,
  );
  // A newly signed/imported document must receive its own fresh review.
  const current = review && raw === review.raw ? review.data : undefined;
  const maker = Boolean(
    address &&
    current &&
    address.toLowerCase() === current.offer.order.maker.toLowerCase(),
  );
  const currentAccount = Boolean(
    address && current?.taker?.toLowerCase() === address.toLowerCase(),
  );

  async function inspect() {
    updateBusy(true);
    setError('');
    setReview(undefined);
    setStatus('Reading signed terms and current settlement state…');
    try {
      if (!client) throw new Error('The read client is unavailable. Try again.');
      const offer = parseSignedOffer(raw, portaldotTestnet.id, router);
      const data = await inspectSignedOffer(client, offer, address);
      setReview({ raw, data });
      setStatus('Review the exact amounts, token addresses, and permissions below.');
    } catch (cause) {
      setStatus('');
      setError(getReadableErrorMessage(cause));
    } finally {
      updateBusy(false);
    }
  }

  async function transact(action: 'approve' | 'fill' | 'cancel' | 'clear') {
    updateBusy(true);
    setError('');
    setHash(undefined);
    setStatus('Refreshing offer state before wallet review…');
    try {
      if (!client || !address || !current || !signingReady || !currentAccount)
        throw new Error(
          'Connect the signing wallet on the configured network and review the offer again.',
        );
      const fresh = await inspectSignedOffer(client, current.offer, address);
      const isMaker = address.toLowerCase() === fresh.offer.order.maker.toLowerCase();
      if (
        fresh.offered.decimals !== current.offered.decimals ||
        fresh.requested.decimals !== current.requested.decimals ||
        fresh.offered.symbol !== current.offered.symbol ||
        fresh.requested.symbol !== current.requested.symbol
      )
        throw new Error('Token metadata changed. Review the offer again before signing.');
      setReview({ raw, data: fresh });
      const wait = async (tx: Hex) => {
        setHash(tx);
        setStatus('Transaction submitted. Waiting for a successful receipt…');
        const receipt = await client.waitForTransactionReceipt({ hash: tx });
        if (receipt.status !== 'success')
          throw new Error('The transaction reverted. No settlement is being reported.');
        return receipt;
      };
      if (action === 'approve' || action === 'clear') {
        const token = isMaker ? fresh.offered : fresh.requested;
        const amount =
          action === 'clear'
            ? 0n
            : isMaker
              ? fresh.offer.order.amountIn
              : fresh.offer.order.amountOut;
        if (action === 'approve' && !fresh.active)
          throw new Error(
            'This offer can no longer be filled. No approval was submitted.',
          );
        if (action === 'approve' && token.balance < amount)
          throw new Error('Your token balance is insufficient for this offer.');
        if (action === 'approve' && token.allowance >= amount)
          throw new Error('The existing allowance already covers this amount.');
        if (action === 'clear' && token.allowance === 0n)
          throw new Error('There is no allowance to remove.');
        for (const value of token.allowance > 0n && amount > 0n
          ? [0n, amount]
          : [amount]) {
          setStatus(
            value === 0n
              ? 'Review router allowance removal in your wallet.'
              : 'Review the exact token allowance in your wallet. This is separate from filling an offer.',
          );
          const simulation = await client.simulateContract({
            address: token.address,
            abi: erc20Abi,
            functionName: 'approve',
            args: [router, value],
            account: address,
          });
          await wait(
            await writeContractAsync({
              ...simulation.request,
              account: address,
              chainId: portaldotTestnet.id,
            }),
          );
        }
        setStatus(
          action === 'clear'
            ? 'Router allowance removal confirmed. Offer cancellation is separate.'
            : 'Token allowance confirmed. The offer has not been filled.',
        );
      } else if (action === 'cancel') {
        if (!isMaker) throw new Error('Only the maker can cancel this nonce.');
        if (fresh.used || fresh.cancelled || fresh.settled)
          throw new Error('This nonce is already consumed or cancelled.');
        const simulation = await client.simulateContract({
          address: router,
          abi: kudexRFQMarketAbi,
          functionName: 'cancelOrder',
          args: [fresh.offer.order.nonce],
          account: address,
        });
        setStatus(
          'Review nonce cancellation in your wallet. It invalidates every offer with this nonce.',
        );
        await wait(
          await writeContractAsync({
            ...simulation.request,
            account: address,
            chainId: portaldotTestnet.id,
          }),
        );
        setStatus('Nonce cancellation confirmed. Token allowance is unchanged.');
      } else {
        if (isMaker) throw new Error('Switch to the taker wallet to fill this offer.');
        if (!fresh.active)
          throw new Error(
            'The offer is expired, cancelled, consumed, or has an invalid signature.',
          );
        if (
          fresh.offered.balance < fresh.offer.order.amountIn ||
          fresh.offered.allowance < fresh.offer.order.amountIn
        )
          throw new Error(
            'The maker needs enough tokens and router allowance before this offer can be filled.',
          );
        if (
          fresh.requested.balance < fresh.offer.order.amountOut ||
          fresh.requested.allowance < fresh.offer.order.amountOut
        )
          throw new Error('Your payment balance or router allowance is insufficient.');
        const simulation = await client.simulateContract({
          address: router,
          abi: kudexRFQMarketAbi,
          functionName: 'fillOrder',
          args: [fresh.offer.order, fresh.offer.signature],
          account: address,
        });
        setStatus('Review the complete token exchange in your wallet.');
        const receipt = await wait(
          await writeContractAsync({
            ...simulation.request,
            account: address,
            chainId: portaldotTestnet.id,
          }),
        );
        const matched = receipt.logs.some((log) => {
          if (log.address.toLowerCase() !== router.toLowerCase()) return false;
          try {
            const event = decodeEventLog({
              abi: kudexRFQMarketAbi,
              data: log.data,
              topics: log.topics,
            });
            return (
              event.eventName === 'RFQSettled' &&
              event.args.orderHash.toLowerCase() === fresh.hash.toLowerCase() &&
              event.args.taker.toLowerCase() === address.toLowerCase() &&
              event.args.maker.toLowerCase() === fresh.offer.order.maker.toLowerCase()
            );
          } catch {
            return false;
          }
        });
        if (!matched)
          throw new Error(
            'The receipt succeeded but contained no matching settlement event. Inspect the transaction before attempting another fill.',
          );
        setStatus(
          'Offer filled. Both token transfers were confirmed in the matching settlement receipt.',
        );
      }
      try {
        setReview({ raw, data: await inspectSignedOffer(client, fresh.offer, address) });
      } catch {
        setReview(undefined);
        setStatus(
          (previous) =>
            previous +
            ' The state refresh failed; read the offer again to reload balances.',
        );
      }
    } catch (cause) {
      setStatus('');
      setError(getReadableErrorMessage(cause));
    } finally {
      updateBusy(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kudex-signed-offer.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="panel space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Review a signed offer</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Paste a Kudex export to check its network, router, maker signature, expiry,
            nonce, and token state before settlement.
          </p>
        </div>
        <label htmlFor="signed-offer" className="block font-medium">
          Signed offer JSON
        </label>
        <textarea
          id="signed-offer"
          spellCheck={false}
          autoComplete="off"
          rows={7}
          maxLength={12_000}
          value={raw}
          onChange={(event) => {
            onChange(event.target.value);
            setReview(undefined);
            setStatus('');
            setError('');
          }}
          disabled={busy}
          className="field-input resize-y font-mono text-sm"
          placeholder="Paste the complete signed offer export"
        />
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy || !raw.trim()}
            onClick={() => void inspect()}
            className="action-link disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Read and review offer'}
          </button>
          {raw && (
            <button disabled={busy} onClick={download} className="quiet-link">
              <FiDownload aria-hidden="true" /> Download offer JSON
            </button>
          )}
        </div>
      </section>
      {current && (
        <section aria-label="Signed offer terms" className="panel space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{offerStatus(current)}</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              Block {current.block.toString()} ·{' '}
              {new Date(current.observedAt).toLocaleTimeString()}
            </span>
          </div>
          <dl className="grid gap-6 md:grid-cols-2">
            {[
              {
                label: 'Taker receives / maker offers',
                amount: current.offer.order.amountIn,
                token: current.offered,
              },
              {
                label: 'Taker pays / maker requests',
                amount: current.offer.order.amountOut,
                token: current.requested,
              },
            ].map((side) => (
              <div key={side.label} className="rounded-xl bg-secondary p-5">
                <dt className="text-sm text-muted-foreground">{side.label}</dt>
                <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">
                  {formatUnits(side.amount, side.token.decimals)} {side.token.symbol}
                </dd>
                <dd className="mt-3 break-all text-sm text-muted-foreground">
                  {side.token.address}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-sm text-muted-foreground">Maker</dt>
              <dd className="mt-1 break-all">{current.offer.order.maker}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Expiry</dt>
              <dd className="mt-1 tabular-nums">
                {current.offer.order.deadline <= 8_640_000_000_000n
                  ? new Date(Number(current.offer.order.deadline) * 1000).toLocaleString()
                  : `Unix timestamp ${current.offer.order.deadline}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Router</dt>
              <dd className="mt-1 break-all text-sm">{current.offer.router}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Order hash</dt>
              <dd className="mt-1 break-all text-sm">{current.hash}</dd>
            </div>
          </dl>
          <div className="grid gap-5 border-t border-border pt-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Maker funding</h3>
              <p className="mt-2 break-words tabular-nums">
                Balance: {formatUnits(current.offered.balance, current.offered.decimals)}{' '}
                {current.offered.symbol}
              </p>
              <p className="mt-1 break-words tabular-nums">
                Router allowance:{' '}
                {formatUnits(current.offered.allowance, current.offered.decimals)}{' '}
                {current.offered.symbol}
              </p>
            </div>
            {current.taker && (
              <div>
                <h3 className="font-semibold">Reviewed payment account</h3>
                <p className="mt-2 break-all text-sm text-muted-foreground">
                  {current.taker}
                </p>
                <p className="mt-2 break-words tabular-nums">
                  Balance:{' '}
                  {formatUnits(current.requested.balance, current.requested.decimals)}{' '}
                  {current.requested.symbol}
                </p>
                <p className="mt-1 break-words tabular-nums">
                  Router allowance:{' '}
                  {formatUnits(current.requested.allowance, current.requested.decimals)}{' '}
                  {current.requested.symbol}
                </p>
              </div>
            )}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Allowances are shared across offers for this token and router; they do not
            reserve funds. Approval alone does not trade. Cancelling an offer does not
            remove allowance.
          </p>
          {(!signingReady || !currentAccount) && (
            <p className="text-sm leading-6 text-muted-foreground">
              Connect the relevant EVM signing account on this network, then read the
              offer again to enable wallet actions.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={
                busy ||
                !signingReady ||
                !currentAccount ||
                !current.active ||
                (maker
                  ? current.offered.allowance >= current.offer.order.amountIn
                  : current.requested.allowance >= current.offer.order.amountOut)
              }
              onClick={() => void transact('approve')}
              className="quiet-link disabled:opacity-50"
            >
              {maker ? 'Approve exact offered amount' : 'Approve exact payment'}
            </button>
            {!maker && (
              <button
                disabled={
                  busy ||
                  !signingReady ||
                  !currentAccount ||
                  !current.active ||
                  current.offered.balance < current.offer.order.amountIn ||
                  current.offered.allowance < current.offer.order.amountIn ||
                  current.requested.balance < current.offer.order.amountOut ||
                  current.requested.allowance < current.offer.order.amountOut
                }
                onClick={() => void transact('fill')}
                className="action-link disabled:opacity-50"
              >
                Fill complete offer in wallet
              </button>
            )}
            {maker && (
              <button
                disabled={
                  busy ||
                  !signingReady ||
                  !currentAccount ||
                  current.used ||
                  current.cancelled ||
                  current.settled
                }
                onClick={() => void transact('cancel')}
                className="quiet-link disabled:opacity-50"
              >
                Cancel this nonce in wallet
              </button>
            )}
            <button
              disabled={
                busy ||
                !signingReady ||
                !currentAccount ||
                (maker
                  ? current.offered.allowance === 0n
                  : current.requested.allowance === 0n)
              }
              onClick={() => void transact('clear')}
              className="quiet-link disabled:opacity-50"
            >
              Remove router allowance
            </button>
          </div>
        </section>
      )}
      <div className="space-y-3">
        {status && (
          <p role="status" className="leading-7">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {hash && <p className="break-all text-sm">Latest transaction: {hash}</p>}
      </div>
    </div>
  );
}
