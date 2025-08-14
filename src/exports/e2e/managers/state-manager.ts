import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { CapacityCreditInfo } from "../utils/mint-cc";
import { PKPInfo } from "../utils/mint-pkp";

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
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  abilityPolicyParameterNames: string[][];
  abilityPolicyParameterTypes: number[][];
  abilityPolicyParameterValues?: string[][]; // Optional for backward compatibility
}

interface PKPAppPermissionState {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permittedAt: string;
  network: string;
}

interface ConfigurationState {
  configHash: string;
  abilityIpfsCids: string[];
  abilityPolicyCids: string[][];
  lastUsed: string;
  network: string;
  state: {
    vincentApp?: VincentAppState;
    pkpAppPermissions?: PKPAppPermissionState[];
  };
}

interface AppVersionConfiguration {
  appId: string;
  appVersion: string;
  abilityIpfsCids: string[];
  abilityPolicyCids: string[][];
  lastUsed: string;
  network: string;
  state: {
    vincentApp: VincentAppState;
    pkpAppPermissions?: PKPAppPermissionState[];
  };
}

interface NestedE2EState {
  version: string;
  // Keep legacy structures for backward compatibility
  sharedAccounts?: {
    [network: string]: {
      appManager?: AccountState;
      appDelegatee?: AccountState;
      agentWalletPkpOwner?: AccountState;
    };
  };
  sharedPkps?: {
    [network: string]: PKPState;
  };
  sharedCapacityCredits?: {
    [network: string]: CapacityCreditState;
  };
  testFiles: {
    [fileName: string]: {
      // Per-test-file accounts (isolated)
      accounts?: {
        [network: string]: {
          appManager?: AccountState;
          appDelegatee?: AccountState;
          agentWalletPkpOwner?: AccountState;
        };
      };
      // Per-test-file PKPs (isolated)
      pkps?: {
        [network: string]: PKPState;
      };
      // Per-test-file capacity credits (isolated)
      capacityCredits?: {
        [network: string]: CapacityCreditState;
      };
      configurations: {
        [configHash: string]: ConfigurationState;
      };
      // New app-version-based configurations
      appVersions: {
        [appVersionKey: string]: AppVersionConfiguration; // key format: "appId-appVersion"
      };
    };
  };
}

const STATE_FILE_PATH = path.join(process.cwd(), ".e2e-state.json");
const STATE_VERSION = "2.0.0";

export class StateManager {
  nestedState: NestedE2EState = {
    version: STATE_VERSION,
    testFiles: {},
  };

  private currentConfigState: ConfigurationState | null = null;

  constructor(
    private network: string,
    private testFileName: string,
    private configHash: string,
    abilityIpfsCids?: string[],
    abilityPolicyCids?: string[][]
  ) {
    // If ability/policy CIDs are provided, generate the real config hash
    if (abilityIpfsCids && abilityPolicyCids) {
      this.configHash = StateManager.generateConfigHash(
        abilityIpfsCids,
        abilityPolicyCids
      );
    }

    // Initialize the current configuration state
    this.currentConfigState = this.getCurrentConfigState();
    console.log(
      `🏗️  StateManager initialized with nested structure v${STATE_VERSION} for ${testFileName}:${this.configHash}`
    );
  }

  /**
   * Generate configuration hash from ability and policy IPFS CIDs
   */
  static generateConfigHash(
    abilityIpfsCids: string[],
    abilityPolicyCids: string[][]
  ): string {
    // Combine all IPFS CIDs and create a hash
    const flattenedPolicyCids = abilityPolicyCids.flat();
    const allCids = [...abilityIpfsCids, ...flattenedPolicyCids];
    const sortedCids = allCids.sort();
    const cidString = sortedCids.join("");
    const hash = createHash("sha256")
      .update(cidString)
      .digest("hex")
      .substring(0, 8);

    return hash;
  }

  /**
   * Auto-detect test filename from call stack
   */
  static autoDetectTestFileName(): string {
    const stack = new Error().stack;
    if (!stack) return "unknown-test.ts";

    const stackLines = stack.split("\n");
    for (const line of stackLines) {
      const match = line.match(/\/([^\/\s]+\.ts):/);
      if (match && match[1] !== "state-manager.ts" && match[1] !== "init.ts") {
        return match[1];
      }
    }
    return "unknown-test.ts";
  }

