const path = require("path");
const inquirer = require("inquirer");
const chalk = require("chalk");
const { requireVincentConfig } = require("../utils/config-utils");

/**
 * Main project prompt (simplified - removed build/deploy options)
 */
async function promptForProject() {
  // Load Vincent configuration to get default directories
  const vincentConfig = requireVincentConfig();

  console.log(chalk.cyan.bold("\n🚀 Welcome to Vincent Scaffold SDK\n"));

  const initialAnswers = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "What would you like to do?",
      choices: [
        { name: "📦 Ability - Create a new Vincent ability", value: "ability" },
        { name: "📋 Policy - Create a new Vincent policy", value: "policy" },
        { name: "⚙️  Re-Initialise Vincent configuration", value: "init" },
        { name: "❓ Help - Show usage information", value: "help" },
      ],
    },
  ]);

  // Handle non-project-creation options
  if (initialAnswers.type === "init") {
    const { initProject } = require("../commands/init");
    await initProject();
    // After init, ask again what they want to do
    return await promptForProject();
  }

  if (initialAnswers.type === "help") {
    showHelp();
    return null; // Exit after showing help
  }

  // Continue with project creation questions
  const projectAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "What is the name of your project?",
      validate: (input) => {
        if (!input.trim()) {
          return "Project name is required";
        }
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(input)) {
          return "Name must be lowercase, alphanumeric, and may contain hyphens (but not at start/end)";
        }
        return true;
      },
      filter: (input) => input.trim().toLowerCase(),
    },
    {
      type: "confirm",
      name: "confirm",
      message: (answers) => {
        const prefix =
          initialAnswers.type === "ability"
            ? vincentConfig.package.abilityPrefix
            : vincentConfig.package.policyPrefix;
        const packageName = `${vincentConfig.package.namespace}/${prefix}${answers.name}`;
        const baseDir =
          initialAnswers.type === "ability"
            ? vincentConfig.directories.abilities
            : vincentConfig.directories.policies;
        const directory = path.resolve(baseDir, answers.name);
        return `Create ${initialAnswers.type} "${packageName}" in ${directory}?`;
      },
      default: true,
    },
  ]);

  // Add the directory to the answers using config
  const baseDir =
    initialAnswers.type === "ability"
      ? vincentConfig.directories.abilities
      : vincentConfig.directories.policies;
  projectAnswers.directory = path.resolve(baseDir, projectAnswers.name);

  // Combine answers
  const answers = { ...initialAnswers, ...projectAnswers };

  if (!answers.confirm) {
    console.log(chalk.yellow("\n👋 Project creation cancelled"));
    process.exit(0);
  }

  return answers;
}

/**
 * Show help information
 */
function showHelp() {
  const USAGE = `
Usage: npx @lit-protocol/vincent-scaffold-sdk [command]

Project-Level Commands (from project root):
  init                     Initialise Vincent configuration (required first step)
  add [ability|policy] <name> Create a new Vincent ability or policy
  upgrade                  Check for and install latest version
  --help                   Show this help message
  --version                Show version information

Package-Level Commands (from within ability/policy directory):
  pkg build                Build current package
  pkg deploy               Deploy current package (builds first)
  pkg clean                Clean current package (remove dist and generated files)

Examples:
  # Project-level operations (from project root)
  npx @lit-protocol/vincent-scaffold-sdk init
  npx @lit-protocol/vincent-scaffold-sdk add ability my-new-ability
  
  # Package-level operations (from within ability/policy directory)
  npx @lit-protocol/vincent-scaffold-sdk pkg build
  npx @lit-protocol/vincent-scaffold-sdk pkg deploy
  npx @lit-protocol/vincent-scaffold-sdk pkg clean

`;

  console.log(chalk.cyan.bold("\n📚 Vincent Scaffold SDK Help\n"));
  console.log(USAGE);
  console.log(chalk.yellow("\n💡 Quick Start:"));
  console.log(chalk.gray("1. Initialise: vincent-scaffold init"));
  console.log(
    chalk.gray("2. Create ability: vincent-scaffold add ability my-ability")
  );
  console.log(
    chalk.gray(
      "3. Navigate to ability: cd vincent-packages/abilities/my-ability"
    )
  );
  console.log(chalk.gray("4. Build: vincent-scaffold pkg build"));
  console.log(chalk.gray("5. Deploy: vincent-scaffold pkg deploy"));
  console.log(chalk.cyan("\n🔗 More info: https://docs.heyvincent.ai"));
}

module.exports = {
  promptForProject,
  showHelp,
};
