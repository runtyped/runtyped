# Change Log

All notable changes to this project will be documented in this file.

## [Unreleased] - `2.0.0` - DeepKit V2

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
