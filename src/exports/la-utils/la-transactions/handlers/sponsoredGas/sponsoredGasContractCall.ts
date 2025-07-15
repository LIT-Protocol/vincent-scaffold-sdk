import { alchemy } from "@account-kit/infra";
import { LitActionsSmartSigner } from "./litActionSmartSigner";
import { createModularAccountV2Client } from "@account-kit/smart-contracts";
import { getAlchemyChainConfig } from "../../../la-helpers/getAlchemyChainConfig";

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
 * @param overrides - Optional transaction overrides (value)
 * @param chainId - Optional chain ID (defaults to yellowstoneConfig.id)
 * @param eip7702AlchemyApiKey - The Alchemy API key for gas sponsorship
 * @param eip7702AlchemyPolicyId - The Alchemy policy ID for gas sponsorship
 * @returns The UserOperation hash.  You must use the alchemy smartAccountClient.waitForUserOperationTransaction() to convert the userOp into a txHash.
 */
export const sponsoredGasContractCall = async ({
  pkpPublicKey,
  abi,
  contractAddress,
  functionName,
  args,
  overrides = {},
  chainId,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
}: {
  pkpPublicKey: string;
  abi: any[];
  contractAddress: string;
  functionName: string;
  args: any[];
  overrides?: {
    value?: string | number | bigint;
    gasLimit?: number;
  };
  chainId?: number;
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

  // Convert value override if exists to BigNumber
  const txValue = overrides.value ? BigInt(overrides.value.toString()) : 0n;

  // Create LitActionsSmartSigner for EIP-7702
  const litSigner = new LitActionsSmartSigner({
    pkpPublicKey,
    chainId,
  });

  // Get the Alchemy chain configuration
  const alchemyChain = getAlchemyChainConfig(chainId);

  // Create the Smart Account Client with EIP-7702 mode
  const smartAccountClient = await createModularAccountV2Client({
    mode: "7702" as const,
    transport: alchemy({ apiKey: eip7702AlchemyApiKey }),
    chain: alchemyChain,
    signer: litSigner,
    policyId: eip7702AlchemyPolicyId,
  });

  console.log("Smart account client created");

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
};
