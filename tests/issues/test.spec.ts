import { test } from 'node:test';
import { expect } from '../expect/index.js';
import { typeOf } from '../../src/reflection/reflection.js';
import { typeAnnotation } from '../../src/reflection/type.js';

test('test', () => {
    type MyAnnotation = { __meta?: never & ['myAnnotation'] };
    type Username = string & MyAnnotation;
    const type = typeOf<Username>();
    const data = typeAnnotation.getType(type, 'myAnnotation');
    expect(data).toEqual(undefined);
});
