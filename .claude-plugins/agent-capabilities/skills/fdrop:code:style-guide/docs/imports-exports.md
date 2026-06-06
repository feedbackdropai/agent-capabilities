# Imports/Exports

## One Item Per File - NO EXCEPTIONS

- Each function, class, interface, type, enum, or constant should have its own dedicated file
- The file name should match the exported item name, unless a different pattern already exists in the codebase
- **Only exception:** `Params` interfaces for function parameters and `ConstructorParams` for class constructors may remain in the same file as their associated function/class

### This Rule Is Not Negotiable

Do NOT put multiple items in the same file. Ever.

**Rationalizations that are NOT valid:**

- "The interface is only used by this constant" → Still separate files
- "They're closely related" → Still separate files
- "It's just a small helper" → Still separate files

❌ BAD: Interface and constant in same file

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

**`common/constants/default-config.ts`**

```typescript
import type { Config } from '@/path/to/common/interfaces/config';

export const defaultConfig: Config = { name: 'default' };
```

## Import Path Strategy

**Always use the package's configured path alias for every import. No exceptions.**

- NEVER use relative paths (`./`, `../`) — not even for sibling files, `common/` subfolders, or barrel re-exports
- This applies to every file: components, constants, interfaces, types, utils, hooks, etc.

### Path Aliases

Each package defines its own path aliases in `tsconfig.json` → `compilerOptions.paths`. Common patterns:

| Alias    | Example                                   |
| -------- | ----------------------------------------- |
| `@/*`    | `import { X } from '@/common/utils/X'`    |
| `@src/*` | `import { X } from '@src/common/utils/X'` |

**Rule:** Always check the package's `tsconfig.json` `paths` field to determine the correct alias.

✅ GOOD: Path alias for everything

```typescript
import { ClassName } from '@/path/to/ClassName';
import { methodName } from '@/common/utils/methodName';
import { features } from '@/features/home/components/HomeIssueDetails/common/constants';
import { MockIssuePanel } from '@/features/home/components/HomeIssueDetails/components/MockIssuePanel';
```

❌ BAD: Relative paths (even within same folder)

```typescript
import { helper } from './helper';
import { util } from '../common/utils/util';
import { features } from './common/constants';
```

## Module Exports

### Functions and Classes

- Always use named exports
- Export class, method, interface, enums, etc. on the same line it is defined

#### Example Function

**`myNewMethod.ts`** (file name follows [per-package convention](./conventions.md#file-naming-by-package))

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

## Barrel File Scope

Barrel files (`index.ts`) should **only export items from their own directory level** — never from subfolders.

### Why This Matters

- Keeps barrel files focused and predictable
- Avoids circular dependency issues
- Makes it clear where items originate
- Consumers import from the appropriate depth

### Rule

- `MyComponent/index.ts` exports only files directly in `MyComponent/`
- It does NOT re-export from `MyComponent/common/types/` or other subfolders
- Consumers needing subfolder items import directly from those paths

❌ BAD: Barrel re-exports from subfolders

**`DataTable/index.ts`**

```typescript
export { SortableHeader } from '@/common/components/appUI/DataTable/SortableHeader';
export { FilterDropdown } from '@/common/components/appUI/DataTable/FilterDropdown';
export type { TableAlignment } from '@/common/components/appUI/DataTable/common/types'; // WRONG
```

✅ GOOD: Barrel only exports its own level

**`DataTable/index.ts`**

```typescript
export { SortableHeader } from '@/common/components/appUI/DataTable/SortableHeader';
export { FilterDropdown } from '@/common/components/appUI/DataTable/FilterDropdown';
```

**Consumer imports type directly:**

```typescript
import { SortableHeader } from '@/common/components/appUI/DataTable';
import type { TableAlignment } from '@/common/components/appUI/DataTable/common/types';
```

## Folder Organization for Types, Interfaces, and Constants

Organize shared items in their own folders based on what they are:

| Item       | Folder               | Syntax               |
| ---------- | -------------------- | -------------------- |
| Interfaces | `common/interfaces/` | `export interface …` |
| Types      | `common/types/`      | `export type …`      |
| Constants  | `common/constants/`  | `export const …`     |
| Enums      | `common/enums/`      | `export enum …`      |

## Interfaces vs Types - They Are Different

- **Interfaces** (`export interface`) go in `interfaces/` folder
- **Types** (`export type`) go in `types/` folder
- Do NOT mix them in the same folder

✅ GOOD: Interface in interfaces folder

**`common/interfaces/user-profile.ts`**

```typescript
export interface UserProfile {
	id: string;
	name: string;
}
```

✅ GOOD: Type in types folder

**`common/types/user-id.ts`**

```typescript
export type UserId = string;
```

❌ BAD: Interface in types folder

**`common/types/user-profile.ts`**

```typescript
export interface UserProfile {
	// WRONG FOLDER
}
```

❌ BAD: Type in interfaces folder

**`common/interfaces/user-id.ts`**

```typescript
export type UserId = string; // WRONG FOLDER
```

## Where Non-Params Interfaces Belong

The `Params` interface for a function stays with the function. **All other interfaces** go in the `interfaces/` folder.

✅ GOOD: Params stays with function

**`copy-file.ts`**

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

**`common/interfaces/copy-result.ts`**

```typescript
export interface CopyResult {
	success: boolean;
	bytesWritten: number;
}
```

❌ BAD: Non-Params interface defined in function file

**`copy-file.ts`**

```typescript
interface CopyResult {
	// SHOULD BE IN common/interfaces/
	success: boolean;
}
```

## Constants Get Their Own Folder

Constants are NOT types or interfaces. They go in `constants/` folder.

✅ GOOD: Constant in constants folder

**`common/constants/default-config.ts`**

```typescript
import type { Config } from '@/path/to/common/interfaces/config';

export const defaultConfig: Config = {
	name: 'default',
};
```

❌ BAD: Constant in types folder

**`common/types/default-config.ts`**

```typescript
export const defaultConfig = {}; // CONSTANTS DON'T GO IN TYPES
```
