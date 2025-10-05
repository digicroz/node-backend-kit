#!/usr/bin/env node
import { Option, program } from 'commander';
import { deleteAllRepos } from '../cli/deleteAllRepos.js';
import { deployAllRepos } from '../cli/deployAllRepos.js';
import { gitAcpAllRepos } from '../cli/gitAcpAllRepos.js';
import { gitPushAllRepos } from '../cli/gitPushAllRepos.js';
import { transfer2Shared } from '../cli/transfer2Shared.js';
import { initConfig } from '../cli/initConfig.js';
import { fixConfigFile } from '../cli/fixConfigFile.js';
import { createInitWorkspaceShellFile } from '../cli/createInitWorkspaceShellFile.js';
import { addDevVersion } from '../cli/addDevVersion.js';
import { addProdVersion } from '../cli/addProdVersion.js';
import '../utils/progress.js';

import packageJson from '../../package.json' with { type: "json" };

program
  .name('nbk')
  .version(packageJson.version)
  .description('PrimeXOP Backend Kit - CLI Tool');

program
  .command('init')
  .description('Initialize an empty nbk.config.json file in the project root')
  .action(async () => {
    await initConfig();
  });

program
  .command('delete-all-repos')
  .description('Delete b2fPortal directory in all repositories')
  .action(async () => {
    await deleteAllRepos();
  });

program
  .command('deploy-all-repos')
  .description('Deploy all repositories')
  .action(async () => {
    await deployAllRepos();
  });

program
  .command('git-acp-all-repos')
  .description('Add, commit, and push changes in all repositories')
  .action(async () => {
    await gitAcpAllRepos();
  });

program
  .command('git-push-all-repos')
  .description('Push b2fPortal changes in all repositories')
  .action(async () => {
    await gitPushAllRepos();
  });

program
  .command('fix-config-file')
  .description('Fix JSON files by adding double quotes to keys and removing trailing commas')
  .option('-p, --path <path>', 'Path to the JSON file to fix (defaults to nbk.config.json)')
  .action(async (options) => {
    await fixConfigFile(options.path);
  });

program
  .command('transfer-2-shared')
  .description('Transfer project files to shared backend repositories')
  .action(async () => {
    await transfer2Shared();
  });

program
  .command('create-init-workspace-shell-file')
  .description('Create a shell script to initialize and open project workspaces')
  .action(async () => {
    await createInitWorkspaceShellFile();
  });

program
  .command('add-dev-version')
  .description('Update package.json to use local development version of @digicroz/node-backend-kit and run npm install')
  .option('-d, --dir <directory>', 'Target directory containing package.json (defaults to current directory)')
  .action(async (options) => {
    await addDevVersion(options.dir);
  });

program
  .command('add-prod-version')
  .description('Update package.json to use published version of @digicroz/node-backend-kit and run npm install')
  .option('-d, --dir <directory>', 'Target directory containing package.json (defaults to current directory)')
  .option('-v, --version <version>', 'Specific version to use (defaults to latest)')
  .action(async (options) => {
    await addProdVersion(options.dir, options.version);
  });

program.parseAsync(process.argv);