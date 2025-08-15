const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const chalk = require("chalk");
const {
  createVincentConfig,
  createEnvSample,
} = require("../utils/config-utils");
const {
  processTemplate,
  getTemplateFiles,
  validateTemplateType,
} = require("../template-loader");

// Default names for initial ability and policy
const DEFAULT_ABILITY_NAME = "native-send";
const DEFAULT_ABILITY_CAMEL_CASE_NAME = "nativeSend";

const DEFAULT_POLICY_NAME = "send-counter-limit";
const DEFAULT_POLICY_CAMEL_CASE_NAME = "sendCounterLimit";

// File names configuration
const FILE_NAMES = {
  e2eStateFile: ".e2e-state.json",
};

// Package configuration - version and installation behavior
const PACKAGES_CONFIG = {
  tsx: { version: "4.0.0", behavior: "onlyIfMissing" },
  "dotenv-cli": { version: "8.0.0", behavior: "onlyIfMissing" },
  ethers: { version: "^5.7.2", behavior: "always" },
  chalk: { version: "4.1.2", behavior: "always" },
  "@lit-protocol/vincent-app-sdk": { version: "*", behavior: "always" },
  "@lit-protocol/vincent-scaffold-sdk": { version: "*", behavior: "always" },
  "@lit-protocol/vincent-contracts-sdk": { version: "*", behavior: "always" },
  // "@ansonhkg/abi-extractor": { version: "1.1.0", behavior: "always" },
};

// AI Rules configuration - files to create/update during init
const AI_RULES_CONFIG = {
  "AGENTS.md": {
    description: "General AI agents guidance",
    sourcePath: path.join(__dirname, "..", "ai-rules", "AGENTS.md"),
  },
  "CLAUDE.md": {
    description: "Claude Code specific guidance",
    sourcePath: path.join(__dirname, "..", "ai-rules", "CLAUDE.md"),
  },
  // "GEMINI.md": {
  //   description: "Google Gemini specific guidance",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", "GEMINI.md")
  // },
  // ".cursorrules": {
  //   description: "Cursor IDE rules",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".cursorrules")
  // },
  // ".cursor/rules": {
  //   description: "Cursor IDE extended rules",
  //   directory: ".cursor",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".cursor", "rules")
  // },
  // ".windsurfrules": {
  //   description: "Windsurf IDE guidance",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".windsurfrules")
  // },
  // ".clinerules": {
  //   description: "Cline AI rules",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".clinerules")
  // },
  // ".github/copilot-instructions.md": {
  //   description: "GitHub Copilot guidance",
  //   directory: ".github",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".github", "copilot-instructions.md")
  // },
  // ".bolt/prompt": {
  //   description: "Bolt AI guidance",
  //   directory: ".bolt",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".bolt", "prompt")
  // },
  // ".rules": {
  //   description: "General fallback rules",
  //   sourcePath: path.join(__dirname, "..", "ai-rules", ".rules")
  // },
  "erc-20-feature-request.md": {
    description: "ERC-20 ability implementation example",
    sourcePath: path.join(
      __dirname,
      "..",
      "ai-rules",
      "erc-20-feature-request.md"
    ),
  },
};

// Scripts configuration - complete scripts object that can be rendered
const SCRIPTS_CONFIG = {
  "vincent:hardreset": (config) => `node vincent-scripts/hardReset.js`,
  "vincent:build": (config) => `node vincent-scripts/buildPackages.js`,
  "vincent:e2e:reset": (config) => `node vincent-scripts/resetE2E.js`,
  "vincent:e2e": (config) => `dotenv -e .env -- tsx ${config.e2ePath}`,
  // "vincent:e2e:erc20": (config) => `dotenv -e .env -- tsx vincent-e2e/src/e2e-erc20.ts`,
  // "vincent:forge:check": (config) =>
  //   `node -e "const { spawn } = require('child_process'); const proc = spawn('forge', ['--version'], { stdio: 'pipe' }); proc.on('close', (code) => { if (code === 0) { console.log('✅ Foundry is available'); process.exit(0); } else { console.log('❌ Foundry (forge) is not installed. Install it from https://getfoundry.sh/'); process.exit(1); } }); proc.on('error', () => { console.log('❌ Foundry (forge) is not installed. Install it from https://getfoundry.sh/'); process.exit(1); });"`,
  // "vincent:forge:init": (config) =>
  //   `npm run vincent:forge:check && dotenv -e .env -- forge init ./vincent-policy-contracts/counter && cd ./vincent-policy-contracts/counter && forge build && dotenv -e .env -- forge script script/Counter.s.sol --rpc-url https://yellowstone-rpc.litprotocol.com --broadcast --private-key %TEST_FUNDER_PRIVATE_KEY% && npm run vincent:gen-abi`,
  // "vincent:forge:deploy": (config) =>
  //   `cd ./vincent-policy-contracts/counter && dotenv -e .env -- forge script script/Counter.s.sol --rpc-url https://yellowstone-rpc.litprotocol.com --broadcast --private-key %TEST_FUNDER_PRIVATE_KEY% && npm run vincent:gen-abi`,
  // "vincent:gen-abi": (config) =>
  //   `cd ./vincent-policy-contracts/counter && npx forge-to-signature Counter.s.sol 175188 ./generated -n counterSignatures`,
};

