import { formatReport } from '#cli/format-report.ts';
import { defaultBanner, gradientBanner } from '#lib/banners.ts';
import { findTemplateFiles, readImportAliases, readSourceDirs } from '#lib/file-system.ts';
import { transform, type TransformResult } from '#src/codemod.ts';
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
import path from 'node:path';
import pc from 'picocolors';

/**
 * Fully resolved configuration used by the CLI run loop.
 */
export interface CliConfig {
  /** Absolute path to the Ember project root. */
  projectRoot: string;
  /**
   * Run without writing files to disk. When `undefined`, the CLI will
   * prompt the user interactively (after the intro banner).
   */
  dryRun?: boolean;
  /** Ask for confirmation after each file. */
  confirm: boolean;
  /**
   * When set, only these files are processed instead of discovering all
   * template files in the project. Paths are relative to `projectRoot`.
   */
  files?: string[];
  /**
   * When set, only discover template files under this subdirectory
   * (relative to `projectRoot`). Used when the user passes a directory
   * path that is inside a project (e.g. `app/components/`).
   */
  targetDir?: string;
  /**
   * When the project root was inferred from a file or subdirectory path,
   * this holds the inferred value so `runCodemod` can prompt the user to
   * confirm or correct it.
   */
  inferredProjectRoot?: string;
}

/**
 * Result of transforming a single file, enriched with the file path.
 */
export interface FileResult {
  /** Path to the file, relative to the project root. */
  filePath: string;
  /** Whether the file was modified by the transform. */
  changed: boolean;
  /** The transform result (output, unresolved icons, ambiguous icons). */
  result: TransformResult;
}

/**
 * Main CLI orchestrator. Discovers files, transforms them, and prints a report.
 *
 * This function is the testable core of the CLI — it receives a fully resolved
 * config and does not parse command-line arguments itself.
 */
export async function runCodemod(config: CliConfig): Promise<FileResult[]> {
  let { projectRoot } = config;
  const hasColors = process.stdout.hasColors?.(8) ?? false;
  const isInteractive = process.stdout.isTTY === true && process.stdin.isTTY === true;

  // Banner
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

  // When the project root was inferred from a file or subdirectory path,
  // prompt the user to confirm or correct it.
  if (config.inferredProjectRoot && isInteractive) {
    const answer = await clackText({
      message: 'Project root:',
      initialValue: config.inferredProjectRoot,
    });
    if (isCancel(answer)) {
      cancel('Cancelled.');
      process.exit(0);
    }
    projectRoot = path.resolve(answer);
  }

  // Resolve dry-run mode. If the flag wasn't set, prompt interactively or
  // default to writing (non-interactive environments like CI).
  let dryRun: boolean;
  if (config.dryRun !== undefined) {
    dryRun = config.dryRun;
  } else if (isInteractive) {
    const answer = await clackConfirm({
      message: 'Dry run? (no file changes)',
      initialValue: false,
    });
    if (isCancel(answer)) {
      cancel('Cancelled.');
      process.exit(0);
    }
    dryRun = answer;
  } else {
    dryRun = false;
  }

  if (dryRun) {
    log.info('Dry run mode — no files will be written.');
  }

  // Discover project configuration
  log.step('Reading project configuration...');
  const sourceDirs = readSourceDirs(projectRoot);
  const importAliases = readImportAliases(projectRoot);
  log.info(`Source directories: ${sourceDirs.join(', ')}`);
  if (importAliases.length > 0) {
    log.info(`Import aliases: ${importAliases.map((a) => a.alias).join(', ')}`);
  }

  // Discover template files — use explicit file list, scoped directory, or
  // full project discovery.
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
    return [];
  }

  // Transform files
  log.step('Transforming files...');
  const results: FileResult[] = [];
  const s = spinner();

  for (const filePath of templateFiles) {
    s.start(pc.dim(filePath));

    const absolutePath = path.join(projectRoot, filePath);
    const source = readFileSync(absolutePath, 'utf-8');
    const result = transform(source, filePath, { projectRoot, sourceDirs, importAliases });
    const changed = result.output !== source;

    if (changed) {
      if (!dryRun) {
        writeFileSync(absolutePath, result.output, 'utf-8');
      }
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

  const changedCount = results.filter((r) => r.changed).length;
  if (dryRun && changedCount > 0) {
    outro(`Dry run complete. ${changedCount} ${changedCount === 1 ? 'file' : 'files'} would be changed.`);
  } else {
    outro('Done!');
  }

  // Report is printed after the clack outro so it stands on its own.
  const report = formatReport(results, hasColors);
  if (report.trim()) {
    console.log(report);
  }

  return results;
}
