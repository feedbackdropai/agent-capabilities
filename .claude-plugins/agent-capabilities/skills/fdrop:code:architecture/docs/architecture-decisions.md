# Architecture Decisions

This document outlines universal architectural decisions and patterns that apply across this codebase.

## Functional vs Class-Based Approaches

**Default Preference: Functional Approach**

- **Prefer functions by default** — they are simpler, more testable, and easier to reason about
- **Use classes only when you have a clear need for:**
    - State management (holding and mutating data over time)
    - Complex object initialization with multiple configuration options
    - Grouping related methods that operate on the same data structure
    - When you need inheritance or polymorphism patterns

## Code Placement Philosophy

Place shared code at the lowest common ancestor `common/` folder. Each package's architecture doc defines the concrete hierarchy for that package — defer to those for specific scope rules.

When creating or extracting shared code, follow these principles:

1. **First:** Search if it already exists in `common/` at any level
    - If found → **use the existing implementation**

2. **Second:** If not found, start local and promote later
    - It's easier to move code up when reuse is proven
    - Premature generalization creates unused abstractions

**Additional rules:**

- Import from specific subdirectories: `from '@common/utils'` not `from '@common'`
- If your project doesn't use path aliases, use relative paths consistently

## File Naming Conventions

The default file and folder naming convention is `kebab-case`. Packages with their own architecture docs may define their own naming conventions — defer to those docs where they diverge.

## Test File Placement

Test files live adjacent to the file they test — not in separate `__tests__/` directories.

## Anti-Patterns to Avoid

### Thin Wrapper Functions

**Don't create functions that only rename parameters or add no meaningful abstraction.**

```typescript
// ❌ BAD: Thin wrapper that adds no value
export const buildBrowserLabel = ({ browser, browserVersion }) => {
	return buildVersionedLabel({ name: browser, version: browserVersion });
};

// ✅ GOOD: Just use the underlying function directly
const browserLabel = buildVersionedLabel({
	name: visitorSession.browser,
	version: visitorSession.browserVersion,
});
```

**Why this is bad:**

- Adds unnecessary indirection (more files to navigate)
- Makes refactoring harder (more files to update)
- Creates cognitive overhead (readers must trace through layers)
- Violates DRY by duplicating the function signature

**When a wrapper IS justified:**

- It adds meaningful validation or transformation
- It provides a significantly simpler API for a complex underlying function
- It handles error cases or provides defaults

### Unused Code

**Delete unused exports, interfaces, types, and functions immediately.**

- Don't leave dead code "just in case" — version control has history
- Unused code creates confusion about what's actually used
- It adds maintenance burden and clutters search results
- If you're unsure if something is used, search the codebase before deciding

### Premature Abstraction

**Don't create abstractions for hypothetical future use cases.**

- Wait until you have 2–3 concrete uses before abstracting
- The "right" abstraction becomes clear with real usage patterns
- Wrong abstractions are worse than duplication

### Type Alias Indirection

**Don't create separate files just to alias another type.**

**FilterOptions.ts**

```typescript
// ❌ BAD: Unnecessary alias file
export type FilterOptions = FeedbackFilterState;

// ✅ GOOD: Use the original type directly
import type { FeedbackFilterState } from './FeedbackFilterState';
```

If semantic distinction is important, add a comment at the usage site instead of creating indirection.

### Circular Dependencies

Module A imports Module B which imports Module A. This creates fragile load-order dependencies and breaks tree-shaking.

```typescript
// ❌ BAD: order.ts imports customer.ts which imports order.ts
// order.ts
import { Customer } from './customer';
export const getOrderSummary = (order: Order) => ({ ...order, customer: getCustomerName(order.customerId) });
export type Order = { id: string; customerId: string };

// customer.ts
import { Order } from './order'; // circular!
export const getCustomerName = (id: string) => { /* ... */ };
export const getCustomerOrders = (customer: Customer): Order[] => { /* ... */ };

// ✅ GOOD: Extract shared type to a third module
// types.ts
export type Order = { id: string; customerId: string };

// order.ts
import type { Order } from './types';
import { getCustomerName } from './customer';

// customer.ts
import type { Order } from './types';
```

**How to fix:**

- Extract the shared code into a third module that both can import
- Use dependency injection to break the cycle
- Restructure to follow the code placement hierarchy (promote shared code to `common/`)

### Duplicated Patterns & Logic

If the same pattern or logic exists in 2+ files, extract it to a shared location following the Code Placement Philosophy.

Common signs of duplication:

- Loading/error/data state handling repeated across components
- Validation logic copied between forms or files
- Repeated data transformations or API call patterns
- Generic enums (e.g., `SortDirection { Asc, Desc }`) duplicated across features — these belong in `src/common/enums/`

**Where to place:** Start at the lowest common ancestor `common/` folder. Create a shared utility, hook, or component as appropriate.

## Barrel Exports (`index.ts`)

Every folder that is imported by other modules must have an `index.ts` barrel file.

1. **Use named re-exports** — `export { Foo } from './Foo'`, never `export *`
2. **One export per line** — makes diffs clean and review easy
3. **Create an `index.ts` when** a folder contains 2+ files consumed outside the folder
4. **Skip `index.ts` when** a folder is internal and only consumed by its parent file

Package-specific additions (e.g., import alias conventions in re-export paths) are documented in each package's architecture doc.
