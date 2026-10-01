
## Runtyped

TypeScript types disappear at runtime. Runtyped changes that, preserving types
at runtime via a compiler plugin. Define your types once and use them everywhere.
No schema duplication. Just TypeScript. 

Started as a selective fork [Deepkit] focused on its type reflection capabilities.
See [Relationship to Deepkit](#relationship-to-deepkit).

## Table of Contents

- [Installation - TypeScript 7.x (Go)](#installation---typescript-7x-go)
- [Installation - TypeScript 6.x](#installation---typescript-6x)
- [Usage](#usage)
- [Versioning](#versioning)
- [Documentation](#documentation)
- [Relationship to Deepkit](#relationship-to-deepkit)
- [Changelog](#changelog)
- [License](#license)

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

Then run the `runtyped-install-transformer` script to patch the TypeScript
compiler with the Runtyped transformer, which makes reflected types
available at runtime:

```sh
npx runtyped-install-transformer
```

If `npx` is not available, run the script directly:

```sh
./node_modules/.bin/runtyped-install-transformer
```

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

The Runtyped packages share one versioning scheme, built around the
reflection format. The format is the axis runtyped owns and answers for;
upstream TypeScript is the axis it tracks. Each package's version number
encodes the axis its package owns, and the tracked axis is carried as
metadata.

### @runtyped/typescript

Versioning of `@runtyped/typescript` is aligned to the reflection format it
emits, in lockstep with `@runtyped/type`:

- **major** is the format era. It changes when and only when the reflection
  format changes, together with `@runtyped/type`'s major.
- **minor** carries format-compatible changes on either the compiler or the
  runtime side, independently within an era.
- **patch** carries fixes and upstream rebases. Every rebase onto a new
  upstream TypeScript bumps the patch, so rebase releases remain visible to
  range-based dependency updates.

The upstream TypeScript version the compiler is built upon is carried as
build metadata, informational only: it never takes part in version
precedence or range matching. Example:
`@runtyped/typescript@2.0.0+typescript.7.1.0` is the first release of format
era 2, built on the `7.1` line of upstream [typescript] — upstream `main` at
packaging time, which may be ahead of upstream's most recent published
release.

Because majors move in lockstep, the compatibility rule is simply: same
major version means the same, compatible format era.

`@runtyped/typescript` declares a `peerDependencies` requirement on
[@runtyped/type] covering its era, so the package manager itself refuses
mismatched combinations.

The compiler's earlier 7.1.x line, which followed upstream TypeScript's
version numbers, is discontinued and deprecated on npm.

### @runtyped/type

`@runtyped/type` follows its own semantic versioning, governed by the
reflection format it consumes. Its major is the format era that the
compiler's major moves with; a new upstream TypeScript minor does not, by
itself, require a runtime release.

### Compatibility

The compatibility surface between the compiler and the runtime is the
reflection format. Verified pairings:

| @runtyped/typescript   | @runtyped/type | Status                                              |
|------------------------|----------------|-----------------------------------------------------|
| 2.0.0+typescript.7.1.0 | 2.0.0          | first release of the scheme; identical emit to the pairing below |
| 7.1.x (discontinued)   | 2.0.0          | verified in production                              |

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

MIT (see [LICENSE](LICENSE))

[DeepKit]: https://github.com/deepkit/deepkit
[typescript]: https://www.npmjs.com/package/typescript
[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[@runtyped/type]: https://npm.im/@runtyped/type
[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler
[https://github.com/runtyped/TypeScript]: https://github.com/runtyped/TypeScript
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
