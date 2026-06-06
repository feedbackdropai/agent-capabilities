# Unit Testing

## Test File Location

Unit tests are **co-located** with their source files. Place the test file in the same directory as the file being tested, using the naming convention `*.unit.test.ts`.

For instance, the below file:

```
src/app/routes/auth/auth.service.ts
```

Will have a unit test file located at:

```
src/app/routes/auth/auth.service.unit.test.ts
```

### Benefits of Co-location

- **Discoverability** - Tests are immediately visible next to source files
- **Maintenance** - Moving/renaming a module keeps the test with it
- **Ownership clarity** - Each module is self-contained with its tests
- **Encourages testing** - Missing test files are obvious

### Folder Structure Example

```
src/app/routes/auth/
├── auth.service.ts
├── auth.service.unit.test.ts
├── auth.resolver.ts
├── auth.resolver.unit.test.ts
└── __mocks__/
    └── auth.service.ts          # Mock for auth.service used by other tests
```

## Files That Must NOT Have Dedicated Tests

Do **not** create test files for source files that contain no runtime logic. These files are covered naturally when consumed by the modules that import them — a dedicated test adds noise and zero value.

Skip writing tests for:

- **Pure constants** — files that only export a literal value (string, number, static object/array) with no computation, branching, or side effects (e.g., `serverName.ts` exporting `'my-app'`)
- **Enums with no computed members** — plain TypeScript enums or string-union types
- **Type-only files** — files that export only `type` or `interface` declarations (these have no runtime code at all)
- **Barrel / re-export files** — `index.ts` files that only re-export from other modules

A file qualifies for testing only when it contains **executable logic**: conditionals, function bodies, computed values, or side effects.

If a constant file *does* contain logic (e.g., reads an env var and falls back to a default), test the logic paths — not the static default value.

## Base Test File

1. Add the below as the first import statement in the file:

```typescript
import {
	expect,
	describe,
	beforeEach,
	jest,
	test,
} from '@jest/globals';
```

Import `afterEach` or `afterAll` only when cleanup is actually needed (e.g., restoring env vars, clearing timers). Most tests do not need teardown.

2. The first `describe` statement will always match the name of the class/function being tested.

**src/app/routes/auth/auth.service.unit.test.ts**

```typescript
import {
	expect,
	describe,
	beforeEach,
	jest,
	test,
} from '@jest/globals';

describe('AuthService', () => {
	// test code here..
});
```

## Describe Block Naming

- The first `describe` always matches the name of the class or function being tested
- Nested `describe` blocks use one of two prefixes:
  - **`when ...`** — describes the condition or state being set up (e.g., `'when person details are found'`, `'when the request fails'`)
  - **`for ...`** — describes a variant within a condition (e.g., `'for an employee'`, `'for a contractor'`)

These compose naturally when stacked: `when person details are found` > `for an employee`.

## Unit Test Best Practices

- Add setup code in `beforeEach` / `beforeAll` when tests in that block require shared setup. Not every `describe` block needs setup hooks.
- Add all teardown / cleanup in `afterEach` / `afterAll` only when the specific test block requires it (e.g., resetting state that persists between tests). Not every test needs teardown.
- **`test` blocks must contain only `expect` calls — no variable declarations, no queries, no
  computation.** All setup, querying, and value assignment belongs in `beforeEach`. Declare
  variables at the `describe` scope and assign them in `beforeEach`. This applies to everything:
  `screen.getByText()`, `screen.getAllByText()`, `container.querySelector()`, function calls,
  computed values — all of it goes in `beforeEach`, never in `test`.

  ```typescript
  // ❌ WRONG — querying and assigning inside test
  test('should render the GitHub gradient', () => {
      const gradient = container.querySelector('#grad-github');
      expect(gradient).toBeInTheDocument();
  });

  test('should render the heading', () => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  // ✅ CORRECT — variables declared at describe scope, assigned in beforeEach
  describe('gradients', () => {
      let gradGithub: Element | null;
      let heading: HTMLElement;

      beforeEach(() => {
          gradGithub = container.querySelector('#grad-github');
          heading = screen.getByText('Hello');
      });

      test('should render the GitHub gradient', () => {
          expect(gradGithub).toBeInTheDocument();
      });

      test('should render the heading', () => {
          expect(heading).toBeInTheDocument();
      });
  });
  ```

  This allows for cleaner and easier to maintain code for future devs that need to update /
  tweak the test case. This will also force better `describe` statements and more manageable
  testing scenarios.
- When asserting multiple properties, prefer a single `expect` with `toStrictEqual` and
  `expect.objectContaining()` over individual `expect` calls per property