  /**
   * Get current configuration state, creating if needed
   */
  private getCurrentConfigState(): ConfigurationState {
    if (!this.nestedState.testFiles[this.testFileName]) {
      this.nestedState.testFiles[this.testFileName] = {
        accounts: {},
        pkps: {},
        capacityCredits: {},
        configurations: {},
        appVersions: {},
      };
    }

    // Ensure all structures exist for this test file
    if (!this.nestedState.testFiles[this.testFileName].accounts) {
      this.nestedState.testFiles[this.testFileName].accounts = {};
    }
    if (!this.nestedState.testFiles[this.testFileName].pkps) {
      this.nestedState.testFiles[this.testFileName].pkps = {};
    }
    if (!this.nestedState.testFiles[this.testFileName].capacityCredits) {
      this.nestedState.testFiles[this.testFileName].capacityCredits = {};
    }

    if (
      !this.nestedState.testFiles[this.testFileName].configurations[
      this.configHash
      ]
    ) {
      this.nestedState.testFiles[this.testFileName].configurations[
        this.configHash
      ] = {
        configHash: this.configHash,
        abilityIpfsCids: [],
        abilityPolicyCids: [],
        lastUsed: new Date().toISOString(),
        network: this.network,
        state: {},
      };
    }

    return this.nestedState.testFiles[this.testFileName].configurations[
      this.configHash
    ];
  }

  /**
   * Set the real configuration hash based on ability/policy CIDs
   * This should be called before any state operations when CIDs are known
   */
  setConfigurationFromCIDs(
    abilityIpfsCids: string[],
    abilityPolicyCids: string[][]
  ): void {
    const newConfigHash = StateManager.generateConfigHash(
      abilityIpfsCids,
      abilityPolicyCids
    );

    if (newConfigHash !== this.configHash) {
      console.log(
        `🔄 Setting configuration from ${this.configHash} to ${newConfigHash}`
      );

      // Update the internal config hash
      (this as any).configHash = newConfigHash;

      // Reset current config state since we're switching to a new config
      this.currentConfigState = null;

      // Initialize the new configuration state
      this.currentConfigState = this.getCurrentConfigState();

      // Update metadata
      this.updateConfigurationMetadata(abilityIpfsCids, abilityPolicyCids);
    } else {
      // Update metadata even if hash is same (for lastUsed timestamp)
      this.updateConfigurationMetadata(abilityIpfsCids, abilityPolicyCids);
    }
  }

  /**
   * Update configuration metadata
   */
  updateConfigurationMetadata(
    abilityIpfsCids: string[],
    abilityPolicyCids: string[][]
  ) {
    const configState = this.getCurrentConfigState();
    configState.abilityIpfsCids = abilityIpfsCids;
    configState.abilityPolicyCids = abilityPolicyCids;
    configState.lastUsed = new Date().toISOString();
  }

  /**
   * Generate app version key from appId and appVersion
   */
  private static generateAppVersionKey(
    appId: string,
    appVersion: string
  ): string {
    return `${appId}-${appVersion}`;
  }

  /**
   * Get app version configuration, creating if needed
   */
  private getAppVersionConfiguration(
    appId: string,
    appVersion: string
  ): AppVersionConfiguration {
    const appVersionKey = StateManager.generateAppVersionKey(appId, appVersion);

    if (!this.nestedState.testFiles[this.testFileName]) {
      this.nestedState.testFiles[this.testFileName] = {
        configurations: {},
        appVersions: {},
      };
    }

    if (
      !this.nestedState.testFiles[this.testFileName].appVersions[appVersionKey]
    ) {
      throw new Error(
        `App version configuration ${appVersionKey} not found. It should be created when saving the app.`
      );
    }

    return this.nestedState.testFiles[this.testFileName].appVersions[
      appVersionKey
    ];
  }