/**
 * Copy directory recursively
 */
function copyDirectoryRecursively(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectoryRecursively(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Copy e2e template to project root
 */
function copyE2ETemplate(e2eDirectory = "./vincent-e2e") {
  try {
    const sourceDir = path.join(__dirname, "..", "templates", "e2e");
    const targetDir = path.resolve(e2eDirectory);

    if (fs.existsSync(targetDir)) {
      console.log(
        chalk.yellow(
          `⚠️  ${e2eDirectory} directory already exists, skipping...`
        )
      );
      return;
    }

    console.log(
      chalk.cyan(`📋 Creating e2e testing framework in ${e2eDirectory}...`)
    );
    copyDirectoryRecursively(sourceDir, targetDir);
    console.log(
      chalk.green(`✅ Created e2e testing framework in ${e2eDirectory}`)
    );
  } catch (error) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: Could not create e2e directory: ${error.message}`
      )
    );
  }
}

/**
 * Copy vincent-scripts to project root
 */
function copyVincentScripts(scriptsDirectory = "./vincent-scripts") {
  try {
    const sourceDir = path.join(__dirname, "..", "..", "vincent-scripts");
    const targetDir = path.resolve(scriptsDirectory);

    if (fs.existsSync(targetDir)) {
      console.log(
        chalk.yellow(
          `⚠️  ${scriptsDirectory} directory already exists, skipping...`
        )
      );
      return;
    }

    console.log(
      chalk.cyan(`📋 Creating Vincent scripts in ${scriptsDirectory}...`)
    );
    copyDirectoryRecursively(sourceDir, targetDir);
    console.log(
      chalk.green(`✅ Created Vincent scripts in ${scriptsDirectory}`)
    );
  } catch (error) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: Could not create vincent-scripts directory: ${error.message}`
      )
    );
  }
}

/**
 * Create or update .gitignore file
 */
function createOrUpdateGitignore() {
  try {
    const gitignorePath = path.resolve(".gitignore");
    let gitignoreContent = "";

    // If .gitignore exists, read it
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
      console.log(chalk.cyan("📝 Updating existing .gitignore..."));
    } else {
      console.log(chalk.cyan("📝 Creating .gitignore..."));
    }

    // Check if .e2e-state.json is already in gitignore
    const entriesToAdd = {
      ".e2e-state.json": "# Vincent state file",
      "node_modules/": "# Dependencies",
      ".env": "# Environment variables",
    };

    let hasChanges = false;

    for (const [entry, comment] of Object.entries(entriesToAdd)) {
      if (!gitignoreContent.includes(entry)) {
        if (gitignoreContent && !gitignoreContent.endsWith("\n")) {
          gitignoreContent += "\n";
        }
        gitignoreContent += `\n${comment}\n${entry}\n`;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(chalk.green("✅ Added entries to .gitignore"));
    } else {
      console.log(chalk.gray("ℹ️  All entries already in .gitignore"));
    }
  } catch (error) {
    console.log(
      chalk.yellow(`⚠️  Warning: Could not update .gitignore: ${error.message}`)
    );
  }
}

/**
 * Create or update AI rule files
 */
