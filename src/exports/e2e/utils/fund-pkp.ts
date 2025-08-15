import chalk from "chalk";
import { ethers } from "ethers";

/**
 * Fund a PKP if it has zero balance
 * @param pkpAddress The PKP's Ethereum address
 * @param isNewPKP Whether this is a newly minted PKP
 * @param funderWallet The ethers wallet to fund from
 * @param publicClient The viem public client to check balance (for compatibility)
 * @param fundAmount Amount to fund (default: 0.01 ETH)
 */
export async function fundPKPIfNeeded(
  pkpAddress: string,
  isNewPKP: boolean,
  funderWallet: ethers.Wallet,
  provider: ethers.providers.JsonRpcProvider,
  fundAmount: ethers.BigNumber = ethers.utils.parseEther("0.01")
): Promise<void> {
  console.log(
    `✅ PKP Address: ${pkpAddress}${isNewPKP ? chalk.yellow(" (newly minted)") : ""
    }`
  );

  // Check PKP balance - using viem public client for compatibility
  const balance = await provider.getBalance(pkpAddress);
  console.log("   ↳ PKP Balance:", ethers.utils.formatEther(balance.toString()));

  // Fund if new PKP with zero balance
  if (isNewPKP && balance.eq(ethers.BigNumber.from(0))) {
    console.log(chalk.yellow("   ↳ Funding new PKP..."));
    const tx = await funderWallet.sendTransaction({
      to: pkpAddress,
      value: fundAmount,
    });
    await tx.wait();
    console.log(
      chalk.green(`   ↳ PKP funded with ${ethers.utils.formatEther(fundAmount)} ETH`)
    );
  }
}
