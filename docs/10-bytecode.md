# Runtyped: Bytecode

To learn in detail how Runtyped encodes and reads the type information in JavaScript, this chapter is intended. It explains how the types are actually converted into bytecode, emitted in JavaScript, and then interpreted at runtime.

## Compiler

The compiler, [@runtyped/typescript], is responsible for reading the types
defined in TypeScript files and compiling them into bytecode. This bytecode has
everything needed to execute the types at runtime.

`@runtyped/typescript` is a fork of the official TypeScript 7.x compiler, which
is written in Go. Its reflection transformer (in
`tsc/internal/transformers/runtyped` of [runtyped/TypeScript]) runs as part of
the compiler's own emit pipeline, before type annotations are erased: it reads
the AST, produces the corresponding bytecode and inserts it into the emitted
JavaScript. A second transformer adds matching declarations to the emitted
`.d.ts` files, so that types imported from other packages can be reflected
too.

As the transformer is built into the compiler, there is nothing to install or
register: any file compiled with its `tsc` is reflected, subject to the
`reflection` field in `tsconfig.json` (see [Getting started](02-getting-started.md#tsconfigjson)).

> [!NOTE]
> Up to Runtyped 2.x, the same bytecode was produced by
> `@runtyped/type-compiler`, a transformer written in TypeScript that patched
> the official `typescript` package up to the 6.x series. It is now deprecated.

## Bytecode Encoding

The bytecode is a sequence of commands for a virtual machine and is encoded in the JavaScript itself as an array of references and string (the actual bytecode).

```typescript
//TypeScript
type TypeA = string;

//generated JavaScript
const typeA = ['&'];
```

The existing commands themselves are each one byte in size and are defined by the `ReflectionOp` enum in `src/type-spec/type.ts` of @runtyped/type, which the compiler mirrors in `ops.go`. At the time of this writing, the command set is 90 commands in size.

```typescript
enum ReflectionOp {
    never,
    any,
    unknown,
    void,
    object,

    string,
    number,

    //...many more
}
```

A sequence of commands is encoded as a string to save memory. So a type `string[]` is conceptualized as a bytecode program `[string, array]` which has the bytes `[5, 37]` and encoded with the following algorithm:

```typescript
function encodeOps(ops: ReflectionOp[]): string {
    return ops.map(v => String.fromCharCode(v + 33)).join('');
}
```

Accordingly, a `5` becomes an `&` character and a `37` becomes an `F` character. Together they become `&F` and are emitted in Javascript as `['&F']`.

```typescript
//TypeScript
export type TypeA = string[];

//generated JavaScript
const __ΩTypeA = ['TypeA', '&Fw!y'];
export { __ΩTypeA as __ΩTypeA };
```

After `&F`, the program ends with `w!` (`typeName`, with the name `'TypeA'`
found at index 0 of the array, encoded as `!`) and `y` (`nominal`), which give
the resulting type its name and identity.

To prevent naming conflicts, each type is given a `__Ω` prefix. For each explicitly defined type that is exported or used by an exported type, a bytecode is emitted in the JavaScript. Classes and functions also receive a bytecode directly as a property.

```typescript
//TypeScript
export function log(message: string): void {}

//generated JavaScript
log.__type = ['message', 'log', 'P&2!$/"'];
export function log(message) {}
```

## Virtual Machine

A virtual machine (in @runtyped/type the class Processor) at runtime is responsible for decoding and executing the encoded bytecode. It always returns a type object as described in the [Reflection API](04-reflection.md).

More information can be found in [TypeScript Bytecode Interpreter / Runtime Types #47658](https://github.com/microsoft/TypeScript/issues/47658).

[@runtyped/typescript]: https://npm.im/@runtyped/typescript
[runtyped/TypeScript]: https://github.com/runtyped/TypeScript
