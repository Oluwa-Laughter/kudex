import test from 'node:test';
import assert from 'node:assert/strict';
import { erc20Abi, zeroAddress, keccak256 } from 'viem';
import { localChain } from './helpers-local-chain.mjs';
import {
  readVault,
  assertVaultProvenance,
  exactAmount,
  verifyVaultReceipt,
  receiptFinality,
} from '../src/lib/contracts/vault-client.ts';
import { kudexVaultAbi } from '../src/lib/contracts/abis.ts';
test(
  'compiled vault: exact approval, simulated deposit, event verification, shares and redemption',
  { timeout: 30000 },
  async () => {
    const env = await localChain();
    try {
      const { client, wallet, accounts, wait, deploy } = env;
      const owner = accounts[0];
      const asset = await deploy('KudexTestToken');
      const vault = await deploy('KudexVault', [
        asset,
        'Public vault',
        'KV',
        zeroAddress,
      ]);
      const codeHash = keccak256(await client.getBytecode({ address: vault }));
      const assetHash = keccak256(await client.getBytecode({ address: asset }));
      await assertVaultProvenance(client, vault, asset, codeHash, assetHash);
      await assert.rejects(assertVaultProvenance(client, vault, asset));
      await assert.rejects(
        assertVaultProvenance(client, vault, asset, assetHash, assetHash),
      );
      const initial = await readVault(client, vault, asset, owner);
      assert.equal(initial.shares, 0n);
      const amount = exactAmount('123.456789', initial.decimals);
      const deadline = initial.timestamp + 600n;
      // Failed simulation cannot produce a success before approval.
      await assert.rejects(
        client.simulateContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'depositWithMinimum',
          args: [amount, owner, amount, deadline],
          account: owner,
        }),
      );
      const approval = await client.simulateContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'approve',
        args: [vault, amount],
        account: owner,
      });
      await wait(await wallet.writeContract(approval.request));
      const approved = await readVault(client, vault, asset, owner);
      assert.equal(approved.allowance, amount);
      const simulation = await client.simulateContract({
        address: vault,
        abi: kudexVaultAbi,
        functionName: 'depositWithMinimum',
        args: [amount, owner, amount, deadline],
        account: owner,
      });
      const receipt = await wait(await wallet.writeContract(simulation.request));
      verifyVaultReceipt(receipt, vault, owner, 'deposit', amount, amount);
      assert.notEqual(await receiptFinality(client, receipt), 'unknown');
      const deposited = await readVault(client, vault, asset, owner);
      assert.equal(deposited.shares, amount);
      assert.equal(deposited.assets, amount);
      assert.equal(deposited.balance, initial.balance - amount);
      assert.equal(deposited.allowance, 0n);
      assert.equal(deposited.maxRedeem, amount);
      const redeem = await client.simulateContract({
        address: vault,
        abi: kudexVaultAbi,
        functionName: 'redeemWithMinimum',
        args: [amount, owner, amount, deadline],
        account: owner,
      });
      const redemption = await wait(await wallet.writeContract(redeem.request));
      verifyVaultReceipt(redemption, vault, owner, 'redeem', amount, amount);
      const final = await readVault(client, vault, asset, owner);
      assert.equal(final.shares, 0n);
      assert.equal(final.balance, initial.balance);
      // Configuration mismatch fails closed, before a spending request.
      const otherAsset = await deploy('KudexTestToken');
      await assert.rejects(readVault(client, vault, otherAsset, owner), /does not match/);
    } finally {
      env.close();
    }
  },
);
