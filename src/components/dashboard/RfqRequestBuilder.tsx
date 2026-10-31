'use client';

import { useState } from 'react';
import { useAccount, useSignTypedData, usePublicClient } from 'wagmi';
import { isAddress, zeroAddress, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import {
  requestDomain,
  requestTypes,
  serializeRequest,
  verifyRequest,
  quoteMatchesRequest,
  type SignedRequest,
} from '@/lib/contracts/requests';
import { parseSignedOffer } from '@/lib/contracts/orders';
import { getReadableErrorMessage } from '@/lib/utils';

export function RfqRequestBuilder({
  onBusyChange,
  quote,
  onInvitationVerified,
}: {
  onBusyChange: (v: boolean) => void;
  quote: string;
  onInvitationVerified?: (entry: {
    requester: string;
    solver: string;
    buyToken: string;
    payToken: string;
    minimumBuy: string;
    maximumPay: string;
    timestamp: string;
  }) => void;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signTypedDataAsync } = useSignTypedData();
  const [fields, setFields] = useState({
    solver: '',
    buyToken: '',
    payToken: '',
    minimumBuy: '',
    maximumPay: '',
  });
  const [raw, setRaw] = useState('');
  const [verified, setVerified] = useState<SignedRequest>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = CONTRACT_ADDRESSES.rfqMarket;

  async function run(sign: boolean) {
    setBusy(true);
    onBusyChange(true);
    setMessage('');
    setVerified(undefined);
    try {
      if (!client) throw Error('Network client unavailable.');
      if (router === zeroAddress)
        throw Error(
          'Swap settlement contract must be configured before signing or verifying a quote request.',
        );
      const now = (await client.getBlock()).timestamp;
      let value = raw;
      if (sign) {
        if (!address || chainId !== portaldotTestnet.id)
          throw Error('Connect your wallet on the active settlement network.');
        if (
          ![fields.solver, fields.buyToken, fields.payToken].every(
            (x) => isAddress(x) && x.toLowerCase() !== zeroAddress,
          )
        )
          throw Error('Enter valid non-zero token and counterparty addresses.');
        if (
          !/^[1-9]\d{0,77}$/.test(fields.minimumBuy) ||
          !/^[1-9]\d{0,77}$/.test(fields.maximumPay)
        )
          throw Error('Enter positive whole-number token units.');
        const words = crypto.getRandomValues(new Uint8Array(32));
        const nonce = BigInt(
          '0x' + Array.from(words, (x) => x.toString(16).padStart(2, '0')).join(''),
        );
        const request = {
          requester: address,
          solver: fields.solver as Address,
          buyToken: fields.buyToken as Address,
          payToken: fields.payToken as Address,
          minimumBuy: BigInt(fields.minimumBuy),
          maximumPay: BigInt(fields.maximumPay),
          deadline: now + 3600n,
          nonce,
        };
        if (
          request.minimumBuy >= 1n << 256n ||
          request.maximumPay >= 1n << 256n ||
          request.buyToken.toLowerCase() === request.payToken.toLowerCase() ||
          request.solver.toLowerCase() === address.toLowerCase()
        )
          throw Error('Invalid swap request terms.');
        const signature = await signTypedDataAsync({
          account: address,
          domain: requestDomain(chainId, router),
          types: requestTypes,
          primaryType: 'Request',
          message: request,
        });
        value = serializeRequest({ chainId, router, request, signature });
        setRaw(value);
      }
      const result = await verifyRequest(value, portaldotTestnet.id, router, now);
      setVerified(result);
      onInvitationVerified?.({
        requester: result.request.requester,
        solver: result.request.solver,
        buyToken: result.request.buyToken,
        payToken: result.request.payToken,
        minimumBuy: result.request.minimumBuy.toString(),
        maximumPay: result.request.maximumPay.toString(),
        timestamp: new Date().toISOString(),
      });
      if (quote && address) {
        const offer = parseSignedOffer(quote, portaldotTestnet.id, router);
        setMessage(
          quoteMatchesRequest(result, offer, address, now)
            ? 'Quote fits the signed invitation. Review its signature, funding, and on-chain status separately.'
            : 'Quote does not fit the signed invitation or requester account.',
        );
      } else {
        setMessage(
          'Invitation signature verified. Share with your counterparty to receive a firm swap offer.',
        );
      }
    } catch (e) {
      setMessage(getReadableErrorMessage(e));
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kudex-signed-request.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel space-y-6">
      <div>
        <h2 className="text-xl font-bold">Request a Custom Swap Quote</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Sign a guaranteed-price quote request specifying your counterparty, token pair,
          and exact minimum and maximum bounds. Valid for 1 hour.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries({
          solver: 'Counterparty address',
          buyToken: 'Requested asset address',
          payToken: 'Payment asset address',
          minimumBuy: 'Minimum receipt (token units)',
          maximumPay: 'Maximum payment (token units)',
        }).map(([key, label]) => (
          <label key={key} className="space-y-2 text-sm font-medium">
            <span>{label}</span>
            <input
              className="field-input font-semibold tabular-nums"
              value={fields[key as keyof typeof fields]}
              placeholder={key.includes('minimum') || key.includes('maximum') ? '1000000' : '0x…'}
              onChange={(e) => {
                setFields({ ...fields, [key]: e.target.value });
                setVerified(undefined);
              }}
              disabled={busy}
            />
          </label>
        ))}
      </div>

      <button
        className="action-link disabled:opacity-40"
        disabled={
          busy || !address || chainId !== portaldotTestnet.id || router === zeroAddress
        }
        onClick={() => void run(true)}
      >
        Sign request invitation
      </button>

      <div className="space-y-2">
        <label htmlFor="signed-request-json" className="text-sm font-medium">
          Signed request JSON
        </label>
        <textarea
          className="field-input min-h-36 font-mono text-sm"
          id="signed-request-json"
          maxLength={8000}
          value={raw}
          disabled={busy}
          placeholder="Signed quote request JSON appears here, or paste a request to verify"
          onChange={(e) => {
            setRaw(e.target.value);
            setVerified(undefined);
            setMessage('');
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="quiet-link text-sm"
          disabled={busy || !raw}
          onClick={() => void run(false)}
        >
          Verify invitation and compare quote
        </button>
        <button
          className="quiet-link text-sm"
          disabled={busy || !verified}
          onClick={download}
        >
          Download signed request
        </button>
      </div>

      {message && (
        <p role="status" className="break-words text-sm font-medium text-primary">
          {message}
        </p>
      )}
    </section>
  );
}
