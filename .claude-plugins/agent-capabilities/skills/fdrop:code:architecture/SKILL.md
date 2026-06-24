---
name: fdrop:code:architecture
description: Shared architecture requirements and conventions. Use when: creating or moving files/folders, deciding where code belongs (common/ vs feature-specific), adding a new feature module, extracting shared code, setting up barrel exports, or reviewing code placement.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Architecture

This project may be a single-package repo or a pnpm monorepo. In a monorepo, each package under `packages/` has its own architecture layered on these shared rules.

Follow the rules in the linked docs — they're requirements, not suggestions. Consistency is what keeps the codebase predictable to edit, for agents and humans alike.

**Precedence (within architecture docs):** Package-specific docs override framework docs, which override shared rules, where they explicitly diverge. This refines the overall [precedence in the standards skill](../fdrop:code:standards/SKILL.md#precedence).

## Required Reading

The rules live in the docs below — not on this page. **Always load and read every doc that applies to your task, in full, before you do anything else:** all Shared docs always, plus the Framework and Package-Specific docs for the package(s) you are touching. Reading only this index page, or inferring rules from the doc titles, is a failure, not a shortcut. Every rule in the docs you read is binding — apply the full set, not the subset you remember. If any doc fails to load or returns empty, stop and report; never proceed on partial standards.

### Shared (always read)

- [folder-structure.md](./references/folder-structure.md) – Monorepo folder organization, `common/` pattern, domain folders
- [architecture-decisions.md](./references/architecture-decisions.md) – Shared architectural patterns

### Framework (read when touching a package that uses that framework)

Determine which package(s) you are working in from the file paths in your task. Check the package's dependencies (`package.json`) to identify which framework it uses, then read the matching docs.

**React / Preact:**
- [react/architecture-decisions.md](./references/react/architecture-decisions.md) – Component structure, hooks, naming, JSX domain folders

**TanStack Start:**
- [tanstack-start/architecture-decisions.md](./references/tanstack-start/architecture-decisions.md) – Features/screens, serverFns, queries, code placement hierarchy

### Package-Specific (read when touching that package)

For each affected package, check if a subdirectory exists under `references/` matching that package name. If it does, read all docs in it. Packages without dedicated docs follow only the shared and framework docs.
