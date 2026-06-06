# Classes

- If your code objective needs to hold state, prefer creating a class
- If you need to group like methods on a common interface, you can create a class and use static methods
- Otherwise use your judgement for when is best to implement classes

## Syntax & Style

- In the constructor, pass in object as argument, and destructure args
    - This allows class args to be flexible, allowing us to easily add/remove args without being confined to chronological ordered arguments
- Create an interface called `ConstructorParams` defining the constructor options
- Export the class on the line it is defined as a named export

### Instance Method Parameters

- For class instance methods, use inline type definitions rather than separate interfaces
- This keeps the method signature self-contained and avoids creating unnecessary interface files

✅ GOOD: Inline type for class instance method

```typescript
async getConsoleLogSummaries({
  issueId,
}: {
  issueId: number;
}) {
  // Method code here
}
```

❌ BAD: Separate interface for class instance method

```typescript
interface GetConsoleLogSummariesParams {
  issueId: number;
}

async getConsoleLogSummaries({
  issueId,
}: GetConsoleLogSummariesParams) {
  // Method code here
}
```

## Class Syntax – Example

**`Person.ts`**

```typescript
interface ConstructorParams {
	name: string;
	age: number;
	email?: string;
	isActive?: boolean;
}

export class Person {
	private readonly name: string;
	private readonly age: number;
	private readonly email?: string;
	private isActive: boolean;

	constructor({ name, age, email, isActive = true }: ConstructorParams) {
		this.name = name;
		this.age = age;
		this.email = email;
		this.isActive = isActive;
	}

	greet() {
		return `Hello, my name is ${this.name} and I am ${this.age} years old.`;
	}

	getContactInfo() {
		return {
			name: this.name,
			age: this.age,
			email: this.email,
		};
	}

	setActiveStatus({ status }: { status: boolean }) {
		this.isActive = status;
	}

	getActiveStatus() {
		return this.isActive;
	}
}
```

## Folder Structure

- All class code should be bundled into a single folder
- Class folder name should match the class name
- When items like utility methods, interfaces, enums, constants, etc. need to be added:
    - Create a `common` folder in the root of the class folder
    - Add another folder (e.g., `utils`) inside the `common` folder to hold the files for that category
    - Create a barrel `index.ts` file to export the modules in that subfolder
    - Create a class barrel file `index.ts` to export the class from the class folder

### Folder Structure – Example

```
Person/
├─ common/
│  ├─ utils/
│  │  ├─ index.ts
│  │  ├─ name-formatting.ts
│  │  └─ age-validation.ts
│  ├─ interfaces/
│  │  ├─ index.ts
│  │  └─ contact-info.ts
│  ├─ types/
│  │  ├─ index.ts
│  │  └─ person-id.ts
│  ├─ enums/
│  │  ├─ index.ts
│  │  └─ person-status.ts
│  ├─ constants/
│  │  ├─ index.ts
│  │  └─ person-defaults.ts
├─ Person.ts
├─ index.ts
```

### Interfaces vs Types – Separate Folders

See [imports-exports.md](./imports-exports.md#interfaces-vs-types---they-are-different) for the full rule and examples. In short: `interfaces/` contains only `export interface`, `types/` contains only `export type`. Do not mix them.

### Example – Class Barrel File

**`Person/index.ts`**

```typescript
export { Person } from '@path/to/Person/Person';
```

### Example – Utils Barrel File

**`Person/common/utils/index.ts`**

```typescript
export { formatFullName } from '@path/to/Person/common/utils/name-formatting';
export { validateAge } from '@path/to/Person/common/utils/age-validation';
```

## Advanced Patterns

- Prefer creating small utility methods and importing them into the class vs adding this same functionality as instance methods. The benefits of this approach are:
    - Creates more maintainable and readable class files
    - Creates a smaller, more maintainable set of utility methods that can be independently unit tested without any class dependency
    - Avoids huge class test files where you are unit testing class functionality along with every instance method added to the class
