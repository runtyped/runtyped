/**
 * Type to use for custom type annotations.
 *
 * Adds runtime meta information to a type without influencing the type itself.
 * This is like an intrinsic type, but only for runtime.
 *
 * ```typescript
 * import { TypeAnnotation, typeAnnotation } from '@runtyped/type';
 *
 * type PrimaryKey = TypeAnnotation<'primaryKey'>;
 * type UserId = string & PrimaryKey;
 *
 * const type = typeOf<UserId>();
 * const metaData = typeAnnotation.getType(type, 'primaryKey');
 * ```
 *
 * Runtime type is `{ __meta?: never & [T, Options] };`
 *
 * @intrinsic
 */
export type TypeAnnotation<T extends string, Options = never> = unknown;

