const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const chalk = require("chalk").default || require("chalk");

/**
 * Execute a command and return a promise
 */
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Build packages in a directory (policies or tools)
 */
async function buildPackagesInDirectory(baseDir, type) {
  const fullPath = path.resolve(baseDir);

  if (!fs.existsSync(fullPath)) {
    console.log(
      chalk.yellow(`Directory ${baseDir} does not exist, skipping...`)
    );
    return;
  }

  const items = fs.readdirSync(fullPath, { withFileTypes: true });
  const directories = items
    .filter((item) => item.isDirectory())
    .map((item) => item.name);

  if (directories.length === 0) {
    console.log(chalk.gray(`No ${type} packages found in ${baseDir}`));
    return;
  }

  const originalDir = process.cwd();

  for (const dir of directories) {
    const packagePath = path.join(fullPath, dir);
    const packageJsonPath = path.join(packagePath, "package.json");

    // Check if it's a valid package directory
    if (!fs.existsSync(packageJsonPath)) {
      console.log(chalk.gray(`Skipping ${dir} - no package.json found`));
      continue;
    }

    console.log(chalk.cyan(`Building ${type}: ${dir}`));

    try {
      // Change to package directory and run npm install & build
      process.chdir(packagePath);

      console.log(chalk.gray(`  Installing dependencies...`));
      await executeCommand("npm", ["install"]);

      console.log(chalk.gray(`  Building package...`));
      await executeCommand("npm", ["run", "build"]);

      console.log(chalk.green(`  ✅ Built ${type}: ${dir}`));
    } catch (error) {
      console.log(chalk.red(`  ❌ Failed to build ${type}: ${dir}`));
      console.log(chalk.red(`     Error: ${error.message}`));
    } finally {
      // Always return to original directory after each package build
      process.chdir(originalDir);
    }
  }
}

/**
 * Main build function
 */
async function buildPackages() {
  const originalDir = process.cwd();

  try {
    console.log(chalk.cyan("🔨 Building Vincent packages..."));

    // Build policies
    await buildPackagesInDirectory("vincent-packages/policies", "policy");

    // Build tools
    await buildPackagesInDirectory("vincent-packages/tools", "tool");

    console.log(chalk.green("✅ All packages built successfully!"));
  } catch (error) {
    console.log(chalk.red("❌ Build process failed:"));
    console.log(chalk.red(error.message));
    process.exit(1);
  } finally {
    // Always return to original directory
    process.chdir(originalDir);
  }
}

// Run if called directly
if (require.main === module) {
  buildPackages();
}

module.exports = { buildPackages };
