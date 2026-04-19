import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { findTemplateFiles } from '#lib/file-system.ts';
import { SCENARIOS_DIR } from '#test/helpers.ts';

describe('findTemplateFiles', () => {
  const projectRoot = path.join(SCENARIOS_DIR, 'find-templates');

  it('finds .gts files in app/components/', () => {
    const files = findTemplateFiles(projectRoot);
    expect(files).toContain('app/components/banner.gts');
  });

  it('finds .gjs files in app/components/', () => {
    const files = findTemplateFiles(projectRoot);
    expect(files).toContain('app/components/sidebar.gjs');
  });

  it('finds nested component files', () => {
    const files = findTemplateFiles(projectRoot);
    expect(files).toContain('app/components/nested/index.gjs');
  });

  it('finds files in app/templates/', () => {
    const files = findTemplateFiles(projectRoot);
    expect(files).toContain('app/templates/application.gts');
  });

  it('finds nested route templates', () => {
    const files = findTemplateFiles(projectRoot);
    expect(files).toContain('app/templates/nested-route/index.gts');
  });

  it('finds files outside conventional directories', () => {
    const files = findTemplateFiles(projectRoot);
    expect(files).toContain('lib/shared/icon-demo.gjs');
  });

  it('does not include files from node_modules/', () => {
    const files = findTemplateFiles(projectRoot);
    const nodeModuleFiles = files.filter((f) => f.includes('node_modules'));
    expect(nodeModuleFiles).toHaveLength(0);
  });

  it('returns an empty array when the project has no templates', () => {
    const emptyRoot = path.join(SCENARIOS_DIR, 'icon-not-found');
    const files = findTemplateFiles(emptyRoot);
    expect(files).toEqual([]);
  });
});
