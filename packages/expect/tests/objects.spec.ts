
import { test, describe } from 'node:test';
import { toMatchObject } from '../src/helpers.js';
import assert, { throws } from 'node:assert';

describe('toMatchObject()', () => {

    test('should not throw with the same object', () => {
        const actual = { a: 1, b: 2, c: 3 };
        toMatchObject(actual, actual);
    });

    test('should not throw with a subset of properties', () => {
        const actual = { a: 1, b: 2, c: 3 };
        const expected = { a: 1, b: 2 };
        toMatchObject(actual, expected);
    });

    test('should not throw with the same properties', () => {
        const actual = { a: 1, b: 2, c: 3 };
        toMatchObject(actual, { ...actual });
    });

    test('should throw with a non-object', () => {
        const expected = { a: 1, b: 2, c: 3 };
        const actual = true;
        throws(() => toMatchObject(actual, expected));
    });

    test('should throw with a superset of properties', () => {
        const expected = { a: 1, b: 2, c: 3 };
        const actual = { a: 1, b: 2 };
        throws(() => toMatchObject(actual, expected));
    });
});
