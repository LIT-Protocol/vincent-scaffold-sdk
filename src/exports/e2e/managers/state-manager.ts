import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { CapacityCreditInfo } from "../utils/mint-cc";
import { PKPInfo } from "../utils/mint-pkp";

// Helper function to convert private key to address
function privateKeyToAddress(privateKey: `0x${string}`): string {
  return privateKeyToAccount(privateKey).address;
}

interface AccountState {
  privateKey: string;
  address: string;
  createdAt: string;
  network: string;
}

interface PKPState extends PKPInfo {
  createdAt: string;
  network: string;
}

interface CapacityCreditState extends CapacityCreditInfo {
  network: string;
  expiresAt: string; // ISO timestamp of when the capacity credits expire
}

interface VincentAppState {
  appId: string;
  appVersion: string;
  createdAt: string;
  network: string;
  delegateeAddress: string;
  toolIpfsCids: string[];
  toolPolicies: string[][];
  toolPolicyParameterNames: string[][];
  toolPolicyParameterTypes: number[][];
  toolPolicyParameterValues?: string[][]; // Optional for backward compatibility
}

interface PKPAppPermissionState {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permittedAt: string;
  network: string;
}

interface E2EState {
  accounts: {
    appManager?: AccountState;
    appDelegatee?: AccountState;
    agentWalletPkpOwner?: AccountState;
  };
  pkp?: PKPState;
  capacityCredits?: CapacityCreditState;
  vincentApp?: VincentAppState;
  pkpAppPermissions?: PKPAppPermissionState[];
  version: string;
}

const STATE_FILE_PATH = path.join(process.cwd(), ".e2e-state.json");
const STATE_VERSION = "1.0.0";

export class StateManager {
  state: E2EState = {
    accounts: {},
    version: STATE_VERSION,
  };

  constructor(private network: string) {}

  async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(STATE_FILE_PATH, "utf-8");
      const loadedState = JSON.parse(data);

      // Validate version compatibility
      if (loadedState.version !== STATE_VERSION) {
        console.warn(
          chalk.yellow(
            `⚠️  State file version mismatch. Expected ${STATE_VERSION}, got ${loadedState.version}. Regenerating accounts.`
          )
        );
        return;
      }

