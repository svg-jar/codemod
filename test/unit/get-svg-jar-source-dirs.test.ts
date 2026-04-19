import { describe, it, expect } from 'vitest';
import { getSvgJarSourceDirs } from '#lib/get-svg-jar-source-dirs.ts';
import { readScenarioFile } from '#test/helpers.ts';

describe('getSvgJarSourceDir', () => {
  it('should collect sourceDirs from svgJar config in ember-cli-build.js', () => {
    const options = getSvgJarSourceDirs(readScenarioFile('with-source-dirs', 'ember-cli-build.js'));

    expect(options.sourceDirs).toEqual(expect.arrayContaining(['public/images/icons', 'node_modules/some-library']));
    expect(options.sourceDirs).toHaveLength(2);
  });

  it('should return default sourceDirs if sourceDirs is not an array of strings', () => {
    const options = getSvgJarSourceDirs(readScenarioFile('invalid-source-dirs', 'ember-cli-build.js'));
    expect(options.sourceDirs).toEqual(['public']);
  });

  it('should return default sourceDirs if sourceDirs contains empty strings', () => {
    const options = getSvgJarSourceDirs(readScenarioFile('empty-string-source-dir', 'ember-cli-build.js'));
    expect(options.sourceDirs).toEqual(['public']);
  });

  it('should handle the case where svgJar config is missing entirely', () => {
    const options = getSvgJarSourceDirs(readScenarioFile('no-options', 'ember-cli-build.js'));
    expect(options.sourceDirs).toEqual(['public']);
  });

  it('should get source dirs from strategy-level config if present', () => {
    const options = getSvgJarSourceDirs(readScenarioFile('strategy-level-source-dirs', 'ember-cli-build.js'));
    expect(options.sourceDirs).toEqual([
      'node_modules/some-library',
      'public/images/icons',
      'node_modules/a-different-library',
      'public/images/symbols',
    ]);
  });
});
