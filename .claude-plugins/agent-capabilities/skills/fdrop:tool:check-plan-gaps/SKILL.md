---
name: fdrop:tool:check-plan-gaps
description: Checks a plan for decision-level gaps that would force the implementing agent to guess — underspecified services/modules, unwired cross-module dependencies, omitted design decisions, ambiguous behavior. Assumes the plan is already lint-clean. Returns the decisions a human must make.
allowed-tools: Read, Bash, Skill
---

# Check Plan Gaps

Check a plan for **adequacy**: whether its content is complete and decided enough for a fresh-context agent to implement via `/fdrop:orchestrator:implement` without guessing. This is the semantic half of plan quality.

**Boundary:** this check owns **adequacy** — is the present content enough to build, or must a human decide something. It assumes the plan is already **lint-clean** ([lint-plan](../fdrop:tool:lint-plan/SKILL.md) owns structure: paths, scripts, placeholders, naming, sections, scope). Do **not** re-flag structural defects here — only decision-level gaps.

## Input

One or two file paths: an optional overview plan and the plan to check.

```
Overview: <overview-plan-path>
Plan: <plan-file-path>
```

If no overview is provided, only the `Plan:` line will be present — check the plan as a standalone document.

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|-----|---------|---------|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path to load for codebase conventions |
| `extra-context` | (none) | Additional skills/docs to load for context |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values. Inline `---` blocks take precedence. If neither is present, defaults apply.

## Instructions

### Step 1: Read Context

Read the plan file. If an overview was provided, read it for design decisions, feature context, and dependencies the plan relies on.

### Step 2: Load Context

Load the `code-standards` skill/file (default `/fdrop:code:standards`) and any `extra-context`. The implementing agent loads these too — anything they already supply is **not** a gap unless the plan contradicts them.

### Step 3: Check for Decision-Level Gaps

A gap is something that would make the agent **guess** or that needs a human to **decide between valid alternatives**. Flag a check only when the agent could not derive the answer from the plan, the overview, the codebase, or the loaded standards.

- **Underspecified surfaces** — services/modules described as intent ("create a service") without defined methods/signatures the agent can implement.
- **Unwired dependencies** — cross-module dependencies where the plan does not make exports match imports, so the agent must invent the contract.
- **Insufficient detail** — a file to create/modify lacks enough detail to build it without guessing its behavior.
- **Omitted decisions** — points where multiple valid approaches exist and the plan picks none (behavior, edge cases, error handling, what to redirect/return).
- **Ambiguous boundaries** — scope boundaries present (lint checks that) but so vague the agent cannot tell what is in vs out.
- **Conflicts** — instructions that contradict the loaded standards.

### Step 4: Report

```
PLAN_GAPS: <NONE | GAPS>

[Overview: <overview-path>]
Plan: <plan-path>
Gaps: <n>

| # | Area | Gap | What Must Be Decided | Options Surfaced |
|---|------|-----|----------------------|------------------|
| 1 | ...  | ... | <the decision a human must make> | <valid alternatives, if any> |
```

Include the `Overview:` line only if an overview was provided. If there are no gaps, report `PLAN_GAPS: NONE` with an empty table (0 gaps).

## Checking Rules

- `NONE` is a real result. A lint-clean, well-elicited plan should return `NONE`. Do not manufacture gaps.
- Only flag gaps that force the agent to **guess** or need a **human decision**. Details the agent can derive from the codebase, overview, or standards are not gaps.
- Do not re-flag structural defects (paths, scripts, placeholders, naming, sections, scope) — those belong to lint-plan.
- Each gap must state what must be decided, and the valid options if you can surface them.
