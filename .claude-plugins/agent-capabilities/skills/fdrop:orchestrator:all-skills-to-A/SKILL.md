---
name: fdrop:orchestrator:all-skills-to-A
description: Grade all skills and agents to A by discovering targets and dispatching fdrop:task:skill-to-A subagents in parallel batches.
allowed-tools: Agent, Read, Bash
---

# Grade All Skills and Agents

## Input

No input required. The orchestrator automatically discovers all skill and agent files.

# Architecture

You are the orchestrator. You scan for all skill and agent files, dispatch `fdrop:agent:skill-to-A` subagents in parallel batches of 5, and loop until every target has reached A grade.

| Role                       | Spawned By | Responsibility                                                          |
|----------------------------|------------|-------------------------------------------------------------------------|
| **You**                    | User       | Discover targets, dispatch batches, track results, re-dispatch failures |
| **fdrop:agent:skill-to-A** | You        | Grades and improves one target to A (up to 5 internal iterations)       |

# Instructions

## Step 1: Discover Targets

Glob for all skill and agent files under the repo root:

- `**/agents/*.md` — agent definition files
- `**/skills/**/SKILL.md` — skill definition files

Build a deduplicated list of file paths (relative to repo root).

**Exclude these from the list** (they are the grading toolchain itself — modifying them mid-run is unsafe):

- `fdrop:orchestrator:all-skills-to-A` (this orchestrator)
- `fdrop:agent:skill-to-A` (the grading agent)
- `fdrop:task:skill-to-A` (the grading task skill)
- `fdrop:tool:grade-skill` (the grading tool)

Report the full target list before proceeding.

## Step 2: Dispatch a Batch

Take the next **up to 5** un-graded targets from the list. Spawn one `fdrop:agent:skill-to-A` subagent per target (using the Agent tool with `subagent_type: "fdrop:agent:skill-to-A"` and `mode: "bypassPermissions"`), all in a **single message** so they run in parallel.

Prompt for each subagent:

```
Grade and improve this target to A grade: <target-path>
```

where `<target-path>` is the relative file path discovered in Step 1.

## Step 3: Collect Results

When the batch completes, parse each subagent's response. The agent reports with `Final grade: <grade>` in its output. Extract:

- Target name
- Final grade (A, A-, B+, etc.)
- Number of iterations used

Add results to the running tracker. Print a progress update after each batch:

```
Batch N complete: X/Y targets graded so far.
- <target>: <grade> (N iterations)
...
Remaining: Z targets
```

## Step 4: Loop or Re-dispatch

After all targets have been dispatched at least once:

**If all targets are at A grade** → go to Step 5.

**If some targets are below A** → re-dispatch them in a new round of batches (back to Step 2). Each target gets a maximum of **2 dispatches** (dispatches x 5 internal iterations = 10 total grading attempts). If a target is still below A after 2 dispatches, mark it as stuck and do not re-dispatch.

## Step 5: Report

Produce the final consolidated report:

```
# Grade All — Final Report

| # | Skill/Agent | Final Grade | Dispatches | Notes |
|---|-------------|-------------|------------|-------|
| 1 | fdrop:code:standards | A | 1 | — |
| 2 | fdrop:agent:feature-executor | A | 1 | — |
| ... | ... | ... | ... | ... |

Total: X/Y reached A grade.

[If any did not reach A:]
### Did Not Reach A
- <target>: <grade> — <remaining suggestions from last grading>
```

## Rules

- Each subagent **must** be a new Agent tool call (fresh context).
- **Batch size: 5.** Launch up to 5 subagents simultaneously in a single message. Never exceed 5.
- **Maximum 2 dispatches per target.** Do not re-dispatch a target more than once.
- Do **NOT** grade or edit skills yourself — only orchestrate subagents.
- Do not ask clarifying questions — proceed immediately.
- Run subagents in the **foreground** so you can parse their results before continuing.