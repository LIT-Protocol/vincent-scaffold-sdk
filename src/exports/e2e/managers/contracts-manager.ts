import { GetWalletClientReturnType } from "@wagmi/core";
import {
  Account,
  Chain,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  PublicClient,
  WalletClient,
} from "viem";
import { vincentAppFacetSignatures } from "../abis/generated/vincentAppFacetSignatures";
import { vincentAppViewFacetSignatures } from "../abis/generated/vincentAppViewFacetSignatures";
import { vincentUserFacetSignatures } from "../abis/generated/vincentUserFacetSignatures";
import { vincentUserViewFacetSignatures } from "../abis/generated/vincentUserViewFacetSignatures";
import { YELLOWSTONE_CHAIN } from "../constants/constants";
import { ENV } from "./env-manager";

export type ExpectedAccountOrWalletClient =
  | Account
  | WalletClient
  | GetWalletClientReturnType
  | any;

// Define explicit types for each contract to avoid type inference issues
export type VincentAppContract = ReturnType<typeof createAppContract>;
export type VincentAppViewContract = ReturnType<typeof createAppViewContract>;
export type VincentUserContract = ReturnType<typeof createUserContract>;
export type VincentUserViewContract = ReturnType<typeof createUserViewContract>;

export interface ContractsManager {
  app: VincentAppContract;
  appView: VincentAppViewContract;
  user: VincentUserContract;
  userView: VincentUserViewContract;
}

function _resolveAccount({
  accountOrWalletClient,
  chainConfig,
  rpcUrl,
}: {
  accountOrWalletClient: ExpectedAccountOrWalletClient;
  chainConfig: Chain;
  rpcUrl: string;
}) {
  // Check if accountOrWalletClient is null or undefined
  if (!accountOrWalletClient) {
    throw new Error("accountOrWalletClient is required but was not provided");
  }

  // If a wallet client is already provided, use it directly
  if (accountOrWalletClient.type === "local") {
    // If an account is provided, create a wallet client with it
    const walletClient = createWalletClient({
      account: accountOrWalletClient as Account,
      chain: chainConfig,
      transport: http(rpcUrl),
    });
    return walletClient;
  } else {
    return accountOrWalletClient as WalletClient;
  }
}

export const createAppContract = (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return getContract({
    address: ENV.VINCENT_ADDRESS as `0x${string}`,
    abi: [
      vincentAppFacetSignatures.methods.registerApp,
      vincentAppFacetSignatures.methods.removeDelegatee,
      ...vincentAppFacetSignatures.events,
    ],
    client: { public: publicClient, wallet: walletClient },
  });
};

export const createAppViewContract = (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return getContract({
    address: ENV.VINCENT_ADDRESS as `0x${string}`,
    abi: [
      vincentAppViewFacetSignatures.methods.getAppByDelegatee,
      ...vincentAppViewFacetSignatures.events,
    ],
    client: { public: publicClient, wallet: walletClient },
  });
};

export const createUserContract = (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return getContract({
    address: ENV.VINCENT_ADDRESS as `0x${string}`,
    abi: [
      vincentUserFacetSignatures.methods.permitAppVersion,
      ...vincentUserFacetSignatures.events,
    ],
    client: { public: publicClient, wallet: walletClient },
  });
};

export const createUserViewContract = (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return getContract({
    address: ENV.VINCENT_ADDRESS as `0x${string}`,
    abi: [
      vincentUserViewFacetSignatures.methods
        .validateToolExecutionAndGetPolicies,
      ...vincentUserViewFacetSignatures.events,
    ],
    client: { public: publicClient, wallet: walletClient },
  });
};

export const createContractsManager = (
  accountOrWalletClient: ExpectedAccountOrWalletClient,
  _network?: "datil" | "datil-test" | "datil-dev"
): ContractsManager => {
  const publicClient = createPublicClient({
    chain: YELLOWSTONE_CHAIN,
    transport: http(ENV.YELLOWSTONE_RPC_URL),
  });

  const walletClient = _resolveAccount({
    accountOrWalletClient,
    chainConfig: YELLOWSTONE_CHAIN,
    rpcUrl: ENV.YELLOWSTONE_RPC_URL,
  });

  return {
    app: createAppContract(publicClient, walletClient),
    appView: createAppViewContract(publicClient, walletClient),
    user: createUserContract(publicClient, walletClient),
    userView: createUserViewContract(publicClient, walletClient),
  };
};