function createOrUpdateAIRules() {
  console.log(chalk.cyan("\n🤖 Setting up AI development guidance files..."));

  let filesCreated = 0;
  let filesUpdated = 0;

  for (const [targetFile, config] of Object.entries(AI_RULES_CONFIG)) {
    try {
      const targetPath = path.resolve(targetFile);
      const targetDir = path.dirname(targetPath);

      // Create directory if needed
      if (config.directory || targetDir !== process.cwd()) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      // Check if source file exists
      if (!fs.existsSync(config.sourcePath)) {
        console.log(
          chalk.yellow(
            `⚠️  Warning: Source file not found: ${config.sourcePath}`
          )
        );
        continue;
      }

      // Read source content
      const sourceContent = fs.readFileSync(config.sourcePath, "utf8");

      if (fs.existsSync(targetPath)) {
        // File exists - check if we should update
        const existingContent = fs.readFileSync(targetPath, "utf8");

        if (
          existingContent.includes("# Vincent Scaffold SDK") ||
          existingContent.includes("Vincent Framework") ||
          existingContent.includes("Vincent Scaffold SDK")
        ) {
          // Appears to be a Vincent-generated file, update it
          fs.writeFileSync(targetPath, sourceContent);
          filesUpdated++;
          console.log(chalk.yellow(`📝 Updated ${targetFile}`));
        } else {
          // User-created file, append Vincent section
          const separator =
            "\n\n# ========================================\n# Vincent Scaffold SDK - AI Guidance\n# ========================================\n\n";
          const updatedContent = existingContent + separator + sourceContent;
          fs.writeFileSync(targetPath, updatedContent);
          filesUpdated++;
          console.log(
            chalk.yellow(`📝 Appended Vincent guidance to ${targetFile}`)
          );
        }
      } else {
        // File doesn't exist - create it
        fs.writeFileSync(targetPath, sourceContent);
        filesCreated++;
        console.log(chalk.green(`✅ Created ${targetFile}`));
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          `⚠️  Warning: Could not process ${targetFile}: ${error.message}`
        )
      );
    }
  }

  console.log(
    chalk.green(
      `✅ AI guidance setup complete: ${filesCreated} created, ${filesUpdated} updated`
    )
  );
}

/**
 * Create or update package.json with Vincent scripts
 */
