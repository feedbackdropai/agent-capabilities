---
name: fdrop:code:tests:unit:jest
description: General unit testing patterns and conventions. Use when writing or reviewing unit tests.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Unit Tests

**Scope:** All packages with Jest configs.

**Coverage target:** Every new or modified source file must reach 100% line and branch coverage. Coverage is measured per source file, but tests live at **module boundaries** — internals are covered through their module's public API, not by dedicated test files. See the Module Boundary Testing section of [unit-testing.md](./docs/unit-testing.md#module-boundary-testing).

**CRITICAL:** Every line of code you write MUST comply with all rules in the below documentation. These are requirements, not guidelines. Consistent style makes the codebase readable and maintainable.

## Required Reading

Before writing any code, read these documents:

- [unit-testing.md](./docs/unit-testing.md) – Core testing guidelines, file location, and mock organization
- [unit-testing-react-components.md](./docs/unit-testing-react-components.md) – React/Preact component testing with @testing-library
- [unit-testing-nestjs.md](./docs/unit-testing-nestjs.md) – NestJS service testing with DI mock providers
- [unit-test-examples.md](./docs/unit-test-examples.md) – Example unit test files for classes, functions, and components

## Forcing Function

Before writing any test file, list the source file's code paths: branches, conditions, early returns, error paths, and edge cases. This serves as the test plan and proves you read the source. Only then write the tests.
