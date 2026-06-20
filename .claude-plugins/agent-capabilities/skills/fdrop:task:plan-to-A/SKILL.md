---
name: fdrop:task:plan-to-A
description: Iteratively brings a plan to A grade by linting it (auto-fixing structural defects) then gap-checking it (surfacing decision-level gaps). Spawns the lint and gap-check agents, runs non-interactively, and reports decision gaps as unresolved rather than asking. Input is an optional overview plan path and the plan file path.
allowed-tools: Agent, Read, Bash, Edit, Write
---

# Plan to A

## Input

One or two file paths: an optional overview plan and the plan to grade.

```
/fdrop:task:plan-to-A [<overview-plan-path>] <plan-file-path>
```

**Two paths:** First is the overview plan (high-level context, design decisions), second is the plan to grade.

**One path:** The single path is the plan to grade. No overview context is passed to the lint or gap-check agents.

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|-----|---------|---------|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path loaded by the lint and gap-check agents for codebase conventions |
| `extra-context` | (none) | Additional skills/docs loaded by the gap-check agent |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides. Inline `---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

Extract these values early and pass them to the lint and gap-check agents as described in Steps 1 and 2.

## Architecture

You are the orchestrator. You bring a plan to A through two passes, both delegated to subagents:

1. **Lint** — spawn `fdrop:agent:lint-plan` to find structural defects, apply its (mechanical, determinable) fixes yourself, and re-lint until clean.
2. **Gap-check** — spawn `fdrop:agent:check-plan-gaps` on the now lint-clean plan to find decision-level gaps.

You run **non-interactively** (so this skill can execute inside a subagent): you fix lint issues directly, but you never ask the user — decision-level gaps from the gap-check are recorded as unresolved and surfaced in the final report for the upstream planning phase to address. **A** means lint is clean **and** the gap-check finds no gaps.

## Instructions

### Step 1: Lint Pass

Spawn `fdrop:agent:lint-plan` (Agent tool, `subagent_type: "fdrop:agent:lint-plan"`) with this prompt (include the `Overview:` line only if an overview was provided):

```
Lint this plan:
Overview: <overview-plan-path>
Plan: <plan-file-path>
```

If overrides were extracted from the input, append them to the prompt; otherwise omit the fenced block:

```
---
code-standards: <value>
scripts:
  check: <value>
---
```

Parse the `PLAN_LINT:` line from the response:

- **`CLEAN`** → proceed to Step 2.
- **`ISSUES`** → apply each fix directly to the plan file (lint issues are structural and determinable — apply them all; do not invent changes the agent did not flag), then re-spawn a **fresh** `fdrop:agent:lint-plan` to confirm. Repeat until `CLEAN` or the iteration cap (see Rules).
- **`ERROR`** → report the error and stop.

### Step 2: Gap-Check Pass

With the plan lint-clean, spawn `fdrop:agent:check-plan-gaps` (Agent tool, `subagent_type: "fdrop:agent:check-plan-gaps"`) with the same input shape (`Lint this plan:` becomes `Check this plan:`) and the same overrides. Parse the `PLAN_GAPS:` line:

- **`NONE`** → the plan is A. Proceed to Step 3.
- **`GAPS`** → these are decision-level gaps. This skill is **non-interactive — never ask the user and never guess.** Decisions belong to the upstream planning phase. Record each gap under **Unresolved — needs upstream decision** (Step 3); the plan stays below A.
- **`ERROR`** → report the error and stop.

### Step 3: Report

Report the outcome and a summary of what changed:

```
## Plan Graded: <plan-file-name>

Lint: <CLEAN after N pass(es)>
Gap-check: <NONE | M gaps>

| Pass | Result | Changes Made |
|------|--------|--------------|
| Lint 1    | 3 issues | Fixed wrong script name, added verification section, corrected mirror path |
| Lint 2    | CLEAN    | — |
| Gap-check | NONE     | — |

Final grade: <A | below-A>

[If the gap-check returned gaps:]
### Unresolved — needs upstream decision
- <gap>: <what must be decided, and the options the gap-check surfaced>
```

A plan with unresolved decision gaps remains below A — that is expected. It signals the upstream planning phase must resolve those decisions before this plan can reach A.

## Rules

- Each lint and gap-check invocation **must** be a new Agent tool call (fresh context) so the agent evaluates the current file state, not a cached view.
- **Maximum 5 lint iterations.** If lint is not clean after 5 rounds, stop the lint loop and report the remaining issues; still run the gap-check pass so the report is complete.
- Do **NOT** lint or gap-check the plan yourself — always delegate to the subagents. Applying lint fixes is your responsibility (Step 1).
- **Never ask the user and never prompt for input** — this skill runs non-interactively so it can execute inside a subagent. Decision-level gaps are recorded as unresolved (Step 2), not asked about.
