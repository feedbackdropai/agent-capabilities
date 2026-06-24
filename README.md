# FeedbackDrop Agent Capabilities

> A portable "code factory" for Claude Code — one command spawns a gated **build → test → refactor**
> pipeline that enforces your standards. Drop it into any repo and override the defaults with your own
> conventions, no forking required.

FeedbackDrop's open collection of composable Agents and Skills for AI coding assistants. The flagship
`/fdrop:orchestrator:implement` turns a plan (or a plain feature description) into reviewed, tested code.

## Table of Contents

- [About FeedbackDrop](#about-feedbackdrop)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Available Capabilities](#available-capabilities)
- [Contributing](#contributing)
- [License](#license)

## About FeedbackDrop

These capabilities are built and battle-tested by the team behind **[FeedbackDrop](https://www.feedbackdrop.ai/)** — AI-powered feedback intelligence for product teams.

Drop a customizable widget into your app and let users pin feedback to any element. FeedbackDrop silently captures deep debug context — console logs, network requests, DOM state, and environment data — then uses AI to merge duplicate reports into a single, actionable issue with root-cause diagnosis and step-by-step fix recommendations. The result lands ready for your engineers (or AI agents) to implement, with integrations for GitHub and more on the way.

➡️ **Learn more at [feedbackdrop.ai](https://www.feedbackdrop.ai/)**

## Installation

### Using Claude Code Plugin (Recommended)

**Prerequisites:** [Claude Code](https://docs.claude.com/claude-code) installed. Works with pnpm (default), or yarn/npm via `scripts` overrides.

**Step 1** – Start Claude Code

```bash
claude
```

**Step 2** – Add the marketplace

```
/plugin marketplace add feedbackdropai/agent-capabilities
```

**Step 3** – Install plugins

| Command | Description |
| ------- | ----------- |
| `/plugin` | Browse available plugins interactively |
| `/plugin install agent-capabilities@feedbackdrop` | Install plugin directly |

## Quick Start

Hand a plan — or just a feature description — to the flagship orchestrator:

```
/fdrop:orchestrator:implement .claude/plans/checkout-retry.md
```

It runs a gated pipeline, stopping if any gate fails rather than compounding errors:

1. **Build** — `fdrop:agent:feature-executor` implements against your standards.
2. **Test** — `fdrop:agent:unit-test-writer` adds unit tests; the suite must pass to continue.
3. **Refactor** — `fdrop:agent:refactor-executor` cleans up and re-runs checks.

Use `--skip-refactor` to stop after tests. To run it against a repo with different conventions,
append an overrides block (see [Overrides](#overrides)).

Don't have a plan yet? Generate an A-grade one first, then hand it to `implement`:

```
/fdrop:orchestrator:plan add retry logic to checkout
```

It explores the codebase, interviews you for the decisions only you can make, drafts the plan,
grills it for edge cases, and grades it to A — producing a plan ready for `/fdrop:orchestrator:implement`.

## Usage

### Invocation

Skills use `/`, agents use `@`:

```
/fdrop:<type>:<name> <args>
@fdrop:agent:<name> <args>
```

### Overrides

Any skill or agent that accepts overrides can receive a `---` fenced block appended to the input. Overrides propagate down the entire call chain automatically.

```
/fdrop:orchestrator:implement .claude/plans/widget.md

---
code-standards: /<namespace>:code:standards
extra-code-standards:
  - /<namespace>:code:architecture
unit-test-standards: /<namespace>:code:tests:unit:jest
extra-unit-test-standards:
  - /<namespace>:code:tests:integration
scripts:
  check: pnpm --filter {package} typecheck
  test-unit: pnpm --filter {package} test
---
```

| Key | Default | Purpose |
| --- | --- | --- |
| `code-standards` | `/fdrop:code:standards` | Replaces the default coding standards (skill name or file path) |
| `extra-code-standards` | (none) | Additional skills/docs loaded alongside `code-standards`, wherever it loads |
| `unit-test-standards` | `/fdrop:code:tests:unit:jest` | Replaces the default unit test conventions (skill name or file path) |
| `extra-unit-test-standards` | (none) | Additional skills/docs loaded alongside `unit-test-standards`, wherever it loads |
| `scripts` | (see defaults below) | Map of script key → full command to run. Use `{package}` placeholder for monorepo package name (omit for single-package repos) |

**Default scripts** (when not overridden):

| Key | Default command |
|-----|-----------------|
| `check` | `pnpm check` / `pnpm --filter {package} check` |
| `test-unit` | `pnpm test:unit` / `pnpm --filter {package} test:unit` |
| `test-unit-coverage` | `pnpm test:unit:coverage` / `pnpm --filter {package} test:unit:coverage` |
| `format-write` | `pnpm format:write` / `pnpm --filter {package} format:write` |
| `check-all` | `pnpm test:check:all` |
| `test-unit-all` | `pnpm test:unit:all` |
| `build` | *opt-in — no default; runs as a post-change gate only when you set it* |

When no `scripts` override is provided, the agent detects the package manager from the lockfile and repo type from the directory structure, then constructs commands automatically. The exception is `build`: it is **never** auto-detected and runs only when you explicitly set it — so if your environment builds automatically (e.g. a dev server that rebuilds on change), simply omit `build` and the agents skip it.

Omit the block entirely to use defaults (auto-detected from repo).

### Config File

As an alternative to inline `---` blocks, you can place an `fdrop-agent-capabilities-config.json` file at the root of your repository. Every skill and agent that accepts overrides will automatically check for this file and use its values as repo-wide defaults.

```json
{
  "code-standards": "/<namespace>:code:standards",
  "extra-code-standards": [
    "/<namespace>:code:architecture",
    "/<namespace>:code:safety"
  ],
  "unit-test-standards": "/<namespace>:code:tests:unit:jest",
  "extra-unit-test-standards": [
    "/<namespace>:code:tests:integration"
  ],
  "scripts": {
    "check": "pnpm --filter {package} typecheck",
    "build": "pnpm --filter {package} build",
    "test-unit": "pnpm --filter {package} test",
    "test-unit-coverage": "pnpm --filter {package} test:coverage",
    "format-write": "pnpm --filter {package} format:write",
    "test-unit-all": "pnpm test:all",
    "check-all": "pnpm test:check:all"
  }
}
```

All keys are optional — include only those you want to override. `extra-code-standards` and `extra-unit-test-standards` are additive: they load **alongside** their base standard (wherever it loads) rather than replacing it. To replace a default, set the base field (`code-standards` / `unit-test-standards`).

**Full field reference:** [`.claude-plugins/agent-capabilities/docs/config.md`](./.claude-plugins/agent-capabilities/docs/config.md) — the single source of truth for fields, types, defaults, and precedence.

**Precedence** (highest wins):

1. Inline `---` block in the prompt (explicit per-invocation)
2. `fdrop-agent-capabilities-config.json` at repo root (repo-wide defaults)
3. Built-in defaults (pnpm, standard script names)

This means the config file sets repo-level defaults that can still be overridden per-call via inline blocks.

### Composing Repo-Specific Skills

The main design goal: consuming repos create thin wrapper skills that inject their own overrides, reusing all upstream logic. This means each repo gets its own `/my-repo:task:feature` without duplicating implementation.

Example — `my-repo/.claude/skills/<namespace>:task:feature/SKILL.md`:

```markdown
---
name: <namespace>:task:feature
description: Implement a feature with <repo-name> standards enforced.
---

# Instructions

1. Take user's input exactly as received.
2. Spawn agent `fdrop:agent:feature-executor`, passing input with overrides appended:

```
<user-input>

---
code-standards: /<namespace>:code:standards
extra-code-standards:
  - /<namespace>:code:architecture
unit-test-standards: /<namespace>:code:tests:unit:jest
extra-unit-test-standards:
  - /<namespace>:code:tests:integration
scripts:
  check: pnpm --filter {package} typecheck
  test-unit: pnpm --filter {package} test
---
```

Do not modify user's input. Only append overrides block and delegate.
```

The wrapper skill is ~10 lines. All implementation, test writing, and refactoring logic stays upstream in `feedbackdropai/agent-capabilities` and updates automatically.

You can wrap any capability that accepts overrides – agents, orchestrators, tasks, or tools. For example, `<namespace>:orchestrator:implement` wrapping `fdrop:orchestrator:implement`, or `<namespace>:task:plan-to-A` wrapping `fdrop:task:plan-to-A`.

## Available Capabilities

Skills are invoked via `/`, agents via `@`. Context skills have no input — they're loaded by other skills/agents for reference.

| Name | Description | Input | Overrides |
| --- | --- | --- | --- |
| **Context Skills** | | | |
| `fdrop:code:architecture` | Architecture requirements | - | |
| `fdrop:code:documentation` | Code documentation standards | - | |
| `fdrop:code:standards` | Standards aggregator (architecture + style-guide + documentation) | - | |
| `fdrop:code:style-guide` | Code style requirements | - | |
| `fdrop:code:tests:unit:jest` | Unit test requirements (jest) | - | |
| **Protocols** | | | |
| `fdrop:protocol:friction` | Contract for logging friction/decisions during a run; a plugin hook scrapes the markers to `.fdrop/runs/` | - | |
| **Orchestrators** | | | |
| `fdrop:orchestrator:plan` | Builds an A-grade plan: explore → elicit → draft → grill → grade | `<feature-or-notes>` | ✅ |
| `fdrop:orchestrator:implement` | Spawns build → test → refactor agents sequentially | `<plan-file>` | ✅ |
| `fdrop:orchestrator:implement-all` | Runs `implement` on each plan in a folder. Stops on failure | `<folder>` | ✅ |
| `fdrop:orchestrator:refactor-all` | Iterative refactoring via executor subagents | `<folder>` | ✅ |
| `fdrop:orchestrator:100-test-coverage` | Spawns test-writer agents until 100% coverage | `<package-filter>` | ✅ |
| `fdrop:orchestrator:all-plans-to-A` | Brings all plans in a folder to A, surfacing decision gaps | `<folder>` | ✅ |
| `fdrop:orchestrator:all-skills-to-A` | Grades all skills/agents to A in parallel batches | - | - |
| **Tasks** | | | |
| `fdrop:task:plan-to-A` | Lints then gap-checks a plan to A (non-interactive) | `[<overview>] <plan-file>` | ✅ |
| `fdrop:task:refactor-plan` | Analyze code and create refactor suggestions | `<folder>` or changed files | ✅ |
| `fdrop:task:skill-to-A` | Grades and improves a skill to A grade | `<file-path>` | - |
| **Tools** | | | |
| `fdrop:tool:lint-plan` | Flags structural/mechanical plan defects with exact fixes | `<plan-file>` | ✅ |
| `fdrop:tool:check-plan-gaps` | Surfaces decision-level gaps that force the agent to guess | `<plan-file>` | ✅ |
| `fdrop:tool:grade-skill` | Grades a skill/agent on nine axes with gaps and fixes | `<file-path>` | - |
| `fdrop:tool:grill-me` | Interviews you to stress-test a plan or design | plan in context | - |
| **Agents** | | | |
| `fdrop:agent:feature-executor` | Implements a plan. Usually spawned by orchestrators | `<plan-file>` | ✅ |
| `fdrop:agent:implement` | Runs build → test → refactor end-to-end as a subagent | `<plan-file>` | ✅ |
| `fdrop:agent:refactor-executor` | Refactors code in target | `<folder>` or `<file-list>` | ✅ |
| `fdrop:agent:unit-test-writer` | Writes unit tests for target folder | `<folder>` | ✅ |
| `fdrop:agent:plan-writer` | Drafts a plan from a decisions record and exploration facts | decisions + facts | ✅ |
| `fdrop:agent:plan-to-A` | Brings a plan to A, surfacing design gaps in its report | `[<overview>] <plan-file>` | ✅ |
| `fdrop:agent:lint-plan` | Wraps `tool:lint-plan` as a spawnable subagent (read-only) | `<plan-file>` | ✅ |
| `fdrop:agent:check-plan-gaps` | Wraps `tool:check-plan-gaps` as a subagent (read-only) | `<plan-file>` | ✅ |
| `fdrop:agent:grade-skill` | Wraps `tool:grade-skill` as a spawnable subagent | `<file-path>` | ✅ |
| `fdrop:agent:skill-to-A` | Grades and improves a single skill file to A | `<file-path>` | ✅ |

## Contributing

New skills, agents, hooks, and commands must be namespaced consistently — this keeps them discoverable and autocomplete-friendly (e.g. find all `/fdrop:code:*` or `/fdrop:tool:*`).

**Pattern**: `fdrop:<category>:<name>` — append further namespacing as needed.

### Naming Skills

Skills live in `.claude-plugins/agent-capabilities/skills/` and each skill is a folder containing a `SKILL.md` and optional `references/`, `scripts/`, or `assets/` directories.

Common categories:

- `fdrop:code:<name>` — coding standards, feature implementation, and testing
- `fdrop:protocol:<name>` — shared runtime contracts every agent obeys (e.g. friction logging)
- `fdrop:tool:<name>` — utilities for skill/agent authoring and tooling
- `fdrop:task:<name>` — actionable tasks that produce an output or perform a workflow step
- `fdrop:orchestrator:<name>` — orchestration skills that coordinate subagents to complete multi-step workflows

### Naming Agents

Agents live in `.claude-plugins/agent-capabilities/agents/` as standalone `.md` files.

**Pattern**: `fdrop:agent:<name>`

Examples: `fdrop:agent:feature-executor`, `fdrop:agent:refactor-executor`, `fdrop:agent:unit-test-writer`

## License

MIT © FeedbackDrop
