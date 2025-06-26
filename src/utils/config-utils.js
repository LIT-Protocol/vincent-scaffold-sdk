const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/**
 * Search for vincent.json starting from current directory and going up
 */
function loadVincentConfig() {
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const configPath = path.join(currentDir, "vincent.json");
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configContent);
      } catch (error) {
        console.error(
          chalk.red(`\n❌ Error reading vincent.json: ${error.message}`)
        );
        process.exit(1);
      }
    }
    currentDir = path.dirname(currentDir);
  }

  // Return null instead of exiting - let callers handle this case
  return null;
}

/**
 * Load Vincent config and exit if not found
 */
function requireVincentConfig() {
  const config = loadVincentConfig();
  if (!config) {
    console.error(
      chalk.red(
        '\n❌ vincent.json not found. Please run "vincent-scaffold init" first.'
      )
    );
    process.exit(1);
  }
  return config;
}

/**
 * Create Vincent configuration file
 */
function createVincentConfig(config) {
  const vincentConfig = {
    package: {
      namespace: config.namespace,
      toolPrefix: config.toolPrefix,
      policyPrefix: config.policyPrefix,
    },
    directories: {
      tools: config.toolsDirectory,
      policies: config.policiesDirectory,
    },
  };

  const configPath = path.resolve("vincent.json");
  fs.writeFileSync(configPath, JSON.stringify(vincentConfig, null, 2));

  console.log(chalk.green(`\n✅ Created vincent.json configuration`));
  return vincentConfig;
}

/**
 * Create .env.vincent-sample file
 */
function createEnvSample() {
  try {
    // Read template from the templates directory
    const templatePath = path.join(__dirname, '..', 'templates', '.env.sample');
    const envContent = fs.readFileSync(templatePath, 'utf8');
    
    const envPath = path.resolve('.env.vincent-sample');
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green(`✅ Created .env.vincent-sample file`));
  } catch (error) {
    console.error(chalk.red(`❌ Error creating .env.vincent-sample: ${error.message}`));
    throw error;
  }
}

module.exports = {
  loadVincentConfig,
  requireVincentConfig,
  createVincentConfig,
  createEnvSample,
};
