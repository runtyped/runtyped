
## Runtyped

TypeScript types disappear at runtime. Runtyped changes that, preserving types
at runtime via a fork of the TypeScript compiler. Define your types once and use them everywhere.
No schema duplication. Just TypeScript. 

Started as a selective fork [Deepkit] focused on its type reflection capabilities.
See [Relationship to Deepkit](#relationship-to-deepkit).

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [TypeScript 6.x and @runtyped/type-compiler](#typescript-6x-and-runtypedtype-compiler)
- [Versioning](#versioning)
- [Documentation](#documentation)
- [Relationship to Deepkit](#relationship-to-deepkit)
- [Changelog](#changelog)
- [License](#license)

## Introduction

Runtyped is comprised of two packages:

- [@runtyped/typescript], a fork of the official TypeScript 7.x compiler
  (written in Go) that serializes type information as regular JavaScript
  values in its output. It is a drop-in replacement for the [typescript]
  package, with the same CLI, and does not require the latter to be
  installed.

- [@runtyped/type], the runtime library that consumes those values to provide
  type-driven validation, serialization, JSON Schema generation and full
  runtime reflection.

## Installation

```sh
# Replaces the official `typescript` package, identical CLI API.
npm i --save-dev @runtyped/typescript

# Install @runtyped/type as a run-time dependency.
npm i --save @runtyped/type
```

Then compile as usual with `tsc`. Every file is reflected by default; see
[@runtyped/typescript] for how to narrow that down through the `reflection`
field in `tsconfig.json`. See [Versioning](#versioning) for how the versions
of the two packages relate to each other.

## Usage

The full power of reflected types is now at your disposal:

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

### Type-only imports

A type imported with `import type { User }` or `import { type User }` is
reflected as `any` by default, because a type-only import never loads its
module at run time. Validation then silently accepts any value in its place:
`cast<User | Admin>()` with a type-only `User` accepts everything.

Use a plain `import { User }` for types you validate, or set
`"reflectTypeOnlyImports": true` in `tsconfig.json`. You'll need that option
with `verbatimModuleSyntax`, which requires `import type` for types. See
[@runtyped/typescript] for details.

## TypeScript 6.x and @runtyped/type-compiler

> [!WARNING]
> [@runtyped/type-compiler] and support for TypeScript 6.x and earlier are
> **deprecated** as of Runtyped 3.0.0.

Up to version 2.x, Runtyped also shipped [@runtyped/type-compiler], a
JavaScript implementation of the transformer that patched the official
`typescript` package in place (up to the 6.x series). With TypeScript itself
moving to Go, that transformer has no future, and [@runtyped/typescript] now
covers everything it did.

- Projects on TypeScript 6.x can keep using [@runtyped/type-compiler] 2.x
  together with [@runtyped/type] 2.x, which remain available on npm but will
  not receive further updates.
- [@runtyped/type] 3.x and later require [@runtyped/typescript].
- `@runtyped/core`, `@runtyped/type-spec` and `@runtyped/expect` have been
  merged into [@runtyped/type] and are deprecated as well. The parts of
  `@runtyped/core` that the public API depends on (`ClassType`,
  `AbstractClassType`, `ExtractClassType`, `TypeAnnotation`, `RuntypedError`,
  `Builder`, `Ref`, `VarRef`) are now exported by [@runtyped/type].

See the [3.0.0 entry in the changelog](CHANGELOG.md) for migration notes.

## Versioning

Runtyped packages share the same versioning scheme, built around the shared
reflection format and [SemVer].

- **major** is the format era. It changes whenever the reflection format
  changes. It may also change, for all packages at once, to mark breaking
  changes of other kinds: 3.0.0 is such a release, which drops
  [@runtyped/type-compiler] and merges the auxiliary packages into
  [@runtyped/type] without changing the format.

- **minor** carries format-compatible changes on either the compiler or the
  runtime side, independently within an era.

- **patch** carries fixes and upstream rebases. Every rebase onto a new
  upstream TypeScript bumps the patch.

Compatibility between [@runtyped/type] and [@runtyped/typescript] is
guaranteed as long as the major version remains the same.

Additionally, [@runtyped/typescript] records the upstream compiler it builds
upon in the `runtyped.typescript` field of its `package.json`:

```json
"runtyped": {
  "typescript": {
    "version": "7.1",
    "commit": "6161772c1370bdd4a82f808e6823bd755eb1870d",
    "date": "2026-10-30T22:12:03Z"
  }
}
```

- `version` is the upstream release line.
- `commit` is the commit of [microsoft/TypeScript]'s `main` branch that the
  fork is based on, i.e. the most recent upstream commit it includes.
- `date` is that commit's date.

Upstream's `main` branch carries a `-dev` version in its source code, with
the actual version of each build stamped in at publish time, so the commit
and date are the reliable way to tell which upstream code a release includes.

## Documentation

See [docs/00-index.md](docs/00-index.md).

## Relationship to [Deepkit]

This project started as a fork of the astounding [Deepkit] framework. 
In January of 2026 Deepkit's author, Marc J. Schmidt, decided to make
all of their new code closed-source, an understandable reaction to the
shifts in incentives brought by the advent of LLMs and the rise of
generative AI.

Quoting Marc's tweet from Jan 9th, 2026:

> The core insight: OSS monetization was always about attention. Human
> eyeballs on your docs, brand, expertise. That attention has literally
> moved into attention layers. Your docs trained the models that now make
> visiting you unnecessary. Human attention paid. Artificial attention
> doesn't.

> Some OSS will keep going - wealthy devs doing it for fun or education. 
> That's not a system, that's charity. Most popular OSS runs on economic
> incentives. Destroy them, they stop playing.

Given that I had come to depend on [Deepkit]'s modules related to runtime 
types for quite a few of my own projects and given the MIT licensing, in
May of 2026 I decided to fork those modules alone in order to ensure their
continued availability and development. I forked at commit [0336f66].

Which is to say, none of this would be possible without Marc, who deserves
all the credit for the sheer brilliance, audacity and scope of the original
work. I do not know Marc personally but they truly are one of the most
talented developers I've ever encountered. To be completely honest, I do not
know if I am smart enough to meaningfully advance or even maintain Marc's work.
It's just _that_ good.

You can still find [Deepkit's original repository][Deepkit] on GitHub. Marc
is also on X as [@MarcJSchmidt](https://x.com/MarcJSchmidt) and on GitHub as
[@marcj](https://github.com/marcj), though inactive ever since Feb 2026.

[Deepkit]: https://github.com/marcj/deepkit
[0336f66]: https://github.com/marcj/deepkit/commit/0336f6691be4fe0f79e8827762c2d41751d4021f

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full list of changes.

## License

[@runtyped/type] is released under the MIT license (see [LICENSE](LICENSE)).

[@runtyped/typescript] is released under the APACHE 2.0 license, the same
license used upstream by the official [typescript] package.

[SemVer]: https://semver.org
[DeepKit]: https://github.com/deepkit/deepkit
[typescript]: https://www.npmjs.com/package/typescript
[microsoft/TypeScript]: https://github.com/microsoft/TypeScript
[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[@runtyped/type]: https://npm.im/@runtyped/type
[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler
[https://github.com/runtyped/TypeScript]: https://github.com/runtyped/TypeScript
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
