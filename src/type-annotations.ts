import { ClassType, TypeAnnotation } from './core/index.js';

import {
    ReflectionKind,
    Type,
    TypeClass,
    TypeObjectLiteral,
    resolveProperty,
    typeToObject,
} from './reflection/type.js';
import type { ValidatorError } from './validator.js';

export type ValidatorMeta<Name extends string, Args extends [...args: any[]] = []> = TypeAnnotation<
    'validator',
    [Name, Args]
>;
export type ValidateFunction = (value: any, type: Type, options: any) => ValidatorError | void;
export type Validate<T extends ValidateFunction, Options extends Parameters<T>[2] = unknown> = ValidatorMeta<
    'function',
    [T, Options]
>;
export type Pattern<T extends RegExp> = ValidatorMeta<'pattern', [T]>;
export type Alpha = ValidatorMeta<'alpha'>;
export type Alphanumeric = ValidatorMeta<'alphanumeric'>;
export type Ascii = ValidatorMeta<'ascii'>;
export type Decimal<MinDigits extends number = 1, MaxDigits extends number = 100> = ValidatorMeta<
    'decimal',
    [MinDigits, MaxDigits]
>;
export type MultipleOf<Num extends number> = ValidatorMeta<'multipleOf', [Num]>;
export type MinLength<Length extends number> = ValidatorMeta<'minLength', [Length]>;
export type MaxLength<Length extends number> = ValidatorMeta<'maxLength', [Length]>;
export type Includes<T extends string | number | boolean> = ValidatorMeta<'includes', [T]>;
export type Excludes<T extends string | number | boolean> = ValidatorMeta<'excludes', [T]>;
export type Minimum<T extends number | bigint> = ValidatorMeta<'minimum', [T]>;
export type Maximum<T extends number | bigint> = ValidatorMeta<'maximum', [T]>;
/**
 Includes 0. Use PositiveNoZero to exclude 0.
 */
export type Positive = ValidatorMeta<'positive', unknown & [true]>;
/**
 * Includes 0. Use NegativeNoZero to exclude 0.
 */
export type Negative = ValidatorMeta<'negative', [true]>;
export type PositiveNoZero = ValidatorMeta<'positive', [false]>;
export type NegativeNoZero = ValidatorMeta<'negative', [false]>;
export type ExclusiveMinimum<T extends number | bigint> = ValidatorMeta<'exclusiveMinimum', [T]>;
export type ExclusiveMaximum<T extends number | bigint> = ValidatorMeta<'exclusiveMaximum', [T]>;
export type BeforeDate<T extends number> = ValidatorMeta<'beforeDate', [T]>;
export type AfterDate<T extends number> = ValidatorMeta<'afterDate', [T]>;
export type BeforeNow = ValidatorMeta<'beforeNow'>;
export type AfterNow = ValidatorMeta<'afterNow'>;
export const EMAIL_REGEX = /^\S+@\S+$/;
export type Email = string & Pattern<typeof EMAIL_REGEX>;
/**
 * Integer
 */
export type integer = number;
/**
 * Integer 8 bit.
 * Min value -127, max value 128
 */
export type int8 = number;
/**
 * Unsigned integer 8 bit.
 * Min value 0, max value 255
 */
export type uint8 = number;
/**
 * Integer 16 bit.
 * Min value -32768, max value 32767
 */
export type int16 = number;
/**
 * Unsigned integer 16 bit.
 * Min value 0, max value 65535
 */
export type uint16 = number;
/**
 * Integer 8 bit.
 * Min value -2147483648, max value 2147483647
 */
export type int32 = number;
/**
 * Unsigned integer 32 bit.
 * Min value 0, max value 4294967295
 */
export type uint32 = number;
/**
 * Float (same as number, but different semantic for databases).
 */
export type float = number;
/**
 * Float 32 bit.
 */
export type float32 = number;
/**
 * Float 64 bit.
 */
export type float64 = number;

export type Annotations = any; //actual { [name: symbol]: any[] };, but not support in older TS

export class AnnotationDefinition<T = true> {
    public symbol: symbol;

