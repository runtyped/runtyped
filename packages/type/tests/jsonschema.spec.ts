import { test, describe } from 'node:test';
import { expect } from '@runtyped/expect';
import { toJsonSchema } from '../src/jsonschema/jsonschema';

describe('toJsonSchema', () => {

  test('should handle numbers', () => {
    type numeric = number;
    const schema = toJsonSchema<numeric>();
    expect(schema).toEqual({ type: 'number' });
  });


});
