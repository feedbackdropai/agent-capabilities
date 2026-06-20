---
name: fdrop:task:skill-to-A
description: Iteratively grades and improves a skill until it reaches A grade. Input is a file path.
allowed-tools: Agent, Read, Bash, Edit, Write
---

# Skill to A

## Input

A **file path** to the skill or agent file to improve (e.g., `.claude-plugins/agent-capabilities/skills/fdrop:code:standards/SKILL.md`).

## Architecture

You are the orchestrator. You repeatedly spawn a grading subagent, evaluate its verdict, and if the skill is not yet A grade, apply the suggested fixes yourself before re-grading.

## Instructions

### Step 1: Grade the Skill

Spawn the `fdrop:agent:grade-skill` agent as a subagent (Agent tool, `subagent_type: "fdrop:agent:grade-skill"`) with this prompt:

```
Grade this file: <file-path>
```

The agent loads `/fdrop:tool:grade-skill`, applies the grading rules, and returns the full grade report with the `Grade:` line first.

### Step 2: Evaluate the Grade

Parse the subagent's response for the letter grade.

**If the grade is A (or A+):** Go to Step 4.

**If the grade is below A:** Extract the specific improvement suggestions from the response and proceed to Step 3.

**If no letter grade can be parsed** (the subagent errored, returned no grade, or returned unreadable output): re-spawn the grading subagent once with the same prompt. If the second attempt also yields no parseable grade, stop and report the failure in Step 4, including the raw subagent output — do not loop further or guess a grade.

### Step 3: Apply Fixes

Read the target file and any referenced docs. Apply the suggested improvements directly — you are the one making edits, not a subagent.

Rules for applying fixes:

- Only apply suggestions that the grader explicitly recommended.
- Do not invent additional changes beyond what was suggested.
- Do not add checklist/compliance/verification sections (these are banned project-wide).
- After editing, go back to Step 1 with a fresh subagent.

### Step 4: Report

Report the final grade and a summary of all changes made across iterations:

```
## Skill Graded: <file-path>

| Iteration | Grade | Changes Made |
|-----------|-------|--------------|
| 1         | B+    | Added X, fixed Y |
| 2         | A     | — |

Final grade: A
```

## Rules

- Each grading invocation **must** be a new Agent tool call (fresh context) so the grader evaluates the current state, not a cached view.
- **Maximum 5 iterations.** If the skill has not reached A after 5 rounds, stop and report the current grade with remaining suggestions.
- Do **NOT** delegate editing to subagents — grade via subagent, edit yourself.
- Do not ask clarifying questions — proceed immediately.