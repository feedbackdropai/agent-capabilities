# Backend API Architecture

Package-specific architecture decisions for `packages/backend-api`.

This package uses NestJS — read [NestJS architecture](../nestjs/architecture-decisions.md) first.

> All paths in this document are relative to `packages/backend-api/`.

## Folder Structure Overview

> These trees reflect the intended structure. Use `Glob` with `src/*/` or `src/app/routes/*/` to verify the current state.

```
src/
├── app/                       # Application layer (NestJS modules)
│   └── ...
├── base/                      # Foundation layer (reusable infrastructure)
│   └── ...
├── generated/                 # Prisma generated output
│   └── ...
└── mastra/                    # AI/Agent layer
    └── ...
```

## Layer Responsibilities

### `app/` - Application Layer

Contains the NestJS application code that implements business logic.

- **`models/`** - Auto-generated CRUD modules from Prisma schema (do not edit directly)
- **`routes/`** - Custom route modules with business logic
- **`modules/`** - Shared NestJS modules (queue, integrations)
- **`common/`** - App-wide constants, inputs, scalars

### `base/` - Foundation Layer

Reusable infrastructure code that could theoretically be extracted to a shared library.

- **`services/`** - Infrastructure services (Prisma, S3, GraphQL, image processing)
- **`generators/`** - Code generation for models
- **`server/`** - Server configuration and constants
- **`common/`** - Base utilities, middleware, constants

### `mastra/` - AI Layer

Mastra AI integration for agents and workflows. Code that depends on the Mastra SDK belongs here. Business logic that merely calls an agent goes in `app/routes/`.

- **`agents/`** - AI agent definitions
- **`providers/`** - Model providers (OpenAI)
- **`tools/`** - Agent tools
- **`common/`** - AI-specific constants and utilities

> This layer is intentionally lightweight — follow the subfolder conventions above and the shared architecture rules. No additional framework-specific patterns apply.

## Code Placement Hierarchy

| Scope               | Location                         | When to Use                               |
| ------------------- | -------------------------------- | ----------------------------------------- |
| Base infrastructure | `src/base/common/`               | Foundational utilities used across layers |
| App-wide            | `src/app/common/`                | Used by 2+ route modules                  |
| Route-specific      | `src/app/routes/{route}/common/` | Used within one route module              |
| Model-specific      | `src/app/models/{model}/common/` | Used within one model module              |

## Import Aliases

Read `packages/backend-api/tsconfig.json` → `compilerOptions.paths` for the current alias map. Do not hardcode aliases from memory — the tsconfig is the source of truth.

## Barrel Exports (`index.ts`)

Barrel exports follow the shared rules in [architecture-decisions.md](../architecture-decisions.md#barrel-exports-indexts). Backend-api-specific addition:

- **Import paths use aliases** — e.g., `export { EventsService } from '@routes/events/events.service'`
