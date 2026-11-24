import { test } from 'node:test';
import { expect } from '../expect/index.js';
import { CustomError, getClassName, getClassTypeFromInstance, getObjectKeysSize, getParentClass, stringifyValueWithType, zip } from '../../src/core/core.js';
import { isArray, isClass, isClassInstance, isFunction, isGlobalClass, isNumeric, isObject, isPlainObject, isPrototypeOfBase, isUndefined } from '../../src/core/type-guards.js';

class SimpleClass {
    constructor(public name: string) {
    }
}

test('helper getClassName', () => {
    class User {
        constructor(public readonly name: string) {
        }
    }

    class MyError extends Error {
    }

    expect(getClassName(new User('peter'))).toBe('User');
    expect(getClassName(User)).toBe('User');

    expect(getClassName(MyError)).toBe('MyError');
    expect(getClassName(new MyError)).toBe('MyError');
});

test('error', () => {
    const custom = new CustomError('my message', { cause: new Error('that is the cause') });
    expect((custom as any).cause.message).toEqual('that is the cause');
});

test('helper isObject', () => {
    expect(isObject([])).toBe(false);
    expect(isObject(false)).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(() => {
    })).toBe(false);
    expect(isObject(function() {
    })).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject('1')).toBe(false);

    expect(isObject({})).toBe(true);
    expect(isObject(new Date())).toBe(true);
    expect(isObject(new SimpleClass('asd'))).toBe(true);
});

test('helper isFunction', () => {
    expect(isFunction([])).toBe(false);
    expect(isFunction(false)).toBe(false);
    expect(isFunction(true)).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction(undefined)).toBe(false);
    expect(isFunction(1)).toBe(false);
    expect(isFunction('1')).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction(new Date())).toBe(false);
    expect(isFunction(new SimpleClass('asd'))).toBe(false);

    expect(isFunction(isFunction)).toBe(true);
    expect(isFunction(() => {
    })).toBe(true);
    expect(isFunction(async () => {
    })).toBe(true);
    expect(isFunction(function() {
    })).toBe(true);
    expect(isFunction(async function() {
    })).toBe(true);
    expect(isFunction(class Peter {
    })).toBe(false);
    expect(isFunction(class {
    })).toBe(false);
    expect(isFunction(class {
    })).toBe(false);

    const fn = function() {
    };
    fn.toString = () => 'class{}';
    expect(isFunction(fn)).toBe(false);

    // Functions without an own prototype are never classes.
    expect(isFunction({ method() {} }.method)).toBe(true);
    expect(isFunction(async function* () {})).toBe(true);
    // Results are cached per function; repeated checks must stay consistent.
    class Cached {}
    expect(isFunction(Cached)).toBe(false);
    expect(isFunction(Cached)).toBe(false);
    expect(isClass(Cached)).toBe(true);
});

test('helper isClass', () => {
    expect(isClass([])).toBe(false);
    expect(isClass(false)).toBe(false);
    expect(isClass(true)).toBe(false);
    expect(isClass(null)).toBe(false);
    expect(isClass(undefined)).toBe(false);
    expect(isClass(1)).toBe(false);
    expect(isClass('1')).toBe(false);
    expect(isClass({})).toBe(false);
    expect(isClass(new Date())).toBe(false);
    expect(isClass(new SimpleClass('asd'))).toBe(false);
    expect(isClass(isFunction)).toBe(false);
    expect(isClass(() => {
    })).toBe(false);
    expect(isClass(async () => {
    })).toBe(false);
    expect(isClass(function() {
    })).toBe(false);
    expect(isClass(async function() {
    })).toBe(false);

    expect(isClass(SimpleClass)).toBe(true);
});

test('helper isPlainObject', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(false)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject('1')).toBe(false);
    expect(isPlainObject(() => {
    })).toBe(false);
    expect(isPlainObject(function() {
    })).toBe(false);

    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new SimpleClass('asd'))).toBe(false);

    class O extends Object {
    }

    expect(isPlainObject(new O)).toBe(false);

    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(new Object)).toBe(true);
});

test('helper is array', () => {
    expect(isArray({})).toBe(false);
    expect(isArray(new Date())).toBe(false);
    expect(isArray(new SimpleClass('asd'))).toBe(false);
    expect(isArray(false)).toBe(false);
    expect(isArray(true)).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
    expect(isArray(1)).toBe(false);
    expect(isArray('1')).toBe(false);

    expect(isArray([])).toBe(true);
});

test('helper is isUndefined', () => {
    expect(isUndefined({})).toBe(false);
    expect(isUndefined(new Date())).toBe(false);
    expect(isUndefined(new SimpleClass('asd'))).toBe(false);
    expect(isUndefined(false)).toBe(false);
    expect(isUndefined(true)).toBe(false);
    expect(isUndefined(null)).toBe(false);
    expect(isUndefined(1)).toBe(false);
    expect(isUndefined('1')).toBe(false);
    expect(isUndefined([])).toBe(false);

    expect(isUndefined(undefined)).toBe(true);
});

test('getObjectKeysSize', async () => {
    expect(getObjectKeysSize({})).toBe(0);
    expect(getObjectKeysSize({ a: true })).toBe(1);
    expect(getObjectKeysSize({ a: 1, b: 1, c: 3, d: 4, e: {} })).toBe(5);
});

