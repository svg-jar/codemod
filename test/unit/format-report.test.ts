import { describe, it, expect } from 'vitest';
import { formatReport } from '#cli/format-report.ts';
import type { FileResult } from '#cli/types.ts';

describe('formatReport', () => {
  it('reports unresolved icons with location', () => {
    const results: FileResult[] = [
      {
        filePath: 'app/components/banner.gts',
        changed: false,
        result: {
          output: '',
          unresolvedIcons: [{ location: 'app/components/banner.gts:5', slug: 'missing-icon' }],
          ambiguousIcons: [],
        },
      },
    ];

    const report = formatReport(results, false);
    expect(report).toContain('app/components/banner.gts');
    expect(report).toContain('5');
    expect(report).toContain('"missing-icon"');
    expect(report).toContain('not found');
    expect(report).toContain('1 warning');
    expect(report).toContain('1 unresolved');
  });

  it('reports ambiguous icons with all paths', () => {
    const results: FileResult[] = [
      {
        filePath: 'app/components/sidebar.gjs',
        changed: true,
        result: {
          output: '',
          unresolvedIcons: [],
          ambiguousIcons: [
            {
              location: 'app/components/sidebar.gjs:10',
              slug: 'arrow',
              paths: ['public/icons/arrow.svg', 'vendor/icons/arrow.svg'],
            },
          ],
        },
      },
    ];

    const report = formatReport(results, false);
    expect(report).toContain('app/components/sidebar.gjs');
    expect(report).toContain('"arrow"');
    expect(report).toContain('multiple source directories');
    expect(report).toContain('public/icons/arrow.svg');
    expect(report).toContain('vendor/icons/arrow.svg');
    expect(report).toContain('1 ambiguous');
  });

  it('shows file change summary', () => {
    const results: FileResult[] = [
      {
        filePath: 'app/components/a.gts',
        changed: true,
        result: { output: '', unresolvedIcons: [], ambiguousIcons: [] },
      },
      {
        filePath: 'app/components/b.gts',
        changed: false,
        result: { output: '', unresolvedIcons: [], ambiguousIcons: [] },
      },
      {
        filePath: 'app/components/c.gts',
        changed: true,
        result: { output: '', unresolvedIcons: [], ambiguousIcons: [] },
      },
    ];

    const report = formatReport(results, false);
    expect(report).toContain('2 files changed out of 3 scanned');
  });

  it('omits files with no issues from the output', () => {
    const results: FileResult[] = [
      {
        filePath: 'app/components/clean.gts',
        changed: true,
        result: { output: '', unresolvedIcons: [], ambiguousIcons: [] },
      },
    ];

    const report = formatReport(results, false);
    expect(report).not.toContain('app/components/clean.gts');
  });

  it('handles empty results', () => {
    const report = formatReport([], false);
    expect(report).toContain('0 files changed out of 0 scanned');
  });

  it('combines unresolved and ambiguous warnings in summary', () => {
    const results: FileResult[] = [
      {
        filePath: 'app/components/mixed.gts',
        changed: false,
        result: {
          output: '',
          unresolvedIcons: [{ location: 'app/components/mixed.gts:1', slug: 'a' }],
          ambiguousIcons: [{ location: 'app/components/mixed.gts:2', slug: 'b', paths: ['x.svg', 'y.svg'] }],
        },
      },
    ];

    const report = formatReport(results, false);
    expect(report).toContain('2 warnings (1 unresolved, 1 ambiguous)');
  });
});
