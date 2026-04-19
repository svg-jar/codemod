import { describe, it, expect } from 'vitest';
import { parseImportAliases, applyImportAlias } from '#lib/resolve-import-alias.ts';

describe('parseImportAliases', () => {
  it('parses wildcard patterns from package.json imports', () => {
    const aliases = parseImportAliases({
      '#icons/*': './public/icons/*',
      '#lib/*': './lib/*',
    });

    expect(aliases).toEqual([
      { alias: '#icons/*', targetPrefix: 'public/icons/' },
      { alias: '#lib/*', targetPrefix: 'lib/' },
    ]);
  });

  it('ignores non-wildcard patterns', () => {
    const aliases = parseImportAliases({
      '#config': './config.json',
      '#icons/*': './public/icons/*',
    });

    expect(aliases).toHaveLength(1);
    expect(aliases[0].alias).toBe('#icons/*');
  });

  it('sorts by longest prefix first', () => {
    const aliases = parseImportAliases({
      '#public/*': './public/*',
      '#public-icons/*': './public/icons/*',
    });

    expect(aliases[0].targetPrefix).toBe('public/icons/');
    expect(aliases[1].targetPrefix).toBe('public/');
  });

  it('returns empty array for empty input', () => {
    expect(parseImportAliases({})).toEqual([]);
  });
});

describe('applyImportAlias', () => {
  const aliases = parseImportAliases({
    '#icons/*': './public/icons/*',
    '#vendor/*': './vendor/*',
  });

  it('rewrites a path matching an alias prefix', () => {
    expect(applyImportAlias('public/icons/arrow.svg', aliases)).toBe('#icons/arrow.svg');
  });

  it('preserves subdirectory structure in the remainder', () => {
    expect(applyImportAlias('public/icons/nav/arrow.svg', aliases)).toBe('#icons/nav/arrow.svg');
  });

  it('matches a different alias', () => {
    expect(applyImportAlias('vendor/star.svg', aliases)).toBe('#vendor/star.svg');
  });

  it('returns undefined when no alias matches', () => {
    expect(applyImportAlias('lib/utils.ts', aliases)).toBeUndefined();
  });

  it('picks the most specific alias when multiple match', () => {
    const overlapping = parseImportAliases({
      '#public/*': './public/*',
      '#public-icons/*': './public/icons/*',
    });

    expect(applyImportAlias('public/icons/arrow.svg', overlapping)).toBe('#public-icons/arrow.svg');
  });
});
