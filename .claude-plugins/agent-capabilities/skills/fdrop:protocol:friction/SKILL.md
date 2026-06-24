---
name: fdrop:protocol:friction
description: Shared contract for logging friction and notable decisions encountered during a run. Use when an agent hits confusion, a doc/skill fails to load, a plan is stale or ambiguous, a guess has to be made, or anything unexpected happens — so the maintainer can improve the orchestrator, agents, and skills.
allowed-tools: Read
---

# Friction Protocol

The single source of truth for how agents record **friction** (things that went wrong or were confusing) and **decisions** (choices made when the input was silent) during a run. A plugin hook scrapes these markers from the session transcript into `.fdrop/runs/<session-id>.md` for later review. This is a feedback loop: every marker is a candidate improvement to the orchestrator, an agent, or a skill.

## When to Use

Any agent that does real work should follow this protocol. **Stay alert for friction from the start of your run** — friction happens throughout the work, not just at the end, and you must remember it for your final report.

## What counts as friction

Emit a `FRICTION` marker when any of these happen:

- **Confusion** — you were unsure what was being asked or how something worked.
- **Doc/skill load failure** — a skill or file you were told to load returned an error or empty output.
- **Stale reference** — a path, module, or API the plan referenced did not exist on disk.
- **Ambiguity** — the plan or input was vague and you could not proceed without interpreting.
- **Unexpected behavior** — a command, test, or tool behaved in a way you did not expect.

Emit a `DECISION` marker when the input was **silent** and you had to choose:

- You guessed at an unspecified detail to keep moving.
- You picked one of several reasonable approaches the plan did not settle.

If the run was smooth, **emit nothing** — an empty log is valid signal (it means the run was clean).

## Marker syntax

Each marker is a single line. Put them in a `## Friction` section of your **final report** (see Placement):

```
FRICTION[<target>]: <one line — what happened, concretely>
DECISION[<target>]: <one line — what you chose and why the input was silent>
```

### `<target>` — what to fix

The target routes each note to the thing a maintainer would edit. Use exactly one of:

| `<target>` | Use when the note implicates… |
|------------|-------------------------------|
| `orchestrator` | the orchestrating skill that spawned you |
| `agent:<name>` | your own agent definition (e.g. `agent:feature-executor`) |
| `skill:<name>` | a skill or doc (e.g. `skill:fdrop:code:standards`) |
| `plan` | the plan file you were handed |
| `config` | an override/config value or its resolution |

### Examples

```
FRICTION[skill:fdrop:code:standards]: load returned empty — extra-code-standards path did not resolve
FRICTION[plan]: plan referenced packages/api/src/oldUtil.ts which no longer exists
DECISION[plan]: plan didn't name the target package, inferred "web" from the file paths
```

## Placement — critical

Markers **must** appear in your **final report** (the text you return to the orchestrator), not buried mid-run. The hook only reads the main session transcript, and only your final report reliably lands there. Mid-work notes are lost. So: track friction as you go, then consolidate it into a single `## Friction` section at the end of your report.
