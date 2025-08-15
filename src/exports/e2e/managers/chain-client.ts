import chalk from "chalk";
import { parseEventLogs } from "viem";
import { createContractsManager } from "./contracts-manager";
import { StateManager } from "./state-manager";


// Type definitions
export interface PublicViemClientManager {
  yellowstone: any; // PublicClient type
  base: any; // PublicClient type
}

export interface ChainClient {
  registerApp: (params: {
    appId: string;
    delegatees: string[];
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => Promise<{ appId: string; appVersion: string }>;
  registerNextAppVersion: (params: {
    appId: string;
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => Promise<{ appId: string; appVersion: string }>;
  permitAppVersion: (params: {
    pkpTokenId: string;
    appId: string;
    appVersion: string;
    abilityIpfsCids: string[];
    policyIpfsCids: string[][];
    policyParameterValues: `0x${string}`[][];
  }) => Promise<{ txHash: string | null; txReceipt: any; skipped?: boolean }>;
  validateAbilityExecution: (params: {
    delegateeAddress: string;
    pkpTokenId: string;
    abilityIpfsCid: string;
  }) => Promise<{
    isPermitted: boolean;
    appId: string;
    appVersion: string;
    policies: Array<{
      policyIpfsCid: string;
      policyParameterValues: `0x${string}`;
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
    appId,
    delegatees,
    abilityIpfsCids,
    abilityPolicies,
  }: {
    appId: string;
    delegatees: string[];
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => {

    // Set the real configuration hash based on ability/policy CIDs before any state operations
    stateManager.setConfigurationFromCIDs(abilityIpfsCids, abilityPolicies);

    const delegateeAddress = delegateeAccount.address;

    const result = await stateManager.getOrRegisterVincentAppVersioned(
      delegateeAddress,
      async () => {
        const versionAbilities = {
          abilityIpfsCids,
          abilityPolicies,
        };

        const txHash =
          // @ts-ignore
          await appManagerContractsManager.app.write.registerApp([
            BigInt(appId),
            delegatees as `0x${string}`[],
            versionAbilities,
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
        // Register next app version for existing app when abilities/policies change
        const versionAbilities = {
          abilityIpfsCids,
          abilityPolicies,
        };

        const txHash =
          // @ts-ignore
          await appManagerContractsManager.app.write.registerNextAppVersion([
            BigInt(appId),
            versionAbilities,
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
      abilityIpfsCids,
      abilityPolicies
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
    abilityIpfsCids,
    abilityPolicies,
  }: {
    appId: string;
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
  }) => {
    const versionAbilities = {
      abilityIpfsCids,
      abilityPolicies,
    };

    const txHash =
      // @ts-ignore
      await appManagerContractsManager.app.write.registerNextAppVersion([
        BigInt(appId),
        versionAbilities,
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
    abilityIpfsCids,
    policyIpfsCids,
    policyParameterValues,
  }: {
    pkpTokenId: string;
    appId: string;
    appVersion: string;
    abilityIpfsCids: string[];
    policyIpfsCids: string[][];
    policyParameterValues: `0x${string}`[][];
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

    console.log("🔍 Debug - permitAppVersion args:");
    console.log("  pkpTokenId:", pkpTokenId);
    console.log("  appId:", appId);
    console.log("  appVersion:", appVersion);
    console.log("  abilityIpfsCids:", abilityIpfsCids);
    console.log("  policyIpfsCids:", policyIpfsCids);
    console.log("  policyParameterValues:", policyParameterValues);

    const txHash =
      // @ts-ignore
      await agentWalletPkpOwnerContractsManager.user.write.permitAppVersion([
        BigInt(pkpTokenId),
        BigInt(appId),
        BigInt(appVersion),
        abilityIpfsCids,
        policyIpfsCids,
        policyParameterValues,
      ]);

    const txReceipt =
      await publicViemClientManager.yellowstone.waitForTransactionReceipt({
        hash: txHash,
      });

    stateManager.savePKPAppPermission(pkpTokenId, appId, appVersion);
    await stateManager.saveState();

    console.log(chalk.green(` Permitted app version for PKP: ${pkpTokenId}`));
    console.log(chalk.green(`    App ID: ${appId}, Version: ${appVersion}`));
    console.log(chalk.green(`    Transaction: ${txHash}`));

    return { txHash, txReceipt };
  };
};

export const createValidateAbilityExecutionFunction = (
  appManagerContractsManager: ReturnType<typeof createContractsManager>
) => {
  return async ({
    delegateeAddress,
    pkpTokenId,
    abilityIpfsCid,
  }: {
    delegateeAddress: string;
    pkpTokenId: string;
    abilityIpfsCid: string;
  }) => {
    console.log(
      chalk.blue(`=
 Validating ability execution permissions...`)
    );

    const validationResult =
      (await appManagerContractsManager.userView.read.validateAbilityExecutionAndGetPolicies(
        [delegateeAddress as `0x${string}`, BigInt(pkpTokenId), abilityIpfsCid]
      )) as {
        isPermitted: boolean;
        appId: number;
        appVersion: number;
        policies: Array<{
          policyIpfsCid: string;
          policyParameterValues: `0x${string}`;
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
    validateAbilityExecution: createValidateAbilityExecutionFunction(
      appManagerContractsManager
    ),
  };
};
