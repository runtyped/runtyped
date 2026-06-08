
import { test, describe } from 'node:test';
import { toMatchArray } from '../src/helpers.js';
import assert, { throws } from 'node:assert';

describe('toMatchArray()', () => {

    test('should not throw with the same array', () => {
        const actual = [1, 2, 3];
        toMatchArray(actual, actual);
    });

    test('should not throw with identical arrays', () => {
      const actual = [1, 2, 3];
      const expected = [...actual];
      toMatchArray(actual, expected);
    });

    test('should not throw with identical arrays having matching objects', () => {
      const actual = [1, { a: 5, b: 7 }, 3];
      const expected = [1, { a: 5 }, 3];
      toMatchArray(actual, expected);
    });

    test('should throw with arrays of different lengths', () => {
      const actual = [1, 2, 3];
      const expected = [1, 2];
      throws(() => toMatchArray(actual, expected));
    });

    test('should throw with arrays with different elements', () => {
      const actual = [1, 2, 3];
      const expected = [1, '2', 3];
      throws(() => toMatchArray(actual, expected));
    });

    test('should throw with arrays having non-matching objects', () => {
      const actual = [1, {a: 5}, 3];
      const expected = [1, {a: 5, b: 7}, 3];
      throws(() => toMatchArray(actual, expected));
    });

});
