import type { UsedIcon } from '#lib/resolve-icon-names.ts';
import { applyImportAlias, type ImportAlias } from '#lib/resolve-import-alias.ts';
import path from 'node:path';

/**
 * Builds the import path for an icon component.
 *
 * If the project's package.json defines an `imports` alias that matches the
 * icon's resolved path, the alias is used (e.g. `"#icons/arrow.svg"`).
 * Otherwise, a relative path from the file being transformed is computed
 * (e.g. `"../../public/icons/arrow.svg"`).
 *
 * Inline icons append `?unsafe-inline` to opt into SVG markup injection.
 * Sprite icons use a plain path since they reference a `<symbol>` in a
 * sprite sheet.
 *
 * @param icon           The resolved icon with its import path.
 * @param filePath       Path of the file being transformed, relative to the project root.
 * @param importAliases  Parsed import aliases from the project's package.json.
 */
export function buildIconImportPath(icon: UsedIcon, filePath: string, importAliases: ImportAlias[]): string {
  const suffix = icon.type === 'inline' ? '?unsafe-inline' : '';

  // Try to match a package.json import alias first.
  const aliased = applyImportAlias(icon.importPath, importAliases);
  if (aliased) {
    return `${aliased}${suffix}`;
  }

  // Fall back to a relative path from the file being transformed.
  let relativePath = path.relative(path.dirname(filePath), icon.importPath);
  // Ensure the path starts with ./ or ../ so it's treated as a relative import.
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }
  return `${relativePath}${suffix}`;
}
