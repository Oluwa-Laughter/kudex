export const kudexVaultAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_underlyingAsset', type: 'address', internalType: 'contract IERC20' },
      { name: '_name', type: 'string', internalType: 'string' },
      { name: '_symbol', type: 'string', internalType: 'string' },
      { name: '_verifier', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'totalAssets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'riskScore',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isDefaulted',
    inputs: [],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'commitments',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nullifiers',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'shieldDeposit',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' },
      { name: 'commitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'receiver', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'confidentialTransfer',
    inputs: [
      { name: 'nullifier', type: 'bytes32', internalType: 'bytes32' },
      { name: 'newCommitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'a', type: 'uint256[2]', internalType: 'uint256[2]' },
      { name: 'b', type: 'uint256[2][2]', internalType: 'uint256[2][2]' },
      { name: 'c', type: 'uint256[2]', internalType: 'uint256[2]' },
      { name: 'publicInputs', type: 'uint256[2]', internalType: 'uint256[2]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setRiskScore',
    inputs: [{ name: '_newScore', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'triggerDefault',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'NoteShielded',
    inputs: [
      { name: 'commitment', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'assetAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'NoteSpent',
    inputs: [
      { name: 'nullifier', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newCommitment', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DefaultTriggered',
    inputs: [
      { name: 'remainingAssets', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

export const kudexRFQMarketAbi = [
  {
    type: 'function',
    name: 'hashOrder',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        internalType: 'struct KudexRFQMarket.Order',
        components: [
          { name: 'maker', type: 'address', internalType: 'address' },
          { name: 'tokenIn', type: 'address', internalType: 'address' },
          { name: 'tokenOut', type: 'address', internalType: 'address' },
          { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'fillOrder',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        internalType: 'struct KudexRFQMarket.Order',
        components: [
          { name: 'maker', type: 'address', internalType: 'address' },
          { name: 'tokenIn', type: 'address', internalType: 'address' },
          { name: 'tokenOut', type: 'address', internalType: 'address' },
          { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
        ],
      },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelOrder',
    inputs: [{ name: 'nonce', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'orderSettled',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'orderCancelled',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'RFQSettled',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'taker', type: 'address', indexed: true, internalType: 'address' },
      { name: 'maker', type: 'address', indexed: false, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OrderCancelled',
    inputs: [
      { name: 'maker', type: 'address', indexed: true, internalType: 'address' },
      { name: 'nonce', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

export const kudexDaaSAdapterAbi = [
  {
    type: 'function',
    name: 'calculateHealthFactor',
    inputs: [{ name: 'vault', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'healthFactorBps', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'evaluateAndEnforce',
    inputs: [{ name: 'vault', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getRegisteredVaultsCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'registeredVaults',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
] as const;
