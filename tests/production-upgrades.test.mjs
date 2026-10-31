import test from 'node:test';
import assert from 'node:assert/strict';
import { erc20Abi, parseUnits, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localChain } from './helpers-local-chain.mjs';
import { kudexVaultAbi, kudexRFQMarketAbi, kudexDaaSAdapterAbi } from '../src/lib/contracts/abis.ts';
import {
  buildNoteSyncDomainMessage,
  createPrivateNoteMetadata,
  decryptNoteMetadata,
  deriveNoteEncryptionKey,
  encryptNoteMetadata,
  restorePrivateNotesFromNetwork,
} from '../src/lib/crypto/noteSync.ts';
import {
  MAX_BATCH_PAYROLL_ROWS,
  buildPrintablePaymentReceiptHtml,
  parsePayrollCsv,
} from '../src/lib/payroll/csvParser.ts';
import {
  buildAuditorPassSignatureMessage,
  decodeAuditorPass,
  encodeAuditorPass,
  formatQuickBooksXeroCsv,
  verifyAuditorPassOnChain,
} from '../src/lib/audit/auditorPass.ts';

test('Batch Payroll CSV parser validates rows, detects duplicate addresses, enforces 50-row cap, and builds receipts', () => {
  const validCsv = [
    'Recipient Name, Address, Amount, Reference',
    '"Northstar Logistics, LLC", 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, $1250.25, October Freight',
    'Meridian Cloud Systems, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 840.50, Hosting Retainer',
  ].join('\n');

  const parsed = parsePayrollCsv(validCsv, 6);
  assert.equal(parsed.hasErrors, false);
  assert.equal(parsed.duplicateCount, 0);
  assert.equal(parsed.validRows.length, 2);
  assert.equal(parsed.totalUnits, 2090750000n);
  assert.equal(parsed.totalFormatted, '2,090.75');
  assert.equal(parsed.rows[0].recipientName, 'Northstar Logistics, LLC');

  // Duplicate address detection
  const duplicateCsv = [
    'Recipient Name, Address, Amount, Reference',
    'Alice Payroll, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 500.00, Week 1',
    'Alice Duplicate, 0x70997970c51812dc3a010c7d01b50e0d17dc79c8, 500.00, Week 1 Dup',
  ].join('\n');
  const dupParsed = parsePayrollCsv(duplicateCsv, 6);
  assert.equal(dupParsed.hasErrors, true);
  assert.equal(dupParsed.duplicateCount, 1);
  assert.equal(dupParsed.rows[1].isDuplicateAddress, true);
  assert.equal(dupParsed.rows[1].duplicateOfRow, 1);

  // Over-50 batch limit check
  const manyRows = Array.from({ length: MAX_BATCH_PAYROLL_ROWS + 1 }, (_, i) => {
    const addr = `0x${(i + 1).toString(16).padStart(40, '0')}`;
    return `Vendor ${i + 1}, ${addr}, 10.00, Batch Item`;
  }).join('\n');
  const overMax = parsePayrollCsv(manyRows, 6);
  assert.equal(overMax.exceedsMaxBatch, true);
  assert.equal(overMax.hasErrors, true);

  // Printable HTML receipt check
  const receiptHtml = buildPrintablePaymentReceiptHtml({
    receiptId: '0xabc123',
    kind: 'Private Payment (Stealth Mode)',
    payerLabel: '0xf39F...2266',
    recipientLabel: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    amountLabel: '1,250.25 USDC',
    reference: 'October Freight',
    timestampIso: '2026-10-31T16:00:00.000Z',
    transactionHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    commitment: '0x2222222222222222222222222222222222222222222222222222222222222222',
    verificationUrl: 'https://kudex.app/verify?pass=kudex_pass_v1.test',
  });
  assert.match(receiptHtml, /Verified Kudex Settlement Receipt/);
  assert.match(receiptHtml, /1,250\.25 USDC/);
  assert.match(receiptHtml, /https:\/\/kudex\.app\/verify\?pass=kudex_pass_v1\.test/);
});

