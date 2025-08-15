// Main entry point for @lit-protocol/vincent-scaffold-sdk
const {
  baseConfig,
  getPlugins,
  ensureDirectoryExistence,
  logBuildResults,
} = require("./src/esbuild-share-config");

const deployLitAction = require("./src/deploy-lit-action");
const { generateLitAction } = require("./src/lit-action-generator");

// Build functions
async function buildAbility() {
  const esbuild = require("esbuild");

  // Generate lit-action.ts before building
  generateLitAction("ability");

  await esbuild
    .build({
      ...baseConfig,
      entryPoints: ["./src/generated/lit-action.ts"],
      outdir: "./src/generated/",
      plugins: getPlugins("ability"),
    })
    .then(logBuildResults);
}

async function buildPolicy() {
  const esbuild = require("esbuild");

  // Generate lit-action.ts before building
  generateLitAction("policy");

  await esbuild
    .build({
      ...baseConfig,
      entryPoints: ["./src/generated/lit-action.ts"],
      outdir: "./src/generated/",
      plugins: getPlugins("policy"),
    })
    .then(logBuildResults);
}

module.exports = {
  baseConfig,
  getPlugins,
  ensureDirectoryExistence,
  logBuildResults,
  deployLitAction,
  buildAbility,
  buildPolicy,
};
