import { LIT_NETWORK } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { ethers } from "ethers";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BASE_CHAIN, YELLOWSTONE_CHAIN } from "../constants";
import { STATUS_TO_DEPLOYMENT_STATUS } from "../constants/constants";
import { createContractsManager, ENV, StateManager } from "../managers";
import {
  ChainClient,
  createChainClient,
  PublicViemClientManager,
} from "../managers/chain-client";
import {
  fundPKPIfNeeded,
  mintCapacityCredits,
  mintNewPkp,
  setupAccount,
} from "../utils";

// Type definitions for init function return value

export interface InitAccounts {
  funder: {
    viemWalletClient: ReturnType<typeof createWalletClient>;
  };
  agentWalletPkpOwner: {
    viemWalletClient: ReturnType<typeof createWalletClient>;
    mintAgentWalletPkp: (params: {
      toolAndPolicyIpfsCids: string[];
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
      toolAndPolicyIpfsCids: string[];
    }) => Promise<string[]>;
  };
  appManager: {
    viemWalletClient: ReturnType<typeof createWalletClient>;
  };
  delegatee: {
    ethersWallet: any; // ethers.Wallet type
  };
}

export interface InitResult {
  publicViemClientManager: PublicViemClientManager;
  accounts: InitAccounts;
  chainClient: ChainClient;
  ethersAccounts: Record<string, never>;
}

// Helper functions to break down the large init function
const createPublicClientManager = (): PublicViemClientManager => {
  return {
    yellowstone: createPublicClient({
      chain: YELLOWSTONE_CHAIN,
      transport: http(ENV.YELLOWSTONE_RPC_URL),
    }),
    base: createPublicClient({
      chain: BASE_CHAIN,
      transport: http(ENV.BASE_RPC_URL),
    }),
  };
};

const setupFunderWallet = async (
  publicViemClientManager: PublicViemClientManager
) => {
  const funderWalletViemWalletClient = createWalletClient({
    account: privateKeyToAccount(ENV.TEST_FUNDER_PRIVATE_KEY as `0x${string}`),
    chain: YELLOWSTONE_CHAIN,
    transport: http(ENV.YELLOWSTONE_RPC_URL),
  });

  console.log(
    "✅ Funder Wallet Viem Wallet Client:",
    funderWalletViemWalletClient.account.address
  );

  const funderBalance = await publicViemClientManager.yellowstone.getBalance({
    address: funderWalletViemWalletClient.account.address,
  });
  console.log("   ↳ Balance:", formatEther(funderBalance));

  if (funderBalance < parseEther("1")) {
    throw new Error("❌ Funder balance is less than 1");
  }

  return funderWalletViemWalletClient;
};