function createOrUpdatePackageJson(e2eDirectory = "./vincent-e2e") {
  try {
    const packageJsonPath = path.resolve("package.json");
    let packageJson = {};

    // If package.json exists, read it
    if (fs.existsSync(packageJsonPath)) {
      const content = fs.readFileSync(packageJsonPath, "utf8");
      packageJson = JSON.parse(content);
      console.log(chalk.cyan("📦 Updating existing package.json..."));
    } else {
      // Create basic package.json structure
      packageJson = {
        name: "vincent-project",
        version: "1.0.0",
        description: "Vincent project with abilities and policies",
        private: true,
      };
      console.log(chalk.cyan("📦 Creating package.json..."));
    }

    // Add or merge scripts using SCRIPTS_CONFIG
    packageJson.scripts = packageJson.scripts || {};

    // Prepare configuration context for script generation
    const e2ePath = path
      .join(e2eDirectory, "src", "e2e.ts")
      .replace(/\\/g, "/");

    const scriptConfig = {
      e2ePath,
      e2eDirectory,
    };

    // Render all scripts from configuration
    for (const [scriptName, scriptFunction] of Object.entries(SCRIPTS_CONFIG)) {
      packageJson.scripts[scriptName] = scriptFunction(scriptConfig);
    }
    // Add devDependencies using PACKAGES_CONFIG
    packageJson.devDependencies = packageJson.devDependencies || {};

    // Process packages according to their behavior configuration
    for (const [packageName, config] of Object.entries(PACKAGES_CONFIG)) {
      if (config.behavior === "onlyIfMissing") {
        // Only add if not already present
        if (!packageJson.devDependencies[packageName]) {
          packageJson.devDependencies[packageName] = config.version;
        }
      } else if (config.behavior === "always") {
        // Always set/update the version
        packageJson.devDependencies[packageName] = config.version;
      }
    }

    // Write package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green("✅ Updated package.json with Vincent scripts"));
  } catch (error) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: Could not update package.json: ${error.message}`
      )
    );
  }
}

/**
 * Prompt for initialization configuration
 */
async function promptForInit() {
  console.log(chalk.cyan("\n🚀 Welcome to Vincent Scaffold SDK!"));
  console.log(
    chalk.gray("Let's set up your Vincent development environment.\n")
  );

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "namespace",
      message: "Package namespace (e.g., @mycompany, @username):",
      default: "@agentic-ai",
      validate: (input) => {
        if (!input.startsWith("@")) {
          return "Namespace must start with '@'";
        }
        if (!/^@[a-z0-9-_]+$/i.test(input)) {
          return "Namespace must contain only letters, numbers, hyphens, and underscores";
        }
        return true;
      },
    },
    // {
    //   type: "input",
    //   name: "abilityPrefix",
    //   message: "Ability package prefix:",
    //   default: "vincent-ability-",
    // },
    // {
    //   type: "input",
    //   name: "policyPrefix",
    //   message: "Policy package prefix:",
    //   default: "vincent-policy-",
    // },
    // {
    //   type: "input",
    //   name: "abilitiesDirectory",
    //   message: "Abilities directory:",
    //   default: "./vincent-packages/abilities",
    // },
    // {
    //   type: "input",
    //   name: "policiesDirectory",
    //   message: "Policies directory:",
    //   default: "./vincent-packages/policies",
    // },
    // {
    //   type: "input",
    //   name: "e2eDirectory",
    //   message: "E2E testing directory:",
    //   default: "./vincent-e2e",
    //   validate: (input) => {
    //     if (!input.trim()) {
    //       return "E2E directory is required";
    //     }
    //     return true;
    //   },
    //   filter: (input) => input.trim(),
    // },
  ]);

  // Add hardcoded defaults for commented out prompts
  answers.abilityPrefix = "vincent-ability-";
  answers.policyPrefix = "vincent-policy-";
  answers.abilitiesDirectory = "./vincent-packages/abilities";
  answers.policiesDirectory = "./vincent-packages/policies";
  answers.e2eDirectory = "./vincent-e2e";

  return answers;
}

/**
 * Create project from template
 */
function createProjectFromTemplate(type, directory, variables) {
  // Validate template type
  if (!validateTemplateType(type)) {
    throw new Error(`Invalid or incomplete template type: ${type}`);
  }

  // Check if directory already exists
  if (fs.existsSync(directory)) {
    throw new Error(`Directory already exists: ${directory}`);
  }

  try {
    // Create the directory
    fs.mkdirSync(directory, { recursive: true });

    // Get all template files for this type
    const templateFiles = getTemplateFiles(type);

    // Process each template file
    for (const filename of templateFiles) {
      const content = processTemplate(type, filename, variables);
      const outputPath = path.join(directory, filename);

      // Ensure the directory exists for the file
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Handle JSON files (need to parse and format)
      if (filename.endsWith(".json")) {
        const jsonContent = JSON.parse(content);
        fs.writeFileSync(outputPath, JSON.stringify(jsonContent, null, 2));
      } else {
        fs.writeFileSync(outputPath, content);
      }
    }
  } catch (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
}

/**
 * Initialize Vincent project
 */
async function initProject() {
  // Check if vincent.json already exists
  const configPath = path.resolve("vincent.json");
  if (fs.existsSync(configPath)) {
    const shouldOverwrite = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "vincent.json already exists. Overwrite?",
        default: false,
      },
    ]);

    if (!shouldOverwrite.overwrite) {
      console.log(chalk.yellow("\n👋 Initialization cancelled"));
      return;
    }
  }

  const config = await promptForInit();

  // Create vincent.json
  createVincentConfig(config);

  // Create directories
  const abilitiesDir = path.resolve(config.abilitiesDirectory);
  const policiesDir = path.resolve(config.policiesDirectory);

  if (!fs.existsSync(abilitiesDir)) {
    fs.mkdirSync(abilitiesDir, { recursive: true });
    console.log(
      chalk.green(
        `✅ Created abilities directory: ${config.abilitiesDirectory}`
      )
    );
  }

  if (!fs.existsSync(policiesDir)) {
    fs.mkdirSync(policiesDir, { recursive: true });
    console.log(
      chalk.green(`✅ Created policies directory: ${config.policiesDirectory}`)
    );
  }

  // Always create .env.vincent-sample
  createEnvSample();

  // Create default ability and policy examples
  console.log(chalk.cyan("\n📦 Creating default examples..."));

  try {
    // Create default ability
    const defaultAbilityDir = path.resolve(
      config.abilitiesDirectory,
      DEFAULT_ABILITY_NAME
    );
    if (!fs.existsSync(defaultAbilityDir)) {
      const vincentConfig = JSON.parse(
        fs.readFileSync(path.resolve("vincent.json"), "utf8")
      );
      const abilityPrefix = vincentConfig.package.abilityPrefix;
      const abilityPackageName = `${vincentConfig.package.namespace}/${abilityPrefix}${DEFAULT_ABILITY_NAME}`;

      const policyPrefix = vincentConfig.package.policyPrefix;
      const policyPackageName = `${vincentConfig.package.namespace}/${policyPrefix}${DEFAULT_POLICY_NAME}`;

      const abilityVariables = {
        name: DEFAULT_ABILITY_NAME,
        type: "ability",
        namespace: vincentConfig.package.namespace,
        packageName: abilityPackageName,
        camelCaseName: DEFAULT_ABILITY_CAMEL_CASE_NAME,
        policyPackageName: policyPackageName,
      };

      createProjectFromTemplate("ability", defaultAbilityDir, abilityVariables);
      console.log(
        chalk.green(`✅ Created default ability: ${abilityPackageName}`)
      );
    }

    // Create default policy
    const defaultPolicyDir = path.resolve(
      config.policiesDirectory,
      DEFAULT_POLICY_NAME
    );
    if (!fs.existsSync(defaultPolicyDir)) {
      const vincentConfig = JSON.parse(
        fs.readFileSync(path.resolve("vincent.json"), "utf8")
      );
      const policyPrefix = vincentConfig.package.policyPrefix;
      const policyPackageName = `${vincentConfig.package.namespace}/${policyPrefix}${DEFAULT_POLICY_NAME}`;

      const policyVariables = {
        name: DEFAULT_POLICY_NAME,
        type: "policy",
        namespace: vincentConfig.package.namespace,
        packageName: policyPackageName,
        camelCaseName: DEFAULT_POLICY_CAMEL_CASE_NAME,
      };

      createProjectFromTemplate("policy", defaultPolicyDir, policyVariables);
      console.log(
        chalk.green(`✅ Created default policy: ${policyPackageName}`)
      );
    }
  } catch (error) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: Could not create default examples: ${error.message}`
      )
    );
  }

  // Create or update .gitignore file
  createOrUpdateGitignore();

  // Copy vincent-scripts to project root
  copyVincentScripts();

  // Create or update package.json with Vincent scripts
  createOrUpdatePackageJson(config.e2eDirectory);

  // Copy e2e template to project root
  copyE2ETemplate(config.e2eDirectory);

  // Create or update AI rule files
  createOrUpdateAIRules();

  console.log(chalk.cyan("\n🎉 Vincent development environment initialised!"));
  console.log(chalk.gray("Default examples created:"));
  console.log(
    chalk.gray(`• ${DEFAULT_ABILITY_NAME} ability - A simple greeting ability`)
  );
  console.log(
    chalk.gray(`• ${DEFAULT_POLICY_NAME} policy - Limits daily greetings`)
  );
  console.log(
    chalk.gray("• e2e testing framework - End-to-end testing utilities")
  );
  console.log(
    chalk.gray("• ai guidance files - Development rules for various AI tools")
  );
  console.log(chalk.gray("\nNext steps:"));
  console.log(
    chalk.gray("1. Copy .env.vincent-sample to .env and fill in your values")
  );
  console.log(chalk.gray("2. Run npm install to install dependencies"));
  console.log(
    chalk.gray("3. Run npm run vincent:build to build the default examples")
  );
  console.log(
    chalk.gray("4. Run npm run vincent:e2e to test your Vincent projects")
  );
  console.log(
    chalk.gray(
      `YOLO. Run "npm install && npm run vincent:build && npm run vincent:e2e"`
    )
  );
  process.exit();
}

