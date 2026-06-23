# Consumer Configuration

How every skill and agent in this plugin resolves consumer overrides. This is the single source of truth for the override field catalog, defaults, and precedence. Individual skills and agents carry only a short stub naming the fields they use; this document is the full reference.

## Sources & precedence (highest wins)

1. **Inline `---` fenced overrides block** in the prompt — per-invocation.
2. **`fdrop-agent-capabilities-config.json`** at the repository root — repo-wide defaults.
3. **Built-in defaults** — the values in the table below.

For any key present in more than one source, the higher source wins for that key. A key absent from every source falls back to its default. Concretely: if no inline block is present, check for the config file; if neither is present, all defaults apply.

## How values are loaded

- A **skill name** (e.g. `/fdrop:code:standards`) → load via the **Skill** tool.
- A **file path** (e.g. `./references/standards.md`) → load via the **Read** tool.
- An **array** field → load each entry independently (skills via the Skill tool, file paths via the Read tool).

## Fields

All keys are optional — include only those you want to override.

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `code-standards` | string — skill name or file path | `/fdrop:code:standards` | Coding conventions loaded by code-writing, refactoring, and planning agents. **Hard gate** for executor agents: a failed load aborts the agent. |
| `extra-code-standards` | array — skill names or file paths | (none) | Additional repo-specific context loaded **alongside `code-standards`**, wherever `code-standards` is loaded. **Supplemental** — a failed load is noted and skipped, never a hard gate. |
| `unit-test-standards` | string — skill name or file path | `/fdrop:code:tests:unit:jest` | Unit-test conventions and coverage-command patterns loaded by test-writing agents. **Hard gate** for the test-writer. |
| `extra-unit-test-standards` | array — skill names or file paths | (none) | Additional repo-specific context loaded **alongside `unit-test-standards`**, wherever `unit-test-standards` is loaded. **Supplemental** — a failed load is noted and skipped, never a hard gate. |
| `scripts` | object — script key → full shell command | (auto-detected from the lockfile) | Verification commands. Use the `{package}` placeholder for the package name in monorepo targets. Recognized keys: `check`, `test-unit`, `test-unit-coverage`, `format-write`, `test-unit-all`, `check-all`. |

### Channel rule

`extra-code-standards` and `extra-unit-test-standards` are **additive context channels** that ride along with their base field:

- **`extra-code-standards`** is loaded everywhere **`code-standards`** is loaded (code-writing / refactoring / planning agents).
- **`extra-unit-test-standards`** is loaded everywhere **`unit-test-standards`** is loaded (test-writing agents).

This keeps test-only context out of code-only agents and vice versa. To **replace** a default standard, set the base field (`code-standards` / `unit-test-standards`). To **add** to it without restating the default, use the matching `extra-*` field.

## `fdrop-agent-capabilities-config.json` example

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
    "test-unit": "pnpm --filter {package} test",
    "test-unit-coverage": "pnpm --filter {package} test:coverage",
    "format-write": "pnpm --filter {package} format:write",
    "test-unit-all": "pnpm test:all",
    "check-all": "pnpm test:check:all"
  }
}
```

## Adding a new field

1. Add a row to the **Fields** table above and, if it is a script, to the example.
2. Add it to the stub of **only** the agents/skills that actually consume it — an additive context channel follows its base field per the channel rule; a new script key goes to the agents that run it.

Planning/grading skills that never run a build, for example, should not gain a `build` script key.
