const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Get current package version and location information
 */
function getPackageInfo() {
  try {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Determine if this is a global or local installation
    const isGlobal = __dirname.includes('/lib/node_modules/') || __dirname.includes('/.npm/');
    const installLocation = isGlobal ? 'global' : 'local';
    
    return {
      name: packageJson.name,
      version: packageJson.version,
      installLocation,
      installPath: path.dirname(path.dirname(__dirname))
    };
  } catch (error) {
    return {
      name: '@lit-protocol/vincent-scaffold-sdk',
      version: 'unknown',
      installLocation: 'unknown',
      installPath: 'unknown'
    };
  }
}

/**
 * Check for available updates on npm registry
 */
async function checkForUpdates() {
  try {
    const https = require('https');
    const packageInfo = getPackageInfo();
    const currentVersion = packageInfo.version;

    return new Promise((resolve) => {
      const req = https.get(
        `https://registry.npmjs.org/${packageInfo.name}`,
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const npmData = JSON.parse(data);
              const latestVersion = npmData['dist-tags'].latest;
              resolve({
                currentVersion,
                latestVersion,
                hasUpdate: currentVersion !== latestVersion,
                packageInfo
              });
            } catch (error) {
              resolve({
                currentVersion,
                latestVersion: currentVersion,
                hasUpdate: false,
                packageInfo
              });
            }
          });
        }
      );

      req.on('error', () => {
        resolve({
          currentVersion,
          latestVersion: currentVersion,
          hasUpdate: false,
          packageInfo
        });
      });

      req.setTimeout(3000, () => {
        req.destroy();
        resolve({
          currentVersion,
          latestVersion: currentVersion,
          hasUpdate: false,
          packageInfo
        });
      });
    });
  } catch (error) {
    const packageInfo = getPackageInfo();
    return {
      currentVersion: packageInfo.version,
      latestVersion: packageInfo.version,
      hasUpdate: false,
      packageInfo
    };
  }
}

/**
 * Display version information with update check
 */
async function showVersionWithUpdateCheck() {
  console.log(chalk.cyan.bold('\n🚀 Vincent Scaffold SDK'));
  
  const updateInfo = await checkForUpdates();
  const { packageInfo } = updateInfo;
  
  console.log(chalk.gray(`Version: ${updateInfo.currentVersion}`));
  console.log(chalk.gray(`Package: ${packageInfo.name}`));
  console.log(chalk.gray(`Installation: ${packageInfo.installLocation} (${packageInfo.installPath})`));
  
  if (updateInfo.hasUpdate) {
    console.log(chalk.yellow(`\n📦 Update available: ${updateInfo.latestVersion}`));
    console.log(chalk.gray(`Run 'vincent-scaffold upgrade' to update\n`));
  } else if (updateInfo.currentVersion !== 'unknown') {
    console.log(chalk.green('\n✅ You are using the latest version\n'));
  } else {
    console.log('');
  }
}

module.exports = {
  getPackageInfo,
  checkForUpdates,
  showVersionWithUpdateCheck
};