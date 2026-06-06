---
name: fdrop:task:plan-to-A
description: Iteratively grades and improves a plan until it reaches A grade. Spawns a grading subagent, asks user questions for design decisions, applies fixes, and re-grades. Input is an optional overview plan path and the plan file path.
allowed-tools: Agent, Read, Bash, Edit, Write
---

# Plan to A

## Input

One or two file paths: an optional overview plan and the plan to grade.

```
/fdrop:task:plan-to-A [<overview-plan-path>] <plan-file-path>
```

**Two paths:** First is the overview plan (high-level context, design decisions), second is the plan to grade.

**One path:** The single path is the plan to grade. No overview context is passed to the grader.

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|-----|---------|---------|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path loaded by the grading agent for codebase conventions |
| `extra-context` | (none) | Additional skills/docs loaded by the grading agent |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides. Inline `---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

Extract these values early and pass them to the grading subagent as described in Step 1.

## Architecture

You are the orchestrator. You repeatedly spawn a grading subagent, evaluate its verdict, and if the plan is not yet A grade, resolve the gaps (fixing directly or asking the user for design decisions) before re-grading.

## Instructions

### Step 1: Grade the Plan

Spawn a subagent using the Agent tool with `subagent_type: "fdrop:agent:grade-plan"` and this prompt:

**If overview was provided:**

```
Grade this plan:
Overview: <overview-plan-path>
Plan: <plan-file-path>
```

**If no overview (single path input):**

```
Grade this plan:
Plan: <plan-file-path>
```

If overrides were extracted from the input, append them to the prompt:

```
---
code-standards: <value>
extra-context:
  - <path-1>
  - <path-2>
---
```

If no overrides were provided, omit the fenced block entirely (defaults apply).

### Step 2: Evaluate the Grade

Parse the `PLAN_GRADED:` line from the subagent's response.

**If the grade is A:** Go to Step 4.

**If the grade is below A:** Extract the gaps table from the response and proceed to Step 3.

**If the grade is ERROR:** Report the error to the user and stop.

### Step 3: Resolve & Fix

For each gap in the table, determine the fix type:

**Unambiguous fix** — the gap has an obvious, mechanical solution (e.g., wrong script name, redundant index, missing recipe override, referenced file doesn't exist but the correct path is clear). Apply the fix directly to the plan file.

**Design decision** — the gap requires choosing between alternatives or defining something the plan omitted (e.g., what URL to redirect to, what methods a service should have, how to handle an edge case). Ask the user (via normal text output — they will respond in the next turn), then apply based on their answer.

**Rules for this step:**
- Only fix gaps the grader explicitly flagged. Do not invent additional changes.
- When asking the user, provide your recommended answer as the first option.
- Batch related questions into a single message when possible (up to 4 questions per turn).

After all gaps are addressed, go back to Step 1 with a fresh subagent.

### Step 4: Report

Report the final grade and a summary of all changes made across iterations:

```
## Plan Graded: <plan-file-name>

| Iteration | Grade | Gaps | Changes Made |
|-----------|-------|------|--------------|
| 1         | B     | 4    | Fixed X, Y; asked user about Z |
| 2         | A     | 0    | — |

Final grade: A
```

## Rules

- Each grading invocation **must** be a new Agent tool call (fresh context) so the grader evaluates the current file state, not a cached view.
- **Maximum 5 iterations.** If the plan has not reached A after 5 rounds, stop and report the current grade with remaining gaps.
- Do **NOT** grade anything yourself — always delegate grading to the subagent. Fixing gaps is your responsibility (Step 3).
- Do not ask the user about things the agent can figure out — only genuine design decisions where multiple valid approaches exist.
