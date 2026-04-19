import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import { SCENARIOS_DIR } from '#test/helpers.ts';

const FULL_PROJECT_DIR = path.join(SCENARIOS_DIR, 'full-project');
const CLI_PATH = path.join(import.meta.dirname, '..', 'src', 'cli.ts');

/**
 * Runs the CLI as a subprocess via tsx, the same way a user would.
 * Uses tsx instead of node --experimental-strip-types for Node 20 compat.
 */
function runCli(args: string[]) {
  return execa('tsx', [CLI_PATH, ...args], { reject: false });
}

describe('CLI integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'svg-jar-codemod-'));
    cpSync(FULL_PROJECT_DIR, tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('dry-run mode', () => {
    it('does not modify any files', async () => {
      const navbarBefore = readFileSync(path.join(tmpDir, 'app/components/navbar.gjs'), 'utf-8');

      await runCli(['--dry-run', tmpDir]);

      const navbarAfter = readFileSync(path.join(tmpDir, 'app/components/navbar.gjs'), 'utf-8');
      expect(navbarAfter).toBe(navbarBefore);
    });

    it('reports files that would change in stdout', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.stdout).toContain('would change');
      expect(result.stdout).toContain('navbar.gjs');
      expect(result.stdout).toContain('sidebar.gts');
    });

    it('reports unchanged files', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.stdout).toContain('footer.gjs');
      expect(result.stdout).toContain('no changes');
    });

    it('exits with code 0', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('normal mode', () => {
    it('writes transformed files to disk', async () => {
      await runCli([tmpDir]);

      const navbar = readFileSync(path.join(tmpDir, 'app/components/navbar.gjs'), 'utf-8');
      expect(navbar).toContain('<Menu');
      expect(navbar).toContain('<Search');
      expect(navbar).toContain('<User');
      expect(navbar).not.toContain('{{svgJar');
    });

    it('transforms TypeScript components', async () => {
      await runCli([tmpDir]);

      const sidebar = readFileSync(path.join(tmpDir, 'app/components/sidebar.gts'), 'utf-8');
      expect(sidebar).toContain('<ChevronRight');
      expect(sidebar).toContain('<ChevronLeft');
      expect(sidebar).toContain('<Settings');
      expect(sidebar).not.toContain('{{svgJar');
    });

    it('transforms nested component directories', async () => {
      await runCli([tmpDir]);

      const button = readFileSync(path.join(tmpDir, 'app/components/ui/button.gjs'), 'utf-8');
      expect(button).toContain('<ArrowRight');
      expect(button).not.toContain('{{svgJar');
    });

    it('transforms deeply nested icon paths', async () => {
      await runCli([tmpDir]);

      const dataTable = readFileSync(path.join(tmpDir, 'app/components/data-table.gts'), 'utf-8');
      expect(dataTable).toContain('<Edit');
      expect(dataTable).toContain('<Delete');
      expect(dataTable).toContain('<ChevronUp');
      expect(dataTable).not.toContain('{{svgJar');
    });

    it('handles inline and sprite icons in the same file', async () => {
      await runCli([tmpDir]);

      const favorite = readFileSync(path.join(tmpDir, 'app/components/icons/favorite-button.gjs'), 'utf-8');
      expect(favorite).toContain('<Heart');
      expect(favorite).toContain('<Star');
      expect(favorite).not.toContain('{{svgJar');
    });

    it('transforms route templates', async () => {
      await runCli([tmpDir]);

      const application = readFileSync(path.join(tmpDir, 'app/templates/application.gjs'), 'utf-8');
      expect(application).toContain('<ArrowLeft');
      expect(application).not.toContain('{{svgJar');
    });

    it('transforms nested route templates', async () => {
      await runCli([tmpDir]);

      const settings = readFileSync(path.join(tmpDir, 'app/templates/settings/index.gts'), 'utf-8');
      expect(settings).toContain('<Settings');
      expect(settings).toContain('<User');
      expect(settings).toContain('<Edit');
      expect(settings).not.toContain('{{svgJar');
    });

    it('does not modify files without svgJar usage', async () => {
      const footerBefore = readFileSync(path.join(tmpDir, 'app/components/footer.gjs'), 'utf-8');

      await runCli([tmpDir]);

      const footerAfter = readFileSync(path.join(tmpDir, 'app/components/footer.gjs'), 'utf-8');
      expect(footerAfter).toBe(footerBefore);
    });

    it('adds correct relative import paths', async () => {
      await runCli([tmpDir]);

      const navbar = readFileSync(path.join(tmpDir, 'app/components/navbar.gjs'), 'utf-8');
      expect(navbar).toContain("from '../../public/icons/menu.svg?unsafe-inline'");

      const settings = readFileSync(path.join(tmpDir, 'app/templates/settings/index.gts'), 'utf-8');
      expect(settings).toContain("from '../../../public/icons/settings.svg?unsafe-inline'");
    });
  });

  describe('unresolved icons', () => {
    it('reports unresolved icons in stdout', async () => {
      const result = await runCli([tmpDir]);

      expect(result.stdout).toContain('nonexistent-icon');
      expect(result.stdout).toContain('not found');
    });

    it('leaves unresolved mustaches in place', async () => {
      await runCli([tmpDir]);

      const broken = readFileSync(path.join(tmpDir, 'app/components/broken-component.gjs'), 'utf-8');
      expect(broken).toContain('{{svgJar "nonexistent-icon"}}');
    });

    it('still transforms resolvable icons in the same file', async () => {
      await runCli([tmpDir]);

      const broken = readFileSync(path.join(tmpDir, 'app/components/broken-component.gjs'), 'utf-8');
      expect(broken).toContain('<Close');
    });

    it('keeps the svgJar import when some icons are unresolved', async () => {
      await runCli([tmpDir]);

      const broken = readFileSync(path.join(tmpDir, 'app/components/broken-component.gjs'), 'utf-8');
      expect(broken).toContain("import svgJar from 'ember-svg-jar/helpers/svg-jar'");
    });
  });

  describe('output format', () => {
    it('shows the banner', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.stdout).toContain('svg-jar/codemod');
    });

    it('reports source directories', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.stdout).toContain('public/icons');
    });

    it('reports the number of files found', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.stdout).toContain('10 files');
    });

    it('shows a summary at the end', async () => {
      const result = await runCli(['--dry-run', tmpDir]);

      expect(result.stdout).toContain('files changed');
      expect(result.stdout).toContain('scanned');
    });
  });

  describe('single file path', () => {
    it('transforms only the specified file', async () => {
      const filePath = path.join(tmpDir, 'app/components/navbar.gjs');
      await runCli([filePath]);

      const navbar = readFileSync(filePath, 'utf-8');
      expect(navbar).toContain('<Menu');
      expect(navbar).not.toContain('{{svgJar');
    });

    it('does not transform other files', async () => {
      const sidebarBefore = readFileSync(path.join(tmpDir, 'app/components/sidebar.gts'), 'utf-8');

      const filePath = path.join(tmpDir, 'app/components/navbar.gjs');
      await runCli([filePath]);

      const sidebarAfter = readFileSync(path.join(tmpDir, 'app/components/sidebar.gts'), 'utf-8');
      expect(sidebarAfter).toBe(sidebarBefore);
    });

    it('reports processing 1 file', async () => {
      const filePath = path.join(tmpDir, 'app/components/navbar.gjs');
      const result = await runCli(['--dry-run', filePath]);

      expect(result.stdout).toContain('1 file');
    });
  });

  describe('--clean-config', () => {
    it('removes the svgJar config from ember-cli-build.mjs after a clean migration', async () => {
      // Remove broken-component so there are no unresolved icons.
      rmSync(path.join(tmpDir, 'app/components/broken-component.gjs'));

      await runCli([tmpDir, '--clean-config']);

      const buildFile = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');
      expect(buildFile).not.toContain('svgJar');
    });

    it('does not remove the config in dry-run mode', async () => {
      rmSync(path.join(tmpDir, 'app/components/broken-component.gjs'));
      const buildFileBefore = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');

      await runCli([tmpDir, '--dry-run', '--clean-config']);

      const buildFileAfter = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');
      expect(buildFileAfter).toBe(buildFileBefore);
    });

    it('reports that it would remove the config in dry-run mode', async () => {
      rmSync(path.join(tmpDir, 'app/components/broken-component.gjs'));

      const result = await runCli([tmpDir, '--dry-run', '--clean-config']);

      expect(result.stdout).toContain('ember-cli-build.mjs');
      expect(result.stdout).toContain('dry run');
    });

    it('does not remove the config when there are unresolved icons', async () => {
      const buildFileBefore = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');

      await runCli([tmpDir, '--clean-config']);

      const buildFileAfter = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');
      expect(buildFileAfter).toBe(buildFileBefore);
    });

    it('warns when there are unresolved icons', async () => {
      const result = await runCli([tmpDir, '--clean-config']);

      expect(result.stdout).toContain('could not be resolved');
    });

    it('does not remove the config when scoped to a single file', async () => {
      rmSync(path.join(tmpDir, 'app/components/broken-component.gjs'));
      const buildFileBefore = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');

      const filePath = path.join(tmpDir, 'app/components/navbar.gjs');
      await runCli([filePath, '--clean-config']);

      const buildFileAfter = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');
      expect(buildFileAfter).toBe(buildFileBefore);
    });

    it('does not remove the config when scoped to a subdirectory', async () => {
      rmSync(path.join(tmpDir, 'app/components/broken-component.gjs'));
      const buildFileBefore = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');

      const dirPath = path.join(tmpDir, 'app/templates');
      await runCli([dirPath, '--clean-config']);

      const buildFileAfter = readFileSync(path.join(tmpDir, 'ember-cli-build.mjs'), 'utf-8');
      expect(buildFileAfter).toBe(buildFileBefore);
    });
  });

  describe('subdirectory path', () => {
    it('only processes files under the given directory', async () => {
      const dirPath = path.join(tmpDir, 'app/templates');
      const result = await runCli(['--dry-run', dirPath]);

      expect(result.stdout).toContain('application.gjs');
      expect(result.stdout).toContain('settings/index.gts');
      // Should not include components
      expect(result.stdout).not.toContain('navbar.gjs');
      expect(result.stdout).not.toContain('sidebar.gts');
    });

    it('transforms files under the subdirectory', async () => {
      const dirPath = path.join(tmpDir, 'app/templates');
      await runCli([dirPath]);

      const application = readFileSync(path.join(tmpDir, 'app/templates/application.gjs'), 'utf-8');
      expect(application).toContain('<ArrowLeft');
      expect(application).not.toContain('{{svgJar');
    });

    it('does not transform files outside the subdirectory', async () => {
      const navbarBefore = readFileSync(path.join(tmpDir, 'app/components/navbar.gjs'), 'utf-8');

      const dirPath = path.join(tmpDir, 'app/templates');
      await runCli([dirPath]);

      const navbarAfter = readFileSync(path.join(tmpDir, 'app/components/navbar.gjs'), 'utf-8');
      expect(navbarAfter).toBe(navbarBefore);
    });
  });
});