    constructor(public readonly id: string) {
        this.symbol = Symbol(id);
    }

    register(annotations: Annotations, data: T) {
        annotations[this.symbol] ||= [];
        annotations[this.symbol].push(data);
    }

    reset(annotations: Annotations) {
        //not `delete` so that Object.assign works
        annotations[this.symbol] = undefined;
    }

    registerType<TType extends Type>(type: TType, data: T): TType {
        type.annotations ||= {};
        this.register(type.annotations, data);
        return type;
    }

    replace(annotations: Annotations, annotation: T[]) {
        annotations[this.symbol] = annotation;
    }

    replaceType(type: Type, annotation: T[]) {
        type.annotations ||= {};
        type.annotations[this.symbol] = annotation;
    }

    getAnnotations(type: Type): T[] {
        if (type.annotations) return type.annotations[this.symbol] || [];
        return [];
    }

    getFirst(type: Type): T | undefined {
        return this.getAnnotations(type)[0];
    }

    hasAnnotations(type: Type): boolean {
        return this.getAnnotations(type).length > 0;
    }
}

export type AnnotationType<T extends AnnotationDefinition<any>> = T extends AnnotationDefinition<infer K> ? K : never;
export type ReferenceActions = 'RESTRICT' | 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';

export interface ReferenceOptions {
    /**
     * Default is CASCADE.
     */
    onDelete?: ReferenceActions;

    /**
     * Default is CASCADE.
     */
    onUpdate?: ReferenceActions;
}

/**
 * Assigns one or multiple groups to a type.
 *
 * @example
 * ```typescript
 * interface User {
 *     username: string;
 *     password: string & Group<'credentials'>;
 * }
 * ```
 */
export type Group<Name extends string> = TypeAnnotation<'group', Name>;
/**
 * Excludes the type from serialization of all kind.
 *
 * @example
 * ```typescript
 * interface User {
 *    username: string;
 *    password: string & Excluded;
 *  }
 *  ```
 */
export type Excluded<Name extends string = '*'> = TypeAnnotation<'excluded', Name>;
/**
 * Assigns arbitrary data to a type that can be read in runtime.
 *
 * @example
 * ```typescript
 * interface User {
 *   username: string;
 *   password: string & Data<'role', 'admin'>;
 * }
 * ```
 */
export type Data<Name extends string, Value> = TypeAnnotation<'data', [Name, Value]>;
/**
 * Resets an already set decorator to undefined.
 *
 * The required Name is the name of the type decorator (its first tuple entry).
 *
 * ```typescript
 * type Password = string & MinLength<6> & Excluded;
 *
 * interface UserCreationPayload {
 *     password: Password & ResetAnnotation<'excluded'>
 * }
 * ```
 */
export type ResetAnnotation<Name extends string> = TypeAnnotation<'reset', Name>;
/**
 * note: if this is adjusted, make sure to adjust ReflectionClass, entityAnnotation, and type serializer accordingly.
 */
export interface EntityOptions {
    name?: string;
    description?: string;
}

/**
 * Type to decorate an interface/object literal with entity information.
 *
 * ```typescript
 * interface User extends Entity<{name: 'user'}> {
 *     id: number & Identifier;
 *     username: string;
 * }
 * ```
 */
export type Entity<T extends EntityOptions> = {} & TypeAnnotation<'entity', T>;
/**
 * Marks a property as the identifier of its object: the value that uniquely
 * identifies an instance, e.g. when it is the target of a `Reference`.
 * ```typescript
 * class User {
 *     id: number & Identifier = 0;
 * }
 * ```
 */
export type Identifier = TypeAnnotation<'identifier'>;
type TypeKeyOf<T> = T[keyof T];
export type IdentifierFields<T> = any extends T
    ? any
    : { [P in keyof T]: Required<T[P]> extends Required<Identifier> ? T[P] : never };
