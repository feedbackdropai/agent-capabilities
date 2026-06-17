# Unit Test Examples

## Unit Test File (for a Class)

```typescript
import { expect, describe, beforeEach, jest, test } from '@jest/globals';
import { Person } from '@/models/person';
import { Address } from '@/models/address';
import { IPersonDetails } from '@/models/person/common/interfaces';
import { PersonConfig } from '@/models/person-config';

// Mocked Imports
// -------------------------
let mockPersonDetails: IPersonDetails | null = null;
const mockGetPersonDetails = jest.fn<(params: { personId: string; locale: Locale }) => IPersonDetails | null>();

jest.mock('@/models/person/common/utils/get-person-details', () => ({
	getPersonDetails: (params: { personId: string; locale: Locale }) => mockGetPersonDetails(params),
}));
// -------------------------

describe('Person', () => {
	let person: Person;
	let isAnonymous: boolean;
	let currentLocale: Locale;
	let address: Address;
	let addressData: AddressData;
	let personConfig: PersonConfig;

	beforeEach(() => {
		mockGetPersonDetails.mockClear();
		mockPersonDetails = null;
		mockGetPersonDetails.mockReturnValue(mockPersonDetails);

		addressData = {
			street: '123 Main St',
			city: 'Springfield',
			zip: '12345',
		};
		address = new Address({ addressData });

		isAnonymous = false;
		currentLocale = {} as Locale;
		personConfig = new PersonConfig({
			isAnonymous,
			currentLocale,
			defaultSettings: {},
		});

		person = new Person({ isAnonymous, address, personConfig });
	});

	describe('when person details are found', () => {
		describe('for an employee', () => {
			beforeEach(() => {
				mockPersonDetails = {
					departmentId: '456',
					managerId: '789',
					personType: 'employee',
					companyName: 'acme-corp.com',
					companyPath: '/org/engineering/team-a',
					companyUrl: 'https://acme-corp.com/org/engineering/team-a',
				};
				mockGetPersonDetails.mockReturnValue(mockPersonDetails);

				person = new Person({
					isAnonymous,
					address,
					personConfig,
				});
			});

			test('should set expected person details', () => {
				expect(person).toStrictEqual(
					expect.objectContaining({ ...mockPersonDetails }),
				);
			});
		});

		describe('for a contractor', () => {
			beforeEach(() => {
				mockPersonDetails = {
					contractorId: '123',
					personType: 'contractor',
				};
				mockGetPersonDetails.mockReturnValue(mockPersonDetails);

				person = new Person({
					isAnonymous,
					address,
					personConfig,
				});
			});

			test('should set expected person details', () => {
				expect(person).toStrictEqual(
					expect.objectContaining({ ...mockPersonDetails }),
				);
			});
		});

		describe('for a vendor', () => {
			beforeEach(() => {
				mockPersonDetails = {
					vendorId: '123',
					accountId: '456',
					personType: 'vendor',
				};
				mockGetPersonDetails.mockReturnValue(mockPersonDetails);

				person = new Person({
					isAnonymous,
					address,
					personConfig,
				});
			});

			test('should set expected person details', () => {
				expect(person).toStrictEqual(
					expect.objectContaining({ ...mockPersonDetails }),
				);
			});
		});
	});

	describe('when no person details are found', () => {
		beforeEach(() => {
			mockPersonDetails = null;
			mockGetPersonDetails.mockReturnValue(mockPersonDetails);
			person = new Person({ isAnonymous, address, personConfig });
		});

		test('should not have any person detail properties set', () => {
			expect(person).toStrictEqual(
				expect.objectContaining({
					contractorId: undefined,
					accountId: undefined,
					vendorId: undefined,
					personType: undefined,
					departmentId: undefined,
					managerId: undefined,
					companyName: undefined,
					companyPath: undefined,
					companyUrl: undefined,
				}),
			);
		});
	});
});
```

---

## Unit Test File (for a Function)

```typescript
import {
	expect,
	describe,
	beforeEach,
	jest,
	test,
} from '@jest/globals';
import { UserProfile } from '@/models/user-profile';
import { AppSettings } from '@/models/app-settings';
import { getAvatarUrl } from '@/models/user-profile/common/utils/get-avatar-url';

// Mocked Imports
// -------------------------
let mockAvatarFromProfile: string | null = null;
const mockGetAvatarFromProfile = jest.fn<(params: { profile: UserProfile }) => string | null>();

jest.mock('@/models/user-profile/common/utils/get-avatar-from-profile', () => ({
	getAvatarFromProfile: (params: { profile: UserProfile }) =>
		mockGetAvatarFromProfile(params),
}));
// -------------------------
let mockAvatarFromGravatar: string | null = null;
const mockGetAvatarFromGravatar = jest.fn<(params: { email: string }) => string | null>();

jest.mock('@/models/user-profile/common/utils/get-avatar-from-gravatar', () => ({
	getAvatarFromGravatar: (params: { email: string }) =>
		mockGetAvatarFromGravatar(params),
}));
// -------------------------

describe('getAvatarUrl', () => {
	let isGuest: boolean;
	let currentTheme: Theme;
	let userProfile: UserProfile;
	let profileData: ProfileData;
	let appSettings: AppSettings;
	let avatarUrl: string | null;

	beforeEach(() => {
		mockGetAvatarFromProfile.mockClear();
		mockGetAvatarFromGravatar.mockClear();

		avatarUrl = null;

		profileData = { email: 'user@example.com', displayName: 'Test User' };
		userProfile = new UserProfile({ profileData });

		isGuest = false;
		currentTheme = {} as Theme;
		appSettings = new AppSettings({
			isGuest,
			currentTheme,
			defaultPreferences: {},
		});

		mockAvatarFromGravatar = 'https://gravatar.com/avatar/abc123?size=200';
		mockAvatarFromProfile = 'https://cdn.example.com/avatars/user-123.png';
		mockGetAvatarFromProfile.mockReturnValue(mockAvatarFromProfile);
		mockGetAvatarFromGravatar.mockReturnValue(mockAvatarFromGravatar);
	});

	describe('when no avatar conditions are met', () => {
		beforeEach(() => {
			avatarUrl = getAvatarUrl({ userProfile, appSettings });
		});

		test('should return null', () => {
			expect(avatarUrl).toBeNull();
		});
	});

	describe('when user has uploaded a custom avatar', () => {
		beforeEach(() => {
			appSettings.set('hasCustomAvatar', true);
			avatarUrl = getAvatarUrl({ userProfile, appSettings });
		});

		test('should return the avatar url from profile', () => {
			expect(avatarUrl).toBe(mockAvatarFromProfile);
		});
	});

	describe('when gravatar is enabled', () => {
		beforeEach(() => {
			appSettings.set('useGravatar', true);
			avatarUrl = getAvatarUrl({ userProfile, appSettings });
		});

		test('should return the avatar url from gravatar', () => {
			expect(avatarUrl).toBe(mockAvatarFromGravatar);
		});
	});

	describe('when using default avatar fallback', () => {
		beforeEach(() => {
			appSettings.set('useDefaultFallback', true);
			avatarUrl = getAvatarUrl({ userProfile, appSettings });
		});

		test('should return the avatar url from gravatar', () => {
			expect(avatarUrl).toBe(mockAvatarFromGravatar);
		});
	});
});
```

