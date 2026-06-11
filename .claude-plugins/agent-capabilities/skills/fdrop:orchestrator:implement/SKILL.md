---
name: fdrop:orchestrator:implement
description: Orchestrates feature implementation by sequentially spawning build, test, and refactor agents with verification gates between each step. Input is a feature description, a plan file path, or a plan in conversation context. Supports --skip-refactor flag to skip the refactor step.
allowed-tools: Agent, Read, Bash, skill
---

# Input

You will receive one of:

- **Plan in context** — a plan already present in the conversation history from a prior planning phase
- **Plan file path** — a path to a plan file (e.g., `.claude/plans/my-plan.md`)
- **Overview plan + phase file** — two paths: an overview plan (high-level context, goals, architecture) followed by a phase file (specific implementation scope). Example: `.claude/plans/wireUpTagTalk.md .claude/plans/wireUpTagTalk/phase1-lazy-init.md`
- **Feature description** — a direct description of what to implement

## Flags (optional)

Flags are appended after the input (plan path or description).

| Flag | Effect |
|------|--------|
| `--skip-refactor` | Skip Steps 5 and 6 (refactor + post-refactor verification). Proceed directly from Step 4 to Step 7. |

## Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key                 | Default                         | Purpose                                                                 |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `code-standards`    | `/fdrop:code:standards`           | Skill name or file path loaded by feature-executor and refactor-executor for coding rules |
| `unit-test-standards` | `/fdrop:code:tests:unit:jest`   | Skill name or file path loaded by unit-test-writer and refactor-executor for test conventions |
| `extra-context`     | (none)                          | Additional skills/docs loaded by downstream agents before coding |
| `scripts`           | (auto-detected)                 | Map of script key → full command (use `{package}` placeholder for monorepo) |

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides. Inline `---` blocks take precedence over config file values for any key specified in both. If neither is present, all defaults apply.

Extract these values early and pass them to subagents as described in Step 1.

# Architecture

You are the orchestrator. You spawn specialized agents in sequence, running verification between each step to catch issues early and decide whether to retry or proceed.

| Step | Agent                           | Purpose                                      |
| ---- | ------------------------------- | -------------------------------------------- |
| 0    | -                               | Clean-slate verification (hard gate)         |
| 1    | `fdrop:agent:feature-executor`    | Implement the feature                        |
| 2    | -                               | Post-implementation verification (retry gate) |
| 3    | `fdrop:agent:unit-test-writer`    | Write tests for changed files                |
| 4    | -                               | Post-test verification (retry gate)          |
| 5    | `fdrop:agent:refactor-executor`   | Refactor changed code                        |
| 6    | -                               | Post-refactor verification (retry gate)      |
| 7    | -                               | Final report                                 |

# Instructions

## Step 0: Clean-Slate Verification (Hard Gate)

Before any implementation begins, the codebase must be green. This ensures agents start from a known-good state so any errors introduced are unambiguously theirs to fix.

1. Detect repo type:
   - If target file paths live under `packages/<name>/...` → **monorepo**. Read that package's `package.json` for its `name` field.
   - Otherwise → **single-package repo**.
   - To discover available packages, run the package manager's workspace listing command.
2. Determine which package(s) the feature will affect:
   - If a plan references file paths, check if they live under `packages/<name>/`.
   - If a feature description mentions a package or area, infer it.
   - If you cannot determine the target, ask the user which package(s) this feature affects — do not guess.
3. Resolve commands and run verification:

### Script Resolution

If `scripts` overrides are provided, use the full commands directly (replacing `{package}` with the actual package name for monorepo targets). If no overrides are provided, detect the package manager from the lockfile and construct commands automatically.

Scripts used by this orchestrator:

| Key | Purpose |
|-----|---------|
| `check` | Type checking |
| `test-unit` | Unit tests |

Run the resolved `check` and `test-unit` commands for each affected package.

**If any command fails:** Report the exact failures to the user and **stop immediately**. The codebase must be green before implementation begins. This is a hard gate — there are no retries.

**If all pass:** Record the verified packages and proceed to Step 1.

