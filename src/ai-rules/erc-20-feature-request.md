# Vincent Framework: ERC-20 Transfer Tool Implementation

## Context & Existing Architecture

This Vincent Starter Kit contains a sophisticated tool and policy system with the following components:

### Current Implementation

- **`native-send` tool** (`./vincent-packages/tools/native-send/`) - Handles native ETH transfers
- **`send-counter-limit` policy** (`./vincent-packages/policies/send-counter-limit/`) - Enforces transfer limits using smart contract state management
- **E2E test suite** (`./vincent-e2e/src/e2e.ts`) - Demonstrates full integration testing between tools and policies

### Architecture Pattern

- **Tools** use Lit Actions with `@lit-protocol/vincent-tool-sdk` framework
- **Tool hooks**: `precheck` (validation) and `execute` (transaction execution)
- **Policy hooks**: `precheck`, `evaluate`, and `commit` for state management
- **Type safety**: Zod schemas for strict input/output validation and type inference
  - **Tool schemas**: `./vincent-packages/tools/native-send/src/lib/schemas.ts`
  - **Policy schemas**: `./vincent-packages/policies/send-counter-limit/src/lib/schemas.ts`
  - **Pattern**: Each component defines its own validation schemas for parameters and results
- **Blockchain operations**: `laUtils` from `@lit-protocol/vincent-scaffold-sdk/la-utils`

### Schema Architecture

The existing implementation uses comprehensive Zod schemas for type safety:

**Tool Parameter Validation Pattern:**

```typescript
// Example from native-send tool schemas
export const toolParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});
```

**Result Schemas Pattern:**

```typescript
// Success/failure schemas for precheck and execute operations
export const precheckSuccessSchema = z.object({...});
export const precheckFailSchema = z.object({...});
export const executeSuccessSchema = z.object({...});
export const executeFailSchema = z.object({...});
```

## Task: Create ERC-20 Transfer Tool

### Objective

Create a new tool called `erc20-transfer` by copying and adapting the existing `native-send` tool structure to handle ERC-20 token transfers.

### Implementation Requirements

#### 1. Directory Structure

- Create `./vincent-packages/tools/erc20-transfer/` following the exact same structure as `native-send`
- Copy all configuration files and update appropriately
- Create `src/lib/helpers/index.ts` for any ERC-20 specific helper functions (following the pattern from policies)

#### 2. Package Configuration

- **Name**: `@agentic-ai/vincent-tool-erc20-transfer`
- **Files to update**: `package.json`, `tsconfig.json`, `README.md`
- Update package name and description for ERC-20 functionality

#### 3. Tool Parameters Schema (`src/lib/schemas.ts`)

Extend the existing native-send schema pattern to include token contract address and network configuration:

```typescript
export const toolParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  tokenAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token contract address"),
  // Network configuration - REQUIRED for tool consumer flexibility
  rpcEndpoint: z.string().url("Invalid RPC endpoint URL"),
  chainId: z.number().positive("Invalid chain ID"),
});
```

**Additional Required Schemas:**

- Copy all result schemas from `native-send` (`precheckSuccessSchema`, `executeSuccessSchema`, etc.)
- Update schema descriptions to reflect ERC-20 functionality
- Maintain the same type export patterns

#### 4. Tool Implementation (`src/lib/vincent-tool.ts`)

