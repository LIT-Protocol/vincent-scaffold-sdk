import { createVincentPolicy } from "@lit-protocol/vincent-tool-sdk";
import { checkGreetingLimit } from "./helpers/index";
import {
  commitAllowResultSchema,
  commitDenyResultSchema,
  commitParamsSchema,
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  toolParamsSchema,
  userParamsSchema,
} from "./schemas";

export const vincentPolicy = createVincentPolicy({
  packageName: "{{packageName}}" as const,

  toolParamsSchema,
  userParamsSchema,
  commitParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  commitAllowResultSchema,
  commitDenyResultSchema,

  precheck: async (
    { toolParams, userParams },
    { allow, deny, appId, delegation: { delegatorPkpInfo } }
  ) => {
    console.log("Prechecking greeting limit policy", {
      toolParams,
      userParams,
    });

    // const { message, recipient } = toolParams;
    const { maxGreetings = 10, timeWindowHours = 24 } = userParams;
    const { ethAddress } = delegatorPkpInfo;

    try {
      // Check current greeting count for the user
      const currentCount = await checkGreetingLimit(
        ethAddress,
        timeWindowHours
      );

      if (currentCount >= maxGreetings) {
        const resetTime = Date.now() + timeWindowHours * 60 * 60 * 1000;

        return deny({
          reason: `Greeting limit exceeded. Maximum ${maxGreetings} greetings per ${timeWindowHours} hours.`,
          currentCount,
          maxGreetings,
          resetTime,
        });
      }

      return allow({
        currentCount,
        maxGreetings,
        remainingGreetings: maxGreetings - currentCount,
      });
    } catch (error) {
      console.error("Error in precheck:", error);
      return deny({
        reason: `Policy error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        currentCount: 0,
        maxGreetings,
        resetTime: 0,
      });
    }
  },

  evaluate: async (
    { toolParams, userParams },
    { allow, deny, appId, delegation: { delegatorPkpInfo } }
  ) => {
    console.log("Evaluating greeting limit policy", { toolParams, userParams });

    // const { message, recipient } = toolParams;
    const { maxGreetings = 10, timeWindowHours = 24 } = userParams;
    const { ethAddress } = delegatorPkpInfo;

    const checkGreetingResponse = await Lit.Actions.runOnce(
      { waitForResponse: true, name: "checkGreetingLimit" },
      async () => {
        try {
          const currentCount = await checkGreetingLimit(
            ethAddress,
            timeWindowHours
          );
          const resetTime = Date.now() + timeWindowHours * 60 * 60 * 1000;

          return JSON.stringify({
            status: "success",
            currentCount,
            maxGreetings,
            resetTime,
            remainingGreetings: maxGreetings - currentCount,
          });
        } catch (error) {
          return JSON.stringify({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );

    const parsedResponse = JSON.parse(checkGreetingResponse);
    if (parsedResponse.status === "error") {
      return deny({
        reason: `Error checking greeting limit: ${parsedResponse.error} (evaluate)`,
        currentCount: 0,
        maxGreetings,
        resetTime: 0,
      });
    }

    const { currentCount, resetTime, remainingGreetings } = parsedResponse;

    if (currentCount >= maxGreetings) {
      return deny({
        reason: `Greeting limit exceeded during evaluation. Maximum ${maxGreetings} greetings per ${timeWindowHours} hours.`,
        currentCount,
        maxGreetings,
        resetTime,
      });
    }

    console.log("Evaluated greeting limit policy", {
      currentCount,
      maxGreetings,
      remainingGreetings,
    });

    return allow({
      currentCount,
      maxGreetings,
      remainingGreetings,
    });
  },

  commit: async (
    { currentCount, maxGreetings },
    { allow, appId, delegation: { delegatorPkpInfo } }
  ) => {
    const { ethAddress } = delegatorPkpInfo;

    // In a real implementation, this would record the greeting to a smart contract
    // For this demo, we just simulate successful recording
    console.log(
      `Simulating greeting record for ${ethAddress} (appId: ${appId})`
    );

    console.log("Policy commit successful", {
      ethAddress,
      newCount: currentCount + 1,
      maxGreetings,
    });

    return allow({
      recorded: true,
      newCount: currentCount + 1,
      remainingGreetings: maxGreetings - currentCount - 1,
    });
  },
});
