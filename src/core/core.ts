/*
 * Runtyped Framework
 * Copyright (c) Deepkit UG, Marc J. Schmidt
 * Copyright (c) Jacopo Scazzosi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { isArray, isClassInstance, isObject, isPlainObject } from './type-guards.js';

/**
 * Makes sure the error once printed using console.log contains the actual class name.
 *
 * @example
 * ```
 * class MyApiError extends CustomerError {}
 *
 * throw MyApiError() // prints MyApiError instead of simply "Error".
 * ```
 */
export class CustomError extends Error {
    public name: string;

    constructor(...args: any[]) {
        super(...args);
        this.name = this.constructor.name;
    }
}

/**
 * @internal
 */
export interface CustomError {
    cause?: unknown;
}

export interface ClassType<T = any> {
    new(...args: any[]): T;
}

export type AbstractClassType<T = any> = abstract new (...args: any[]) => T;

export type ExtractClassType<T> = T extends AbstractClassType<infer K> ? K : never;

/**
 * Returns the class name either of the class definition or of the class of an instance.
 *
 * Note when code is minimized/uglified this output will change. You should disable in your compile the
 * className modification.
 *
 * @example
 * ```typescript
 * class User {}
 *
 * expect(getClassName(User)).toBe('User');
 * expect(getClassName(new User())).toBe('User');
 * ```
 */
export function getClassName<T>(classTypeOrInstance: ClassType<T> | Object): string {
    if (!classTypeOrInstance) return 'undefined';
    const proto = (classTypeOrInstance as any)['prototype'] ? (classTypeOrInstance as any)['prototype'] : classTypeOrInstance;
    return proto.constructor.name || 'anonymous class';
}

/**
 * Returns the ClassType for a given instance.
 */
export function getClassTypeFromInstance<T>(target: T): ClassType<T> {
    if (!isClassInstance(target)) {
        throw new Error(`Value is not a class instance. Got ${stringifyValueWithType(target)}`);
    }

    return (target as any)['constructor'] as ClassType<T>;
}

const MAX_STRING_LENGTH = 50;
const MAX_OBJECT_KEYS = 3;
const MAX_ARRAY_ITEMS = 3;

/**
 * Stringify a primitive value for inclusion in object/array representations.
 * Keeps output compact - no type prefix.
 */
function stringifyPrimitive(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    switch (type) {
        case 'boolean':
        case 'number':
            return String(value);
        case 'bigint':
            return `${value}n`;
        case 'string': {
            const str = value as string;
            if (str.length > 20) {
                return `"${str.slice(0, 17)}..."`;
            }
            return `"${str}"`;
        }
        case 'symbol':
            return String(value);
        case 'function':
            return '[function]';
        case 'object':
            if (isArray(value)) return `[...]`;
            if (value instanceof Date) return value.toISOString();
            return '{...}';
        default:
            return String(value);
    }
}

/**
 * Returns a human-readable string representation from the given value.
 *
 * @example
 * ```typescript
 * stringifyValueWithType(true)           // "boolean true"
 * stringifyValueWithType("hello")        // 'string "hello"'
 * stringifyValueWithType({a:1, b:2})     // "object {a: 1, b: 2}"
 * stringifyValueWithType([1,2,3,4,5,6])  // "array [1, 2, 3, ...] (6 items)"
 * ```
 */
