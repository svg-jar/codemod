import { getSvgJarSourceDirs } from '#lib/get-svg-jar-source-dirs.ts';
import { parseImportAliases, type ImportAlias } from '#lib/resolve-import-alias.ts';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'tinyglobby';

const DEFAULT_SOURCE_DIRS = ['public'];

/** File names to try when looking for the ember-cli-build config. */
const EMBER_CLI_BUILD_FILES = ['ember-cli-build.js', 'ember-cli-build.mjs', 'ember-cli-build.cjs'];

/**
 * Reads the ember-cli-build config file from the project root and extracts
 * the svgJar source directories. Tries `.js`, `.mjs`, and `.cjs` extensions.
 * Falls back to `['public']` when no config file is found or it contains no
 * svgJar config.
 *
 * @param projectRoot Absolute path to the Ember project root.
 *
 * @example
 *   readSourceDirs('/my-project')
 *   // → ['public/icons', 'vendor/icons']
 */
export function readSourceDirs(projectRoot: string): string[] {
  for (const fileName of EMBER_CLI_BUILD_FILES) {
    const filePath = path.join(projectRoot, fileName);
    try {
      const source = readFileSync(filePath, 'utf-8');
      return getSvgJarSourceDirs(source).sourceDirs;
    } catch {
      // File doesn't exist or can't be read — try the next extension.
    }
  }
  return DEFAULT_SOURCE_DIRS;
}

/**
 * Reads the project's `package.json` and extracts any `imports` field entries
 * that use wildcard patterns (e.g. `"#icons/*": "./public/icons/*"`).
 *
 * These aliases are used by the codemod to generate short import specifiers
 * instead of long relative paths when a matching alias exists.
 *
 * Returns an empty array when the file is missing, malformed, or has no
 * `imports` field.
 *
 * @param projectRoot Absolute path to the Ember project root.
 *
 * @example
 *   readImportAliases('/my-project')
 *   // → [{ alias: '#icons/*', targetPrefix: 'public/icons/' }]
 */
export function readImportAliases(projectRoot: string): ImportAlias[] {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
    if (packageJson.imports && typeof packageJson.imports === 'object') {
      return parseImportAliases(packageJson.imports as Record<string, string>);
    }
  } catch {
    // No package.json or malformed — no aliases to apply.
  }
  return [];
}

/**
 * Result of searching for an icon across source directories.
 */
export interface IconPathResult {
  /** The first matching path, used as the import path. */
  importPath: string;
  /**
   * All matching paths across source directories. When `allPaths.length > 1`,
   * the icon is ambiguous — it exists in multiple source directories.
   */
  allPaths: string[];
}

/**
 * Searches for an SVG file matching the given icon slug inside the provided
 * source directories. Returns the first match along with all matches (to
 * detect ambiguity), or `undefined` if the file is not found anywhere.
 *
 * Source directories are searched in order; the first match is used as the
 * import path. When the icon exists in multiple directories, all paths are
 * returned so the caller can warn the user.
 *
 * @param iconSlug    The icon identifier as used in `{{svgJar "icon-slug"}}`,
 *                    without the leading `#`. May contain slashes for nested
 *                    paths (e.g. `"nav/arrow"`).
 * @param sourceDirs  Array of directories to search, relative to projectRoot
 *                    (e.g. `["public", "vendor/icons"]`).
 * @param projectRoot Absolute path to the Ember project root.
 *
 * @example
 *   resolveIconPath('arrow', ['public', 'vendor'], '/my-project')
 *   // → { importPath: 'public/arrow.svg', allPaths: ['public/arrow.svg'] }
 *
 * @example
 *   // When the same icon exists in both directories:
 *   resolveIconPath('arrow', ['public', 'vendor'], '/my-project')
 *   // → { importPath: 'public/arrow.svg', allPaths: ['public/arrow.svg', 'vendor/arrow.svg'] }
 */
export function resolveIconPath(
  iconSlug: string,
  sourceDirs: string[],
  projectRoot: string,
): IconPathResult | undefined {
  const allPaths: string[] = [];

  for (const dir of sourceDirs) {
    const candidate = path.join(projectRoot, dir, `${iconSlug}.svg`);
    if (existsSync(candidate)) {
      allPaths.push(`${dir}/${iconSlug}.svg`);
    }
  }

  if (allPaths.length === 0) return undefined;

  return { importPath: allPaths[0], allPaths };
}

/**
 * Finds all Glimmer template files (`.gjs` and `.gts`) in a project.
 *
 * Searches the entire project tree (or a subdirectory if `targetDir` is
 * provided), excluding `node_modules/` and `dist/`. Glimmer components can
 * be imported from anywhere, so the search is not limited to conventional
 * directories like `app/components/`.
 *
 * Returns paths relative to the project root (e.g. `"app/components/banner.gts"`).
 *
 * @param projectRoot Absolute path to the project root.
 * @param targetDir   Optional subdirectory to scope the search to
 *                    (relative to projectRoot, e.g. `"app/components"`).
 *
 * @example
 *   findTemplateFiles('/my-project')
 *   // → ['app/components/banner.gts', 'app/templates/application.gts']
 *
 * @example
 *   findTemplateFiles('/my-project', 'app/components')
 *   // → ['app/components/banner.gts', 'app/components/sidebar.gjs']
 */
export function findTemplateFiles(projectRoot: string, targetDir?: string): string[] {
  const prefix = targetDir ? `${targetDir}/` : '';
  const pattern = `${prefix}**/*.{gjs,gts}`;
  const matches = globSync(pattern, {
    cwd: projectRoot,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  return matches.map((match) => path.normalize(match));
}