  /**
   * Save app version configuration
   */
  private saveAppVersionConfiguration(
    appId: string,
    appVersion: string,
    vincentApp: VincentAppState,
    abilityIpfsCids: string[],
    abilityPolicyCids: string[][]
  ): void {
    const appVersionKey = StateManager.generateAppVersionKey(appId, appVersion);

    if (!this.nestedState.testFiles[this.testFileName]) {
      this.nestedState.testFiles[this.testFileName] = {
        configurations: {},
        appVersions: {},
      };
    }

    this.nestedState.testFiles[this.testFileName].appVersions[appVersionKey] = {
      appId,
      appVersion,
      abilityIpfsCids,
      abilityPolicyCids,
      lastUsed: new Date().toISOString(),
      network: this.network,
      state: {
        vincentApp,
        pkpAppPermissions: [],
      },
    };

    console.log(
      chalk.green(`💾 Saved app version configuration: ${appVersionKey}`)
    );
  }

  /**
   * Get or register Vincent app using app versioning approach
   */
  async getOrRegisterVincentAppVersioned(
    delegateeAddress: string,
    registerAppFunction: () => Promise<{ appId: string; appVersion: string }>,
    registerNextVersionFunction: (
      appId: string
    ) => Promise<{ appId: string; appVersion: string }>,
    abilityIpfsCids: string[],
    abilityPolicies: string[][],
    abilityPolicyParameterNames: string[][],
    abilityPolicyParameterTypes: number[][],
    abilityPolicyParameterValues?: string[][]
  ): Promise<{
    appId: string;
    appVersion: string;
    isNew: boolean;
    isNewVersion: boolean;
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
    abilityPolicyParameterNames: string[][];
    abilityPolicyParameterTypes: number[][];
    abilityPolicyParameterValues?: string[][];
  }> {
    // First, check if we have any existing app for this delegatee
    const existingApp = this.getExistingVincentApp(delegateeAddress);

    if (existingApp) {
      const appId = existingApp.appId;

      // Check if current abilities/policies match any existing app version
      const matchingAppVersion = this.findMatchingAppVersion(
        appId,
        abilityIpfsCids,
        abilityPolicies
      );

      if (matchingAppVersion) {
        console.log(
          chalk.blue(
            `🏢 Using existing app version: ${appId} v${matchingAppVersion}`
          )
        );
        return {
          appId,
          appVersion: matchingAppVersion,
          isNew: false,
          isNewVersion: false,
          abilityIpfsCids,
          abilityPolicies,
          abilityPolicyParameterNames,
          abilityPolicyParameterTypes,
          abilityPolicyParameterValues,
        };
      } else {
        // Register new version for existing app
        console.log(
          chalk.yellow(`🏢 Registering new version for existing app: ${appId}`)
        );
        const { appVersion } = await registerNextVersionFunction(appId);

        // Save the new app version
        const vincentApp: VincentAppState = {
          appId,
          appVersion,
          delegateeAddress,
          abilityIpfsCids,
          abilityPolicies,
          abilityPolicyParameterNames,
          abilityPolicyParameterTypes,
          abilityPolicyParameterValues,
          createdAt: new Date().toISOString(),
          network: this.network,
        };

        this.saveAppVersionConfiguration(
          appId,
          appVersion,
          vincentApp,
          abilityIpfsCids,
          abilityPolicies
        );

        return {
          appId,
          appVersion,
          isNew: false,
          isNewVersion: true,
          abilityIpfsCids,
          abilityPolicies,
          abilityPolicyParameterNames,
          abilityPolicyParameterTypes,
          abilityPolicyParameterValues,
        };
      }
    } else {
      // Register completely new app
      console.log(chalk.yellow(`🏢 Registering new Vincent app...`));
      const { appId, appVersion } = await registerAppFunction();

      // Save the new app version
      const vincentApp: VincentAppState = {
        appId,
        appVersion,
        delegateeAddress,
        abilityIpfsCids,
        abilityPolicies,
        abilityPolicyParameterNames,
        abilityPolicyParameterTypes,
        abilityPolicyParameterValues,
        createdAt: new Date().toISOString(),
        network: this.network,
      };

      this.saveAppVersionConfiguration(
        appId,
        appVersion,
        vincentApp,
        abilityIpfsCids,
        abilityPolicies
      );

      // Also save to current config for backward compatibility
      this.saveVincentApp(
        appId,
        appVersion,
        delegateeAddress,
        abilityIpfsCids,
        abilityPolicies,
        abilityPolicyParameterNames,
        abilityPolicyParameterTypes,
        abilityPolicyParameterValues
      );

      return {
        appId,
        appVersion,
        isNew: true,
        isNewVersion: false,
        abilityIpfsCids,
        abilityPolicies,
        abilityPolicyParameterNames,
        abilityPolicyParameterTypes,
        abilityPolicyParameterValues,
      };
    }
  }

