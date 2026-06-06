# Functions

## Syntax & Style

- Use arrow functions (unless the codebase uses a different convention)
- **If the function has arguments:**
    - Pass an object as argument and destructure
    - Create an interface called `Params` defining the object argument
    - This allows flexible args without chronological ordering
- **If the function has no arguments:**
    - Do not pass in any arguments
    - Do not create a `Params` interface
- Export the function on the line it is defined as a named export

## Single Return Point (Single Exit)

Use a single return at the end of the function for business logic. This makes control flow predictable and easier to debug.

**Exception:** Guard clauses at the top of a function may return early for validation or null checks.

## Organization & Structure

- **Create a new file for each function — NO EXCEPTIONS**
- The file name should match the function name
- Build smaller, focused functions with a single objective
- If a task requires multiple functions, create a wrapper function that composes these smaller functions

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

**Note:** React components and hooks have different thresholds — see the `fdrop:task:refactor-plan` skill for React-specific limits.

### One Function Per File — This Is Not Negotiable

Every function gets its own file. Do NOT group "related" functions together.

**Rationalizations that are NOT valid:**

- "These functions are closely related" → Still separate files
- "They're both config functions" → Still separate files
- "It would be over-engineered to split this" → Still separate files
- "One function is just a helper for the other" → Still separate files

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

**`load-config.ts`**

```typescript
export const loadConfig = () => {
	/* ... */
};
```

**`save-config.ts`**

```typescript
export const saveConfig = () => {
	/* ... */
};
```

❌ BAD: "These are all file utilities!"

**`file-utils.ts`**

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

✅ GOOD: Each function in its own file

**`copy-file.ts`**

```typescript
export const copyFile = () => {
	/* ... */
};
```

**`copy-directory.ts`**

```typescript
export const copyDirectory = () => {
	/* ... */
};
```

**`delete-file.ts`**

```typescript
export const deleteFile = () => {
	/* ... */
};
```

## Examples

### Function with Args

**`add-two.ts`**

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

**`log-hello.ts`**

```typescript
export const logHello = () => {
	console.log('Hello');
};
```

### Guard Clauses (Early Return OK)

**`get-user-display-name.ts`**

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

**`calculate-final-score.ts`**

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