export function stringifyValueWithType(value: unknown, seen: WeakSet<object> = new WeakSet()): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    switch (type) {
        case 'boolean':
            return `boolean ${value}`;

        case 'number':
            return `number ${value}`;

        case 'bigint':
            return `bigint ${value}n`;

        case 'string': {
            const str = value as string;
            if (str.length > MAX_STRING_LENGTH) {
                return `string "${str.slice(0, MAX_STRING_LENGTH - 3)}..." (truncated)`;
            }
            return `string "${str}"`;
        }

        case 'symbol':
            return `symbol ${String(value)}`;

        case 'function':
            return (value as Function).name ? `function ${(value as Function).name}` : 'function';

        case 'object': {
            const obj = value as object;

            // Check for circular references
            if (seen.has(obj)) {
                return 'object [circular]';
            }
            seen.add(obj);

            try {
                // Handle special object types
                if (isArray(obj)) {
                    const len = obj.length;
                    if (len === 0) return 'array []';
                    const items = obj.slice(0, MAX_ARRAY_ITEMS).map(item => stringifyPrimitive(item));
                    if (len <= MAX_ARRAY_ITEMS) {
                        return `array [${items.join(', ')}]`;
                    }
                    return `array [${items.join(', ')}, ...] (${len} items)`;
                }

                if (obj instanceof Date) {
                    return `Date ${obj.toISOString()}`;
                }

                if (obj instanceof Set) {
                    return `Set (${obj.size} items)`;
                }

                if (obj instanceof Map) {
                    return `Map (${obj.size} entries)`;
                }

                if (obj instanceof RegExp) {
                    return `RegExp ${obj.toString()}`;
                }

                if (obj instanceof Error) {
                    return `Error ${obj.name}: ${obj.message}`;
                }

                // Handle typed arrays and ArrayBuffer
                if (ArrayBuffer.isView(obj)) {
                    return `${(obj as any).constructor.name} (${(obj as unknown as { length: number }).length || (obj as unknown as { byteLength: number }).byteLength} bytes)`;
                }

                if (obj instanceof ArrayBuffer) {
                    return `ArrayBuffer (${obj.byteLength} bytes)`;
                }

                // Check if it's a class instance (not plain object)
                if (isObject(obj) && !isPlainObject(obj)) {
                    const className = getClassName(getClassTypeFromInstance(obj));
                    const keys = Object.keys(obj);
                    if (keys.length === 0) return `${className} {}`;
                    const displayKeys = keys.slice(0, MAX_OBJECT_KEYS);
                    const pairs = displayKeys.map(key => {
                        const val = (obj as Record<string, unknown>)[key];
                        return `${key}: ${stringifyPrimitive(val)}`;
                    });
                    if (keys.length <= MAX_OBJECT_KEYS) {
                        return `${className} {${pairs.join(', ')}}`;
                    }
                    const remaining = keys.length - MAX_OBJECT_KEYS;
                    return `${className} {${pairs.join(', ')}, ...} (${remaining} more keys)`;
                }

                // Plain object
                const keys = Object.keys(obj);
                if (keys.length === 0) return 'object {}';

                const displayKeys = keys.slice(0, MAX_OBJECT_KEYS);
                const pairs = displayKeys.map(key => {
                    const val = (obj as Record<string, unknown>)[key];
                    return `${key}: ${stringifyPrimitive(val)}`;
                });

                if (keys.length <= MAX_OBJECT_KEYS) {
                    return `object {${pairs.join(', ')}}`;
                }
                const remaining = keys.length - MAX_OBJECT_KEYS;
                return `object {${pairs.join(', ')}, ...} (${remaining} more keys)`;
            } catch {
                // Fallback for any object that throws during inspection
                return 'object [unreadable]';
            }
        }

        default:
            return String(type);
    }
}

/**
 * Creates a shallow copy of given array.
 */
export function copy<T>(v: T[]): T[] {
    if (isArray(v)) {
        return v.slice(0);
    }

    return v;
}

/**
 * Checks whether given array or object is empty (no keys). If given object is falsy, returns false.
 */
export function empty<T>(value?: T[] | object | {}): boolean {
    if (!value) return true;

    if (isArray(value)) {
        return value.length === 0;
    } else {
        for (const i in value) if (value.hasOwnProperty(i)) return false;
        return true;
    }
}

/**
 * Returns the size of given array or object.
 */
