# Vincent Framework: AI Development Guidelines

## Overview

The Vincent Scaffold SDK is a specialized framework for creating **Vincent Tools** and **Vincent Policies** that execute on Lit Actions - a blockchain-based execution environment with strict constraints. This document provides essential guidance for AI agents working with Vincent projects.

## 🚨 CRITICAL CONSTRAINTS

### Lit Actions Environment Limitations

Vincent tools and policies execute in a restricted environment:

- **❌ NO `globalThis`** - Standard global objects are not available
- **❌ NO `process.env`** - Environment variables cannot be accessed
- **❌ NO persistent memory** - State doesn't persist between executions
- **❌ NO file system access** - Cannot read/write files during execution
- **❌ NO standard Node.js APIs** - Limited runtime environment

### Forbidden Patterns

- **NEVER** use mock or fake data in implementations
- **NEVER** assume environment variables are available in tools/policies
- **NEVER** rely on persistent state within the execution context
- **NEVER** use standard Node.js modules in tool/policy logic

## 🏗️ Vincent Architecture

### Core Components

1. **Vincent Tools** - Executable actions (e.g., token transfers, API calls)
2. **Vincent Policies** - Governance rules that control tool execution
3. **Lit Actions** - Secure execution environment for tools/policies
4. **E2E Testing Framework** - Integrated testing with blockchain simulation

### Three-Phase Execution Model

#### Tools

1. **Precheck** - Validate inputs (runs outside Lit Actions)
2. **Execute** - Perform the operation (runs in Lit Actions)

#### Policies

1. **Precheck** - Early validation (runs outside Lit Actions)
2. **Evaluate** - Runtime checks (runs in Lit Actions)
3. **Commit** - Record state changes (runs in Lit Actions)

## 📋 Schema-Driven Development

### Required Patterns

All Vincent components MUST use Zod schemas for type safety:

```typescript
// Tool parameters
export const toolParamsSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
  amount: z.string().regex(/^\d*\.?\d+$/, "Invalid amount")
});

// Result schemas for each phase
export const precheckSuccessSchema = z.object({...});
export const precheckFailSchema = z.object({...});
export const executeSuccessSchema = z.object({...});
export const executeFailSchema = z.object({...});
```

### Schema Validation Rules

- Define schemas BEFORE implementation
- Use descriptive error messages
- Export type definitions: `export type ToolParams = z.infer<typeof toolParamsSchema>;`
- Validate ALL inputs and outputs

## 🔧 laUtils API Usage

### Available APIs

This are available in the:

- execute() hook inside the vincent policy
- evaluate() hook inside the vincent tool

```typescript
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk/la-utils";
laUtils.transaction.handler.contractCall(); // Execute contract calls
laUtils.transaction.handler.nativeSend(); // Send native tokens
laUtils.helpers.toEthAddress(); // Address utilities
```

### Usage Constraints

- **✅ CAN use** in tool `execute` hooks
- **✅ CAN use** in policy `evaluate` and `commit` hooks
- **❌ CANNOT use** in `precheck` hooks (not in Lit Actions context)

## 🏗️ Project Structure

### Directory Layout

```
vincent-packages/
├── tools/
│   └── my-tool/
│       ├── src/lib/
│       │   ├── schemas.ts
│       │   ├── vincent-tool.ts
│       │   └── helpers/index.ts
│       ├── package.json
│       └── .gitignore
└── policies/
    └── my-policy/
        ├── src/lib/
        │   ├── schemas.ts
        │   ├── vincent-policy.ts
        │   └── helpers/index.ts
        ├── package.json
        └── .gitignore
```

## 🛠️ Development Workflow

### Creating New Tools/Policies

1. Use CLI: `npx @lit-protocol/vincent-scaffold-sdk add tool my-tool`
2. CD into the tool or policy directory
3. Update schemas in `src/lib/schemas.ts`
4. Implement logic in `src/lib/vincent-tool.ts` or `src/lib/vincent-policy.ts`
5. Add helpers in `src/lib/helpers/index.ts` if needed
6. Update root `package.json` build script
7. Build: `npm run vincent:build`
8. Test: `npm run vincent:e2e`

## 🧪 Testing & Validation

### E2E Testing Pattern

```typescript
// Import built tools/policies
import { bundledVincentTool } from "../../vincent-packages/tools/my-tool/dist/index.js";
import { vincentPolicyMetadata } from "../../vincent-packages/policies/my-policy/dist/index.js";

// Register and test
const result = await chainClient.executeTools({
  tools: [myToolConfig],
  // ... test configuration
});
```

### Test Commands

```bash
npm run vincent:hardreset         # Reset all state and rebuild
npm run vincent:build              # Build all tools and policies
npm run vincent:e2e:reset         # Reset E2E test state only
npm run vincent:e2e               # Run native transfer E2E tests
npm run vincent:e2e:erc20         # Run ERC-20 transfer E2E tests
```

## 🎯 Best Practices

### Code Quality

- Follow existing code patterns exactly
- Use TypeScript strictly
- Implement comprehensive error handling
- Add detailed logging for debugging
- Maintain consistent naming conventions

### Security

- Validate all inputs with Zod schemas
- Never expose sensitive data in logs
- Use proper error messages without revealing internals
- Follow principle of least privilege

### Performance

- Minimize computation in Lit Actions
- Use efficient data structures
- Cache expensive operations when possible
- Keep tool/policy logic focused and minimal

## 🚫 Common Pitfalls

1. **Using forbidden APIs** - Check Lit Actions constraints
2. **Missing schema validation** - Always validate inputs/outputs
3. **Forgetting build script updates** - New tools won't build
4. **Incorrect import paths** - Use relative paths to dist/
5. **Mock data usage** - Never use fake data in implementations
6. **Environment variable access** - Not available in Lit Actions
7. **State persistence assumptions** - Memory doesn't persist

## 📚 Reference Implementation

Always refer to existing working examples:

- **Tool example**: `vincent-packages/tools/native-send/`
- **Policy example**: `vincent-packages/policies/send-counter-limit/`
- **E2E tests**: `vincent-e2e/src/e2e.ts`
- **Template files**: `src/templates/tool/` and `src/templates/policy/`

## 🆘 When You Need Help

If implementation details are unclear:

1. **DO NOT** create mock or placeholder data
2. **DO NOT** make assumptions about missing information
3. **DO** ask for specific clarification about requirements
4. **DO** provide concrete examples of what information is needed
5. **DO** suggest proper solutions rather than workarounds

Remember: Vincent development requires precision due to blockchain execution constraints. When in doubt, ask for clarification rather than implementing potentially incorrect solutions.
