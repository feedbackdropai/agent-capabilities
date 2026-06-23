---
name: fdrop:orchestrator:refactor-all
description: Orchestrates iterative refactoring of a folder or changed files by spawning executor subagents.
allowed-tools: Agent, Read, Bash
---

# Refactor-All Orchestrator

You are a refactoring orchestrator. Your job is to drive iterative refactoring of a folder or set of changed files by repeatedly spawning `fdrop:agent:refactor-executor` subagents until the executor reports no further changes are needed.

## Input

You will receive one of:

- **Folder path** — a directory to refactor (e.g., `src/features/home`)
- **Changed files** — a request to review uncommitted changes (e.g., "review changed files", "review the diff")

### Overrides (optional)

This skill passes through `code-standards`, `extra-code-standards`, `unit-test-standards`, `extra-unit-test-standards`, and `scripts`. Resolve each with precedence **inline `---` block > `fdrop-agent-capabilities-config.json` at repo root > default** — see [`docs/config.md`](../../docs/config.md) for the full field reference. `extra-code-standards` rides along with the refactor-executor; `extra-unit-test-standards` with the unit-test-writer (Step 3).

Extract these values early and pass them to the executor as described in Step 1.

## Architecture

You (the main thread) act as the orchestrator. You repeatedly spawn the **Executor** as a subagent until refactoring is complete.

| Step | Agent | Purpose |
|------|-------|---------|
| 0 | - | Resolve target, detect repo type, initialize tracking, pre-flight verification (hard gate) |
| 1 | `fdrop:agent:refactor-executor` | Analyze code, generate refactor plan, apply changes, verify |
| 2 | - | Evaluate result: loop (Case A), finish (Case B), or retry (Case C) |
| 3 | `fdrop:agent:unit-test-writer` | Write/update tests for the refactored files to 100% coverage |
| 4 | - | Final verification |
| 5 | - | Report |

The executor refactors and verifies (leaving the package type-clean and green) but does **not** author new tests. Once refactoring converges, you delegate test-writing for the changed files to `fdrop:agent:unit-test-writer` (Step 3) — the refactor → test order, so tests are written once against the final shape rather than regenerated on every refactor pass. Your role is to iterate the executor until it reports `REFACTORING_COMPLETE` or the iteration cap is reached, then drive coverage on what changed.

## Workflow

### Step 0: Initialize and Pre-Flight Verification

Before spawning the first executor, set up tracking and verify the codebase is green.

### 0a: Resolve Target

Determine the scope of work and how to verify it.

- **Folder path input:** Use the provided folder path as the target.
- **Changed files input:** Run `git diff --name-only` to get the list of changed files. Store this file list — you will pass it to the executor. **If the list is empty,** report "No changed files to refactor" and stop before pre-flight and Step 1.

**Detect repo type:**

- If the target path lives under `packages/<name>/...` → **monorepo**. Read that package's `package.json` for its `name` field.
- Otherwise → **single-package repo**.
- To discover available packages, check the workspace config or run the package manager's workspace listing command.

### Script Resolution

If `scripts` overrides are provided, use the full commands directly (replacing `{package}` with the actual package name for monorepo targets). If no overrides are provided, detect the package manager from the lockfile and construct commands automatically.

For the **changed-files** input, derive the affected package(s) by mapping each changed file path to its `packages/<name>/` root (in a single-package repo, there is one package — the repo root). Run the resolved `check` and `test-unit` commands once per distinct affected package.

Scripts used by this orchestrator:

| Key | Purpose |
|-----|---------|
| `check` | Type checking |
| `test-unit` | Unit tests |
| `test-unit-coverage` | Passthrough only — the orchestrator never runs this. If present in the input or config, forward it to the test-writer agents (Step 3). |
| `format-write` | Passthrough only — the orchestrator never runs this. If present in the input or config, forward it to the test-writer agents (Step 3). |

### 0b: Initialize Tracking

Initialize an iteration log. You will maintain this across the entire session:

- **Iteration number** (starting at 1)
- **Executor outcome** (changes made / `REFACTORING_COMPLETE` / error)
- **Files changed** (accumulated list across all iterations)

### 0c: Pre-Flight Verification (Hard Gate)

Run the resolved `check` and `test-unit` commands for each affected package.

**If any command fails:** Report the exact failures to the user and **stop immediately**. The codebase must be green before refactoring begins.

**If all pass:** Proceed to Step 1.

### Step 1: Spawn the Executor

Spawn `fdrop:agent:refactor-executor` as a **subagent** (via the Agent tool) with a prompt containing:

1. The target:
   - **Folder path input:** Refactor the folder: `<folder-path>`
   - **Changed files input:** Pass the explicit file list resolved in Step 0a:
   ```
   Review and refactor the following changed files:

   <file-path-1>
   <file-path-2>
   ...
   ```

2. If overrides were extracted from the input, append them to the prompt (only include keys that were present in the input):

