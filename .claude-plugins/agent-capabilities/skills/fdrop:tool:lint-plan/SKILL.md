---
name: fdrop:tool:lint-plan
description: Lints a plan for structural/mechanical defects an implementing agent would trip on — broken file paths, missing scripts, placeholder tokens, naming mismatches, missing required sections, over-scope. Returns each issue with its exact fix. Use to verify a plan's scaffolding before semantic review.
allowed-tools: Read, Bash, Skill
---

# Lint Plan

Lint a plan for **structural** defects: things that are present-or-absent and verifiable against the filesystem, with a determinable fix. This is the mechanical half of plan quality.

**Boundary:** lint owns **structure** — whether the plan's scaffolding is present and consistent with reality. It does **not** judge whether the content is semantically *adequate* (are the right methods defined, is a decision missing) — that is [check-plan-gaps](../fdrop:tool:check-plan-gaps/SKILL.md)'s job. Flag only deterministic structural defects here; never flag a judgment call.

## Input

One or two file paths: an optional overview plan and the plan to lint.

```
Overview: <overview-plan-path>
Plan: <plan-file-path>
```

If no overview is provided, only the `Plan:` line will be present — lint the plan as a standalone document.

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|-----|---------|---------|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path to load for naming conventions and the style guide |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values. Inline `---` blocks take precedence. If neither is present, defaults apply.

## Instructions

### Step 1: Read

Read the plan file (and the overview, if provided, for context only — lint only the plan).

### Step 2: Load Conventions

Load the `code-standards` skill/file (default `/fdrop:code:standards`) for the target package's file-naming conventions and style guide.

### Step 3: Run the Structural Checks

Each check is verifiable against the filesystem or the plan text. Flag a check only when it would concretely break the implementing agent.

- **Paths exist** — every file the plan says to modify or mirror exists on disk (`ls`/`Read`).
- **Scripts exist** — every referenced package script (`check`, `test-unit`, etc.) exists in the target `package.json` (`grep`), using `scripts` overrides if provided.
- **No placeholders** — no literal `???`, `TBD`, `TODO`, or unresolved `{token}` markers remain.
- **Naming matches** — file names the plan introduces match the target package's convention from the loaded standards.
- **Required sections present** — the plan contains its required sections (prerequisites, explicit scope boundaries, verification commands, and a "What Next Plan Expects" section).
- **Scope within guardrail** — the count of source files to create/modify (excluding tests, barrels, type-only files) is **≤ 50** (`fdrop:agent:feature-executor`'s limit).
- **Packages identifiable** — affected packages are derivable from the file paths (monorepo: under `packages/<name>/...`).

### Step 4: Report

```
PLAN_LINT: <CLEAN | ISSUES>

[Overview: <overview-path>]
Plan: <plan-path>
Issues: <n>

| # | Check | Issue | Location | Fix |
|---|-------|-------|----------|-----|
| 1 | ...   | ...   | <section/line> | <exact mechanical fix> |
```

Include the `Overview:` line only if an overview was provided. If there are no issues, report `PLAN_LINT: CLEAN` with an empty table (0 issues).

## Linting Rules

- `CLEAN` is a real result. Do not manufacture issues to justify output.
- Only flag **structural** defects with a determinable fix. If resolving the issue requires a judgment about what the content *should be*, it is not a lint issue — leave it for check-plan-gaps.
- Each issue must state the exact fix (the correct path, the right script name, the section to add).
- Do not flag things the loaded standards already cover unless the plan contradicts them.
