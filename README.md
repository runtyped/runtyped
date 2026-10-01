
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

The Runtyped packages follow different versioning strategies, because they
answer to different dependencies.

### @runtyped/typescript

Versioning of `@runtyped/typescript` matches that of the upstream [typescript]
package in its major and minor components, with the patch component reserved
for runtyped itself. The base is the upstream `main` line at packaging time,
which may be ahead of upstream's most recent published release.

Example: `@runtyped/typescript@7.1.1` is built upon the `7.1` line of upstream
[typescript] plus one runtyped patch.

This scheme fits the compiler because its product is TypeScript parity: its
version is the answer to "which TypeScript is this built on?".

### @runtyped/type

`@runtyped/type` follows its own semantic versioning, governed by the
reflection format it consumes rather than by upstream TypeScript. The
compiler's emitted reflection format only changes when runtyped changes it,
which is independent of upstream TypeScript's release cadence: a new upstream
minor does not, by itself, require a runtime release.

The two packages answer to different axes of change — upstream TypeScript's
evolution on one side, the reflection format's evolution on the other — and
a single version number cannot carry breaking changes along both. Letting
each package version its own axis keeps semantic versioning honest for both.

### Compatibility

The compatibility surface between the compiler and the runtime is the
reflection format. Verified pairings:

| @runtyped/typescript | @runtyped/type | Status                  |
|----------------------|----------------|-------------------------|
| 7.1.x                | 2.0.0          | verified in production  |

Going forward we plan to express this coupling through `peerDependencies`
ranges on both packages, so that the package manager itself refuses
mismatched combinations; this table is the human-readable interim.

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
[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler
[https://github.com/runtyped/TypeScript]: https://github.com/runtyped/TypeScript
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
