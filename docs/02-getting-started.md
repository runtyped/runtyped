# Runtyped: Getting started

Runtyped needs two packages:

- [@runtyped/typescript], the compiler. It is a fork of the official TypeScript
  7.x compiler that embeds type information into the JavaScript it emits, and
  replaces the [typescript] package with the same `tsc` command line.
- [@runtyped/type], the runtime library. It contains the virtual machine that
  reads the embedded type information, the type annotations, and functions for
  validation, serialization, reflection and more.

> [!NOTE]
> Up to Runtyped 2.x, the compiler was provided by `@runtyped/type-compiler`, a
> transformer that patched the official `typescript` package up to the 6.x
> series. It is deprecated, together with support for TypeScript 6.x; see the
> [README](../README.md#typescript-6x-and-runtypedtype-compiler) and the
> [changelog](../CHANGELOG.md) for migration notes.

## Installation

```sh
npm install --save @runtyped/type
npm install --save-dev @runtyped/typescript
```

`@runtyped/typescript` provides the `tsc` binary, so it should not be installed
alongside the `typescript` package.

## tsconfig.json

No Runtyped-specific configuration is needed: every file compiled by `@runtyped/typescript` is
reflected by default. The `@runtyped/type` package is ESM-only, so a minimal
`tsconfig.json` looks like this:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "outDir": "./dist"
  }
}
```

A top-level `reflection` field narrows down what gets reflected. It is
inherited through `extends`:

| Value                       | Effect                                                         |
| --------------------------- | -------------------------------------------------------------- |
| `true` or `"default"`       | Reflect everything (the same as omitting the field).           |
| `false` or `"never"`        | Reflect nothing.                                               |
| `"explicit"`                | Reflect only declarations tagged with a `/** @reflection */` JSDoc comment. |
| `["src/**/*.ts", ...]`      | Reflect only files matching these patterns, relative to the `tsconfig.json`. |

Individual declarations can opt out with a `/** @reflection never */` JSDoc
comment.

## Example

Write your first code with runtime type information, in `app.ts`:

```typescript
import { cast, MinLength, ReflectionClass } from '@runtyped/type';

interface User {
    username: string & MinLength<3>;
    birthDate?: Date;
}

const user = cast<User>({
    username: 'Peter',
    birthDate: '2010-10-10T00:00:00Z'
});
console.log(user);

const reflection = ReflectionClass.from<User>();
console.log(reflection.getProperty('username').type);
```

Compile it with `tsc` and run the output with Node.js:

```sh
npx tsc -p tsconfig.json
node dist/app.js
```

## Build tools

Type information is embedded by the compiler itself, so it is only available
in JavaScript emitted by `@runtyped/typescript`. Tools that transpile
TypeScript on their own, such as esbuild, Vite, Bun, SWC or `tsx`, strip types
without reflecting them. Compile with `tsc` first and point those tools at its
JavaScript output instead.

[@runtyped/type]: https://npm.im/@runtyped/type
[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[typescript]: https://npm.im/typescript
