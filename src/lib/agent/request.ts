import { z } from 'zod';
import { isAddress } from 'viem';
export const contextSchema = z
  .object({
    nativeAddress: z
      .string()
      .regex(/^5[1-9A-HJ-NP-Za-km-z]{46,48}$/)
      .optional(),
    evmAddress: z.string().refine(isAddress, 'Invalid EVM address').optional(),
  })
  .strict();
export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1500),
    mode: z.enum(['ask', 'network', 'account', 'vault']).default('ask'),
    context: contextSchema.default({}),
    history: z
      .array(
        z
          .object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) })
          .strict(),
      )
      .max(8)
      .default([]),
  })
  .strict();
export type ChatRequest = z.infer<typeof chatRequestSchema>;
