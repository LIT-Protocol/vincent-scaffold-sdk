import { ethers } from "ethers";
import { LitContracts } from "@lit-protocol/contracts-sdk";

import { LIT_NETWORK } from "@lit-protocol/constants";

export interface CapacityCreditMintOptions {
  requestsPerKilosecond?: number;
  daysUntilUTCMidnightExpiration?: number;
}
export interface CapacityCreditInfo {
  capacityTokenIdStr: string;
  capacityTokenId: string;
  requestsPerKilosecond: number;
  daysUntilUTCMidnightExpiration: number;
  mintedAtUtc: string;
}

async function _mintCapacityCredit(
  litContracts: LitContracts,
  {
    requestsPerKilosecond = 10,
    daysUntilUTCMidnightExpiration = 1,
  }: CapacityCreditMintOptions = {}
): Promise<CapacityCreditInfo> {
  // Calculate expiration timestamp at UTC midnight
  const now = new Date();
  const expirationDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilUTCMidnightExpiration,
      0,
      0,
      0,
      0 // Set to midnight UTC
    )
  );
  const expiresAt = Math.floor(expirationDate.getTime() / 1000); // Convert to Unix timestamp

  const mintCost = await litContracts.rateLimitNftContract.read.calculateCost(
    requestsPerKilosecond,
    expiresAt
  );

  if (mintCost.gt(await litContracts.signer.getBalance())) {
    throw new Error(
      `${await litContracts.signer.getAddress()} has insufficient balance to mint capacity credit: ${ethers.utils.formatEther(
        await litContracts.signer.getBalance()
      )} < ${ethers.utils.formatEther(mintCost)}`
    );
  }

  const capacityCreditInfo = await litContracts.mintCapacityCreditsNFT({
    requestsPerKilosecond,
    daysUntilUTCMidnightExpiration,
  });

  return {
    capacityTokenIdStr: capacityCreditInfo.capacityTokenIdStr,
    capacityTokenId: capacityCreditInfo.capacityTokenId,
    requestsPerKilosecond,
    daysUntilUTCMidnightExpiration,
    mintedAtUtc: new Date().toISOString(),
  };
}

export const mintCapacityCredits = async (
  delegateeEthersWallet: ethers.Wallet,
  network: "datil" | "datil-test" | "datil-dev"
) => {
  const litContractClient = new LitContracts({
    signer: delegateeEthersWallet,
    network:
      LIT_NETWORK[network as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
  });
  await litContractClient.connect();

  const capacityCreditInfo = await _mintCapacityCredit(litContractClient, {
    requestsPerKilosecond: 80,
    daysUntilUTCMidnightExpiration: 25,
  });

  return capacityCreditInfo;
};
