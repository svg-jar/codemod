import pc from 'picocolors';
import type { FileResult } from '#cli/resolve-config.ts';

/**
 * Formats the results of the codemod run into an ESLint-style report string.
 *
 * Each file with diagnostics (unresolved or ambiguous icons) gets a section
 * with the file path as a header and indented messages beneath it.
 *
 * Files with no issues are not shown. A summary line at the end shows totals.
 *
 * @example
 *   app/components/banner.gts
 *     5:2  warning  "missing-icon" not found in any source directory        unresolved
 *     8:2  warning  "arrow" found in multiple source directories            ambiguous
 *                   - public/icons/arrow.svg
 *                   - vendor/icons/arrow.svg
 *
 *   2 warnings
 */
export function formatReport(results: FileResult[], useColor: boolean = true): string {
  const c = useColor ? pc : noColor;
  const lines: string[] = [];
  let totalUnresolved = 0;
  let totalAmbiguous = 0;
  let filesChanged = 0;

  for (const { filePath, changed, result } of results) {
    if (changed) filesChanged++;

    const hasIssues = result.unresolvedIcons.length > 0 || result.ambiguousIcons.length > 0;
    if (!hasIssues) continue;

    lines.push('');
    lines.push(c.underline(filePath));

    for (const icon of result.unresolvedIcons) {
      totalUnresolved++;
      const loc = formatLoc(icon.location, filePath);
      lines.push(
        `  ${c.dim(loc)}  ${c.yellow('warning')}  ${c.bold(`"${icon.slug}"`)} not found in any source directory`,
      );
    }

    for (const icon of result.ambiguousIcons) {
      totalAmbiguous++;
      const loc = formatLoc(icon.location, filePath);
      lines.push(
        `  ${c.dim(loc)}  ${c.yellow('warning')}  ${c.bold(`"${icon.slug}"`)} found in multiple source directories`,
      );
      for (const p of icon.paths) {
        lines.push(`  ${c.dim(' '.repeat(loc.length))}           - ${p}`);
      }
    }
  }

  // Summary
  const totalWarnings = totalUnresolved + totalAmbiguous;
  lines.push('');

  if (totalWarnings > 0) {
    const parts: string[] = [];
    if (totalUnresolved > 0) parts.push(`${totalUnresolved} unresolved`);
    if (totalAmbiguous > 0) parts.push(`${totalAmbiguous} ambiguous`);
    lines.push(c.yellow(`${totalWarnings} ${totalWarnings === 1 ? 'warning' : 'warnings'} (${parts.join(', ')})`));
  }

  lines.push(`${filesChanged} ${filesChanged === 1 ? 'file' : 'files'} changed out of ${results.length} scanned`);

  return lines.join('\n');
}

/**
 * Extracts just the line:column portion from a location string.
 * Locations are stored as "filePath:line", so we strip the filePath prefix.
 */
function formatLoc(location: string, filePath: string): string {
  if (location.startsWith(filePath + ':')) {
    return location.slice(filePath.length + 1);
  }
  return location;
}

/** No-op color functions for non-color output. */
const noColor = {
  underline: (s: string) => s,
  dim: (s: string) => s,
  yellow: (s: string) => s,
  bold: (s: string) => s,
};