test(
  'Encrypted note sync, batch payroll on-chain settlement, wallet-less auditor portal verification, and 80/20 RFQ yield routing',
  { timeout: 45_000 },
  async () => {
    const env = await localChain();
    try {
      const { client, wallet, accounts, wait, deploy } = env;
      const owner = accounts[0];
      const recipientA = accounts[1];
      const recipientB = accounts[2];

      const usdc = await deploy('KudexTestToken');
      const wpot = await deploy('KudexTestToken');
      const vault = await deploy('KudexVault', [
        usdc,
        'Short-Term Treasury Vault',
        'kUSDC',
        zeroAddress,
      ]);
      const adapter = await deploy('KudexDaaSAdapter', [vault]);
      const market = await deploy('KudexRFQMarket');

      // Configure default controller and 80/20 protocol fee routing
      await wait(
        await wallet.writeContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'setDefaultController',
          args: [adapter],
        }),
      );
      await wait(
        await wallet.writeContract({
          address: market,
          abi: kudexRFQMarketAbi,
          functionName: 'setFeeRouting',
          args: [vault, adapter],
        }),
      );

      // 1. Wallet-derived AES-256-GCM key + encrypted note sync
      const domainMsg = buildNoteSyncDomainMessage(owner);
      const sig1 = await wallet.signMessage({ account: owner, message: domainMsg });
      const sig2 = await wallet.signMessage({ account: owner, message: domainMsg });
      assert.equal(sig1, sig2);

      const aesKey = await deriveNoteEncryptionKey(sig1);
      const singleNote = await createPrivateNoteMetadata({
        owner,
        recipient: recipientA,
        value: '250.50',
        decimals: 6,
        assetSymbol: 'USDC',
        memo: 'Supplier Retainer',
      });
      const encryptedSingle = await encryptNoteMetadata(aesKey, singleNote);
      const decryptedSingle = await decryptNoteMetadata(aesKey, encryptedSingle);
      assert.deepEqual(decryptedSingle, singleNote);

      // Approve vault and submit 4-arg shieldDeposit + 2-item batchShieldDeposit
      const totalApprove = parseUnits('5000', 6);
      await wait(
        await wallet.writeContract({
          address: usdc,
          abi: erc20Abi,
          functionName: 'approve',
          args: [vault, totalApprove],
        }),
      );

      const singleTx = await wallet.writeContract({
        address: vault,
        abi: kudexVaultAbi,
        functionName: 'shieldDeposit',
        args: [
          BigInt(singleNote.valueUnits),
          singleNote.commitment,
          recipientA,
          encryptedSingle,
        ],
      });
      await wait(singleTx);

      const batchNote1 = await createPrivateNoteMetadata({
        owner,
        recipient: recipientA,
        value: '400.00',
        decimals: 6,
        assetSymbol: 'USDC',
        memo: 'Batch Salary 1',
      });
      const batchNote2 = await createPrivateNoteMetadata({
        owner,
        recipient: recipientB,
        value: '600.00',
        decimals: 6,
        assetSymbol: 'USDC',
        memo: 'Batch Salary 2',
      });

      const batchTx = await wallet.writeContract({
        address: vault,
        abi: kudexVaultAbi,
        functionName: 'batchShieldDeposit',
        args: [
          [
            {
              assets: BigInt(batchNote1.valueUnits),
              commitment: batchNote1.commitment,
              receiver: recipientA,
              encryptedMemo: await encryptNoteMetadata(aesKey, batchNote1),
            },
            {
              assets: BigInt(batchNote2.valueUnits),
              commitment: batchNote2.commitment,
              receiver: recipientB,
              encryptedMemo: await encryptNoteMetadata(aesKey, batchNote2),
            },
          ],
        ],
      });
      await wait(batchTx);

      // Restore notes across devices using only public client + derived AES key
      const restored = await restorePrivateNotesFromNetwork({
        client,
        vaultAddress: vault,
        ownerAddress: owner,
        key: aesKey,
        fromBlock: 0n,
      });
      assert.equal(restored.notes.length, 3);
      assert.equal(restored.unspentUnits, parseUnits('1250.50', 6));
      assert.equal(restored.formattedBalance, '1,250.50');

      // 2. Wallet-Less Public Auditor Portal verification + QuickBooks/Xero CSV
      const issuedAt = '2026-10-31T16:30:00.000Z';
      const auditEntries = restored.notes.map((n) => ({
        date: n.createdAt,
        payee: n.recipient ?? n.owner,
        reference: n.memo ?? 'Payroll',
        amount: n.value,
        currency: 'USDC',
        commitment: n.commitment,
        nullifier: n.nullifierHash,
        txHash: n.transactionHash,
      }));
      const auditSig = await wallet.signMessage({
        account: owner,
        message: buildAuditorPassSignatureMessage({
          auditorName: 'Deloitte Digital Audit',
          scope: 'Full Audit Verification',
          issuedAt,
          entryCount: auditEntries.length,
        }),
      });
      const encodedPass = encodeAuditorPass({
        v: 1,
        organization: 'Kudex Manufacturing Corp',
        ownerAddress: owner,
        auditorName: 'Deloitte Digital Audit',
        auditorContact: 'audit@deloitte.example',
        scope: 'Full Audit Verification',
        vaultAddress: vault,
        chainId: 420420777,
        issuedAt,
        entries: auditEntries,
        issuerSignature: auditSig,
      });

      const decodedFromUrl = decodeAuditorPass(
        `https://kudex.app/verify?pass=${encodeURIComponent(encodedPass)}`,
      );
      const statement = await verifyAuditorPassOnChain(decodedFromUrl, client);
      assert.equal(statement.signatureValid, true);
      assert.equal(statement.vaultReachable, true);
      assert.equal(statement.verifiedCount, 3);
      assert.equal(statement.totalDisclosedAmount, 1250.5);
      assert.equal(statement.rows[0].verificationLabel, 'Verified On-Chain · Unspent');

      const qbCsv = formatQuickBooksXeroCsv(statement);
      assert.match(qbCsv, /\*Date,\*Amount,Currency,Payee/);
      assert.match(qbCsv, /Verified On-Chain · Unspent/);

      // 3. Real On-Chain Yield Distribution & 80/20 Fee Routing
      const rateBefore = await client.readContract({
        address: vault,
        abi: kudexVaultAbi,
        functionName: 'exchangeRatePerShare',
      });
      assert.equal(rateBefore, 1_000_000n);

      // Create an external maker key to sign an EIP-712 RFQ order
      const makerAccount = privateKeyToAccount(
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      );
      // Fund maker with wpot and approve market; owner is taker paying 100,000 USDC
      const tradeUsdc = parseUnits('100000', 6);
      const tradeWpot = parseUnits('50000', 6);
      await wait(
        await wallet.writeContract({
          address: wpot,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [makerAccount.address, tradeWpot],
        }),
      );

      // Fund owner with extra USDC if needed and approve market
      await wait(
        await wallet.writeContract({
          address: usdc,
          abi: erc20Abi,
          functionName: 'approve',
          args: [market, tradeUsdc],
        }),
      );

      const makerWallet = (await import('viem')).createWalletClient({
        account: makerAccount,
        chain: client.chain,
        transport: (await import('viem')).http(client.chain.rpcUrls.default.http[0]),
      });
      await wait(
        await makerWallet.writeContract({
          address: wpot,
          abi: erc20Abi,
          functionName: 'approve',
          args: [market, tradeWpot],
        }),
      );

      const latestBlock = await client.getBlock();
      const order = {
        maker: makerAccount.address,
        tokenIn: wpot,
        tokenOut: usdc,
        amountIn: tradeWpot,
        amountOut: tradeUsdc,
        deadline: latestBlock.timestamp + 3600n,
        nonce: 77n,
      };
      const orderSig = await makerAccount.signTypedData({
        domain: {
          name: 'KudexRFQMarket',
          version: '1',
          chainId: 420420777,
          verifyingContract: market,
        },
        types: {
          Order: [
            { name: 'maker', type: 'address' },
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOut', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
          ],
        },
        primaryType: 'Order',
        message: order,
      });

      await wait(
        await wallet.writeContract({
          address: market,
          abi: kudexRFQMarketAbi,
          functionName: 'fillOrder',
          args: [order, orderSig],
        }),
      );

      // 10 bps of 100,000 USDC = 100 USDC -> 80 USDC to Vault, 20 USDC to Reserve
      const [rateAfter, yieldDistributed, reserveBalance] = await Promise.all([
        client.readContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'exchangeRatePerShare',
        }),
        client.readContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'totalYieldDistributed',
        }),
        client.readContract({
          address: adapter,
          abi: kudexDaaSAdapterAbi,
          functionName: 'getReserveBalance',
          args: [usdc],
        }),
      ]);

      assert.equal(yieldDistributed, parseUnits('80', 6));
      assert.equal(reserveBalance, parseUnits('20', 6));
      assert.ok(
        rateAfter > rateBefore,
        `Expected share exchange rate (${rateAfter}) to exceed 1.0000 (${rateBefore})`,
      );
    } finally {
      env.close();
    }
  },
);
