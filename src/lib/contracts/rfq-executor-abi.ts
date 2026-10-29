// Generated from the compiled KudexRfqExecutor artifact; checked by tests.
export const rfqExecutorAbi = [
  {
    type: 'function',
    name: 'MAX_DURATION',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createPolicy',
    inputs: [
      {
        name: 'terms',
        type: 'tuple',
        internalType: 'struct KudexRfqExecutor.Terms',
        components: [
          {
            name: 'delegate',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'maker',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'buyToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'payToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'expiresAt',
            type: 'uint64',
            internalType: 'uint64',
          },
          {
            name: 'minimumBuy',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'referencePay',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'perActionCap',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dailyCap',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'totalCap',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'id',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'execute',
    inputs: [
      {
        name: 'id',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'order',
        type: 'tuple',
        internalType: 'struct KudexRFQMarket.Order',
        components: [
          {
            name: 'maker',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'tokenIn',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'tokenOut',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'amountIn',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        name: 'signature',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'nextPolicy',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'policy',
    inputs: [
      {
        name: 'id',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct KudexRfqExecutor.Policy',
        components: [
          {
            name: 'owner',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'revoked',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'terms',
            type: 'tuple',
            internalType: 'struct KudexRfqExecutor.Terms',
            components: [
              {
                name: 'delegate',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'maker',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'buyToken',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'payToken',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'expiresAt',
                type: 'uint64',
                internalType: 'uint64',
              },
              {
                name: 'minimumBuy',
                type: 'uint128',
                internalType: 'uint128',
              },
              {
                name: 'referencePay',
                type: 'uint128',
                internalType: 'uint128',
              },
              {
                name: 'perActionCap',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'dailyCap',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'totalCap',
                type: 'uint256',
                internalType: 'uint256',
              },
            ],
          },
          {
            name: 'spent',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'day',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'daySpent',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'revokePolicy',
    inputs: [
      {
        name: 'id',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'router',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract KudexRFQMarket',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'RfqExecuted',
    inputs: [
      {
        name: 'id',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'orderHash',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'paid',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'received',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RfqPolicyCreated',
    inputs: [
      {
        name: 'id',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'delegate',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RfqPolicyRevoked',
    inputs: [
      {
        name: 'id',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'Inactive',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InexactTransfer',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPolicy',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OutsidePolicy',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: [],
  },
] as const;
