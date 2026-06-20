---
name: fdrop:orchestrator:all-plans-to-A
description: Grades all plans in a folder to A by discovering plans, spawning the fdrop:agent:plan-to-A subagent on each sequentially, surfacing any design-decision gaps to the user, and looping until all reach A grade.
allowed-tools: Read, Bash, Agent, Edit
---

# All Plans to A

You are an orchestrator. Your job is to take a folder of plan files, identify plans, and drive each to A grade by spawning the `fdrop:agent:plan-to-A` subagent. The subagent is non-interactive: it applies mechanical fixes itself and returns any design-decision gaps it cannot resolve. When you run in the main conversation you surface those gaps to the user, fold the answers into the plan, and re-spawn — the same backstop loop `fdrop:orchestrator:plan` uses in its convergence step.

## Input

A **folder path** containing plan files (`.md` files).

```
/fdrop:orchestrator:all-plans-to-A <folder-path> [--non-interactive]
```

## Flags (optional)

| Flag | Effect |
|------|--------|
| `--non-interactive` | Never ask the user. Carry any unresolved design-decision gaps to the final report instead of surfacing them. Set this when this skill runs headless or is spawned where no user is present (e.g. nested under another orchestrator). |

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|---|---|---|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path loaded by the grading agent for codebase conventions |
| `extra-context` | (none) | Additional skills/docs loaded by the grading agent |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides.
`---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

Extract these values early and pass them to each `fdrop:agent:plan-to-A` spawn.

## Folder Structure

### Mode 1: Plans Only

The folder contains only plan files — each is a self-contained plan.

```
plans/
  pr-updates-1.md
  pr-updates-2.md
  pr-updates-3.md
```

Each plan is graded individually by its own `fdrop:agent:plan-to-A` spawn:

```
Plan: <plan-file-path>
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

Each plan is graded with the overview passed first as context:

```
Overview: <overview-plan-path>
Plan: <plan-file-path>
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

Take the next ungraded plan from the queue. Spawn the `fdrop:agent:plan-to-A` subagent (Agent tool, `subagent_type: "fdrop:agent:plan-to-A"`). Each spawn **must** be a new Agent tool call (fresh context).

**Mode 1** — prompt:

```
Grade this plan:
Plan: <plan-file-path>
```

**Mode 2** — pass the overview first as context:

```
Grade this plan:
Overview: <overview-plan-path>
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

If no overrides were provided, omit the fenced block.

The subagent runs the full grade-fix-regrade loop internally (up to 5 iterations), non-interactively: it applies mechanical fixes and returns its `Final grade:` line plus any design-decision gaps under "Unresolved — needs upstream decision."

### Step 2: Resolve, Re-spawn, Record

Parse the subagent's report: the `Final grade:` line and any "Unresolved — needs upstream decision" section. Then branch:

- **`Final grade: A` and no unresolved gaps** → record and move on.
- **Below A with no unresolved design gaps** (only mechanical gaps the subagent could not auto-fix within its caps) → record the grade and remaining gaps; move on. Do not loop further on this plan.
- **Unresolved design-decision gaps returned** → resolve them, then re-spawn (Step 1) for this same plan:
  - **If `--non-interactive` was passed** (no user present): do **not** ask. Record the plan as not-yet-A with its unresolved gaps and move on.
  - **Otherwise:** batch the gaps into a single message (recommended answer first, up to 4 per turn). Ask via normal text output; the user responds in the next turn. For each answer, **fold the resolution into the plan file via Edit** and append a row to the plan's **Decision Log** with Source = `Converge` (question, options, choice, one-line rationale). For a cross-cutting decision on a Mode 2 plan, also update the overview. Then re-spawn `fdrop:agent:plan-to-A` for the plan.
  - **Convergence cap:** at most **3** ask-and-re-spawn rounds per plan. If gaps persist after 3 rounds, stop asking, record the remaining gaps, and move on.

Record the outcome in the results log. Print a progress update:

```
Plan <N>/<total> complete: <plan-name> → <grade> (<iterations> iterations, <rounds> ask rounds)
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

[If any design-decision gaps were left unresolved (--non-interactive, or convergence cap hit):]
## Unresolved — needs decision
- <plan-name>: <gap> — <what must be decided>
```

## Rules

- Execute plans **sequentially** in alphabetical order. Never run plans in parallel.
- The overview plan is **context only** — never grade it.
- Do **NOT** grade plans yourself — only orchestrate by spawning `fdrop:agent:plan-to-A`. Resolving design-decision gaps (asking the user, folding answers into the plan) is your responsibility.
- Each `fdrop:agent:plan-to-A` spawn **must** be a new Agent tool call (fresh context).
- Do not create commits, branches, or push.
- Pass overrides to every `fdrop:agent:plan-to-A` spawn consistently.
- Only ask the user about genuine design decisions the subagent surfaced as unresolved — never about gaps it can fix mechanically. Under `--non-interactive`, never ask; carry unresolved gaps to the report.
