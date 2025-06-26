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
        description: "Vincent project with tools and policies",
        private: true,
      };
      console.log(chalk.cyan("📦 Creating package.json..."));
    }

    // Add or merge scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["vincent:build"] =
      "dotenv -e .env -- sh -c 'cd vincent-packages/tools/hello-world && npm install && npm run build && cd ../../policies/greeting-limit && npm install && npm run build'";

    // Use the custom e2e directory in the script
    const e2ePath = path
      .join(e2eDirectory, "src", "e2e.ts")
      .replace(/\\/g, "/");
    packageJson.scripts["vincent:e2e"] = `dotenv -e .env -- tsx ${e2ePath}`;
    packageJson.scripts["vincent:reset"] = `rm -f .e2e-state.json`;
    packageJson.scripts[
      "vincent:forge:check"
    ] = `sh -c 'if command -v forge >/dev/null 2>&1; then echo \"✅ Foundry is available\"; else echo \"❌ Foundry (forge) is not installed. Install it from https://getfoundry.sh/\"; exit 1; fi'`;
    packageJson.scripts[
      "vincent:forge:init"
    ] = `dotenv -e .env -- sh -c 'npm run vincent:forge:check && forge init ./vincent-policy-contracts/counter && cd ./vincent-policy-contracts/counter && forge build && forge script script/Counter.s.sol --rpc-url https://yellowstone-rpc.litprotocol.com --broadcast --private-key $TEST_FUNDER_PRIVATE_KEY' && npm run vincent:gen-abi`;
    packageJson.scripts[
      "vincent:gen-abi"
    ] = `cd ./vincent-policy-contracts/counter && npx forge-to-signature Counter.s.sol 175188 ./generated -n counterSignatures`;
    // Add devDependencies for e2e if needed
    packageJson.devDependencies = packageJson.devDependencies || {};
    if (!packageJson.devDependencies.tsx) {
      packageJson.devDependencies.tsx = "4.0.0";
    }
    if (!packageJson.devDependencies["dotenv-cli"]) {
      packageJson.devDependencies["dotenv-cli"] = "8.0.0";
    }

    packageJson.devDependencies.viem = "2.31.4";
    packageJson.devDependencies.chalk = "4.1.2";

    // Add dependencies
    packageJson.devDependencies["@lit-protocol/vincent-app-sdk"] = "*";
    packageJson.devDependencies["@lit-protocol/vincent-scaffold-sdk"] = "*";
    packageJson.devDependencies["@ansonhkg/abi-extractor"] = "1.1.0";

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
    {
      type: "input",
      name: "toolPrefix",
      message: "Tool package prefix:",
      default: "vincent-tool-",
    },
    {
      type: "input",
      name: "policyPrefix",
      message: "Policy package prefix:",
      default: "vincent-policy-",
    },
    {
      type: "input",
      name: "toolsDirectory",
      message: "Tools directory:",
      default: "./vincent-packages/tools",
    },
    {
      type: "input",
      name: "policiesDirectory",
      message: "Policies directory:",
      default: "./vincent-packages/policies",
    },
    {
      type: "input",
      name: "e2eDirectory",
      message: "E2E testing directory:",
      default: "./vincent-e2e",
      validate: (input) => {
        if (!input.trim()) {
          return "E2E directory is required";
        }
        return true;
      },
      filter: (input) => input.trim(),
    },
  ]);

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
  const toolsDir = path.resolve(config.toolsDirectory);
  const policiesDir = path.resolve(config.policiesDirectory);

  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
    console.log(
      chalk.green(`✅ Created tools directory: ${config.toolsDirectory}`)
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

  // Create default tool and policy examples
  console.log(chalk.cyan("\n📦 Creating default examples..."));

  try {
    // Create default hello-world tool
    const defaultToolDir = path.resolve(config.toolsDirectory, "hello-world");
    if (!fs.existsSync(defaultToolDir)) {
      const vincentConfig = JSON.parse(
        fs.readFileSync(path.resolve("vincent.json"), "utf8")
      );
      const toolPrefix = vincentConfig.package.toolPrefix;
      const toolPackageName = `${vincentConfig.package.namespace}/${toolPrefix}hello-world`;

      const toolVariables = {
        name: "hello-world",
        type: "tool",
        namespace: vincentConfig.package.namespace,
        packageName: toolPackageName,
        camelCaseName: "helloWorld",
      };

      createProjectFromTemplate("tool", defaultToolDir, toolVariables);
      console.log(chalk.green(`✅ Created default tool: ${toolPackageName}`));
    }

    // Create default greeting-limit policy
    const defaultPolicyDir = path.resolve(
      config.policiesDirectory,
      "greeting-limit"
    );
    if (!fs.existsSync(defaultPolicyDir)) {
      const vincentConfig = JSON.parse(
        fs.readFileSync(path.resolve("vincent.json"), "utf8")
      );
      const policyPrefix = vincentConfig.package.policyPrefix;
      const policyPackageName = `${vincentConfig.package.namespace}/${policyPrefix}greeting-limit`;

      const policyVariables = {
        name: "greeting-limit",
        type: "policy",
        namespace: vincentConfig.package.namespace,
        packageName: policyPackageName,
        camelCaseName: "greetingLimit",
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

  // Create or update package.json with Vincent scripts
  createOrUpdatePackageJson(config.e2eDirectory);

  // Copy e2e template to project root
  copyE2ETemplate(config.e2eDirectory);

  console.log(chalk.cyan("\n🎉 Vincent development environment initialised!"));
  console.log(chalk.gray("Default examples created:"));
  console.log(chalk.gray("• hello-world tool - A simple greeting tool"));
  console.log(chalk.gray("• greeting-limit policy - Limits daily greetings"));
  console.log(
    chalk.gray("• e2e testing framework - End-to-end testing utilities")
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
