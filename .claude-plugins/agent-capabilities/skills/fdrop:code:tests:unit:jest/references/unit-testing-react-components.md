# Unit Testing Components

## Testing Library Import

The import source depends on the package's framework:

| Framework | Import from |
|---|---|
| React | `@testing-library/react` |
| Preact | `@testing-library/preact` |

The API (`render`, `screen`, `fireEvent`) is identical across both libraries — only the import source differs. Check the package's `package.json` dependencies to determine which framework it uses.

## Test File Naming

Component test files use `.unit.test.tsx` — the `.tsx` extension is required because the test contains JSX (`render(<Component />)`). This follows the repo convention: `.tsx` only when the file contains JSX, `.ts` for everything else.

```
src/components/StatusBanner/
├── StatusBanner.tsx
├── StatusBanner.unit.test.tsx
└── common/
    ├── hooks/
    └── components/
```

## Components That Must NOT Have Unit Tests

Framework route/page files — files whose sole purpose is wiring a route to a screen component (e.g., TanStack Router route files, Next.js page files) — must never have co-located unit tests. These files are thin configuration: permission guards, layout wrappers, and component renders. They contain no testable logic. Route behavior is verified through e2e tests and the screen component's own unit tests.

## The Render Pattern

Import `render` and `screen` from the testing library. Call `render()` in `beforeEach`, not inside `test`. Query elements from `screen` — never destructure queries from `render()`.

```typescript
import { expect, describe, beforeEach, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/preact';
import { StatusBanner } from './StatusBanner';

describe('StatusBanner', () => {
	beforeEach(() => {
		render(<StatusBanner message="All systems operational" />);
	});

	test('should render the message', () => {
		expect(screen.getByText('All systems operational')).toBeInTheDocument();
	});
});
```

## Query Priority

Choose queries in this order:

1. **`getByRole`** — buttons, headings, textboxes, etc. Mirrors how users and assistive technology find elements.
2. **`getByLabelText`** — form inputs with associated labels.
3. **`getByText`** — visible text content.
4. **`getByTestId`** — last resort. Requires adding `data-testid` to the source file.

Use `query*` variants (`queryByRole`, `queryByText`) when asserting an element is **not** rendered — they return `null` instead of throwing.

## Mocking Dependencies

Before mocking any module, check that the "Do NOT Mock Simple Constants" rule in [unit-testing.md](./unit-testing.md#do-not-mock-simple-constants) does not apply. Only mock constant modules when they have import-time side effects or you need to vary the value per test.

### Custom Hooks

Mock hooks the same way as utility functions. **Always check the hook's source signature first** — if it takes parameters, the wrapper must accept and forward them with matching types. Using `() => mockFn()` for a hook that takes parameters silently discards arguments, causing `toHaveBeenCalledWith` assertions to fail.

**Hook with no parameters:**

```typescript
// Mocked Imports
// -------------------------
const mockUseBannerState = jest.fn<() => BannerState>();

jest.mock('./common/hooks/useBannerState', () => ({
	useBannerState: () => mockUseBannerState(),
}));
// -------------------------
```

**Hook with parameters:**

```typescript
// Mocked Imports
// -------------------------
const mockUseProjects = jest.fn<(params: { workspaceId: number; refetchInterval?: number | false }) => { data: Project[] }>();

jest.mock('@/features/projects/hooks/useProjects', () => ({
	useProjects: (params: { workspaceId: number; refetchInterval?: number | false }) =>
		mockUseProjects(params),
}));
// -------------------------
```

Set return values in `beforeEach`:

```typescript
beforeEach(() => {
	mockUseBannerState.mockClear();
	mockUseBannerState.mockReturnValue({
		isVisible: true,
		message: 'System operational',
	});
});
```

### Zustand Stores

For components using `useStore(selector)`, mock the store module and control the selector return value:

```typescript
// Mocked Imports
// -------------------------
const mockUseAppStore = jest.fn<(selector: (state: unknown) => unknown) => unknown>();

jest.mock('@store/appStore', () => ({
	useAppStore: (selector: (state: unknown) => unknown) => mockUseAppStore(selector),
}));
// -------------------------
```

Return the value the selector would produce:

```typescript
describe('when the feature is active', () => {
	beforeEach(() => {
		mockUseAppStore.mockReturnValue(true);
		render(<FeaturePanel />);
	});

	test('should render the panel', () => {
		expect(screen.getByRole('region')).toBeInTheDocument();
	});
});
```

### Child Components

Mock child components to isolate the unit under test. Keep mocks minimal — render just enough to verify the parent passes correct props and renders children conditionally:

```typescript
// Mocked Imports
// -------------------------
jest.mock('./common/components/ActionButton', () => ({
	ActionButton: (props: Record<string, unknown>) => (
		<button data-testid="action-button" onClick={props.onClick as () => void}>
			{props.label as string}
		</button>
	),
}));
// -------------------------
```

## Testing Conditional Rendering

When a component returns `null` under certain conditions, use `query*` to assert absence:

```typescript
describe('when not active', () => {
	beforeEach(() => {
		mockUseAppStore.mockReturnValue(false);
		render(<InstructionBar />);
	});

	test('should not render', () => {
		expect(screen.queryByText('Select element')).not.toBeInTheDocument();
	});
});

describe('when active', () => {
	beforeEach(() => {
		mockUseAppStore.mockReturnValue(true);
		render(<InstructionBar />);
	});

	test('should render the instruction text', () => {
		expect(screen.getByText('Select element')).toBeInTheDocument();
	});
});
```

## Testing User Interactions

Use `fireEvent` for click, input, and keyboard events:

```typescript
import { render, screen, fireEvent } from '@testing-library/preact';

describe('when the dismiss button is clicked', () => {
	let mockOnDismiss: jest.Mock;

	beforeEach(() => {
		mockOnDismiss = jest.fn();
		render(<Banner message="Notice" onDismiss={mockOnDismiss} />);
		fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
	});

	test('should call the dismiss handler', () => {
		expect(mockOnDismiss).toHaveBeenCalledTimes(1);
	});
});
```
