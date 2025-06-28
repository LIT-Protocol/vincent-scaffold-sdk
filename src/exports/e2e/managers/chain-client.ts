import chalk from "chalk";
import { parseEventLogs, encodeAbiParameters } from "viem";
import { DEPLOYMENT_STATUS, MOCK_DATA, PARAMETER_TYPE } from "../constants";
import { createContractsManager } from "./contracts-manager";
import { StateManager } from "./state-manager";

// Utility function to convert 2D arrays to 3D arrays as expected by smart contracts
function convert2DTo3DArrays(
  toolIpfsCids: string[],
  toolPolicies: string[][],
  toolPolicyParameterNames: string[][],
  toolPolicyParameterTypes: number[][]
): {
  names3D: string[][][];
  types3D: number[][][];
} {
  const names3D: string[][][] = [];
  const types3D: number[][][] = [];

  // For each tool
  for (let toolIndex = 0; toolIndex < toolIpfsCids.length; toolIndex++) {
    const toolNames: string[][] = [];
    const toolTypes: number[][] = [];

    // For each policy in this tool
    const policies = toolPolicies[toolIndex];
    for (
      let policyIndex = 0;
      policyIndex < policies.length;
      policyIndex++
    ) {
      const policyNames: string[] = [];
      const policyTypes: number[] = [];

      // The 2D input structure maps: [tool][parameter] but we need [tool][policy][parameter]
      // Since we have one policy per tool in most cases, we distribute parameters across the policy
      if (
        toolPolicyParameterNames[toolIndex] &&
        toolPolicyParameterTypes[toolIndex]
      ) {
        // For the first (and usually only) policy, add all parameters for this tool
        if (policyIndex === 0) {
          // Add all parameter names and types for this tool to the first policy
          for (let paramIndex = 0; paramIndex < toolPolicyParameterNames[toolIndex].length; paramIndex++) {
            policyNames.push(toolPolicyParameterNames[toolIndex][paramIndex]);
            policyTypes.push(toolPolicyParameterTypes[toolIndex][paramIndex]);
          }
        }
        // For additional policies (if any), they would have empty parameters
        // This matches the expected smart contract structure
      }

      toolNames.push(policyNames);
      toolTypes.push(policyTypes);
    }

    names3D.push(toolNames);
    types3D.push(toolTypes);
  }

  return { names3D, types3D };
}

// Type definitions
export interface PublicViemClientManager {
  yellowstone: any; // PublicClient type
  base: any; // PublicClient type
}

export interface ChainClient {
  registerApp: (params: {
    toolIpfsCids: string[];
    toolPolicies: string[][];
    toolPolicyParameterNames: string[][];
    toolPolicyParameterTypes: number[][];
    toolPolicyParameterValues?: string[][];
  }) => Promise<{ appId: string; appVersion: string }>;
  registerNextAppVersion: (params: {
    appId: string;
    toolIpfsCids: string[];
    toolPolicies: string[][];
    toolPolicyParameterNames: string[][];
    toolPolicyParameterTypes: number[][];
    toolPolicyParameterValues?: string[][];
  }) => Promise<{ appId: string; appVersion: string }>;
  permitAppVersion: (params: {
    pkpTokenId: string;
    appId: string;
    appVersion: string;
    toolIpfsCids: string[];
    policyIpfsCids: string[][];
    policyParameterNames: string[][];
    policyParameterValues: string[][];
    policyParameterTypes: number[][];
  }) => Promise<{ txHash: string | null; txReceipt: any; skipped?: boolean }>;
  validateToolExecution: (params: {
    delegateeAddress: string;
    pkpTokenId: string;
    toolIpfsCid: string;
  }) => Promise<{
    isPermitted: boolean;
    appId: string;
    appVersion: string;
    policies: Array<{
      policyIpfsCid: string;
      parameters: Array<{
        name: string;
        paramType: number;
        value: `0x${string}`;
      }>;
    }>;
  }>;
}

