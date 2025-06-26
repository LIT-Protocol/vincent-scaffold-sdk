import { z } from "zod";

/**
 * Tool parameters schema - defines the input parameters for the tool
 */
export const toolParamsSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(280, "Message too long"),
  recipient: z.string().optional(),
});

/**
 * Precheck success result schema
 */
export const precheckSuccessSchema = z.object({
  messageValid: z.boolean(),
  recipientProvided: z.boolean(),
});

/**
 * Precheck failure result schema
 */
export const precheckFailSchema = z.object({
  error: z.string(),
});

/**
 * Execute success result schema
 */
export const executeSuccessSchema = z.object({
  greeting: z.string(),
  timestamp: z.number(),
  messageLength: z.number(),
  policyCommitResult: z.string().optional(),
});

/**
 * Execute failure result schema
 */
export const executeFailSchema = z.object({
  error: z.string(),
});

// Type exports
export type ToolParams = z.infer<typeof toolParamsSchema>;
export type PrecheckSuccess = z.infer<typeof precheckSuccessSchema>;
export type PrecheckFail = z.infer<typeof precheckFailSchema>;
export type ExecuteSuccess = z.infer<typeof executeSuccessSchema>;
export type ExecuteFail = z.infer<typeof executeFailSchema>;
