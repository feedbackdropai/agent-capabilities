# Imports/Exports

## One Exported Item Per File

- Each **exported** function, class, interface, type, enum, or constant has its own dedicated file
- The file name matches the exported item name (cased per the package's file-naming convention)
- Non-exported items (private helpers, local types) may co-locate with the export they serve

### The Closed Exception List

These are the **only** cases where a file may contain more than one item. Every exception has a mechanical criterion — there is no judgment call:

| # | Exception | Criterion |
|---|-----------|-----------|
| 1 | `Params` / `ConstructorParams` interfaces | Stays in the file of its function/class; not exported independently |
| 2 | Private helpers | Not exported; called only within this file (see [functions.md](./functions.md#private-helpers-may-co-locate)) |
| 3 | Discriminated union families | A union type and its member types share one file when the members exist only as constituents of that union |
| 4 | Enum + derived lookup map | A lookup map keyed by the enum (`Record<MyEnum, …>`) may live in the enum's file (see [enums.md](./enums.md#derived-lookup-maps-may-co-locate)) |

### Multiple Exported Items — Still Not Negotiable

Multiple **exported** items of independent meaning never share a file.

**Rationalizations that are NOT valid:**

- "The interface is only used by this constant" → Still separate files
- "They're closely related" → Still separate files
- "It's just a small helper" → If it's a helper, make it non-exported (exception 2). If it's exported, separate file.

❌ BAD: Exported interface and exported constant in same file

**`config.ts`**

```typescript
export interface Config {
	name: string;
}

export const defaultConfig: Config = { name: 'default' };
```

✅ GOOD: Separate files

**`common/interfaces/config.ts`**

```typescript
export interface Config {
	name: string;
}
```

**`common/constants/defaultConfig.ts`**

```typescript
import type { Config } from '@/path/to/common/interfaces/config';

export const defaultConfig: Config = { name: 'default' };
```

✅ GOOD: Discriminated union family in one file (exception 3)

**`common/types/syncEvent.ts`**

```typescript
import { SyncEventKind } from '@/common/enums/syncEventKind';

export interface FileAddedEvent {
	kind: SyncEventKind.FileAdded;
	path: string;
}

export interface RecordParsedEvent {
	kind: SyncEventKind.RecordParsed;
	recordId: string;
}

export type SyncEvent = FileAddedEvent | RecordParsedEvent;
```

The discriminant uses enum members, not raw literals — see [enums.md](./enums.md#discriminants-use-enum-members). The enum lives in its own file in `enums/`.

The members exist only as constituents of `SyncEvent` — splitting them across files would fragment one concept. If a member type starts being used independently of the union, it moves to its own file.

## Import Path Strategy

**Use the package's configured path alias for every import.**

- When a package defines path aliases, NEVER use relative paths (`./`, `../`) — not even for sibling files, `common/` subfolders, or barrel re-exports
- If a package defines **no** path aliases, use relative paths consistently — and consider adding aliases
- This applies to every file: components, constants, interfaces, types, utils, hooks, etc.

### Path Aliases

Each package defines its own path aliases in `tsconfig.json` → `compilerOptions.paths`. Common patterns:

| Alias    | Example                                   |
| -------- | ----------------------------------------- |
| `@/*`    | `import { X } from '@/common/utils/X'`    |
| `@src/*` | `import { X } from '@src/common/utils/X'` |

**Rule:** Always check the package's `tsconfig.json` `paths` field to determine the correct alias. Do not hardcode aliases from memory.

✅ GOOD: Path alias for everything

```typescript
import { ClassName } from '@/path/to/ClassName';
import { methodName } from '@/common/utils/methodName';
import { features } from '@/features/home/components/HomeIssueDetails/common/constants';
import { MockIssuePanel } from '@/features/home/components/HomeIssueDetails/components/MockIssuePanel';
```

❌ BAD: Relative paths in an alias-configured package

```typescript
import { helper } from './helper';
import { util } from '../common/utils/util';
import { features } from './common/constants';
```

## Module Boundaries

A **folder-module** (a feature, route, screen, graduated class or component — see the [architecture decisions](../../fdrop:code:architecture/docs/architecture-decisions.md#modules--the-graduation-rule)) has a public API: its `index.ts`.

**The boundary rule:**

- **Crossing a module boundary:** import ONLY from the module's `index.ts`. Never reach into another module's internals.
- **Inside a module:** import directly from specific files. Deep imports within your own module are correct, not a violation.

The `index.ts` is the module's deliberate public API, not a directory listing.

✅ GOOD: Cross-module import through the index

```typescript
// in features/reports/...
import { ingestRecords } from '@/ingestion';
```

❌ BAD: Reaching into another module's internals

```typescript
// in features/reports/...
import { normalizeRecord } from '@/ingestion/common/utils/normalizeRecord'; // WRONG — internal
```

✅ GOOD: Deep import within your own module

```typescript
// in ingestion/ingestRecords.ts
import { normalizeRecord } from '@/ingestion/common/utils/normalizeRecord';
```

## Module Exports

### Functions and Classes

- Always use named exports
- Export class, method, interface, enums, etc. on the same line it is defined

#### Example Function

**`myNewMethod.ts`** (file name follows [per-package convention](./conventions.md#file-naming))

```typescript
export const myNewMethod = () => {
	// Method code here
};
```

#### Example Class

**`MyNewClass.ts`**

```typescript
export class MyNewClass {
	// Class code here
}
```

#### Example Interface

**`MyInterface.ts`**

```typescript
export interface MyInterface {
	property1: string;
	property2: number;
}
```

#### Example Enum

**`MyEnum.ts`**

```typescript
export enum MyEnum {
	Value1 = 'value1',
	Value2 = 'value2',
}
```

## Barrel Files (`index.ts`)

A barrel file is the module's **public API contract** — it lists exactly what consumers may use.

**Rules:**

1. **Use named re-exports** — `export { Foo } from '<path>'`, never `export *`
2. **One export per line** — makes diffs clean and review easy
3. **Export deliberately** — the barrel exports the module's intended public surface. It MAY re-export from subfolders when those items are intentionally public; everything it omits is internal.
4. **Internal subfolders** (`common/utils/`, `common/interfaces/`, etc.) keep their own `index.ts` for tidy intra-module imports, but those barrels are internal — nothing outside the module imports from them (the boundary rule above).

✅ GOOD: Barrel as deliberate public API

**`ingestion/index.ts`**

```typescript
export { ingestRecords } from '@/ingestion/ingestRecords';
export type { RawRecord } from '@/ingestion/common/interfaces/rawRecord';
```

`RawRecord` is re-exported from a subfolder *on purpose* — it is part of the module's contract. `normalizeRecord` is not exported — it is internal, and the lint boundary makes that real.

## Folder Organization for Types, Interfaces, and Constants

Organize shared items in their own folders based on what they are:

| Item       | Folder               | Syntax               |
| ---------- | -------------------- | -------------------- |
| Interfaces | `common/interfaces/` | `export interface …` |
| Types      | `common/types/`      | `export type …`      |
| Constants  | `common/constants/`  | `export const …`     |
| Enums      | `common/enums/`      | `export enum …`      |

A discriminated union family (exception 3) lives in `types/` under the union's name. An enum with its lookup map (exception 4) lives in `enums/` under the enum's name.

## Interfaces vs Types - They Are Different

- **Interfaces** (`export interface`) go in `interfaces/` folder
- **Types** (`export type`) go in `types/` folder
- Do NOT mix them in the same folder

**When to use which:** Use an `interface` for object shapes (it extends and merges cleanly). Use a `type` for everything an interface cannot express — unions, intersections, mapped types, primitives, tuples, function signatures. When either would work for an object shape, use `interface`.

✅ GOOD: Interface in interfaces folder

**`common/interfaces/userProfile.ts`**

```typescript
export interface UserProfile {
	id: string;
	name: string;
}
```

✅ GOOD: Type in types folder

**`common/types/userId.ts`**

```typescript
export type UserId = string;
```

❌ BAD: Interface in types folder

**`common/types/userProfile.ts`**

```typescript
export interface UserProfile {
	// WRONG FOLDER
}
```

❌ BAD: Type in interfaces folder

**`common/interfaces/userId.ts`**

```typescript
export type UserId = string; // WRONG FOLDER
```

## Where Non-Params Interfaces Belong

The `Params` interface for a function stays with the function. **All other exported interfaces** go in the `interfaces/` folder.

✅ GOOD: Params stays with function

**`copyFile.ts`**

```typescript
interface Params {
	sourcePath: string;
	destPath: string;
}

export const copyFile = ({ sourcePath, destPath }: Params) => {
	/* ... */
};
```

✅ GOOD: Return type interface in interfaces folder

**`common/interfaces/copyResult.ts`**

```typescript
export interface CopyResult {
	success: boolean;
	bytesWritten: number;
}
```

❌ BAD: Exported non-Params interface defined in function file

**`copyFile.ts`**

```typescript
export interface CopyResult {
	// SHOULD BE IN common/interfaces/
	success: boolean;
}
```

## Constants Get Their Own Folder

Constants are NOT types or interfaces. They go in `constants/` folder.

✅ GOOD: Constant in constants folder

**`common/constants/defaultConfig.ts`**

```typescript
import type { Config } from '@/path/to/common/interfaces/config';

export const defaultConfig: Config = {
	name: 'default',
};
```

❌ BAD: Constant in types folder

**`common/types/defaultConfig.ts`**

```typescript
export const defaultConfig = {}; // CONSTANTS DON'T GO IN TYPES
```