export const createRegisterAppFunction = (
  stateManager: StateManager,
  appManagerContractsManager: ReturnType<typeof createContractsManager>,
  publicViemClientManager: PublicViemClientManager,
  delegateeAccount: { address: string },
  deploymentStatus: number
) => {
  return async ({
    toolIpfsCids,
    toolPolicies,
    toolPolicyParameterNames,
    toolPolicyParameterTypes,
    toolPolicyParameterValues,
  }: {
    toolIpfsCids: string[];
    toolPolicies: string[][];
    toolPolicyParameterNames: string[][];
    toolPolicyParameterTypes: number[][];
    toolPolicyParameterValues?: string[][];
  }) => {
    
    // Set the real configuration hash based on tool/policy CIDs before any state operations
    stateManager.setConfigurationFromCIDs(toolIpfsCids, toolPolicies);
    
    const delegateeAddress = delegateeAccount.address;

    const result = await stateManager.getOrRegisterVincentAppVersioned(
      delegateeAddress,
      async () => {
        // Convert 2D arrays to 3D arrays as expected by the smart contract
        const { names3D, types3D } = convert2DTo3DArrays(
          toolIpfsCids,
          toolPolicies,
          toolPolicyParameterNames,
          toolPolicyParameterTypes
        );

        const versionTools = {
          toolIpfsCids,
          toolPolicies,
          toolPolicyParameterNames: names3D,
          toolPolicyParameterTypes: types3D,
        };


        const txHash =
          // @ts-ignore
          await appManagerContractsManager.app.write.registerApp([
            // AppInfo
            {
              name: MOCK_DATA.APP_NAME,
              description: MOCK_DATA.APP_DESCRIPTION,
              deploymentStatus: deploymentStatus,
              authorizedRedirectUris: MOCK_DATA.AUTHORIZED_REDIRECT_URIS,
              delegatees: [delegateeAddress as `0x${string}`],
            },
            // VersionTools
            versionTools,
          ]);

        const txReceipt =
          await publicViemClientManager.yellowstone.waitForTransactionReceipt({
            hash: txHash,
          });

        const logs = parseEventLogs({
          abi: appManagerContractsManager.app.abi,
          logs: txReceipt.logs,
        });

        const newAppRegisteredEvent = logs.find(
          (log) => log.eventName === "NewAppRegistered"
        );
        if (!newAppRegisteredEvent || !newAppRegisteredEvent.args) {
          throw new Error("Failed to find NewAppRegistered event");
        }

        const appId = (newAppRegisteredEvent.args as any).appId.toString();
        const appVersion = "1";

        console.log(chalk.green(` Registered Vincent app: ${appId}`));
        console.log(chalk.green(`    Transaction: ${txHash}`));

        return { appId, appVersion };
      },
      async (appId: string) => {
        // Register next app version for existing app when tools/policies change
        // Convert 2D arrays to 3D arrays as expected by the smart contract
        const { names3D, types3D } = convert2DTo3DArrays(
          toolIpfsCids,
          toolPolicies,
          toolPolicyParameterNames,
          toolPolicyParameterTypes
        );

        const versionTools = {
          toolIpfsCids,
          toolPolicies,
          toolPolicyParameterNames: names3D,
          toolPolicyParameterTypes: types3D,
        };


        const txHash =
          // @ts-ignore
          await appManagerContractsManager.app.write.registerNextAppVersion([
            BigInt(appId),
            versionTools,
          ]);

        const txReceipt =
          await publicViemClientManager.yellowstone.waitForTransactionReceipt({
            hash: txHash,
          });

        const logs = parseEventLogs({
          abi: appManagerContractsManager.app.abi,
          logs: txReceipt.logs,
        });

        const newAppVersionRegisteredEvent = logs.find(
          (log) => log.eventName === "NewAppVersionRegistered"
        );
        if (!newAppVersionRegisteredEvent || !newAppVersionRegisteredEvent.args) {
          throw new Error("Failed to find NewAppVersionRegistered event");
        }

        const appVersion = (newAppVersionRegisteredEvent.args as any).appVersion.toString();

        console.log(chalk.green(` Registered Vincent app version: ${appId} v${appVersion}`));
        console.log(chalk.green(`    Transaction: ${txHash}`));

        return { appId, appVersion };
      },
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes,
      toolPolicyParameterValues
    );

    await stateManager.saveState();
    return result;
  };
};

export const createRegisterNextAppVersionFunction = (
  stateManager: StateManager,
  appManagerContractsManager: ReturnType<typeof createContractsManager>,
  publicViemClientManager: PublicViemClientManager
) => {
  return async ({
    appId,
    toolIpfsCids,
    toolPolicies,
    toolPolicyParameterNames,
    toolPolicyParameterTypes,
    toolPolicyParameterValues,
  }: {
    appId: string;
    toolIpfsCids: string[];
    toolPolicies: string[][];
    toolPolicyParameterNames: string[][];
    toolPolicyParameterTypes: number[][];
    toolPolicyParameterValues?: string[][];
  }) => {
    // Convert 2D arrays to 3D arrays as expected by the smart contract
    const { names3D, types3D } = convert2DTo3DArrays(
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes
    );

    const versionTools = {
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames: names3D,
      toolPolicyParameterTypes: types3D,
    };

    const txHash =
      // @ts-ignore
      await appManagerContractsManager.app.write.registerNextAppVersion([
        BigInt(appId),
        versionTools,
      ]);
    const txReceipt =
      await publicViemClientManager.yellowstone.waitForTransactionReceipt({
        hash: txHash,
      });

    const logs = parseEventLogs({
      abi: appManagerContractsManager.app.abi,
      logs: txReceipt.logs,
    });

    const newAppVersionRegisteredEvent = logs.find(
      (log) => log.eventName === "NewAppVersionRegistered"
    );
    if (!newAppVersionRegisteredEvent || !newAppVersionRegisteredEvent.args) {
      throw new Error("Failed to find NewAppVersionRegistered event");
    }

    const appVersion = (newAppVersionRegisteredEvent.args as any).appVersion.toString();

    console.log(chalk.green(` Registered Vincent app version: ${appId} v${appVersion}`));
    console.log(chalk.green(`    Transaction: ${txHash}`));

    return { appId, appVersion };
  };
};

