---
name: fdrop:orchestrator:plan
description: Orchestrates plan creation by exploring the codebase, interviewing the user on design decisions, drafting a plan from a template, and grading it to A. Input is a feature description or a rough-notes file path. Output is an A-grade plan ready for /fdrop:orchestrator:implement.
allowed-tools: Agent, Read, Bash, Skill, Write, Edit
---

# Input

You will receive one of:

- **Feature description** — a direct description of what to build
- **Rough-notes file path** — a path to a file containing informal notes, requirements, or a draft plan to formalize

## Flags (optional)

Flags are appended after the input.

| Flag | Effect |
|------|--------|
| `--skip-interview` | Skip Step 2 (user interview). Derive design decisions from the input alone and mark each one as an **assumption** in the plan's Design Decisions table. Use for non-interactive contexts or when the input is already a detailed spec. |

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
|-----|---------|---------|
| `code-standards` | `/fdrop:code:standards` | Skill name or file path passed to the plan-writer and grading agents for codebase conventions |
| `extra-context` | (none) | Additional skills/docs passed to downstream agents |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides. Inline `---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

Extract these values early and pass them to downstream agents as described in Steps 4 and 5.

# Architecture

You are the orchestrator. You run in the main conversation (the interview requires user interaction — never delegate it to a subagent). You gather codebase facts via explore subagents, lock design decisions with the user, delegate drafting to a fresh-context plan-writer, and converge the result to an A grade.

| Step | Agent | Purpose |
|------|-------|---------|
| 0 | - | Parse input, name the plan |
| 1 | `Explore` subagent(s) | Gather verified codebase facts |
| 2 | - (main loop) | Interview the user, lock design decisions |
| 3 | - | Scope check, decide single plan vs. phases |
| 4 | `fdrop:agent:plan-writer` | Draft the plan file(s) (retry gate) |
| 5 | `/fdrop:task:plan-to-A` (Skill) | Grade to A |
| 6 | - | Final report & handoff |

The drafting step is deliberately a fresh-context subagent: if the plan-writer cannot produce the plan from your decisions record and facts alone, the implementing agent could not have implemented from the plan either. Do not draft the plan yourself.

# Instructions

## Step 0: Parse Input

1. Extract the feature description (read the rough-notes file if a path was given), flags, and overrides.
2. Derive a kebab-case plan name from the feature (e.g., "wire up tag talk" → `wire-up-tag-talk`).
3. Plan files live in `.claude/plans/`. Create the directory if it does not exist.

## Step 1: Explore

Spawn `Explore` subagent(s) (Agent tool, `subagent_type: "Explore"`) to gather the facts the plan must be grounded in. Use one explorer for a feature touching a single area; up to **3 in parallel** for features spanning multiple packages or layers, each scoped to one area.

Each explorer's prompt must request, for its area:

- **Affected packages** — which `packages/<name>/` directories (or single-package root) the feature touches
- **Files to modify** — exact paths of existing files the feature will change, with a one-line description of each file's current role
- **Patterns to mirror** — exact paths of existing files that implement the closest analogous feature, and what to take from each
- **Integration points** — modules, services, types, and interfaces the feature must connect to, with their actual names and signatures
- **Scripts** — the `check` and `test-unit` (or equivalent) script names in each affected package's `package.json`
- **Naming conventions** — the file-naming pattern used in the target directories

Instruct explorers to return verified paths and concise facts, not file contents. Collect all results into a single **facts list** before proceeding.

## Step 2: Interview

**If `--skip-interview` was passed**, derive the design decisions yourself from the input and facts, record each as an assumption, and proceed to Step 3.

Interview the user to resolve every design decision the plan depends on. Walk down each branch of the decision tree, resolving dependencies between decisions one by one.

**Rules:**

- Never ask a question the codebase can answer — spawn another explorer or check directly instead. Only genuine design decisions reach the user: what to build, how it should behave, edge-case handling, tradeoffs between valid approaches.
- For each question, provide your recommended answer as the first option.
- Batch related questions, up to 4 per message. Ask via normal text output — the user responds in the next turn.
- Continue until no unresolved branches remain. If the tree is large, prioritize decisions that change the plan's structure over those that change details.

Record the outcome as a **decisions record**: one row per decision with the decision, the chosen answer, and a one-line rationale.

## Step 3: Scope Check

Estimate the count of source files the feature requires creating or modifying (excluding test files, barrel files, and type-only files).

- **Single plan:** estimate is **40 or fewer** files and the work has no hard sequential stages. Output: `.claude/plans/<plan-name>.md`.
- **Overview + phases:** estimate exceeds 40 files (buffer below the feature-executor's 50-file guardrail), or the work has natural sequential stages (e.g., schema before service before UI). Output: `.claude/plans/<plan-name>.md` (overview) plus `.claude/plans/<plan-name>/phase<N>-<slug>.md` per phase. Each phase must itself fit within 40 files.

## Step 4: Draft (Retry Gate)

Read [plan-template.md](./docs/plan-template.md). Spawn **one** `fdrop:agent:plan-writer` subagent (Agent tool, `subagent_type: "fdrop:agent:plan-writer"`) for all plan files — a single spawn keeps cross-phase chaining consistent. The prompt must contain:

1. The feature description
2. The decisions record from Step 2
3. The facts list from Step 1
4. The output path(s) from Step 3, and which template variant applies to each file
5. The full template content, inlined
6. If overrides were extracted, append them (only include keys that were present):

```
---
code-standards: <value>
extra-context:
  - <path-1>
