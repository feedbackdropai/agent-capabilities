---
name: fdrop:code:tests:unit:jest
description: General unit testing patterns and conventions. Use when writing or reviewing unit tests.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Unit Tests

**Scope:** All packages with Jest configs.

**Coverage target:** Every new or modified source file must reach 100% line, branch, and function coverage. Coverage is measured per source file, but tests live at **module boundaries** — internals are covered through their module's public API, not by dedicated test files. See the Module Boundary Testing section of [unit-testing.md](./references/unit-testing.md#module-boundary-testing).

Follow the rules in the linked docs — they're requirements, not suggestions. Consistency is what keeps the codebase predictable to edit, for agents and humans alike.

## Required Reading

The rules live in the docs below — not on this page. **Always load and read every one of them, in full, before you do anything else.** Reading only this index page, or inferring rules from the doc titles, is a failure, not a shortcut. Every rule in these docs is binding — apply the full set, not the subset you remember. If any doc fails to load or returns empty, stop and report; never proceed on partial standards.

- [unit-testing.md](./references/unit-testing.md) – Core testing guidelines, file location, and mock organization
- [unit-testing-react-components.md](./references/unit-testing-react-components.md) – React/Preact component testing with @testing-library
- [unit-test-examples.md](./references/unit-test-examples.md) – Example unit test files for classes, functions, and components

## Forcing Function

Before writing any test file, list the source file's code paths: branches, conditions, early returns, error paths, and edge cases. This serves as the test plan and proves you read the source. Only then write the tests.
