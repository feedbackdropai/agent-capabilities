# Enforcement

Rules split into two kinds: **mechanical rules** (lint-enforced — the build says no) and **judgment rules** (doc-enforced — prose guides humans and agents). Every rule that *can* move to lint *should*: lint enforcement is free for agents (verification gates already run `check`, and self-heal loops fix violations automatically), it never drifts, and it depersonalizes review.

**Discipline:** when a rule lives in lint, its doc section shrinks to the *why* plus a pointer here. Never maintain the full rule in both places — the two copies will drift, and the lint config silently wins.

Lint configs live in each consuming repo, not in this plugin. This document is the recipe. The linter is **Biome**; gaps Biome can't cover are filled by CI companions (dependency-cruiser, knip) or Biome GritQL plugins. Verify rule names against the installed Biome version — some listed rules are in the `nursery` group.

## Mechanical Rules → Enforcement Mapping

| Rule | Source doc | Enforcement |
|------|-----------|-------------|
| Static-only classes banned | classes.md | Biome `complexity/noStaticOnlyClass` |
| `import type` for type-only imports | typescript.md | Biome `style/useImportType` |
| No `any` | typescript.md | Biome `suspicious/noExplicitAny` |
| No `const enum` | enums.md | Biome `suspicious/noConstEnum` |
| Circular dependencies | architecture-decisions.md | Biome `nursery/noImportCycles`, or dependency-cruiser |
| Function size cap | functions.md | Biome `nursery/noExcessiveLinesPerFunction` (exempt orchestration functions via the documented exception) |
| File growth cap (~250 lines) | functions.md | **Biome gap** — no file-length rule. Options: small CI script (`wc -l` over `src/**/*.ts`), or a Biome GritQL plugin |
| Module boundaries (cross-module imports via `index.ts` only) | imports-exports.md, architecture-decisions.md | dependency-cruiser rule set (most robust), or Biome `noRestrictedImports`/`noPrivateImports` where the installed version supports pattern-based restrictions |
| No relative paths (alias-configured packages) | imports-exports.md | Biome `style/noRestrictedImports` if pattern support available; otherwise a GritQL plugin matching `./`/`../` specifiers, or dependency-cruiser |
| No unused exports | architecture-decisions.md | `knip` in CI |

## Doc-Enforced Rules (judgment — not fully lintable)

These rely on the standards docs, code review, and the agents that load these skills on every spawn:

| Rule | Source doc | Why not lintable |
|------|-----------|------------------|
| One exported item per file (+ the closed exception list) | imports-exports.md | Exceptions (union families, enum+map) need semantic checks |
| Graduation rule (file → folder when companions appear) | architecture-decisions.md | Requires judging what counts as a companion |
| Class vs functions bright line | classes.md | Requires judging state/config/polymorphism intent |
| Prefer enums over union types; enum discriminants | enums.md | A union type is not inherently wrong — context decides |
| Object args everywhere (imposed-signature exception) | functions.md | Imposed signatures need semantic recognition |
| Code placement (lowest common ancestor, promote on reuse) | folder-structure.md | Requires knowing the consumer set |
| Boundary testing (test files only at module boundaries) | unit-testing.md | Requires module classification |
| Naming for reuse, naming consistency | conventions.md | Semantic |
| When to document (TSDoc threshold) | ts-docs.md | Semantic |

## Recommended Adoption Order

1. Biome rules already in `recommended` or drop-in: `noStaticOnlyClass`, `useImportType`, `noExplicitAny`, `noConstEnum` — enable as `error`
2. `noImportCycles` + `noExcessiveLinesPerFunction` (nursery — pin Biome version)
3. Module boundaries via dependency-cruiser in CI — define module patterns (features, routes, graduated folders), run as warnings for one sprint, then promote to errors
4. File-length CI check + `knip` — batch-fix existing violations first

New code follows all rules immediately; existing code converts on touch — no big-bang migration.
