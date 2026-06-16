# NestJS Architecture

Architecture decisions for NestJS packages.

## Route Module Structure

GraphQL resolvers are the default for all model CRUD and internal queries. REST controllers are used only for external inbound endpoints — event ingestion, third-party webhooks, and similar non-GraphQL integrations.

Each route in `src/app/routes/` follows this NestJS pattern:

```
routes/{route}/
├── {route}.module.ts          # NestJS module definition
├── {route}.resolver.ts        # GraphQL resolver (default)
├── {route}.controller.ts      # REST controller (external inbound only)
├── {route}.service.ts         # Business logic service
├── {route}.resolver.unit.test.ts
├── {route}.service.unit.test.ts
├── common/                    # Route-specific shared code
│   └── types/
├── dto/                       # Data transfer objects
│   ├── inputs/                # GraphQL input types
│   └── models/                # GraphQL response models
├── guards/                    # Route-specific guards
└── jobs/                      # Background job processors
    └── {job-name}/
        ├── {job-name}.service.ts
        ├── {job-name}.service.unit.test.ts
        └── index.ts
```

### Jobs

Routes that enqueue background work place job processors under `jobs/{job-name}/`. Each job folder contains a service (with the processing logic) and its unit test. The parent route module registers the job service as a provider.

## DTO Organization

```
dto/
├── inputs/                    # @InputType() classes
│   └── session.input.ts
└── models/                    # @ObjectType() response classes
    └── session-response.model.ts
```

## File Naming Conventions

All files use `kebab-case` naming:

| File type | Convention | Example |
|-----------|------------|---------|
| Modules, services, resolvers, controllers, guards | `kebab-case.{suffix}.ts` | `events.service.ts`, `events.module.ts` |
| Tests | `kebab-case.{suffix}.unit.test.ts` | `events.service.unit.test.ts` |
| DTOs (inputs) | `kebab-case.input.ts` | `session.input.ts` |
| DTOs (models) | `kebab-case.model.ts` | `session-response.model.ts` |
| Enums, constants | `kebab-case.ts` | `asset-type.ts`, `s3-bucket-name.ts` |
| Folders | `kebab-case` | `api-tokens/`, `console-logs/` |
