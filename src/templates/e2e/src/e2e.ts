import {
  createAppConfig,
  init,
  suppressLitLogs,
} from "@lit-protocol/vincent-scaffold-sdk/e2e";
import type { PermissionData } from "@lit-protocol/vincent-contracts-sdk";

// Apply log suppression FIRST, before any imports that might trigger logs
suppressLitLogs(false);

import { getVincentAbilityClient } from "@lit-protocol/vincent-app-sdk/abilityClient";
// Abilities and Policies that we wil be testing
import { vincentPolicyMetadata as sendLimitPolicyMetadata } from "../../vincent-packages/policies/send-counter-limit/dist/index.js";
import { bundledVincentAbility as nativeSendAbility } from "../../vincent-packages/abilities/native-send/dist/index.js";

(async () => {
  /**
   * ====================================
   * Initialise the environment
   * ====================================
   */
  const { accounts } = await init({
    network: "datil",
    deploymentStatus: "dev",
  });

  /**
   * ====================================
   * (🫵 You) Prepare the abilities and policies
   * ====================================
   */
  const nativeSendAbilityClient = getVincentAbilityClient({
    bundledVincentAbility: nativeSendAbility,
    ethersSigner: accounts.delegatee.ethersWallet,
  });

  /**
   * ====================================
   * Define permission data for abilities and policies
   * ❗️If you change the policy parameter values, you will need to reset the state file.
   * You can do this by running: npm run vincent:reset
   * ====================================
   */
  const PERMISSION_DATA: PermissionData = {
    [nativeSendAbility.ipfsCid]: {
      [sendLimitPolicyMetadata.ipfsCid]: {
        maxSends: 2n,
        timeWindowSeconds: 10n,
      },
    },
    // Add more abilities and their policies here:
    // [anotherAbility.ipfsCid]: {
    //   [anotherPolicy.ipfsCid]: {
    //     paramName: value,
    //   },
    // },
  };

  const appConfig = createAppConfig(
    {
      permissionData: PERMISSION_DATA,
    },
    // Debugging options
    {
      cidToNameMap: {
        // [helloWorldAbility.ipfsCid]: "Hello World Ability",
        [nativeSendAbility.ipfsCid]: "Native Send Ability",
        [sendLimitPolicyMetadata.ipfsCid]: "Send Limit Policy",
      },
      debug: true,
    }
  );

  /**
   * Collect all IPFS CIDs for abilities and policies that need to be:
   * 1. Authorised during agent wallet PKP minting
   * 2. Permitted as authentication methods for the PKP
   */
  const abilityAndPolicyIpfsCids = [
    // helloWorldAbility.ipfsCid,
    nativeSendAbility.ipfsCid,
    sendLimitPolicyMetadata.ipfsCid,
  ];

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) mint an Agent Wallet PKP
   * ====================================
   */
  const agentWalletPkp = await accounts.agentWalletPkpOwner.mintAgentWalletPkp({
    abilityAndPolicyIpfsCids: abilityAndPolicyIpfsCids,
  });

  console.log("🤖 Agent Wallet PKP:", agentWalletPkp);

  /**
   * ====================================
   * 🦹‍♀️ (App Manager Account) Register Vincent app with delegatee
   * ====================================
   */
  const { appId, appVersion } = await accounts.appManager.registerApp({
    abilityIpfsCids: appConfig.ABILITY_IPFS_CIDS,
    abilityPolicies: appConfig.ABILITY_POLICIES,
    policyParams: appConfig.PERMISSION_DATA,
  });

  console.log("✅ Vincent app registered:", { appId, appVersion });

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) Permit PKP to use the app version
   * ====================================
   */
  await accounts.agentWalletPkpOwner.permitAppVersion({
    pkpEthAddress: agentWalletPkp.ethAddress,
    appId,
    appVersion,
    abilityIpfsCids: appConfig.ABILITY_IPFS_CIDS,
    policyIpfsCids: appConfig.ABILITY_POLICIES,
    policyParams: appConfig.PERMISSION_DATA,
  });

  console.log("✅ PKP permitted to use app version");

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) Permit auth methods for the agent wallet PKP
   * ====================================
   */
  const permittedAuthMethodsTxHashes =
    await accounts.agentWalletPkpOwner.permittedAuthMethods({
      agentWalletPkp: agentWalletPkp,
      abilityAndPolicyIpfsCids: abilityAndPolicyIpfsCids,
    });

  console.log(
    "✅ Permitted Auth Methods Tx hashes:",
    permittedAuthMethodsTxHashes
  );

  /**
   * ====================================
   * 🦹‍♀️ (App Manager Account) Validate delegatee permissions
   * ====================================
   */
  const validation = await accounts.appManager.validateAbilityExecution({
    delegateeAddress: accounts.delegatee.ethersWallet.address,
    pkpEthAddress: agentWalletPkp.ethAddress,
    abilityIpfsCid: nativeSendAbility.ipfsCid,
  });

  console.log("✅ Ability execution validation:", validation);

  if (!validation.isPermitted) {
    throw new Error(
      `❌ Delegatee is not permitted to execute ability for PKP. Validation: ${JSON.stringify(
        validation
      )}`
    );
  }

  /**
   * ====================================
   * Test your abilities and policies here
   * ====================================
   *
   * This section is where you validate that your custom abilities and policies
   * work together as expected.
   *
   * Replace this example with tests relevant to your abilities and policies.
   * ====================================
   */
  console.log("🧪 Testing send limit policy");

  // Array to collect transaction hashes from successful executions
  const transactionHashes: string[] = [];

  const TEST_ABILITY_PARAMS = {
    to: accounts.delegatee.ethersWallet.address,
    amount: "0.00001",
    rpcUrl: "https://yellowstone-rpc.litprotocol.com/",
  };

  const precheck = async () => {
    return await nativeSendAbilityClient.precheck(TEST_ABILITY_PARAMS, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  const execute = async () => {
    return await nativeSendAbilityClient.execute(TEST_ABILITY_PARAMS, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });
  };

  // ----------------------------------------
  // Test 1: First send should succeed
  // ----------------------------------------
  console.log("(PRECHECK-TEST-1) First send (should succeed)");
  const nativeSendPrecheckRes1 = await precheck();

  console.log("(PRECHECK-RES[1]): ", nativeSendPrecheckRes1);

  if (!nativeSendPrecheckRes1.success) {
    throw new Error(
      `❌ First precheck should succeed: ${JSON.stringify(
        nativeSendPrecheckRes1
      )}`
    );
  }

  console.log("(EXECUTE-TEST-1) First send (should succeed)");
  const executeRes1 = await execute();

  console.log("(EXECUTE-RES[1]): ", executeRes1);

  if (!executeRes1.success) {
    throw new Error(
      `❌ First execute should succeed: ${JSON.stringify(executeRes1)}`
    );
  }

  // Collect transaction hash if successful
  if (executeRes1.success && executeRes1.result?.txHash) {
    transactionHashes.push(executeRes1.result.txHash);
  }

  console.log("(✅ EXECUTE-TEST-1) First send completed successfully");

  // ----------------------------------------
  // Test 2: Second send should succeed
  // ----------------------------------------
  console.log("(PRECHECK-TEST-2) Second send (should succeed)");
  const nativeSendPrecheckRes2 = await precheck();

  console.log("(PRECHECK-RES[2]): ", nativeSendPrecheckRes2);

  if (!nativeSendPrecheckRes2.success) {
    throw new Error(
      `❌ (PRECHECK-TEST-2) Second precheck should succeed: ${JSON.stringify(
        nativeSendPrecheckRes2
      )}`
    );
  }

  const executeRes2 = await execute();

  console.log("(EXECUTE-RES[2]): ", executeRes2);

  if (!executeRes2.success) {
    throw new Error(
      `❌ (EXECUTE-TEST-2) Second execute should succeed: ${JSON.stringify(
        executeRes2
      )}`
    );
  }

  // Collect transaction hash if successful
  if (executeRes2.success && executeRes2.result?.txHash) {
    transactionHashes.push(executeRes2.result.txHash);
  }

  console.log("(✅ EXECUTE-TEST-2) Second send completed successfully");

  // ----------------------------------------
  // Test 3: Third send should fail (limit exceeded)
  // ----------------------------------------
  console.log("(PRECHECK-TEST-3) Third send (should fail - limit exceeded)");
  const nativeSendPrecheckRes3 = await precheck();

  console.log("(PRECHECK-RES[3]): ", nativeSendPrecheckRes3);

  if (nativeSendPrecheckRes3.success) {
    console.log(
      "✅ (PRECHECK-TEST-3) Third precheck succeeded (expected - precheck only validates ability parameters)"
    );

    // Test if execution is properly blocked by policy
    console.log(
      "🧪 (EXECUTE-TEST-3) Testing if execution is blocked by policy (this is where enforcement happens)..."
    );

    const executeRes3 = await execute();

    console.log("(EXECUTE-RES[3]): ", executeRes3);

    if (executeRes3.success) {
      // Collect hash if unexpectedly successful
      if (executeRes3.result?.txHash) {
        transactionHashes.push(executeRes3.result.txHash);
      }
      throw new Error(
        "❌ (EXECUTE-TEST-3) CRITICAL: Third execution should have been blocked by policy but succeeded!"
      );
    } else {
      console.log(
        "✅ (EXECUTE-TEST-3) PERFECT: Third execution correctly blocked by send limit policy!"
      );
      console.log(
        "🎉 (EXECUTE-TEST-3) SEND LIMIT POLICY SYSTEM WORKING CORRECTLY!"
      );
      console.log(
        "📊 (EXECUTE-TEST-3) Policy properly enforced: 2 sends allowed, 3rd send blocked"
      );
    }
  } else {
    console.log(
      "🟨 (PRECHECK-TEST-3) Third send precheck failed (unexpected but also fine)"
    );
    console.log("🎉 (PRECHECK-TEST-3) POLICY ENFORCEMENT WORKING!");
  }

  // Print all collected transaction hashes
  console.log("\n" + "=".repeat(50));
  console.log("📋 SUMMARY: COLLECTED TRANSACTION HASHES");
  console.log("=".repeat(50));

  if (transactionHashes.length > 0) {
    transactionHashes.forEach((hash, index) => {
      console.log(`${index + 1}. ${hash}`);
    });
    console.log(
      `\n✅ Total successful transactions: ${transactionHashes.length}`
    );
  } else {
    console.log("❌ No transaction hashes collected");
  }

  console.log("=".repeat(50));

  process.exit();
})();
