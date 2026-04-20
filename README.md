<div align="center">

<img alt="SvgJar" src="https://raw.githubusercontent.com/svg-jar/codemod/main/banner.svg">

# @svg-jar/codemod

[![npm version](https://img.shields.io/npm/v/@svg-jar/codemod?style=flat-square)](https://www.npmjs.com/package/@svg-jar/codemod)
[![CI](https://img.shields.io/github/actions/workflow/status/svg-jar/codemod/ci.yaml?label=CI&style=flat-square)](https://github.com/svg-jar/codemod/actions/workflows/ci.yaml)
[![License](https://img.shields.io/npm/l/@svg-jar/codemod?style=flat-square)](LICENSE)

</div>

A codemod that migrates Ember projects from `ember-svg-jar` to direct SVG component imports.

## What it does

The codemod finds all `{{svgJar "..."}}` mustache calls in your `.gjs` and `.gts` files and replaces them with angle-bracket component invocations backed by direct SVG imports.

**Before:**

```gjs
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "arrow-right" class="icon"}}
  {{svgJar "#star" class="star-icon"}}
</template>
```

**After:**

```gjs
import ArrowRight from '../../public/icons/arrow-right.svg?unsafe-inline';
import Star from '../../public/icons/star.svg';

<template>
  <ArrowRight class="icon" />
  <Star class="star-icon" />
</template>
```

### How it works

1. Reads your `ember-cli-build.js` (or `.mjs`/`.cjs`) to find configured `svgJar.sourceDirs`
2. Discovers all `.gjs`/`.gts` template files in the project
3. For each `{{svgJar "icon-name"}}` call, locates the SVG file on disk
4. Replaces the mustache with a `<ComponentName />` invocation, preserving all attributes
5. Adds an import statement with the correct relative path to the SVG file
6. Removes the `ember-svg-jar` import when all icons in a file are resolved

### Import path resolution

The codemod generates import paths relative to the file being transformed:

```
app/components/navbar.gjs → ../../public/icons/menu.svg?unsafe-inline
app/templates/settings/index.gts → ../../../public/icons/settings.svg?unsafe-inline
```

If your `package.json` defines [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) that match a source directory, the codemod uses those instead:

```json
{
  "imports": {
    "#icons/*": "./public/icons/*"
  }
}
```

```gjs
// Uses alias instead of relative path
import Menu from '#icons/menu.svg?unsafe-inline';
```

### Inline vs sprite icons

- **Inline icons** (`{{svgJar "icon"}}`) get the `?unsafe-inline` query suffix
- **Sprite icons** (`{{svgJar "#icon"}}`) use a plain import path (no suffix)
- When the same slug appears as both inline and sprite, the sprite keeps the plain name (`Icon`) and the inline variant gets an `Inline` suffix (`IconInline`)

## Usage

### Run on a whole project

```sh
pnpm dlx @svg-jar/codemod
```

Runs the codemod on the current directory. In interactive mode, you'll be prompted before writing changes.

### Run on a specific directory

```sh
pnpm dlx @svg-jar/codemod app/components
```

Only processes files under `app/components/`. The project root is inferred from the `app/` segment in the path.

### Run on a single file

```sh
pnpm dlx @svg-jar/codemod app/components/navbar.gjs
```

Transforms only the specified file. The project root is inferred and you'll be prompted to confirm it.

### Pass a project root explicitly

```sh
pnpm dlx @svg-jar/codemod /path/to/my-ember-app
```

## Options

| Flag            | Description                               |
| --------------- | ----------------------------------------- |
| `-d, --dry-run` | Preview changes without writing to disk   |
| `-c, --confirm` | Pause after each file and ask to continue |
| `-V, --version` | Print the version number                  |
| `-h, --help`    | Show help                                 |

### Dry run

```sh
pnpm dlx @svg-jar/codemod --dry-run
```

Shows which files would be changed and reports any issues without modifying anything.

### Step-through mode

```sh
pnpm dlx @svg-jar/codemod --confirm
```

Pauses after each file is processed and asks "Continue to next file?". Useful for reviewing changes one at a time.

## Report output

After the run completes, the codemod prints an ESLint-style report for any issues found:

```
app/components/broken-component.gjs
  5  warning  Icon "nonexistent-icon" not found in any source directory

app/components/ambiguous.gjs
  8  warning  Icon "arrow" found in multiple source directories
                  - public/icons/arrow.svg
                  - vendor/icons/arrow.svg

2 warnings (1 unresolved, 1 ambiguous)
8 files changed out of 10 scanned
```

- **Unresolved icons** - the SVG file was not found in any source directory. The `{{svgJar ...}}` call is left unchanged and the `ember-svg-jar` import is kept.
- **Ambiguous icons** - the SVG file exists in multiple source directories. The first match is used, but you should verify the correct one was chosen.

## Programmatic API

The codemod can also be used as a library:

```ts
import { run } from '@svg-jar/codemod';

const { output, unresolvedIcons, ambiguousIcons } = run(source, filePath, {
  projectRoot: '/path/to/project',
});
```

For more control, use `transform()` directly with pre-computed configuration:

```ts
import { transform } from '@svg-jar/codemod';

const result = transform(source, filePath, {
  projectRoot: '/path/to/project',
  sourceDirs: ['public/icons'],
  importAliases: [],
});
```

## Requirements

- Node.js >= 20
- Ember projects using `.gjs` or `.gts` template files
- Icons must exist as `.svg` files in the configured source directories

## Configuration

The codemod reads configuration from your existing project files:

- **`ember-cli-build.js`** (or `.mjs`/`.cjs`) -- `svgJar.sourceDirs` determines where to look for SVG files. Defaults to `['public']` if not configured.
- **`package.json`** -- `imports` field entries matching source directories are used as import aliases.
