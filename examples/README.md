# Examples

Runnable examples of using [@runtyped/type], grouped by feature. Each one is
a self-contained script that checks its own claims with `node:assert`. They
are compiled by `npm run build` and run as part of `npm test`, so they stay
in sync with the library.

```sh
npm run build

# Run all examples.
npm run examples

# Run a single example.
node dist/examples/type-annotations/01-simple-annotation.js
```

The examples import from `../../index.js` because they live inside this
repository. In your own project, import from `@runtyped/type` instead.

## Type annotations

Type annotations attach run-time metadata to types without changing them at
compile-time. They are how frameworks built on Runtyped add their own
meaning to types: these examples use them to implement an auto-increment
field for a tiny in-memory store, a feature that Runtyped itself, being
framework-agnostic, does not provide.

| Example | Demonstrates |
| --- | --- |
| [01-simple-annotation.ts](./type-annotations/01-simple-annotation.ts) | Declaring an annotation with `TypeAnnotation<Name>`, reading it from `typeAnnotation`, removing it with `ResetAnnotation<>`, and that annotations do not affect serialization. |
| [02-annotation-with-options.ts](./type-annotations/02-annotation-with-options.ts) | Passing options with `TypeAnnotation<Name, Options>` and reading them with `typeToObject()`. |
| [03-annotation-definition.ts](./type-annotations/03-annotation-definition.ts) | Giving an annotation its own typed storage with `AnnotationDefinition`, filled by a type decorator registered with `registerTypeDecorator()`, which also handles `ResetAnnotation<>`. This is how the built-in annotations work. |

All three also use `Identifier`, which marks the property that uniquely
identifies an object, and `ReflectionClass` to inspect the annotated
properties.

## Validation

| Example | Demonstrates |
| --- | --- |
| [01-validation-performance.ts](./validation/01-validation-performance.ts) | The different ways to validate data (`typeGuard<T>()`, `is<T>()`, `typeGuardStrict<T>()`, `typeGuardWeak<T>()`, `assert<T>()`, `validate<T>()`, `cast<T>()`, `castFunction<T>()` and a guard followed by `deserializeFunction<T>()`): what each one accepts and returns, and what it costs on valid and invalid input. Run it with `--bench` to measure them on your machine. |

[@runtyped/type]: https://npm.im/@runtyped/type
