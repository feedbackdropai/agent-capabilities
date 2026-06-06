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

- [folder-structure.md](../code:architecture/docs/folder-structure.md) – Folder organization
- [architecture-decisions.md](../code:architecture/docs/architecture-decisions.md) – Architectural patterns

### Style Guide

- [conventions.md](../code:style-guide/docs/conventions.md) – General coding conventions
- [functions.md](../code:style-guide/docs/functions.md) – Function patterns
- [classes.md](../code:style-guide/docs/classes.md) – Class patterns
- [imports-exports.md](../code:style-guide/docs/imports-exports.md) – Import/export rules
- [enums.md](../code:style-guide/docs/enums.md) – Enum rules
- [typescript.md](../code:style-guide/docs/typescript.md) – TypeScript rules

### Documentation

- [ts-docs.md](../code:documentation/docs/ts-docs.md) – TSDoc/JSDoc style guide for TypeScript

### React

- [react/patterns-components.md](./docs/react/patterns-components.md) – React component and hook size thresholds

### Refactor Plan

- [refactor-plan.md](./docs/refactor-plan.md) – Instructions for generating the refactor plan

## Instructions

Read all documents listed above, then follow the analysis method, output format, and verdict specified in refactor-plan.md.
