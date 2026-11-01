import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  keccak256,
  parseUnits,
  toBytes,
  zeroAddress,
} from 'viem';
import { localChain } from './helpers-local-chain.mjs';
import {
  kudexVaultAbi,
  kudexRFQMarketAbi,
  kudexDaaSAdapterAbi,
  kudexPOTStakingAbi,
  kudexBusinessRegistryAbi,
  kudexInvoiceEscrowAbi,
} from '../src/lib/contracts/abis.ts';
import {
  indexLiveActivity,
  filterLiveActivityItems,
} from '../src/lib/hooks/useLiveActivity.ts';

test(
  'Deep Portaldot Primitives: Business Registry, 14-decimal POT Staking fee waiver, On-chain Invoice Escrow, 5-stage DaaS recovery, and Live On-Chain Activity Indexing',
  { timeout: 60_000 },
  async () => {
    const env = await localChain();
    try {
      const { client, wallet, accounts, wait, deploy } = env;
      const [deployer, maker, taker] = accounts;

      const walletMaker = createWalletClient({
        chain: client.chain,
        transport: http(client.chain.rpcUrls.default.http[0]),
        account: maker,
      });

      const walletTaker = createWalletClient({
        chain: client.chain,
        transport: http(client.chain.rpcUrls.default.http[0]),
        account: taker,
      });

      // 1. Deploy base tokens
      const pusd = await deploy('KudexTestToken');
      const wpot = await deploy('KudexTestToken');

      // 2. Deploy Portaldot ecosystem contracts
      const potStaking = await deploy('KudexPOTStaking', [pusd]);
      const businessRegistry = await deploy('KudexBusinessRegistry');
      const vault = await deploy('KudexVault', [
        pusd,
        'Treasury Liquidity Vault',
        'kUSDC',
        zeroAddress,
      ]);
      const rfqMarket = await deploy('KudexRFQMarket');
      const invoiceEscrow = await deploy('KudexInvoiceEscrow', [
        vault,
        deployer,
        potStaking,
      ]);
      const daasAdapter = await deploy('KudexDaaSAdapter', [vault]);

      // Connect RFQ to POT Staking
      await wait(
        await wallet.writeContract({
          address: rfqMarket,
          abi: kudexRFQMarketAbi,
          functionName: 'setPotStaking',
          args: [potStaking, 1000n],
        }),
      );

      // Connect Vault default controller to DaaS adapter
      await wait(
        await wallet.writeContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'setDefaultController',
          args: [daasAdapter],
        }),
      );

      // Distribute pUSD tokens
      await wait(
        await wallet.writeContract({
          address: pusd,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [maker, 100_000n * 10n ** 6n],
        }),
      );
      await wait(
        await wallet.writeContract({
          address: pusd,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [taker, 100_000n * 10n ** 6n],
        }),
      );

      // =======================================================================
      // STEP A: Verified Business Registry
      // =======================================================================
      const regHash = keccak256(toBytes('REG-US-DE-884120'));
      const regTx = await wait(
        await walletMaker.writeContract({
          address: businessRegistry,
          abi: kudexBusinessRegistryAbi,
          functionName: 'registerBusiness',
          args: [
            'Apex Precision Logistics',
            'Logistics & Supply Chain',
            regHash,
            maker,
          ],
        }),
      );
      assert.ok(regTx.transactionHash);

      const [found, ownerAddr, profile] = await client.readContract({
        address: businessRegistry,
        abi: kudexBusinessRegistryAbi,
        functionName: 'tryResolveBusinessByName',
        args: ['apex precision logistics'],
      });
      assert.equal(found, true);
      assert.equal(ownerAddr.toLowerCase(), maker.toLowerCase());
      assert.equal(profile.businessName, 'Apex Precision Logistics');
      assert.equal(profile.payoutAddress.toLowerCase(), maker.toLowerCase());

      // =======================================================================
      // STEP B: 14-Decimal POT Staking & 0 bps Fee Waiver
      // =======================================================================
      const stakeUnits = 100n * 10n ** 14n; // 100 POT in 14-decimal base units
      const stakeTx = await wait(
        await walletMaker.writeContract({
          address: potStaking,
          abi: kudexPOTStakingAbi,
          functionName: 'stakePOT',
          value: stakeUnits,
        }),
      );
      assert.ok(stakeTx.transactionHash);

      const qualifiesMaker = await client.readContract({
        address: potStaking,
        abi: kudexPOTStakingAbi,
        functionName: 'qualifiesForFeeWaiver',
        args: [maker],
      });
      assert.equal(qualifiesMaker, true);

      const qualifiesTaker = await client.readContract({
        address: potStaking,
        abi: kudexPOTStakingAbi,
        functionName: 'qualifiesForFeeWaiver',
        args: [taker],
      });
      assert.equal(qualifiesTaker, false);

      const rfqFeeBps = await client.readContract({
        address: rfqMarket,
        abi: kudexRFQMarketAbi,
        functionName: 'effectiveFeeBps',
        args: [maker, taker],
      });
      assert.equal(rfqFeeBps, 0n); // Maker qualified for 0 bps fee waiver!

      const invoiceFeeWaiver = await client.readContract({
        address: invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'hasFeeWaiver',
        args: [maker, taker],
      });
      assert.equal(invoiceFeeWaiver, true);

      // =======================================================================
      // STEP C: On-Chain Invoice Escrow (Creation, Sign-Off, Settlement)
      // =======================================================================
      const invoiceAmt = 4_500n * 10n ** 6n; // 4,500 USDC
      const dueTimestamp = BigInt(Math.floor(Date.now() / 1000) + 14 * 86_400);
      const invoiceRef = keccak256(toBytes('INV-2026-OCT-001'));

      const createInvTx = await wait(
        await walletMaker.writeContract({
          address: invoiceEscrow,
          abi: kudexInvoiceEscrowAbi,
          functionName: 'createInvoice',
          args: [
            `0x${'0'.repeat(64)}`,
            taker,
            pusd,
            invoiceAmt,
            dueTimestamp,
            invoiceRef,
            [deployer], // deployer is the required CFO approver
          ],
        }),
      );
      assert.ok(createInvTx.transactionHash);

      const [invId] = await client.readContract({
        address: invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'getInvoicesForAccount',
        args: [maker],
      });
      assert.ok(invId);

      let fetchedInv = await client.readContract({
        address: invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'getInvoice',
        args: [invId],
      });
      assert.equal(Number(fetchedInv.status), 0); // Pending
      assert.equal(fetchedInv.amount, invoiceAmt);

      // Approver signs off
      await wait(
        await wallet.writeContract({
          address: invoiceEscrow,
          abi: kudexInvoiceEscrowAbi,
          functionName: 'approveInvoice',
          args: [invId],
        }),
      );

      fetchedInv = await client.readContract({
        address: invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'getInvoice',
        args: [invId],
      });
      assert.equal(Number(fetchedInv.status), 1); // Approved

      // Taker approves USDC and pays invoice
      await wait(
        await walletTaker.writeContract({
          address: pusd,
          abi: erc20Abi,
          functionName: 'approve',
          args: [invoiceEscrow, invoiceAmt],
        }),
      );

      const payInvTx = await wait(
        await walletTaker.writeContract({
          address: invoiceEscrow,
          abi: kudexInvoiceEscrowAbi,
          functionName: 'payInvoice',
          args: [invId],
        }),
      );
      assert.ok(payInvTx.transactionHash);

      fetchedInv = await client.readContract({
        address: invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'getInvoice',
        args: [invId],
      });
      assert.equal(Number(fetchedInv.status), 2); // Settled!

      // =======================================================================
      // STEP D: 5-Stage Default-as-a-Service (DaaS) Recovery
      // =======================================================================
      const reserveFundAmt = 15_000n * 10n ** 6n;
      await wait(
        await wallet.writeContract({
          address: pusd,
          abi: erc20Abi,
          functionName: 'approve',
          args: [daasAdapter, reserveFundAmt],
        }),
      );
      const fundReserveTx = await wait(
        await wallet.writeContract({
          address: daasAdapter,
          abi: kudexDaaSAdapterAbi,
          functionName: 'fundReserve',
          args: [pusd, reserveFundAmt],
        }),
      );
      assert.ok(fundReserveTx.transactionHash);

      // Set vault risk score to trigger DaaS lifecycle
      await wait(
        await wallet.writeContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'setRiskScore',
          args: [9500n],
        }),
      );

      // Advance through all 5 stages
      for (let s = 1; s <= 5; s++) {
        await wait(
          await wallet.writeContract({
            address: daasAdapter,
            abi: kudexDaaSAdapterAbi,
            functionName: 'advanceDaaSStage',
            args: [vault],
          }),
        );
      }

      const daasState = await client.readContract({
        address: daasAdapter,
        abi: kudexDaaSAdapterAbi,
        functionName: 'getDaaSRecoveryState',
        args: [vault],
      });
      assert.equal(Number(daasState.stage), 5); // RecoveryActive
      assert.equal(daasState.reserveCommitted, reserveFundAmt);

      // =======================================================================
      // STEP E: Live On-Chain Activity Indexer (Verification of Events)
      // =======================================================================
      const snapshot = await indexLiveActivity({
        client,
        contracts: {
          vault,
          rfqMarket,
          invoiceEscrow,
          daasAdapter,
          potStaking,
          businessRegistry,
          usdc: pusd,
        },
      });
      const items = snapshot.items;

      assert.ok(items.length >= 6, `Expected >= 6 indexed events, got ${items.length}`);

      // Check Business Registered item
      const bizItem = items.find((i) => i.title.includes('Verified Business Registered'));
      assert.ok(bizItem);
      assert.match(bizItem.title, /Apex Precision Logistics/);
      assert.equal(bizItem.filterGroup, 'payments');

      // Check POT Staked item (14 decimals formatted as 100.00 POT)
      const potItem = items.find((i) => i.title.includes('POT Locked'));
      assert.ok(potItem);
      assert.equal(potItem.formattedAmount, '100.00 POT');
      assert.equal(potItem.filterGroup, 'vaults');

      // Check Invoice Created item
      const invCreatedItem = items.find((i) => i.title.includes('On-Chain Invoice Created'));
      assert.ok(invCreatedItem);
      assert.match(invCreatedItem.formattedAmount, /4,500\.00/);
      assert.equal(invCreatedItem.filterGroup, 'invoices');

      // Check Invoice Approved item
      const invApprovedItem = items.find((i) => i.title.includes('Invoice Team Sign-Off'));
      assert.ok(invApprovedItem);

      // Check Invoice Settled item
      const invSettledItem = items.find((i) => i.title.includes('Business Invoice Paid On-Chain'));
      assert.ok(invSettledItem);

      // Check DaaS Stage Advanced items
      const daasItems = items.filter((i) => i.category === 'Payment Protection Reserve');
      assert.ok(daasItems.length >= 2);

      // Verify filtering
      const filteredAll = filterLiveActivityItems(items, 'all', 'all');
      assert.equal(filteredAll.length, items.length);

      const filteredInvoices = filterLiveActivityItems(items, 'all', 'invoices');
      assert.ok(filteredInvoices.every((i) => i.filterGroup === 'invoices'));
      assert.ok(filteredInvoices.length >= 3);

      const filteredMaker = filterLiveActivityItems(items, 'mine', 'all', maker);
      assert.ok(filteredMaker.length >= 3);
      assert.ok(filteredMaker.some((i) => i.title.includes('Verified Business Registered')));
      assert.ok(filteredMaker.some((i) => i.title.includes('POT Locked')));
    } finally {
      env.close();
    }
  },
);
