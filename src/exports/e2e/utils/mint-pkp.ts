import { ethers } from "ethers";
import {
  LIT_NETWORK,
  AUTH_METHOD_TYPE,
  AUTH_METHOD_SCOPE,
} from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { ENV } from "../managers/env-manager";

export interface PKPInfo {
  publicKey: string;
  tokenId: string;
  ethAddress: string;
}

/**
 * Helper function to mint a new PKP and return its information
 * @param pkpOwnerPrivateKey Private key of the wallet that will own the PKP
 * @param litNetwork Lit network to use (e.g., "datil", "datil-test", "datil-dev")
 * @param abilityAndPolicyIpfsCids IPFS CIDs for abilities and policies to authorize
 * @returns PKP information including tokenId, publicKey, and ethAddress
 */
export const mintNewPkp = async (
  pkpOwnerPrivateKey: string,
  litNetwork: string,
  ...abilityAndPolicyIpfsCids: string[]
): Promise<PKPInfo> => {
  console.log(
    `🔁 Minting PKP for ${abilityAndPolicyIpfsCids.length} abilities and policies on "${litNetwork}" network`
  );

  // Create ethers provider and owner wallet
  const provider = new ethers.providers.JsonRpcProvider(
    ENV.YELLOWSTONE_RPC_URL
  );
  const pkpOwnerWallet = new ethers.Wallet(
    pkpOwnerPrivateKey as string,
    provider
  );

  const litContractClient = new LitContracts({
    signer: pkpOwnerWallet,
    network:
      LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
  });
  await litContractClient.connect();

  // Dynamically create auth method types array
  const authMethodTypes = [
    AUTH_METHOD_TYPE.EthWallet,
    ...abilityAndPolicyIpfsCids.map(() => AUTH_METHOD_TYPE.LitAction),
  ];

  // Dynamically create auth method IDs array
  const authMethodIds = [
    pkpOwnerWallet.address,
    ...abilityAndPolicyIpfsCids.map(
      (ipfsCid) =>
        `0x${Buffer.from(ethers.utils.base58.decode(ipfsCid)).toString("hex")}`
    ),
  ];

  // Create auth method pubkeys array (all "0x" for our use case)
  const authMethodPubkeys = ["0x", ...abilityAndPolicyIpfsCids.map(() => "0x")];

  // Create auth method scopes array
  const authMethodScopes = [
    [AUTH_METHOD_SCOPE.SignAnything],
    ...abilityAndPolicyIpfsCids.map(() => [AUTH_METHOD_SCOPE.SignAnything]),
  ];

  const mintPkpTx =
    await litContractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
      AUTH_METHOD_TYPE.EthWallet,
      authMethodTypes,
      authMethodIds,
      authMethodPubkeys,
      authMethodScopes,
      true, // addPkpEthAddressAsPermittedAddress
      false, // sendPkpToItself
      { value: await litContractClient.pkpNftContract.read.mintCost() }
    );
  const mintPkpReceipt = await mintPkpTx.wait();

  const pkpMintedEvent = mintPkpReceipt!.events!.find(
    (event) =>
      event.topics[0] ===
      "0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8"
  );

  const publicKey = "0x" + pkpMintedEvent!.data.slice(130, 260);
  const tokenId = ethers.utils.keccak256(publicKey);
  const ethAddress = await litContractClient.pkpNftContract.read.getEthAddress(
    tokenId
  );

  return {
    tokenId: ethers.BigNumber.from(tokenId).toString(),
    publicKey,
    ethAddress,
  };
};
