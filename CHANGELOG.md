# Change Log

All notable changes to this project will be documented in this file.

## [2026-05-18] - Bootstrapped from Deepkit

- Bootstrapped by forking [Deepkit](https://github.com/marcj/deepkit) at commit 
[0336f66](https://github.com/marcj/deepkit/commit/0336f6691be4fe0f79e8827762c2d41751d4021f).
- Removed all framework modules unrelated to runtime types.
- Refactored tests to replace [`jest`](https://www.npmjs.com/package/jest)
  with Node's native test runner and [`expect`](https://www.npmjs.com/package/expect)
  with an internal assertion library built on [`chai`](https://www.npmjs.com/package/chai)
  reducing dependency count from 300+ to just 44 in total, 38 of which are
  required at runtime. This includes all transitive dependencies.
