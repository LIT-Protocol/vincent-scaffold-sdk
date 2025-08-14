import { z } from "zod";
import chalk from "chalk";

// 🧩 Schema definition
const EnvSchema = z.object({
  VINCENT_ADDRESS: z.string().describe("Vincent contract address"),
  PINATA_JWT: z
    .string()
    .min(1)
    .describe(
      "Pinata JWT is required to deploy (pin) the abilities (Lit Actions) to IPFS."
    ),
  TEST_APP_MANAGER_PRIVATE_KEY: z
    .string()
    .min(64)
    .optional()
    .describe("This account manages the Vincent app instance (will be generated if not provided)"),
  TEST_APP_DELEGATEE_PRIVATE_KEY: z
    .string()
    .min(64)
    .optional()
    .describe(
      "This private key belongs to the delegatee who receives delegations from the app (will be generated if not provided)."
    ),
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY: z
    .string()
    .min(64)
    .optional()
    .describe(
      "This private key belongs to the agent wallet PKP owner who owns the agent wallet PKP (will be generated if not provided)."
    ),
  TEST_FUNDER_PRIVATE_KEY: z
    .string()
    .min(64)
    .describe(
      "This private key belongs to the funder who funds the agent wallet."
    ),
  YELLOWSTONE_RPC_URL: z
    .string()
    .describe("Lit Protocol Chronicle Yellowstone RPC Url")
    .default("https://yellowstone-rpc.litprotocol.com/"),
  BASE_RPC_URL: z
    .string()
    .describe("Base RPC Url")
    .default("https://base.llamarpc.com"),

  // OPTIONAL_ANALYTICS_API_KEY: z
  //   .string()
  //   .optional()
  //   .describe(
  //     "API key for analytics. If missing, analytics features will be disabled."
  //   ),
});

// 🧪 Check optional environment vars even before parsing
const optionalWarnings: string[] = [];

for (const [key, schema] of Object.entries(EnvSchema.shape)) {
  const def = (schema as any)._def;
  const isOptional = def.typeName === "ZodOptional";

  if (isOptional && !process.env[key]) {
    optionalWarnings.push(
      `⚠️  Optional env "${key}" is missing. ${def.description ?? ""}`
    );
  }
}

// ✅ Validate required environment variables
const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    chalk.red("❌ Missing or invalid required environment variables:\n")
  );
  parsed.error.issues.forEach((issue) => {
    console.error(chalk.red(`• ${issue.path.join(".")}: ${issue.message}`));
  });

  if (optionalWarnings.length) {
    console.warn(chalk.yellow("\n⚠️ Optional Environment Warnings:"));
    optionalWarnings.forEach((msg) => console.warn(chalk.yellow(msg)));
  }

  console.error(
    chalk.gray("\n🧾 Tip: Check your .env file or environment setup.")
  );
  process.exit(1);
}

const ENV = parsed.data;

if (optionalWarnings.length) {
  console.warn(chalk.yellow("\n⚠️ Optional Environment Warnings:"));
  optionalWarnings.forEach((msg) => console.warn(chalk.yellow(msg)));
}

// 🟢 All required envs present — print them out
console.log(chalk.green("\n✅ Loaded Environment Variables:"));
Object.entries(EnvSchema.shape).forEach(([key]) => {
  let val = ENV[key as keyof typeof ENV];
  if (val && val.length > 128) {
    // Truncate long values for preview
    val = `${val.slice(0, 47)}...`;
  }
  const preview = val || "[not set]";
  console.log(chalk.green(`• ${key} = ${preview}`));
});
console.log("\n----- (env-manager.ts) Environment Variables Loaded \n");

export { ENV };
