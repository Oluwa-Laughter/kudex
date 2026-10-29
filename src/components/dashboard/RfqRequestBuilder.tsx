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
}: {
  onBusyChange: (v: boolean) => void;
  quote: string;
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
          'Router deployment must be configured before signing or verifying an invitation.',
        );
      const now = (await client.getBlock()).timestamp;
      let value = raw;
      if (sign) {
        if (!address || chainId !== portaldotTestnet.id)
          throw Error('Connect the requester wallet on Portaldot V3.');
        if (
          ![fields.solver, fields.buyToken, fields.payToken].every(
            (x) => isAddress(x) && x.toLowerCase() !== zeroAddress,
          )
        )
          throw Error('Enter nonzero token and solver addresses.');
        if (
          !/^[1-9]\d{0,77}$/.test(fields.minimumBuy) ||
          !/^[1-9]\d{0,77}$/.test(fields.maximumPay)
        )
          throw Error('Enter positive integer token base units.');
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
        // Validate before asking for a signature. No transaction or token allowance follows.
        if (
          request.minimumBuy >= 1n << 256n ||
          request.maximumPay >= 1n << 256n ||
          request.buyToken.toLowerCase() === request.payToken.toLowerCase() ||
          request.solver.toLowerCase() === address.toLowerCase()
        )
          throw Error('Invalid request terms.');
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
      if (quote && address) {
        const offer = parseSignedOffer(quote, portaldotTestnet.id, router);
        setMessage(
          quoteMatchesRequest(result, offer, address, now)
            ? 'Quote fits the signed invitation. Review its signature, funding and on-chain status separately.'
            : 'Quote does not fit the signed invitation or requester account.',
        );
      } else
        setMessage(
          'Invitation signature verified. Not an accepted quote, active permission or settled trade.',
        );
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
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Request liquidity from a counterparty</h2>
      <p className="max-w-prose text-muted-foreground">
        An invitation names one solver and expires in one hour. Share the signed export
        through your own access-controlled channel. Nothing is published to a public feed.
        Amounts below are exact token base units; verify asset metadata before
        negotiating.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {Object.entries({
          solver: 'Counterparty solver address',
          buyToken: 'Requested asset address',
          payToken: 'Payment asset address',
          minimumBuy: 'Minimum receipt (base units)',
          maximumPay: 'Maximum payment (base units)',
        }).map(([key, label]) => (
          <label key={key} className="space-y-2 text-sm">
            <span>{label}</span>
            <input
              className="w-full rounded-xl border border-input p-3"
              value={fields[key as keyof typeof fields]}
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
        className="action-link"
        disabled={
          busy || !address || chainId !== portaldotTestnet.id || router === zeroAddress
        }
        onClick={() => void run(true)}
      >
        Sign request invitation
      </button>
      <div className="space-y-2">
        <label htmlFor="signed-request-json">Signed request JSON</label>
        <textarea
          className="min-h-40 w-full rounded-xl border border-input p-3 text-sm"
          id="signed-request-json"
          maxLength={8000}
          value={raw}
          disabled={busy}
          onChange={(e) => {
            setRaw(e.target.value);
            setVerified(undefined);
            setMessage('');
          }}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="quiet-link"
          disabled={busy || !raw}
          onClick={() => void run(false)}
        >
          Verify invitation and compare quote
        </button>
        <button className="quiet-link" disabled={busy || !verified} onClick={download}>
          Download signed request
        </button>
      </div>
      {message && (
        <p role="status" className="break-words">
          {message}
        </p>
      )}
      <p className="rounded-xl bg-secondary p-5 text-sm leading-6">
        Local invitation only. No hosted inbox, persistent cancellation service or solver
        qualification is active. Requests cannot revoke already shared quotes. The current
        router permits any holder of a quote signature to fill; an invitation does not
        enforce taker exclusivity or confidential on-chain settlement.
      </p>
    </section>
  );
}