- Cover all code paths including conditional branches, error handling, and boundary conditions
- Use existing enums or constants instead of magic strings when those values exist in the codebase
- Each test should exercise a unique code path — avoid redundant tests that only vary input without
  testing different behavior

## Adding Mocks

### Mock Ordering

Jest hoists `jest.mock()` calls regardless of their position in the file. For consistency, place mock variable declarations and `jest.mock()` blocks **after** the `@jest/globals` import and after real imports from the module under test. This is the pattern in the vast majority of test files.

### Do NOT Mock Simple Constants

Never mock modules that only export plain constants (numbers, strings, static arrays/objects) with no side effects. Mocking them prevents coverage of the constant file and adds noise for no isolation benefit. Import the real module and let Jest execute it naturally.

Only mock a constant module if:
- It performs side effects at import time (e.g., reads from `localStorage`, makes network calls)
- You need to test behavior under a *different* value than the real constant provides

If you need to vary the constant's value per test, use `jest.replaceProperty` or restructure to inject the value rather than mocking the entire module.

### Mock Organization Strategy

Use a **hybrid approach** based on mock scope:

1. **Inline mocks** - Simple, one-off mocks specific to a single test file
2. **Co-located `__mocks__/` folder** - Module-specific mocks used by multiple tests in that area
3. **`test/mocks/`** - Global mocks used across the entire codebase (e.g., `mockPrismaService`, `mockLogger`)

### Co-located `__mocks__/` Folder

When multiple tests need to mock the same module, create a `__mocks__` folder alongside the source:

```
src/app/routes/events/
├── events.service.ts
├── events.service.unit.test.ts
└── __mocks__/
    └── events.service.ts        # Shared mock for events.service
```

### Mock Section Formatting

Use `// Mocked Imports` and `// -------------------------` separators to visually mark mock setup blocks at the top of the file. The `// Mocked Imports` header appears **once** at the start of the mock section. Each mock group (variable declarations + `jest.mock` call) is separated by `// -------------------------` lines:

**Single mock group:**

```typescript
// Mocked Imports
// -------------------------
let mockAdTagProps: IAdTagProps | null = null;
const mockGetAdTagProps = jest.fn<(params: { tagId: string }) => IAdTagProps | null>();

jest.mock('@/framework/base/ad-tag/common/utils/ad-tag/get-ad-tag-props', () => ({
	getAdTagProps: (params: { tagId: string }) => mockGetAdTagProps(params),
}));
// -------------------------
```

**Multiple mock groups** -- each group is delimited by `// -------------------------` lines; the `// Mocked Imports` header is not repeated:

```typescript
// Mocked Imports
// -------------------------
const mockGetProfile = jest.fn<(params: { userId: string }) => Profile | null>();

jest.mock('@/utils/get-profile', () => ({
	getProfile: (params: { userId: string }) => mockGetProfile(params),
}));
// -------------------------
const mockGetAvatar = jest.fn<(params: { email: string }) => string | null>();

jest.mock('@/utils/get-avatar', () => ({
	getAvatar: (params: { email: string }) => mockGetAvatar(params),
}));
// -------------------------
```

### Inline Mocks

When your class/function under test imports a method from another file, and you need to
manipulate its output use `jest.mock` to override the import and mock its output.

**Important**: The mocked return value and function names should have the word `mock`
prepended. Jest hoists `jest.mock()` calls to the top of the file — only variables prefixed
with `mock` are accessible inside the factory function.

Example setup:

```typescript
let mockAdTagProps: IAdTagProps | null = null;
const mockGetAdTagProps = jest.fn<(params: { tagId: string }) => IAdTagProps | null>();

// The arrow wrapper delegates to the jest.fn() so we can
// control return values per-test via mockReturnValue in beforeEach.
jest.mock(
	'@/framework/base/ad-tag/common/utils/ad-tag/get-ad-tag-props',
	() => ({
		getAdTagProps: (params: { tagId: string }) => mockGetAdTagProps(params),
	}),
);
```

Then set the return value in `beforeEach`:

```typescript
beforeEach(() => {
	mockGetAdTagProps.mockClear();
	mockGetAdTagProps.mockReturnValue(mockAdTagProps);
});
```

### Mock Typing Rules

Every `jest.fn()` mock **must** be fully typed to match the real function's signature. Untyped or loosely typed mocks cause TypeScript errors that accumulate across the test suite. Follow these two rules:

**Rule 1: Type the `jest.fn<>()` generic to match the real function's full signature.**

Read the source file to find the real function's parameter and return types, then mirror them in the generic:

