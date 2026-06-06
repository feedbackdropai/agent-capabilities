---
name: fdrop:tool:grade-plan
description: Grades a plan for agent-implementability. Returns a letter grade and specific gaps that would cause the implementing agent to fail.
allowed-tools: Read, Bash, Skill
---

# Grade Plan

## Input

One or two file paths: an optional overview plan and the plan to grade.

```
Overview: <overview-plan-path>
Plan: <plan-file-path>
```

If no overview is provided, only the `Plan:` line will be present. Skip overview-related steps and grade the plan as a standalone document.

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|-----|---------|---------|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path to load for codebase conventions |
| `extra-context` | (none) | Additional skills/docs to load for context |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides. Inline `---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

## Instructions

Grade the provided plan for whether an agent with a fresh context window can implement it using `/fdrop:orchestrator:implement`.

### Step 1: Read Context

1. If an overview plan was provided, read it (for design decisions, feature context, dependencies).
2. Read the plan file.

### Step 2: Verify Against Codebase

**Load standards:** If a `code-standards` override was provided, load it via the Skill tool (if it starts with `/`) or the Read tool (if it's a file path). Otherwise, load the default `/fdrop:code:standards`. This provides codebase conventions (standards includes the style guide as a subset).

**Load extra context:** If `extra-context` paths were provided, load each one via the Skill tool (for skills) or Read tool (for `.md` files).

Then verify the plan's references against the actual codebase:

- **File paths:** Do referenced files to modify/mirror actually exist? (`Read` or `ls` to check)
- **Scripts:** Do referenced package scripts exist in the target package.json? (`grep` to check)
- **Naming conventions:** Do file names in the plan match the target package's convention from the style guide?
- **Patterns to mirror:** Do the files the plan says to "mirror" or "follow the pattern of" exist?

### Step 3: Grade Against Criteria

Evaluate the plan against each criterion below. A criterion passes if the agent would NOT fail or produce wrong code because of it. A criterion fails only if it would cause a concrete problem.

**Agent Executability:**

- No interactive commands (prompts, confirmations, or inputs the agent can't respond to)
- Scope within `fdrop:agent:feature-executor`'s 50-file guardrail
- No conflicting instructions with skills the feature-executor loads (`fdrop:code:standards`).

**Codebase Accuracy:**

- Referenced file paths exist on disk
- Referenced patterns/files to mirror exist
- File naming conventions match the target package
- Referenced scripts exist in package.json

**Completeness:**

- All files to create/modify are listed with enough implementation detail
- Services and modules have defined methods/signatures (not just "create a service")
- Module definitions include imports/exports (dependency graph is explicit)
- Cross-module dependencies are wired (exports match imports)

**Clarity:**

- No literal placeholders (`???`, `TBD`, unresolved `{tokens}`)
- Scope boundaries explicit (what TO do, what NOT to do, recipe overrides where needed)
- Prerequisites stated
- Verification commands specified
- "What Next Plan Expects" section present

**Orchestrator Compatibility:**

- Affected packages identifiable from file paths (monorepo: under `packages/<name>/...`)
- Verification runnable via the resolved `check` + `test-unit` commands (using `scripts` overrides if provided, otherwise auto-detected)

### Step 4: Assign Grade

| Grade | Meaning |
|-------|---------|
| A     | Agent can implement this plan alone. No gaps. |
| B+    | 1-2 minor gaps. Agent would likely succeed but might produce suboptimal code. |
| B     | Multiple gaps. Agent would struggle or produce incorrect code in places. |
| C     | Significant gaps. Agent would fail or need to guess on key decisions. |
| D     | Plan is a skeleton. Agent cannot implement without major clarification. |

### Step 5: Report

Return the grade and gaps in this exact format:

```
PLAN_GRADED: <grade>

[Overview: <overview-path>]
Plan: <plan-path>
Grade: <grade>
Gaps: <n>

| # | Category | Gap | Why Agent Would Fail | Suggested Fix |
|---|----------|-----|----------------------|---------------|
| 1 | ...      | ... | ...                  | ...           |
```

Include the `Overview:` line only if an overview was provided.

If grade is A, the table is empty (0 gaps).

## Grading Rules

- An A grade is a real grade. Do not manufacture feedback to justify your existence.
- Only flag gaps that would cause agent failure or wrong code.
- Minor details the agent can figure out from codebase context are NOT gaps (e.g., line numbers off by ~10, utility function parameter signatures, naming ambiguities with obvious resolutions).
- Each gap must state: what's wrong, why the agent would fail, and what the fix is.
- The implementing agent loads the configured standards skill - it has access to codebase conventions. Don't flag things those skills already cover unless the plan contradicts them.