- **Precheck function**: Validate recipient address, amount, token contract address, and network parameters
  - **CRITICAL Balance Validations**: Both native and ERC-20 balance checks must be performed in precheck before attempting execution
  - **Native Balance Check**: Verify sender has sufficient native tokens for gas fees
    - Create ethers provider: `new ethers.providers.JsonRpcProvider(toolParams.rpcEndpoint, toolParams.chainId)`
    - Get sender balance: `await provider.getBalance(senderAddress)`
    - Estimate gas costs for ERC-20 transfer transaction
    - Validate: `nativeBalance >= estimatedGasCost`
    - Return descriptive error if insufficient native balance for gas
  - **ERC-20 Balance Check**: Verify sender has sufficient ERC-20 tokens to transfer
    - Create ERC-20 contract instance using token address and standard ERC-20 ABI
    - Call `balanceOf(senderAddress)` to get current token balance
    - Parse amount considering token decimals: `ethers.utils.parseUnits(amount, tokenDecimals)`
    - Validate: `tokenBalance >= requestedAmount`
    - Return descriptive error if insufficient ERC-20 token balance
  - **Gas Estimation**: Use contract.estimateGas.transfer() for accurate gas estimation
  - **Error Messages**: Provide clear, user-friendly error messages for each failure scenario
  - **CRITICAL**: These balance checks must be performed in precheck before attempting execution
- **Execute function**: Use `laUtils.transaction.handler.contractCall()` to call ERC-20 contract's `transfer` function
- **Provider Configuration**: **CRITICAL** - The provider MUST be configurable by the tool consumer (e2e test), NOT hardcoded in the tool
  - **FORBIDDEN**: Do NOT hardcode any RPC endpoints in the tool implementation
  - **FORBIDDEN**: Do NOT use `await laUtils.chain.getYellowstoneProvider()` - this locks the tool to one chain
  - **REQUIRED**: Tool parameters MUST include `rpcEndpoint` and `chainId` so the e2e test can specify which chain to use
  - **Pattern**: `const provider = new ethers.providers.JsonRpcProvider(toolParams.rpcEndpoint, toolParams.chainId)`
- **Helper functions**: Create ERC-20 specific helpers in `src/lib/helpers/index.ts` for:
  - **ERC-20 ABI definitions**: Standard ERC-20 ABI including `transfer`, `balanceOf`, `decimals` functions
  - **Balance check utilities**:
    - `checkNativeBalance(provider, address, estimatedGasCost)`: Validates sufficient native tokens for gas
    - `checkERC20Balance(provider, tokenAddress, ownerAddress, amount)`: Validates sufficient ERC-20 tokens
    - `getTokenDecimals(provider, tokenAddress)`: Retrieves token decimal places for proper amount parsing
  - **Amount parsing/validation utilities**: Handle token decimal conversion and validation
  - **Gas estimation helpers**: Calculate gas costs for ERC-20 transfers
  - **Contract interaction helpers**: Create contract instances and handle common ERC-20 operations
- **Available laUtils APIs**:
  - `laUtils.transaction.handler.contractCall()` - Execute contract calls
  - `laUtils.helpers.toEthAddress()` - Address utilities
- **Policy integration**: Maintain same pattern as `native-send` for `send-counter-limit` policy
- **Error handling**: Follow existing logging and error patterns
- **Parameter mapping**: Ensure policy receives the same parameter structure (to, amount) for compatibility

#### 5. Required Helper Functions (`src/lib/helpers/index.ts`)

**CRITICAL**: These helper functions must be implemented to support the balance validation requirements:

