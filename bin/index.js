#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const release = require('../tasks/release');
const deploy = require('../tasks/deploy');
const rollbar = require('../tasks/rollbar');

const log = console.log.bind(console);

program
    .version('1.0.0');

program
  .command('release <version>')
  .option('--no-push', 'Do not push commits and tags')
  .description('Generates and releases a version: <patch, minor, major>')
  .action((version, { push = true }) => {
    log(chalk.cyan('Releasing %s version.'), version);
    release(version, push);
  });

program
  .command('deploy')
  .description('Do the deploy process')
  .option('-p, --path [path]', 'Path to final distribution directory')
  .action(({ path }) => {
    log(chalk.cyan('Deploying'));
    deploy(path);
  });

program
  .command('rollbar')
  .description('Notify rollbar about the new deploy')
  .option('--token', 'Token para comunicacao com o rollbar')
  .option('--env', 'Ambiente do rollbar aonde ta sendo feito o deploy')
  .option('--tag', 'Versao do build')
  .option('--user', 'Usuario que esta fazendo o build')
  .option('--comment', 'Comentario sobre o deploy')
  .action(({ token, env, tag, user, comment }) => {
    log(chalk.cyan('Enviando notificação para o Rollbar'));
    rollbar({ token, env, tag, user, comment });
  });

program.parse(process.argv);

if (!program.args.length) program.help();
