# Vincent Scaffold SDK - GitHub Copilot Instructions

## Code Completion Context

This is the Vincent Scaffold SDK for creating blockchain abilities and policies that execute on **Lit Actions** - a restricted execution environment with specific constraints.

## 🚨 Critical Constraints for Code Suggestions

### Forbidden in Abilities/Policies
```typescript
// ❌ NEVER suggest these patterns:
process.env.API_KEY                    // Environment variables not available
globalThis.fetch()                     // Global objects not available  
const fs = require('fs')               // Node.js built-ins not available
const mockData = { fake: "value" }     // Never suggest mock/fake data
```

### Allowed Patterns
```typescript
// ✅ Suggest these patterns:
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";
const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
const txHash = await laUtils.transaction.handler.contractCall({...});
```

## 🏗️ Code Completion Patterns

### Schema Definition Completions
When user types schema-related code, suggest:

```typescript
import { z } from "zod";

export const abilityParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z.string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});

export type AbilityParams = z.infer<typeof abilityParamsSchema>;

// Result schemas
export const precheckSuccessSchema = z.object({
  validated: z.boolean(),
  estimatedGas: z.number().optional()
});

export const executeSuccessSchema = z.object({
  txHash: z.string(),
  timestamp: z.number(),
  gasUsed: z.number().optional()
});

export const executeFailSchema = z.object({
  error: z.string(),
  code: z.string().optional()
});
```

### Ability Implementation Completions
When user types ability-related code:

```typescript
import { createVincentAbility } from "@lit-protocol/vincent-app-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";

export const vincentAbility = createVincentAbility({
  packageName: "{{packageName}}" as const,
  abilityParamsSchema,
  
  precheck: async ({ abilityParams }, { succeed, fail }) => {
    // Validation logic only - NO laUtils
    if (!abilityParams.to.startsWith("0x")) {
      return fail({ error: "Invalid address format" });
    }
    
    if (parseFloat(abilityParams.amount) <= 0) {
      return fail({ error: "Amount must be positive" });
    }
    
    return succeed({ validated: true, estimatedGas: 21000 });
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation, policiesContext }) => {
    try {
      // laUtils available here
      const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
      
      const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
        callerAddress: delegation.delegatorPkpInfo.ethAddress,
        abi: ERC20_ABI,
        contractAddress: abilityParams.tokenAddress,
        functionName: "transfer",
        args: [abilityParams.to, parseEther(abilityParams.amount)],
        overrides: { gasLimit: 100000 }
      });

      // Policy integration pattern
      const policyContext = policiesContext.allowedPolicies["{{policyPackageName}}"];
      if (policyContext?.commit) {
        await policyContext.commit({
          currentCount: policyContext.result.currentCount,
          maxSends: policyContext.result.maxSends,
          remainingSends: policyContext.result.remainingSends
        });
      }

      return succeed({
        txHash,
        to: abilityParams.to,
        amount: abilityParams.amount,
        timestamp: Date.now()
      });
    } catch (error) {
      return fail({ 
        error: error instanceof Error ? error.message : "Transaction failed",
        code: "EXECUTION_ERROR"
      });
    }
  }
});
```

### Policy Implementation Completions
When user types policy-related code:

```typescript
import { createVincentPolicy } from "@lit-protocol/vincent-app-sdk";

export const vincentPolicy = createVincentPolicy({
  packageName: "{{packageName}}" as const,
  abilityParamsSchema,
  userParamsSchema,
  commitParamsSchema,
  
  precheck: async ({ abilityParams, userParams }, { allow, deny, delegation }) => {
    // Early validation - NO laUtils
    const { maxSends, timeWindowSeconds } = userParams;
    const { ethAddress } = delegation.delegatorPkpInfo;
    
    const limitCheck = await checkSendLimit(ethAddress, maxSends, timeWindowSeconds);
    
    if (!limitCheck.allowed) {
      return deny({
        reason: `Send limit exceeded. Maximum ${maxSends} sends per ${timeWindowSeconds} seconds.`,
        currentCount: limitCheck.currentCount,
        maxSends,
        secondsUntilReset: limitCheck.secondsUntilReset
      });
    }
    
    return allow({
      currentCount: limitCheck.currentCount,
      maxSends,
      remainingSends: limitCheck.remainingSends
    });
  },

  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    // Runtime checks - laUtils available
    const result = await Lit.Actions.runOnce(
      { waitForResponse: true, name: "evaluatePolicy" },
      async () => {
        return await checkPolicyConditions(abilityParams, userParams);
      }
    );
    
    return result.allowed ? allow(result) : deny(result);
  },

  commit: async ({ currentCount, maxSends }, { allow, delegation }) => {
    try {
      // State recording - laUtils available
      const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
      
      const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
        callerAddress: delegation.delegatorPkpInfo.ethAddress,
        abi: [counterSignatures.methods.increment],
        contractAddress: counterSignatures.address,
        functionName: "increment",
        args: [],
        overrides: { gasLimit: 100000 }
      });
      
      return allow({
        recorded: true,
        newCount: currentCount + 1,
        txHash
      });
    } catch (error) {
      // Still allow if state recording fails
      return allow({
        recorded: false,
        newCount: currentCount + 1
      });
    }
  }
});
```

