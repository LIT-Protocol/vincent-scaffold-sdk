const fs = require("fs");
const path = require("path");

/**
 * Get the path to a lit-action template file
 * @param {string} type - Either 'ability' or 'policy'
 * @returns {string} Path to the template file
 */
function getTemplatePath(type) {
  return path.join(
    __dirname,
    "templates",
    "lit-actions",
    `${type}-lit-action.ts.template`
  );
}

/**
 * Generate lit-action.ts content for abilities
 * @returns {string} The generated TypeScript content
 */
function generateAbilityLitAction() {
  const templatePath = getTemplatePath("ability");
  return fs.readFileSync(templatePath, "utf8");
}

/**
 * Generate lit-action.ts content for policies
 * @returns {string} The generated TypeScript content
 */
function generatePolicyLitAction() {
  const templatePath = getTemplatePath("policy");
  return fs.readFileSync(templatePath, "utf8");
}

/**
 * Generate lit-action.ts file based on type
 * @param {string} type - Either 'ability' or 'policy'
 * @param {string} outputDir - Directory to write the file to
 */
function generateLitAction(type, outputDir = "./src/generated") {
  const content =
    type === "ability" ? generateAbilityLitAction() : generatePolicyLitAction();

  const outputPath = path.join(outputDir, "lit-action.ts");

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`✅ Generated lit-action.ts for ${type} at ${outputPath}`);
}

module.exports = {
  generateLitAction,
  generateAbilityLitAction,
  generatePolicyLitAction,
};
