# Change Log

All notable changes to this project will be documented in this file.

## Unreleased

- BREAKING: removed the deepkit-specific ID types `UUID`, `MongoId` and
  `NanoId`, together with their annotations (`uuidAnnotation`,
  `mongoIdAnnotation`, `nanoidAnnotation`), type checks (`isUUIDType()`,
  `isMongoIdType()`, `isNanoIdType()`) and serializer handlers
  (`guardUUID*`, `deserializeUUID`, `guardMongoId*`, `deserializeMongoId`,
  `guardNanoId*`, `deserializeNanoId`). Use `string`, optionally with a
  `Pattern<>` validator, instead.
- BREAKING: removed the `uuid()`, `writeUuid()` and `stringifyUuid()`
  helpers. Use `crypto.randomUUID()` instead.
- BREAKING: renamed `PrimaryKey` to `Identifier`, since outside of an ORM it
  simply marks the property that uniquely identifies an object (and that a
  `Reference` serializes to). The annotation name changes from `'primaryKey'`
  to `'identifier'` (including in `ResetAnnotation<>`), and the related APIs
  follow: `identifierAnnotation` (with `isIdentifier()`), `isIdentifierType()`,
  `IdentifierFields<T>`, `IdentifierType<T>`,
  `ReflectionProperty.isIdentifier()`, `ReflectionClass.getIdentifier()`,
  `hasIdentifier()`, `getIdentifiers()` and `extractIdentifier()`, and
  `getIdentifierExtractor()`, `getIdentifierHashGenerator()` and
  `getSimpleIdentifierHashGenerator()` in the snapshot module.
- BREAKING: removed the database-specific annotations inherited from
  deepkit: `AutoIncrement`, `Index`, `Unique`, `IndexOptions`,
  `DatabaseField`, `MySQL`, `Postgres`, `SQLite` and their options types,
  `autoIncrementAnnotation`, `indexAnnotation`, `databaseAnnotation`,
  `isAutoIncrementType()` and the `AutoId` type, along with
  `ReflectionProperty.isAutoIncrement()`, `getIndex()`, `getDatabase()`,
  `isDatabaseSkipped()` and `isDatabaseMigrationSkipped()`, and
  `ReflectionClass.getAutoIncrement()`.
- BREAKING: `Entity<>` and `@entity` keep only their general-purpose
  options (`name`, `description`, `disableConstructor()`, `data()`). Removed
  the `collection`, `database`, `indexes` and `singleTableInheritance`
  options, the `@entity.collection()`, `.databaseSchema()`, `.index()`,
  `.singleTableInheritance()` and `.excludeMigration()` decorators, and
  `ReflectionClass.collectionName`, `databaseSchemaName`, `indexes`,
  `singleTableInheritance`, `subClasses`, `getCollectionName()` and the
  single-table-inheritance helpers.
- Type decorators registered with `registerTypeDecorator()` now run before
  the built-in one, so they can claim their own `TypeAnnotation<>` names.
  Previously the built-in decorator stored every such annotation as a generic
  `typeAnnotation` entry, and custom decorators never saw them.
- Fixed `ResetAnnotation<'embedded'>` resetting `Excluded<>` instead of
  `Embedded<>`.
- Fixed `ResetAnnotation<'name'>` for custom `TypeAnnotation<>`s removing
  every custom annotation from the type instead of only the named one.
- Added runnable [examples](./examples/README.md), grouped by feature,
  starting with custom type annotations.
- `@runtyped/type` no longer has runtime dependencies: `uuid` is gone, and
  `camelcase` (used for JSON Schema names) and `to-fast-properties` are
  replaced by internal ports. JSON Schema names are now built without regard
  to the host's locale.

## **`3.0.1`**

- Fixed the typings requiring `@types/node`: `nodeBufferToTypedArray()` and
  `typedArrayToBuffer()` referred to Node's `Buffer` type, so projects without
  Node's type definitions failed to compile against `@runtyped/type`. They now
  use the new `NodeBuffer` type, which is Node's `Buffer` when `@types/node`
  is loaded and `Uint8Array` otherwise.

## [2026-11-23] - **`3.0.0`** - One compiler, one package

