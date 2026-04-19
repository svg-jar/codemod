import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { run } from '#src/codemod.ts';
import { readFixture, SCENARIOS_DIR } from '#test/helpers.ts';

const projectRoot = path.join(SCENARIOS_DIR, 'codemod-fixtures');

const classBackedFixture = readFixture('class-backed.gjs');
const classBackedTsFixture = readFixture('class-backed.gts');
const templateOnlyFixture = readFixture('template-only.gjs');
const templateOnlyTsFixture = readFixture('template-only.gts');
const noImportsFixture = readFixture('no-imports.gjs');
const renamedImportFixture = readFixture('renamed-import.gjs');

describe('class-backed.gjs', () => {
  const { output } = run(classBackedFixture, 'class-backed.gjs', { projectRoot });

  it('removes import from svgJar', () => {
    expect(output).not.toContain("import svgJar from 'ember-svg-jar/helpers/svg-jar';");
  });

  it('replaces svgJar usages with icon components', () => {
    expect(output).toContain('<OneIcon />');
    expect(output).toContain('<Two class="my-icon" />');
    expect(output).toContain('<SpriteIcon class="my-icon" title="My Icon" />');
    expect(output).toContain('<SomeOtherIcon class={{classHelper "icon-class" "another-class"}} />');
    expect(output).not.toContain('{{svgJar "icon-name"}}');
    expect(output).not.toContain('{{svgJar "icon-name" class="my-icon"}}');
    expect(output).not.toContain('{{svgJar "#icon-name" class="my-icon" title}}');
    expect(output).not.toContain(
      '{{svgJar (helper "some-other-icon") class=(classHelper "icon-class" "another-class")}}',
    );
  });

  it('adds new imports for icon components', () => {
    expect(output).toContain("import OneIcon from './public/one-icon.svg?unsafe-inline';");
    expect(output).toContain("import Two from './public/two.svg?unsafe-inline';");
    expect(output).toContain("import SpriteIcon from './public/sprite-icon.svg';");
    expect(output).toContain("import SomeOtherIcon from './public/some-other-icon.svg?unsafe-inline';");
  });
});

describe('class-backed.gts', () => {
  // "icon-name" appears as both inline and sprite, so they get distinct names:
  // inline → IconNameInline, sprite → IconName.
  const { output } = run(classBackedTsFixture, 'class-backed.gts', { projectRoot });

  it('removes import from svgJar', () => {
    expect(output).not.toContain("import svgJar from 'ember-svg-jar/helpers/svg-jar';");
  });

  it('replaces svgJar usages with icon components', () => {
    expect(output).toContain('<IconNameInline />');
    expect(output).toContain('<IconNameInline class="my-icon" />');
    expect(output).toContain('<IconName />');
    expect(output).toContain('<IconName class="my-icon" />');
    expect(output).not.toContain('{{svgJar "icon-name"}}');
    expect(output).not.toContain('{{svgJar "icon-name" class="my-icon"}}');
    expect(output).not.toContain('{{svgJar "#icon-name"}}');
    expect(output).not.toContain('{{svgJar "#icon-name" class="my-icon"}}');
  });

  it('adds new imports for icon components', () => {
    expect(output).toContain("import IconNameInline from './public/icon-name.svg?unsafe-inline';");
    expect(output).toContain("import IconName from './public/icon-name.svg';");
  });
});

describe('template-only.gjs', () => {
  // "icon-name" appears as both inline and sprite → disambiguated names.
  const { output } = run(templateOnlyFixture, 'template-only.gjs', { projectRoot });

  it('removes import from svgJar', () => {
    expect(output).not.toContain("import svgJar from 'ember-svg-jar/helpers/svg-jar';");
  });

  it('replaces svgJar usages with icon components', () => {
    expect(output).toContain('<IconNameInline />');
    expect(output).toContain('<IconNameInline class="my-icon" />');
    expect(output).toContain('<IconName />');
    expect(output).toContain('<IconName class="my-icon" />');
    expect(output).not.toContain('{{svgJar "icon-name"}}');
    expect(output).not.toContain('{{svgJar "icon-name" class="my-icon"}}');
    expect(output).not.toContain('{{svgJar "#icon-name"}}');
    expect(output).not.toContain('{{svgJar "#icon-name" class="my-icon"}}');
  });

  it('adds new imports for icon components', () => {
    expect(output).toContain("import IconNameInline from './public/icon-name.svg?unsafe-inline';");
    expect(output).toContain("import IconName from './public/icon-name.svg';");
  });
});

describe('template-only.gts', () => {
  // "icon-name" appears as both inline and sprite → disambiguated names.
  const { output } = run(templateOnlyTsFixture, 'template-only.gts', { projectRoot });

  it('removes import from svgJar', () => {
    expect(output).not.toContain("import svgJar from 'ember-svg-jar/helpers/svg-jar';");
  });

  it('replaces svgJar usages with icon components', () => {
    expect(output).toContain('<IconNameInline />');
    expect(output).toContain('<IconNameInline class="my-icon" />');
    expect(output).toContain('<IconName />');
    expect(output).toContain('<IconName class="my-icon" />');
    expect(output).not.toContain('{{svgJar "icon-name"}}');
    expect(output).not.toContain('{{svgJar "icon-name" class="my-icon"}}');
    expect(output).not.toContain('{{svgJar "#icon-name"}}');
    expect(output).not.toContain('{{svgJar "#icon-name" class="my-icon"}}');
  });

  it('adds new imports for icon components', () => {
    expect(output).toContain("import IconNameInline from './public/icon-name.svg?unsafe-inline';");
    expect(output).toContain("import IconName from './public/icon-name.svg';");
  });
});

describe('no-imports.gjs', () => {
  // Only one inline icon, no sprite counterpart — plain name, no Inline suffix.
  const { output } = run(noImportsFixture, 'no-imports.gjs', { projectRoot });

  it('handles files with no imports', () => {
    expect(output).toContain("import IconName from './public/icon-name.svg?unsafe-inline';");
    expect(output).toContain('<IconName />');
    expect(output).not.toContain('{{svgJar "icon-name"}}');
  });
});

describe('renamed-import.gjs', () => {
  const { output } = run(renamedImportFixture, 'renamed-import.gjs', { projectRoot });

  it('handles custom import names', () => {
    expect(output).toContain('<IconName />');
    expect(output).toContain('<SpriteIcon />');
    expect(output).not.toContain("import myCustomImportName from 'ember-svg-jar/helpers/svg-jar';");
    expect(output).not.toContain('{{myCustomImportName "icon-name"}}');
  });
});
