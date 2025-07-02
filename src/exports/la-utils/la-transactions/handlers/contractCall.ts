import { yellowstoneConfig } from "../../la-chain/yellowstone/yellowstoneConfig";
import { signTx } from "../primitive/signTx";
import { sendTx } from "../primitive/sendTx";

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
        gasLimit,
        gasPrice,
        nonce,
      });
    }
  );

  const { gasLimit, gasPrice, nonce } = JSON.parse(gasParamsResponse);

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
