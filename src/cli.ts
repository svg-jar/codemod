#!/usr/bin/env node
import { resolveConfig } from '#cli/resolve-config.ts';
import { runCodemod } from '#cli/run-codemod.ts';
import { Command } from 'commander';
import packageJson from '../package.json' with { type: 'json' };

/**
 * Raw flags parsed from commander before any defaults or prompts are applied.
 */
export interface CliFlags {
  /** Path to the project root, a subdirectory, or a specific file. Defaults to ".". */
  path?: string;
  /** Run without writing files to disk. */
  dryRun?: boolean;
  /** Ask for confirmation after each file. */
  confirm?: boolean;
}

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
  await runCodemod(config);
}

main().catch((error: unknown) => {
  console.error('An error occurred while running the codemod:', error);
  process.exit(1);
});