scripts:
  check: <value>
  test-unit: <value>
---
```

Do **NOT** add workflow instructions — the agent knows its process.

**Gate check** — when the agent returns, parse the first line of its report:

- **`PLAN_DRAFTED`:** Record the written file paths and proceed to Step 5.
- **`PLAN_DRAFTED: ERROR` with discrepancies** (e.g., a fact references a path that does not exist): Resolve the discrepancy — re-explore or correct the facts list — and re-spawn with the corrected inputs. **Maximum 2 retry spawns.** If still failing, stop and report the discrepancies to the user.

## Step 5: Converge to A

Invoke the plan-to-A loop via the Skill tool:

- **Single plan:** `/fdrop:task:plan-to-A .claude/plans/<plan-name>.md`
- **Overview + phases:** one invocation per phase, sequentially, passing the overview first: `/fdrop:task:plan-to-A .claude/plans/<plan-name>.md .claude/plans/<plan-name>/phase<N>-<slug>.md`. The overview is graded only as context for its phases, not standalone.

If overrides were extracted, append the same fenced block to each invocation. The plan-to-A skill owns its own iteration caps and may ask the user design questions — let it.

## Step 6: Final Report

```
## Plan Ready: <plan-name>

| File | Grade | Iterations |
|------|-------|------------|
| .claude/plans/<plan-name>.md | A | 2 |
| ... | ... | ... |

### Design Decisions
- <decision>: <choice>
- ...

Next: /fdrop:orchestrator:implement .claude/plans/<plan-name>.md
```

For multi-phase plans, suggest `/fdrop:orchestrator:implement-all .claude/plans/<plan-name>/` instead. If any file did not reach A within plan-to-A's caps, report its grade and remaining gaps instead of the handoff line.

## Rules

- Run in the main conversation. Steps 2 and 5 require user interaction and cannot run inside a subagent.
- Do **NOT** draft plan content yourself — delegate to `fdrop:agent:plan-writer`. Your job is facts, decisions, scope, and orchestration.
- Do **NOT** implement any feature code, write tests, or modify source files. The only files you create are under `.claude/plans/` (via the plan-writer).
- Each plan-writer spawn **must** be a new Agent tool call (fresh context).
- Do not create commits, branches, or push.
- Do not ask the user anything the codebase can answer.
