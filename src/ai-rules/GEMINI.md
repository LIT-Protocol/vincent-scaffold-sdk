# Vincent Framework: Google Gemini Development Guide

## Quick Start for Gemini

This Vincent Scaffold SDK creates blockchain abilities and policies that execute on Lit Actions. As Gemini, focus on TypeScript precision, schema validation, and blockchain integration patterns.

## 🚨 Critical Execution Environment

Vincent abilities/policies run in **Lit Actions** - a restricted blockchain environment:

```typescript
// ❌ These will FAIL in Lit Actions:
process.env.API_KEY        // No environment variables
globalThis.fetch           // Limited global objects  
localStorage.setItem()     // No persistent storage
require('fs')              // No Node.js modules

// ✅ Use these patterns instead:
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";
const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
```

## 🏗️ Development Workflow

### 1. Schema-First Development
Always start with Zod schemas for type safety:

```typescript
import { z } from "zod";

// Define input validation
export const abilityParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z.string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token contract")
});

// Generate types
export type AbilityParams = z.infer<typeof abilityParamsSchema>;

// Result schemas for each operation
export const executeSuccessSchema = z.object({
  txHash: z.string(),
  timestamp: z.number(),
  gasUsed: z.number().optional()
});
```

### 2. Ability Implementation Pattern

```typescript
import { createVincentAbility } from "@lit-protocol/vincent-app-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";

export const vincentAbility = createVincentAbility({
  packageName: "{{packageName}}" as const,
  abilityParamsSchema,
  
  // Phase 1: Input validation (NO blockchain access)
  precheck: async ({ abilityParams }, { succeed, fail }) => {
    // Pure validation logic
    if (!isValidEthereumAddress(abilityParams.to)) {
      return fail({ error: "Invalid recipient address" });
    }
    
    if (parseFloat(abilityParams.amount) <= 0) {
      return fail({ error: "Amount must be positive" });
    }
    
    return succeed({ 
      validated: true,
      estimatedGas: 21000 
    });
  },

  // Phase 2: Blockchain execution (laUtils available)
  execute: async ({ abilityParams }, { succeed, fail, delegation }) => {
    try {
      // Get blockchain provider
      const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
      
      // Execute transaction using laUtils
      const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
        callerAddress: delegation.delegatorPkpInfo.ethAddress,
        abi: ERC20_ABI,
        contractAddress: abilityParams.tokenAddress,
        functionName: "transfer",
        args: [abilityParams.to, parseEther(abilityParams.amount)]
      });

      return succeed({
        txHash,
        to: abilityParams.to,
        amount: abilityParams.amount,
        timestamp: Date.now()
      });
    } catch (error) {
      return fail({ 
        error: error instanceof Error ? error.message : "Transaction failed" 
      });
    }
  }
});
```

### 3. Policy Implementation Pattern

```typescript
export const vincentPolicy = createVincentPolicy({
  packageName: "{{packageName}}" as const,
  userParamsSchema,
  
  // Phase 1: Early validation
  precheck: async ({ abilityParams, userParams }, { allow, deny }) => {
    const { maxTransfers, timeWindowHours } = userParams;
    
    // Check current usage from external storage
    const currentCount = await getCurrentTransferCount(
      delegation.delegatorPkpInfo.ethAddress,
      timeWindowHours
    );
    
    if (currentCount >= maxTransfers) {
      return deny({
        reason: `Transfer limit exceeded: ${currentCount}/${maxTransfers}`,
        resetTime: getResetTimestamp(timeWindowHours)
      });
    }
    
    return allow({
      currentCount,
      remainingTransfers: maxTransfers - currentCount
    });
  },

  // Phase 2: Runtime evaluation (in Lit Actions)
  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    const result = await Lit.Actions.runOnce(
      { waitForResponse: true, name: "evaluateTransfer" },
      async () => {
        // Blockchain-based validation
        return await validateTransferLimits(
          delegation.delegatorPkpInfo.ethAddress,
          userParams.maxTransfers,
          userParams.timeWindowHours
        );
      }
    );
    
    return result.allowed ? allow(result) : deny(result);
  },

  // Phase 3: State recording
  commit: async ({ currentCount }, { allow, delegation }) => {
    try {
      // Record transaction to blockchain state
      const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
      
      await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey: delegation.delegatorPkpInfo.publicKey,
        // Update policy state contract
      });
      
      return allow({ 
        recorded: true,
        newCount: currentCount + 1 
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

## 🛠️ Common Development Tasks

### Creating New Components

```bash
# Create new ability
npx @lit-protocol/vincent-scaffold-sdk add ability erc20-transfer

# Create new policy  
npx @lit-protocol/vincent-scaffold-sdk add policy transfer-limits

# Build all components
npm run vincent:build

