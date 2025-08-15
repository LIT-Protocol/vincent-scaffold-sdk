#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// Import modular commands
const { initProject, suggestInit } = require("../src/commands/init");
const { createProject } = require("../src/commands/add");
const {
  buildCurrentPackage,
  deployCurrentPackage,
  cleanCurrentPackage,
} = require("../src/commands/pkg");
const { upgradeScaffold } = require("../src/commands/upgrade");
const { showVersionWithUpdateCheck } = require("../src/utils/version-utils");
const { promptForProject } = require("../src/prompts/project-prompts");

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

async function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Check if vincent.json exists, if not, suggest init
    const configPath = path.resolve("vincent.json");
    if (!fs.existsSync(configPath)) {
      return { command: "suggest-init" };
    }
    return { command: "add", interactive: true };
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    await showVersionWithUpdateCheck();
    process.exit(0);
  }

  const command = args[0];

  if (command === "init") {
    return { command: "init" };
  } else if (command === "pkg") {
    // Handle package-level commands
    if (args.length < 2) {
      console.error(
        chalk.red(
          "Error: pkg command requires a subcommand (build, deploy, clean)"
        )
      );
      console.log(chalk.gray("Example: vincent-scaffold pkg build"));
      process.exit(1);
    }

    const subcommand = args[1];
    if (!["build", "deploy", "clean"].includes(subcommand)) {
      console.error(chalk.red(`Error: Unknown pkg subcommand: ${subcommand}`));
      console.log(chalk.gray("Available subcommands: build, deploy, clean"));
      process.exit(1);
    }

    return { command: "pkg", subcommand };
  } else if (command === "add") {
    // Non-interactive mode
    if (args.length < 3) {
      return { command: "add", interactive: true }; // Fall back to interactive mode
    }

    const type = args[1];
    const name = args[2];

    if (!["ability", "policy"].includes(type)) {
      console.error(
        chalk.red(`Error: Invalid type: ${type}. Must be 'ability' or 'policy'`)
      );
      process.exit(1);
    }

    // Parse optional directory flag
    let directory = path.resolve(name);
    const directoryIndex = args.indexOf("--directory");
    if (directoryIndex !== -1 && directoryIndex + 1 < args.length) {
      directory = path.resolve(args[directoryIndex + 1], name);
    }

    return { command: "add", interactive: false, type, name, directory };
  }

  if (command === "upgrade") {
    return { command: "upgrade" };
  }

  // Unknown command, fall back to interactive add
  return { command: "add", interactive: true };
}

async function main() {
  const config = await parseArgs();

  if (config.command === "suggest-init") {
    await suggestInit();
    // After init, continue to add command
    const answers = await promptForProject();
    if (answers) {
      createProject(answers.type, answers.name, answers.directory);
    }
  } else if (config.command === "init") {
    await initProject();
  } else if (config.command === "upgrade") {
    await upgradeScaffold();
  } else if (config.command === "pkg") {
    // Handle package-level commands
    if (config.subcommand === "build") {
      await buildCurrentPackage();
    } else if (config.subcommand === "deploy") {
      await deployCurrentPackage();
    } else if (config.subcommand === "clean") {
      await cleanCurrentPackage();
    }
  } else if (config.command === "add") {
    if (config.interactive) {
      const answers = await promptForProject();
      if (answers) {
        createProject(answers.type, answers.name, answers.directory);
      }
    } else {
      createProject(config.type, config.name, config.directory);
    }
  }
}

main().catch((error) => {
  console.error(chalk.red(`\n❌ Error: ${error.message}`));
  process.exit(1);
});
