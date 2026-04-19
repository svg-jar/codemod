import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Absolute path to test/_scenarios/ */
export const SCENARIOS_DIR = path.join(import.meta.dirname, '_scenarios');

/** Absolute path to test/_snapshots/ */
export const SNAPSHOTS_DIR = path.join(import.meta.dirname, '_snapshots');

/** Absolute path to test/_fixtures/ */
export const FIXTURES_DIR = path.join(import.meta.dirname, '_fixtures');

/**
 * Reads and returns a file from within a named scenario directory.
 *
 * @example readScenarioFile('with-source-dirs', 'ember-cli-build.js')
 */
export function readScenarioFile(scenarioName: string, filePath: string): string {
  return readFileSync(path.join(SCENARIOS_DIR, scenarioName, filePath), 'utf-8');
}

/**
 * Returns the absolute path to a snapshot file inside a named subdirectory of
 * test/_snapshots/.
 *
 * @example snapshotPath('remove-svg-jar-config', 'complete-config') → '.../test/_snapshots/remove-svg-jar-config/complete-config.js'
 */
export function snapshotPath(group: string, name: string): string {
  return path.join(SNAPSHOTS_DIR, group, `${name}.js`);
}

/**
 * Reads and returns the source of a fixture file from test/_fixtures/.
 *
 * @example readFixture('class-backed.gjs') → contents of that fixture file
 */
export function readFixture(fileName: string): string {
  return readFileSync(path.join(FIXTURES_DIR, fileName), 'utf-8');
}
