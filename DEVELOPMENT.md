# Development

## Prerequisites

- Node >= v20 is needed.

## Getting Started

```sh
# Clone the repository.
git clone https://github.com/runtyped/runtyped.git
cd runtyped

# Install all dependencies, including @runtyped/typescript, which provides
# the `tsc` used by all scripts.
npm install

# Build the library, tests and benchmarks with @runtyped/typescript, which
# emits the type information they surface at run-time.
npm run build

# Run tests.
npm test

# Run tests with coverage.
npm run test:coverage

# Run benchmarks.
npm run bench
```

## Layout

The repository is a single package, [@runtyped/type], built by one
`tsconfig.json` into `dist/`:

| Path               | Contents                                                       |
| ------------------ | -------------------------------------------------------------- |
| `index.ts`         | Public entry point; everything exported from the package.      |
| `src/`             | The runtime library.                                           |
| `src/core/`        | Internal utilities (JIT builder, type guards, errors, …).      |
| `src/type-spec/`   | Internal definition of the `ReflectionOp` bytecode.            |
| `tests/`           | Test suite, run with Node's native test runner.                |
| `tests/core/`      | Tests for `src/core/`.                                         |
| `tests/expect/`    | Internal `expect()`-style assertion helper built on `chai`.    |
| `bench/`           | Benchmarks, built around [mitata].                             |
| `examples/`        | Runnable usage examples, run as part of `npm test`.            |
| `docs/`            | Documentation.                                                 |

Only `dist/index.*` and `dist/src/` are published to npm. `src/core/` and
`src/type-spec/` are internal: whatever the public API needs from them is
re-exported by `index.ts`.

`src/type-spec/type.ts` is the source of truth for the `ReflectionOp` codes.
Its Go counterpart, `tsc/internal/transformers/runtyped/ops.go` in
[runtyped/TypeScript], must be kept in sync with it.

## Testing against a local compiler

`tests/compiler.spec.ts` spawns the `tsc` binary from
`node_modules/@runtyped/typescript`. Set `RUNTYPED_TSC` to test against a
locally built compiler instead, e.g. a checkout of [runtyped/TypeScript]:

```sh
RUNTYPED_TSC=../TypeScript/built/local/tsc npm test
```

To build the whole repository with a local compiler, invoke it directly in
place of `npm run build`:

```sh
../TypeScript/built/local/tsc -p tsconfig.json
```

[@runtyped/type]: https://npm.im/@runtyped/type
[mitata]: https://npm.im/mitata
[runtyped/TypeScript]: https://github.com/runtyped/TypeScript