export type IdentifierType<T> = any extends T ? any : TypeKeyOf<IdentifierFields<T>>;
export type ReferenceFields<T> = {
    [P in keyof T]: Required<T[P]> extends Required<Reference> | Required<BackReference> ? T[P] : never;
};
/**
 * Same as `bigint` but serializes to unsigned binary with unlimited size (instead of 8 bytes in most databases).
 * Negative values will be converted to positive (abs(x)).
 *
 * ```typescript
 * class Entity {
 *     id: BinaryBigInt = 0n;
 * }
 * ```
 */
export type BinaryBigInt = bigint & TypeAnnotation<'binaryBigInt'>;
/**
 * Same as `bigint` but serializes to signed binary with unlimited size (instead of 8 bytes in most databases).
 * The binary has an additional leading sign byte and is represented as an uint: 255 for negative, 0 for zero, or 1 for positive.
 *
 * ```typescript
 * class Entity {
 *     id: SignedBinaryBigInt = 0n;
 * }
 * ```
 */
export type SignedBinaryBigInt = bigint & TypeAnnotation<'signedBinaryBigInt'>;

export interface BackReferenceOptions {
    /**
     * Necessary for normalised many-to-many relations. This defines the class of the pivot table/collection.
     */
    via?: ClassType | {};

    /**
     * A reference/backReference can define which reference on the other side
     * reference back. This is necessary when there are multiple outgoing references
     * to the same entity.
     */
    mappedBy?: string;
}

export type Reference<Options extends ReferenceOptions = {}> = TypeAnnotation<'reference', Options>;
export type BackReference<Options extends BackReferenceOptions = {}> = TypeAnnotation<'backReference', Options>;

/**
 * Options for the Inline annotation.
 * Controls which serializers should serialize the reference as a nested object.
 */
export interface InlineOptions {
    /**
     * List of serializer names where inline serialization is active.
     * If specified, only these serializers will output nested objects.
     * Example: { only: ['json'] } - only JSON serializer outputs nested, BSON outputs FK.
     */
    only?: string[];

    /**
     * List of serializer names where inline serialization is disabled.
     * These serializers will output FK even with & Inline.
     * Example: { except: ['bson'] } - BSON outputs FK, others output nested.
     */
    except?: string[];
}

/**
 * Marks a Reference field to be serialized as a nested object instead of just the foreign key.
 *
 * By default, `& Reference` fields serialize as FK only (just the identifier).
 * Adding `& Inline` changes this to serialize the full nested object.
 *
 * @example
 * ```typescript
 * class Post {
 *     // Serializes as FK: { author: 2 }
 *     author: User & Reference;
 *
 *     // Serializes as nested: { editor: { id: 3, name: "Bob" } }
 *     // Throws if not loaded via joinWith()
 *     editor: User & Reference & Inline;
 *
 *     // Nested only for JSON serializer, FK for BSON
 *     reviewer: User & Reference & Inline<{ only: ['json'] }>;
 * }
 * ```
 *
 * Note: MongoDB database serialization always outputs FK regardless of Inline.
 */
export type Inline<Options extends InlineOptions = {}> = TypeAnnotation<'inline', Options>;
export type EmbeddedMeta<Options> = TypeAnnotation<'embedded', Options>;
export type Embedded<T, Options extends { prefix?: string } = {}> = T & EmbeddedMeta<Options>;
export type MapName<Alias extends string, ForSerializer extends string = ''> = TypeAnnotation<
    'mapName',
    [Alias, ForSerializer]
>;

export interface EmbeddedOptions {
    prefix?: string;
}

export const embeddedAnnotation = new AnnotationDefinition<EmbeddedOptions>('embedded');

export function hasEmbedded(type: Type): boolean {
    if (type.kind === ReflectionKind.propertySignature || type.kind === ReflectionKind.property)
        return hasEmbedded(type.type);
    if (type.kind === ReflectionKind.union) return type.types.some(hasEmbedded);
    return embeddedAnnotation.getFirst(type) !== undefined;
}

export enum BinaryBigIntType {
    unsigned,
    signed,
}