  /**
   * Find matching app version based on ability/policy CIDs
   */
  private findMatchingAppVersion(
    appId: string,
    abilityIpfsCids: string[],
    abilityPolicies: string[][]
  ): string | undefined {
    if (!this.nestedState.testFiles[this.testFileName]?.appVersions) {
      return undefined;
    }

    const appVersions =
      this.nestedState.testFiles[this.testFileName].appVersions;

    for (const [appVersionKey, config] of Object.entries(appVersions)) {
      if (config.appId === appId && config.network === this.network) {
        // Check if ability CIDs match
        const abilityCidsMatch =
          JSON.stringify(config.abilityIpfsCids.sort()) ===
          JSON.stringify(abilityIpfsCids.sort());
        const policyCidsMatch =
          JSON.stringify(config.abilityPolicyCids) ===
          JSON.stringify(abilityPolicies);

        if (abilityCidsMatch && policyCidsMatch) {
          console.log(
            chalk.blue(`🔍 Found matching app version: ${appVersionKey}`)
          );
          return config.appVersion;
        }
      }
    }

    console.log(
      chalk.yellow(
        `🔍 No matching app version found for appId ${appId} with current abilities/policies`
      )
    );
    return undefined;
  }

  async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(STATE_FILE_PATH, "utf-8");
      const loadedState = JSON.parse(data);

      // Validate version compatibility
      if (loadedState.version !== STATE_VERSION) {
        console.warn(
          chalk.yellow(
            `⚠️  State file version mismatch. Expected ${STATE_VERSION}, got ${loadedState.version}. Creating new state.`
          )
        );
        return;
      }

