import {
  alchemy,
  arbitrum,
  arbitrumGoerli,
  arbitrumNova,
  arbitrumSepolia,
  base,
  baseGoerli,
  baseSepolia,
  fraxtal,
  fraxtalSepolia,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonMumbai,
  sepolia,
  shape,
  shapeSepolia,
  worldChain,
  worldChainSepolia,
  zora,
  zoraSepolia,
  beraChainBartio,
  opbnbMainnet,
  opbnbTestnet,
  soneiumMinato,
  soneiumMainnet,
  unichainMainnet,
  unichainSepolia,
  inkMainnet,
  inkSepolia,
  mekong,
  monadTestnet,
  openlootSepolia,
  gensynTestnet,
  riseTestnet,
  storyMainnet,
  storyAeneid,
  celoAlfajores,
  celoMainnet,
  teaSepolia,
} from "@account-kit/infra";
import { LitActionsSmartSigner } from "./litActionSmartSigner";
import { createModularAccountV2Client } from "@account-kit/smart-contracts";

/**
 * Handler function for making contract calls
 * This function handles the preparation, signing, and sending of contract transactions
 *
 * @param pkpPublicKey - The PKP public key for transaction signing
 * @param pkpEthAddress - The ethereum address derived from PKP
 * @param abi - The ABI of the contract function
 * @param address - The contract address
 * @param functionName - The name of the function to call
 * @param args - The arguments to pass to the function
 * @param overrides - Optional transaction overrides (value, gasLimit)
 * @param chainId - Optional chain ID (defaults to yellowstoneConfig.id)
 * @returns The transaction hash
 */
export const sponsoredGasContractCall = async ({
  pkpPublicKey,
  callerAddress,
  abi,
  contractAddress,
  functionName,
  args,
  overrides = {},
  chainId,
  gasBumpPercentage,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
}: {
  pkpPublicKey: string;
  callerAddress: string;
  abi: any[];
  contractAddress: string;
  functionName: string;
  args: any[];
  overrides?: {
    value?: string | number | bigint;
    gasLimit?: number;
  };
  chainId?: number;
  gasBumpPercentage?: number;
  eip7702AlchemyApiKey?: string;
  eip7702AlchemyPolicyId?: string;
}) => {
  // Step 1: Encode function data using ethers Interface
  const iface = new ethers.utils.Interface(abi);
  const encodedData = iface.encodeFunctionData(functionName, args);

  console.log("Encoded data:", encodedData);

  if (!eip7702AlchemyApiKey || !eip7702AlchemyPolicyId) {
    throw new Error(
      "EIP7702 Alchemy API key and policy ID are required when using Alchemy for gas sponsorship"
    );
  }

  if (!chainId) {
    throw new Error(
      "Chain ID is required when using Alchemy for gas sponsorship"
    );
  }

  return await executeContractCallWithEIP7702({
    pkpPublicKey,
    callerAddress,
    contractAddress,
    overrides,
    chainId,
    gasBumpPercentage,
    eip7702AlchemyApiKey,
    eip7702AlchemyPolicyId,
    encodedData,
  });
};

