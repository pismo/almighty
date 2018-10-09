const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { spawnSync } = require('child_process');
const configPath = path.join(process.cwd(), 'package.json');
const config = require(configPath);

const log = console.log.bind(console);

const token = process.env.GIT_AUTH_TOKEN;

module.exports = function release(mode, push) {
  const regex = /.com\/(\w+)\/(\w+-?\w+).git/;
  const [, owner, repo] = config.repository.url.match(regex);
  const version = getVersion(mode);
  const cmd = getModulesPath('github-changes');
  const args = [
    '-m', 'DD/MM/YYYY',
    '-o', owner,
    '-r', repo,
    '-n', version,
    '--token', token,
    '--order-semver'
  ];

  run(cmd, args);
  run('git', ['add', '--all']);
  run('git', ['commit', '--amend', '--no-edit']);

  if (push) {
    run('git', ['push', 'origin', 'master:master']);
    run('git', ['push', `v${version}`]);
  }

  log(chalk.green(`Version ${version} generated with success!`));
};

function getVersion(version) {
  return run('npm', ['version', version]);
}

function run(cmd, args) {
  const spawnOptions = { stdio: 'pipe' };
  const result = spawnSync(cmd, args, spawnOptions);

  if (result.error) {
    log(result.error.stack);
    return process.exit(1);
  }

  return result.stdout.toString().trim();
}

function getModulesPath(moduleName, mPath) {
  // yarn generate node_modules into of package
  let modulePath = mPath || path.join(__dirname, '..', 'node_modules', '.bin', moduleName);

  try {
    fs.statSync(modulePath);
  } catch (err) {
    // npm not generate node_modules
    if (mPath !== modulePath) {
      modulePath = path.join(__dirname, '..', '..', '.bin', moduleName);
      getModulesPath(moduleName, modulePath);
    } else {
      console.error('module not found');
    }
  }

  return modulePath;
}
