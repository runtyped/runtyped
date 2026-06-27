
# @runtyped/type

TypeScript types disappear at run time. Runtyped changes that, preserving
types at run time via a compiler plugin and enabling type-driven validation, 
serialization and more. 

Started as a selective fork [Deepkit] focused on its type reflection capabilities.
See [Relationship to Deepkit](https://github.com/runtyped/runtyped#relationship-to-deepkit).

## Introduction 

This package provides functions for type-driven validation, serialization,
schema generation and more, building on top of [@runtyped/type-compiler]'s 
reflection of type information - which would normally be available only at
compile time - into run-time values.

Check the documentation at [https://github.com/runtyped/runtyped].

## Installation

```sh
# Install @runtyped/type as a run-time dependency and @runtyped/type-compiler
# as a development or compile-time dependency.
npm i @runtyped/type
npm i --dev @runtyped/type-compiler

# Run the installer script to patch the TypeScript compiler with the Runtyped
# transformer. If npx is not available, the script should also be runnable via
# `./node_modules/.bin/runtyped-install-transformer`.
npx runtyped-install-transformer
```

## Usage

```typescript
import { is, cast, validate, serialize, typeOf, toJsonSchema } from '@runtyped/type';

interface User {
  id: number;
  registered: Date;
  username: string;
}

// Deserialize JSON to typed objects (strings become Dates, etc.)
const user = cast<User>({
  id: 1,
  registered: '2024-01-15T10:30:00Z',
  username: 'peter'
});
user.registered instanceof Date; // true

// Validate data against type
validate<User>({ id: 'not a number' });
// [{ path: 'id', message: 'Not a number' }]

// Serialize to JSON-safe output
serialize<User>(user);
// { id: 1, registered: '2024-01-15T10:30:00.000Z', username: 'peter' }

// Full runtime type reflection
const type = typeOf<User>();

// Convert type to JSON Schema
const schema = toJsonSchema<User>();
```


[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
