const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default || require('chalk');

/**
 * Recursively find and remove directories by name
 */
function findAndRemoveDirectories(baseDir, targetNames) {
  if (!fs.existsSync(baseDir)) {
    return;
  }

  const items = fs.readdirSync(baseDir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(baseDir, item.name);
    
    if (item.isDirectory()) {
      // Check if this directory should be removed
      if (targetNames.includes(item.name)) {
        try {
          console.log(chalk.gray(`  Removing directory: ${fullPath}`));
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (error) {
          console.log(chalk.yellow(`  Warning: Could not remove ${fullPath}: ${error.message}`));
        }
      } else {
        // Recursively search subdirectories
        findAndRemoveDirectories(fullPath, targetNames);
      }
    }
  }
}

/**
 * Find and remove files by name
 */
function findAndRemoveFiles(baseDir, targetNames) {
  if (!fs.existsSync(baseDir)) {
    return;
  }

  const items = fs.readdirSync(baseDir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(baseDir, item.name);
    
    if (item.isFile()) {
      // Check if this file should be removed
      if (targetNames.includes(item.name)) {
        try {
          console.log(chalk.gray(`  Removing file: ${fullPath}`));
          fs.unlinkSync(fullPath);
        } catch (error) {
          console.log(chalk.yellow(`  Warning: Could not remove ${fullPath}: ${error.message}`));
        }
      }
    } else if (item.isDirectory()) {
      // Recursively search subdirectories
      findAndRemoveFiles(fullPath, targetNames);
    }
  }
}

/**
 * Remove files/directories from root
 */
function removeFromRoot(targets) {
  for (const target of targets) {
    const fullPath = path.resolve(target);
    
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          console.log(chalk.gray(`  Removing root directory: ${target}`));
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          console.log(chalk.gray(`  Removing root file: ${target}`));
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.log(chalk.yellow(`  Warning: Could not remove ${target}: ${error.message}`));
      }
    }
  }
}

/**
 * Perform hard reset - equivalent to:
 * find vincent-packages -type d \( -name 'dist' -o -name 'node_modules' -o -name 'generated' \) -exec rm -rf {} + 2>/dev/null || true && 
 * find vincent-packages -name 'package-lock.json' -delete && 
 * rm -rf node_modules package-lock.json .e2e-state.json
 */
async function hardReset() {
  try {
    console.log(chalk.cyan('🧹 Performing hard reset...'));
    
    // Remove dist, node_modules, and generated directories from vincent-packages
    console.log(chalk.gray('Removing dist, node_modules, and generated directories from vincent-packages...'));
    findAndRemoveDirectories('vincent-packages', ['dist', 'node_modules', 'generated']);
    
    // Remove package-lock.json files from vincent-packages
    console.log(chalk.gray('Removing package-lock.json files from vincent-packages...'));
    findAndRemoveFiles('vincent-packages', ['package-lock.json']);
    
    // Remove root level files/directories
    console.log(chalk.gray('Removing root level files and directories...'));
    removeFromRoot(['node_modules', 'package-lock.json', '.e2e-state.json']);
    
    console.log(chalk.green('✅ Hard reset completed successfully!'));
  } catch (error) {
    console.log(chalk.red('❌ Hard reset failed:'));
    console.log(chalk.red(error.message));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  hardReset();
}

module.exports = { hardReset };