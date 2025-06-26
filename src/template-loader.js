const fs = require("fs");
const path = require("path");

/**
 * Template loader utility for Vincent scaffold SDK
 */

/**
 * Get the templates directory path
 */
function getTemplatesDir() {
  return path.join(__dirname, "templates");
}

/**
 * Load a template file for a specific type
 * @param {string} type - The template type ('tool' or 'policy')
 * @param {string} filename - The template filename
 * @returns {string} The template content
 */
function loadTemplate(type, filename) {
  const templatePath = path.join(getTemplatesDir(), type, filename);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, "utf8");
}

/**
 * Convert a name to camelCase (removing hyphens and capitalizing)
 * @param {string} name - The name to convert
 * @returns {string} The camelCase version
 */
function toCamelCase(name) {
  return name
    .split("-")
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}

/**
 * Substitute variables in template content
 * @param {string} content - The template content
 * @param {object} variables - The variables to substitute
 * @returns {string} The content with variables substituted
 */
function substituteVariables(content, variables) {
  let result = content;

  // Add computed variables
  const allVariables = {
    ...variables,
    camelCaseName: toCamelCase(variables.name || ""),
  };

  // Replace all {{variableName}} patterns
  for (const [key, value] of Object.entries(allVariables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Get all template files for a specific type (recursively)
 * @param {string} type - The template type ('tool' or 'policy')
 * @param {string} subPath - Optional subdirectory path
 * @returns {string[]} Array of template file paths (relative to template root)
 */
function getTemplateFiles(type, subPath = '') {
  const typeDir = path.join(getTemplatesDir(), type, subPath);
  
  if (!fs.existsSync(typeDir)) {
    if (subPath === '') {
      throw new Error(`Template type not found: ${type}`);
    }
    return [];
  }
  
  const files = [];
  const items = fs.readdirSync(typeDir);
  
  for (const item of items) {
    if (item.startsWith('.') && item !== '.gitignore') continue;
    
    const itemPath = path.join(typeDir, item);
    const relativePath = path.join(subPath, item);
    
    if (fs.statSync(itemPath).isDirectory()) {
      // Recursively get files from subdirectories
      const subFiles = getTemplateFiles(type, relativePath);
      files.push(...subFiles);
    } else {
      // Skip lit-action.ts as it will be generated
      if (item === 'lit-action.ts') continue;
      files.push(relativePath);
    }
  }
  
  // Add tsconfig.json and global.d.ts to the file list (they will be processed from the shared template)
  if (subPath === '') {
    files.push('tsconfig.json');
    files.push('global.d.ts');
  }
  
  return files;
}

/**
 * Process a template file with variable substitution
 * @param {string} type - The template type ('tool' or 'policy')
 * @param {string} filename - The template filename
 * @param {object} variables - The variables to substitute
 * @returns {string} The processed template content
 */
function processTemplate(type, filename, variables) {
  let content;
  
  // Use shared tsconfig template for both tools and policies
  if (filename === "tsconfig.json") {
    const sharedTsconfigPath = path.join(getTemplatesDir(), "tsconfig.template.json");
    if (fs.existsSync(sharedTsconfigPath)) {
      content = fs.readFileSync(sharedTsconfigPath, "utf8");
    } else {
      content = loadTemplate(type, filename);
    }
  } else if (filename === "global.d.ts") {
    // Use shared global.d.ts for both tools and policies
    const sharedGlobalDtsPath = path.join(getTemplatesDir(), "global.d.ts");
    if (fs.existsSync(sharedGlobalDtsPath)) {
      content = fs.readFileSync(sharedGlobalDtsPath, "utf8");
    } else {
      content = loadTemplate(type, filename);
    }
  } else {
    content = loadTemplate(type, filename);
  }
  
  return substituteVariables(content, variables);
}

/**
 * Validate that all required templates exist for a type
 * @param {string} type - The template type to validate
 * @returns {boolean} True if all required templates exist
 */
function validateTemplateType(type) {
  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "README.md",
  ];

  try {
    const existingFiles = getTemplateFiles(type);
    return requiredFiles.every((file) => existingFiles.includes(file));
  } catch (error) {
    return false;
  }
}

module.exports = {
  loadTemplate,
  substituteVariables,
  getTemplateFiles,
  processTemplate,
  validateTemplateType,
  toCamelCase,
};
