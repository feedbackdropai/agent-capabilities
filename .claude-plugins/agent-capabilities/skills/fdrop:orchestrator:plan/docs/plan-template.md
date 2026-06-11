# Plan Template

Templates for plans consumed by `/fdrop:orchestrator:implement` and graded by `/fdrop:tool:grade-plan`. Three variants: **Single Plan** (standalone feature), **Overview Plan** (multi-phase context), and **Phase Plan** (one implementation scope under an overview).

## Rules (all variants)

These mirror the grade-plan rubric — a plan violating them will not reach A:

- **No placeholders.** No `???`, `TBD`, or unresolved `{tokens}`. Every open question must be resolved before the plan is written.
- **Every referenced path verified.** Files listed under Files to Modify and Patterns to Mirror must exist on disk at write time. Files to Create must not.
- **Signatures, not vibes.** Services and modules define their methods and signatures — never "create a service for X" without saying what it exposes.
- **Explicit dependency graph.** Module definitions include imports/exports; cross-module wiring is stated (exports match imports).
- **Real script names.** Verification commands reference scripts that exist in the target `package.json` (or the `scripts` overrides).
- **Within executor scope.** Each plan (or each phase) stays within the feature-executor's 50-file guardrail — target 40 or fewer source files.

---

## Single Plan

```markdown
# <Feature Name>

## Context

<1–2 paragraphs: what this feature does, why it is needed, and the relevant
current state of the codebase.>

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| <decision> | <chosen approach> | <one line> |

<!-- If a decision was assumed rather than confirmed by the user, append
"(assumption)" to the Choice cell. -->

## Prerequisites

- <required state before implementation begins, or "None">

## Affected Packages

- `packages/<name>` — <why this package is touched>

<!-- Single-package repos: state "Single-package repository." -->

## Files to Create

### `packages/<name>/src/path/to/file.ts`

<Purpose. Key contents: exported functions/classes with full signatures,
methods, imports it needs, what it exports. Enough detail that a fresh-context
agent writes the right code without guessing.>

## Files to Modify

### `packages/<name>/src/path/to/existing.ts`

<What changes and where: which function/section, what is added/removed/changed,
and how it integrates with the created files.>

## Patterns to Mirror

- `packages/<name>/src/path/to/analogous.ts` — <what to take from it: structure,
  naming, error handling, etc.>

## Scope Boundaries

**Do:**
- <in-scope item>

**Do NOT:**
- <explicitly out-of-scope item — adjacent work the agent might be tempted to do>

## Verification

- `<resolved check command>` — types clean
- `<resolved test-unit command>` — tests pass

## What Next Plan Expects

<For a standalone plan: "None — standalone plan." Otherwise: the exact state a
follow-up plan can rely on — files that exist, exports available, behavior
guaranteed.>
```

---

## Overview Plan

The overview carries context shared by all phases. It is **not implemented directly** — it is passed alongside each phase to `/fdrop:orchestrator:implement` and `/fdrop:task:plan-to-A`.

```markdown
# <Feature Name> — Overview

## Context

<What this feature does, why, and the relevant current state.>

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| <decision> | <chosen approach> | <one line> |

## Architecture

<How the pieces fit together across phases: data flow, module boundaries,
shared types. A diagram or short prose map.>

## Affected Packages

- `packages/<name>` — <role in this feature>

## Phases

| # | File | Scope |
|---|------|-------|
| 1 | `phase1-<slug>.md` | <one-line scope> |
| 2 | `phase2-<slug>.md` | <one-line scope> |

## Cross-Phase Dependencies

- Phase 2 depends on Phase 1's <export/file/behavior>.
```

---

## Phase Plan

Identical to the Single Plan with these adjustments:

- Title: `# <Feature Name> — Phase <N>: <Phase Name>`
- **Prerequisites** states the prior phase's end state: "Phase <N-1> complete: <files/exports that now exist>." Phase 1 states the pre-feature codebase state.
- **Design Decisions** may be omitted if fully covered by the overview — reference it: "See overview."
- **What Next Plan Expects** is mandatory and chains: it must list exactly what the next phase's Prerequisites will claim. The final phase states "None — final phase."
