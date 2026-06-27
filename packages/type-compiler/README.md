# @runtyped/type-compiler

TypeScript types disappear at run time. Runtyped changes that, preserving
types at run time via a compiler plugin and enabling type-driven validation, 
serialization and more. 

Started as a selective fork [Deepkit] focused on its type reflection capabilities.
See [Relationship to Deepkit](https://github.com/runtyped/runtyped#relationship-to-deepkit).

## Introduction

This package is the build-time companion to [@runtyped/type]. It provides a
TypeScript compiler plugin that reflects type information, normally available
only during compilation, into run-time values.

Check the documentation at [https://github.com/runtyped/runtyped].

## Installation

```sh
# Install @runtyped/type as a run-time dependency and @runtyped/type-compiler
# as a development or compile-time dependency.
npm i @runtyped/type
npm i --dev @runtyped/type-compiler

# Run the installer script to patch the TypeScript compiler with the Runtyped
# transformer. If npx is not available, the script should also be runnable via
# `./node_modules/.bin/runtyped-install-transformer`.
npx runtyped-install-transformer
```

[@runtyped/type]: https://npm.im/@runtyped/type
[https://github.com/runtyped/runtyped]: https://github.com/runtyped/runtyped