const setupAccountManagers = async (
  stateManager: StateManager,
  funderWalletViemWalletClient: ReturnType<typeof createWalletClient>,
  publicViemClientManager: PublicViemClientManager,
  network: "datil" | "datil-test" | "datil-dev",
  fundAmount: bigint
) => {
  const appManagerAccount = await setupAccount(
    "appManager",
    "App Manager Viem Wallet Client",
    ENV.TEST_APP_MANAGER_PRIVATE_KEY,
    stateManager,
    funderWalletViemWalletClient,
    publicViemClientManager.yellowstone,
    fundAmount
  );

  const appManagerViemWalletClient = createWalletClient({
    account: privateKeyToAccount(appManagerAccount.privateKey),
    chain: YELLOWSTONE_CHAIN,
    transport: http(ENV.YELLOWSTONE_RPC_URL),
  });

  const agentWalletPkpOwnerAccount = await setupAccount(
    "agentWalletPkpOwner",
    "Agent Wallet PKP Owner Viem Wallet Client",
    ENV.TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
    stateManager,
    funderWalletViemWalletClient,
    publicViemClientManager.yellowstone,
    fundAmount
  );

  const agentWalletPkpOwnerViemWalletClient = createWalletClient({
    account: privateKeyToAccount(agentWalletPkpOwnerAccount.privateKey),
    chain: YELLOWSTONE_CHAIN,
    transport: http(ENV.YELLOWSTONE_RPC_URL),
  });

  const yellowstoneProvider = new ethers.providers.JsonRpcProvider(
    ENV.YELLOWSTONE_RPC_URL
  );

  const agentWalletPkpOwnerEthersWallet = new ethers.Wallet(
    agentWalletPkpOwnerAccount.privateKey,
    yellowstoneProvider
  );

  const agentWalletContractsClient = new LitContracts({
    signer: agentWalletPkpOwnerEthersWallet,
    network:
      LIT_NETWORK[network as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
  });
  await agentWalletContractsClient.connect();

  return {
    appManagerAccount,
    appManagerViemWalletClient,
    agentWalletPkpOwnerAccount,
    agentWalletPkpOwnerViemWalletClient,
    agentWalletContractsClient,
  };
};

const setupDelegateeWallet = async (
  stateManager: StateManager,
  funderWalletViemWalletClient: ReturnType<typeof createWalletClient>,
  publicViemClientManager: PublicViemClientManager,
  fundAmount: bigint
) => {
  const delegateeAccount = await setupAccount(
    "appDelegatee",
    "Delegatee Ethers wallet",
    ENV.TEST_APP_DELEGATEE_PRIVATE_KEY,
    stateManager,
    funderWalletViemWalletClient,
    publicViemClientManager.yellowstone,
    fundAmount
  );

  const yellowstoneProvider = new ethers.providers.JsonRpcProvider(
    ENV.YELLOWSTONE_RPC_URL
  );

  const delegateeEthersWallet = new ethers.Wallet(
    delegateeAccount.privateKey,
    yellowstoneProvider
  );

  return { delegateeAccount, delegateeEthersWallet };
};

export const init = async ({
  network,
  fundAmount = "0.01",
  deploymentStatus = "dev",
}: {
  network: "datil" | "datil-test" | "datil-dev";
  fundAmount?: string;
  deploymentStatus?: "dev" | "staging" | "production";
}): Promise<InitResult> => {
  const _fundAmount = parseEther(fundAmount);

  const _deploymentStatus =
    STATUS_TO_DEPLOYMENT_STATUS[
      deploymentStatus as keyof typeof STATUS_TO_DEPLOYMENT_STATUS
    ];
  /**
   * ====================================
   * Initialize State Manager
   * ====================================
   */
  const stateManager = new StateManager(network);
  await stateManager.loadState();

  /**
   * ====================================
   * Setup all components using helper functions
   * ====================================
   */
  const publicViemClientManager = createPublicClientManager();
  console.log(
    "✅ Public Viem Client Manager: ",
    Object.keys(publicViemClientManager)
  );

  const funderWalletViemWalletClient = await setupFunderWallet(
    publicViemClientManager
  );

  const {
    appManagerViemWalletClient,
    agentWalletPkpOwnerAccount,
    agentWalletPkpOwnerViemWalletClient,
    agentWalletContractsClient,
  } = await setupAccountManagers(
    stateManager,
    funderWalletViemWalletClient,
    publicViemClientManager,
    network,
    _fundAmount
  );

  const { delegateeAccount, delegateeEthersWallet } =
    await setupDelegateeWallet(
      stateManager,
      funderWalletViemWalletClient,
      publicViemClientManager,
      _fundAmount
    );

  /**
   * ====================================
   * Create Vincent contracts manager for app management
   * ====================================
   */
  const appManagerContractsManager = createContractsManager(
    appManagerViemWalletClient,
    network
  );

  const agentWalletPkpOwnerContractsManager = createContractsManager(
    agentWalletPkpOwnerViemWalletClient,
    network
  );

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
    toolAndPolicyIpfsCids,
  }: {
    toolAndPolicyIpfsCids: string[];
  }) => {
    const { pkp, isNew } = await stateManager.getOrMintPKP(async () => {
      return await mintNewPkp(
        agentWalletPkpOwnerAccount.privateKey,
        network,
        ...toolAndPolicyIpfsCids
      );
    });

    // Fund the PKP if it's newly minted
    await fundPKPIfNeeded(
      pkp.ethAddress,
      isNew,
      funderWalletViemWalletClient,
      publicViemClientManager.yellowstone,
      _fundAmount
    );

    // Save state after PKP operations
    await stateManager.saveState();

    return pkp;
  };

  // Save state if any new accounts were generated
  await stateManager.saveState();

  console.log("\n----- (init.ts) Initialisation Completed \n");

  return {
    publicViemClientManager,
    accounts: {
      funder: {
        viemWalletClient: funderWalletViemWalletClient,
      },
      agentWalletPkpOwner: {
        viemWalletClient: agentWalletPkpOwnerViemWalletClient,
        mintAgentWalletPkp: mintAgentWalletPkp,
        permittedAuthMethods: async ({
          agentWalletPkp,
          toolAndPolicyIpfsCids,
        }: {
          agentWalletPkp: {
            tokenId: string;
            publicKey: string;
            ethAddress: string;
          };
          toolAndPolicyIpfsCids: string[];
        }) => {
          const results: string[] = [];
          for (const ipfsCid of toolAndPolicyIpfsCids) {
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
      },
      appManager: {
        viemWalletClient: appManagerViemWalletClient,
      },
      delegatee: {
        ethersWallet: delegateeEthersWallet,
      },
    },
    chainClient: createChainClient(
      stateManager,
      appManagerContractsManager,
      agentWalletPkpOwnerContractsManager,
      publicViemClientManager,
      delegateeAccount,
      _deploymentStatus
    ),
    ethersAccounts: {},
  };
};
