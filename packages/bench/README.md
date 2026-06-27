# @runtyped/bench

A set of benchmarks to evaluate Runtyped's performance.

## Usage

```sh
# Run with GC exposed to allow benchmarking memory usage
node --expose-gc dist/index.js
```

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
RUNTYPED_JIT_THRESHOLD=0 node --expose-gc dist/index.js

# Compilation triggered after 100 rounds
RUNTYPED_JIT_THRESHOLD=100 node --expose-gc dist/index.js

# Compilation never triggers
RUNTYPED_JIT_THRESHOLD=Infinity node --expose-gc dist/index.js
```
