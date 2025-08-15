import { LIT_NETWORK } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { getClient } from "@lit-protocol/vincent-contracts-sdk";
import { ethers } from "ethers";
import { BASE_CHAIN, YELLOWSTONE_CHAIN } from "../constants";
import { STATUS_TO_DEPLOYMENT_STATUS } from "../constants/constants";
import { ENV } from "../managers";
import { StateManager } from "../managers/state-manager-2";
import {
  createPermitAppVersionFunction,
  createRegisterAppFunction,
  createValidateAbilityExecutionFunction,
  PublicViemClientManager,
} from "../managers/chain-client-2";
import {
  mintCapacityCredits,
  mintNewPkp,
} from "../utils";
import { fundPKPIfNeeded } from "../utils/fund-pkp-2";
import { setupAccount } from "../utils/setup-account-2";

// Type definitions for init function return value

export interface InitAccounts {
  funder: {
    ethersWallet: ethers.Wallet;
  };
  agentWalletPkpOwner: {
    ethersWallet: ethers.Wallet;
    mintAgentWalletPkp: (params: {
      abilityAndPolicyIpfsCids: string[];
    }) => Promise<{
      tokenId: string;
      publicKey: string;
      ethAddress: string;
    }>;
    permittedAuthMethods: (params: {
      agentWalletPkp: {
        tokenId: string;
        publicKey: string;
        ethAddress: string;
      };
      abilityAndPolicyIpfsCids: string[];
    }) => Promise<string[]>;
    permitAppVersion: ReturnType<typeof createPermitAppVersionFunction>;
  };
  appManager: {
    ethersWallet: ethers.Wallet;
    registerApp: ReturnType<typeof createRegisterAppFunction>;
    validateAbilityExecution: ReturnType<
      typeof createValidateAbilityExecutionFunction
    >;
  };
  delegatee: {
    ethersWallet: ethers.Wallet;
  };
}

export interface InitResult {
  accounts: InitAccounts;
  ethersAccounts: Record<string, never>;
}

const setupFunderWallet = async (
  provider: ethers.providers.JsonRpcProvider
) => {
  const funderWallet = new ethers.Wallet(ENV.TEST_FUNDER_PRIVATE_KEY as string, provider);

  console.log(
    "✅ Funder Wallet Ethers Wallet:",
    funderWallet.address
  );

  const funderBalance = await provider.getBalance(funderWallet.address);
  console.log("   ↳ Balance:", ethers.utils.formatEther(funderBalance));

  if (funderBalance.lt(ethers.utils.parseEther("0.13"))) {
    const errorMessage = `❌ Insufficient funder balance. Current balance is below the required 0.13 threshold. Please top up your funder wallet at: https://chronicle-yellowstone-faucet.getlit.dev/`;
    console.log(errorMessage);
    throw new Error(errorMessage);
  }

  return funderWallet;
};

