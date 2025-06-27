const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default || require('chalk');

/**
 * Reset E2E state - equivalent to: rm -f .e2e-state.json
 */
async function resetE2E() {
  try {
    const stateFile = path.resolve('.e2e-state.json');
    
    if (fs.existsSync(stateFile)) {
      console.log(chalk.cyan('🔄 Resetting E2E state...'));
      fs.unlinkSync(stateFile);
      console.log(chalk.green('✅ E2E state file removed successfully!'));
    } else {
      console.log(chalk.gray('ℹ️  E2E state file does not exist, nothing to reset.'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Failed to reset E2E state:'));
    console.log(chalk.red(error.message));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetE2E();
}

module.exports = { resetE2E };