import chalk from "chalk";
import { formatEther, parseEther } from "viem";
import { StateManager } from "../managers/state-manager";

export async function setupAccount(
  accountType: "appManager" | "appDelegatee" | "agentWalletPkpOwner",
  accountName: string,
  envPrivateKey: string | undefined,
  stateManager: StateManager,
  funderWallet: any,
  publicClient: any,
  fundAmount: bigint = parseEther("0.01")
): Promise<{ account: any; address: string; privateKey: `0x${string}` }> {
  // Get or generate account
  const account = stateManager.getOrGenerateAccount(accountType, envPrivateKey);

  console.log(
    `✅ ${accountName}:`,
    account.address,
    account.isNew ? chalk.yellow("(newly generated)") : ""
  );

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("   ↳ Balance:", formatEther(balance));

  // Fund if new account with zero balance
  if (account.isNew && balance === 0n) {
    console.log(chalk.yellow("   ↳ Funding new account..."));
    const tx = await funderWallet.sendTransaction({
      to: account.address,
      value: fundAmount,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(chalk.green(`   ↳ Funded with ${formatEther(fundAmount)} ETH`));
  }

  return {
    account,
    address: account.address,
    privateKey: account.privateKey as `0x${string}`,
  };
}
