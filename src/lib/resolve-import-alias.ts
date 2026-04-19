/**
 * Represents a single import alias mapping from the `imports` field in
 * package.json. Only wildcard (`*`) patterns are supported — exact mappings
 * are ignored since they don't apply to arbitrary icon paths.
 *
 * @example { alias: '#icons/*', targetPrefix: 'public/icons/' }
 */
export interface ImportAlias {
  /** The full alias pattern, e.g. `"#icons/*"`. */
  alias: string;
  /**
   * The directory prefix that the alias maps to, with the leading `./`
   * stripped and a trailing `/` ensured, e.g. `"public/icons/"`.
   */
  targetPrefix: string;
}

/**
 * Parses the `imports` field from a package.json object into a sorted list of
 * alias mappings. Only `"#…/*": "./…/*"` patterns are included — the
 * wildcard must appear at the end of both key and value.
 *
 * The returned list is sorted longest `targetPrefix` first so that the most
 * specific alias wins when multiple patterns match.
 *
 * @param imports The raw `imports` object from package.json.
 *
 * @example
 *   parseImportAliases({ '#icons/*': './public/icons/*', '#lib/*': './lib/*' })
 *   // → [{ alias: '#icons/*', targetPrefix: 'public/icons/' },
 *   //    { alias: '#lib/*',   targetPrefix: 'lib/' }]
 */
export function parseImportAliases(imports: Record<string, string>): ImportAlias[] {
  const aliases: ImportAlias[] = [];

  for (const [key, value] of Object.entries(imports)) {
    // Only handle wildcard patterns: "#prefix/*" → "./dir/*"
    if (!key.endsWith('/*') || typeof value !== 'string' || !value.endsWith('/*')) {
      continue;
    }

    // Strip leading "./" from the target and replace trailing "/*" with "/".
    const targetPrefix = value.replace(/^\.\//, '').replace(/\/\*$/, '/');
    aliases.push({ alias: key, targetPrefix });
  }

  // Sort longest prefix first so the most specific match wins.
  aliases.sort((a, b) => b.targetPrefix.length - a.targetPrefix.length);

  return aliases;
}

/**
 * Attempts to rewrite a resolved import path using a matching package.json
 * import alias. Returns the aliased path if a match is found, or `undefined`
 * if no alias applies.
 *
 * @param importPath The resolved icon path relative to the project root,
 *                   e.g. `"public/icons/arrow.svg"`.
 * @param aliases    Parsed import aliases from `parseImportAliases`.
 * @returns          The aliased import path (e.g. `"#icons/arrow.svg"`) or
 *                   `undefined` if no alias matches.
 *
 * @example
 *   const aliases = parseImportAliases({ '#icons/*': './public/icons/*' });
 *   applyImportAlias('public/icons/arrow.svg', aliases);
 *   // → '#icons/arrow.svg'
 *
 * @example
 *   applyImportAlias('vendor/icons/arrow.svg', aliases);
 *   // → undefined  (no matching alias)
 */
export function applyImportAlias(importPath: string, aliases: ImportAlias[]): string | undefined {
  for (const { alias, targetPrefix } of aliases) {
    if (importPath.startsWith(targetPrefix)) {
      const remainder = importPath.slice(targetPrefix.length);
      const aliasPrefix = alias.replace(/\/\*$/, '/');
      return `${aliasPrefix}${remainder}`;
    }
  }
  return undefined;
}
