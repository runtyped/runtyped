/**
 * Type to use for custom type annotations.
 *
 * Adds runtime meta information to a type without influencing the type itself.
 * This is like an intrinsic type, but only for runtime.
 *
 * ```typescript
 * import { TypeAnnotation, typeAnnotation } from '@runtyped/type';
 *
 * type Sensitive = TypeAnnotation<'sensitive'>;
 * type Password = string & Sensitive;
 *
 * const type = typeOf<Password>();
 * const metaData = typeAnnotation.getType(type, 'sensitive');
 * ```
 *
 * Runtime type is `{ __meta?: never & [T, Options] };`
 *
 * @intrinsic
 */
export type TypeAnnotation<T extends string, Options = never> = unknown;