export const createPermitAppVersionFunction = (
  stateManager: StateManager,
  agentWalletPkpOwnerContractsManager: ReturnType<
    typeof createContractsManager
  >,
  publicViemClientManager: PublicViemClientManager
) => {
  return async ({
    pkpTokenId,
    appId,
    appVersion,
    toolIpfsCids,
    policyIpfsCids,
    policyParameterNames,
    policyParameterValues,
    policyParameterTypes,
  }: {
    pkpTokenId: string;
    appId: string;
    appVersion: string;
    toolIpfsCids: string[];
    policyIpfsCids: string[][];
    policyParameterNames: string[][];
    policyParameterValues: string[][];
    policyParameterTypes: number[][];
  }) => {
    if (
      stateManager.isPKPPermittedForAppVersion(pkpTokenId, appId, appVersion)
    ) {
      console.log(
        chalk.blue(
          `⏭️  Skipping permitAppVersion - PKP ${pkpTokenId} already permitted for app ${appId} v${appVersion}`
        )
      );
      return { txHash: null, txReceipt: null, skipped: true };
    }

    console.log(chalk.yellow(`= Permitting app version for PKP...`));

    // Convert 2D arrays to 3D arrays as expected by the smart contract
    // We receive flat lists per tool and need to convert to [tool][policy][parameter]
    const bytesParameterValues: `0x${string}`[][][] = [];
    const names3D: string[][][] = [];

    // For each tool
    for (let toolIndex = 0; toolIndex < toolIpfsCids.length; toolIndex++) {
      const toolBytesValues: `0x${string}`[][] = [];
      const toolNames: string[][] = [];

      // For each policy in this tool
      const policies = policyIpfsCids[toolIndex];
      for (let policyIndex = 0; policyIndex < policies.length; policyIndex++) {
        const policyBytesValues: `0x${string}`[] = [];
        const policyNames: string[] = [];

        // In the 2D structure, we assume one parameter per policy
        if (
          policyParameterValues[toolIndex] &&
          policyParameterValues[toolIndex][policyIndex] !== undefined
        ) {
          const value = policyParameterValues[toolIndex][policyIndex];
          const paramName = policyParameterNames[toolIndex][policyIndex];
          const paramType = policyParameterTypes[toolIndex][policyIndex];

          // console.log(`🔍 Encoding - tool:${toolIndex}, policy:${policyIndex}`);
          // console.log(`🔍 Encoding - value: "${value}"`);
          // console.log(`🔍 Encoding - paramType: ${paramType}`);

          // Map parameter type ID to ABI type
          let abiType: string;
          let encodedValue: any = value;

          switch (paramType) {
            case PARAMETER_TYPE.INT256:
              abiType = "int256";
              encodedValue = BigInt(value);
              break;
            case PARAMETER_TYPE.INT256_ARRAY:
              abiType = "int256[]";
              encodedValue = JSON.parse(value).map((v: string) => BigInt(v));
              break;
            case PARAMETER_TYPE.UINT256:
              abiType = "uint256";
              encodedValue = BigInt(value);
              break;
            case PARAMETER_TYPE.UINT256_ARRAY:
              abiType = "uint256[]";
              encodedValue = JSON.parse(value).map((v: string) => BigInt(v));
              break;
            case PARAMETER_TYPE.BOOL:
              abiType = "bool";
              encodedValue = value.toLowerCase() === "true";
              break;
            case PARAMETER_TYPE.BOOL_ARRAY:
              abiType = "bool[]";
              encodedValue = JSON.parse(value).map(
                (v: string) => v.toLowerCase() === "true"
              );
              break;
            case PARAMETER_TYPE.ADDRESS:
              abiType = "address";
              encodedValue = value as `0x${string}`;
              break;
            case PARAMETER_TYPE.ADDRESS_ARRAY:
              abiType = "address[]";
              encodedValue = JSON.parse(value) as `0x${string}`[];
              break;
            case PARAMETER_TYPE.STRING:
              abiType = "string";
              encodedValue = value;
              break;
            case PARAMETER_TYPE.STRING_ARRAY:
              abiType = "string[]";
              encodedValue = JSON.parse(value);
              break;
            case PARAMETER_TYPE.BYTES:
              abiType = "bytes";
              encodedValue = value as `0x${string}`;
              break;
            case PARAMETER_TYPE.BYTES_ARRAY:
              abiType = "bytes[]";
              encodedValue = JSON.parse(value) as `0x${string}`[];
              break;
            default:
              throw new Error(`Unsupported parameter type: ${paramType}`);
          }

          // Properly ABI encode the value
          const encoded = encodeAbiParameters(
            [{ type: abiType }],
            [encodedValue]
          );

          policyBytesValues.push(encoded);
          policyNames.push(paramName);
        }

        toolBytesValues.push(policyBytesValues);
        toolNames.push(policyNames);
      }

      bytesParameterValues.push(toolBytesValues);
      names3D.push(toolNames);
    }

    console.log("🔍 Debug - permitAppVersion args:");
    console.log("  pkpTokenId:", pkpTokenId);
    console.log("  appId:", appId);
    console.log("  appVersion:", appVersion);
    console.log("  toolIpfsCids:", toolIpfsCids);
    console.log("  policyIpfsCids:", policyIpfsCids);
    console.log("  policyParameterNames (3D):", names3D);
    console.log("  bytesParameterValues (3D):", bytesParameterValues);

    // Log the actual array being passed
    const args = [
      BigInt(pkpTokenId),
      BigInt(appId),
      BigInt(appVersion),
      toolIpfsCids,
      policyIpfsCids,
      names3D, // Use 3D array
      bytesParameterValues,
    ];

    // console.log("🔍 Debug - Full args array:", JSON.stringify(args, (key, value) =>
    //   typeof value === 'bigint' ? value.toString() : value, 2));

    const txHash =
      // @ts-ignore
      await agentWalletPkpOwnerContractsManager.user.write.permitAppVersion(
        args
      );

    const txReceipt =
      await publicViemClientManager.yellowstone.waitForTransactionReceipt({
        hash: txHash,
      });

    stateManager.savePKPAppPermission(pkpTokenId, appId, appVersion);

    // Update Vincent app state with parameter values if not already saved
    stateManager.updateVincentAppParameterValues(appId, policyParameterValues);

    await stateManager.saveState();

    console.log(chalk.green(` Permitted app version for PKP: ${pkpTokenId}`));
    console.log(chalk.green(`    App ID: ${appId}, Version: ${appVersion}`));
    console.log(chalk.green(`    Transaction: ${txHash}`));

    return { txHash, txReceipt };
  };
};

