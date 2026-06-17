# Conventions

## Language

- TypeScript

## Formatting

- Follow the project's formatter configuration if present (e.g., \`.prettierrc\`, \`biome.json\`)
- Follow the project's linter rules if present (e.g., \`eslint.config.mjs\`, \`.eslintrc\`)
- If no formatter/linter is configured, use consistent formatting throughout

## Casing

| Item              | Convention                 | Example                                   |
| ----------------- | -------------------------- | ----------------------------------------- |
| Variables         | camelCase                  | \`userName\`, \`isActive\`                |
| Functions/Methods | camelCase                  | \`getUserName()\`, \`calculateTotal()\`   |
| Classes           | PascalCase                 | \`UserService\`, \`ApiClient\`            |
| Interfaces        | PascalCase                 | \`UserProfile\`, \`ApiResponse\`          |
| Types             | PascalCase                 | \`UserId\`, \`RequestOptions\`            |
| Value constants   | camelCase                  | \`maxRetries\`, \`emailRegex\`            |
| Named constants   | PascalCase                 | \`Action\`, \`LogLevel\` (see [named-constants.md](./named-constants.md)) |
| File names        | See per-package rule below  | —                                         |

### File Naming

The file name always matches the **exported item's name, including its casing** (see the table below). Resolve the casing in this order:

1. **Existing files in the same directory** — match their convention
2. **The package's framework doc** — e.g., NestJS packages use \`kebab-case.{suffix}.ts\` (see the architecture skill's framework docs)
3. **Default** (new/empty directory, no framework rule): match the export name's own casing per the rule above

| Convention                          | Applies to                                  | Example                                |
| ----------------------------------- | ------------------------------------------- | -------------------------------------- |
| camelCase matching the export name  | functions, value constants                  | \`buildVersionedLabel.ts\`, \`maxRetries.ts\` |
| PascalCase matching the export name | classes, interfaces, types, named constants | \`UserProfile.ts\`, \`Action.ts\`          |
| kebab-case (framework-mandated)     | per framework doc                           | \`get-frontend-domain.ts\`               |

**Framework mandates override casing entirely** — e.g., NestJS services are \`events.service.ts\` even though the class itself is PascalCase.

## Variables

- Always use verbose and readable variable names
- Code should be readable enough that a new developer can understand it without additional documentation
- Avoid single-letter variables except in small loops (\`i\`, \`j\`) or well-known conventions (\`e\` for event)

## Don't Hoist Single-Use Scalars

Don't hoist single-use scalars to module scope or a constants file. If a value is used by one function and isn't a map, declare it inline — \`const maxRetries = 10;\` inside the method. Promote to a module-level constant (or a \`constants/\` file) only when (a) it's consumed in 2+ places, or (b) it's a lookup map or structured config.

❌ BAD: hoisted single-use scalar

\`\`\`typescript
const MAX_RETRIES = 10; // module scope, screaming-snake — and only one caller below

const fetchWithRetry = async () => {
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) { /* ... */ }
};
\`\`\`

✅ GOOD: declared inline where it's used

\`\`\`typescript
const fetchWithRetry = async () => {
	const maxRetries = 10;
	for (let attempt = 0; attempt < maxRetries; attempt++) { /* ... */ }
};
\`\`\`

## Naming Consistency

Standardize naming patterns within each domain. Pick one convention and use it consistently:

- Data fetching: choose one of \`getData\` / \`fetchData\` / \`loadData\` — not a mix
- Boolean variables: use consistent prefixes (\`is\`, \`has\`, \`should\`, \`can\`)
- Event handlers: use consistent patterns (\`onSubmit\`, \`handleSubmit\` — pick one)

**Rule:** If the codebase already uses a naming pattern for a domain, follow it. Do not introduce a competing convention.

## Naming for Reuse

Think like a principal engineer: every name you create should assume it will be reused in contexts you haven't imagined yet.

**Name things by what they ARE, never by where or how they're currently used.**

The test: "Could someone use this in a completely different part of the app without the name being misleading?" If no, the name is too specific.

| Category | ❌ Bad (context-specific) | ✅ Good (generic, reusable) |
| --- | --- | --- |
| CSS variables | `--heading-navy`, `--sidebar-text` | `--drop-navy`, `--text-muted` |
| Constants | `heroMaxWidth`, `pricingCardGap` | `maxContentWidth`, `cardGap` |
| Utils | `formatPricingDate()` | `formatDate()` |
| Constants | `HeroButtonVariant` | `ButtonVariant` |
| Components | `PricingPageCard` | `PlanCard` |

This applies to everything you extract or create: CSS custom properties, Tailwind theme tokens, constants, utility functions, components, interfaces, and types.

**When extracting code**, always ask:

1. Is this name tied to a specific screen, section, or feature when it doesn't need to be?
2. Does the existing codebase have a naming pattern for this kind of thing? (e.g., `--drop-*` for brand colors)
3. Will this name still make sense if the item moves to `common/` later?

If a value is truly feature-specific and will never be reused, scoping the name is fine. But default to generic — you can always narrow later, but renaming a widely-used token is expensive.
