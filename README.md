
## Runtyped

TypeScript types disappear at runtime. Runtyped changes that, preserving types
at runtime via a compiler plugin. Define your types once and use them everywhere.
No schema duplication. Just TypeScript. 

Started as a selective fork [Deepkit] focused on its type reflection capabilities.
See [Relationship to Deepkit](#relationship-to-deepkit).

## Table of Contents

- [Introduction](#introduction)
- [Installation - TypeScript 7.x (Go)](#installation---typescript-7x-go)
- [Installation - TypeScript 6.x](#installation---typescript-6x)
- [Usage](#usage)
- [Versioning](#versioning)
- [Documentation](#documentation)
- [Relationship to Deepkit](#relationship-to-deepkit)
- [Changelog](#changelog)
- [License](#license)

## Introduction

Runtyped is comprised of the [@runtyped/type] runtime library and of a
transformer function that is added on top of the official TypeScript compiler.
The transformer serializes type information as regular JavaScript objects that
the runtime library consumes within its helper functions.

As the TypeScript compiler has moved to Go with version 7.0, Runtyped provides
the transformer in two different forms, depending on the TypeScript version in
use:

- [@runtyped/type-compiler] is a package that injects a JavaScript
  implementation of the transformer into the official TypeScript compiler, up
  to the 6.x series, patching the `typescript` package in-place. As such, this
  package must be installed alongside the official `typescript` package, which
  provides the actual compiler.

- [@runtyped/typescript] is a package that wraps a native implementation of the
  transformer as a patchset to the official TypeScript compiler, starting with 
  version 7.x onwards (written in Go). This package is maintained as a fork of
  the official compiler and thus does not require the latter to be installed.

## Installation - TypeScript 7.x (Go)

```sh
# Replaces the official `typescript` package, identical CLI API.
# No need to run a separate patching script as required for older TypeScript
# versions.
npm i --dev @runtyped/typescript

# Install @runtyped/type as a run-time dependency.
npm i @runtyped/type
```

For more information see [@runtyped/typescript] and [Versioning](#versioning)
for how the versions of the Runtyped packages relate to each other.

## Installation - TypeScript 6.x

Install `@runtyped/type-compiler` as a dev dependency and `@runtyped/type`
as a regular dependency:

```bash
npm install --save-dev @runtyped/type-compiler
npm install --save @runtyped/type
```

Then run the `runtyped-install-transformer` script to patch the local
TypeScript compiler with the Runtyped transformer, which makes reflected
types available at runtime:

```sh
npx runtyped-install-transformer
```

If `npx` is not available, run the script directly:

```sh
./node_modules/.bin/runtyped-install-transformer
```

For more information see [@runtyped/type-compiler] and [Versioning](#versioning)
for how the versions of the Runtyped packages relate to each other.

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

## Versioning

Runtyped packages share the same versioning scheme, built around the shared
reflection format and [SemVer].

- **major** is the format era. It changes when and only when the reflection
  format changes.

- **minor** carries format-compatible changes on either the compiler or the
  runtime side, independently within an era.

- **patch** carries fixes and upstream rebases. Every rebase onto a new
  upstream TypeScript bumps the patch.

Compatibility between [@runtyped/type] and the two transformer implementations
[@runtyped/type-compiler] and [@runtyped/typescript] is guaranteed as long as
the major version remains the same.

Additionally, [@runtyped/typescript] keeps the version of the upstream compiler
it builds upon as the `runtyped.typescript` field in its `package.json`.

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

[@runtyped/typescript] is released under the APACHE 2.0 license, the same
license used upstream by the official [typescript] package.

All other packages are released under the MIT license (see [LICENSE](LICENSE)).

[SemVer]: https://semver.org
[DeepKit]: https://github.com/deepkit/deepkit
[typescript]: https://www.npmjs.com/package/typescript
[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[@runtyped/type]: https://npm.im/@runtyped/type
[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler
[https://github.com/runtyped/TypeScript]: https://github.com/runtyped/TypeScript
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
