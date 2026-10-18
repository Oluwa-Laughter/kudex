'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useSignTypedData } from 'wagmi';
import { formatUnits, isAddress, zeroAddress, type Address } from 'viem';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { kudexRFQMarketAbi } from '@/lib/contracts/abis';
import { assertDeployment } from '@/lib/contracts/readiness';
import { readRfqToken } from '@/lib/contracts/rfq-client';
import {
  parseRfqAmount,
  rfqDomain,
  rfqHash,
  rfqOrderTypes,
  serializeSignedOffer,
  type RfqOrder,
} from '@/lib/contracts/orders';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { getReadableErrorMessage } from '@/lib/utils';

const expiryOptions = [
  { value: '900', label: '15 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '24 hours' },
  { value: '604800', label: '7 days' },
];
type Token = Awaited<ReturnType<typeof readRfqToken>>;

export function RfqOfferBuilder({
  onSigned,
  onBusyChange,
}: {
  onSigned: (raw: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signTypedDataAsync } = useSignTypedData();
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [duration, setDuration] = useState('3600');
  const [busy, setBusy] = useState(false);
  function updateBusy(value: boolean) {
    setBusy(value);
    onBusyChange(value);
  }
  const [error, setError] = useState('');
  const [review, setReview] = useState<{
    order: RfqOrder;
    offered: Token;
    requested: Token;
  }>();
  const router = CONTRACT_ADDRESSES.rfqMarket;
  const ready = Boolean(
    address && chainId === portaldotTestnet.id && router !== zeroAddress,
  );

  async function prepare() {
    updateBusy(true);
    setError('');
    setReview(undefined);
    try {
      if (!client || !address || !ready)
        throw new Error(
          'Connect an EVM signing wallet on the configured network after router deployment.',
        );
      if (
        !isAddress(tokenIn) ||
        !isAddress(tokenOut) ||
        tokenIn.toLowerCase() === tokenOut.toLowerCase()
      )
        throw new Error('Enter two different token contract addresses.');
      await assertDeployment(client, [router, tokenIn, tokenOut]);
      const block = await client.getBlock();
      const [offered, requested] = await Promise.all([
        readRfqToken(client, tokenIn, address, router, block.number),
        readRfqToken(client, tokenOut, address, router, block.number),
      ]);
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const nonce = BigInt(
        '0x' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''),
      );
      const order: RfqOrder = {
        maker: address,
        tokenIn,
        tokenOut,
        amountIn: parseRfqAmount(amountIn, offered.decimals),
        amountOut: parseRfqAmount(amountOut, requested.decimals),
        nonce,
        deadline: block.timestamp + BigInt(duration),
      };
      setReview({ order, offered, requested });
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      updateBusy(false);
    }
  }

  async function sign() {
    updateBusy(true);
    setError('');
    try {
      if (
        !client ||
        !address ||
        !ready ||
        !review ||
        address.toLowerCase() !== review.order.maker.toLowerCase()
      )
        throw new Error('Reconnect the maker wallet and review the offer again.');
      await assertDeployment(client, [
        router,
        review.order.tokenIn,
        review.order.tokenOut,
      ]);
      const block = await client.getBlock();
      if (block.timestamp > review.order.deadline)
        throw new Error('The offer expired during review. Create a new offer.');
      const [hash, used, cancelled, offered, requested] = await Promise.all([
        client.readContract({
          address: router,
          abi: kudexRFQMarketAbi,
          functionName: 'hashOrder',
          args: [review.order],
          blockNumber: block.number,
        }),
        client.readContract({
          address: router,
          abi: kudexRFQMarketAbi,
          functionName: 'nonceUsed',
          args: [address, review.order.nonce],
          blockNumber: block.number,
        }),
        client.readContract({
          address: router,
          abi: kudexRFQMarketAbi,
          functionName: 'orderCancelled',
          args: [address, review.order.nonce],
          blockNumber: block.number,
        }),
        readRfqToken(client, review.order.tokenIn, address, router, block.number),
        readRfqToken(client, review.order.tokenOut, address, router, block.number),
      ]);
      if (
        used ||
        cancelled ||
        hash !== rfqHash({ chainId: portaldotTestnet.id, router, order: review.order })
      )
        throw new Error(
          'The router or nonce no longer matches this offer. Review a new offer.',
        );
      if (
        offered.decimals !== review.offered.decimals ||
        requested.decimals !== review.requested.decimals ||
        offered.symbol !== review.offered.symbol ||
        requested.symbol !== review.requested.symbol
      )
        throw new Error('Token metadata changed. Review the token amounts again.');
      const signature = await signTypedDataAsync({
        account: address,
        domain: rfqDomain(portaldotTestnet.id, router),
        types: rfqOrderTypes,
        primaryType: 'Order',
        message: review.order,
      });
      onSigned(
        serializeSignedOffer({
          chainId: portaldotTestnet.id,
          router,
          order: review.order,
          signature,
        }),
      );
      setReview(undefined);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      updateBusy(false);
    }
  }

  return (
    <section className="panel space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Create a signed offer</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Choose your own exchange terms. The signature authorizes a complete fill of
          those terms before expiry; it does not lock tokens or place an order in a public
          book.
        </p>
      </div>
      <fieldset disabled={busy} className="grid min-w-0 gap-5 md:grid-cols-2">
        {[
          {
            id: 'offer-token',
            label: 'Token you offer',
            value: tokenIn,
            set: setTokenIn,
            address: true,
          },
          {
            id: 'request-token',
            label: 'Token you request',
            value: tokenOut,
            set: setTokenOut,
            address: true,
          },
          {
            id: 'offer-amount',
            label: 'Amount you offer',
            value: amountIn,
            set: setAmountIn,
          },
          {
            id: 'request-amount',
            label: 'Amount you request',
            value: amountOut,
            set: setAmountOut,
          },
        ].map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="mb-2 block font-medium">
              {field.label}
            </label>
            <input
              id={field.id}
              value={field.value}
              onChange={(event) => {
                field.set(event.target.value);
                setReview(undefined);
              }}
              autoComplete="off"
              spellCheck={false}
              inputMode={field.address ? 'text' : 'decimal'}
              maxLength={field.address ? 42 : 300}
              placeholder={field.address ? 'Token contract address' : '0.00'}
              className="field-input tabular-nums"
            />
          </div>
        ))}
        <div>
          <p id="rfq-expiry-label" className="mb-2 font-medium">
            Offer expires after
          </p>
          <CustomSelect
            label="Offer expiry"
            disabled={busy}
            value={duration}
            options={expiryOptions}
            onChange={(value) => {
              setDuration(value);
              setReview(undefined);
            }}
          />
        </div>
      </fieldset>
      {!ready && (
        <p className="rounded-xl bg-secondary p-4 text-sm leading-6">
          Offer signing requires a configured router and an EVM wallet on the current
          testnet. Your native extension account does not supply an EVM signing key.
        </p>
      )}
      <button
        className="action-link disabled:opacity-50"
        disabled={busy || !ready}
        onClick={() => void prepare()}
      >
        {busy ? 'Working…' : 'Review offer terms'}
      </button>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {review && (
        <section
          aria-label="Maker offer review"
          className="space-y-5 rounded-xl border border-border bg-background p-5"
        >
          <h3 className="text-xl font-semibold">Review before signing</h3>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">You offer</dt>
              <dd className="mt-1 break-words text-xl tabular-nums">
                {formatUnits(review.order.amountIn, review.offered.decimals)}{' '}
                {review.offered.symbol}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">You request</dt>
              <dd className="mt-1 break-words text-xl tabular-nums">
                {formatUnits(review.order.amountOut, review.requested.decimals)}{' '}
                {review.requested.symbol}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Maker</dt>
              <dd className="mt-1 break-all text-sm">{review.order.maker}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Expires</dt>
              <dd className="mt-1 text-sm tabular-nums">
                {new Date(Number(review.order.deadline) * 1000).toLocaleString()}
              </dd>
            </div>
          </dl>
          <p className="text-sm leading-6 text-muted-foreground">
            Anyone holding the exported signature can fill this offer in full. Token
            allowances are separate and shared with other offers using this router.
            Cancelling the nonce on-chain invalidates every offer with that nonce.
          </p>
          {review.offered.balance < review.order.amountIn && (
            <p className="text-sm text-destructive">
              Your observed offered-token balance is insufficient. Signing does not fund
              the offer.
            </p>
          )}
          <button
            disabled={busy || !ready}
            className="action-link disabled:opacity-50"
            onClick={() => void sign()}
          >
            {busy ? 'Waiting for wallet…' : 'Sign exact terms in wallet'}
          </button>
        </section>
      )}
    </section>
  );
}
