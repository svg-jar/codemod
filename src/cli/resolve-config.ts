import { statSync } from 'node:fs';
import path from 'node:path';
import type { CliConfig, CliFlags } from '#cli/types.ts';

const TEMPLATE_EXTENSIONS = new Set(['.gjs', '.gts']);

/**
 * Infers the Ember project root from a path by walking up the directory tree
 * to find the parent of an `app/` segment.
 *
 * @example inferProjectRoot('/project/app/components/navbar.gjs') → '/project'
 * @example inferProjectRoot('/project/app/components') → '/project'
 * @returns The inferred project root, or `undefined` if no `app/` segment is found.
 */
export function inferProjectRoot(absPath: string): string | undefined {
  const segments = path.normalize(absPath).split(path.sep);

  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i] === 'app') {
      return segments.slice(0, i).join(path.sep) || path.sep;
    }
  }

  return undefined;
}

/**
 * Resolves CLI configuration from flags and defaults.
 *
 * Handles three cases for the path argument:
 *
 * 1. **No path or project root directory** — `projectRoot` is the directory,
 *    all template files are discovered.
 * 2. **Single file** (`.gjs`/`.gts`) — `projectRoot` is inferred from the
 *    `app/` segment in the path. `files` is set to the single file.
 * 3. **Subdirectory** (e.g. `app/components/`) — `projectRoot` is inferred,
 *    `targetDir` is set to scope file discovery.
 *
 * When the project root is inferred (cases 2 and 3), `inferredProjectRoot`
 * is set so that `runCli` can prompt the user to confirm or correct it.
 *
 * @param flags Raw flags from commander.
 * @param cwd   The current working directory (injected for testability).
 */
export function resolveConfig(flags: CliFlags, cwd: string = process.cwd()): CliConfig {
  const resolvedPath = path.resolve(cwd, flags.path ?? '.');
  const pathType = getPathType(resolvedPath);

  // Case 1: No path or project root directory — discover everything.
  if (pathType === 'directory' && !flags.path) {
    return {
      projectRoot: resolvedPath,
      dryRun: flags.dryRun,
      confirm: flags.confirm ?? false,
    };
  }

  // Case 2: Single file — infer project root, process just this file.
  if (pathType === 'file') {
    const inferred = inferProjectRoot(resolvedPath);
    const projectRoot = inferred ?? path.dirname(resolvedPath);
    return {
      projectRoot,
      dryRun: flags.dryRun,
      confirm: flags.confirm ?? false,
      files: [path.relative(projectRoot, resolvedPath)],
      inferredProjectRoot: inferred,
    };
  }

  // Case 3: Directory path — could be the project root or a subdirectory.
  // Try to infer whether this is a subdirectory of a project.
  const inferred = inferProjectRoot(resolvedPath);
  if (inferred && inferred !== resolvedPath) {
    // It's a subdirectory like app/components/ — scope discovery to it.
    return {
      projectRoot: inferred,
      dryRun: flags.dryRun,
      confirm: flags.confirm ?? false,
      targetDir: path.relative(inferred, resolvedPath),
      inferredProjectRoot: inferred,
    };
  }

  // It's the project root itself (or we can't tell — treat as root).
  return {
    projectRoot: resolvedPath,
    dryRun: flags.dryRun,
    confirm: flags.confirm ?? false,
  };
}

/**
 * Determines whether a path is a file, directory, or doesn't exist.
 * Falls back to checking the extension for paths that don't exist yet.
 */
function getPathType(p: string): 'file' | 'directory' {
  try {
    const stat = statSync(p);
    return stat.isFile() ? 'file' : 'directory';
  } catch {
    // Path doesn't exist — guess from extension.
    return TEMPLATE_EXTENSIONS.has(path.extname(p)) ? 'file' : 'directory';
  }
}
