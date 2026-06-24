---
name: fdrop:tool:friction-review
description: Aggregates captured friction logs into a prioritized, actionable triage report. Use when a maintainer wants to review the friction agents have logged across runs and decide what to fix in the orchestrator, agents, or skills.
allowed-tools: Read, Bash
---

# Friction Review

Close the friction-protocol loop. The capture hook (see `fdrop:protocol:friction`) writes one file per run to `.fdrop/runs/<session-id>.md`, each holding raw `FRICTION[...]` / `DECISION[...]` markers. Those logs are write-only until someone triages them. This skill reads every run, clusters the markers by what they implicate and how often they recur, and produces a ranked list of concrete fixes — turning a pile of one-line notes into a work queue.

## Input

```
/fdrop:tool:friction-review [<glob>] [--archive]
```

- `<glob>` — optional; which run files to read. Defaults to `.fdrop/runs/*.md`.
- `--archive` — after reporting, move the reviewed run files to `.fdrop/runs/archive/` so the next review only sees new friction. Off by default (re-running is safe and idempotent without it).

## Procedure

### Step 1 — Collect

List the run files (`ls -1 <glob>` — default `.fdrop/runs/*.md`). If none exist or all are empty, report "No friction logged — nothing to review." and stop. An empty corpus is valid signal, not an error.

Read every matching file. Each marker line looks like:

```
- [<agent-type>] FRICTION[<target>]: <note>
- DECISION[<target>]: <note>
```

Parse each into `{ kind, target, agent, note, run }` where `run` is the session id from the filename. Ignore lines that don't match — they're file headers or prose.

### Step 2 — Cluster

Group markers into **issues**. Two markers belong to the same issue when they describe the same underlying problem — judge this by meaning, not string equality (e.g. "plan referenced oldUtil.ts" and "plan path utils/old.ts missing" are one issue: *stale paths in plans*). This semantic clustering is the core of the skill; do not collapse only on exact-match.

For each issue record:

- **target** — the routing target shared by its markers (`orchestrator`, `agent:<name>`, `skill:<name>`, `plan`, `config`). If markers in one cluster disagree on target, keep the most specific and note the spread.
- **count** — how many markers fall in it.
- **runs** — how many distinct runs it appeared in (recurrence across runs matters more than raw count within one run).
- **kind mix** — friction vs decision.

### Step 3 — Rank

Order issues by **recurrence first** (distinct `runs`, then `count`), so systemic papercuts rise above one-off blips. Within equal recurrence, order by blast radius: `orchestrator` > `skill:*` (shared) > `agent:*` > `plan` / `config` (single-run).

### Step 4 — Map each issue to a fix

For each issue, resolve the `target` to the artifact a maintainer would edit and propose one concrete change:

| `target` | Artifact to edit |
|----------|------------------|
| `orchestrator` | the orchestrating skill named in the markers (e.g. `skills/fdrop:orchestrator:implement/SKILL.md`) |
| `agent:<name>` | `agents/fdrop:agent:<name>.md` |
| `skill:<name>` | `skills/<name>/SKILL.md` |
| `plan` | the plan template or plan-authoring skill (recurring plan friction implicates the template, not one plan) |
| `config` | the override/config resolution path |

Verify the artifact exists (`ls`) before naming it; if it doesn't, say so rather than inventing a path.

### Step 5 — Report

Output a markdown report (also offer to write it to `.fdrop/friction-review.md`):

```
# Friction Review — <N runs, M markers>

## Top issues
| Rank | Issue | Target | Runs | Count | Artifact | Suggested fix |
|------|-------|--------|------|-------|----------|---------------|
| 1 | stale paths in plans | plan | 4 | 6 | skills/.../plan template | <one concrete change> |
| ... |

## One-offs
- <issues that appeared in a single run — list briefly, not in the main table>

## Notable decisions
- <DECISION clusters worth turning into explicit plan/config defaults>
```

Lead with the issues that recur across the most runs — those are where a single fix removes the most future friction.

### Step 6 — Archive (only if `--archive`)

`mkdir -p .fdrop/runs/archive` and move every reviewed file into it. Report how many were archived. Without the flag, leave the logs in place.

## Discipline rules

- **Cluster by meaning, report by recurrence.** A note seen once in one run is a one-off; the same problem across four runs is the headline. Don't bury recurrence under raw counts.
- **Every issue names a real, existing artifact and a concrete fix.** "Improve the plan" is not a fix; "add a stale-path check to the plan template's preflight" is.
- **Never edit code or skills here** — this skill only reports. Fixing is a separate, deliberate step the maintainer takes after reading.
- **Don't fabricate friction.** If the logs are thin, say so. A short report from a clean corpus is the correct output.