      this.nestedState = loadedState;
      this.currentConfigState = this.getCurrentConfigState();
      console.log(
        chalk.blue(
          `📁 Loaded existing state for ${this.testFileName}:${this.configHash}`
        )
      );
    } catch (error) {
      // File doesn't exist or is invalid - that's ok, we'll create it
      console.log(
        chalk.blue("📝 No existing state file found. Will create one.")
      );
      this.currentConfigState = this.getCurrentConfigState();
    }
  }

  async saveState(): Promise<void> {
    try {
      // Update last used timestamp
      if (this.currentConfigState) {
        this.currentConfigState.lastUsed = new Date().toISOString();
      }

      await fs.writeFile(
        STATE_FILE_PATH,
        JSON.stringify(this.nestedState, null, 2),
        "utf-8"
      );
      console.log(
        chalk.gray(`💾 Saved state for ${this.testFileName}:${this.configHash}`)
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to save state:"), error);
      throw error;
    }
  }

  generateAccount(): AccountState {
    const privateKey = generatePrivateKey();
    const address = privateKeyToAccount(privateKey).address;

    return {
      privateKey,
      address,
      createdAt: new Date().toISOString(),
      network: this.network,
    };
  }

  getOrGenerateAccount(
    accountType: "appManager" | "appDelegatee" | "agentWalletPkpOwner",
    existingPrivateKey?: string
  ): { privateKey: string; address: string; isNew: boolean } {
    // If private key provided from env, use it
    if (existingPrivateKey) {
      const address = privateKeyToAccount(
        existingPrivateKey as `0x${string}`
      ).address;
      return {
        privateKey: existingPrivateKey,
        address,
        isNew: false,
      };
    }

    // Ensure current config state is initialized (which initializes accounts structure)
    this.getCurrentConfigState();

    // Get accounts for this test file and network
    const testFileAccounts =
      this.nestedState.testFiles[this.testFileName].accounts!;

    // Ensure network accounts exist for this test file
    if (!testFileAccounts[this.network]) {
      testFileAccounts[this.network] = {};
    }

    // Check if we have a saved account for this type in this test file
    const savedAccount = testFileAccounts[this.network][accountType];

    if (savedAccount && savedAccount.network === this.network) {
      console.log(
        chalk.blue(
          `🔑 Using ${accountType} from ${this.testFileName}: ${savedAccount.address}`
        )
      );
      return {
        privateKey: savedAccount.privateKey,
        address: savedAccount.address,
        isNew: false,
      };
    }

    // Check for legacy shared account and migrate if exists
    const legacyAccount =
      this.nestedState.sharedAccounts?.[this.network]?.[accountType];
    if (legacyAccount && legacyAccount.network === this.network) {
      console.log(
        chalk.blue(
          `🔄 Migrating shared ${accountType} to ${this.testFileName}: ${legacyAccount.address}`
        )
      );
      testFileAccounts[this.network][accountType] = legacyAccount;
      return {
        privateKey: legacyAccount.privateKey,
        address: legacyAccount.address,
        isNew: false,
      };
    }

    // Generate new account for this test file
    console.log(
      chalk.yellow(
        `🔑 Generating new ${accountType} account for ${this.testFileName}`
      )
    );
    const newAccount = this.generateAccount();
    testFileAccounts[this.network][accountType] = newAccount;

    return {
      privateKey: newAccount.privateKey,
      address: newAccount.address,
      isNew: true,
    };
  }

  getGeneratedAccounts(): string[] {
    // Get accounts for this test file
    const testFileAccounts =
      this.nestedState.testFiles[this.testFileName]?.accounts?.[this.network] ||
      {};

    // Also check legacy shared accounts for backward compatibility
    const legacyAccounts =
      this.nestedState.sharedAccounts?.[this.network] || {};

    // Combine both sources
    const allAccounts = { ...legacyAccounts, ...testFileAccounts };

    return Object.entries(allAccounts)
      .filter(([_, account]) => account !== undefined)
      .map(([type, account]) => `${type}: ${account!.address}`);
  }

  /**
   * Get existing PKP or return undefined if needs minting
   */
  getExistingPKP(): PKPState | undefined {
    // Ensure current config state is initialized
    this.getCurrentConfigState();

    // Get PKP for this test file and network
    const testFilePkps = this.nestedState.testFiles[this.testFileName].pkps!;
    const existingPkp = testFilePkps[this.network];

    if (existingPkp && existingPkp.network === this.network) {
      console.log(
        chalk.blue(
          `🔑 Using PKP from ${this.testFileName}: ${existingPkp.ethAddress}`
        )
      );
      return existingPkp;
    }

    // Check for legacy shared PKP and migrate if exists
    const legacyPkp = this.nestedState.sharedPkps?.[this.network];
    if (legacyPkp && legacyPkp.network === this.network) {
      console.log(
        chalk.blue(
          `🔄 Migrating shared PKP to ${this.testFileName}: ${legacyPkp.ethAddress}`
        )
      );
      testFilePkps[this.network] = legacyPkp;
      return legacyPkp;
    }

    return undefined;
  }

  /**
   * Save a newly minted PKP to state
   */
  savePKP(pkpInfo: PKPInfo): void {
    // Ensure current config state is initialized
    this.getCurrentConfigState();

    // Save PKP for this test file and network
    const testFilePkps = this.nestedState.testFiles[this.testFileName].pkps!;
    testFilePkps[this.network] = {
      ...pkpInfo,
      createdAt: new Date().toISOString(),
      network: this.network,
    };

    console.log(
      chalk.gray(`💾 Saved PKP for ${this.testFileName}: ${pkpInfo.ethAddress}`)
    );
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
    // Ensure current config state is initialized
    this.getCurrentConfigState();

    // Get capacity credits for this test file and network
    const testFileCC =
      this.nestedState.testFiles[this.testFileName].capacityCredits!;
    const existingCC = testFileCC[this.network];

    if (existingCC && existingCC.network === this.network) {
      if (this.isCapacityCreditValid(existingCC)) {
        console.log(
          chalk.blue(
            `🎫 Using capacity credits from ${this.testFileName}: ${existingCC.capacityTokenIdStr}`
          )
        );
        console.log(chalk.blue(`   ↳ Expires: ${existingCC.expiresAt}`));
        return existingCC;
      } else {
        console.log(
          chalk.yellow(
            `⚠️  Capacity credits found but expired/expiring soon for ${this.testFileName}`
          )
        );
        console.log(
          chalk.yellow(`   ↳ Token ID: ${existingCC.capacityTokenIdStr}`)
        );
      }
    }

    // Check for legacy shared capacity credits and migrate if exists
    const legacyCC = this.nestedState.sharedCapacityCredits?.[this.network];
    if (legacyCC && legacyCC.network === this.network) {
      if (this.isCapacityCreditValid(legacyCC)) {
        console.log(
          chalk.blue(
            `🔄 Migrating shared capacity credits to ${this.testFileName}: ${legacyCC.capacityTokenIdStr}`
          )
        );
        testFileCC[this.network] = legacyCC;
        return legacyCC;
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

    // Ensure current config state is initialized
    this.getCurrentConfigState();

    // Save capacity credits for this test file and network
    const testFileCC =
      this.nestedState.testFiles[this.testFileName].capacityCredits!;
    testFileCC[this.network] = {
      ...capacityCreditInfo,
      network: this.network,
      expiresAt: expirationDate.toISOString(),
    };

    console.log(
      chalk.green(
        `💾 Saved capacity credits for ${this.testFileName}: ${capacityCreditInfo.capacityTokenIdStr}`
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
   * First checks current config, then searches all configs for apps with same delegatee
   */
  getExistingVincentApp(delegateeAddress: string): VincentAppState | undefined {
    const configState = this.getCurrentConfigState();
    const existingApp = configState.state.vincentApp;

    if (
      existingApp &&
      existingApp.network === this.network &&
      existingApp.delegateeAddress === delegateeAddress
    ) {
      console.log(
        chalk.blue(
          `🏢 Using saved Vincent app for config ${this.configHash}: ${existingApp.appId}`
        )
      );
      console.log(chalk.blue(`   ↳ Version: ${existingApp.appVersion}`));
      console.log(
        chalk.blue(`   ↳ Delegatee: ${existingApp.delegateeAddress}`)
      );
      return existingApp;
    }

    // If no app in current config, search all configs for apps with same delegatee
    // This handles the case where the smart contract prevents the same delegatee from registering multiple apps
    if (this.nestedState.testFiles[this.testFileName]) {
      const allConfigs =
        this.nestedState.testFiles[this.testFileName].configurations;
      for (const [configHash, config] of Object.entries(allConfigs)) {
        if (configHash === this.configHash) continue; // Skip current config (already checked)

        const appInOtherConfig = config.state.vincentApp;
        if (
          appInOtherConfig &&
          appInOtherConfig.network === this.network &&
          appInOtherConfig.delegateeAddress === delegateeAddress
        ) {
          console.log(
            chalk.yellow(
              `🏢 Found existing Vincent app in different config ${configHash}: ${appInOtherConfig.appId}`
            )
          );
          console.log(
            chalk.yellow(`   ↳ Version: ${appInOtherConfig.appVersion}`)
          );
          console.log(
            chalk.yellow(`   ↳ Delegatee: ${appInOtherConfig.delegateeAddress}`)
          );
          console.log(
            chalk.yellow(
              `   ↳ Copying app to current config ${this.configHash}`
            )
          );

          // Copy the app to current configuration since same delegatee can't register twice
          configState.state.vincentApp = {
            ...appInOtherConfig,
            // Update metadata to reflect current configuration
            createdAt: new Date().toISOString(),
          };

          return appInOtherConfig;
        }
      }
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
    abilityIpfsCids: string[],
    abilityPolicies: string[][],
    abilityPolicyParameterNames: string[][],
    abilityPolicyParameterTypes: number[][],
    abilityPolicyParameterValues?: string[][]
  ): void {
    const configState = this.getCurrentConfigState();
    configState.state.vincentApp = {
      appId,
      appVersion,
      delegateeAddress,
      abilityIpfsCids,
      abilityPolicies,
      abilityPolicyParameterNames,
      abilityPolicyParameterTypes,
      abilityPolicyParameterValues,
      createdAt: new Date().toISOString(),
      network: this.network,
    };

    console.log(
      chalk.green(
        `💾 Saved Vincent app for config ${this.configHash}: ${appId}`
      )
    );
    console.log(chalk.green(`   ↳ Version: ${appVersion}`));
    console.log(chalk.green(`   ↳ Delegatee: ${delegateeAddress}`));
  }

  /**
   * Get or register Vincent app for testing
   */
  async getOrRegisterVincentApp(
    delegateeAddress: string,
    registerFunction: () => Promise<{ appId: string; appVersion: string }>,
    abilityIpfsCids: string[],
    abilityPolicies: string[][],
    abilityPolicyParameterNames: string[][],
    abilityPolicyParameterTypes: number[][],
    abilityPolicyParameterValues?: string[][]
  ): Promise<{
    appId: string;
    appVersion: string;
    isNew: boolean;
    abilityIpfsCids: string[];
    abilityPolicies: string[][];
    abilityPolicyParameterNames: string[][];
    abilityPolicyParameterTypes: number[][];
    abilityPolicyParameterValues?: string[][];
  }> {
    // Check if we have an existing Vincent app for this delegatee
    const existingApp = this.getExistingVincentApp(delegateeAddress);
    if (existingApp) {
      // Update the current configuration with the new ability/policy information
      // since we're reusing an existing app but with potentially different abilities
      const configState = this.getCurrentConfigState();
      if (configState.state.vincentApp) {
        console.log(
          chalk.blue(
            `🔄 Updating reused app ${existingApp.appId} with current ability/policy configuration`
          )
        );
        configState.state.vincentApp.abilityIpfsCids = abilityIpfsCids;
        configState.state.vincentApp.abilityPolicies = abilityPolicies;
        configState.state.vincentApp.abilityPolicyParameterNames =
          abilityPolicyParameterNames;
        configState.state.vincentApp.abilityPolicyParameterTypes =
          abilityPolicyParameterTypes;
        configState.state.vincentApp.abilityPolicyParameterValues =
          abilityPolicyParameterValues;
      }

      return {
        appId: existingApp.appId,
        appVersion: existingApp.appVersion,
        isNew: false,
        abilityIpfsCids,
        abilityPolicies,
        abilityPolicyParameterNames,
        abilityPolicyParameterTypes,
        abilityPolicyParameterValues,
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
      abilityIpfsCids,
      abilityPolicies,
      abilityPolicyParameterNames,
      abilityPolicyParameterTypes,
      abilityPolicyParameterValues
    );

    return {
      appId,
      appVersion,
      isNew: true,
      abilityIpfsCids,
      abilityPolicies,
      abilityPolicyParameterNames,
      abilityPolicyParameterTypes,
      abilityPolicyParameterValues,
    };
  }

  /**
   * Update existing Vincent app state with parameter values
   */
  updateVincentAppParameterValues(
    appId: string,
    abilityPolicyParameterValues: string[][]
  ): void {
    const configState = this.getCurrentConfigState();
    if (
      configState.state.vincentApp &&
      configState.state.vincentApp.appId === appId
    ) {
      configState.state.vincentApp.abilityPolicyParameterValues =
        abilityPolicyParameterValues;
      console.log(
        chalk.green(
          `💾 Updated Vincent app parameter values for config ${this.configHash}: ${appId}`
        )
      );
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
    const configState = this.getCurrentConfigState();
    if (!configState.state.pkpAppPermissions) {
      return false;
    }

    const existingPermission = configState.state.pkpAppPermissions.find(
      (permission) =>
        permission.pkpTokenId === pkpTokenId &&
        permission.appId === appId &&
        permission.appVersion === appVersion &&
        permission.network === this.network
    );

    if (existingPermission) {
      console.log(
        chalk.blue(
          `🔐 PKP ${pkpTokenId} already permitted for app ${appId} v${appVersion} in config ${this.configHash}`
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
    const configState = this.getCurrentConfigState();
    if (!configState.state.pkpAppPermissions) {
      configState.state.pkpAppPermissions = [];
    }

    // Check if permission already exists to avoid duplicates
    const existingIndex = configState.state.pkpAppPermissions.findIndex(
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
      configState.state.pkpAppPermissions[existingIndex] = newPermission;
      console.log(
        chalk.gray(
          `💾 Updated PKP app permission for config ${this.configHash}: PKP ${pkpTokenId} for app ${appId} v${appVersion}`
        )
      );
    } else {
      // Add new permission
      configState.state.pkpAppPermissions.push(newPermission);
      console.log(
        chalk.gray(
          `💾 Saved PKP app permission for config ${this.configHash}: PKP ${pkpTokenId} for app ${appId} v${appVersion}`
        )
      );
    }
  }
}
