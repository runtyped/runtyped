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
/** @group Type Guards */

import { AbstractClassType, ClassType, getClassName } from './core.js';

/**
 * Returns true if the given obj is a plain object, and no class instance.
 *
 * isPlainObject(\{\}) === true
 * isPlainObject(new ClassXY) === false
 */
export function isPlainObject(obj: any): obj is object {
    return Boolean(obj && typeof obj === 'object' && obj.constructor instanceof obj.constructor);
}

/**
 * Returns true when target is a class instance.
 */
export function isClassInstance(target: any): boolean {
    return target !== undefined && target !== null
        && target['constructor']
        && Object.getPrototypeOf(target) === (target as any)['constructor'].prototype
        && !isPlainObject(target)
        && isObject(target);
}

/**
 * Returns true if given obj is a function.
 */
export function isFunction(obj: any): obj is Function {
    return 'function' === typeof obj && !isClassFunction(obj);
}

/**
 * Returns true if given obj is a ES6 class (ES5 fake classes are not supported).
 */
export function isClass(obj: any): obj is AbstractClassType {
    return 'function' === typeof obj && isClassFunction(obj);
}

const classFunctionCache = new WeakMap<Function, boolean>();

/**
 * Tells ES6 classes apart from other functions. These checks sit on hot paths
 * (e.g. resolving the type of every `is<T>()` call), so the expensive source
 * inspection is avoided whenever possible.
 */
function isClassFunction(fn: Function): boolean {
    // Arrow functions, methods and async functions have no own `prototype`
    // and can never be classes.
    if (!Object.prototype.hasOwnProperty.call(fn, 'prototype')) return false;
    let result = classFunctionCache.get(fn);
    if (result === undefined) {
        // Deliberately the function's own toString(), which can be overridden
        // to make a function pass for a class.
        const source = fn.toString();
        result = source.startsWith('class ') || source.startsWith('class{');
        classFunctionCache.set(fn, result);
    }
    return result;
}

declare var global: any;
declare var window: any;

export function isGlobalClass(obj: any): obj is AbstractClassType {
    if ('function' !== typeof obj) return false;

    if ('undefined' !== typeof window) {
        return (window as any)[getClassName(obj)] === obj;
    }
    if ('undefined' !== typeof global) {
        return (global as any)[getClassName(obj)] === obj;
    }
    return false;
}

/**
 * Returns true for real objects: object literals ({}) or class instances (new MyClass).
 */
export function isObject(obj: any): obj is { [key: string]: any } {
    if (obj === null) {
        return false;
    }
    return (typeof obj === 'object' && !isArray(obj));
}

export const isArray: (obj: any) => obj is any[] = Array.isArray;

export function isNull(obj: any): obj is null {
    return null === obj;
}

export function isUndefined(obj: any): obj is undefined {
    return undefined === obj;
}

/**
 * Checks if obj is not null and not undefined.
 */
export function isSet(obj: any): boolean {
    return !isNull(obj) && !isUndefined(obj);
}

/**
 * Check if it is a real number (not NaN/Infinite).
 */
export function isNumber(obj: any): obj is number {
    return 'number' === typeof obj && !isNaN(obj) && isFinite(obj);
}

/**
 * Returns true if given value is strictly a numeric string value (or a number).
 *
 * ```typescript
 * isNumeric(12); //true
 * isNumeric('12'); //true
 * isNumeric('12.3'); //true
 * isNumeric('12.3 '); //false
 * isNumeric('12px'); //false
 * ```
 */
export function isNumeric(s: string | number): boolean {
    if ('number' === typeof s) return true;
    let points = 0;
    for (let i = s.length - 1; i >= 0; i--) {
        const d = s.charCodeAt(i);
        if (d === 46) {
            //46 = .
            if (points++ > 0) return false;
            continue;
        }
        if (d < 48 || d > 57) return false;
    }
    return true;
}

export function isPrototypeOfBase(prototype: AbstractClassType | undefined, base: ClassType): boolean {
    if (!prototype) return false;
    if (prototype === base) return true;
    let currentProto = Object.getPrototypeOf(prototype);
    while (currentProto && currentProto !== Object.prototype) {
        if (currentProto === base) return true;
        currentProto = Object.getPrototypeOf(currentProto);
    }
    return false;
}

