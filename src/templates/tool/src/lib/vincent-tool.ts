import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from "@lit-protocol/vincent-tool-sdk";
import "@lit-protocol/vincent-tool-sdk/internal";
import { bundledVincentPolicy } from "../../../../policies/send-counter-limit/dist/index.js";

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
} from "./schemas";

import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";

const SendLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    to: "to",
    amount: "amount",
  },
});

export const vincentTool = createVincentTool({
  packageName: "{{packageName}}" as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([SendLimitPolicy]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, fail }) => {
    console.log("[{{packageName}}/precheck]");
    console.log("[{{packageName}}/precheck] params:", {
      toolParams,
    });

    const { to, amount } = toolParams;

    // Basic validation without using ethers directly
    if (!to || !to.startsWith("0x") || to.length !== 42) {
      return fail({
        error: "[{{packageName}}/precheck] Invalid recipient address format",
      });
    }

    // Validate the amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return fail({
        error:
          "[{{packageName}}/precheck] Invalid amount format or amount must be greater than 0",
      });
    }

    // Additional validation: check if amount is too large
    const amountFloat = parseFloat(amount);
    if (amountFloat > 1.0) {
      return fail({
        error:
          "[{{packageName}}/precheck] Amount too large (maximum 1.0 ETH per transaction)",
      });
    }

    // Precheck succeeded
    const successResult = {
      addressValid: true,
      amountValid: true,
    };

    console.log("[{{packageName}}/precheck] Success result:", successResult);
    const successResponse = succeed(successResult);
    console.log(
      "[NativeSendTool/precheck] Success response:",
      JSON.stringify(successResponse, null, 2)
    );
    return successResponse;
  },

  execute: async (
    { toolParams },
    { succeed, fail, delegation, policiesContext }
  ) => {
    try {
      const { to, amount } = toolParams;

      console.log("[{{packageName}}/execute] Executing Native Send Tool", {
        to,
        amount,
      });

      // Get provider
      const provider = new ethers.providers.JsonRpcProvider(
  "https://yellowstone-rpc.litprotocol.com/"
);

      // Get PKP public key from delegation context
      const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
      if (!pkpPublicKey) {
        throw new Error("PKP public key not available from delegation context");
      }

      // Execute the native send
      const txHash = await laUtils.transaction.handler.nativeSend({
        provider,
        pkpPublicKey,
        amount,
        to,
      });

      console.log("[{{packageName}}/execute] Native send successful", {
        txHash,
        to,
        amount,
      });

      // Manually call policy commit function using the correct pattern
      console.log(
        "[{{packageName}}/execute] Manually calling policy commit function..."
      );

      try {
        // Use the correct pattern from the reference code
        const sendLimitPolicyContext =
          policiesContext.allowedPolicies[
            "{{policyPackageName}}"
          ];

        if (
          sendLimitPolicyContext &&
          sendLimitPolicyContext.commit &&
          sendLimitPolicyContext.result
        ) {
          console.log(
            "[{{packageName}}/execute] ✅ Found send limit policy context, calling commit..."
          );
          console.log(
            "[{{packageName}}/execute] ✅ Policy evaluation result:",
            sendLimitPolicyContext.result
          );

          // Extract the commit parameters from the policy evaluation results
          const { currentCount, maxSends, remainingSends, timeWindowSeconds } =
            sendLimitPolicyContext.result;
          const commitParams = {
            currentCount,
            maxSends,
            remainingSends,
            timeWindowSeconds,
          };

          console.log(
            "[{{packageName}}/execute] ✅ Available in sendLimitPolicyContext:",
            Object.keys(sendLimitPolicyContext)
          );
          console.log(
            "[{{packageName}}/execute] ✅ Calling commit with explicit parameters (ignoring TS signature)..."
          );

          const commitResult = await sendLimitPolicyContext.commit(
            // @ts-ignore - TypeScript signature is wrong, framework actually expects parameters
            commitParams
          );
          console.log(
            "[{{packageName}}/execute] ✅ Policy commit result:",
            commitResult
          );
        } else {
          console.log(
            "[{{packageName}}/execute] ❌ Send limit policy context not found in policiesContext.allowedPolicies"
          );
          console.log(
            "[{{packageName}}/execute] ❌ Available policies:",
            Object.keys(policiesContext.allowedPolicies || {})
          );
        }
      } catch (commitError) {
        console.error(
          "[{{packageName}}/execute] ❌ Error calling policy commit:",
          commitError
        );
        // Don't fail the transaction if commit fails
      }

      return succeed({
        txHash,
        to,
        amount,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("[{{packageName}}/execute] Native send failed", error);

      return fail({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  },
});
