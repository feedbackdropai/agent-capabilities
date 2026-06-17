---
name: fdrop:code:style-guide
description: Code style requirements and formatting patterns. Use when writing or reviewing code to ensure consistency.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Style Guide

Follow the rules in the linked docs — they're requirements, not suggestions. Consistency is what keeps the codebase predictable to edit, for agents and humans alike.

## Required Reading

Before writing any code, read these documents:

Conventions:

- [formatting.md](./docs/formatting.md) – Language, formatter, and linter baseline
- [casing.md](./docs/casing.md) – Identifier casing
- [file-naming.md](./docs/file-naming.md) – File-name casing and resolution order
- [variable-declaration.md](./docs/variable-declaration.md) – Variable naming and inline-vs-hoisted scalars
- [naming.md](./docs/naming.md) – Naming consistency and naming for reuse

Patterns:

- [functions.md](./docs/functions.md) – Function patterns
- [classes.md](./docs/classes.md) – Class patterns
- [named-constants.md](./docs/named-constants.md) – Named constants (unions + `const` objects)
- [typescript.md](./docs/typescript.md) – TypeScript rules

Imports & module structure:

- [one-export-per-file.md](./docs/one-export-per-file.md) – One exported item per file (and the closed exception list)
- [import-paths.md](./docs/import-paths.md) – Path-alias import strategy
- [module-boundaries.md](./docs/module-boundaries.md) – Module boundaries, exports, and barrel files
- [type-placement.md](./docs/type-placement.md) – Where types and interfaces live (and interface-vs-type)
- [constant-placement.md](./docs/constant-placement.md) – Where constants live