---

## Unit Test File (Async Function)

```typescript
import {
	expect,
	describe,
	beforeEach,
	jest,
	test,
} from '@jest/globals';
import { getUserData } from '@/services/user/common/utils/get-user-data';

// Mocked Imports
// -------------------------
const mockFetchUser = jest.fn<(params: { userId: string }) => Promise<UserData>>();

jest.mock('@/services/user/common/utils/fetch-user', () => ({
	fetchUser: (params: { userId: string }) => mockFetchUser(params),
}));
// -------------------------

describe('getUserData', () => {
	let result: UserData;

	beforeEach(() => {
		mockFetchUser.mockClear();
	});

	describe('when the user exists', () => {
		beforeEach(async () => {
			mockFetchUser.mockResolvedValue({ id: '1', name: 'Test User' });
			result = await getUserData({ userId: '1' });
		});

		test('should return the user data', () => {
			expect(result).toStrictEqual({ id: '1', name: 'Test User' });
		});
	});

	describe('when the user does not exist', () => {
		beforeEach(() => {
			mockFetchUser.mockRejectedValue(new Error('User not found'));
		});

		test('should throw an error', async () => {
			await expect(getUserData({ userId: '999' })).rejects.toThrow(
				'User not found',
			);
		});
	});
});
```

---

## Unit Test File (Component)

```typescript
import {
	expect,
	describe,
	beforeEach,
	jest,
	test,
} from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/preact';
import { NotificationBanner } from './NotificationBanner';

// Mocked Imports
// -------------------------
const mockUseAppStore = jest.fn<(selector: (state: unknown) => unknown) => unknown>();

jest.mock('@store/appStore', () => ({
	useAppStore: (selector: (state: unknown) => unknown) => mockUseAppStore(selector),
}));
// -------------------------
const mockUseDismissHandler = jest.fn<() => () => void>();

jest.mock('@common/hooks/useDismissHandler', () => ({
	useDismissHandler: () => mockUseDismissHandler(),
}));
// -------------------------

describe('NotificationBanner', () => {
	let mockDismiss: jest.Mock;

	beforeEach(() => {
		mockUseAppStore.mockClear();
		mockUseDismissHandler.mockClear();

		mockDismiss = jest.fn();
		mockUseDismissHandler.mockReturnValue(mockDismiss);
	});

	describe('when not visible', () => {
		beforeEach(() => {
			mockUseAppStore.mockReturnValue(false);
			render(<NotificationBanner />);
		});

		test('should not render the banner', () => {
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});
	});

	describe('when visible', () => {
		beforeEach(() => {
			mockUseAppStore.mockReturnValue(true);
			render(<NotificationBanner />);
		});

		test('should render the notification message', () => {
			expect(screen.getByText('Action required')).toBeInTheDocument();
		});

		test('should render a dismiss button', () => {
			expect(
				screen.getByRole('button', { name: /dismiss/i }),
			).toBeInTheDocument();
		});

		describe('when the dismiss button is clicked', () => {
			beforeEach(() => {
				fireEvent.click(
					screen.getByRole('button', { name: /dismiss/i }),
				);
			});

			test('should call the dismiss handler', () => {
				expect(mockDismiss).toHaveBeenCalledTimes(1);
			});
		});
	});
});
```

---

## Unit Test File (Parameterized with test.each)

```typescript
import { expect, describe, test } from '@jest/globals';
import { formatCurrency } from '@/common/utils/format-currency';

describe('formatCurrency', () => {
	test.each([
		{ amount: 100, locale: 'en-US', expected: '$1.00' },
		{ amount: 100, locale: 'en-GB', expected: '£1.00' },
		{ amount: 0, locale: 'en-US', expected: '$0.00' },
		{ amount: -50, locale: 'en-US', expected: '-$0.50' },
	])(
		'should format $amount in $locale as $expected',
		({ amount, locale, expected }) => {
			expect(formatCurrency({ amount, locale })).toBe(expected);
		},
	);
});
```