test('isPrototypeOfBase', () => {
    class Base {
    }

    class Child1 extends Base {
    }

    class Child2 extends Base {
    }

    class Child1_1 extends Child1 {
    }

    class Child1_1_1 extends Child1_1 {
    }

    expect(isPrototypeOfBase(Base, Base)).toBe(true);
    expect(isPrototypeOfBase(Child1, Base)).toBe(true);
    expect(isPrototypeOfBase(Child2, Base)).toBe(true);
    expect(isPrototypeOfBase(Child1_1, Base)).toBe(true);
    expect(isPrototypeOfBase(Child1_1, Child1)).toBe(true);
    expect(isPrototypeOfBase(Child1_1_1, Base)).toBe(true);
    expect(isPrototypeOfBase(Child1_1_1, Child1_1)).toBe(true);
});

test('stringifyValueWithType', async () => {
    class Peter {
        id = 1;
    }

    expect(stringifyValueWithType(new Peter())).toBe(`Peter {id: 1}`);
    expect(stringifyValueWithType({ id: 1 })).toBe(`object {id: 1}`);
    expect(stringifyValueWithType('foo')).toBe(`string "foo"`);
    expect(stringifyValueWithType(2)).toBe(`number 2`);
    expect(stringifyValueWithType(true)).toBe(`boolean true`);
    expect(stringifyValueWithType(function Peter() {})).toBe(`function Peter`);

    // Additional tests for new format
    expect(stringifyValueWithType(null)).toBe('null');
    expect(stringifyValueWithType(undefined)).toBe('undefined');
    expect(stringifyValueWithType(123n)).toBe('bigint 123n');
    expect(stringifyValueWithType([1, 2, 3])).toBe('array [1, 2, 3]');
    expect(stringifyValueWithType([1, 2, 3, 4, 5])).toBe('array [1, 2, 3, ...] (5 items)');
    expect(stringifyValueWithType(new Date('2024-01-01T00:00:00.000Z'))).toBe('Date 2024-01-01T00:00:00.000Z');
    expect(stringifyValueWithType(/test/gi)).toBe('RegExp /test/gi');
    expect(stringifyValueWithType(new Set([1, 2]))).toBe('Set (2 items)');
    expect(stringifyValueWithType(new Map([['a', 1]]))).toBe('Map (1 entries)');
});

test('getClassTypeFromInstance', async () => {
    class Peter {
    }

    expect(getClassTypeFromInstance(new Peter)).toBe(Peter);
    expect(() => getClassTypeFromInstance({})).toThrow('Value is not a class instance');
    expect(() => getClassTypeFromInstance('asd')).toThrow('Value is not a class instance');
    expect(() => getClassTypeFromInstance(23)).toThrow('Value is not a class instance');
    expect(() => getClassTypeFromInstance(undefined)).toThrow('Value is not a class instance');
});

test('isClassInstance', async () => {
    class Peter {
    }

    expect(isClassInstance(new Peter)).toBe(true);
    expect(isClassInstance({})).toBe(false);
    expect(isClassInstance('asd')).toBe(false);
    expect(isClassInstance(undefined)).toBe(false);
    expect(isClassInstance(null)).toBe(false);
    expect(isClassInstance(3223)).toBe(false);
});

test('isNumeric', () => {
    expect(isNumeric(12)).toBe(true);
    expect(isNumeric(12.2)).toBe(true);
    expect(isNumeric('12')).toBe(true);
    expect(isNumeric('12.2')).toBe(true);
    expect(isNumeric('12.2 ')).toBe(false);
    expect(isNumeric('12..2')).toBe(false);
});

test('getParentClass', () => {
    class User {
    }

    class Admin extends User {
    }

    class SuperAdmin extends Admin {
    }

    expect(getParentClass({} as any)).toBe(undefined);
    expect(getParentClass(Object)).toBe(undefined);
    expect(getParentClass(User)).toBe(undefined);
    expect(getParentClass(Admin)).toBe(User);
    expect(getParentClass(SuperAdmin)).toBe(Admin);
});

test('zip', () => {
    expect(zip([1, 2, 3], ['a', 'b', 'c'])).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
    expect(zip([1, 2, 3], ['a', 'b'])).toEqual([[1, 'a'], [2, 'b']]);
    expect(zip([1, 2], ['a', 'b', 'c'])).toEqual([[1, 'a'], [2, 'b']]);
    expect(zip([1, 2, 3], ['a', 'b', 'c'], [true, false, true])).toEqual([[1, 'a', true], [2, 'b', false], [3, 'c', true]]);
});

test('isGlobalClass', () => {
    expect(isGlobalClass(undefined)).toBe(false);
    expect(isGlobalClass({})).toBe(false);

    expect(isGlobalClass(Date)).toBe(true);
    expect(isGlobalClass(Array)).toBe(true);
    expect(isGlobalClass(TextDecoder)).toBe(true);

    class MyError extends Error {
    }

    expect(isGlobalClass(Error)).toBe(true);
    expect(isGlobalClass(MyError)).toBe(false);

    expect(isGlobalClass(Uint8Array)).toBe(true);
});