### Validation Helper Completions
When user types validation-related code:

```typescript
// Ethereum address validation
const isValidEthereumAddress = (address: string): boolean => 
  /^0x[a-fA-F0-9]{40}$/.test(address);

// Amount validation
const isValidAmount = (amount: string): boolean => 
  /^\d*\.?\d+$/.test(amount) && parseFloat(amount) > 0;

// ERC-20 ABI helper
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

// Amount parsing helper
const parseEther = (amount: string): string => {
  return BigInt(parseFloat(amount) * 1e18).toString();
};
```

### E2E Testing Completions
When user types test-related code:

```typescript
// Import pattern for E2E tests
import { bundledVincentAbility } from "../../vincent-packages/abilities/my-ability/dist/index.js";
import { vincentPolicyMetadata } from "../../vincent-packages/policies/my-policy/dist/index.js";

// Test configuration
const abilityConfig = createVincentAbilityConfig({
  ability: bundledVincentAbility,
  userParams: {
    to: "0x742d35Cc6635C0532925a3b8D400631707BFFfcc",
    amount: "0.001",
    tokenAddress: "0x1234567890123456789012345678901234567890"
  }
});

// Execute with policies
const result = await chainClient.executeAbilities({
  abilities: [abilityConfig],
  policies: [policyMetadata]
});

// Result validation
expect(result.success).toBe(true);
expect(result.result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
```

## 🔧 laUtils API Completions

### Chain Operations
```typescript
// Provider setup (only in execute/evaluate/commit hooks)
const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
const config = laUtils.chain.yellowstoneConfig;
```

### Transaction Handlers
```typescript
// Contract call pattern
const txHash = await laUtils.transaction.handler.contractCall({
  provider,
  pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
  callerAddress: delegation.delegatorPkpInfo.ethAddress,
  abi: contractABI,
  contractAddress: "0x...",
  functionName: "transfer",
  args: [recipient, amount],
  overrides: { gasLimit: 100000 }
});

// Native send pattern
const nativeTxHash = await laUtils.transaction.handler.nativeSend({
  provider,
  pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
  amount: "0.001",
  to: "0x..."
});
```

## 🚫 Anti-Pattern Detection

### Suggest Alternatives for Common Mistakes
```typescript
// When user types process.env, suggest:
// ❌ const apiKey = process.env.API_KEY;
// ✅ Suggest: Pass configuration through userParams schema

// When user types globalThis, suggest:
// ❌ const data = globalThis.myGlobal;
// ✅ Suggest: Use laUtils APIs or external services

// When user types laUtils in precheck, suggest:
// ❌ precheck: async ({ abilityParams }, { succeed, fail }) => {
//      const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
// ✅ Suggest: Move laUtils usage to execute hook
```

## 📋 Template Variable Completions

When user types template-related patterns:
```typescript
// Package name
"{{packageName}}" as const

// Component name
"{{name}}"

// Namespace
"{{namespace}}"

// CamelCase name
"{{camelCaseName}}"

// Policy package reference
"{{policyPackageName}}"
```

## 🎯 Error Handling Patterns

```typescript
// Structured error handling
interface AbilityError {
  code: 'VALIDATION_ERROR' | 'EXECUTION_ERROR' | 'NETWORK_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

// Result pattern
const handleOperation = async (): Promise<
  { success: true; result: T } | 
  { success: false; error: AbilityError }
> => {
  try {
    const result = await executeOperation();
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { originalError: error }
      }
    };
  }
};
```

## 📚 Common Imports to Suggest

```typescript
// Core Vincent imports
import { createVincentAbility } from "@lit-protocol/vincent-app-sdk";
import { createVincentPolicy } from "@lit-protocol/vincent-app-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";

// Schema validation
import { z } from "zod";

// Type definitions
export type AbilityParams = z.infer<typeof abilityParamsSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
```

Focus on suggesting Vincent-specific patterns while avoiding forbidden constructs in the Lit Actions environment.