```typescript
// ❌ WRONG — omits parameters, causes TS2554/TS2345 on mockReturnValue/calledWith
const mockGetProfile = jest.fn<() => Profile | null>();

// ✅ CORRECT — matches the real function's signature
const mockGetProfile = jest.fn<(params: { userId: string }) => Profile | null>();
```

For zero-parameter functions, `jest.fn<() => ReturnType>()` is correct. For async functions, include the Promise wrapper: `jest.fn<(id: string) => Promise<User>>()`.

**Rule 2: Use typed parameters in mock factory wrappers — never `(...args: unknown[])`.**

The `(...args: unknown[]) => mockFn(...args)` pattern causes TS2556 ("A spread argument must either have a tuple type or be passed to a rest parameter"). Instead, write a wrapper whose parameters match the real function:

```typescript
// ❌ WRONG — causes TS2556
jest.mock('@/utils/get-profile', () => ({
	getProfile: (...args: unknown[]) => mockGetProfile(...args),
}));

// ✅ CORRECT — typed parameters
jest.mock('@/utils/get-profile', () => ({
	getProfile: (params: { userId: string }) => mockGetProfile(params),
}));
```

**Always check the source function's signature before choosing the wrapper pattern.** For zero-parameter functions, use `() => mockFn()`. For functions with parameters, list each parameter with its type. Using `() => mockFn()` for a function that takes parameters silently discards arguments — the `jest.fn()` spy will record zero arguments on every call, causing `toHaveBeenCalledWith` assertions to fail.

**Note:** Some existing test files use `(...args: unknown[]) => mockFn(...args)` — this is legacy debt being migrated. New tests must always use typed parameters as shown above.

### Global Test Utilities

When mocks or fixtures are shared across many test files, place them in a dedicated `test/` folder at the package root. Use this structure for new shared utilities:

```
packages/backend-api/
├── src/
│   └── app/...
└── test/
    ├── mocks/           # Shared mocks (e.g., mockPrismaService)
    ├── fixtures/        # Test data factories
    └── utils/           # Test helpers
```

## Async Testing

Use `async`/`await` in `beforeEach` for setup that involves promises. Use `mockResolvedValue`
and `mockRejectedValue` to configure async mocks. Use `expect().rejects` to assert rejected
promises.

```typescript
describe('when the request succeeds', () => {
	beforeEach(async () => {
		mockFetchUser.mockResolvedValue({ id: '1', name: 'Test User' });
		result = await getUserData({ userId: '1' });
	});

	test('should return the user data', () => {
		expect(result).toStrictEqual({ id: '1', name: 'Test User' });
	});
});

describe('when the request fails', () => {
	beforeEach(() => {
		mockFetchUser.mockRejectedValue(new Error('Not found'));
	});

	test('should throw an error', async () => {
		await expect(getUserData({ userId: '999' })).rejects.toThrow(
			'Not found',
		);
	});
});
```

## Testing Hooks

To test a Preact/React hook in isolation, mock the framework's hook primitives with synchronous shims so the hook body executes immediately without a component render cycle. Capture effect callbacks so tests can invoke them and assert side effects.

```typescript
// Mocked Imports
// -------------------------
let mockEffectCallback: (() => undefined | (() => void)) | undefined;

jest.mock('preact/hooks', () => ({
	useEffect: (cb: () => undefined | (() => void)) => {
		mockEffectCallback = cb;
	},
	useCallback: <T>(cb: T) => cb,
	useMemo: (factory: () => unknown) => factory(),
}));
// -------------------------
```

Call the hook directly in `beforeEach`, then invoke the captured effect callback in the appropriate `describe` block to trigger side effects:

```typescript
describe('useEscapeKey', () => {
	beforeEach(() => {
		mockEffectCallback = undefined;
		useEscapeKey({ isActive: true, onEscape: mockOnEscape });
	});

	test('should add a keydown event listener', () => {
		mockEffectCallback!();
		expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
	});
});
```

Only mock the hook primitives the hook under test actually uses. Use `mockRestore()` in `afterEach` for any `jest.spyOn` calls on DOM APIs (e.g., `window.addEventListener`).

## Module Isolation with `jest.isolateModules`

Use `jest.isolateModules` when testing code that has side effects at import time (e.g., reads `document.currentScript`, checks `document.readyState`). Each call gets a fresh module instance, so per-test DOM state changes take effect on the next import.

```typescript
describe('when auto-init is disabled', () => {
	beforeEach(() => {
		const mockScript = document.createElement('script');
		mockScript.dataset.autoInit = 'false';

		Object.defineProperty(document, 'currentScript', {
			value: mockScript,
			writable: true,
			configurable: true,
		});

		jest.isolateModules(() => {
			require('./autoInitInBrowser').autoInitInBrowser();
		});
	});

	test('should not instantiate Widget', () => {
		expect(mockWidgetConstructor).not.toHaveBeenCalled();
	});
});
```

