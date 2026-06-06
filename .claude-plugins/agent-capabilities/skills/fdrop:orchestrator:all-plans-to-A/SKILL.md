---
name: fdrop:orchestrator:all-plans-to-A
description: Grades all plans in a folder to A by discovering plans, dispatching fdrop:task:plan-to-A sequentially, and looping until all reach A grade.
allowed-tools: Read, Bash, Skill
---

# All Plans to A

You are an orchestrator. Your job is to take a folder of plan files, identify plans, and run `/fdrop:task:plan-to-A` on each until all reach A grade.

## Input

A **folder path** containing plan files (`.md` files).

```
/fdrop:orchestrator:all-plans-to-A <folder-path>
```

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|---|---|---|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path loaded by the grading agent for codebase conventions |
| `extra-context` | (none) | Additional skills/docs loaded by the grading agent |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides.
`---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

Extract these values early and pass them to each `/fdrop:task:plan-to-A` invocation.

## Folder Structure

### Mode 1: Plans Only

The folder contains only plan files — each is a self-contained plan.

```
plans/
  pr-updates-1.md
  pr-updates-2.md
  pr-updates-3.md
```

Each plan is passed individually:

```
/fdrop:task:plan-to-A <plan-file-path>
```

### Mode 2: Overview Plan + Plans

The folder contains an **overview plan** alongside plan files. The overview provides high-level context that each plan needs.

```
wireUpTalk/
  wireUpTagTalk.md          <-- overview plan (matches folder name)
  phase1-lazy-init.md
  phase2-static-features.md
  phase3-page-urls.md
```

Each plan is passed with the overview:

```
/fdrop:task:plan-to-A <overview-plan-path> <plan-file-path>
```

### Detecting the Overview Plan

Identify the overview plan using these rules (first match wins):

1. A `.md` file whose name (without extension) matches the folder name
2. A `.md` file that does not start with a numeric prefix or the word "phase" when all other files do
3. If no file matches either rule, treat as **Mode 1** (no overview)

The overview plan is never graded itself — it is only passed as context.

## Workflow

### Step 0: Discover and Classify

List all `.md` files in the provided folder.

1. **Detect mode:** Apply the overview plan detection rules. If an overview plan is found, set mode to **Mode 2** and store its path. Otherwise, set mode to **Mode
1**.
2. **Build plan queue:** All `.md` files except the overview plan (if any) are plan files. Sort them alphabetically (numeric prefixes provide ordering).

If the folder is empty or contains no plan files, report that to the user and stop.

**Maximum 10 plans:** If the queue contains more than 10 plan files, report the count and stop.

Initialize tracking:

- **Mode:** 1 or 2
- **Overview plan path:** (Mode 2 only)
- **Plan queue:** ordered list of plan file paths
- **Results log:** per-plan grade history, iterations used, final grade

Report the discovered structure before proceeding:

```
## Discovered Plan Structure

Mode: <1 (plans only) | 2 (overview: <filename>)>
Plans: <N>

| # | Plan File | Status |
|---|---|---|
| 1 | phase1-lazy-init.md | pending |
| 2 | phase2-static-features.md | pending |
| ... | ... | ... |
```

### Step 1: Grade Next Plan

Take the next ungraded plan from the queue. Invoke the skill tool to load `/fdrop:task:plan-to-A`.

**Mode 1:**

```
/fdrop:task:plan-to-A <plan-file-path>
```

**Mode 2:**

```
/fdrop:task:plan-to-A <overview-plan-path> <plan-file-path>
```

If overrides were extracted from the input, append them:

```
---
code-standards: <value>
extra-context:
  - <path-1>
  - <path-2>
---
```

If no overrides were provided, omit the fenced block.

Wait for completion. The skill handles the full grade-fix-regrade loop internally (up to 5 iterations) and may pause to ask the user design questions.

### Step 2: Record Result

Parse the final report from `/fdrop:task:plan-to-A`. Extract:

- Final grade
- Number of iterations used
- Whether it reached A

Record in the results log. Print a progress update:

```
Plan <N>/<total> complete: <plan-name> → <grade> (<iterations> iterations)
Remaining: <M> plans
```

### Step 3: Loop Or Report

**If plans remain in the queue:** Go to Step 1.

**If all plans processed:** Go to Step 4.

### Step 4: Final Report

```
# All Plans to A — Final Report

**Folder:** <folder-path>
**Mode:** <1 (plans only) | 2 (overview: <filename>)>

| # | Plan | Final Grade | Iterations | Notes |
|---|---|---|---|---|
| 1 | phase1-lazy-init.md | A | 2 | Fixed 3 gaps |
| 2 | phase2-static-features.md | A | 1 | Already A |
| 3 | phase3-page-urls.md | B+ | 5 | Max iterations reached |

## Summary
- Total plans: <N>
- Reached A: <N>
- Did not reach A: <N>

[If any did not reach A:]
## Did Not Reach A
- <plan-name>: <grade> — <remaining gaps summary>
```

## Rules

- Execute plans **sequentially** in alphabetical order. Never run plans in parallel.
- The overview plan is **context only** — never grade it.
- Do **NOT** grade plans yourself — only orchestrate via `/fdrop:task:plan-to-A`.
- Do not create commits, branches, or push.
- Pass overrides to every `/fdrop:task:plan-to-A` invocation consistently.
- Each plan gets the full `/fdrop:task:plan-to-A` treatment (up to 5 internal iterations with user interaction for design decisions).