```typescript
// Standard ERC-20 ABI - minimal required functions
export const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Check if sender has sufficient native tokens for gas fees
export const checkNativeBalance = async (
  provider: ethers.providers.JsonRpcProvider,
  address: string,
  estimatedGasCost: ethers.BigNumber
): Promise<{ hasEnough: boolean; balance: ethers.BigNumber }> => {
  const balance = await provider.getBalance(address);
  return {
    hasEnough: balance.gte(estimatedGasCost),
    balance,
  };
};

// Check if sender has sufficient ERC-20 tokens
export const checkERC20Balance = async (
  provider: ethers.providers.JsonRpcProvider,
  tokenAddress: string,
  ownerAddress: string,
  requiredAmount: string,
  decimals?: number
): Promise<{ hasEnough: boolean; balance: ethers.BigNumber }> => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(ownerAddress);
  const tokenDecimals = decimals || (await contract.decimals());
  const parsedAmount = ethers.utils.parseUnits(requiredAmount, tokenDecimals);

  return {
    hasEnough: balance.gte(parsedAmount),
    balance,
  };
};

// Get token decimals for proper amount parsing
export const getTokenDecimals = async (
  provider: ethers.providers.JsonRpcProvider,
  tokenAddress: string
): Promise<number> => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.decimals();
};

// Estimate gas for ERC-20 transfer
export const estimateERC20TransferGas = async (
  provider: ethers.providers.JsonRpcProvider,
  toolParams: { tokenAddress: string; to: string; amount: string }
): Promise<ethers.BigNumber> => {
  const contract = new ethers.Contract(
    toolParams.tokenAddress,
    ERC20_ABI,
    provider
  );
  const decimals = await getTokenDecimals(provider, toolParams.tokenAddress);
  const amount = ethers.utils.parseUnits(toolParams.amount, decimals);

  const gasEstimate = await contract.estimateGas.transfer(
    toolParams.to,
    amount
  );
  const gasPrice = await provider.getGasPrice();

  return gasEstimate.mul(gasPrice);
};
```

#### 6. Technical Constraints

- **CRITICAL**: `laUtils` can ONLY be used in Lit Action environment
  - Inside tool's `execute` hook
  - Inside policy's `evaluate` hook
  - NOT available in `precheck` hooks
- **Precheck Implementation Pattern**: Since `laUtils` is not available in precheck, use direct ethers.js for balance validations
  - Create provider directly: `new ethers.providers.JsonRpcProvider(toolParams.rpcEndpoint, toolParams.chainId)`
  - Use standard ethers contracts for ERC-20 interactions
  - Perform all validation logic before the execute phase
  - **Example precheck structure**:
    ```typescript
    precheck: async ({ toolParams, senderPkpEthAddress, success, fail }) => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          toolParams.rpcEndpoint,
          toolParams.chainId
        );

        // Check native balance for gas
        const nativeBalance = await provider.getBalance(senderPkpEthAddress);
        const gasEstimate = await estimateERC20TransferGas(
          provider,
          toolParams
        );
        if (nativeBalance.lt(gasEstimate)) {
          return fail({
            message: "Insufficient native token balance for gas fees",
          });
        }

        // Check ERC-20 token balance
        const tokenBalance = await getERC20Balance(
          provider,
          toolParams.tokenAddress,
          senderPkpEthAddress
        );
        const transferAmount = ethers.utils.parseUnits(
          toolParams.amount,
          await getTokenDecimals(provider, toolParams.tokenAddress)
        );
        if (tokenBalance.lt(transferAmount)) {
          return fail({ message: "Insufficient ERC-20 token balance" });
        }

        return success({ message: "Balance checks passed" });
      } catch (error) {
        return fail({ message: `Precheck failed: ${error.message}` });
      }
    };
    ```
- **Network Configuration**: **CRITICAL** - Tool must be chain-agnostic and configurable by consumer

  - **FORBIDDEN**: Do NOT hardcode any RPC endpoints or chain IDs in the tool
  - **REQUIRED**: Tool parameters must include `rpcEndpoint` and `chainId` for full flexibility
  - **Support multiple chains**: Base, Ethereum, Polygon, etc. - determined by tool consumer
  - **E2E test responsibility**: The e2e test specifies which chain to use via tool parameters
  - **Example configurations**:
    - Base (recommended): `rpcEndpoint: "https://base.llamarpc.com"`, `chainId: 8453`
    - Ethereum: `rpcEndpoint: "https://eth.llamarpc.com"`, `chainId: 1`
    - Polygon: `rpcEndpoint: "https://polygon.llamarpc.com"`, `chainId: 137`
  - **Default E2E testing**: Use Base network with USDC token (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)

