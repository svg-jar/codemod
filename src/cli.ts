#!/usr/bin/env node
import { Command } from 'commander';
import packageJson from '../package.json' with { type: 'json' };
import { resolveConfig } from '#cli/resolve-config.ts';
import { runCli } from '#cli/run-cli.ts';
import type { CliFlags } from '#cli/types.ts';

async function main() {
  const program = new Command();

  program
    .name(packageJson.name)
    .version(packageJson.version)
    .description(packageJson.description)
    .argument('[path]', 'Path to the project root (defaults to current directory)')
    .option('-d, --dry-run', 'Run the codemod without writing changes to disk')
    .option('-c, --confirm', 'Ask for confirmation before writing each file')
    .parse(process.argv);

  const opts = program.opts<Omit<CliFlags, 'path'>>();
  const [pathArg] = program.args;

  const flags: CliFlags = {
    path: pathArg,
    dryRun: opts.dryRun,
    confirm: opts.confirm,
  };

  const config = resolveConfig(flags);
  await runCli(config);
}

main().catch((error: unknown) => {
  console.error('An error occurred while running the codemod:', error);
  process.exit(1);
});
