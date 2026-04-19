import { type CliConfig, type FileResult } from '#cli/resolve-config.ts';
import { formatReport } from '#cli/format-report.ts';
import { defaultBanner, gradientBanner } from '#cli/banners.ts';
import { findEmberCliBuildFile, findTemplateFiles, readImportAliases, readSourceDirs } from '#lib/file-system.ts';
import { removeSvgJarConfig } from '#lib/remove-svg-jar-config.ts';
import { transform, type TransformOptions } from '#src/codemod.ts';
import {
  cancel,
  confirm as clackConfirm,
  text as clackText,
  intro,
  isCancel,
  log,
  outro,
  spinner,
} from '@clack/prompts';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import path from 'node:path';
import pc from 'picocolors';

function showIntro(isInteractive: boolean, hasColors: boolean): void {
  console.log('');
  intro(isInteractive && hasColors ? pc.bold(gradientBanner) : defaultBanner);

  log.message([
    'This codemod migrates your Ember project from ember-svg-jar to',
    'direct SVG component imports. It will:',
    '',
    `  1. Find all ${pc.cyan('{{svgJar "..."}}')} calls in your templates`,
    `  2. Locate each icon SVG file in your source directories`,
    `  3. Replace mustache calls with ${pc.cyan('<Component />')} invocations`,
    `  4. Add the corresponding ${pc.cyan('import')} statements`,
  ]);
}

