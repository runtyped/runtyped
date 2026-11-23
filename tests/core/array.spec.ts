import { test } from 'node:test';
import { expect } from '../expect/index.js';

import { arrayRemoveItem } from '../../src/core/array.js';

test('remove', () => {

    const array = ['a', 'b', 'c'];
    expect(arrayRemoveItem(array, 'c')).toBe(true);
    expect(array).toEqual(['a', 'b']);

    expect(arrayRemoveItem(array, 'a')).toBe(true);
    expect(array).toEqual(['b']);

    expect(arrayRemoveItem(array, 'b')).toBe(true);
    expect(array).toEqual([]);

    expect(arrayRemoveItem(array, 'd')).toBe(false);
    expect(array).toEqual([]);
});
