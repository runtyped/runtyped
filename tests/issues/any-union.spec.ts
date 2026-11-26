import { test } from 'node:test';
import { expect } from '../expect/index.js';
import { cast, deserialize, serialize } from '../../src/serializer-facade.js';
import { is } from '../../src/typeguard.js';

// https://github.com/runtyped/runtyped/issues/11: a union with an any member
// rewrote every input into another member instead of passing it through.

type Tick = { method: 'tick'; params: { at: number } };

test('cast() passes input through a union with an any member', () => {
    for (const input of [
        { method: 'message', params: { text: 'hi', sender: '@j' } },
        { method: 'nope', params: {} },
        { method: 'tick', params: { at: 'not a number' } },
        'a string',
        42,
        null,
    ]) {
        expect(cast<any | Tick>(input)).toEqual(input);
        expect(cast<Tick | any>(input)).toEqual(input);
        expect(cast<unknown | Tick>(input)).toEqual(input);
    }
});

test('deserialize() and serialize() pass input through a union with an any member', () => {
    const input = { method: 'message', params: { text: 'hi' } };
    expect(deserialize<any | Tick | string>(input)).toEqual(input);
    expect(serialize<any | Tick | string>(input)).toEqual(input);
});

test('is() accepts anything for unknown, alone or in a union', () => {
    for (const input of [null, undefined, 0, '', false, {}, { method: 'nope' }]) {
        expect(is<unknown>(input)).toBe(true);
        expect(is<unknown | Tick>(input)).toBe(true);
        expect(is<any | Tick>(input)).toBe(true);
    }
});
