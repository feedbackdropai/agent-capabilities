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

Spawn a subagent with this prompt:

```
Load the /fdrop:tool:grade-skill skill via the Skill tool, then grade the following file:
<file-path>

Read the file and apply the grading rules. Return the full grade report.
```

### Step 2: Evaluate the Grade

Parse the subagent's response for the letter grade.

**If the grade is A (or A+):** Go to Step 4.

**If the grade is below A:** Extract the specific improvement suggestions from the response and proceed to Step 3.

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