async function resolveProjectRoot(config: CliConfig, isInteractive: boolean): Promise<string> {
  if (!config.inferredProjectRoot || !isInteractive) return config.projectRoot;

  const answer = await clackText({
    message: 'Project root:',
    initialValue: config.inferredProjectRoot,
  });
  if (isCancel(answer)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  return path.resolve(answer);
}

async function resolveDryRun(config: CliConfig, isInteractive: boolean): Promise<boolean> {
  if (config.dryRun !== undefined) return config.dryRun;

  if (isInteractive) {
    const answer = await clackConfirm({
      message: 'Dry run? (no file changes)',
      initialValue: false,
    });
    if (isCancel(answer)) {
      cancel('Cancelled.');
      process.exit(0);
    }
    return answer;
  }

  return false;
}

function readProjectConfig(projectRoot: string): Pick<TransformOptions, 'sourceDirs' | 'importAliases'> {
  log.step('Reading project configuration...');
  const sourceDirs = readSourceDirs(projectRoot);
  const importAliases = readImportAliases(projectRoot);
  log.info(`Source directories: ${sourceDirs.join(', ')}`);
  if (importAliases.length > 0) {
    log.info(`Import aliases: ${importAliases.map((a) => a.alias).join(', ')}`);
  }
  return { sourceDirs, importAliases };
}

function discoverTemplateFiles(config: CliConfig, projectRoot: string): string[] | null {
  log.step('Discovering template files...');

  let templateFiles: string[];
  if (config.files) {
    templateFiles = config.files;
    log.info(`Processing ${templateFiles.length} specified ${templateFiles.length === 1 ? 'file' : 'files'}.`);
  } else {
    templateFiles = findTemplateFiles(projectRoot, config.targetDir);
    if (config.targetDir) {
      log.info(
        `Found ${templateFiles.length} ${templateFiles.length === 1 ? 'file' : 'files'} under ${config.targetDir}.`,
      );
    } else {
      log.info(`Found ${templateFiles.length} ${templateFiles.length === 1 ? 'file' : 'files'} to process.`);
    }
  }

  if (templateFiles.length === 0) {
    log.warn('No .gjs or .gts files found.');
    outro('Nothing to do.');
    return null;
  }

  return templateFiles;
}

async function transformFiles(
  templateFiles: string[],
  projectRoot: string,
  transformOptions: TransformOptions,
  config: CliConfig,
  dryRun: boolean,
): Promise<FileResult[]> {
  log.step('Transforming files...');
  const results: FileResult[] = [];
  const s = spinner();

  for (const filePath of templateFiles) {
    s.start(pc.dim(filePath));

    const absolutePath = path.join(projectRoot, filePath);
    const source = readFileSync(absolutePath, 'utf-8');
    const result = transform(source, filePath, transformOptions);
    const changed = result.output !== source;

    if (changed) {
      if (!dryRun) writeFileSync(absolutePath, result.output, 'utf-8');
      s.stop(`${pc.bold(filePath)} — ${dryRun ? pc.yellow('would change (dry run)') : pc.green('changed')}`);
    } else {
      s.stop(`${pc.bold(filePath)} — ${pc.dim('no changes')}`);
    }

    if (config.confirm) {
      const answer = await clackConfirm({
        message: 'Continue to next file?',
        initialValue: true,
      });
      if (isCancel(answer) || !answer) {
        cancel('Stopped.');
        process.exit(0);
      }
    }

    results.push({ filePath, changed, result });
  }

  return results;
}

function showOutro(results: FileResult[], dryRun: boolean, hasColors: boolean): void {
  const changedCount = results.filter((r) => r.changed).length;
  if (dryRun && changedCount > 0) {
    outro(`Dry run complete. ${changedCount} ${changedCount === 1 ? 'file' : 'files'} would be changed.`);
  } else {
    outro('Done!');
  }

  const report = formatReport(results, hasColors);
  if (report.trim()) console.log(report);
}

async function maybeCleanConfig({
  config,
  results,
  projectRoot,
  dryRun,
  isInteractive,
}: {
  config: CliConfig;
  results: FileResult[];
  projectRoot: string;
  dryRun: boolean;
  isInteractive: boolean;
}): Promise<void> {
  if (!config.cleanConfig || config.files || config.targetDir) return;

  const hasUnresolved = results.some((r) => r.result.unresolvedIcons.length > 0);
  if (hasUnresolved) {
    log.warn(
      'svgJar config was not removed from ember-cli-build.js — some icons could not be resolved.\n' +
        'Resolve them first, then re-run with --clean-config.',
    );
    return;
  }

  const buildFile = findEmberCliBuildFile(projectRoot);
  if (!buildFile) {
    log.warn('Could not find ember-cli-build.js — skipping config removal.');
    return;
  }

  const buildFileName = basename(buildFile);

  if (dryRun) {
    log.info(`Would remove svgJar config from ${buildFileName} (dry run).`);
    return;
  }

  if (isInteractive) {
    const answer = await clackConfirm({
      message: `Remove svgJar config from ${buildFileName}?`,
      initialValue: true,
    });
    if (isCancel(answer)) {
      cancel('Cancelled.');
      process.exit(0);
    }
    if (!answer) return;
  }

  const buildSource = readFileSync(buildFile, 'utf-8');
  writeFileSync(buildFile, removeSvgJarConfig(buildSource), 'utf-8');
  log.success(`Removed svgJar config from ${buildFileName}.`);
}

/**
 * Main CLI orchestrator. Discovers files, transforms them, and prints a report.
 *
 * This function is the testable core of the CLI — it receives a fully resolved
 * config and does not parse command-line arguments itself.
 */
export async function runCodemod(config: CliConfig): Promise<FileResult[]> {
  const hasColors = process.stdout.hasColors?.(8) ?? false;
  const isInteractive = process.stdout.isTTY === true && process.stdin.isTTY === true;

  showIntro(isInteractive, hasColors);

  const projectRoot = await resolveProjectRoot(config, isInteractive);
  const dryRun = await resolveDryRun(config, isInteractive);

  if (dryRun) log.info('Dry run mode — no files will be written.');

  const { sourceDirs, importAliases } = readProjectConfig(projectRoot);

  const templateFiles = discoverTemplateFiles(config, projectRoot);
  if (!templateFiles) return [];

  const transformOptions: TransformOptions = { projectRoot, sourceDirs, importAliases };
  const results = await transformFiles(templateFiles, projectRoot, transformOptions, config, dryRun);

  await maybeCleanConfig({ config, results, projectRoot, dryRun, isInteractive });

  showOutro(results, dryRun, hasColors);

  return results;
}
