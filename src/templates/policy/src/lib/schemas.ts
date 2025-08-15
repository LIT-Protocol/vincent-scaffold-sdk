import { z } from "zod";

/**
 * Ability parameters schema - matches the ability this policy works with
 */
export const abilityParamsSchema = z.object({
  to: z.string().min(1, "Recipient address cannot be empty"),
  amount: z.string().min(1, "Amount cannot be empty"),
});

/**
 * User parameters schema - policy configuration set by the user
 */
export const userParamsSchema = z.object({
  maxSends: z.number().min(1).max(100).default(2),
  timeWindowSeconds: z.number().min(1).max(604800).default(10), // Default to 10 seconds for testing
});

/**
 * Commit parameters schema - data passed to commit phase
 */
export const commitParamsSchema = z.object({
  currentCount: z.number(),
  maxSends: z.number(),
  remainingSends: z.number(),
  timeWindowSeconds: z.number(),
});

/**
 * Precheck allow result schema
 */
export const precheckAllowResultSchema = z.object({
  currentCount: z.number(),
  maxSends: z.number(),
  remainingSends: z.number(),
  timeWindowSeconds: z.number(),
});

/**
 * Precheck deny result schema
 */
export const precheckDenyResultSchema = z.object({
  reason: z.string(),
  currentCount: z.number(),
  maxSends: z.number(),
  secondsUntilReset: z.number(),
});

/**
 * Evaluate allow result schema
 */
export const evalAllowResultSchema = z.object({
  currentCount: z.number(),
  maxSends: z.number(),
  remainingSends: z.number(),
  timeWindowSeconds: z.number(),
});

/**
 * Evaluate deny result schema
 */
export const evalDenyResultSchema = z.object({
  reason: z.string(),
  currentCount: z.number(),
  maxSends: z.number(),
  secondsUntilReset: z.number(),
  timeWindowSeconds: z.number(),
});

/**
 * Commit allow result schema
 */
export const commitAllowResultSchema = z.object({
  recorded: z.boolean(),
  newCount: z.number(),
  remainingSends: z.number(),
});

/**
 * Commit deny result schema (though commit rarely denies)
 */
export const commitDenyResultSchema = z.object({
  reason: z.string(),
});

// Type exports
export type AbilityParams = z.infer<typeof abilityParamsSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type CommitParams = z.infer<typeof commitParamsSchema>;
export type PrecheckAllow = z.infer<typeof precheckAllowResultSchema>;
export type PrecheckDeny = z.infer<typeof precheckDenyResultSchema>;
export type EvalAllow = z.infer<typeof evalAllowResultSchema>;
export type EvalDeny = z.infer<typeof evalDenyResultSchema>;
export type CommitAllow = z.infer<typeof commitAllowResultSchema>;
export type CommitDeny = z.infer<typeof commitDenyResultSchema>;
