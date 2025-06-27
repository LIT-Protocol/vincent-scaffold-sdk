# Vincent Framework: Google Gemini Development Guide

## Quick Start for Gemini

This Vincent Scaffold SDK creates blockchain tools and policies that execute on Lit Actions. As Gemini, focus on TypeScript precision, schema validation, and blockchain integration patterns.

## 🚨 Critical Execution Environment

Vincent tools/policies run in **Lit Actions** - a restricted blockchain environment:

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
export const toolParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z.string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token contract")
});

// Generate types
export type ToolParams = z.infer<typeof toolParamsSchema>;

// Result schemas for each operation
export const executeSuccessSchema = z.object({
  txHash: z.string(),
  timestamp: z.number(),
  gasUsed: z.number().optional()
});
```

### 2. Tool Implementation Pattern

```typescript
import { createVincentTool } from "@lit-protocol/vincent-tool-sdk";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";

export const vincentTool = createVincentTool({
  packageName: "{{packageName}}" as const,
  toolParamsSchema,
  
  // Phase 1: Input validation (NO blockchain access)
  precheck: async ({ toolParams }, { succeed, fail }) => {
    // Pure validation logic
    if (!isValidEthereumAddress(toolParams.to)) {
      return fail({ error: "Invalid recipient address" });
    }
    
    if (parseFloat(toolParams.amount) <= 0) {
      return fail({ error: "Amount must be positive" });
    }
    
    return succeed({ 
      validated: true,
      estimatedGas: 21000 
    });
  },

  // Phase 2: Blockchain execution (laUtils available)
  execute: async ({ toolParams }, { succeed, fail, delegation }) => {
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
        contractAddress: toolParams.tokenAddress,
        functionName: "transfer",
        args: [toolParams.to, parseEther(toolParams.amount)]
      });

      return succeed({
        txHash,
        to: toolParams.to,
        amount: toolParams.amount,
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
  precheck: async ({ toolParams, userParams }, { allow, deny }) => {
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
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
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
# Create new tool
npx @lit-protocol/vincent-scaffold-sdk add tool erc20-transfer

# Create new policy  
npx @lit-protocol/vincent-scaffold-sdk add policy transfer-limits

# Build all components
npm run vincent:build

# Run tests
npm run vincent:e2e
```

### Build Script Updates
When adding new tools/policies, update `package.json`:

```json
{
  "scripts": {
    "vincent:build": "dotenv -e .env -- sh -c 'cd vincent-packages/policies/send-counter-limit && npm install && npm run build && cd ../../tools/native-send && npm install && npm run build && cd ../erc20-transfer && npm install && npm run build'"
  }
}
```

### E2E Testing Pattern

```typescript
// Import built components
import { bundledVincentTool as erc20Tool } from "../../vincent-packages/tools/erc20-transfer/dist/index.js";
import { vincentPolicyMetadata as limitPolicy } from "../../vincent-packages/policies/transfer-limits/dist/index.js";

// Configure for testing
const toolConfig = createVincentToolConfig({
  tool: erc20Tool,
  userParams: {
    to: "0x742d35Cc6635C0532925a3b8D400631707BFFfcc",
    amount: "0.001",
    tokenAddress: "0x1234567890123456789012345678901234567890"
  }
});

// Execute with policy enforcement
const result = await chainClient.executeTools({
  tools: [toolConfig],
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
interface ToolError {
  readonly code: 'VALIDATION_ERROR' | 'EXECUTION_ERROR' | 'NETWORK_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// Error result pattern
const handleToolExecution = async (): Promise<
  { success: true; result: TransferResult } | 
  { success: false; error: ToolError }
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
   precheck: async ({ toolParams }, { succeed, fail }) => {
     const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
); // FAILS
   }
   
   // ✅ CORRECT - validation only
   precheck: async ({ toolParams }, { succeed, fail }) => {
     if (!isValidAddress(toolParams.to)) return fail({ error: "Invalid address" });
   }
   ```

2. **Forgetting build script updates**
   ```typescript
   // After creating new tool, MUST update package.json build script
   // Otherwise new tool won't be compiled
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
   import { myTool } from "@company/vincent-tool-name";
   
   // ✅ CORRECT - relative path to built output
   import { bundledVincentTool } from "../../vincent-packages/tools/name/dist/index.js";
   ```

## 🚀 Quick Reference Commands

```bash
# Initialize project
npx @lit-protocol/vincent-scaffold-sdk init

# Add components
npx @lit-protocol/vincent-scaffold-sdk add tool my-tool
npx @lit-protocol/vincent-scaffold-sdk add policy my-policy

# Development cycle
npm run vincent:build    # Compile all components
npm run vincent:e2e      # Run integration tests
npm run vincent:reset    # Reset test state

# From tool/policy directory
npx @lit-protocol/vincent-scaffold-sdk pkg build   # Build current package
npx @lit-protocol/vincent-scaffold-sdk pkg clean   # Clean dist files
```

Remember: Vincent development requires precision due to blockchain execution constraints. Focus on type safety, proper error handling, and following established patterns.