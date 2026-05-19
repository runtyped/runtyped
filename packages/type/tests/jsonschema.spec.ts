import { test, describe } from 'node:test';
import { expect } from '@runtyped/expect';
import { toJsonSchema } from '../src/jsonschema/jsonschema';

describe('toJsonSchema', () => {

  test('should handle numbers', () => {
    type Numeric = number;
    const schema = toJsonSchema<Numeric>();
    expect(schema).toEqual({ type: 'number' });
  });

  test('should handle booleans', () => {
    type Booleany = boolean;
    const schema = toJsonSchema<Booleany>();
    expect(schema).toEqual({ type: 'boolean' });
  });

  test('should handle objects', () => {
    type Objecty = { a: 5 };
    const schema = toJsonSchema<Objecty>();
    expect(schema).toEqual({
      type: 'object',
      properties: {
        a: { type: 'number' },
      },
      required: ['a'],
    });
  });

  test('should handle objects with optional properties', () => {
    type ObjectyOptProps = { a?: 5, b: 7 };
    const schema = toJsonSchema<ObjectyOptProps>();
    expect(schema).toEqual({
      type: 'object',
      properties: {
        a: { type: 'number' },
        b: { type: 'number' },
      },
      required: ['b'],
    });
  });


});
