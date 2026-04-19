import { resolveIconPath } from '#lib/file-system.ts';
import type { GlimmerMustacheStatement } from '#types/glimmer-types.ts';
import { extractRawIconName } from '#utils/glimmer.ts';
import { determineIconType, iconBaseName, toPascalCase, type IconType } from '#utils/icon-names.ts';
import type { FilteredCollection, NodePath } from 'zmod';

/**
 * A reference to a specific icon usage in a source file, including its
 * location for diagnostic reporting.
 */
export interface UnresolvedIconRef {
  /** File path, line, and column, e.g. "app/components/banner.gts:34:12". */
  location: string;
  /** The icon slug that could not be resolved. */
  slug: string;
}

/**
 * An icon that was found in multiple source directories.
 */
export interface AmbiguousIconRef {
  /** File path, line, and column, e.g. "app/components/banner.gts:34:12". */
  location: string;
  /** The icon slug. */
  slug: string;
  /** All paths where the icon was found. */
  paths: string[];
}

/**
 * A composite key that uniquely identifies an icon by both its slug and type.
 * This allows the same slug used as both inline and sprite to be tracked
 * as two distinct entries.
 *
 * @example "icon-name:inline" | "icon-name:sprite"
 */
export type IconKey = `${string}:${IconType}`;

export interface UsedIcon {
  /** PascalCase component name derived from the icon slug, e.g. "OneIcon" */
  componentName: string;
  /** Kebab-case icon slug with the leading # stripped, e.g. "one-icon" */
  iconSlug: string;
  /** Whether the icon is rendered inline (SVG markup) or as a sprite (<use>) */
  type: IconType;
  /** Resolved import path relative to the project root, e.g. "public/icons/one-icon.svg" */
  importPath: string;
}

/**
 * Result of the pre-scan phase: resolved icons, unresolved icons, and
 * ambiguous icons found in multiple source directories.
 */
export interface ResolveResult {
  /** Icons that were successfully resolved to a file on disk. */
  resolved: Map<IconKey, UsedIcon>;
  /** References to icon usages that could not be found in any source directory. */
  unresolved: UnresolvedIconRef[];
  /** References to icon usages found in multiple source directories. */
  ambiguous: AmbiguousIconRef[];
}

/**
 * Formats a file path, line number, and column into a location string.
 *
 * @example formatLocation('app/components/banner.gts', 34, 12) → 'app/components/banner.gts:34:12'
 */
function formatLocation(filePath: string, line: number | undefined, column: number | undefined): string {
  if (line == null) return filePath;
  if (column == null) return `${filePath}:${line}`;
  return `${filePath}:${line}:${column}`;
}

/**
 * Pre-scans all svgJar mustache calls to collect the full set of (slug, type)
 * pairs used in the file, resolves each to an actual SVG file on disk, then
 * resolves any name conflicts.
 *
 * Icons that cannot be found in any source directory are collected in
 * `unresolved` with their file location so the caller can report them.
 *
 * Icons found in multiple source directories are collected in `ambiguous`.
 * The first match is used for the import, but the caller should warn the user.
 *
 * Conflict rule: when the same slug appears as both inline and sprite, the
 * sprite gets the plain PascalCase name (e.g. "IconName") and the inline
 * variant gets an "Inline" suffix (e.g. "IconNameInline").
 */
export function resolveIconNames(
  svgJarUsages: FilteredCollection,
  sourceDirs: string[],
  projectRoot: string,
  filePath: string,
): ResolveResult {
  const resolved = new Map<IconKey, UsedIcon>();
  const unresolved: UnresolvedIconRef[] = [];
  const ambiguous: AmbiguousIconRef[] = [];
  const seenSlugs = new Set<string>();

  svgJarUsages.forEach((nodePath: NodePath) => {
    const node = nodePath.node as GlimmerMustacheStatement;
    const rawName = extractRawIconName(node.params[0]);
    if (!rawName) return;

    const iconSlug = rawName.replace(/^#/, '');
    const type = determineIconType(rawName);
    const key: IconKey = `${iconSlug}:${type}`;
    const line = node.loc?.start.line;
    const column = node.loc?.start.column;
    const location = formatLocation(filePath, line, column);

    if (resolved.has(key)) return;

    const result = resolveIconPath(iconSlug, sourceDirs, projectRoot);
    if (!result) {
      unresolved.push({ location, slug: iconSlug });
      return;
    }

    if (result.allPaths.length > 1 && !seenSlugs.has(iconSlug)) {
      ambiguous.push({ location, slug: iconSlug, paths: result.allPaths });
    }
    seenSlugs.add(iconSlug);

    // Derive the component name from the filename portion of the slug,
    // not the full path — "nav/arrow" → "Arrow", not "Nav/arrow".
    const baseName = iconBaseName(iconSlug);
    const componentName = toPascalCase(baseName);

    resolved.set(key, { componentName, iconSlug, type, importPath: result.importPath });
  });

  // Detect conflicts: same slug appearing as both inline and sprite.
  // When a conflict exists, the sprite keeps the plain name and the inline
  // variant is suffixed with "Inline".
  for (const [key, icon] of resolved) {
    if (icon.type === 'inline') {
      const spriteKey: IconKey = `${icon.iconSlug}:sprite`;
      if (resolved.has(spriteKey)) {
        resolved.set(key, { ...icon, componentName: `${icon.componentName}Inline` });
      }
    }
  }

  return { resolved, unresolved, ambiguous };
}
