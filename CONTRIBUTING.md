# Contributing to @svg-jar/codemod

## Requirements

- Node.js >= 20
- pnpm >= 10

## Setup

```sh
git clone https://github.com/svg-jar/codemod
cd codemod
pnpm install
```

## Development

```sh
# Run tests in watch mode
pnpm test:watch

# Run tests once
pnpm test

# Type-check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build
```

## Project structure

```
src/
├── cli.ts                  Entry point for the svg-jar-codemod binary
├── codemod.ts              Core transform() and run() functions (public API)
├── index.ts                Public API re-exports
├── cli/                    CLI-specific modules (prompts, output formatting)
└── lib/                    Transform logic (AST manipulation, file resolution)

test/
├── unit/                   Unit tests for individual lib/ modules
├── cli.test.ts             Integration tests for the CLI
├── codemod.test.ts         Integration tests for the programmatic API
├── _fixtures/              Sample Ember projects used by integration tests
├── _scenarios/             Input/output pairs for transform tests
└── _snapshots/             Vitest snapshots
```

## Tests

Tests use [Vitest](https://vitest.dev).

```sh
pnpm test         # run all tests
pnpm test:watch   # watch mode
pnpm test:ui      # open the Vitest UI
```

**`test/unit/`** — Tests for individual modules in `src/lib/`. Several of these use focused mini-projects from `test/_scenarios/` (e.g. `find-templates`, `default-source-dir`, `custom-source-dir`) to exercise file system behaviour in isolation.

**`test/codemod.test.ts`** — Tests the programmatic API (`run()`, `transform()`). Each test reads a single `.gjs`/`.gts` file from `test/_fixtures/` and runs the codemod on it, asserting against the output with inline `expect()` calls. Uses `test/_scenarios/codemod-fixtures/` as the mock project root for SVG file resolution.

**`test/cli.test.ts`** — Tests the CLI as a subprocess (`tsx src/cli.ts ...`). Each test copies a scenario project from `test/_scenarios/` to a temp directory, runs the CLI against it, then reads the written files and asserts their contents. Most tests use `full-project`, which is a realistic Ember app with components, templates, route files, and SVG assets.

`test/_scenarios/` contains a collection of minimal Ember project trees, each set up for a specific case (custom source dirs, import aliases, duplicate icons, missing icons, etc.). When adding new behaviour, either extend an existing scenario or add a new directory for it.

## Submitting changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `pnpm test`, `pnpm lint`, and `pnpm typecheck` all pass
4. Open a pull request against `main`

CI runs lint, typecheck, and tests across Node 20, 22, 24, and 25.
