
import { stringifyType, Type } from "../reflection/type.js";

export class TypeNotSupportedError extends Error {
  constructor(public type: Type, public reason: string = "") {
    super(`${stringifyType(type)} is not supported. ${reason}`);
  }
}

export class LiteralNotSupportedError extends Error {
  constructor(public typeName: string) {
    super(`${typeName} is not supported. `);
  }
}

export class SchemaNameConflictError extends Error {
  constructor(public newType: Type, public oldType: Type, public override name: string) {
    super(
      `${stringifyType(newType)} and ${stringifyType(
        oldType,
      )} are not the same, but their schema are both named as ${JSON.stringify(
        name,
      )}. ` +
        `Try to fix the naming of related types, or rename them using 'YourClass & Name<ClassName>'`,
    );
  }
}

export class JsonSchemaErrors extends Error {
  constructor(public errors: Error[], message: string) {
    super(message);
  }
}