- **FORBIDDEN**: Do NOT use the following in tools and policies:
  - `globalThis` - Not available in Lit Action environment
  - `process.env` - Environment variables not accessible in Lit Actions
  - **Mock data** - Absolutely no fake/mock data just to make things work
- **CRITICAL**: **DEFINITELY SHOULD NOT** be mocking any data whatsoever. If anything is missing or unclear during implementation, ask for clarification and provide a proper solution rather than creating mock/fake data
- **Error handling pattern**: In tool `execute()` and policy `evaluate()` hooks, **MUST NOT throw errors**
  - Use `return fail()` instead of throwing exceptions
  - Framework expects structured error responses via fail() callback
  - Throwing errors will break the execution flow
- **Available laUtils APIs**:
  ```typescript
  export const laUtils = {
    transaction: {
      handler: {
        contractCall,
        nativeSend,
      },
      primitive: {
        getNonce,
        sendTx,
        signTx,
      },
    },
    helpers: {
      toEthAddress,
    },
  };
  ```
- Use `laUtils` import: `import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils"`
- Follow existing code conventions and patterns
- Maintain exact same schema validation approach

#### 7. Integration Requirements

- **Policy compatibility**: Work with existing `send-counter-limit` policy without modifications
- **E2E testing**: Update test suite to include ERC-20 transfer scenarios
- **App configuration**: Ensure tool can be registered using same pattern as `native-send`
- **Schema consistency**: Follow the established schema patterns from existing tools

**E2E Test Integration Pattern:**
After building, import the new ERC-20 tool in `vincent-e2e/src/e2e.ts` using relative paths:

```typescript
import { vincentPolicyMetadata as sendLimitPolicyMetadata } from "../../vincent-packages/policies/send-counter-limit/dist/index.js";
import { bundledVincentTool as nativeSendTool } from "../../vincent-packages/tools/native-send/dist/index.js";
import { bundledVincentTool as erc20TransferTool } from "../../vincent-packages/tools/erc20-transfer/dist/index.js";
```

**Key Points:**

- Use relative paths to `dist/` folders (not published packages)
- Named exports: `bundledVincentTool` for tools, `vincentPolicyMetadata` for policies
- Development workflow: build → import → test (no publishing required)
- **Create separate E2E file**: Create a new `e2e-erc20.ts` file in `vincent-e2e/src/` using the exact same structure as the existing `e2e.ts`
- **Package.json update**: Add new test script to root `package.json` for running the ERC-20 specific tests
- **Test pattern**: E2E test must perform ERC-20 transfer to self (same sender and recipient address)
- **Network specification**: E2E test must specify the target chain via `rpcEndpoint` and `chainId` parameters
- **Default testing configuration**: Use Base network with USDC token
- **Example test configuration**:

  ```typescript
  const TEST_RPC_ENDPOINT = "https://base.llamarpc.com"; // Base network
  const TEST_CHAIN_ID = 8453; // Base mainnet
  const TEST_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base

  // E2E test calls include network config
  await erc20TransferToolClient.execute(
    {
      to: TEST_RECIPIENT,
      amount: TEST_AMOUNT,
      tokenAddress: TEST_TOKEN_ADDRESS,
      rpcEndpoint: TEST_RPC_ENDPOINT,
      chainId: TEST_CHAIN_ID,
    },
    { delegatorPkpEthAddress: agentWalletPkp.ethAddress }
  );
  ```

- **Preserve existing tests**: Keep the original `e2e.ts` file intact for native send functionality

#### 8. Build Script Configuration

**CRITICAL**: After creating the new tool, you MUST update the root `package.json` build script to include the new tool:

**Current build script:**

```json
"vincent:build": "dotenv -e .env -- sh -c 'cd vincent-packages/policies/send-counter-limit && npm install && npm run build && cd ../../tools/native-send && npm install && npm run build'"
```

**Updated build script (must include erc20-transfer):**

