import { z, type ASTNode } from 'zmod';
import { emberParser } from 'zmod-ember';
import type { ImportAlias } from '#lib/resolve-import-alias.ts';
import { readImportAliases, readSourceDirs } from '#lib/file-system.ts';
import { resolveIconNames, type AmbiguousIconRef, type UnresolvedIconRef } from '#lib/resolve-icon-names.ts';
export type { AmbiguousIconRef, UnresolvedIconRef } from '#lib/resolve-icon-names.ts';
import { replaceMustachesWithComponents, addIconImports } from '#lib/replace-mustaches.ts';

const j = z.withParser(emberParser);

/**
 * Options for the convenience `run` function. Only `projectRoot` is required;
 * source directories and import aliases are read from disk automatically.
 */
export interface Options {
  /** Absolute path to the Ember project root. */
  projectRoot: string;
}

/**
 * Options for `transform`. All project-level configuration is pre-computed
 * and passed in, so the transform itself does no filesystem I/O.
 */
export interface TransformOptions extends Options {
  /** svgJar source directories (e.g. `['public', 'vendor/icons']`). */
  sourceDirs: string[];
  /** Parsed import aliases from the project's package.json. */
  importAliases: ImportAlias[];
}

/**
 * Result of transforming a single file.
 */
export interface TransformResult {
  /** The transformed source text. */
  output: string;
  /** Icon usages that could not be found in any source directory, with file location. */
  unresolvedIcons: UnresolvedIconRef[];
  /**
   * Icon usages found in multiple source directories, with file location and
   * all matching paths. The first match is used for the import, but these
   * should be reported to the user for review.
   */
  ambiguousIcons: AmbiguousIconRef[];
}

/**
 * Transforms a single .gjs/.gts file, migrating all `ember-svg-jar` usage to
 * direct SVG component imports.
 *
 * This is the core transform function. It performs no filesystem I/O beyond
 * resolving icon paths — all project-level configuration (source directories,
 * import aliases) must be pre-computed and passed via `options`.
 *
 * Steps performed:
 *   1. Parse the file with the Glimmer-aware ember parser.
 *   2. Pre-scan all `{{svgJar "..."}}` calls, resolve each icon to an actual
 *      SVG file on disk, and resolve any name conflicts.
 *   3. Replace resolved mustaches with angle-bracket component tags. Icons
 *      that cannot be found on disk are left unchanged.
 *   4. Remove the `ember-svg-jar` import declaration (only when all icons
 *      in the file were resolved).
 *   5. Add a new import for each resolved icon component.
 *
 * @param source   Raw source text of the file.
 * @param filePath Path to the file, relative to the project root.
 * @param options  Pre-computed project configuration.
 */
export function transform(source: string, filePath: string, options: TransformOptions): TransformResult {
  const { projectRoot, sourceDirs, importAliases } = options;
  const root = j(source, { filePath });

  const svgJarImport = root.find(j.ImportDeclaration, { source: { value: 'ember-svg-jar/helpers/svg-jar' } });

  // Read the local identifier from the import when present (typically "svgJar",
  // but could be any alias the user chose). Fall back to "svgJar" when there is
  // no import declaration — e.g. template-only files that rely on the helper
  // being in scope without an explicit import.
  const importSpecifier = svgJarImport.find(j.ImportDefaultSpecifier);
  const localNode = importSpecifier.length > 0 ? (importSpecifier.get().node.local as ASTNode) : undefined;
  const identifier: string = localNode?.type === 'Identifier' ? String(localNode.name) : 'svgJar';

  const svgJarUsages = root.find('GlimmerMustacheStatement', {
    path: { original: identifier },
  });

  // If there are no svgJar usages, return the source unchanged to avoid any
  // parser-induced whitespace differences.
  if (svgJarUsages.length === 0) {
    return { output: source, unresolvedIcons: [], ambiguousIcons: [] };
  }

  // Pre-scan: resolve each icon to a file on disk and handle name conflicts.
  const {
    resolved: resolvedIcons,
    unresolved: unresolvedIcons,
    ambiguous: ambiguousIcons,
  } = resolveIconNames(svgJarUsages, sourceDirs, projectRoot, filePath);

  replaceMustachesWithComponents(svgJarUsages, resolvedIcons, source);

  // Only remove the svgJar import when every icon in the file was resolved.
  // If some icons could not be found, the import must stay because unresolved
  // mustaches still reference the svgJar helper.
  if (svgJarImport.length > 0 && unresolvedIcons.length === 0) {
    svgJarImport.remove();
  }

  addIconImports(root, resolvedIcons, filePath, importAliases);

  return { output: root.toSource(), unresolvedIcons, ambiguousIcons };
}

/**
 * Convenience function that reads project configuration from disk and
 * transforms a single file.
 *
 * Reads `ember-cli-build.js` for svgJar source directories and `package.json`
 * for import aliases, then delegates to `transform()`.
 *
 * @param source   Raw source text of the file.
 * @param filePath Path to the file, relative to the project root.
 * @param options  Must include `projectRoot`.
 */
export function run(source: string, filePath: string, options: Options): TransformResult {
  const { projectRoot } = options;

  return transform(source, filePath, {
    projectRoot,
    sourceDirs: readSourceDirs(projectRoot),
    importAliases: readImportAliases(projectRoot),
  });
}
