# Shared Package Architecture

Package-specific architecture decisions for `packages/shared`.

> All paths in this document are relative to `packages/shared/`.

## Folder Structure Overview

> These trees reflect the intended structure. Use `Glob` with `src/*/` to verify the current state.

```
src/
├── errors/                    # Shared error types and codes
│   ├── constants/
│   ├── types/
│   └── ...
├── permissions/               # Permission logic and constants
│   ├── common/
│   ├── constants/
│   ├── utils/
│   └── README.md
├── plans/                     # Plan definitions and limits
│   ├── common/
│   ├── constants/
│   ├── utils/
│   └── README.md
```

Each domain folder follows the same `common/` pattern as the rest of the monorepo: `constants/`, `utils/`, and `types/` as needed.

## File Naming Conventions

This package's established convention is `camelCase.ts` for all files. Folders follow the default — `camelCase`, or `PascalCase` for a folder graduated from a PascalCase item (see [folder-structure.md](../folder-structure.md#folder-naming)).

| File type | Convention | Example |
|-----------|------------|---------|
| Utils | `camelCase.ts` | `hasPermission.ts` |
| Constants | `camelCase.ts` | `planLimits.ts` |
| Types & interfaces | `camelCase.ts` | `permissionContext.ts` |
| Folders | `camelCase` | `permissions/`, `errors/` |