# Run tests
npm run vincent:e2e
```

### Build Script Updates
When adding new abilities/policies, update `package.json`:

```json
{
  "scripts": {
    "vincent:build": "dotenv -e .env -- sh -c 'cd vincent-packages/policies/send-counter-limit && npm install && npm run build && cd ../../abilities/native-send && npm install && npm run build && cd ../erc20-transfer && npm install && npm run build'"
  }
}
```

### E2E Testing Pattern

```typescript
// Import built components
import { bundledVincentAbility as erc20Ability } from "../../vincent-packages/abilities/erc20-transfer/dist/index.js";
import { vincentPolicyMetadata as limitPolicy } from "../../vincent-packages/policies/transfer-limits/dist/index.js";

// Configure for testing
const abilityConfig = createVincentAbilityConfig({
  ability: erc20Ability,
  userParams: {
    to: "0x742d35Cc6635C0532925a3b8D400631707BFFfcc",
    amount: "0.001",
    tokenAddress: "0x1234567890123456789012345678901234567890"
  }
});

// Execute with policy enforcement
const result = await chainClient.executeAbilities({
  abilities: [abilityConfig],
  policies: [limitPolicy]
});
```

## 🎯 TypeScript Best Practices

### Strict Type Safety
```typescript
// Use precise types
interface TransferResult {
  readonly txHash: string;
  readonly gasUsed: bigint;
  readonly blockNumber: number;
}

// Leverage template literal types
type EventName = `Transfer_${string}`;

// Use branded types for addresses
type EthereumAddress = string & { readonly __brand: unique symbol };
```

### Error Handling
```typescript
// Structured error types
interface AbilityError {
  readonly code: 'VALIDATION_ERROR' | 'EXECUTION_ERROR' | 'NETWORK_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// Error result pattern
const handleAbilityExecution = async (): Promise<
  { success: true; result: TransferResult } | 
  { success: false; error: AbilityError }
> => {
  try {
    const result = await executeTransfer();
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

## 🔧 Available APIs

### laUtils Reference
```typescript
// Chain utilities (Lit Actions only)
const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);
const config = laUtils.chain.yellowstoneConfig;

// Transaction handlers (Lit Actions only)
const txHash = await laUtils.transaction.handler.contractCall({
  provider,
  pkpPublicKey: "0x...",
  callerAddress: "0x...",
  abi: contractABI,
  contractAddress: "0x...",
  functionName: "transfer",
  args: [recipient, amount],
  overrides: { gasLimit: 100000 }
});

// Native ETH transfers
const nativeTxHash = await laUtils.transaction.handler.nativeSend({
  provider,
  pkpPublicKey: "0x...",
  amount: "0.001",
  to: "0x..."
});

// Helper utilities
const ethAddress = laUtils.helpers.toEthAddress(publicKey);
```

## ⚠️ Common Pitfalls to Avoid

1. **Using laUtils in precheck hooks**
   ```typescript
   // ❌ WRONG - laUtils not available in precheck
   precheck: async ({ abilityParams }, { succeed, fail }) => {
     const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
); // FAILS
   }
   
   // ✅ CORRECT - validation only
   precheck: async ({ abilityParams }, { succeed, fail }) => {
     if (!isValidAddress(abilityParams.to)) return fail({ error: "Invalid address" });
   }
   ```

2. **Forgetting build script updates**
   ```typescript
   // After creating new ability, MUST update package.json build script
   // Otherwise new ability won't be compiled
   ```

3. **Mock data usage**
   ```typescript
   // ❌ NEVER use mock data
   const mockResult = { txHash: "0xfake..." };
   
   // ✅ Ask for clarification if data unclear
   // Request proper test data or configuration
   ```

4. **Incorrect import paths**
   ```typescript
   // ❌ WRONG - won't work in E2E tests
   import { myAbility } from "@company/vincent-ability-name";
   
   // ✅ CORRECT - relative path to built output
   import { bundledVincentAbility } from "../../vincent-packages/abilities/name/dist/index.js";
   ```

## 🚀 Quick Reference Commands

```bash
# Initialize project
npx @lit-protocol/vincent-scaffold-sdk init

# Add components
npx @lit-protocol/vincent-scaffold-sdk add ability my-ability
npx @lit-protocol/vincent-scaffold-sdk add policy my-policy

# Development cycle
npm run vincent:build    # Compile all components
npm run vincent:e2e      # Run integration tests
npm run vincent:reset    # Reset test state

# From ability/policy directory
npx @lit-protocol/vincent-scaffold-sdk pkg build   # Build current package
npx @lit-protocol/vincent-scaffold-sdk pkg clean   # Clean dist files
```

Remember: Vincent development requires precision due to blockchain execution constraints. Focus on type safety, proper error handling, and following established patterns.