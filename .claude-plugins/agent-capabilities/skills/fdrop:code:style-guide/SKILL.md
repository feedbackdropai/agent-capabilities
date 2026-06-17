---
name: fdrop:code:style-guide
description: Code style requirements and formatting patterns. Use when writing or reviewing code to ensure consistency.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Style Guide

Follow the rules in the linked docs — they're requirements, not suggestions. Consistency is what keeps the codebase predictable to edit, for agents and humans alike.

## Required Reading

Before writing any code, read these documents:

Conventions ([`conventions/`](./references/conventions/)):

- [conventions/formatting.md](./references/conventions/formatting.md) – Language, formatter, and linter baseline
- [conventions/casing.md](./references/conventions/casing.md) – Identifier casing
- [conventions/file-naming.md](./references/conventions/file-naming.md) – File-name casing and resolution order
- [conventions/variable-declaration.md](./references/conventions/variable-declaration.md) – Variable naming and inline-vs-hoisted scalars
- [conventions/naming.md](./references/conventions/naming.md) – Naming consistency and naming for reuse

Patterns ([`patterns/`](./references/patterns/)):

- [patterns/functions.md](./references/patterns/functions.md) – Function patterns
- [patterns/classes.md](./references/patterns/classes.md) – Class patterns
- [patterns/named-constants.md](./references/patterns/named-constants.md) – Named constants (unions + `const` objects)

TypeScript ([`typescript/`](./references/typescript/)):

- [typescript/return-types.md](./references/typescript/return-types.md) – Explicit return types on exports
- [typescript/import-type.md](./references/typescript/import-type.md) – `import type` for type-only imports
- [typescript/avoid-any.md](./references/typescript/avoid-any.md) – Avoid `any`; prefer `unknown`/narrowing
- [typescript/type-assertions.md](./references/typescript/type-assertions.md) – Avoid `as`; prefer narrowing

Imports & module structure ([`structure/`](./references/structure/)):

- [structure/one-export-per-file.md](./references/structure/one-export-per-file.md) – One exported item per file (and the closed exception list)
- [structure/import-paths.md](./references/structure/import-paths.md) – Path-alias import strategy
- [structure/module-boundaries.md](./references/structure/module-boundaries.md) – Module boundaries, exports, and barrel files
- [structure/type-placement.md](./references/structure/type-placement.md) – Where types and interfaces live (and interface-vs-type)
- [structure/constant-placement.md](./references/structure/constant-placement.md) – Where constants live
