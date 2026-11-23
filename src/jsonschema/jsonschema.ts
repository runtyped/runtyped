
import { ReceiveType, resolveReceiveType } from '../reflection/reflection.js';
import { SchemaRegistry } from './SchemaRegistry.js';
import { unwrapTypeSchema } from './TypeSchemaResolver.js';

const registry = new SchemaRegistry();

export const toJsonSchema = <T>(type?: ReceiveType<T>) => {
  type = resolveReceiveType(type);
  return unwrapTypeSchema(type, registry);
};
