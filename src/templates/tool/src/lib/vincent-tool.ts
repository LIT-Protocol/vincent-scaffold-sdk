import {
  createVincentTool,
  supportedPoliciesForTool,
  createVincentToolPolicy,
} from "@lit-protocol/vincent-tool-sdk";
// Required for TypeScript type inference - imports helper types without creating unused variables
import "@lit-protocol/vincent-tool-sdk/internal";

// When published
// import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-greeting-limit';

// Use local
// import { bundledVincentPolicy } from "../../../../policies/send-limit/dist/generated/vincent-bundled-policy.js";

import { createHelloWorldGreeting } from "./helpers/index";
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
} from "./schemas";

// const GreetingLimitPolicy = createVincentToolPolicy({
//   toolParamsSchema,
//   bundledVincentPolicy,
//   toolParameterMappings: {
//     message: 'message',
//     recipient: 'recipient',
//   },
// });

export const vincentTool = createVincentTool({
  packageName: "{{packageName}}" as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([
    // GreetingLimitPolicy
  ]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, fail }) => {
    const { message, recipient } = toolParams;

    // Validate the message
    if (!message || message.trim().length === 0) {
      return fail({ error: "Message cannot be empty" });
    }

    if (message.length > 280) {
      return fail({ error: "Message too long (maximum 280 characters)" });
    }

    // Precheck succeeded
    return succeed({
      messageValid: true,
      recipientProvided: !!recipient,
    });
  },

  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
    try {
      const { message, recipient } = toolParams;

      console.log("Executing Hello World Tool", { message, recipient });

      // Create the greeting using our helper function
      const greeting = createHelloWorldGreeting(message, recipient);

      console.log("Tool execution successful", { greeting });

      let policyCommitResult: string | undefined;

      // // Check if greeting limit policy is enabled and commit if so
      // const greetingLimitPolicyContext =
      //   policiesContext.allowedPolicies['@lit-protocol/vincent-policy-greeting-limit'];

      // if (greetingLimitPolicyContext !== undefined) {
      //   const { currentCount, maxGreetings, remainingGreetings } = greetingLimitPolicyContext.result;

      //   const commitResult = await greetingLimitPolicyContext.commit({
      //     currentCount,
      //     maxGreetings,
      //     remainingGreetings,
      //   });

      //   console.log('Greeting limit policy commit result', JSON.stringify(commitResult));

      //   if (commitResult.allow) {
      //     policyCommitResult = `Greeting recorded. ${commitResult.result.remainingGreetings} greetings remaining.`;
      //   } else {
      //     return fail(
      //       commitResult.error ?? 'Unknown error occurred while committing greeting limit policy',
      //     );
      //   }

      //   console.log(
      //     `Committed greeting limit policy. New count: ${commitResult.result.newCount} (HelloWorldToolExecute)`,
      //   );
      // }

      return succeed({
        greeting,
        timestamp: Date.now(),
        messageLength: message.length,
        policyCommitResult,
      });
    } catch (error) {
      console.error("Tool execution failed", error);

      return fail({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  },
});
