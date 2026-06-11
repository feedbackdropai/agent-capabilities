# Enforcement

Rules split into two kinds: **mechanical rules** (lint-enforced — the build says no) and **judgment rules** (doc-enforced — prose guides humans and agents). Every rule that *can* move to lint *should*: lint enforcement is free for agents (verification gates already run `check`/lint, and self-heal loops fix violations automatically), it never drifts, and it depersonalizes review.

**Discipline:** when a rule lives in lint, its doc section shrinks to the *why* plus a pointer here. Never maintain the full rule in both places — the two copies will drift, and the lint config silently wins.

Lint configs live in each consuming repo, not in this plugin. This document is the recipe.

## Mechanical Rules → Lint Mapping

| Rule | Source doc | ESLint enforcement |
|------|-----------|--------------------|
| File growth cap (~250 lines) | functions.md | `max-lines: ["error", { "max": 250, "skipBlankLines": true, "skipComments": true }]` |
| Function size cap | functions.md | `max-lines-per-function` (set per repo; exempt orchestration functions via the documented exception) |
| Module boundaries (cross-module imports via `index.ts` only) | imports-exports.md, architecture-decisions.md | `eslint-plugin-boundaries` (preferred) or `import/no-internal-modules` with module patterns, or dependency-cruiser in CI |
| No relative paths (alias-configured packages) | imports-exports.md | `no-restricted-imports: ["error", { "patterns": ["./*", "../*"] }]` |
| Static-only classes banned | classes.md | `@typescript-eslint/no-extraneous-class` |
| `import type` for type-only imports | typescript.md | `@typescript-eslint/consistent-type-imports` |
| No `any` | typescript.md | `@typescript-eslint/no-explicit-any` |
| No `const enum` | enums.md | `no-restricted-syntax: ["error", { "selector": "TSEnumDeclaration[const=true]", "message": "const enum is banned — use a plain enum" }]` |
| No unused exports | architecture-decisions.md | `knip` or `ts-prune` in CI |
| Circular dependencies | architecture-decisions.md | `import/no-cycle` or dependency-cruiser |

## Doc-Enforced Rules (judgment — not fully lintable)

These rely on the standards docs, code review, and the agents that load these skills on every spawn:

| Rule | Source doc | Why not lintable |
|------|-----------|------------------|
| One exported item per file (+ the closed exception list) | imports-exports.md | Exceptions (union families, enum+map) need semantic checks; partially approximable with custom rules |
| Graduation rule (file → folder when companions appear) | architecture-decisions.md | Requires judging what counts as a companion |
| Class vs functions bright line | classes.md | Requires judging state/config/polymorphism intent |
| Prefer enums over union types | enums.md | A union type is not inherently wrong — context decides |
| Code placement (lowest common ancestor, promote on reuse) | folder-structure.md | Requires knowing the consumer set |
| Naming for reuse, naming consistency | conventions.md | Semantic |
| When to document (TSDoc threshold) | ts-docs.md | Semantic |

## Recommended Adoption Order

1. `max-lines`, `no-extraneous-class`, `consistent-type-imports`, `no-explicit-any`, `no-const-enum` — drop-in, low conflict
2. `no-restricted-imports` (relative paths) — verify aliases are configured in every package first
3. Module boundaries (`eslint-plugin-boundaries`) — define the module patterns (features, routes, graduated folders), run as `warn` for one sprint, then promote to `error`
4. `knip` / dependency-cruiser in CI — batch-fix existing violations first

New code follows all rules immediately; existing code converts on touch — no big-bang migration.
