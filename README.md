# Vincent Scaffold SDK

# Prerequisite

- Foundry

# Getting started

```bash
npx @lit-protocol/vincent-scaffold-sdk
```

Then:

1. Copy `.env.vincent-sample` to `.env` and fill in your values
2. Run `npm install` to install dependencies
3. Run `npm run vincent:build` to build the default examples
4. Run `npm run vincent:e2e` to test your Vincent projects

Optional (Requires [Foundry](https://getfoundry.sh/)):

5. Run `npm run vincent:forge:init`

# AI Context

- Tools and Policies are executed on Lit Action. It doesn't have globalThis, process.env and it doesn't persist states in the memory. It must either use smart contract for chain states or third party services.