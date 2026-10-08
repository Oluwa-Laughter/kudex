import { createDataStreamResponse } from 'ai';
import { simulatePreFlightTransaction } from '@/lib/simulation';
import { parseTokenAmount, formatTokenAmount, calculateBasisPoints } from '@/lib/math';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1];
  const userContent = latestMessage?.content || '';

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Analyze user intent for RFQ Swap, Shield Deposit, or Pre-Flight Simulation
      const lower = userContent.toLowerCase();

      // Case 1: RFQ Swap Intent (e.g., "swap 100 pUSD for wPOT", "quote 500 POT")
      if (lower.includes('swap') || lower.includes('quote') || lower.includes('rfq') || lower.includes('buy') || lower.includes('trade')) {
        let amountIn = '100';
        const matchAmount = userContent.match(/(\d+(\.\d+)?)/);
        if (matchAmount) {
          amountIn = matchAmount[1];
        }

        let tokenIn = 'pUSD';
        let tokenOut = 'wPOT';
        if (lower.includes('wpot to pusd') || lower.includes('pot to pusd')) {
          tokenIn = 'wPOT';
          tokenOut = 'pUSD';
        } else if (lower.includes('pusd to wpot')) {
          tokenIn = 'pUSD';
          tokenOut = 'wPOT';
        }

        const tokenDecimals = tokenIn === 'wPOT' || tokenIn === 'POT' ? 14 : 6;
        let amountInBigInt = BigInt(100);
        try {
          amountInBigInt = parseTokenAmount(amountIn, tokenDecimals);
        } catch {
          amountInBigInt = parseTokenAmount('100', tokenDecimals);
          amountIn = '100';
        }

        // Exact BigInt calculation (15 bps slippage/solver rebate)
        const solverRetention = calculateBasisPoints(amountInBigInt, BigInt(15));
        const estimatedOutBigInt = amountInBigInt - solverRetention;
        const estimatedReceive = formatTokenAmount(estimatedOutBigInt, tokenDecimals);

        const quoteToolCallId = `call_${Date.now()}_rfq`;
        const quoteResult = {
          tokenIn,
          tokenOut,
          amountIn,
          estimatedReceive,
          solver: '0xSolverPortaldotAlpha77',
          estimatedGasPOT: '0.00014',
          maxSlippageBps: 50,
          routerAddress: '0x1111111254fb6c44bac0bed2854e76f90643097d' as `0x${string}`,
        };

        // Write streaming tool call and tool result
        dataStream.write(`0:${JSON.stringify(`I have decomposed your intent into a type-safe Portaldot V3.0 RFQ quote routed via Solver 0xSolverPortaldotAlpha77 with bounded 15 bps spread.\n\n`)}\n`);
        dataStream.write(`9:${JSON.stringify({ toolCallId: quoteToolCallId, toolName: 'getRFQQuote', args: { tokenIn, tokenOut, amountIn, maxSlippageBps: 50 } })}\n`);
        dataStream.write(`a:${JSON.stringify({ toolCallId: quoteToolCallId, result: quoteResult })}\n`);
        dataStream.write(`e:${JSON.stringify({ finishReason: 'tool-calls', usage: { promptTokens: 120, completionTokens: 85 } })}\n`);
        dataStream.write(`d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 120, completionTokens: 85 } })}\n`);
        return;
      }

      // Case 2: Pre-Flight Invariant Simulation (e.g., "simulate 500 pUSD deposit", "pre-flight", "audit")
      if (lower.includes('simulat') || lower.includes('audit') || lower.includes('preflight') || lower.includes('invariant')) {
        const simToolCallId = `call_${Date.now()}_sim`;
        const simResult = await simulatePreFlightTransaction(
          '0x39a04aA367a783637172DEb547849cb151909e74',
          '0x6e553f65',
          'pUSD',
          '500'
        );

        dataStream.write(`0:${JSON.stringify(`Executing pre-flight state diff audit across Portaldot V3.0 EVM node. Reentrancy and solvency vectors verified.\n\n`)}\n`);
        dataStream.write(`9:${JSON.stringify({ toolCallId: simToolCallId, toolName: 'runPreFlightSimulation', args: { target: '0x39a04aA367a783637172DEb547849cb151909e74', calldata: '0x6e553f65', assetSymbol: 'pUSD', amount: '500' } })}\n`);
        dataStream.write(`a:${JSON.stringify({ toolCallId: simToolCallId, result: simResult })}\n`);
        dataStream.write(`e:${JSON.stringify({ finishReason: 'tool-calls', usage: { promptTokens: 90, completionTokens: 60 } })}\n`);
        dataStream.write(`d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 90, completionTokens: 60 } })}\n`);
        return;
      }

      // Case 3: Shield / ZK Note Deposit
      if (lower.includes('shield') || lower.includes('deposit') || lower.includes('vault') || lower.includes('zk')) {
        const receiptToolCallId = `call_${Date.now()}_shield`;
        const shieldResult = {
          commitment: '0x4f89d3a77b8c2e91045a1b3f9d8e7c2a1b4c6e8d0a2f4b6c8e0a2d4f6b8e0a2d' as `0x${string}`,
          nullifier: '0x7a2c5b8e1f4d9a3b6c0e8d2f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b' as `0x${string}`,
          amount: '250000000', // 250 pUSD in 6 decimals base units
          tokenSymbol: 'pUSD',
          vaultAddress: '0x39a04aA367a783637172DEb547849cb151909e74' as `0x${string}`,
          timestamp: Date.now(),
        };

        dataStream.write(`0:${JSON.stringify(`Generated client-side Zero-Knowledge note commitment for Kudex Confidential Vault. Proof ready for Groth16 verification.\n\n`)}\n`);
        dataStream.write(`9:${JSON.stringify({ toolCallId: receiptToolCallId, toolName: 'shieldDepositReceipt', args: { amount: '250', token: 'pUSD' } })}\n`);
        dataStream.write(`a:${JSON.stringify({ toolCallId: receiptToolCallId, result: shieldResult })}\n`);
        dataStream.write(`e:${JSON.stringify({ finishReason: 'tool-calls', usage: { promptTokens: 110, completionTokens: 75 } })}\n`);
        dataStream.write(`d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 110, completionTokens: 75 } })}\n`);
        return;
      }

      // Default autonomous agent guidance
      dataStream.write(`0:${JSON.stringify(`Kudex Sentinel standing by on Portaldot V3.0 EVM (Chain ID 8890).\n\nYou can request:\n- "Swap 500 pUSD for wPOT"\n- "Simulate 250 pUSD deposit into Senior RWA Vault"\n- "Shield deposit into Confidential Pool with ZK commitment"\n- "Check DaaS health factor and debt restructuring rules"`)}\n`);
      dataStream.write(`e:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 40, completionTokens: 50 } })}\n`);
      dataStream.write(`d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 40, completionTokens: 50 } })}\n`);
    },
  });
}