async function executeContractCallWithEIP7702({
  pkpPublicKey,
  callerAddress,
  contractAddress,
  overrides,
  chainId,
  gasBumpPercentage,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
  encodedData,
}: {
  pkpPublicKey: string;
  callerAddress: string;
  contractAddress: string;
  overrides: any;
  chainId: number;
  gasBumpPercentage?: number;
  eip7702AlchemyApiKey: string;
  eip7702AlchemyPolicyId: string;
  encodedData: string;
}) {
  console.log("Executing contract call with EIP7702 with params:", {
    pkpPublicKey,
    callerAddress,
    contractAddress,
    overrides,
    chainId,
    gasBumpPercentage,
  });

  // Create the Smart Account Client with EIP-7702 mode
  const smartAccountClient = await createAlchemySmartAccountClient({
    alchemyApiKey: eip7702AlchemyApiKey,
    chainId,
    pkpPublicKey,
    policyId: eip7702AlchemyPolicyId,
  });
  console.log("Smart account client created");

  // Convert value override if exists to BigNumber
  const txValue = overrides.value ? BigInt(overrides.value.toString()) : 0n;

  // Prepare the user operation
  const userOperation = {
    target: contractAddress as `0x${string}`,
    value: txValue,
    data: encodedData as `0x${string}`,
  };

  console.log("User operation prepared", userOperation);

  // Build the user operation
  const uoStructResponse = await Lit.Actions.runOnce(
    {
      waitForResponse: true,
      name: "buildUserOperation",
    },
    async () => {
      try {
        const uoStruct = await smartAccountClient.buildUserOperation({
          uo: userOperation,
          account: smartAccountClient.account,
        });
        // Properly serialize BigInt with a "type" tag
        return JSON.stringify(uoStruct, (_, v) =>
          typeof v === "bigint" ? { type: "BigInt", value: v.toString() } : v
        );
      } catch (e: any) {
        console.log("Failed to build user operation, error below");
        console.log(e);
        console.log(e.stack);
        return "";
      }
    }
  );

  if (uoStructResponse === "") {
    throw new Error("Failed to build user operation");
  }

  // Custom reviver to convert {type: "BigInt", value: "..."} back to BigInt
  const uoStruct = JSON.parse(uoStructResponse, (_, v) => {
    if (
      v &&
      typeof v === "object" &&
      v.type === "BigInt" &&
      typeof v.value === "string"
    ) {
      return BigInt(v.value);
    }
    return v;
  });

  console.log("User operation built, starting signing...", uoStruct);

  // sign the actual user operation with the PKP.
  // this must be done outside a runOnce call, because all the nodes must initiate a signature for it to be valid
  const signedUserOperation = await smartAccountClient.signUserOperation({
    account: smartAccountClient.account,
    uoStruct,
  });

  console.log("User operation signed", signedUserOperation);

  // getting the entry point from the smart account client so we can send the user operation
  const entryPoint = smartAccountClient.account.getEntryPoint();
  console.log("Entry point", entryPoint);

  // send the user operation with EIP-7702 delegation in a runOnce
  // so that we don't submit it more than once
  const uoHash = await Lit.Actions.runOnce(
    {
      waitForResponse: true,
      name: "sendWithAlchemy",
    },
    async () => {
      try {
        // Send the user operation with EIP-7702 delegation
        const userOpResult = await smartAccountClient.sendRawUserOperation(
          signedUserOperation,
          entryPoint.address
        );

        console.log(
          `[@lit-protocol/vincent-tool-morpho/executeOperationWithGasSponsorship] User operation sent`,
          { userOpHash: userOpResult }
        );

        return userOpResult;
      } catch (e: any) {
        console.log("Failed to send user operation, error below");
        console.log(e);
        console.log(e.stack);
        return "";
      }
    }
  );

  if (uoHash === "") {
    throw new Error("Failed to send user operation");
  }

  return uoHash;
}

async function createAlchemySmartAccountClient({
  alchemyApiKey,
  chainId,
  pkpPublicKey,
  policyId,
}: {
  alchemyApiKey: string;
  chainId: number;
  pkpPublicKey: string;
  policyId: string;
}) {
  // Create LitActionsSmartSigner for EIP-7702
  const litSigner = new LitActionsSmartSigner({
    pkpPublicKey,
    chainId,
  });

  // Get the Alchemy chain configuration
  const alchemyChain = getAlchemyChainConfig(chainId);

  return await createModularAccountV2Client({
    mode: "7702" as const,
    transport: alchemy({ apiKey: alchemyApiKey }),
    chain: alchemyChain,
    signer: litSigner,
    policyId,
  });
}

/**
 * Helper function to get Alchemy chain configuration
 * Supports all chains exported from AlchemyInfra by mapping chainId to the corresponding chain object.
 */
function getAlchemyChainConfig(chainId: number) {
  // Map of chainId to chain object
  const chainMap: Record<number, any> = {
    [1]: mainnet,
    [5]: goerli,
    [10]: optimism,
    [420]: optimismGoerli,
    [11155420]: optimismSepolia,
    [11155111]: sepolia,
    [137]: polygon,
    [80001]: polygonMumbai,
    [8453]: base,
    [84531]: baseGoerli,
    [84532]: baseSepolia,
    [42161]: arbitrum,
    [42170]: arbitrumNova,
    [421613]: arbitrumGoerli,
    [421614]: arbitrumSepolia,
    [1101]: polygonAmoy,
    [324]: zora, // If zora is mainnet
    [999]: zoraSepolia, // If zoraSepolia is testnet
    [252]: fraxtal, // Fraxtal mainnet
    [2523]: fraxtalSepolia,
    [480]: worldChain,
    [4801]: worldChainSepolia,
    [360]: shape,
    [11011]: shapeSepolia,
    [130]: unichainMainnet,
    [1301]: unichainSepolia,
    [1946]: soneiumMinato,
    [1868]: soneiumMainnet,
    [204]: opbnbMainnet,
    [5611]: opbnbTestnet,
    [80084]: beraChainBartio,
    [57073]: inkMainnet,
    [763373]: inkSepolia,
    [7078815900]: mekong,
    [10143]: monadTestnet,
    [905905]: openlootSepolia,
    [685685]: gensynTestnet,
    [11155931]: riseTestnet,
    [1514]: storyMainnet,
    [1315]: storyAeneid,
    [44787]: celoAlfajores,
    [42220]: celoMainnet,
    [10218]: teaSepolia,
    // Add more mappings as new chains are supported
  };

  // Return the chain config if found, otherwise default to mainnet
  return chainMap[chainId] || mainnet;
}
