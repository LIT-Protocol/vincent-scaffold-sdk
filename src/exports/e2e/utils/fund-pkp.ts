import chalk from "chalk";
import { formatEther, parseEther } from "viem";

/**
 * Fund a PKP if it has zero balance
 * @param pkpAddress The PKP's Ethereum address
 * @param isNewPKP Whether this is a newly minted PKP
 * @param funderWallet The wallet client to fund from
 * @param publicClient The public client to check balance and wait for transactions
 * @param fundAmount Amount to fund (default: 0.1 ETH)
 */
export async function fundPKPIfNeeded(
  pkpAddress: string,
  isNewPKP: boolean,
  funderWallet: any,
  publicClient: any,
  fundAmount: bigint = parseEther("0.01")
): Promise<void> {
  console.log(
    `✅ PKP Address: ${pkpAddress}${
      isNewPKP ? chalk.yellow(" (newly minted)") : ""
    }`
  );

  // Check PKP balance
  const balance = await publicClient.getBalance({ address: pkpAddress });
  console.log("   ↳ PKP Balance:", formatEther(balance));

  // Fund if new PKP with zero balance
  if (isNewPKP && balance === 0n) {
    console.log(chalk.yellow("   ↳ Funding new PKP..."));
    const tx = await funderWallet.sendTransaction({
      to: pkpAddress,
      value: fundAmount,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(
      chalk.green(`   ↳ PKP funded with ${formatEther(fundAmount)} ETH`)
    );
  }
}
