import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";
import { init } from "@lit-protocol/vincent-scaffold-sdk";
import { PARAMETER_TYPE } from "@lit-protocol/vincent-scaffold-sdk/constants";

// Tools and Policies that we wil be testing
import { vincentPolicyMetadata as greetingLimitPolicyMetadata } from "../../vincent-packages/policies/greeting-limit/dist/src/index.js";
import { bundledVincentTool as helloWorldTool } from "../../vincent-packages/tools/hello-world/dist/src/index.js";

(async () => {
  /**
   * ====================================
   * Initialise the environment
   * ====================================
   */
  const { accounts, chainClient } = await init({
    network: "datil",
  });

  /**
   * ====================================
   * Prepare the tools and policies
   * ====================================
   */
  const helloWorldToolClient = getVincentToolClient({
    bundledVincentTool: helloWorldTool,
    ethersSigner: accounts.delegatee.ethersWallet,
  });

  console.log("helloWorldToolClient:", helloWorldToolClient);
  console.log("✅ [Tool CID]:", helloWorldTool.ipfsCid);

  console.log("greetingLimitPolicyMetadata:", greetingLimitPolicyMetadata);
  console.log("✅ [Policy CID]:", greetingLimitPolicyMetadata.ipfsCid);

  /**
   * ====================================
   * Prepare the IPFS CIDs for the tools and policies
   * NOTE: All arrays below are parallel - each index corresponds to the same tool.
   * When adding a new tool, ensure you add entries to ALL arrays at the same index.
   * ====================================
   */
  const TOOL_IPFS_CIDS = [
    helloWorldTool.ipfsCid,
    // nativeSendTool.ipfsCid,
    // ...add more tool IPFS CIDs here
  ];
  const TOOL_POLICIES = [
    [
      // greetingLimitPolicyMetadata.ipfsCid
    ],
    // [
    //   // greetingLimitPolicyMetadata.ipfsCid
    // ],
  ];

  const TOOL_POLICY_PARAMETER_NAMES = [
    [], // No policy parameter names for helloWorldTool
    // [], // No policy parameter names for nativeSendTool
  ];
  const TOOL_POLICY_PARAMETER_TYPES = [
    [], // No policy parameter types for helloWorldTool
    // [PARAMETER_TYPE.UINT256], // uint256 type ID
  ];

  const TOOL_POLICY_PARAMETER_VALUES = [
    [], // No policy parameter values for helloWorldTool
    // [], // No policy parameter values for nativeSendTool
  ];

  /**
   * ====================================
   * Use the agent wallet PKP owner to mint a Agent Wallet PKP
   * ====================================
   */
  const agentWalletPkp = await accounts.agentWalletPkpOwner.mintAgentWalletPkp({
    toolAndPolicyIpfsCids: [
      helloWorldTool.ipfsCid,
      greetingLimitPolicyMetadata.ipfsCid,
    ],
  });

  console.log("agentWalletPkp:", agentWalletPkp);

  /**
   * ====================================
   * Register Vincent app with delegatee
   * ====================================
   */
  const { appId, appVersion } = await chainClient.registerApp({
    toolIpfsCids: TOOL_IPFS_CIDS,
    toolPolicies: TOOL_POLICIES,
    toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
    toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
  });

  console.log("✅ Vincent app registered:", { appId, appVersion });

  /**
   * ====================================
   * Permit PKP to use the app version
   * ====================================
   */
  await chainClient.permitAppVersion({
    pkpTokenId: agentWalletPkp.tokenId,
    appId,
    appVersion,
    toolIpfsCids: TOOL_IPFS_CIDS,
    policyIpfsCids: TOOL_POLICIES,
    policyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
    policyParameterValues: TOOL_POLICY_PARAMETER_VALUES,
    policyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
  });

  console.log("✅ PKP permitted to use app version");

  /**
   * ====================================
   * Permit auth methods for the agent wallet PKP
   * ====================================
   */
  const permittedAuthMethodsTxHashes =
    await accounts.agentWalletPkpOwner.permittedAuthMethods({
      agentWalletPkp: agentWalletPkp,
      toolAndPolicyIpfsCids: [
        helloWorldTool.ipfsCid,
        greetingLimitPolicyMetadata.ipfsCid,
      ],
    });

  console.log("permittedAuthMethodsTxHashes:", permittedAuthMethodsTxHashes);

  /**
   * ====================================
   * Validate delegatee permissions (debugging)
   * ====================================
   */
  const validation = await chainClient.validateToolExecution({
    delegateeAddress: accounts.delegatee.ethersWallet.address,
    pkpTokenId: agentWalletPkp.tokenId,
    toolIpfsCid: helloWorldTool.ipfsCid,
  });

  console.log("✅ Tool execution validation:", validation);

  if (!validation.isPermitted) {
    throw new Error(
      `❌ Delegatee is not permitted to execute tool for PKP. Validation: ${JSON.stringify(
        validation
      )}`
    );
  }

  /**
   * ====================================
   * It should run prechecks on the helloWorld tool
   * ====================================
   */

  // @ts-ignore - Type instantiation is excessively deep and possibly infinite.ts(2589)
  const precheckRes = await helloWorldToolClient.precheck(
    {
      message: "Hello, world!",
      recipient: "John Doe",
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  // Assert
  if (!precheckRes.success) {
    throw new Error(
      `❌ Precheck failed: ${JSON.stringify(precheckRes, null, 2)}`
    );
  }

  // execute the tool
  // @ts-ignore - Type instantiation is excessively deep and possibly infinite.ts(2589)
  const executeRes = await helloWorldToolClient.execute(
    {
      message: "Hello, world!",
      recipient: "John Doe",
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  // Assert
  if (!executeRes.success) {
    throw new Error(
      `❌ Execute failed: ${JSON.stringify(executeRes, null, 2)}`
    );
  }
  console.log("executeRes:", executeRes);

  process.exit();
})();
