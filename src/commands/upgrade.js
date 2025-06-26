const chalk = require('chalk');
const inquirer = require('inquirer');
const { checkForUpdates } = require('../utils/version-utils');

/**
 * Handle upgrade command
 */
async function upgradeScaffold() {
  console.log(chalk.cyan.bold('\n🚀 Vincent Scaffold SDK Upgrade\n'));

  const updateInfo = await checkForUpdates();

  if (!updateInfo.hasUpdate) {
    console.log(
      chalk.green(
        `✅ You're already on the latest version (${updateInfo.currentVersion})`
      )
    );
    return;
  }

  console.log(chalk.yellow(`📦 Current version: ${updateInfo.currentVersion}`));
  console.log(chalk.green(`📦 Latest version: ${updateInfo.latestVersion}`));

  const shouldUpgrade = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'upgrade',
      message: `Upgrade to version ${updateInfo.latestVersion}?`,
      default: true,
    },
  ]);

  if (!shouldUpgrade.upgrade) {
    console.log(chalk.yellow('👋 Upgrade cancelled'));
    return;
  }

  console.log(chalk.cyan('\n📥 Installing latest version...'));

  try {
    const { spawn } = require('child_process');

    // Run npm install globally
    const npmProcess = spawn(
      'npm',
      [
        'install',
        '-g',
        `@lit-protocol/vincent-scaffold-sdk@${updateInfo.latestVersion}`,
      ],
      {
        stdio: 'inherit',
      }
    );

    npmProcess.on('close', (code) => {
      if (code === 0) {
        console.log(
          chalk.green.bold(
            `\n✅ Successfully upgraded to version ${updateInfo.latestVersion}!`
          )
        );
        console.log(
          chalk.gray(
            'Note: You may need to restart your terminal or run \'hash -r\' to use the new version.'
          )
        );
      } else {
        console.error(
          chalk.red(
            '❌ Failed to upgrade. Please try manually: npm install -g @lit-protocol/vincent-scaffold-sdk@latest'
          )
        );
      }
    });
  } catch (error) {
    console.error(chalk.red(`❌ Error during upgrade: ${error.message}`));
    console.log(
      chalk.gray(
        'Try manually: npm install -g @lit-protocol/vincent-scaffold-sdk@latest'
      )
    );
  }
}

module.exports = {
  upgradeScaffold
};