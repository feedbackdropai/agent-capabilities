# Web App Architecture

Package-specific architecture decisions for `packages/web-app`.

This package uses React and TanStack Start — read [React architecture](../react/architecture-decisions.md) and [TanStack Start architecture](../tanstack-start/architecture-decisions.md) first.

> All paths in this document are relative to `packages/web-app/`.

## Folder Structure Overview

> These trees reflect the intended structure. Use `Glob` with `src/*/` or `src/features/*/` to verify the current state.

```
src/
├── common/                    # App-wide shared code
│   └── ...
├── features/                  # Feature modules
│   └── ...
├── gql/                       # Generated GraphQL types
├── routes/                    # TanStack Router route definitions
└── styles/                    # Global CSS
```

## Import Aliases

Read `packages/web-app/tsconfig.json` → `compilerOptions.paths` for the current alias map. Do not hardcode aliases from memory — the tsconfig is the source of truth.

## Key Patterns

### Generated GraphQL Types

Always use types from `src/gql/graphql.ts` instead of creating custom interfaces for GraphQL data.

After modifying `serverFns` GraphQL documents, run `pnpm web-app:gen:gql` then check the generated file for available types.

```typescript
// ✅ GOOD: Import from generated types
import type { ConsoleLogSummary } from '@/gql/graphql';

// ❌ BAD: Creating a custom interface that duplicates generated types
export interface ConsoleLogSummary {
	id: number;
	level: string;
	// ...
}
```
