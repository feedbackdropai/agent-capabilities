# TypeScript

## Return Types — Explicit on Exports, Inferred Internally

The bright line is the `export` keyword — the same trigger as "own file" and the `Params` interface:

- **Exported function** → declare the return type. The annotation is the output half of the public contract, exactly as `Params` is the input half.
- **Non-exported function** (private helpers, callbacks) → always infer. Annotations on internals are noise; the consumer is in the same file and inference is precise there.

**Why this rule exists:** with inference, an exported function's return type is whatever the body happens to return today. A refactor can silently widen or change the public contract, and the diff reads as an implementation edit — the error surfaces later, in a consumer's file, several inference hops away. An explicit annotation fails at the definition site the moment the body stops satisfying the contract, and an intentional API change becomes a visible diff line. It also keeps the codebase compatible with TypeScript's `isolatedDeclarations`.

✅ GOOD:

```typescript
interface Params {
	user: User | null;
}

export const getUserDisplayName = ({ user }: Params): string => {
	// ...
};

const sumTotals = ({ records }: { records: ReportRecord[] }) => {
	// private helper — inferred
};
```

❌ BAD:

```typescript
export const getUserDisplayName = ({ user }: Params) => { /* ... */ }; // WRONG — exported, contract is implicit

const sumTotals = ({ records }: { records: ReportRecord[] }): number => { /* ... */ }; // WRONG — internal, annotation is noise
```

**Exceptions** (inference is correct on these even when exported):

1. **Framework components** — React components don't annotate `JSX.Element`.
2. **Generic-heavy signatures** — when the written return type would be an unreadable conditional-type expression, the generic signature is the contract; infer.
3. **Interface-pinned signatures** — methods implementing a declared interface (e.g., a `RecordSource` implementation) are already contracted by the interface; restating the type is duplication.

**Migration:** new exported functions comply immediately; existing exported functions gain a return type when touched. Never remove a return type from an exported function.

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
- If you must bypass the type system in a rare edge case, add the project's lint-suppression comment with an explanation of why.

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
