# Enums

## Prefer enums over types when applicable.

**Why this rule exists:** string enums are *nominally* typed — a raw string literal is a compile error where the enum is expected. `Action.Add` is the only thing assignable; a stray `'add'` fails the type check. With a union type, any `'add'` literal anywhere satisfies the type, so raw strings creep back into the codebase and the "define values once" discipline depends on review instead of the compiler. The enum makes it machine-enforced.

Secondary benefits: better IDE autocomplete, safer refactoring, and explicit mapping between code values and representations.

**At boundaries** (JSON payloads, query params, DB values), incoming strings are not the enum — convert with a small validation function (e.g., `parseAction`), never with an `as` cast.

## Never use `const enum`

`const enum` breaks under `isolatedModules` and various transpilers. Always use plain `enum`.

❌ BAD: Type with defined string names

**`common/types/Action.ts`**

```typescript
export type Action = 'add' | 'remove' | 'list' | 'update';
```

✅ GOOD: Enum with defined string names

**`common/enums/Action.ts`**

```typescript
export enum Action {
	Add = 'add',
	Remove = 'remove',
	List = 'list',
	Update = 'update',
}
```

## Discriminants Use Enum Members

Discriminant fields in union families use enum members, not raw string literals — otherwise consumers retype the literal at every narrowing site. TypeScript narrows on enum members identically. The enum gets its own file in `enums/` (consumers use it independently in switches).

✅ GOOD:

```typescript
export interface FileAddedEvent {
	kind: SyncEventKind.FileAdded;
	path: string;
}

// consumer — no raw strings
if (event.kind === SyncEventKind.FileAdded) { /* ... */ }
```

❌ BAD:

```typescript
export interface FileAddedEvent {
	kind: 'file-added'; // literal leaks to every consumer call site
}
```

## Derived Lookup Maps May Co-Locate

A lookup map keyed by the enum (`Record<MyEnum, …>`) may live in the enum's file — the two are tautologically coupled: every change to one changes the other, so separating them across `enums/` and `constants/` guarantees the change is never local. The file lives in `enums/` (the enum is the primary item).

✅ GOOD: Enum + derived lookup map in one file

**`common/enums/LogLevel.ts`**

```typescript
export enum LogLevel {
	Debug = 'debug',
	Info = 'info',
	Error = 'error',
}

export const logLevelLabels: Record<LogLevel, string> = {
	[LogLevel.Debug]: 'Debug',
	[LogLevel.Info]: 'Info',
	[LogLevel.Error]: 'Error',
};
```

The criterion is mechanical: the constant must be keyed by the enum (`Record<MyEnum, …>`). An unrelated constant that merely *uses* the enum goes in `constants/` as usual.

## `as const` objects

Prefer enums over `as const` objects for sets of named string values. Enums provide better IDE autocomplete, self-documenting code, and safer refactoring.

Use `as const` only when you need a frozen object structure (e.g., config maps with heterogeneous values) rather than a simple set of named constants.

❌ BAD: `as const` for a set of named string values

```typescript
export const Action = {
	Add: 'add',
	Remove: 'remove',
	List: 'list',
	Update: 'update',
} as const;
```

✅ GOOD: Use an enum instead (see above)
