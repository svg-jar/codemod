export type IconType = 'inline' | 'sprite';

/**
 * Converts a kebab-case string to PascalCase.
 * Used to derive a component name from an icon slug.
 *
 * @example "one-icon" → "OneIcon"
 */
export function toPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (match) => match.replace(/-/, '').toUpperCase());
}

/**
 * Extracts the filename (without extension) from an icon slug that may
 * contain directory separators.
 *
 * @example "nav/arrow" → "arrow"
 * @example "one-icon"  → "one-icon"
 */
export function iconBaseName(iconSlug: string): string {
  const lastSlash = iconSlug.lastIndexOf('/');
  return lastSlash === -1 ? iconSlug : iconSlug.slice(lastSlash + 1);
}

/**
 * Determines whether an icon is inline SVG or a sprite reference.
 * ember-svg-jar uses a leading "#" to denote sprite icons.
 *
 * @example "one-icon"     → 'inline'
 * @example "#sprite-icon" → 'sprite'
 */
export function determineIconType(rawIconName: string): IconType {
  return rawIconName.startsWith('#') ? 'sprite' : 'inline';
}
