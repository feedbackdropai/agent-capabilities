---
name: fdrop:tool:grade-skill
description: Grades a skill or agent file's quality on nine axes and returns a letter grade with evidence-backed gaps and fixes. Use when reviewing or improving an existing skill or agent.
allowed-tools: Read, Bash
---

# Grade Skill

Grade a skill for whether an agent following only that skill would reliably do the job it claims to do.

## Input

A skill name, or a path to a skill's `SKILL.md` or an agent's `.md` file.

```
/grade-skill <skill-name | path/to/SKILL.md | path/to/agent.md>
```

## Procedure

### Step 1 — Establish the claimed contract

Read the target skill fully, including any files in its `references/`. Then write one sentence:

> Given **X**, this skill does **Y**, producing **Z**.

This sentence is the yardstick for every axis below. You cannot judge whether a skill works without first pinning down what it is supposed to do.

### Step 2 — Probe effectiveness (simulation only)

Derive 2–3 representative invocations from the contract, including at least one adverse or edge input (empty, malformed, or out-of-scope). Do **not** execute the skill — simulate it: trace, step by step, how an agent following only this skill would handle each invocation.

Record every point where the agent would stall, guess, or produce a wrong result. These are the backbone of the grade.

**What this proves:** simulation establishes that the procedure is *complete* — no missing branch, undefined exit, or ambiguous "what now?" point. It does **not** prove the skill produces *correct output* at runtime (whether a spawned agent writes good code, whether an auto-detected command is the right one). A Pass on Effectiveness means "the procedure has no holes," not "the results are good." Do not flag runtime-output quality as an Effectiveness gap — it is unobservable without executing.

### Step 3 — Inspect the static axes

Answer each axis question below with a cited location (line or section) for any failure. For Integrity (#7), verify against reality with `ls`/`grep` — do referenced paths, tools, and skills actually exist?

| # | Axis | Question it must pass | Fails when |
|---|------|-----------------------|------------|
| 1 | Effectiveness | On the Step 2 invocations, does the agent reach the intended outcome? | It stalls, guesses, or produces a wrong result |
| 2 | Altitude | Are instructions specific enough to be reliable, loose enough not to break on normal variation? | Vague ("do it well") or brittle (hardcoded steps that break on minor input changes) |
| 3 | Clarity | Does every instruction have exactly one reading? | Ambiguous wording, contradictions, or undefined terms |
| 4 | Scope | Does it do one coherent job with a clear boundary? | Sprawls across unrelated tasks, or the boundary is undefined |
| 5 | Robustness | Does it handle bad/empty/unexpected input and step failure? | Only the happy path; no recovery or stop conditions |
| 6 | Completeness & self-containment | Is everything needed present? **Sub-check: could a fresh context window execute this from the skill alone, assuming nothing from prior conversation?** | Missing steps, or relies on unstated setup / prior context |
| 7 | Integrity & contract | Do referenced paths/tools/skills exist, and are input + output shapes defined? | Dead references, over/under-granted tools, undefined I/O |
| 8 | Context efficiency | Is the body lean, with bulk pushed to references and no duplication? | Bloated inline material or repeated content |
| 9 | Description | Does the description state what it does and when to use it? | Vague, inaccurate, or missing the trigger |

#### If the target is an agent file

An agent file (frontmatter `name`/`description`/`model`, then a procedural body) is graded on the same nine axes, with three adjustments — an agent runs autonomously in its own context and hands results back to an orchestrator, so:

- **Axis 7 (Integrity):** an agent's tools come from the agent registry, **not** an `allowed-tools` frontmatter key. Do not flag a missing `allowed-tools`. Judge tool grant by what the body actually uses versus what the registry/frontmatter declares (if present).
- **Axes 5 + 6 (Robustness, Completeness):** the agent must also (a) validate its inputs and return early on bad input, (b) define a stop/failure condition rather than running unbounded, and (c) report back in a shape the orchestrator can consume. A missing reporting contract or input-validation step is a gap here.
- **Axis 9 (Description):** the description must state **when to launch/dispatch** the agent (the trigger an orchestrator keys on), not when to load it in-context.

### Step 4 — Aggregate to a grade

Give each axis a verdict: **Pass / Minor / Major**.

**Cap rule:** a **Major** on Effectiveness (#1) or Completeness & self-containment (#6) caps the grade at **C**, regardless of how polished the rest is — a skill that won't work, or won't run in a fresh context, is not a good skill.

| Grade | Meaning |
|-------|---------|
| A  | All axes pass. No gaps. |
| B+ | 1–2 Minor gaps, no Major. |
| B  | 3+ Minor gaps, or one non-capping Major. |
| C  | Multiple Majors, or the cap rule triggered. |
| D  | Skeleton — missing core sections or no usable procedure. |

### Step 5 — Report

```
Grade: <A | B+ | B | C | D>
Skill: <skill-name>
Gaps: <n>

[If not A:]
| # | Axis | Gap | Evidence | Suggested Fix |
|---|------|-----|----------|---------------|
| 1 | ...  | ... | <location or failing scenario> | ... |
```

If the grade is A, the table is empty (0 gaps).

## Discipline rules

- An A is a real grade. Do not invent gaps to justify the output.
- Only flag a gap you would defend under pushback. If a single "are you sure?" would make you retract it, it isn't a gap — drop it.
- Every gap must cite evidence: a line/section, or a failing scenario from Step 2.
- Flag only what would change the grade or cause failure. "Could be nicer" is not a gap.
- **Wrapper agents** exist solely to make a skill spawnable via the Agent tool. Do not penalize thin wrapping — that IS the design.
