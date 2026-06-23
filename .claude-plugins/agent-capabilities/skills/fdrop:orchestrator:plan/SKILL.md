---
name: fdrop:orchestrator:plan
description: Orchestrates plan creation by exploring the codebase, eliciting the user's full knowledge of the task, drafting a plan from a template, grilling the draft for edge cases, and grading it to A. Input is a feature description or a rough-notes file path. Output is an A-grade plan ready for /fdrop:orchestrator:implement.
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
| `--skip-elicitation` | Skip Step 2 (Elicitation). Derive design decisions from the input alone and mark each one as an **assumption** in the plan's Decision Log. Use for non-interactive contexts or when the input is already a detailed spec. |
| `--skip-grill` | Skip Step 5 (Grill). Use for non-interactive contexts. Implied by `--skip-elicitation` (the grill is interactive and cannot run without the user). |

## Overrides (optional)

This skill passes through `code-standards`, `extra-code-standards`, and `scripts` to the plan-writer and grading agents. Resolve each with precedence **inline `---` block > `fdrop-agent-capabilities-config.json` at repo root > default** — see [`docs/config.md`](../../docs/config.md) for the full field reference.

Extract these values early and pass them to downstream agents as described in Steps 4 and 5.

# Architecture

You are the orchestrator. You run in the main conversation (Elicitation and Grill require user interaction — never delegate them to a subagent). You gather codebase facts via explore subagents, drain the user's knowledge into a shared understanding, delegate drafting to a fresh-context plan-writer, grill the draft for edge cases, and converge the result to an A grade via a non-interactive grading subagent. Questions are front-loaded into Elicitation (Step 2) and Grill (Step 5); the convergence step (Step 6) only surfaces design gaps that slipped through — because the grading subagent cannot ask the user, it returns them to you, and you ask on its behalf.

| Step | Agent | Purpose |
|------|-------|---------|
| 0 | - | Parse input, name the plan |
| 1 | `Explore` subagent(s) | Gather verified codebase facts |
| 2 | - (main loop) | **Elicitation** — extract the user's full knowledge of the task, converge to shared understanding |
| 3 | - | Scope check, decide single plan vs. phases |
| 4 | `fdrop:agent:plan-writer` | Draft the plan file(s) (retry gate) |
| 5 | `/fdrop:tool:grill-me` (Skill) | **Grill** the drafted plan for edge cases, fold answers in continuously |
| 6 | `fdrop:agent:plan-to-A` | Grade to A; surface any leftover design gaps to the user, fold in, re-spawn |
| 7 | - | Final report & handoff |

Elicitation and Grill are two distinct passes on purpose. **Elicitation** is bounded by the user's conscious knowledge — it drains what they *can* articulate and ends when they are tapped out. **Grill** runs against the *drafted artifact* and is unbounded — it pushes past the user's conscious knowledge to surface edge cases they could not reach on their own. You cannot grill an idea, only a concrete plan; that is why the grill comes after the draft, not before.

The drafting step is deliberately a fresh-context subagent: if the plan-writer cannot produce the plan from your decisions record and facts alone, the implementing agent could not have implemented from the plan either. Do not draft the plan yourself.

# Instructions

## Step 0: Parse Input

1. Extract the feature description (read the rough-notes file if a path was given), flags, and overrides. If a rough-notes path was given but the file does not exist or is empty, stop and ask the user to confirm the path or provide the feature description inline before proceeding.
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

## Step 2: Elicitation

**If `--skip-elicitation` was passed**, derive the design decisions yourself from the input and facts, record each as an assumption, and proceed to Step 3.

Your goal is to **extract every bit of knowledge the user holds about this task and converge on a shared understanding of it.** Two halves, looped together:

- **Extract** — draw out what the user has not yet said: intent, requirements, constraints, how it should behave, tradeoffs between valid approaches.
- **Converge** — reflect each answer back and confirm, so that by the end agent and user hold the *same* model of the plan. Shared understanding is how you know the extraction is complete.