This release completes the move to [@runtyped/typescript], the fork of the
Go-based TypeScript 7.x compiler, and consolidates the repository into a
single [@runtyped/type] package. The reflection format is unchanged; the
major bump marks the breaking changes below, and [@runtyped/typescript] is
bumped to 3.0.0 alongside so that matching majors keep meaning compatible
packages (see [Versioning](./README.md#versioning)).

- DEPRECATED: [@runtyped/type-compiler], the JavaScript transformer that
  patched the official `typescript` package, together with support for
  TypeScript 6.x and earlier. [@runtyped/type] 3.x requires
  [@runtyped/typescript]. Projects that must stay on TypeScript 6.x can keep
  using [@runtyped/type-compiler] 2.x with [@runtyped/type] 2.x, which will
  not receive further updates.
- DEPRECATED: `@runtyped/core`, `@runtyped/type-spec` and `@runtyped/expect`.
  Their code now lives inside [@runtyped/type] as internal modules
  (`expect` only as a test helper).
- BREAKING: `@runtyped/core` was pruned down to what type reflection needs,
  dropping the modules and functions inherited from Deepkit that nothing
  used (buffers, decorators, event emitter, enums, networking, process
  locks, reactive helpers, timers, path and URL helpers, among others) and
  the `dot-prop` dependency. What the public API depends on is now exported
  by [@runtyped/type]: `ClassType`, `AbstractClassType`, `ExtractClassType`,
  `TypeAnnotation`, `RuntypedError`, `Builder`, `Ref` and `VarRef`.
- Parity: the test suite previously exercising [@runtyped/type-compiler]
  now runs against [@runtyped/typescript], whose 2.1.x releases fixed about
  twenty differences in emitted reflection data between the two compilers.

### Migrating from 2.x

1. Replace `typescript` and `@runtyped/type-compiler` with
   `@runtyped/typescript` in your dev dependencies, and drop any call to
   `runtyped-install-transformer`. `tsc` keeps the same CLI.
2. Check the `reflection` field of your `tsconfig.json`. Without it,
   [@runtyped/type-compiler] reflected nothing, while [@runtyped/typescript]
   reflects every file. Set `"reflection": false` (or `"never"`) to keep the
   old behaviour, or narrow it down with `"explicit"` or a list of globs.
3. Replace imports from `@runtyped/core` with imports from `@runtyped/type`.
   Imports of `@runtyped/type-spec` and `@runtyped/expect` have no public
   replacement.
4. Bundler and runtime integrations based on the JavaScript transformer, such
   as its loader for Vite, Bun or esbuild, are gone. Compile with
   [@runtyped/typescript] instead.

[@runtyped/type]: https://npm.im/@runtyped/type
[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[@runtyped/type-compiler]: https://npm.im/@runtyped/type-compiler

## [2026-06-27] - **`2.0.0`** - DeepKit V2

This release cherry-picks the changes from the [DeepKit V2 PR] that are
applicable to Runtyped. These include but are not limited to a new JIT
architecture that lazily compiles hot paths on-demand and lots of fixes
and performance improvements throughout the entire codebase.

Then, building on top of the changes cherry-picked from DeepKit V2, this
release brings the following:

- TS's compiler options `useDefineForClassFields` is now implicitly set
  to `true` to enable ES2022+ class field semantics.
- A fix for ignored instance fields sharing the same name as static fields.
  This behavior was also present in Deepkit V1, and thus was inherited by
  Runtyped, and was fixed in commit 403f085. Cherry-picking from Deepkit V2 
  re-introduced the bug, requiring a new fix.
- A new benchmarking suite, built around the [mitata](https://npm.im/mitata)
  library.

AI DISCLAIMER: a lot of this work was done with the help of Sage, an AI
agent running on a custom harness that maintains continuity and context
across activations. Models used were GLM 5.2 and DeepSeek V4 Pro hosted
by [TensorX].

[TensorX]: https://tensorx.ai/
[DeepKit V2 PR]: https://github.com/marcj/deepkit/pull/693

## [2026-06-21] - **`1.0.20`** - First stable release!

- BREAKING: removed first-party rollup plugin, `compiler-debug` script and
  direct dependency on `@rollup/pluginutils`.
- BREAKING: forces users to explicitly run the `runtyped-install-transformer`
  script rather than relying on NPM's script hooks.

This marks the first stable release of Runtyped since the project was [forked
from Deepkit](./README.md#relationship-to-deepkit). This release is primarily
focused on decreasing long-term maintenance overheads, abandoning dual ESM-CJS
builds and eliminating many dependencies. Secondary goals were compatibility
with TypeScript 6.x and all current versions of both NPM and Node.js, which is
now tested in the CI pipeline, and beginning the process of documenting how the
type virtual machine works.

## [2026-06-08] - `1.0.20-alpha.4`

- BREAKING: converted build to ESM-only, no more CJS (https://github.com/runtyped/runtyped/pull/2).
- Updated `typescript` to 6.x branch and fixed related compatibility issues.
- Updated test targets to include Node 26.x.

## [2026-05-20] - `1.0.20-alpha.3`

- Minor documentation updates.
- Added `toJsonSchema<T>()`, bootstrapped from MIT-licensed
  [deepkit-openapi](https://github.com/hanayashiki/deepkit-openapi)
  at commit [55f0026](https://github.com/hanayashiki/deepkit-openapi/commit/55f0026a978a9098d93cef3f391e04f892f7ab66).

## [2026-05-18] - Bootstrapped from Deepkit

- Bootstrapped by forking [Deepkit](https://github.com/marcj/deepkit) at commit 
[0336f66](https://github.com/marcj/deepkit/commit/0336f6691be4fe0f79e8827762c2d41751d4021f).
- Removed all framework modules unrelated to runtime types.
- Refactored tests to replace [`jest`](https://www.npmjs.com/package/jest)
  with Node's native test runner and [`expect`](https://www.npmjs.com/package/expect)
  with an internal assertion library built on [`chai`](https://www.npmjs.com/package/chai).
  Doing so reduced dependency count from 300+ to just 41 in total, 37 of which
  are required at runtime. These numbers include all transitive dependencies.
