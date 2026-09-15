# Code Quality

Three separate tools, each doing one job: ESLint (correctness/style rules), Prettier (formatting), TypeScript (types). They're kept from fighting each other — see [Formatting vs. linting](#formatting-vs-linting) below.

## TypeScript

Shared config lives in `packages/typescript-config`, three bases:

- `base.json` — strict mode, ES2022 target, bundler module resolution
- `library.json` — extends `base`, adds `declaration`/`declarationMap` (for editor go-to-definition into internal packages)
- `nextjs.json` — extends `base`, adds JSX/Next.js plugin settings

Every app/package has its own `tsconfig.json` extending one of these (never a root-level `tsconfig.json` — each package's config stays local so a change to one package's types doesn't invalidate every other package's Turborepo cache). Internal packages use Node.js subpath-style resolution (`moduleResolution: "bundler"`) rather than TS path aliases, so JIT-imported packages resolve correctly without a build step.

Pinned to `typescript@^6.0.3` everywhere — not `latest` (TypeScript 7 is out but `typescript-eslint` doesn't support it yet as a peer dependency; pinning avoids the peer-dependency conflict rather than fighting it per-install).

```bash
pnpm check-types   # tsc --noEmit in every package, via Turborepo
```

## ESLint

Shared config lives in `packages/eslint-config` (ESLint 9, flat config format):

- `base.js` — `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier` (disables any ESLint rule that would conflict with Prettier's formatting)
- `node-library.js` — thin wrapper around `base.js`; used by `apps/api`, `apps/worker`, and every `packages/*` package
- `next.js` — `base.js`'s rules plus `eslint-config-next`'s React/JSX-a11y/Next-specific rules (core-web-vitals); used only by `apps/web`

Every package has a two-line `eslint.config.js` importing the right shared config, and a `lint` script (`eslint .`).

Also pinned rather than `latest`: `eslint@^9.39.5` and `@eslint/js@^9.39.0` — `eslint-config-next`'s transitive plugins (`eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`) don't yet declare ESLint 10 as a supported peer.

```bash
pnpm lint   # eslint . in every package, via Turborepo
```

## Prettier

Root-level only — `.prettierrc.json` and `.prettierignore` at the repo root, `prettier` as a root devDependency. Formatting is a single whole-tree pass with no per-package boundary, so it isn't wired through Turborepo the way lint/check-types/build are; the root scripts call `prettier` directly.

Config (`.prettierrc.json`): `printWidth: 100`, `trailingComma: "all"` — everything else is Prettier 3's defaults.

Ignored (`.prettierignore`): `pnpm-lock.yaml`, `dist/`, `.next/`, `.turbo/`, `packages/db/drizzle/` (generated migration SQL). `node_modules` and VCS directories are ignored by Prettier automatically.

```bash
pnpm format         # prettier --write . — reformats in place
pnpm format:check   # prettier --check . — fails without writing, for CI
```

## Formatting vs. linting

`eslint-config-prettier` is included in both shared ESLint configs specifically so ESLint never flags a formatting choice that Prettier would make differently — ESLint owns correctness/best-practice rules, Prettier owns whitespace/quotes/line-wrapping. There's no actual overlap or conflict by construction.

## Not set up yet

No pre-commit hook (husky + lint-staged) enforcing any of this automatically on commit, and no editor-level format-on-save config (`.vscode/settings.json`). Both are reasonable additions if inconsistent formatting/lint failures start slipping through in practice.