## Step 1: Implement Feature

Spawn `fdrop:agent:feature-executor` as a **subagent** (Agent tool, `subagent_type: "fdrop:agent:feature-executor"`) with a prompt containing:

1. The feature input:
   - **Plan in context:** Inline the relevant plan content
   - **Plan file path:** Implement the feature described in this plan: <plan-path>
   - **Overview plan + phase file:** `Implement the feature described in this phase plan: <phase-path>\n\nRead this overview plan for high-level context: <overview-path>`.
   - **Feature description:** Pass the description directly

2. If overrides were extracted, append them to the prompt (only include keys that were present in the input):

```
---
code-standards: <value>
extra-context:
  - <path-1>
  - <path-2>
scripts:
  check: <value>
  test-unit: <value>
---
```

Do **NOT** add workflow instructions — the agent knows its process. Only provide the feature input and any overrides.

When the agent returns, extract from its report:

- The **list of changed files** needed for Steps 3 and 5
- Whether it reported **success** or **failure**
- Any **failure details** if applicable

**Gate check:** If the agent reported **zero changed files** or indicated it **terminated before implementing** (e.g., stale plan references, ambiguity, validation failure), **stop and report the failure to the user**. Do not proceed to Step 2 — the feature was not implemented, and passing verification on an unchanged codebase would produce a misleading success report.

## Step 2: Post-Implementation Verification (Retry Gate)

Run the resolved `check` and `test-unit` commands for each affected package.

**If verification passes:** Snapshot the changed file list by running `git diff --name-only HEAD` and `git ls-files --others --exclude-standard` (to capture both modified and newly created untracked files), and merge the results into your tracked file list. Then proceed to Step 3.

**If verification fails:** Re-spawn `fdrop:agent:feature-executor` with error context. Include the original task input (plan content, plan file path, or feature description) so the agent can orient itself:

```
The feature was implemented but verification failed. Here are the errors to fix:

<error output from the failed commands>

Original task:
<the original plan content, plan file path, or feature description that was passed in Step 1>

Previously changed files:
<file list from Step 1>
```

If overrides were extracted from the input, append them to the retry prompt (same format as Step 1).

**Maximum 2 retry spawns.** If verification still fails after retries, **stop** and report the failures to the user. Do not proceed to test writing with broken code.

## Step 3: Write Tests

From the changed files list, select only `.ts`/`.tsx` source files eligible for testing. Exclude non-TypeScript files, barrel files (`index.ts`), type-only files, and test files.

**If no eligible source files remain after filtering**, skip Steps 3 and 4 entirely — proceed directly to Step 5.

**Map each eligible file to its test target:**

