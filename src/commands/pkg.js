const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { isVincentProject } = require("../utils/project-utils");

// Import build dependencies
let esbuild;
let buildConfig;
try {
  esbuild = require("esbuild");
  buildConfig = require("../esbuild-share-config");
} catch (err) {
  // Build dependencies not available
}

/**
 * Build current package
 */
async function buildCurrentPackage() {
  console.log(chalk.cyan.bold("\n📦 Building Current Package\n"));

  // Check if current directory is a Vincent package
  const currentProject = isVincentProject(process.cwd());

  if (!currentProject.isProject) {
    console.error(chalk.red("❌ Current directory is not a Vincent package"));
    console.log(
      chalk.gray(
        "Run this command from within a Vincent ability or policy directory"
      )
    );
    console.log(
      chalk.gray(
        "Or use 'vincent-scaffold build' from the project root for project-level operations"
      )
    );
    process.exit(1);
  }

  console.log(chalk.cyan(`📁 Package: ${currentProject.packageName}`));
  console.log(chalk.cyan(`📁 Type: ${currentProject.type}`));

  // Build the current package
  await buildProject(currentProject.type, currentProject.path);
}

/**
 * Deploy current package
 */
async function deployCurrentPackage() {
  console.log(chalk.cyan.bold("\n🚀 Deploying Current Package\n"));

  // Check if current directory is a Vincent package
  const currentProject = isVincentProject(process.cwd());

  if (!currentProject.isProject) {
    console.error(chalk.red("❌ Current directory is not a Vincent package"));
    console.log(
      chalk.gray(
        "Run this command from within a Vincent ability or policy directory"
      )
    );
    console.log(
      chalk.gray(
        "Or use 'vincent-scaffold deploy' from the project root for project-level operations"
      )
    );
    process.exit(1);
  }

  console.log(chalk.cyan(`📁 Package: ${currentProject.packageName}`));
  console.log(chalk.cyan(`📁 Type: ${currentProject.type}`));

  // First build, then deploy
  console.log(chalk.cyan("\n🔨 Building package before deployment...\n"));
  await buildProject(currentProject.type, currentProject.path);
  await deployProject(currentProject.type, currentProject.path);
}

/**
 * Clean current package
 */
async function cleanCurrentPackage() {
  console.log(chalk.cyan.bold("\n🧹 Cleaning Current Package\n"));

  // Check if current directory is a Vincent package
  const currentProject = isVincentProject(process.cwd());

  if (!currentProject.isProject) {
    console.error(chalk.red("❌ Current directory is not a Vincent package"));
    console.log(
      chalk.gray(
        "Run this command from within a Vincent ability or policy directory"
      )
    );
    process.exit(1);
  }

  console.log(chalk.cyan(`📁 Package: ${currentProject.packageName}`));

  // Clean the dist and generated directories
  const distPath = path.join(currentProject.path, "dist");
  const generatedPath = path.join(currentProject.path, "src", "generated");

  try {
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
      console.log(chalk.green("✅ Removed dist directory"));
    }

    if (fs.existsSync(generatedPath)) {
      fs.rmSync(generatedPath, { recursive: true, force: true });
      console.log(chalk.green("✅ Removed src/generated directory"));
    }

    console.log(chalk.green.bold("\n✅ Package cleaned successfully"));
  } catch (error) {
    console.error(chalk.red(`❌ Error cleaning package: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Build a single project
 */
async function buildProject(type, projectPath) {
  if (!esbuild || !buildConfig) {
    console.error(
      chalk.red(
        "❌ Build dependencies not available. Please ensure esbuild is installed."
      )
    );
    process.exit(1);
  }

  const originalCwd = process.cwd();
  const targetPath = projectPath;

  console.log(chalk.cyan(`\n🔨 Building Vincent ${type}...\n`));

  try {
    // Change to project directory
    process.chdir(targetPath);

    const { baseConfig, getPlugins, logBuildResults } = buildConfig;
    const { generateLitAction } = require("../lit-action-generator");

    // Generate lit-action.ts before building
    generateLitAction(type);

    // Verify required files exist before proceeding
    if (!fs.existsSync("./tsconfig.json")) {
      throw new Error(`tsconfig.json not found in ${targetPath}`);
    }
    if (!fs.existsSync("./src/generated/lit-action.ts")) {
      throw new Error(
        `lit-action.ts not found in ${targetPath}/src/generated/`
      );
    }

    const result = await esbuild.build({
      ...baseConfig,
      tsconfig: "./tsconfig.json",
      entryPoints: ["./src/generated/lit-action.ts"],
      outdir: "./src/generated/",
      plugins: getPlugins(type),
    });

    await logBuildResults(result);

    fs.writeFileSync(
      `./esBuildMetafile.json`,
      JSON.stringify(result.metafile, null, 2)
    );

    console.log(chalk.green.bold(`\n✅ Vincent ${type} built successfully`));
    console.log(chalk.gray(`📁 Built in: ${targetPath}`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error building Vincent ${type}:`), error);
    throw error;
  } finally {
    // Always restore original working directory
    process.chdir(originalCwd);
  }
}

/**
 * Deploy a single project
 */
async function deployProject(type, projectPath) {
  const originalCwd = process.cwd();
  const targetPath = projectPath;

  try {
    console.log(chalk.cyan("\n🚀 Deploying lit action to IPFS...\n"));

    // Change to project directory for deployment
    process.chdir(targetPath);

    // Import deploy function and call with project-specific path
    const deployLitAction = require("../deploy-lit-action");
    await deployLitAction({
      generatedDir: path.join(targetPath, "src/generated"),
      outputFile: "lit-action.js",
      projectType: type,
    });

    console.log(chalk.green.bold("\n✅ Lit action deployed successfully"));
    console.log(chalk.gray(`📁 Deployed from: ${targetPath}`));
  } catch (error) {
    console.error(chalk.red("\n❌ Error in deploy process:"), error);
    throw error;
  } finally {
    // Always restore original working directory
    process.chdir(originalCwd);
  }
}

module.exports = {
  buildCurrentPackage,
  deployCurrentPackage,
  cleanCurrentPackage,
};
