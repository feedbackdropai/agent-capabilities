# Unit Testing NestJS Services

## Test Module Setup

Use `Test.createTestingModule` with `useValue` mock providers. Declare mock objects in the test scope — not via `jest.mock()` module replacement.

```typescript
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

describe('AuthService', () => {
	let service: AuthService;

	const mockPrismaService = {
		user: { findMany: jest.fn(), findUnique: jest.fn() },
	};

	const mockUsersService = {
		create: jest.fn(),
		findFirst: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: UsersService, useValue: mockUsersService },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});
});
```

## When to Combine `jest.mock()` with DI

Some services import standalone utility functions alongside injected providers. When a utility must be stubbed before module resolution, place `jest.mock()` calls **before** all imports — this is a valid exception to the general ordering rule in [unit-testing.md](./unit-testing.md#mock-ordering).

```typescript
jest.mock('@models/issues/common/utils/build-ai-diagnosis-prompt');

import { expect, describe, beforeEach, jest, test } from '@jest/globals';
import { buildAiDiagnosisPrompt } from '@models/issues/common/utils/build-ai-diagnosis-prompt';
import { Test } from '@nestjs/testing';
// ...

const mockBuildAiDiagnosisPrompt = buildAiDiagnosisPrompt as jest.MockedFunction<
	typeof buildAiDiagnosisPrompt
>;
```

Use `jest.MockedFunction<typeof fn>` to get typed mock references for auto-mocked utility functions.

## Builder Pattern for Complex Services

When a service has many providers and tests need different mock configurations per `describe` block, extract a `buildService` helper that accepts overrides and returns both the service instance and mock references.

```typescript
interface BuildServiceOverrides {
	findFirstResult?: unknown;
	feedbackCount?: number;
}

const buildService = async ({
	findFirstResult = { id: 1 },
	feedbackCount = 0,
}: BuildServiceOverrides = {}) => {
	const findFirstMock = jest.fn(async () => findFirstResult);
	const countMock = jest.fn(async () => feedbackCount);

	const mockPrismaService = {
		issue: { findFirst: findFirstMock },
		feedbackSession: { count: countMock },
	} as unknown as PrismaService;

	const mockEntitlements = {
		assertFeature: jest.fn(async () => undefined),
	} as unknown as EntitlementsService;

	const module: TestingModule = await Test.createTestingModule({
		providers: [
			IssuesService,
			{ provide: PrismaService, useValue: mockPrismaService },
			{ provide: EntitlementsService, useValue: mockEntitlements },
		],
	}).compile();

	const service = module.get<IssuesService>(IssuesService);

	return { service, findFirstMock, countMock };
};

// Usage in tests — each describe can override only what it needs:
describe('when the issue is found', () => {
	let result: unknown;

	beforeEach(async () => {
		const { service } = await buildService({
			findFirstResult: { id: 1, title: 'Bug' },
		});
		result = await service.getIssue({ id: 1 });
	});

	test('should return the issue', () => {
		expect(result).toStrictEqual(expect.objectContaining({ id: 1 }));
	});
});
```

See `issues.service.unit.test.ts` for the full-scale version of this pattern with many providers and overrides.

## Injection Tokens

For non-class providers (e.g., Stripe client), use the token constant as the `provide` key:

```typescript
import { stripeClientToken } from '@src/app/stripe/common/constants/stripe-client-token';

{ provide: stripeClientToken, useValue: mockStripe },
```
