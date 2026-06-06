# Enums

## Prefer enums over types when applicable.

Enums provide better IDE autocomplete, safer refactoring, and explicit mapping between code values and representations.

❌ BAD: Type with defined string names

**`common/types/action.ts`**

```typescript
export type Action = 'add' | 'remove' | 'list' | 'update';
```

✅ GOOD: Enum with defined string names

**`common/enums/action.ts`**

```typescript
export enum Action {
	Add = 'add',
	Remove = 'remove',
	List = 'list',
	Update = 'update',
}
```

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
