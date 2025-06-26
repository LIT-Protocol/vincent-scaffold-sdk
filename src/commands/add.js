const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { requireVincentConfig } = require('../utils/config-utils');
const {
  processTemplate,
  getTemplateFiles,
  validateTemplateType,
} = require('../template-loader');

// Default policy name that tools will reference
const DEFAULT_POLICY_NAME = "send-counter-limit";

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
      if (filename.endsWith('.json')) {
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
 * Create a new Vincent project
 */
function createProject(type, name, directory) {
  // Load Vincent configuration
  const vincentConfig = requireVincentConfig();

  // If directory not provided, use configured directory structure
  if (!directory || directory === name) {
    const baseDir =
      type === 'tool'
        ? vincentConfig.directories.tools
        : vincentConfig.directories.policies;
    directory = path.resolve(baseDir, name);
  }

  console.log(chalk.cyan(`\n📁 Creating ${type} "${name}"...\n`));

  try {
    // Template variables with configuration
    const prefix =
      type === 'tool'
        ? vincentConfig.package.toolPrefix
        : vincentConfig.package.policyPrefix;
    const packageName = `${vincentConfig.package.namespace}/${prefix}${name}`;

    const variables = {
      name: name,
      type: type,
      namespace: vincentConfig.package.namespace,
      packageName: packageName,
      camelCaseName: name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
    };

    // For tools, add the default policy package name
    if (type === 'tool') {
      const policyPrefix = vincentConfig.package.policyPrefix;
      const policyPackageName = `${vincentConfig.package.namespace}/${policyPrefix}${DEFAULT_POLICY_NAME}`;
      variables.policyPackageName = policyPackageName;
    }

    // Use the shared template creation function
    createProjectFromTemplate(type, directory, variables);

    // Get template files for logging
    const templateFiles = getTemplateFiles(type);
    for (const filename of templateFiles) {
      console.log(chalk.green(`✓ Created ${filename}`));
    }

    console.log(
      chalk.green.bold(`\n✅ Successfully created Vincent ${type}: ${name}`)
    );
    console.log(chalk.cyan(`📁 Location: ${directory}`));
    console.log(chalk.yellow(`\n📋 Next steps:`));
    console.log(chalk.gray(`   cd ${path.relative(process.cwd(), directory)}`));
    console.log(chalk.gray(`   npm install`));
    console.log(chalk.gray(`   # Start developing your ${type}!`));
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
    console.error(chalk.red(`\n❌ Failed to create project: ${error.message}`));
    process.exit(1);
  }
}

module.exports = {
  createProject
};