# Functions

## Syntax & Style

- Use arrow functions (unless the codebase uses a different convention)
- **If the function has arguments — exported or private — pass an object and destructure:**
    - **Exported functions:** create an interface called `Params` defining the object argument
    - **Private helpers:** use an inline object type — same rule as class instance methods. (A file with multiple helpers cannot declare multiple `Params` interfaces.)
    - **Why objects:** positional signatures decay under growth — new params get appended out of order, middle params can never be removed, and same-typed slots transpose silently (the compiler can't catch `copyFile(dest, src)`). Object args break the ratchet: call sites self-document, and adding/removing params never breaks ordering.
- **If the function has no arguments:**
    - Do not pass in any arguments
    - Do not create a `Params` interface
- **Sole exception — externally imposed signatures:** callbacks passed to `map`/`reduce`/`sort`, event handlers, and framework hooks have shapes dictated by their caller's contract. Write the signature the contract demands.
- If callers need to *name* the argument type (e.g., to pre-build a typed args object), that type has become part of the public contract — promote it to a named exported interface in `interfaces/` and use it in place of `Params`.
- Export the function on the line it is defined as a named export

## Single Return Point (Single Exit)

Use a single return at the end of the function for business logic. This makes control flow predictable and easier to debug.

**Exception:** Guard clauses at the top of a function may return early for validation or null checks.

## Organization & Structure

- **One EXPORTED function per file — NO EXCEPTIONS**
- The file name matches the exported function name, cased per the package's file-naming convention (see [conventions.md](./conventions.md#file-naming))
- Build smaller, focused functions with a single objective
- If a task requires multiple functions, create a wrapper function that composes these smaller functions

### Private Helpers May Co-Locate

A **non-exported** helper function may live in the same file as the exported function it serves, when **both** are true:

1. It is **not exported** (no `export` keyword)
2. It is called **only** by code in this file

This is the file acting as a module: the export is the public API, non-exported helpers are compiler-enforced private internals. Tests pin the exported function's behavior; helpers are covered through it, and refactoring helpers never breaks tests.

**The moment a helper is needed by a second file, it must be exported — and exported means it moves to its own file** (and is placed per the Code Placement Philosophy). The bright line stays mechanical: `export` keyword → own file.

✅ GOOD: Private helpers co-located with the export they serve

**`buildReportSummary.ts`**

```typescript
interface Params {
	records: ReportRecord[];
}

const sumTotals = ({ records }: { records: ReportRecord[] }) => {
	// reduce callback signature is imposed by Array.prototype.reduce — exempt
	return records.reduce((total, record) => total + record.amount, 0);
};

const countByStatus = ({ records }: { records: ReportRecord[] }) => {
	return records.reduce((counts, record) => {
		counts[record.status] = (counts[record.status] ?? 0) + 1;

		return counts;
	}, {} as Record<string, number>);
};

export const buildReportSummary = ({ records }: Params) => {
	return {
		total: sumTotals({ records }),
		byStatus: countByStatus({ records }),
	};
};
```

Note the split: the exported function uses the `Params` interface; the private helpers use inline object types. Both pass objects.

❌ BAD: Exporting the helpers "so they can be tested"

```typescript
export const sumTotals = ({ records }: { records: ReportRecord[] }) => { /* ... */ }; // WRONG — now it needs its own file
export const countByStatus = ({ records }: { records: ReportRecord[] }) => { /* ... */ }; // WRONG
export const buildReportSummary = ({ records }: Params) => { /* ... */ };
```

❌ BAD: Positional args on a private helper

```typescript
const sumTotals = (records: ReportRecord[], options: SummaryOptions) => { /* ... */ }; // WRONG — object args apply to helpers too
```

Helpers are tested through the exported function. If a helper's branches cannot be reached through the export's inputs, that branch is dead code — delete it. If covering a helper through the export is genuinely impractical (combinatorial inputs), that is the signal the helper has earned promotion to its own file with its own tests.

### Exception: Orchestration Functions

Functions that primarily **compose/coordinate** other well-factored functions may exceed 50 lines if:

1. Each step delegates to a dedicated function (no inline business logic)
2. The orchestration itself is linear/sequential (pipeline pattern)
3. Breaking it further would obscure the overall flow

✅ ACCEPTABLE: 150-line `start()` that calls 8 step functions in sequence
❌ NOT ACCEPTABLE: 150-line function with inline loops, conditionals, and transformations

## Function Size Limits

Functions exceeding 50 lines or handling multiple responsibilities should be split into smaller, focused functions.

| Lines | Assessment                           |
| ----- | ------------------------------------ |
| <=50  | Fine                                 |
| 50-80 | Review — look for extractable logic  |
| 80+   | Needs splitting                      |

File growth is capped mechanically by the `max-lines` lint rule — see the [enforcement doc](../../fdrop:code:standards/docs/enforcement.md).

**Note:** React components and hooks have different thresholds — see the `fdrop:task:refactor-plan` skill for React-specific limits.

### One Exported Function Per File — This Is Not Negotiable

Every **exported** function gets its own file. Do NOT group multiple exported functions together.

**Rationalizations that are NOT valid:**

- "These functions are closely related" → Still separate files
- "They're both config functions" → Still separate files
- "It would be over-engineered to split this" → Still separate files
- "One function is just a helper for the other" → If it's truly a helper, make it **non-exported** and co-locate it (see Private Helpers above). If it's exported, it gets its own file.

❌ BAD: "But loadConfig and saveConfig are related!"

**`config.ts`**

```typescript
export const loadConfig = () => {
	/* ... */
};
export const saveConfig = () => {
	/* ... */
};
```

✅ GOOD: Separate files, always

**`loadConfig.ts`**

```typescript
export const loadConfig = () => {
	/* ... */
};
```

**`saveConfig.ts`**

```typescript
export const saveConfig = () => {
	/* ... */
};
```

❌ BAD: "These are all file utilities!"

**`fileUtils.ts`**

```typescript
export const copyFile = () => {
	/* ... */
};
export const copyDirectory = () => {
	/* ... */
};
export const deleteFile = () => {
	/* ... */
};
```

✅ GOOD: Each exported function in its own file

**`copyFile.ts`**

```typescript
export const copyFile = () => {
	/* ... */
};
```

**`copyDirectory.ts`**

```typescript
export const copyDirectory = () => {
	/* ... */
};
```

**`deleteFile.ts`**

```typescript
export const deleteFile = () => {
	/* ... */
};
```

## Examples

### Function with Args

**`addTwo.ts`**

```typescript
interface Params {
	number1: number;
	number2: number;
}

export const addTwo = ({ number1, number2 }: Params) => {
	return number1 + number2;
};
```

### Function with No Args

**`logHello.ts`**

```typescript
export const logHello = () => {
	console.log('Hello');
};
```

### Guard Clauses (Early Return OK)

**`getUserDisplayName.ts`**

```typescript
interface Params {
	user: User | null;
}

export const getUserDisplayName = ({ user }: Params) => {
	// Guard clauses — early returns are encouraged here
	if (!user) {
		return 'Unknown';
	}

	if (!user.isActive) {
		return 'Inactive User';
	}

	// Business logic — single return point
	const displayName = user.firstName + ' ' + user.lastName;

	return displayName;
};
```

### Single Return Point (Business Logic)

**`calculateFinalScore.ts`**

```typescript
interface Params {
	score: number;
	hasBonus: boolean;
}

export const calculateFinalScore = ({ score, hasBonus }: Params) => {
	const bonus = 10;
	let finalScore = score;

	if (hasBonus) {
		finalScore = finalScore + bonus;
	}

	return finalScore;
};
```

❌ BAD: Multiple returns scattered in business logic

```typescript
export const calculateFinalScore = ({ score, hasBonus }: Params) => {
	if (hasBonus) {
		return score + 10; // Avoid — return buried in logic
	}
	return score;
};
```