export function size<T>(array: T[] | { [key: string]: T }): number {
    if (!array) {
        return 0;
    }

    if (isArray(array)) {
        return array.length;
    } else {
        return getObjectKeysSize(array);
    }
}

/**
 * Returns the first key of a given object.
 */
export function firstKey(v: { [key: string]: any } | object): string | undefined {
    return Object.keys(v)[0];
}

/**
 * Returns the first value of given array or object.
 */
export function first<T>(v: { [key: string]: T } | T[]): T | undefined {
    if (isArray(v)) {
        return v[0];
    }

    const key = firstKey(v);
    if (key) {
        return v[key];
    }
    return;
}

/**
 * Returns the last value of given array or object.
 */
export function last<T>(v: { [key: string]: T } | T[]): T | undefined {
    if (isArray(v)) {
        if (v.length > 0) {
            return v[v.length - 1];
        }
        return;
    }

    const key = firstKey(v);
    if (key) {
        return v[key];
    }
    return;
}

/**
 * Returns the number of properties on `obj`. This is 20x faster than Object.keys(obj).length.
 */
export function getObjectKeysSize(obj: object): number {
    let size = 0;
    for (let i in obj) if (obj.hasOwnProperty(i)) size++;
    return size;
}

export function getParentClass(classType: ClassType): ClassType | undefined {
    const parent = Object.getPrototypeOf(classType);
    if (parent === Object.prototype || Object.getPrototypeOf(parent) === Object.prototype) return;
    return parent;
}

export function getInheritanceChain(classType: ClassType): ClassType[] {
    const chain: ClassType[] = [classType];
    let current = classType;
    while (current = getParentClass(current) as ClassType) {
        chain.push(current);
    }
    return chain;
}

declare var v8debug: any;
declare var process: {
    execArgv: string[];
    platform: string;
} | undefined;

export function hasProperty(object: any, property: any): boolean {
    return Object.prototype.hasOwnProperty.call(object, property);
}

/**
 * Returns an iterator of numbers from start (inclusive) to stop (exclusive) by step.
 */
export function* range(startOrLength: number, stop: number = 0, step: number = 1): IterableIterator<number> {
    let i = startOrLength;
    let end = stop;
    if (stop === 0) {
        i = 0;
        end = startOrLength;
    }

    for (; i < end; i += step) {
        yield i;
    }
}

/**
 * Returns a combined array of the given arrays.
 *
 * Works the same as python's zip function.
 */
export function zip<T extends (readonly unknown[])[]>(
    ...args: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
    const minLength = Math.min(...args.map((arr) => arr.length));
    //@ts-ignore
    return Array.from({ length: minLength }).map((_, i) => args.map((arr) => arr[i]));
}

/**
 * Forwards the runtime type arguments from function x to function y.
 * This is necessary when a generic function is overridden and forwarded to something else.
 *
 * ```typescript
 * let generic = <T>(type?: ReceiveType<T>) => undefined;
 *
 * let forwarded<T> = () => {
 *     forwardTypeArguments(forwarded, generic); //all type arguments are forwarded to generic()
 *     generic(); //call as usual
 * }
 *
 * forwarded<any>(); //generic receives any in runtime.
 * ```
 *
 * Note that generic.bind(this) will not work, as bind() creates a new function and forwarded type arguments can not
 * reach the original function anymore.
 *
 * ```typescript
 * let forwarded<T> = () => {
 *     const bound = generic.bind(this);
 *     forwardTypeArguments(forwarded, bound); //can not be forwarded anymore
 *     bound(); //fails
 * }
 * ```
 *
 *  This is a limitation of JavaScript. In this case you have to manually forward type arguments.
 *
 *  ```typescript
 *  let forwarded<T> = (type?: ReceiveType<T>) => {
 *     const bound = generic.bind(this);
 *     bound(type);
 *  }
 *  ```
 */
export function forwardTypeArguments(x: any, y: any): void {
    y.Ω = x.Ω;
    x.Ω = undefined;
}