export const createValidateToolExecutionFunction = (
  appManagerContractsManager: ReturnType<typeof createContractsManager>
) => {
  return async ({
    delegateeAddress,
    pkpTokenId,
    toolIpfsCid,
  }: {
    delegateeAddress: string;
    pkpTokenId: string;
    toolIpfsCid: string;
  }) => {
    console.log(
      chalk.blue(`=
 Validating tool execution permissions...`)
    );

    const validationResult =
      (await appManagerContractsManager.userView.read.validateToolExecutionAndGetPolicies(
        [delegateeAddress as `0x${string}`, BigInt(pkpTokenId), toolIpfsCid]
      )) as {
        isPermitted: boolean;
        appId: bigint;
        appVersion: bigint;
        policies: Array<{
          policyIpfsCid: string;
          parameters: Array<{
            name: string;
            paramType: number;
            value: `0x${string}`;
          }>;
        }>;
      };

    console.log(
      chalk.blue(`   - Is Permitted: ${validationResult.isPermitted}`)
    );
    console.log(
      chalk.blue(`   - App ID: ${validationResult.appId.toString()}`)
    );
    console.log(
      chalk.blue(`   - App Version: ${validationResult.appVersion.toString()}`)
    );

    // Convert BigInt values to strings for JSON serialization
    return {
      ...validationResult,
      appId: validationResult.appId.toString(),
      appVersion: validationResult.appVersion.toString(),
    };
  };
};

export const createChainClient = (
  stateManager: StateManager,
  appManagerContractsManager: ReturnType<typeof createContractsManager>,
  agentWalletPkpOwnerContractsManager: ReturnType<
    typeof createContractsManager
  >,
  publicViemClientManager: PublicViemClientManager,
  delegateeAccount: { address: string },
  deploymentStatus: number
): ChainClient => {
  return {
    registerApp: createRegisterAppFunction(
      stateManager,
      appManagerContractsManager,
      publicViemClientManager,
      delegateeAccount,
      deploymentStatus
    ),
    registerNextAppVersion: createRegisterNextAppVersionFunction(
      stateManager,
      appManagerContractsManager,
      publicViemClientManager
    ),
    permitAppVersion: createPermitAppVersionFunction(
      stateManager,
      agentWalletPkpOwnerContractsManager,
      publicViemClientManager
    ),
    validateToolExecution: createValidateToolExecutionFunction(
      appManagerContractsManager
    ),
  };
};
