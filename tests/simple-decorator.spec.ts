/*
 * Runtyped Framework
 * Copyright Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { test } from 'node:test';
import { expect } from './expect/index.js';
import { typeOf } from '../src/reflection/reflection.js';
import { Identifier, identifierAnnotation } from '../src/reflection/type.js';

test('primary key', () => {
    type t = number & Identifier;
    const type = typeOf<t>();
    expect(identifierAnnotation.isIdentifier(type)).toBe(true);
});
