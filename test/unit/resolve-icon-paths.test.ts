import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { run } from '#src/codemod.ts';
import { SCENARIOS_DIR } from '#test/helpers.ts';

/**
 * Tests that the codemod resolves icon import paths by looking up the actual
 * SVG file inside the source directories declared in ember-cli-build.js,
 * rather than using a hardcoded path.
 *
 * Each scenario is a mini Ember project tree under test/_scenarios/ with:
 *   - ember-cli-build.js (svgJar config)
 *   - SVG files in the configured source directories
 */

describe('resolve icon import paths', () => {
  describe('default source dir (public/)', () => {
    const projectRoot = path.join(SCENARIOS_DIR, 'default-source-dir');
    const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "one-icon"}}
  {{svgJar "#sprite-icon"}}
</template>`;

    const { output } = run(source, 'app/components/example.gjs', { projectRoot });

    it('resolves inline icon to its path under public/', () => {
      expect(output).toContain("from '../../public/one-icon.svg?unsafe-inline'");
    });

    it('resolves sprite icon to its path under public/', () => {
      expect(output).toContain("from '../../public/sprite-icon.svg'");
    });

    it('does not contain the old hardcoded path', () => {
      expect(output).not.toContain('my-app/assets/icons/');
    });
  });

  describe('custom source dir (app/svgs/)', () => {
    const projectRoot = path.join(SCENARIOS_DIR, 'custom-source-dir');
    const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "one-icon"}}
</template>`;

    const { output } = run(source, 'app/components/example.gjs', { projectRoot });

    it('resolves icon to the custom source dir', () => {
      expect(output).toContain("from '../svgs/one-icon.svg?unsafe-inline'");
    });
  });

  describe('multiple source dirs', () => {
    const projectRoot = path.join(SCENARIOS_DIR, 'multiple-source-dirs');
    const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "one-icon"}}
  {{svgJar "vendor-icon"}}
</template>`;

    const { output } = run(source, 'app/components/example.gjs', { projectRoot });

    it('resolves icon found in the first source dir', () => {
      expect(output).toContain("from '../../public/icons/one-icon.svg?unsafe-inline'");
    });

    it('resolves icon found in the second source dir', () => {
      expect(output).toContain("from '../../vendor/icons/vendor-icon.svg?unsafe-inline'");
    });
  });

  describe('nested icon paths', () => {
    const projectRoot = path.join(SCENARIOS_DIR, 'nested-icon-path');
    const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "nav/arrow"}}
  {{svgJar "actions/close"}}
</template>`;

    const { output } = run(source, 'app/components/example.gjs', { projectRoot });

    it('resolves icon in a subdirectory within the source dir', () => {
      expect(output).toContain("import Arrow from '../../public/nav/arrow.svg?unsafe-inline'");
    });

    it('resolves another nested icon', () => {
      expect(output).toContain("import Close from '../../public/actions/close.svg?unsafe-inline'");
    });

    it('derives the component name from the filename, not the full path', () => {
      expect(output).not.toContain('Nav/arrow');
      expect(output).not.toContain('Actions/close');
    });
  });

  describe('icon not found in any source dir', () => {
    const projectRoot = path.join(SCENARIOS_DIR, 'icon-not-found');
    const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "missing-icon"}}
</template>`;

    const { output, unresolvedIcons } = run(source, 'app/components/example.gjs', { projectRoot });

    it('leaves the mustache unchanged when the icon cannot be found', () => {
      expect(output).toContain('{{svgJar "missing-icon"}}');
    });

    it('does not add an import for the missing icon', () => {
      expect(output).not.toContain('import MissingIcon');
    });

    it('reports the missing icon in unresolvedIcons with location', () => {
      expect(unresolvedIcons).toEqual([
        {
          location: 'app/components/example.gjs:5:2',
          slug: 'missing-icon',
        },
      ]);
    });

    it('keeps the svgJar import when icons are unresolved', () => {
      expect(output).toContain("import svgJar from 'ember-svg-jar/helpers/svg-jar'");
    });
  });

  describe('import aliases from package.json', () => {
    describe('exact alias match', () => {
      const projectRoot = path.join(SCENARIOS_DIR, 'import-alias-exact');
      const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "arrow"}}
  {{svgJar "close"}}
</template>`;

      const { output } = run(source, 'app/components/example.gjs', { projectRoot });

      it('uses the import alias instead of a relative path', () => {
        expect(output).toContain("import Arrow from '#icons/arrow.svg?unsafe-inline'");
        expect(output).toContain("import Close from '#icons/close.svg?unsafe-inline'");
      });

      it('does not contain relative path traversal', () => {
        expect(output).not.toContain('../');
      });
    });

    describe('broad alias with multiple source dirs', () => {
      const projectRoot = path.join(SCENARIOS_DIR, 'import-alias-broad');
      const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "arrow"}}
  {{svgJar "star"}}
</template>`;

      const { output } = run(source, 'app/components/example.gjs', { projectRoot });

      it('uses the broad alias for icons under public/', () => {
        expect(output).toContain("import Arrow from '#public/icons/arrow.svg?unsafe-inline'");
      });

      it('uses the specific alias for icons under vendor/', () => {
        expect(output).toContain("import Star from '#vendor-icons/star.svg?unsafe-inline'");
      });
    });
  });

  describe('duplicate icon in multiple source dirs', () => {
    const projectRoot = path.join(SCENARIOS_DIR, 'duplicate-icon');
    const source = `
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "arrow"}}
  {{svgJar "star"}}
</template>`;

    const { output, ambiguousIcons } = run(source, 'app/components/example.gjs', { projectRoot });

    it('still replaces the mustache using the first match', () => {
      expect(output).toContain('<Arrow');
      expect(output).not.toContain('{{svgJar "arrow"}}');
    });

    it('uses the first source dir for the import path', () => {
      expect(output).toContain("from '../../public/icons/arrow.svg?unsafe-inline'");
    });

    it('reports the duplicate icon in ambiguousIcons with location', () => {
      expect(ambiguousIcons).toEqual([
        {
          location: 'app/components/example.gjs:5:2',
          slug: 'arrow',
          paths: ['public/icons/arrow.svg', 'vendor/icons/arrow.svg'],
        },
      ]);
    });

    it('does not report non-duplicate icons as ambiguous', () => {
      const slugs = ambiguousIcons.map((a) => a.slug);
      expect(slugs).not.toContain('star');
    });
  });
});