```json
"vincent:build": "dotenv -e .env -- sh -c 'cd vincent-packages/policies/send-counter-limit && npm install && npm run build && cd ../../tools/native-send && npm install && npm run build && cd ../erc20-transfer && npm install && npm run build'"
```

**Why this is critical:**

- The build script ensures all tools and policies are properly compiled
- Without updating this script, the new `erc20-transfer` tool won't be built automatically
- This affects deployment and E2E testing functionality
- The script builds dependencies in the correct order

#### 9. Verification Testing

**CRITICAL**: After completing the implementation and updating the build script, you MUST verify everything works correctly:

**Step 1: Build Verification**

```bash
npm run vincent:build
```

**What this does:**

- Compiles all policies and tools (including the new `erc20-transfer` tool)
- Generates the necessary Lit Action files
- Ensures TypeScript compilation succeeds

**Expected outcome:**

- Build completes successfully without errors
- Generated files appear in `vincent-packages/tools/erc20-transfer/src/generated/`
- No TypeScript compilation errors

**Step 2: E2E Test Verification**

```bash
npm run vincent:e2e
```

**What this does:**

- Runs the complete end-to-end test suite
- Tests tool registration and policy integration
- Validates that tools work with the existing `send-counter-limit` policy
- Confirms blockchain transactions execute successfully

**Expected outcome:**

- All existing tests pass (native-send functionality remains intact)
- New ERC-20 transfer functionality integrates seamlessly
- Policy limits are enforced correctly for both tools

**CRITICAL for E2E Success:**

- Tests must execute the **`.execute()` function**, not just `.precheck()`
- `.precheck()` only validates parameters - it's not sufficient for E2E verification
- `.execute()` performs actual blockchain transactions and confirms end-to-end functionality
- E2E tests are only considered successful when actual ERC-20 transfers complete on-chain

**Verification Checklist:**

- [ ] `npm run vincent:build` completes without errors
- [ ] Generated files exist in `erc20-transfer/src/generated/`
- [ ] `npm run vincent:e2e` passes all tests
- [ ] Both native and ERC-20 transfers work with send limits
- [ ] No regression in existing functionality

**If tests fail:**

1. Check that the build script was updated correctly in `package.json`
2. Verify all files were copied and modified properly
3. Ensure the tool parameters match the expected schema
4. Confirm policy integration follows the same pattern as `native-send`

**State Reset (Only if needed):**
If you need to reset policy state data (e.g., send counters), you can run:

```bash
npm run vincent:reset
```

This clears all policy state and should only be used when you specifically want to reset counters or when policy parameter values have been changed.

### Success Criteria

- [ ] Tool builds successfully with `npm run vincent:build`
- [ ] **Root package.json build script updated to include erc20-transfer**
- [ ] **Verification tests pass: `npm run vincent:build` and `npm run vincent:e2e`**
- [ ] **Provider is fully configurable by tool consumer** - NO hardcoded RPC endpoints in tool
- [ ] **E2E test specifies target chain** via `rpcEndpoint` and `chainId` parameters
- [ ] Integrates seamlessly with existing `send-counter-limit` policy
- [ ] E2E tests pass for both native and ERC-20 transfers
- [ ] Follows all existing code patterns and conventions
- [ ] Proper error handling and detailed logging
- [ ] Uses existing `laUtils` APIs with custom helpers for ERC-20 transfers
- [ ] Maintains consistent schema validation patterns
- [ ] **No forbidden patterns**: No `globalThis`, `process.env`, hardcoded RPC endpoints, or mock data in tools/policies

### Reference Implementation

Use the existing `native-send` tool as the primary template, especially:

- **Schema structure**: `./vincent-packages/tools/native-send/src/lib/schemas.ts`
- **Tool implementation**: `./vincent-packages/tools/native-send/src/lib/vincent-tool.ts`
- **Policy integration patterns**: How `native-send` maps parameters to policies
- **Transaction execution**: Using `laUtils` for blockchain operations
- **Error handling and logging approaches**: Consistent messaging patterns
