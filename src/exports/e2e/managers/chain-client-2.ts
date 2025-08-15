import { ContractClient } from "@lit-protocol/vincent-contracts-sdk";
import chalk from "chalk";
import { parseEventLogs, encodeAbiParameters } from "viem";

import { DEPLOYMENT_STATUS, MOCK_DATA, PARAMETER_TYPE } from "../constants";
import { createContractsManager } from "./contracts-manager";
import { StateManager } from "./state-manager-2";

// Type definitions
export interface PublicViemClientManager {
  yellowstone: any; // PublicClient type
  base: any; // PublicClient type
}

/**
 * Generates a random app ID
 * @returns A random app ID
 */
function generateRandomAppId(): number {
  return Math.floor(Math.random() * (100_000_000_000 - 10_000_000_000)) + 10_000_000_000;
}

export interface ChainClient {
  registerApp: (params: {
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => Promise<{ appId: number; appVersion: number }>;
  // registerNextAppVersion: (params: {
  //   appId: string;
  //   abilityIpfsCids: string[];
  //   abilityPolicies: string[][];
  //   abilityPolicyParameterNames: string[][];
  //   abilityPolicyParameterTypes: number[][];
  //   abilityPolicyParameterValues?: string[][];
  // }) => Promise<{ appId: string; appVersion: string }>;
  // permitAppVersion: (params: {
  //   pkpTokenId: string;
  //   appId: string;
  //   appVersion: string;
  //   abilityIpfsCids: string[];
  //   policyIpfsCids: string[][];
  //   policyParameterNames: string[][];
  //   policyParameterValues: string[][];
  //   policyParameterTypes: number[][];
  // }) => Promise<{ txHash: string | null; txReceipt: any; skipped?: boolean }>;
  // validateAbilityExecution: (params: {
  //   delegateeAddress: string;
  //   pkpTokenId: string;
  //   abilityIpfsCid: string;
  // }) => Promise<{
  //   isPermitted: boolean;
  //   appId: string;
  //   appVersion: string;
  //   policies: Array<{
  //     policyIpfsCid: string;
  //     parameters: Array<{
  //       name: string;
  //       paramType: number;
  //       value: `0x${string}`;
  //     }>;
  //   }>;
  // }>;
}

export const createVincentRegisterAppFunction = (
  stateManager: StateManager,
  contractClient: ContractClient,
  delegateeAccount: { address: string },
) => {
  return async ({
    abilityIpfsCids,
    abilityPolicies,
  }: {
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => {
    // Set the real configuration hash based on ability/policy CIDs before any state operations
    stateManager.setConfigurationFromCIDs(abilityIpfsCids, abilityPolicies);

    const delegateeAddress = delegateeAccount.address;

    const result = await stateManager.getOrRegisterVincentAppVersioned(
      delegateeAddress,
      async () => {
        const appId = generateRandomAppId();
        const { txHash } = await contractClient.registerApp({
          appId,
          delegateeAddresses: [delegateeAddress],
          versionAbilities: {
            abilityIpfsCids,
            abilityPolicies,
          },
        });

        console.log(chalk.green(` Registered Vincent app: ${appId}`));
        console.log(chalk.green(`    Transaction: ${txHash}`));

        return { appId, appVersion: 1 };
      },
      async (appId: number) => {
        const { txHash, newAppVersion } =
          await contractClient.registerNextVersion({
            appId,
            versionAbilities: {
              abilityIpfsCids,
              abilityPolicies,
            },
          });

        console.log(chalk.green(` Registered Vincent app version: ${appId} v${newAppVersion}`));
        console.log(chalk.green(`    Transaction: ${txHash}`));

        return { appId, appVersion: newAppVersion };
      },
      abilityIpfsCids,
      abilityPolicies,
    );

    await stateManager.saveState();
    return result;
  };
};

// export const createRegisterNextAppVersionFunction = (
//   stateManager: StateManager,
//   appManagerContractsManager: ReturnType<typeof createContractsManager>,
//   publicViemClientManager: PublicViemClientManager
// ) => {
//   return async ({
//     appId,
//     abilityIpfsCids,
//     abilityPolicies,
//     abilityPolicyParameterNames,
//     abilityPolicyParameterTypes,
//     abilityPolicyParameterValues,
//   }: {
//     appId: string;
//     abilityIpfsCids: string[];
//     abilityPolicies: string[][];
//     abilityPolicyParameterNames: string[][];
//     abilityPolicyParameterTypes: number[][];
//     abilityPolicyParameterValues?: string[][];
//   }) => {
//     // Convert 2D arrays to 3D arrays as expected by the smart contract
//     const { names3D, types3D } = convert2DTo3DArrays(
//       abilityIpfsCids,
//       abilityPolicies,
//       abilityPolicyParameterNames,
//       abilityPolicyParameterTypes
//     );

//     const versionAbilities = {
//       abilityIpfsCids,
//       abilityPolicies,
//       abilityPolicyParameterNames: names3D,
//       abilityPolicyParameterTypes: types3D,
//     };

//     const txHash =
//       // @ts-ignore
//       await appManagerContractsManager.app.write.registerNextAppVersion([
//         BigInt(appId),
//         versionAbilities,
//       ]);
//     const txReceipt =
//       await publicViemClientManager.yellowstone.waitForTransactionReceipt({
//         hash: txHash,
//       });

//     const logs = parseEventLogs({
//       abi: appManagerContractsManager.app.abi,
//       logs: txReceipt.logs,
//     });

//     const newAppVersionRegisteredEvent = logs.find(
//       (log) => log.eventName === "NewAppVersionRegistered"
//     );
//     if (!newAppVersionRegisteredEvent || !newAppVersionRegisteredEvent.args) {
//       throw new Error("Failed to find NewAppVersionRegistered event");
//     }

//     const appVersion = (newAppVersionRegisteredEvent.args as any).appVersion.toString();

//     console.log(chalk.green(` Registered Vincent app version: ${appId} v${appVersion}`));
//     console.log(chalk.green(`    Transaction: ${txHash}`));

//     return { appId, appVersion };
//   };
// };

// export const createPermitAppVersionFunction = (
//   stateManager: StateManager,
//   agentWalletPkpOwnerContractsManager: ReturnType<
//     typeof createContractsManager
//   >,
//   publicViemClientManager: PublicViemClientManager
// ) => {
//   return async ({
//     pkpTokenId,
//     appId,
//     appVersion,
//     abilityIpfsCids,
//     policyIpfsCids,
//     policyParameterNames,
//     policyParameterValues,
//     policyParameterTypes,
//   }: {
//     pkpTokenId: string;
//     appId: string;
//     appVersion: string;
//     abilityIpfsCids: string[];
//     policyIpfsCids: string[][];
//     policyParameterNames: string[][];
//     policyParameterValues: string[][];
//     policyParameterTypes: number[][];
//   }) => {
//     if (
//       stateManager.isPKPPermittedForAppVersion(pkpTokenId, appId, appVersion)
//     ) {
//       console.log(
//         chalk.blue(
//           `⏭️  Skipping permitAppVersion - PKP ${pkpTokenId} already permitted for app ${appId} v${appVersion}`
//         )
//       );
//       return { txHash: null, txReceipt: null, skipped: true };
//     }

//     console.log(chalk.yellow(`= Permitting app version for PKP...`));

//     // Convert 2D arrays to 3D arrays as expected by the smart contract
//     // We receive flat lists per ability and need to convert to [ability][policy][parameter]
//     const bytesParameterValues: `0x${string}`[][][] = [];
//     const names3D: string[][][] = [];

//     // For each ability
//     for (let abilityIndex = 0; abilityIndex < abilityIpfsCids.length; abilityIndex++) {
//       const abilityBytesValues: `0x${string}`[][] = [];
//       const abilityNames: string[][] = [];

//       // For each policy in this ability
//       const policies = policyIpfsCids[abilityIndex];
//       for (let policyIndex = 0; policyIndex < policies.length; policyIndex++) {
//         const policyBytesValues: `0x${string}`[] = [];
//         const policyNames: string[] = [];

//         // Handle multiple parameters per policy
//         if (policyParameterValues[abilityIndex] &&
//           policyParameterValues[abilityIndex][policyIndex] !== undefined
//         ) {
//           const abilityParameterValues = policyParameterValues[abilityIndex];
//           const abilityParameterNames = policyParameterNames[abilityIndex];
//           const abilityParameterTypes = policyParameterTypes[abilityIndex];

//           // For each parameter in this policy
//           for (let paramIndex = 0; paramIndex < abilityParameterValues.length; paramIndex++) {
//             const value = abilityParameterValues[paramIndex];
//             const paramName = abilityParameterNames[paramIndex];
//             const paramType = abilityParameterTypes[paramIndex];

//             // Map parameter type ID to ABI type
//             let abiType: string;
//             let encodedValue: any = value;

//             switch (paramType) {
//               case PARAMETER_TYPE.INT256:
//                 abiType = "int256";
//                 encodedValue = BigInt(value);
//                 break;
//               case PARAMETER_TYPE.INT256_ARRAY:
//                 abiType = "int256[]";
//                 encodedValue = JSON.parse(value).map((v: string) => BigInt(v));
//                 break;
//               case PARAMETER_TYPE.UINT256:
//                 abiType = "uint256";
//                 encodedValue = BigInt(value);
//                 break;
//               case PARAMETER_TYPE.UINT256_ARRAY:
//                 abiType = "uint256[]";
//                 encodedValue = JSON.parse(value).map((v: string) => BigInt(v));
//                 break;
//               case PARAMETER_TYPE.BOOL:
//                 abiType = "bool";
//                 encodedValue = value.toLowerCase() === "true";
//                 break;
//               case PARAMETER_TYPE.BOOL_ARRAY:
//                 abiType = "bool[]";
//                 encodedValue = JSON.parse(value).map(
//                   (v: string) => v.toLowerCase() === "true"
//                 );
//                 break;
//               case PARAMETER_TYPE.ADDRESS:
//                 abiType = "address";
//                 encodedValue = value as `0x${string}`;
//                 break;
//               case PARAMETER_TYPE.ADDRESS_ARRAY:
//                 abiType = "address[]";
//                 encodedValue = JSON.parse(value) as `0x${string}`[];
//                 break;
//               case PARAMETER_TYPE.STRING:
//                 abiType = "string";
//                 encodedValue = value;
//                 break;
//               case PARAMETER_TYPE.STRING_ARRAY:
//                 abiType = "string[]";
//                 encodedValue = JSON.parse(value);
//                 break;
//               case PARAMETER_TYPE.BYTES:
//                 abiType = "bytes";
//                 encodedValue = value as `0x${string}`;
//                 break;
//               case PARAMETER_TYPE.BYTES_ARRAY:
//                 abiType = "bytes[]";
//                 encodedValue = JSON.parse(value) as `0x${string}`[];
//                 break;
//               default:
//                 throw new Error(`Unsupported parameter type: ${paramType}`);
//             }

//             // Properly ABI encode the value
//             const encoded = encodeAbiParameters(
//               [{ type: abiType }],
//               [encodedValue]
//             );

//             policyBytesValues.push(encoded);
//             policyNames.push(paramName);
//           }
//         }

//         abilityBytesValues.push(policyBytesValues);
//         abilityNames.push(policyNames);
//       }

//       bytesParameterValues.push(abilityBytesValues);
//       names3D.push(abilityNames);
//     }

//     console.log("🔍 Debug - permitAppVersion args:");
//     console.log("  pkpTokenId:", pkpTokenId);
//     console.log("  appId:", appId);
//     console.log("  appVersion:", appVersion);
//     console.log("  abilityIpfsCids:", abilityIpfsCids);
//     console.log("  policyIpfsCids:", policyIpfsCids);
//     console.log("  policyParameterNames (3D):", names3D);
//     console.log("  bytesParameterValues (3D):", bytesParameterValues);

//     // Log the actual array being passed
//     const args = [
//       BigInt(pkpTokenId),
//       BigInt(appId),
//       BigInt(appVersion),
//       abilityIpfsCids,
//       policyIpfsCids,
//       names3D, // Use 3D array
//       bytesParameterValues,
//     ];

//     // console.log("🔍 Debug - Full args array:", JSON.stringify(args, (key, value) =>
//     //   typeof value === 'bigint' ? value.toString() : value, 2));

//     const txHash =
//       // @ts-ignore
//       await agentWalletPkpOwnerContractsManager.user.write.permitAppVersion(
//         args
//       );

//     const txReceipt =
//       await publicViemClientManager.yellowstone.waitForTransactionReceipt({
//         hash: txHash,
//       });

//     stateManager.savePKPAppPermission(pkpTokenId, appId, appVersion);

//     // Update Vincent app state with parameter values if not already saved
//     stateManager.updateVincentAppParameterValues(appId, policyParameterValues);

//     await stateManager.saveState();

//     console.log(chalk.green(` Permitted app version for PKP: ${pkpTokenId}`));
//     console.log(chalk.green(`    App ID: ${appId}, Version: ${appVersion}`));
//     console.log(chalk.green(`    Transaction: ${txHash}`));

//     return { txHash, txReceipt };
//   };
// };

// export const createValidateAbilityExecutionFunction = (
//   appManagerContractsManager: ReturnType<typeof createContractsManager>
// ) => {
//   return async ({
//     delegateeAddress,
//     pkpTokenId,
//     abilityIpfsCid,
//   }: {
//     delegateeAddress: string;
//     pkpTokenId: string;
//     abilityIpfsCid: string;
//   }) => {
//     console.log(
//       chalk.blue(`=
//  Validating ability execution permissions...`)
//     );

//     const validationResult =
//       (await appManagerContractsManager.userView.read.validateAbilityExecutionAndGetPolicies(
//         [delegateeAddress as `0x${string}`, BigInt(pkpTokenId), abilityIpfsCid]
//       )) as {
//         isPermitted: boolean;
//         appId: bigint;
//         appVersion: bigint;
//         policies: Array<{
//           policyIpfsCid: string;
//           parameters: Array<{
//             name: string;
//             paramType: number;
//             value: `0x${string}`;
//           }>;
//         }>;
//       };

//     console.log(
//       chalk.blue(`   - Is Permitted: ${validationResult.isPermitted}`)
//     );
//     console.log(
//       chalk.blue(`   - App ID: ${validationResult.appId.toString()}`)
//     );
//     console.log(
//       chalk.blue(`   - App Version: ${validationResult.appVersion.toString()}`)
//     );

//     // Convert BigInt values to strings for JSON serialization
//     return {
//       ...validationResult,
//       appId: validationResult.appId.toString(),
//       appVersion: validationResult.appVersion.toString(),
//     };
//   };
// };

// export const createChainClient = (
//   stateManager: StateManager,
//   appManagerContractsManager: ReturnType<typeof createContractsManager>,
//   agentWalletPkpOwnerContractsManager: ReturnType<
//     typeof createContractsManager
//   >,
//   publicViemClientManager: PublicViemClientManager,
//   delegateeAccount: { address: string },
//   deploymentStatus: number
// ): ChainClient => {
//   return {
//     registerApp: createRegisterAppFunction(
//       stateManager,
//       appManagerContractsManager,
//       publicViemClientManager,
//       delegateeAccount,
//       deploymentStatus
//     ),
//     registerNextAppVersion: createRegisterNextAppVersionFunction(
//       stateManager,
//       appManagerContractsManager,
//       publicViemClientManager
//     ),
//     permitAppVersion: createPermitAppVersionFunction(
//       stateManager,
//       agentWalletPkpOwnerContractsManager,
//       publicViemClientManager
//     ),
//     validateAbilityExecution: createValidateAbilityExecutionFunction(
//       appManagerContractsManager
//     ),
//   };