export const binaryBigIntAnnotation = new AnnotationDefinition<BinaryBigIntType>('binaryBigInt');
export const groupAnnotation = new AnnotationDefinition<string>('group');
export const excludedAnnotation = new (class extends AnnotationDefinition<string> {
    isExcluded(type: Type, name: string): boolean {
        const excluded = this.getAnnotations(type);
        return excluded.includes('*') || excluded.includes(name);
    }
})('excluded');
export const dataAnnotation = new (class extends AnnotationDefinition<{ [name: string]: any }> {
    set<T extends Type>(type: T, key: string, value: any): T {
        const data = this.getFirst(type) || {};
        data[key] = value;
        this.replaceType(type, [data]);
        return type;
    }

    get(type: Type, key: string): any {
        const data = this.getFirst(type) || {};
        return data[key];
    }
})('data');
/**
 * All raw data from `TypeAnnotation<Name, Options>` types.
 */
export const typeAnnotation = new (class extends AnnotationDefinition<{ name: string; options: Type }> {
    /**
     * Returns the parsed Type to JS objects, e.g. `{name: string}` => `{name: 'xy'}`
     */
    getOption(type: Type, name: string): any {
        const options = this.getType(type, name);
        return options ? typeToObject(options) : undefined;
    }

    /**
     * Returns the Type object of the annotation which can be parsed with `typeToObject`.
     */
    getType(type: Type, name: string): Type | undefined {
        for (const v of this.getAnnotations(type)) {
            if (v.name === name) return v.options;
        }
        return;
    }
})('meta');
export const referenceAnnotation = new AnnotationDefinition<ReferenceOptions>('reference');
export const inlineAnnotation = new AnnotationDefinition<InlineOptions>('inline');
export const entityAnnotation = new (class extends AnnotationDefinition<EntityOptions> {
    set<K extends keyof EntityOptions>(type: Type, name: K, value: EntityOptions[K]) {
        const data = this.getFirst(type) || {};
        data[name] = value;
        this.replaceType(type, [data]);
    }

    get(type: Type): EntityOptions {
        let data = this.getFirst(type);
        if (data) return data;
        data = {};
        this.replaceType(type, [data]);
        return data;
    }
})('entity');
export const mapNameAnnotation = new AnnotationDefinition<{ name: string; serializer?: string }>('mapName');
export const identifierAnnotation = new (class extends AnnotationDefinition {
    isIdentifier(type: Type): boolean {
        return this.getAnnotations(type).length > 0;
    }
})('identifier');

export interface BackReferenceOptionsResolved {
    /**
     * Necessary for normalised many-to-many relations. This defines the class of the pivot table/collection.
     */
    via?: TypeClass | TypeObjectLiteral;

    /**
     * A reference/backReference can define which reference on the other side
     * reference back. This is necessary when there are multiple outgoing references
     * to the same entity.
     */
    mappedBy?: string;
}

export const backReferenceAnnotation = new AnnotationDefinition<BackReferenceOptionsResolved>('backReference');

export function isIdentifierType(type: Type): boolean {
    return identifierAnnotation.isIdentifier(type);
}

export function isBinaryBigIntType(type: Type): boolean {
    return binaryBigIntAnnotation.getFirst(type) !== undefined;
}

export function isReferenceType(type: Type): boolean {
    return referenceAnnotation.getFirst(resolveProperty(type)) !== undefined;
}

export function getReferenceType(type: Type): ReferenceOptions | undefined {
    return referenceAnnotation.getFirst(resolveProperty(type));
}

export function isBackReferenceType(type: Type): boolean {
    return backReferenceAnnotation.getFirst(resolveProperty(type)) !== undefined;
}

export function getBackReferenceType(type: Type): BackReferenceOptionsResolved {
    const options = backReferenceAnnotation.getFirst(type);
    if (!options) throw new Error('No back reference');
    return options;
}

// These depend on the Type system but are defined here to avoid circular dependencies
// (reflection/type.ts uses AnnotationDefinition at module load time)
export const defaultAnnotation = new AnnotationDefinition<Type>('default');
export const validationAnnotation = new AnnotationDefinition<{ name: string, args: Type[] }>('validation');