const setupAccountManagers = async (
  stateManager: StateManager,
  funderWallet: ethers.Wallet,
  provider: ethers.providers.JsonRpcProvider,
  network: "datil" | "datil-test" | "datil-dev",
  appManagerFundAmount: ethers.BigNumber,
  agentWalletPkpOwnerFundAmount: ethers.BigNumber
) => {
  const appManagerResult = await setupAccount(
    "appManager",
    "App Manager Ethers Wallet",
    ENV.TEST_APP_MANAGER_PRIVATE_KEY,
    stateManager,
    funderWallet,
    provider,
    appManagerFundAmount
  );

  const agentWalletPkpOwnerResult = await setupAccount(
    "agentWalletPkpOwner",
    "Agent Wallet PKP Owner Ethers Wallet",
    ENV.TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
    stateManager,
    funderWallet,
    provider,
    agentWalletPkpOwnerFundAmount
  );

  const agentWalletContractsClient = new LitContracts({
    signer: agentWalletPkpOwnerResult.wallet,
    network:
      LIT_NETWORK[network as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
  });
  await agentWalletContractsClient.connect();

  return {
    appManagerResult,
    agentWalletPkpOwnerResult,
    agentWalletContractsClient,
  };
};

const setupDelegateeWallet = async (
  stateManager: StateManager,
  funderWallet: ethers.Wallet,
  provider: ethers.providers.JsonRpcProvider,
  delegateeFundAmount: ethers.BigNumber
) => {
  const delegateeResult = await setupAccount(
    "appDelegatee",
    "Delegatee Ethers wallet",
    ENV.TEST_APP_DELEGATEE_PRIVATE_KEY,
    stateManager,
    funderWallet,
    provider,
    delegateeFundAmount
  );

  return {
    delegateeAccount: delegateeResult.account,
    delegateeEthersWallet: delegateeResult.wallet
  };
};

export const init = async ({
  network,
  fundAmount = "0.01",
  fundingAmounts,
  deploymentStatus = "dev",
}: {
  network: "datil" | "datil-test" | "datil-dev";
  fundAmount?: string;
  fundingAmounts?: {
    appManager?: string;
    agentWalletPkpOwner?: string;
    delegatee?: string;
    pkp?: string;
  };
  deploymentStatus?: "dev" | "staging" | "production";
}): Promise<InitResult> => {
  const _fundingAmounts = {
    appManager: ethers.utils.parseEther(fundingAmounts?.appManager || "0.001"),
    agentWalletPkpOwner: ethers.utils.parseEther(
      fundingAmounts?.agentWalletPkpOwner || "0.01"
    ),
    delegatee: ethers.utils.parseEther(fundingAmounts?.delegatee || "0.001"),
    pkp: ethers.utils.parseEther(fundingAmounts?.pkp || "0.001"),
  };

  const _deploymentStatus =
    STATUS_TO_DEPLOYMENT_STATUS[
    deploymentStatus as keyof typeof STATUS_TO_DEPLOYMENT_STATUS
    ];
  /**
   * ====================================
   * Initialize State Manager
   * ====================================
   */
  // Auto-detect test filename and use a temporary config hash that will be updated later
  const detectedTestFileName = StateManager.autoDetectTestFileName();
  const temporaryConfigHash = 'pending'; // Will be updated when configuration is provided

  console.log(`\n🏗️  Initialising E2E environment for ${detectedTestFileName} (configuration will be detected during app registration)`);

  const stateManager = new StateManager(network, detectedTestFileName, temporaryConfigHash);
  await stateManager.loadState();

  /**
   * ====================================
   * Setup all components using helper functions
   * ====================================
   */
  // Create ethers provider for Yellowstone
  const provider = new ethers.providers.JsonRpcProvider(ENV.YELLOWSTONE_RPC_URL);

  const funderWallet = await setupFunderWallet(provider);

  const {
    appManagerResult,
    agentWalletPkpOwnerResult,
    agentWalletContractsClient,
  } = await setupAccountManagers(
    stateManager,
    funderWallet,
    provider,
    network,
    _fundingAmounts.appManager,
    _fundingAmounts.agentWalletPkpOwner
  );

  const { delegateeAccount, delegateeEthersWallet } =
    await setupDelegateeWallet(
      stateManager,
      funderWallet,
      provider,
      _fundingAmounts.delegatee
    );

  /**
   * ====================================
   * Create Vincent contracts SDK instances
   * ====================================
   */
  const appManagerContractClient = getClient({ signer: appManagerResult.wallet });
  const agentWalletPkpOwnerContractClient = getClient({ signer: agentWalletPkpOwnerResult.wallet });

  /**
   * ====================================
   * Mint capacity credits for the delegatee
   * ====================================
   */
  const { capacityCredits: mintCCRes, isNew: isNewCC } =
    await stateManager.getOrMintCapacityCredits(async () => {
      return await mintCapacityCredits(delegateeEthersWallet, network);
    });
  console.log(
    "✅ Delegatee capacity credits:",
    mintCCRes,
    isNewCC ? "(newly minted)" : "(from cache)"
  );

  /**
   * ====================================
   * Create and return a function to mint an Agent Wallet PKP
   * ====================================
   */
  const mintAgentWalletPkp = async ({
    abilityAndPolicyIpfsCids,
  }: {
    abilityAndPolicyIpfsCids: string[];
  }) => {
    const { pkp, isNew } = await stateManager.getOrMintPKP(async () => {
      return await mintNewPkp(
        agentWalletPkpOwnerResult.privateKey,
        network,
        ...abilityAndPolicyIpfsCids
      );
    });

    // Fund the PKP if it's newly minted
    await fundPKPIfNeeded(
      pkp.ethAddress,
      isNew,
      funderWallet,
      provider,
      _fundingAmounts.pkp
    );

    // Save state after PKP operations
    await stateManager.saveState();

    return pkp;
  };

  // Save state if any new accounts were generated
  await stateManager.saveState();

  console.log("\n----- (init.ts) Initialisation Completed \n");

  return {
    accounts: {
      funder: {
        ethersWallet: funderWallet,
      },
      agentWalletPkpOwner: {
        ethersWallet: agentWalletPkpOwnerResult.wallet,
        mintAgentWalletPkp: mintAgentWalletPkp,
        permittedAuthMethods: async ({
          agentWalletPkp,
          abilityAndPolicyIpfsCids,
        }: {
          agentWalletPkp: {
            tokenId: string;
            publicKey: string;
            ethAddress: string;
          };
          abilityAndPolicyIpfsCids: string[];
        }) => {
          const results: string[] = [];
          for (const ipfsCid of abilityAndPolicyIpfsCids) {
            const result = await agentWalletContractsClient.addPermittedAction({
              pkpTokenId: agentWalletPkp.tokenId,
              ipfsId: ipfsCid,
              authMethodScopes: [
                1, // Sign Anything
              ],
            });
            results.push(result.transactionHash);
          }
          return results;
        },
        permitAppVersion: createPermitAppVersionFunction(
          stateManager,
          agentWalletPkpOwnerContractClient
        ),
      },
      appManager: {
        ethersWallet: appManagerResult.wallet,
        registerApp: createRegisterAppFunction(
          stateManager,
          appManagerContractClient,
          delegateeAccount
        ),
        validateAbilityExecution: createValidateAbilityExecutionFunction(
          appManagerContractClient
        ),
      },
      delegatee: {
        ethersWallet: delegateeEthersWallet,
      },
    },
    ethersAccounts: {},
  };
};
