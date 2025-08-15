import chalk from "chalk";
import { ethers } from "ethers";
import { StateManager } from "../managers/state-manager";

export async function setupAccount(
  accountType: "appManager" | "appDelegatee" | "agentWalletPkpOwner",
  accountName: string,
  envPrivateKey: string | undefined,
  stateManager: StateManager,
  funderWallet: ethers.Wallet,
  provider: ethers.providers.JsonRpcProvider,
  fundAmount: ethers.BigNumber = ethers.utils.parseEther("0.01")
): Promise<{ account: any; address: string; privateKey: string; wallet: ethers.Wallet }> {
  // Get or generate account
  const account = stateManager.getOrGenerateAccount(accountType, envPrivateKey);

  console.log(
    `✅ ${accountName}:`,
    account.address,
    account.isNew ? chalk.yellow("(newly generated)") : ""
  );

  // Check balance
  const balance = await provider.getBalance(account.address);
  console.log("   ↳ Balance:", ethers.utils.formatEther(balance));

  // Fund if new account with zero balance OR if balance is insufficient
  const needsFunding = (account.isNew && balance.isZero()) || balance.lt(fundAmount);

  if (needsFunding) {
    const reason = account.isNew && balance.isZero() ? "new account" : "insufficient balance";
    console.log(chalk.yellow(`   ↳ Funding ${reason}...`));
    const tx = await funderWallet.sendTransaction({
      to: account.address,
      value: fundAmount,
    });
    await tx.wait();
    console.log(chalk.green(`   ↳ Funded with ${ethers.utils.formatEther(fundAmount)} ETH`));
  }

  // Create ethers wallet for this account
  const wallet = new ethers.Wallet(account.privateKey, provider);

  return {
    account,
    address: account.address,
    privateKey: account.privateKey,
    wallet, // Return the ethers wallet for convenience
  };
}
