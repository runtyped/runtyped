# @runtyped/bench

A set of benchmarks to evaluate Runtyped's performance.

## Usage

Build the project first (`npm run build`), then:

```sh
# Run every benchmark, with GC exposed to allow benchmarking memory usage
npm run bench   # node --expose-gc dist/bench/index.js

# Run only the comparison against Ajv
npm run bench:ajv   # node --expose-gc dist/bench/ajv.js
```

## Comparison with Ajv

[`src/ajv.ts`](src/ajv.ts) compares Runtyped's validation with
[Ajv](https://ajv.js.org), the most widely used JSON Schema validator.

- The Ajv validators are compiled from the JSON Schemas that
  `toJsonSchema<T>()` generates for the same TypeScript types, so both
  libraries check the same constraints. Before anything is measured, the
  benchmark checks that both libraries agree on every fixture, and throws if
  they don't.
- Extra properties are allowed on both sides.
- **Type guard** groups compare `is<T>()` and `typeGuard<T>()` with an Ajv
  validator that stops at the first error.
- **Errors** groups compare `validate<T>()` and `validateFunction<T>()` with
  an Ajv validator compiled with `allErrors: true`.
- `is<T>()` and `validate<T>()` resolve the type on every call.
  `typeGuard<T>()` and `validateFunction<T>()` are built once, like Ajv's
  `compile()`, so they are the like-for-like comparison.
- Fixtures go through mitata's computed parameters. Otherwise V8 can
  constant-fold a small inlined validator against a fixed input and report
  sub-nanosecond times.

## JIT  Compilation

Use the `RUNTYPED_JIT_THRESHOLD` environment variable to set the threshold
for triggering JIT compilation:

| Value | Description |
|-------|-------------|
| `0`   | Compilation always triggers |
| `<number>` | Compilation triggered after <number> rounds |
| `Infinity` | Compilation never triggers |

```sh
# Compilation always triggers
RUNTYPED_JIT_THRESHOLD=0 node --expose-gc dist/bench/index.js

# Compilation triggered after 100 rounds
RUNTYPED_JIT_THRESHOLD=100 node --expose-gc dist/bench/index.js

# Compilation never triggers
RUNTYPED_JIT_THRESHOLD=Infinity node --expose-gc dist/bench/index.js
```
