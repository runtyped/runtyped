# Change Log

All notable changes to this project will be documented in this file.

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
