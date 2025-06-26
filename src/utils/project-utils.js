const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { loadVincentConfig } = require('./config-utils');

/**
 * Check if a directory is a Vincent project
 */
function isVincentProject(directory) {
  const packageJsonPath = path.join(directory, 'package.json');
  const tsconfigPath = path.join(directory, 'tsconfig.json');

  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(tsconfigPath)) {
    return { isProject: false };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check for Vincent dependencies
    const hasVincentDeps =
      packageJson.dependencies &&
      (packageJson.dependencies['@lit-protocol/vincent-tool-sdk'] ||
        packageJson.dependencies['@lit-protocol/vincent-scaffold-sdk']);

    if (!hasVincentDeps) {
      return { isProject: false };
    }

    // Determine project type by checking for tool or policy implementation files
    const toolPath = path.join(directory, 'src', 'lib', 'vincent-tool.ts');
    const policyPath = path.join(directory, 'src', 'lib', 'vincent-policy.ts');

    if (fs.existsSync(toolPath)) {
      return {
        isProject: true,
        type: 'tool',
        name: path.basename(directory),
        packageName: packageJson.name || path.basename(directory),
        path: directory,
      };
    } else if (fs.existsSync(policyPath)) {
      return {
        isProject: true,
        type: 'policy',
        name: path.basename(directory),
        packageName: packageJson.name || path.basename(directory),
        path: directory,
      };
    }

    return { isProject: false };
  } catch (error) {
    return { isProject: false };
  }
}

/**
 * Get available projects of a specific type
 */
function getAvailableProjects(type) {
  const vincentConfig = loadVincentConfig();
  if (!vincentConfig) {
    return []; // Return empty array if no config found
  }

  const baseDir =
    type === 'tool'
      ? vincentConfig.directories.tools
      : vincentConfig.directories.policies;
  const basePath = path.resolve(baseDir);

  if (!fs.existsSync(basePath)) {
    return [];
  }

  const projects = [];
  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const projectPath = path.join(basePath, entry.name);
      const tsConfigPath = path.join(projectPath, 'tsconfig.json');
      const libPath = path.join(
        projectPath,
        'src',
        'lib',
        `vincent-${type}.ts`
      );
      const packageJsonPath = path.join(projectPath, 'package.json');

      // Validate project structure
      if (
        fs.existsSync(tsConfigPath) &&
        fs.existsSync(libPath) &&
        fs.existsSync(packageJsonPath)
      ) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf8')
          );
          projects.push({
            name: entry.name,
            path: projectPath,
            packageName: packageJson.name || entry.name,
            description: packageJson.description || `Vincent ${type} project`,
          });
        } catch (error) {
          // Skip invalid package.json files
          console.warn(
            chalk.yellow(`⚠️  Skipping ${entry.name}: Invalid package.json`)
          );
        }
      }
    }
  }

  return projects;
}

module.exports = {
  isVincentProject,
  getAvailableProjects
};