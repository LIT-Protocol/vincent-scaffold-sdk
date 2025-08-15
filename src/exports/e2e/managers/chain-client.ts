import { ContractClient, PermissionData, ValidateAbilityExecutionAndGetPoliciesResult } from "@lit-protocol/vincent-contracts-sdk";
import chalk from "chalk";

import { StateManager } from "./state-manager";

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
  registerNextAppVersion: (params: {
    appId: number;
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => Promise<{ appId: number; appVersion: number }>;
  permitAppVersion: (params: {
    pkpEthAddress: string;
    appId: number;
    appVersion: number;
    abilityIpfsCids: string[];
    policyIpfsCids: string[][];
  }) => Promise<{ txHash: string | null; skipped?: boolean }>;
  validateAbilityExecution: (params: {
    delegateeAddress: string;
    pkpEthAddress: string;
    abilityIpfsCid: string;
  }) => Promise<ValidateAbilityExecutionAndGetPoliciesResult>;
};

export const createRegisterAppFunction = (
  stateManager: StateManager,
  contractClient: ContractClient,
  delegateeAccount: { address: string },
) => {
  return async ({
    abilityIpfsCids,
    abilityPolicies,
    policyParams,
  }: {
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
    policyParams: PermissionData;
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
      policyParams,
    );

    await stateManager.saveState();
    return result;
  };
};

export const createRegisterNextAppVersionFunction = (
  contractClient: ContractClient,
) => {
  return async ({
    appId,
    abilityIpfsCids,
    abilityPolicies,
  }: {
    appId: number;
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => {
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
  };
};

export const createPermitAppVersionFunction = (
  stateManager: StateManager,
  contractClient: ContractClient,
) => {
  return async ({
    pkpEthAddress,
    appId,
    appVersion,
    abilityIpfsCids,
    policyIpfsCids,
    policyParams,
  }: {
    pkpEthAddress: string;
    appId: number;
    appVersion: number;
    abilityIpfsCids: string[];
    policyIpfsCids: string[][];
    policyParams: PermissionData;
  }) => {
    if (
      stateManager.isPKPPermittedForAppVersion(pkpEthAddress, appId, appVersion)
    ) {
      console.log(
        chalk.blue(
          `⏭️  Skipping permitAppVersion - PKP ${pkpEthAddress} already permitted for app ${appId} v${appVersion}`
        )
      );
      return { txHash: null, skipped: true };
    }

    console.log(chalk.yellow(`= Permitting app version for PKP...`));

    console.log("🔍 Debug - permitAppVersion args:");
    console.log("  pkpEthAddress:", pkpEthAddress);
    console.log("  appId:", appId);
    console.log("  appVersion:", appVersion);
    console.log("  abilityIpfsCids:", abilityIpfsCids);
    console.log("  policyIpfsCids:", policyIpfsCids);
    console.log("  policyParams:", policyParams);

    const { txHash } = await contractClient.permitApp({
      pkpEthAddress,
      appId,
      appVersion,
      permissionData: policyParams,
    });

    stateManager.savePKPAppPermission(pkpEthAddress, appId, appVersion);

    // Update Vincent app state with parameter values if not already saved
    stateManager.updateVincentAppParameterValues(appId, policyParams);

    await stateManager.saveState();

    console.log(chalk.green(` Permitted app version for PKP: ${pkpEthAddress}`));
    console.log(chalk.green(`    App ID: ${appId}, Version: ${appVersion}`));
    console.log(chalk.green(`    Transaction: ${txHash}`));

    return { txHash };
  };
};

export const createValidateAbilityExecutionFunction = (
  contractClient: ContractClient,
) => {
  return async ({
    delegateeAddress,
    pkpEthAddress,
    abilityIpfsCid,
  }: {
    delegateeAddress: string;
    pkpEthAddress: string;
    abilityIpfsCid: string;
  }) => {
    console.log(
      chalk.blue(`=
 Validating ability execution permissions...`)
    );

    const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
      delegateeAddress,
      pkpEthAddress,
      abilityIpfsCid,
    });

    console.log(
      chalk.blue(`   - Is Permitted: ${validationResult.isPermitted}`)
    );
    console.log(
      chalk.blue(`   - App ID: ${validationResult.appId}`)
    );
    console.log(
      chalk.blue(`   - App Version: ${validationResult.appVersion}`)
    );

    return validationResult;
  };
};