- **Boundary file** (a module's public surface — root-layer `common/` leaf modules, feature public exports, `.service`/`.resolver`/`.controller` files, a graduated folder's main file) → targets itself.
- **Internal file** (under a module's `common/` — parent folder is a feature/route/screen/component/class folder, not a root layer) → targets its owning module's boundary file(s).

Deduplicate the targets. For each target, spawn `fdrop:agent:unit-test-writer` as a subagent (`subagent_type: "fdrop:agent:unit-test-writer"`):

```
Write unit tests for the following file:

<boundary-file-path>

[If changed internals map to this boundary:]
The following changed internal files must reach 100% coverage through this boundary's tests:
<internal-file-path-1>
<internal-file-path-2>

Follow your full workflow (Phase 0 through Phase 5) to analyze, write, and validate unit tests.
```

For monorepo targets, add the line: `This is in the <package-name> package.`

If overrides were extracted from the input, append them to each agent's prompt (only include keys that were present in the input):

```
---
unit-test-standards: <value>
scripts:
  check: <value>
  test-unit-coverage: <value>
  format-write: <value>
---
```

If no overrides were provided, omit the fenced block (defaults apply).

- Launch up to **5 agents in parallel** (multiple Agent tool calls in a single message).
- If more than 5 files, process in batches. Wait for each batch to complete before launching the next.

## Step 4: Post-Test Verification (Retry Gate)

Run the resolved `check` and `test-unit` commands for each affected package.

**If verification passes:** Run `git diff --name-only HEAD` and `git ls-files --others --exclude-standard` (to capture both modified and newly created files), and merge the results into your tracked file list. Then proceed to Step 5.

**If verification fails:** Re-spawn `fdrop:agent:unit-test-writer` for each source file whose tests caused failures:

```
The tests for the following file failed verification:

<source-file-path>

Errors:
<error output from the failed commands>

Fix the failing tests for this file. Follow your full workflow (Phase 0 through Phase 5).
```

For monorepo targets, add the line: `This is in the <package-name> package.`

**Maximum 2 retry spawns.** If verification still fails after retries, document the failures and proceed to Step 5 — refactoring may still add value.

## Step 5: Refactor

**If `--skip-refactor` was passed**, skip Steps 5 and 6 entirely — proceed directly to Step 7.

From the tracked file list, select only `.ts` and `.tsx` files. Exclude everything else (schema files, migration SQL, lockfiles, JSON, etc.).

**If no `.ts`/`.tsx` files remain**, skip Steps 5 and 6 entirely — proceed directly to Step 7.

Spawn `fdrop:agent:refactor-executor` as a subagent (`subagent_type: "fdrop:agent:refactor-executor"`) with the filtered file list and `skip-tests: true` (the orchestrator already handled test writing in Step 3):

```
Review and refactor the following changed files:

<filtered list of .ts/.tsx files from Steps 1–4>

skip-tests: true
```

If overrides were extracted from the input, append them to the prompt (only include keys that were present in the input):

```
---
code-standards: <value>
unit-test-standards: <value>
extra-context:
  - <path-1>
  - <path-2>
scripts:
  check: <value>
  test-unit: <value>
---
```

If no overrides were provided, omit the fenced block (defaults apply).

When the agent returns, evaluate its response:

- **Changes were made:** Spawn a **new** `fdrop:agent:refactor-executor` for another pass (with the same prompt format, updated file list if the agent reported new files).
- **REFACTORING_COMPLETE returned:** Proceed to Step 6.
- **Error or unexpected output:** Retry once. If the second attempt also fails, proceed to Step 6.

**Maximum 3 refactor iterations.** This budget covers only the iterative refactor passes in Step 5 — it does not include post-refactor verification retries in Step 6.

## Step 6: Post-Refactor Verification (Retry Gate)

Run the resolved `check` and `test-unit` commands for each affected package.

**If verification passes:** Run `git diff --name-only HEAD` and `git ls-files --others --exclude-standard` (to capture both modified and newly created files), and merge the results into your tracked file list. Then proceed to Step 7.

**If verification fails:** Re-spawn `fdrop:agent:refactor-executor` with the error output and file list (still with `skip-tests: true`). **Maximum 2 retry spawns** (independent of Step 5's iteration count).

If retries are exhausted, document the failures and proceed to Step 7.

## Step 7: Final Report

Produce a consolidated summary of the entire implementation:

```
## Implementation Complete: <feature-name>

| Step | Status | Details |
|------|--------|---------|
| Clean slate | ✅ | <packages verified> |
| Feature | ✅ | <N> files changed |
| Post-feature verify | ✅ | passed (attempt <N>) |
| Tests | ✅ | <N> test files written |
| Post-test verify | ✅ | passed (attempt <N>) |
| Refactor | ✅ / ⏭️ skipped | <N> iterations / skipped via --skip-refactor |
| Post-refactor verify | ✅ / ⏭️ skipped | passed (attempt <N>) / skipped via --skip-refactor |

### Files Changed
- `<file-path>` -- <what changed>
- ...

### Summary
- <one-line description of change 1>
- <one-line description of change 2>
```

If any step failed or was skipped, use ❌ and include the error summary for that row.

## Rules

- Each agent spawn **must** be a new Agent tool call (fresh context).
- Do **NOT** implement features, write tests, or refactor code yourself — only orchestrate.
- Do not create commits, branches, or push.
- Do not ask clarifying questions during execution — the only exception is Step 0 when the target package cannot be determined from the input.
- Track the full list of changed files across all steps for the final report.
