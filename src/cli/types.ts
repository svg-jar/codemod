import type { TransformResult } from '#src/codemod.ts';

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
   * this holds the inferred value so `runCli` can prompt the user to
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
