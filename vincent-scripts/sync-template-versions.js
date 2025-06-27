#!/usr/bin/env node

/**
 * Sync Template Versions Script
 *
 * This script ensures that template package.json files reference the correct
 * version of @lit-protocol/vincent-scaffold-sdk before publishing.
 *
 * Usage: node scripts/sync-template-versions.js
 */

const fs = require("fs");
const path = require("path");
const chalk = require("chalk").default || require("chalk");

// Configuration
const MAIN_PACKAGE_PATH = path.join(__dirname, "..", "package.json");
const TEMPLATE_PATHS = [
  path.join(__dirname, "..", "src", "templates", "policy", "package.json"),
  path.join(__dirname, "..", "src", "templates", "tool", "package.json"),
];
const DEPENDENCY_NAME = "@lit-protocol/vincent-scaffold-sdk";

function main() {
  try {
    console.log(chalk.blue("🔄 Syncing template versions..."));

    // Read main package.json version
    const mainPackage = JSON.parse(fs.readFileSync(MAIN_PACKAGE_PATH, "utf8"));
    const currentVersion = mainPackage.version;
    const targetDependencyVersion = `^${currentVersion}`;

    console.log(chalk.green(`📦 Main package version: ${currentVersion}`));

    // Update each template
    let updatedCount = 0;
    for (const templatePath of TEMPLATE_PATHS) {
      if (updateTemplateVersion(templatePath, targetDependencyVersion)) {
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(
        chalk.green(`✅ Successfully updated ${updatedCount} template(s)`)
      );
    } else {
      console.log(chalk.yellow("ℹ️  All templates already up to date"));
    }
  } catch (error) {
    console.error(
      chalk.red("❌ Error syncing template versions:"),
      error.message
    );
    process.exit(1);
  }
}

function updateTemplateVersion(templatePath, targetVersion) {
  try {
    // Read template package.json
    const templatePackage = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    const currentDependencyVersion =
      templatePackage.dependencies?.[DEPENDENCY_NAME];

    if (!currentDependencyVersion) {
      console.log(
        chalk.yellow(
          `⚠️  ${path.relative(
            process.cwd(),
            templatePath
          )} does not have ${DEPENDENCY_NAME} dependency`
        )
      );
      return false;
    }

    // Check if update is needed
    if (currentDependencyVersion === targetVersion) {
      console.log(
        chalk.gray(
          `✓ ${path.relative(
            process.cwd(),
            templatePath
          )} already at ${targetVersion}`
        )
      );
      return false;
    }

    // Update the version
    templatePackage.dependencies[DEPENDENCY_NAME] = targetVersion;

    // Write back to file
    fs.writeFileSync(
      templatePath,
      JSON.stringify(templatePackage, null, 2) + "\n"
    );

    console.log(
      chalk.green(
        `✓ Updated ${path.relative(
          process.cwd(),
          templatePath
        )}: ${currentDependencyVersion} → ${targetVersion}`
      )
    );
    return true;
  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to update ${templatePath}:`),
      error.message
    );
    throw error;
  }
}

// Run the script
main();