Use `jest.isolateModules` instead of standard imports when the module's behavior depends on global state that varies per test case.

## Environment-Specific Branches

Some code has branches that depend on the runtime environment (e.g., `typeof window === 'undefined'` for SSR guards). These branches can't be reached in the default `jsdom` test environment.

To test them, create a **separate test file** with a Jest environment docblock at the top:

```typescript
/**
 * @jest-environment node
 */
import { expect, describe, test } from '@jest/globals';
import { autoInitInBrowser } from '@modules/init/autoInitInBrowser';

describe('autoInitInBrowser', () => {
	describe('when running in a non-browser environment', () => {
		test('should return early without mounting', () => {
			expect(autoInitInBrowser()).toBeUndefined();
		});
	});
});
```

Name the file with a suffix that distinguishes it from the main test: e.g., `autoInitInBrowser.ssr.unit.test.ts`. This keeps the main jsdom tests in one file and the node-environment tests in another.

## Parameterized Tests

Use `test.each` when multiple inputs exercise the **same code path** with different expected
outputs. When different inputs exercise **different code paths**, use separate `describe` blocks
instead.

```typescript
describe('formatCurrency', () => {
	test.each([
		{ amount: 100, locale: 'en-US', expected: '$1.00' },
		{ amount: 100, locale: 'en-GB', expected: '£1.00' },
		{ amount: 0, locale: 'en-US', expected: '$0.00' },
	])(
		'should format $amount in $locale as $expected',
		({ amount, locale, expected }) => {
			expect(formatCurrency({ amount, locale })).toBe(expected);
		},
	);
});
```

## Method-Level Mocking with `jest.spyOn`

Use `jest.spyOn` when you need to mock a single method on an already-instantiated object rather than replacing an entire module. This is common in NestJS services where dependencies are injected instances.

Prefer `jest.spyOn` over `jest.mock` when:
- The target is a method on an object you already have a reference to (e.g., an injected service)
- You want to mock one method while leaving the rest of the object intact

Prefer `jest.mock` (module-level) when:
- The target is a standalone exported function from another module
- You need to replace the entire module before it's imported

```typescript
// Mocked Imports
// -------------------------
const mockPrismaWorkspaceUpdate = jest.spyOn(prismaService.workspace, 'update');
// -------------------------

describe('when the workspace is updated', () => {
	beforeEach(() => {
		mockPrismaWorkspaceUpdate.mockClear();
		mockPrismaWorkspaceUpdate.mockResolvedValue(mockWorkspace);
	});

	test('should call prisma update with the correct args', () => {
		expect(mockPrismaWorkspaceUpdate).toHaveBeenCalledWith({
			where: { id: 'ws-1' },
			data: { name: 'Updated' },
		});
	});
});
```

Use `mockRestore()` (not `mockClear()`) in cleanup if you need to restore the original implementation after spying.

## Mock Cleanup

Use `mockClear()` in `beforeEach` to reset call tracking between tests. This preserves
mock wiring while clearing `calls`, `instances`, and `results`.

- **`mockClear()`** — resets call tracking only (use this)
- **`mockReset()`** — also removes `mockReturnValue` / `mockImplementation` (rarely needed)
- **`mockRestore()`** — also restores original implementation (only for `jest.spyOn`)

```typescript
beforeEach(() => {
	mockGetPersonDetails.mockClear();
	mockGetPersonDetails.mockReturnValue(mockPersonDetails);
});
```

Prefer per-mock `mockClear()` over global `jest.clearAllMocks()` for explicitness. For `jest.spyOn`-heavy tests, `jest.restoreAllMocks()` in `afterEach` is acceptable as a concise alternative to individual `mockRestore()` calls.

## Running Tests

Every package defines a `test:unit` script.

For a single-package repo, run all unit tests with:

```bash
pnpm test:unit
```

For a monorepo, scope to a specific package with `--filter`:

```bash
pnpm --filter <package-name> test:unit
```

To discover available package filter names, run `pnpm ls --json --depth -1` and match the directory to its `name` field.

To run a single test file, append `-- <path>`:

```bash
pnpm test:unit -- <relative-path-to-test-file>
```

To collect coverage for a single file under test, add `--coverage --collectCoverageFrom`:

```bash
pnpm test:unit -- --coverage --collectCoverageFrom='<relative-path-to-source-file>' <relative-path-to-test-file>
```
