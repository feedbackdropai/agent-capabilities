# TypeScript

## Avoid explicit return types

Let TypeScript infer return types. Explicit return types make code brittle—implementation changes require updating the type too.

❌ `function getUser(id: string): User { ... }`

✅ `function getUser(id: string) { ... }`

**Refactoring note:** When refactoring existing code, remove explicit return types to simplify maintenance. This reduces the burden of keeping return types in sync with implementation changes.

## Use `import type` for type-only imports

When importing interfaces, types, or anything used only in type positions, use `import type`. This ensures the import is erased at compile time and avoids unnecessary runtime dependencies.

✅ GOOD:

```typescript
import type { UserProfile } from '@/common/interfaces';
import type { UserId } from '@/common/types';
```

❌ BAD:

```typescript
import { UserProfile } from '@/common/interfaces';
import { UserId } from '@/common/types';
```

**Rule:** If the imported symbol is only used in type annotations, parameter types, or generic arguments — use `import type`.

## Avoid `any`

Do not use `any`. It disables type checking and defeats the purpose of TypeScript.

- Use `unknown` when the type is genuinely not known — then narrow with type guards before using it.
- Use specific types or generics when the structure is known.
- If you must bypass the type system in a rare edge case, add a `// eslint-disable` comment explaining why.

✅ GOOD:

```typescript
const parsePayload = ({ raw }: { raw: unknown }) => {
	if (typeof raw === 'string') {
		return JSON.parse(raw);
	}

	throw new Error('Expected string payload');
};
```

❌ BAD:

```typescript
const parsePayload = ({ raw }: { raw: any }) => {
	return JSON.parse(raw);
};
```

## Type assertions (`as`)

Avoid `as` casts. They tell the compiler to trust you instead of proving the type is correct.

- Prefer type narrowing with `typeof`, `instanceof`, or discriminated unions.
- If an assertion is truly necessary (e.g., a library returns `unknown`), add a brief comment explaining why narrowing is not possible.

✅ GOOD: Narrowing

```typescript
if (typeof value === 'string') {
	return value.toUpperCase();
}
```

❌ BAD: Assertion without justification

```typescript
return (value as string).toUpperCase();
```
