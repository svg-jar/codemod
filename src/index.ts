// Core transform functions
export { transform, run } from '#src/codemod.ts';
export { removeSvgJarConfig } from '#lib/remove-svg-jar-config.ts';

// Options and result types
export type { Options, TransformOptions, TransformResult } from '#src/codemod.ts';
export type { UnresolvedIconRef, AmbiguousIconRef } from '#lib/resolve-icon-names.ts';

// Project configuration helpers — useful when building a custom pipeline
// around transform() rather than using the run() convenience function
export { readSourceDirs, readImportAliases, findTemplateFiles } from '#lib/file-system.ts';
export { parseImportAliases, applyImportAlias } from '#lib/resolve-import-alias.ts';
export type { ImportAlias } from '#lib/resolve-import-alias.ts';
export type { IconType } from '#utils/icon-names.ts';
