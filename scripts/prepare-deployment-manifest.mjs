// Offline review artifact only. Does not access a signer, RPC or broadcast endpoint.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { keccak256 } from 'viem';
const names = ['KudexVault','KudexRFQMarket','KudexDaaSAdapter','Groth16Verifier','KudexAgentExecutor','KudexPolicyRegistry'];
const artifacts = await Promise.all(names.map(async name => {
 const artifact = JSON.parse(await readFile(new URL(`../contracts/out/${name}.sol/${name}.json`,import.meta.url),'utf8'));
 const metadata = typeof artifact.metadata === 'string' ? JSON.parse(artifact.metadata) : artifact.metadata;
 if (!artifact.bytecode?.object || !metadata?.compiler?.version) throw Error(`Build ${name} before preparing a manifest.`);
 return {name,compiler:metadata.compiler.version,evmVersion:metadata.settings.evmVersion,optimizer:metadata.settings.optimizer,creationCodeHash:keccak256(artifact.bytecode.object),constructorInputs:artifact.abi.find(item=>item.type==='constructor')?.inputs??[]};
}));
const manifest = {
 status:'unsigned-review-only',chainId:420420777,broadcastAuthorized:false,
 signer:null,collateral:null,constructorArguments:null,deploymentAddresses:null,transactionEvidence:[],
 artifacts,
 requirements:[
  'Review the vault changes and collateral provenance; this is not an independent audit.',
  'Select an explicitly authorized funded signer and verify its actual signing model.',
  'Choose existing reviewed collateral or explicitly authorize unbacked KTEST deployment.',
  'Resolve exact constructor inputs, owner/controller identities, nonce and fee/storage funding.',
  'Recheck current runtime, simulate exact deployment, review final manifest and obtain broadcast authorization.',
  'Publish only to testnet, verify canonical finalized receipts and creation input, then import configuration.',
 ],
};
const directory = new URL('../contracts/deployments/',import.meta.url);
await mkdir(directory,{recursive:true});
await writeFile(new URL('420420777-unsigned-review.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.log('Unsigned review manifest written. Signer, collateral and constructor inputs remain unresolved. No RPC request or transaction was sent.');