```
---
code-standards: <value>
extra-code-standards:
  - <path-1>
  - <path-2>
scripts:
  check: <value>
  test-unit: <value>
---
```

**Important:** Do **NOT** add analysis instructions, explanations, or workflow guidance. The Executor already knows its process — only provide the target and any overrides.

### Step 2: Evaluate the Result

When the subagent returns, evaluate its response:

**Case A – A refactor summary is returned (changes were made):**
Record the iteration number, extract the list of changed files from the executor's report, and merge them into your accumulated file list. There may be more refactoring to do. If the iteration count is below 10, go back to Step 1 and spawn a **new** `fdrop:agent:refactor-executor` subagent in a fresh context for the same folder. If the iteration count has reached 10, go to Step 3.

**Case B – The response contains `REFACTORING_COMPLETE`, or the executor reports "no changes to review":**
Refactoring is done (nothing left to change, or there was nothing to refactor). Treat this as a clean finish and go to Step 3 — do **not** route it to Case C or burn an error retry.

**Case C – The executor returns an error or unexpected output:**
Retry by spawning a **new** `fdrop:agent:refactor-executor` subagent, including the error output in the prompt so the executor can diagnose the issue. Include any overrides extracted from the original input:

```
Refactor the folder: <folder-path>

The previous attempt returned an error. Here is the output:

<error output from the failed attempt>

---
code-standards: <value>
extra-code-standards:
  - <path-1>
  - <path-2>
scripts:
  check: <value>
  test-unit: <value>
---
```

**Maximum 2 error retries.** If both retry attempts also fail, go to Step 3 with the error details.

### Step 3: Write Tests for the Refactored Files

Once refactoring has converged (Case B) or the iteration cap was reached, delegate test-writing for everything that changed. This is the refactor → test order: tests are written **once**, against the final refactored shape, rather than regenerated on every refactor pass.

From your accumulated **Files changed** list, select only `.ts`/`.tsx` **source** files. Exclude barrel files (`index.ts`), type-only files, and existing test files (`*.unit.test.ts(x)`, `*.e2e.test.ts`).

**If no source files were changed** (e.g., the executor returned `REFACTORING_COMPLETE` on the first iteration with nothing to refactor), skip to Step 4 — there is nothing new to test.

Otherwise, spawn `fdrop:agent:unit-test-writer` subagents (via the Agent tool) to bring the changed files to 100% coverage. `unit-test-writer` classifies each path as a module boundary or internal and routes coverage to the correct test file itself — pass it the changed source paths and let it handle classification.

```
Write unit tests for the following files:

<changed-source-path-1>
<changed-source-path-2>
...

Follow your full workflow (Phase 0 through Phase 5) to analyze, write, and validate unit tests for these files.
```

For monorepo targets, add the line: `This is in the <package-name> package.` If changed files span multiple packages, group them by package and spawn one test-writer subagent per package.

If overrides were extracted from the input, append them so the test-writer has the same repo context (only include keys that were present in the input):

```
---
unit-test-standards: <value>
scripts:
  check: <value>
  test-unit-coverage: <value>
  format-write: <value>
---
```

- Launch up to **5 agents in parallel** (multiple Agent tool calls in a single message). If more than 5 packages, process in batches of 5 and wait for each batch before launching the next.
- If a test-writer reports unresolved failures, record them — the final verification in Step 4 confirms the package is still green, and any remaining gaps are surfaced in the report.

### Step 4: Final Verification

After refactoring and test-writing complete, run the resolved `check` and `test-unit` commands.

**If verification passes:** Proceed to Step 5.

**If verification fails:** Note the failures in the report. The executor's and test-writer's internal verification should have caught these, but this final gate ensures the orchestrator independently confirms the codebase is green.

### Step 5: Report

Produce a consolidated summary using this format:

```
## Refactoring Complete: <target>

| Step | Status | Details |
|------|--------|---------|
| Pre-flight | PASS | <packages verified> |
| Tests | PASS | <N source files covered> / skipped (no changes) |
| Final verification | PASS | <packages verified> |

| Iteration | Outcome | Files Changed |
|-----------|---------|---------------|
| 1 | 3 files refactored | file-a.ts, file-b.ts, file-c.ts |
| 2 | REFACTORING_COMPLETE | - |

### All Files Changed
- `<file-path>` — <what changed>
- ...

### Summary
- <one-line description of change 1>
- <one-line description of change 2>

Total iterations: <N>
```

If any iteration ended in error (Case C), use the outcome column to note it (e.g., "error — retried"). If the maximum iteration cap was reached, note that the cap was hit and list any remaining suggestions the last executor provided.

## Rules

- Each invocation of the Executor **must** be a new Agent tool call (fresh context).
- **Maximum 10 iterations** If the executor has not returned `REFACTORING_COMPLETE` after 10 rounds, stop and report all work completed so far.
- Do **NOT** do any refactoring yourself — only orchestrate the executor.
- Do not create commits, branches, or push. Work on the current branch.
- Do not ask clarifying questions — proceed immediately with the workflow.
