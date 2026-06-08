import { test } from 'node:test';
import { expect } from '@runtyped/expect';
import { typeOf } from '../../src/reflection/reflection.js';
import { assertType, findMember, ReflectionKind } from '../../src/reflection/type.js';

test('test', () => {
    class EmailService {
        private property;

        constructor() {
            this.property = 'yes';
        }
    }

    const type = typeOf<EmailService>();
    assertType(type, ReflectionKind.class);
    const property = findMember('property', type.types);
    assertType(property, ReflectionKind.property);
    assertType(property.type, ReflectionKind.unknown);
});