/**
 * Suggest initialization when vincent.json is not found
 */
async function suggestInit() {
  console.log(chalk.yellow("\n⚠️  Vincent configuration not found!"));
  console.log(
    chalk.gray(
      "You need to Initialise your Vincent development environment first.\n"
    )
  );

  // Show current directory and ask for confirmation
  const currentDir = process.cwd();
  console.log(chalk.cyan(`📁 Current directory: ${currentDir}`));
  console.log(
    chalk.yellow(
      "⚠️  Make sure you're in your desired project directory before initializing.\n"
    )
  );

  const directoryConfirm = await inquirer.prompt([
    {
      type: "confirm",
      name: "correctDirectory",
      message: "Are you in the correct directory for your Vincent project?",
      default: true,
    },
  ]);

  if (!directoryConfirm.correctDirectory) {
    console.log(
      chalk.gray(
        "\n💡 Navigate to your desired project directory and run the command again."
      )
    );
    console.log(chalk.gray("   Example: cd /path/to/my-vincent-project"));
    process.exit(0);
  }

  const shouldInit = await inquirer.prompt([
    {
      type: "confirm",
      name: "runInit",
      message: "Would you like to run 'vincent-scaffold init' now?",
      default: true,
    },
  ]);

  if (shouldInit.runInit) {
    await initProject();
  } else {
    console.log(
      chalk.gray("\nTo Initialise later, run: vincent-scaffold init")
    );
    process.exit(0);
  }
}

module.exports = {
  initProject,
  suggestInit,
};
