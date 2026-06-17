---
name: fdrop:task:refactor-plan
description: Analyzes code and creates refactor suggestions. Use when planning a refactor or reviewing code for improvement opportunities. Input can be a folder path OR a request to review currently changed files (uncommitted changes from git).
allowed-tools: Read, Glob, Grep, Bash
---

# Refactor Plan

## Input

```
/fdrop:task:refactor-plan <folder-path>
/fdrop:task:refactor-plan --changed
```

### Overrides (optional)

The input may include a `---` fenced block with override keys:

| Key | Default | Purpose |
| --- | --- | --- |
| `code-standards` | (use Required Reading below) | Skill name or file path to load instead of the hardcoded Required Reading docs |
| `extra-context` | (none) | Additional skills/docs to load for context |
| `scripts` | (auto-detected) | Map of script key → full command (use `{package}` placeholder for monorepo) |

**If `code-standards` is provided:** Load it via the Skill tool (if it starts with `/`) or the Read tool (if it's a file path), and skip the "Required Reading" section below — the override provides the rules. Still read [refactor-plan.md](./docs/refactor-plan.md) for output format and detection patterns

**If `extra-context` is provided:** Load each path via the Skill tool (for skills) or Read tool (for `.md` files).

If no overrides block is present, check for `fdrop-agent-capabilities-config.json` at the repository root. If it exists, read it and use its values as overrides. Inline `---` blocks take precedence over config file values for any key specified in both. If neither is present, use the Required Reading section as normal.

You will receive one of two input modes:

### Mode 1: Folder Path

You receive a folder path to analyze. List all files in the target directory (not just the ones mentioned), read each relevant file, and base your analysis on what you directly observe.

### Mode 2: Changed Files

The user asks you to review currently changed files (e.g., "review the changed files", "review the diff", "review uncommitted changes"). In this mode:

1. Run `git diff --name-only` and `git diff --cached --name-only` to identify all changed files
2. Filter out test files and auto-generated files
3. Read each changed file in full and analyze it

### Both Modes

**CRITICAL:** Your analysis MUST comply with all rules in the below documentation. These are requirements, not guidelines.

## Required Reading

Before analyzing code, read these documents:

### Architecture

- [folder-structure.md](../code:architecture/docs/folder-structure.md) - Folder organization
- [architecture-decisions.md](../code:architecture/docs/architecture-decisions.md) - Architectural patterns

### Style Guide

- [formatting.md](../code:style-guide/docs/formatting.md) - Language, formatter, and linter baseline
- [casing.md](../code:style-guide/docs/casing.md) - Identifier casing
- [file-naming.md](../code:style-guide/docs/file-naming.md) - File-name casing and resolution order
- [variable-declaration.md](../code:style-guide/docs/variable-declaration.md) - Variable naming and inline-vs-hoisted scalars
- [naming.md](../code:style-guide/docs/naming.md) - Naming consistency and naming for reuse
- [functions.md](../code:style-guide/docs/functions.md) - Function patterns
- [classes.md](../code:style-guide/docs/classes.md) - Class patterns
- [named-constants.md](../code:style-guide/docs/named-constants.md) - Named constants (unions + `const` objects)
- [typescript.md](../code:style-guide/docs/typescript.md) - TypeScript rules
- [one-export-per-file.md](../code:style-guide/docs/one-export-per-file.md) - One exported item per file
- [import-paths.md](../code:style-guide/docs/import-paths.md) - Path-alias import strategy
- [module-boundaries.md](../code:style-guide/docs/module-boundaries.md) - Module boundaries, exports, and barrels
- [type-placement.md](../code:style-guide/docs/type-placement.md) - Where types and interfaces live
- [constant-placement.md](../code:style-guide/docs/constant-placement.md) - Where constants live

### Documentation

- [ts-docs.md](../code:documentation/docs/ts-docs.md) - TSDoc/JSDoc style guide for TypeScript

### React

- [react/patterns-components.md](./docs/react/patterns-components.md) - React component and hook size thresholds

### Refactor Plan

- [refactor-plan.md](./docs/refactor-plan.md) - Instructions for generating the refactor plan

## Instructions

1. If `code-standards` override was provided, load it and skip step 2. Otherwise proceed to step 2.
2. Read all documents listed in Required Reading above.
3. If `extra-context` paths were provided, load each one.
4. Identify target files using the appropriate input mode (folder listing or git diff).
5. Analyze each file directly — do not delegate analysis to sub-agents or summarizers.
6. Produce refactor suggestions following the output format, severity classification, and verdict rules specified in [refactor-plan.md](./docs/refactor-plan.md).
