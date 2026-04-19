import { describe, it, expect } from 'vitest';
import { removeSvgJarConfig } from '#lib/remove-svg-jar-config.ts';
import { readScenarioFile, snapshotPath } from '#test/helpers.ts';

describe('removeSvgJarConfig', () => {
  it('removes the svgJar property from a complete config', async () => {
    const output = removeSvgJarConfig(readScenarioFile('complete-config', 'ember-cli-build.js'));

    expect(output).not.toContain('svgJar');
    await expect(output).toMatchFileSnapshot(snapshotPath('remove-svg-jar-config', 'complete-config'));
  });

  it('removes the svgJar property from a simple sourceDirs config', async () => {
    const output = removeSvgJarConfig(readScenarioFile('with-source-dirs', 'ember-cli-build.js'));

    expect(output).not.toContain('svgJar');
    await expect(output).toMatchFileSnapshot(snapshotPath('remove-svg-jar-config', 'with-source-dirs'));
  });

  it('removes the svgJar property from a strategy-level config', async () => {
    const output = removeSvgJarConfig(readScenarioFile('strategy-level-source-dirs', 'ember-cli-build.js'));

    expect(output).not.toContain('svgJar');
    await expect(output).toMatchFileSnapshot(snapshotPath('remove-svg-jar-config', 'strategy-level-source-dirs'));
  });

  it('returns source unchanged when there is no svgJar config', async () => {
    const output = removeSvgJarConfig(readScenarioFile('no-options', 'ember-cli-build.js'));

    await expect(output).toMatchFileSnapshot(snapshotPath('remove-svg-jar-config', 'no-options'));
  });
});
