import { yellowstoneConfig } from "../../la-chain/yellowstone/yellowstoneConfig";
import { signTx } from "../primitive/signTx";
import { sendTx } from "../primitive/sendTx";
import AlchemyInfra, { alchemy } from "@account-kit/infra";
import { LitActionsSmartSigner } from "./litActionSmartSigner";
import { createModularAccountV2Client } from "@account-kit/smart-contracts";

/**
 * Handler function for making contract calls
 * This function handles the preparation, signing, and sending of contract transactions
 *
 * @param provider - The network provider instance
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
export const contractCall = async ({
  provider,
  pkpPublicKey,
  callerAddress,
  abi,
  contractAddress,
  functionName,
  args,
  overrides = {},
  chainId,
  gasBumpPercentage,
  eip7702AlchemyGasSponsor,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
}: {
  provider: any;
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
  eip7702AlchemyGasSponsor?: boolean;
  eip7702AlchemyApiKey?: string;
  eip7702AlchemyPolicyId?: string;
}) => {
  // Step 1: Encode function data using ethers Interface
  const iface = new ethers.utils.Interface(abi);
  const encodedData = iface.encodeFunctionData(functionName, args);
  const fromAddress = callerAddress;

  console.log("Encoded data:", encodedData);

  // Convert value override if exists to BigNumber
  const txValue = overrides.value
    ? ethers.BigNumber.from(overrides.value.toString())
    : ethers.BigNumber.from(0);

  if (eip7702AlchemyGasSponsor) {
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
  }

  const gasParamsResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: "gasParams" },
    async () => {
      // Step 2: Estimate gas using the provider
      let gasLimit;
      if (overrides.gasLimit) {
        gasLimit = ethers.BigNumber.from(overrides.gasLimit.toString());
      } else {
        const estimatedGas = await provider.estimateGas({
          from: fromAddress,
          to: contractAddress,
          data: encodedData,
          value: txValue,
        });

        console.log("RunOnce Estimated gas:", estimatedGas);

        if (gasBumpPercentage) {
          // Bump gas by the percentage specified.  Since we are using BigNumber, we need to add 100 to the percentage
          // provided by the user, and then divide by 100 to get the final result.
          gasLimit = estimatedGas.mul(gasBumpPercentage + 100).div(100);
          console.log(
            `RunOnce Bumped gas by ${gasBumpPercentage}% to ${gasLimit}`
          );
        } else {
          gasLimit = estimatedGas;
        }
      }

      console.log("RunOnce Gas limit:", gasLimit);

      const nonce = await provider.getTransactionCount(callerAddress);
      const gasPrice = await provider.getGasPrice();
      console.log("RunOnce Gas price:", gasPrice.toString());

      return JSON.stringify({
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        nonce: nonce,
      });
    }
  );

  const parsedGasParamsResponse = JSON.parse(gasParamsResponse);

  const gasLimit = ethers.BigNumber.from(parsedGasParamsResponse.gasLimit);
  const gasPrice = ethers.BigNumber.from(parsedGasParamsResponse.gasPrice);
  const nonce = parseInt(parsedGasParamsResponse.nonce);

  // Craft the transaction object
  const tx = {
    to: contractAddress,
    data: encodedData,
    value: txValue,
    gasLimit: gasLimit,
    gasPrice: gasPrice,
    nonce: nonce,
    chainId: chainId ?? yellowstoneConfig.id,
  };

  console.log("Transaction:", tx);

  // Step 3: Sign the transaction
  const signedTx = await signTx({
    sigName: functionName,
    pkpPublicKey: pkpPublicKey,
    tx,
  });
  console.log("Signed transaction:", signedTx);

  // Step 4: Send the transaction
  const txHash = await sendTx(provider, signedTx);
  console.log("Transaction sent:", txHash);
  return txHash;
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
    eip7702AlchemyApiKey,
    chainId,
    pkpPublicKey,
    policyId: eip7702AlchemyPolicyId,
  });
  console.log("Smart account client created");

  // Prepare the user operation
  const userOperation = {
    target: contractAddress as `0x${string}`,
    value: 0n,
    data: encodedData,
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

export async function createAlchemySmartAccountClient({
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
 */
export function getAlchemyChainConfig(chainId: number) {
  // Import chain definitions from Alchemy SDK
  const { mainnet, sepolia, base, arbitrum, optimism, polygon } = AlchemyInfra;

  switch (chainId) {
    case 1:
      return mainnet;
    case 11155111:
      return sepolia;
    case 8453:
      return base;
    case 42161:
      return arbitrum;
    case 10:
      return optimism;
    case 137:
      return polygon;
    default:
      return mainnet;
  }
}