      this.state = loadedState;
      console.log(chalk.blue("📁 Loaded existing state from .e2e-state.json"));
    } catch (error) {
      // File doesn't exist or is invalid - that's ok, we'll create it
      console.log(
        chalk.blue("📝 No existing state file found. Will create one.")
      );
    }
  }

  async saveState(): Promise<void> {
    try {
      await fs.writeFile(
        STATE_FILE_PATH,
        JSON.stringify(this.state, null, 2),
        "utf-8"
      );
      console.log(chalk.bgGray("💾 Saved state to .e2e-state.json"));
    } catch (error) {
      console.error(chalk.red("❌ Failed to save state:"), error);
      throw error;
    }
  }

  generateAccount(): AccountState {
    const privateKey = generatePrivateKey();
    const address = privateKeyToAddress(privateKey);

    return {
      privateKey,
      address,
      createdAt: new Date().toISOString(),
      network: this.network,
    };
  }

  getOrGenerateAccount(
    accountType: keyof E2EState["accounts"],
    existingPrivateKey?: string
  ): { privateKey: string; address: string; isNew: boolean } {
    // If private key provided from env, use it
    if (existingPrivateKey) {
      return {
        privateKey: existingPrivateKey,
        address: privateKeyToAddress(existingPrivateKey as `0x${string}`),
        isNew: false,
      };
    }

    // Check if we have a saved account for this type
    const savedAccount = this.state.accounts[accountType];
    if (savedAccount && savedAccount.network === this.network) {
      console.log(chalk.blue(`🔑 Using saved ${accountType} from state file`));
      return {
        privateKey: savedAccount.privateKey,
        address: savedAccount.address,
        isNew: false,
      };
    }

    // Generate new account
    console.log(chalk.yellow(`🔑 Generating new ${accountType} account`));
    const newAccount = this.generateAccount();
    this.state.accounts[accountType] = newAccount;

    return {
      privateKey: newAccount.privateKey,
      address: newAccount.address,
      isNew: true,
    };
  }

  getGeneratedAccounts(): string[] {
    return Object.entries(this.state.accounts)
      .filter(([_, account]) => account !== undefined)
      .map(([type, account]) => `${type}: ${account!.address}`);
  }

  /**
   * Get existing PKP or return undefined if needs minting
   */
  getExistingPKP(): PKPState | undefined {
    const existingPkp = this.state.pkp;

    if (existingPkp && existingPkp.network === this.network) {
      console.log(
        chalk.blue(
          `🔑 Using saved PKP from state file: ${existingPkp.ethAddress}`
        )
      );
      return existingPkp;
    }

    return undefined;
  }

  /**
   * Save a newly minted PKP to state
   */
  savePKP(pkpInfo: PKPInfo): void {
    this.state.pkp = {
      ...pkpInfo,
      createdAt: new Date().toISOString(),
      network: this.network,
    };

    console.log(chalk.bgGray(`💾 Saved PKP to state: ${pkpInfo.ethAddress}`));
  }

  /**
   * Get or mint the single testing PKP
   */
  async getOrMintPKP(
    mintFunction: () => Promise<PKPInfo>
  ): Promise<{ pkp: PKPInfo; isNew: boolean }> {
    // Check if we have an existing PKP
    const existingPKP = this.getExistingPKP();
    if (existingPKP) {
      return {
        pkp: {
          tokenId: existingPKP.tokenId,
          publicKey: existingPKP.publicKey,
          ethAddress: existingPKP.ethAddress,
        },
        isNew: false,
      };
    }

    // Mint new PKP
    console.log(chalk.yellow(`🔨 Minting new testing PKP...`));
    const newPKP = await mintFunction();

    // Save to state
    this.savePKP(newPKP);

    return {
      pkp: newPKP,
      isNew: true,
    };
  }

  /**
   * Check if capacity credits are still valid (not expired within 1 day)
   */
  private isCapacityCreditValid(capacityCredit: CapacityCreditState): boolean {
    const expirationDate = new Date(capacityCredit.expiresAt);
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Consider expired if it expires within the next 24 hours
    const isValid = expirationDate > oneDayFromNow;

    // Add helpful logging when expired/expiring
    if (!isValid) {
      console.log(
        chalk.yellow(
          `   ↳ Capacity credits expire at: ${expirationDate.toISOString()}`
        )
      );
      console.log(chalk.yellow(`   ↳ Current time: ${now.toISOString()}`));
    }

    return isValid;
  }

  /**
   * Get existing capacity credits or return undefined if needs minting
   */
  getExistingCapacityCredits(): CapacityCreditState | undefined {
    const existingCC = this.state.capacityCredits;

    if (existingCC && existingCC.network === this.network) {
      if (this.isCapacityCreditValid(existingCC)) {
        console.log(
          chalk.blue(
            `🎫 Using saved capacity credits: ${existingCC.capacityTokenIdStr}`
          )
        );
        console.log(chalk.blue(`   ↳ Expires: ${existingCC.expiresAt}`));
        return existingCC;
      } else {
        console.log(
          chalk.yellow(`⚠️  Capacity credits found but expired/expiring soon`)
        );
        console.log(
          chalk.yellow(`   ↳ Token ID: ${existingCC.capacityTokenIdStr}`)
        );
      }
    }

    return undefined;
  }

  /**
   * Save newly minted capacity credits to state
   */
  saveCapacityCredits(capacityCreditInfo: CapacityCreditInfo): void {
    // Calculate expiration date using the same logic as mint-cc.ts
    const mintedDate = new Date(capacityCreditInfo.mintedAtUtc);
    const expirationDate = new Date(
      Date.UTC(
        mintedDate.getUTCFullYear(),
        mintedDate.getUTCMonth(),
        mintedDate.getUTCDate() +
          capacityCreditInfo.daysUntilUTCMidnightExpiration,
        0,
        0,
        0,
        0
      )
    );

    this.state.capacityCredits = {
      ...capacityCreditInfo,
      network: this.network,
      expiresAt: expirationDate.toISOString(),
    };

    console.log(
      chalk.green(
        `💾 Saved capacity credits to state: ${capacityCreditInfo.capacityTokenIdStr}`
      )
    );
    console.log(chalk.green(`   ↳ Expires: ${expirationDate.toISOString()}`));
  }

  /**
   * Get or mint capacity credits for testing
   */
  async getOrMintCapacityCredits(
    mintFunction: () => Promise<CapacityCreditInfo>
  ): Promise<{ capacityCredits: CapacityCreditInfo; isNew: boolean }> {
    // Check if we have existing valid capacity credits
    const existingCC = this.getExistingCapacityCredits();
    if (existingCC) {
      return {
        capacityCredits: {
          capacityTokenIdStr: existingCC.capacityTokenIdStr,
          capacityTokenId: existingCC.capacityTokenId,
          requestsPerKilosecond: existingCC.requestsPerKilosecond,
          daysUntilUTCMidnightExpiration:
            existingCC.daysUntilUTCMidnightExpiration,
          mintedAtUtc: existingCC.mintedAtUtc,
        },
        isNew: false,
      };
    }

    // Mint new capacity credits
    console.log(chalk.yellow(`🎫 Minting new capacity credits...`));
    const newCC = await mintFunction();

    // Save to state
    this.saveCapacityCredits(newCC);

    return {
      capacityCredits: newCC,
      isNew: true,
    };
  }

  /**
   * Get existing Vincent app or return undefined if needs registration
   */
  getExistingVincentApp(delegateeAddress: string): VincentAppState | undefined {
    const existingApp = this.state.vincentApp;

    if (
      existingApp &&
      existingApp.network === this.network &&
      existingApp.delegateeAddress === delegateeAddress
    ) {
      console.log(
        chalk.blue(
          `🏢 Using saved Vincent app from state file: ${existingApp.appId}`
        )
      );
      console.log(chalk.blue(`   ↳ Version: ${existingApp.appVersion}`));
      console.log(
        chalk.blue(`   ↳ Delegatee: ${existingApp.delegateeAddress}`)
      );
      return existingApp;
    }

    return undefined;
  }

  /**
   * Save a newly registered Vincent app to state
   */
  saveVincentApp(
    appId: string,
    appVersion: string,
    delegateeAddress: string,
    toolIpfsCids: string[],
    toolPolicies: string[][],
    toolPolicyParameterNames: string[][],
    toolPolicyParameterTypes: number[][],
    toolPolicyParameterValues?: string[][]
  ): void {
    this.state.vincentApp = {
      appId,
      appVersion,
      delegateeAddress,
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes,
      toolPolicyParameterValues,
      createdAt: new Date().toISOString(),
      network: this.network,
    };

    console.log(chalk.green(`💾 Saved Vincent app to state: ${appId}`));
    console.log(chalk.green(`   ↳ Version: ${appVersion}`));
    console.log(chalk.green(`   ↳ Delegatee: ${delegateeAddress}`));
  }

  /**
   * Get or register Vincent app for testing
   */
  async getOrRegisterVincentApp(
    delegateeAddress: string,
    registerFunction: () => Promise<{ appId: string; appVersion: string }>,
    toolIpfsCids: string[],
    toolPolicies: string[][],
    toolPolicyParameterNames: string[][],
    toolPolicyParameterTypes: number[][],
    toolPolicyParameterValues?: string[][]
  ): Promise<{
    appId: string;
    appVersion: string;
    isNew: boolean;
    toolIpfsCids: string[];
    toolPolicies: string[][];
    toolPolicyParameterNames: string[][];
    toolPolicyParameterTypes: number[][];
    toolPolicyParameterValues?: string[][];
  }> {
    // Check if we have an existing Vincent app for this delegatee
    const existingApp = this.getExistingVincentApp(delegateeAddress);
    if (existingApp) {
      return {
        appId: existingApp.appId,
        appVersion: existingApp.appVersion,
        isNew: false,
        toolIpfsCids: existingApp.toolIpfsCids,
        toolPolicies: existingApp.toolPolicies,
        toolPolicyParameterNames: existingApp.toolPolicyParameterNames,
        toolPolicyParameterTypes: existingApp.toolPolicyParameterTypes,
        toolPolicyParameterValues: existingApp.toolPolicyParameterValues,
      };
    }

    // Register new Vincent app
    console.log(chalk.yellow(`🏢 Registering new Vincent app...`));
    const { appId, appVersion } = await registerFunction();

    // Save to state
    this.saveVincentApp(
      appId,
      appVersion,
      delegateeAddress,
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes,
      toolPolicyParameterValues
    );

    return {
      appId,
      appVersion,
      isNew: true,
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes,
      toolPolicyParameterValues,
    };
  }

  /**
   * Update existing Vincent app state with parameter values
   */
  updateVincentAppParameterValues(
    appId: string,
    toolPolicyParameterValues: string[][]
  ): void {
    if (this.state.vincentApp && this.state.vincentApp.appId === appId) {
      this.state.vincentApp.toolPolicyParameterValues = toolPolicyParameterValues;
      console.log(chalk.green(`💾 Updated Vincent app parameter values for app: ${appId}`));
    }
  }

  /**
   * Check if PKP is already permitted for the given app version
   */
  isPKPPermittedForAppVersion(
    pkpTokenId: string,
    appId: string,
    appVersion: string
  ): boolean {
    if (!this.state.pkpAppPermissions) {
      return false;
    }

    const existingPermission = this.state.pkpAppPermissions.find(
      (permission) =>
        permission.pkpTokenId === pkpTokenId &&
        permission.appId === appId &&
        permission.appVersion === appVersion &&
        permission.network === this.network
    );

    if (existingPermission) {
      console.log(
        chalk.blue(
          `🔐 PKP ${pkpTokenId} already permitted for app ${appId} v${appVersion}`
        )
      );
      console.log(
        chalk.blue(`   ↳ Permitted at: ${existingPermission.permittedAt}`)
      );
      return true;
    }

    return false;
  }

  /**
   * Save PKP app permission to state
   */
  savePKPAppPermission(
    pkpTokenId: string,
    appId: string,
    appVersion: string
  ): void {
    if (!this.state.pkpAppPermissions) {
      this.state.pkpAppPermissions = [];
    }

    // Check if permission already exists to avoid duplicates
    const existingIndex = this.state.pkpAppPermissions.findIndex(
      (permission) =>
        permission.pkpTokenId === pkpTokenId &&
        permission.appId === appId &&
        permission.appVersion === appVersion &&
        permission.network === this.network
    );

    const newPermission: PKPAppPermissionState = {
      pkpTokenId,
      appId,
      appVersion,
      permittedAt: new Date().toISOString(),
      network: this.network,
    };

    if (existingIndex >= 0) {
      // Update existing permission
      this.state.pkpAppPermissions[existingIndex] = newPermission;
      console.log(
        chalk.bgGray(
          `💾 Updated PKP app permission: PKP ${pkpTokenId} for app ${appId} v${appVersion}`
        )
      );
    } else {
      // Add new permission
      this.state.pkpAppPermissions.push(newPermission);
      console.log(
        chalk.bgGray(
          `💾 Saved PKP app permission: PKP ${pkpTokenId} for app ${appId} v${appVersion}`
        )
      );
    }
  }
}
