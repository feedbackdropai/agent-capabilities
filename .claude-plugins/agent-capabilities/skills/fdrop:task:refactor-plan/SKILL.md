---
name: fdrop:task:refactor-plan
description: Analyzes code and creates refactor suggestions. Use when planning a refactor or reviewing code for improvement opportunities. Input can be a folder path OR a request to review currently changed files (uncommitted changes from git).
allowed-tools: Read, Glob, Grep, Bash
---

# Refactor Plan

## Input

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

- [folder-structure.md](../fdrop:code:architecture/references/folder-structure.md) – Folder organization
- [architecture-decisions.md](../fdrop:code:architecture/references/architecture-decisions.md) – Architectural patterns

### Style Guide

- [conventions/formatting.md](../fdrop:code:style-guide/references/conventions/formatting.md) – Language, formatter, and linter baseline
- [conventions/casing.md](../fdrop:code:style-guide/references/conventions/casing.md) – Identifier casing
- [conventions/file-naming.md](../fdrop:code:style-guide/references/conventions/file-naming.md) – File-name casing and resolution order
- [conventions/variable-declaration.md](../fdrop:code:style-guide/references/conventions/variable-declaration.md) – Variable naming and inline-vs-hoisted scalars
- [conventions/naming.md](../fdrop:code:style-guide/references/conventions/naming.md) – Naming consistency and naming for reuse
- [patterns/functions.md](../fdrop:code:style-guide/references/patterns/functions.md) – Function patterns
- [patterns/classes.md](../fdrop:code:style-guide/references/patterns/classes.md) – Class patterns
- [patterns/named-constants.md](../fdrop:code:style-guide/references/patterns/named-constants.md) – Named constants (unions + `const` objects)
- [typescript/return-types.md](../fdrop:code:style-guide/references/typescript/return-types.md) – Explicit return types on exports
- [typescript/import-type.md](../fdrop:code:style-guide/references/typescript/import-type.md) – `import type` for type-only imports
- [typescript/avoid-any.md](../fdrop:code:style-guide/references/typescript/avoid-any.md) – Avoid `any`; prefer `unknown`/narrowing
- [typescript/type-assertions.md](../fdrop:code:style-guide/references/typescript/type-assertions.md) – Avoid `as`; prefer narrowing
- [structure/one-export-per-file.md](../fdrop:code:style-guide/references/structure/one-export-per-file.md) – One exported item per file
- [structure/import-paths.md](../fdrop:code:style-guide/references/structure/import-paths.md) – Path-alias import strategy
- [structure/module-api.md](../fdrop:code:style-guide/references/structure/module-api.md) – Module boundaries, exports, and barrels
- [structure/type-placement.md](../fdrop:code:style-guide/references/structure/type-placement.md) – Where types and interfaces live
- [structure/constant-placement.md](../fdrop:code:style-guide/references/structure/constant-placement.md) – Where constants live

### Documentation

- [ts-docs.md](../fdrop:code:documentation/references/ts-docs.md) – TSDoc/JSDoc style guide for TypeScript

### React

- [react/patterns-components.md](./references/react/patterns-components.md) – React component and hook size thresholds

### Refactor Plan

- [refactor-plan.md](./references/refactor-plan.md) – Instructions for generating the refactor plan

## Instructions

Read all documents listed above, then follow the analysis method, severity classification, output format, and verdict specified in refactor-plan.md.

If no target files are found (empty/non-existent folder in Mode 1, or a clean working tree in Mode 2), report `No files to analyze.` and stop.