Walk down each branch of the decision tree, resolving dependencies between decisions one by one.

**Rules:**

- Never ask a question the codebase can answer — spawn another explorer or check directly instead. Only knowledge that lives in the user's head reaches the user.
- For each question, provide your recommended answer as the first option.
- Batch related questions, up to 4 per message. Ask via normal text output — the user responds in the next turn.
- Continue until the user has **nothing left to add** — 100% certainty on the plan's intent and requirements, no further questions. This phase is bounded by the user's own knowledge; it ends when they are tapped out and aligned, not when you decide the tree is "big enough." Do **not** trade detail for brevity or prioritize structure over detail to cut it short — capture the most detailed plan the user is capable of producing.

Record the outcome as a **decisions record**: one row per decision capturing the question, the options considered, the chosen answer, and a one-line rationale. This becomes the plan's **Decision Log** (Source: `Elicitation`) when the plan-writer drafts the plan in Step 4.

This maximally-detailed, mutually-understood baseline is what lets the Grill step (Step 5) push past the user's conscious knowledge. If Elicitation stops short, the grill wastes itself re-eliciting what the user already knew instead of surfacing what they could not reach.

## Step 3: Scope Check

Estimate the count of source files the feature requires creating or modifying (excluding test files, barrel files, and type-only files).

