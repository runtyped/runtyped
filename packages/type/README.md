
# @runtyped/type

TypeScript types disappear at run time. Runtyped changes that, preserving
types at run time via a compiler plugin and enabling type-driven validation, 
serialization and more. 

Started as a selective fork [DeepKit] focused on its type reflection capabilities.
See [Relationship to DeepKit](https://github.com/runtyped/runtyped#relationship-to-deepkit).

## Introduction 

This package provides functions for type-driven validation, serialization,
schema generation and more, leveraging the runtime reflection of type
information provided by [@runtyped/type-compiler] (for TypeScript up to 6.x)
or [@runtyped/typescript] (for TypeScript 7.x and later).

Check the documentation at [https://github.com/runtyped/runtyped].

## Installation - TypeScript 7.x (Go)

Ever since version 7.0, the TypeScript compiler is now written and maintained
in the Go programming language rather than in TypeScript itself and published
as standalone pre-compiled binaries. As such, the in-place patching approach 
used by [@runtyped/type-compiler], inherited by `@deepkit/type-compiler`, does
not work anymore. 

For TypeScript 7.x we have created a patchset on top of the official compiler
that extends the latter with runtime type reflection: [@runtyped/typescript].
The patchset is maintained as a fork ([https://github.com/runtyped/TypeScript])
and published as a drop-in replacement for the official `typescript` package:

```sh
# Replaces the official `typescript` package, indentical CLI API.
# No need to run a separate patching script as required for older TypeScript
# versions.
npm i --dev @runtyped/typescript

# Install @runtyped/type as a run-time dependency.
npm i @runtyped/type
```

For more information see [@runtyped/typescript].

## Installation - TypeScript 6.x

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

## Versioning

`@runtyped/type` follows its own semantic versioning, governed by the
reflection format it consumes. The versioning of `@runtyped/typescript` — the
compiler whose emitted reflection data this package reads — is aligned to it
in lockstep: same major version means the same, compatible format era. See
the [Runtyped versioning strategy] for the full scheme.

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

[DeepKit]: https://github.com/deepkit/deepkit
[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler
[Runtyped versioning strategy]: https://github.com/runtyped/runtyped#versioning
[https://github.com/runtyped/TypeScript]: https://github.com/runtyped/TypeScript
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