- **Single plan:** estimate is **40 or fewer** files and the work has no hard sequential stages. Output: `.claude/plans/<plan-name>.md`.
- **Overview + phases:** estimate exceeds 40 files (buffer below the feature-executor's 50-file guardrail), or the work has natural sequential stages (e.g., schema before service before UI). Output: `.claude/plans/<plan-name>.md` (overview) plus `.claude/plans/<plan-name>/phase<N>-<slug>.md` per phase. Each phase must itself fit within 40 files.

## Step 4: Draft (Retry Gate)

Read [plan-template.md](./references/plan-template.md). Spawn **one** `fdrop:agent:plan-writer` subagent (Agent tool, `subagent_type: "fdrop:agent:plan-writer"`) for all plan files — a single spawn keeps cross-phase chaining consistent. The prompt must contain:

1. The feature description
2. The decisions record from Step 2
3. The facts list from Step 1
4. The output path(s) from Step 3, and which template variant applies to each file
5. The full template content, inlined
6. If overrides were extracted, append them (only include keys that were present):

```
---
code-standards: <value>
extra-code-standards:
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

## Step 5: Grill

**If `--skip-grill` or `--skip-elicitation` was passed**, skip this step and proceed to Step 6.

With a drafted plan now on disk, grill it for everything Elicitation could not reach. Elicitation captured what the user *consciously knows*; the grill exists to surface what they *can't* — edge cases, missed states, unhandled failures, ambiguous behaviors — and harden the plan beyond the user's own ability.

Invoke `/fdrop:tool:grill-me` via the Skill tool, pointed at the drafted plan file(s) from Step 4. Follow its approach: relentless, **one question at a time**, and explore the codebase instead of asking whenever a question is answerable there.

This step is the inverse of Elicitation: it is **unbounded** — it does not stop because a decision tree is exhausted, but only when the user calls it.

**Rules for this step:**

- Ask **one question at a time**. For each, provide your recommended answer as the first option.
- After each answer, **immediately fold the resolution into the plan file** via Edit, so the plan stays current throughout the grill. Do **not** batch edits to the end.
- For each answer that **establishes or changes a decision or an edge-case handling**, also append a row to the plan's **Decision Log** with Source = `Grill` (the question, the options considered, the choice, and a one-line rationale). Skip pure confirmations — do not log questions whose answer changed nothing.
- Continue until **the user says they are done.** Do not self-terminate because questions feel exhausted.
- For multi-phase plans, grill each phase file and fold answers into the relevant file (and the overview when the resolution is cross-cutting).

## Step 6: Converge to A

Grade each plan file to A by spawning the **`fdrop:agent:plan-to-A`** subagent (Agent tool, `subagent_type: "fdrop:agent:plan-to-A"`) and running a converge-and-surface loop. The agent is non-interactive — it applies mechanical fixes itself and **returns** any design-decision gaps under "Unresolved — needs upstream decision" rather than asking. You are in the main conversation, so you surface those to the user, fold their answers into the plan, and re-spawn.

For a well-elicited, well-grilled plan this loop surfaces nothing — it is a **backstop** for design gaps that slipped past Steps 2 and 5, not a third question phase.

**Targets:**

- **Single plan:** spawn with the prompt `Grade this plan:` / `Plan: .claude/plans/<plan-name>.md`.
- **Overview + phases:** one file per loop, sequentially; pass the overview path first as context, then the phase path. The overview is graded only as context for its phases, never standalone.

Append the overrides fenced block (if any) to each spawn prompt. Each spawn **must** be a new Agent tool call (fresh context).

**The loop, per plan file:**

1. Spawn `fdrop:agent:plan-to-A` for the file. Parse the `Final grade:` line and any "Unresolved — needs upstream decision" section from its report.
2. Branch on the result:
   - **`Final grade: A` and no unresolved gaps** → this file is done. Move to the next file.
   - **Unresolved design-decision gaps returned** → resolve them (see below), then re-spawn for this file.
   - **Below A with no unresolved design gaps** (only mechanical gaps the agent could not auto-fix within its caps) → record the grade and remaining gaps and move on; report them in Step 7. Do not loop further on this file.

**Resolving unresolved design-decision gaps:**

- **If `--skip-elicitation` was passed** (headless / no user present): do **not** ask. Carry the unresolved gaps to Step 7 and move on.
- **Otherwise:** batch the gaps into a single message (recommended answer first, up to 4 per turn — same style as Elicitation). Ask via normal text output; the user responds in the next turn. For each answer, **fold the resolution into the plan file via Edit** and append a row to the plan's **Decision Log** with Source = `Converge` (the question, options, choice, one-line rationale). For a cross-cutting decision on a phased plan, also update the overview. Then re-spawn `fdrop:agent:plan-to-A` for the file with the updated plan.

**Convergence cap:** at most **3** ask-and-re-spawn rounds per file. If design gaps persist after 3 rounds, stop asking, record the remaining gaps, and carry them to Step 7.

## Step 7: Final Report

```
## Plan Ready: <plan-name>

| File | Grade | Iterations |
|------|-------|------------|
| .claude/plans/<plan-name>.md | A | 2 |
| ... | ... | ... |

### Decision Log
- [<Source>] <decision>: <choice>
- ...

[If any design-decision gaps were left unresolved (headless run, or convergence cap hit):]
### Unresolved — needs decision before implementing
- <file>: <gap> — <what must be decided>

Next: /fdrop:orchestrator:implement .claude/plans/<plan-name>.md
```

For multi-phase plans, suggest `/fdrop:orchestrator:implement-all .claude/plans/<plan-name>/` instead. If any file did not reach A within Step 6's caps, report its grade and remaining gaps (including any unresolved design decisions) instead of the handoff line.

## Rules

- Run in the main conversation. Steps 2 and 5 require user interaction and cannot run inside a subagent; Step 6 interacts only when the grading subagent returns unresolved design gaps (a backstop, skipped under `--skip-elicitation`).
- Do **NOT** draft plan content yourself — delegate to `fdrop:agent:plan-writer`. Your job is facts, decisions, scope, and orchestration.
- Each `fdrop:agent:plan-to-A` spawn **must** be a new Agent tool call (fresh context).
- Do **NOT** implement any feature code, write tests, or modify source files. The only files you create are under `.claude/plans/` (via the plan-writer).
- Each plan-writer spawn **must** be a new Agent tool call (fresh context).
- Do not create commits, branches, or push.
- Do not ask the user anything the codebase can answer.
