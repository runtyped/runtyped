/*
 * Runtyped Framework
 * Copyright (c) Deepkit UG, Marc J. Schmidt
 * Copyright (c) Jacopo Scazzosi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import {
    assertType,
    BackReferenceOptionsResolved,
    clearTypeJitContainer,
    copyAndSetParent,
    dataAnnotation,
    embeddedAnnotation,
    entityAnnotation,
    EntityOptions,
    excludedAnnotation,
    getBackReferenceType,
    getClassType,
    getReferenceType,
    getTypeJitContainer,
    groupAnnotation,
    hasMember,
    isBackReferenceType,
    isReferenceType,
    isType,
    memberNameToString,
    identifierAnnotation,
    ReferenceOptions,
    ReflectionKind,
    ReflectionVisibility,
    stringifyResolvedType,
    stringifyType,
    Type,
    TypeClass,
    TypeFunction,
    TypeMethod,
    TypeMethodSignature,
    TypeObjectLiteral,
    TypeParameter,
    TypeProperty,
    TypePropertySignature,
    TypeTemplateLiteral,
} from './type.js';
import { AbstractClassType, arrayRemoveItem, ClassType, getClassName, isArray, isClass, isFunction, isGlobalClass, isPrototypeOfBase, stringifyValueWithType } from '../core/index.js';
import { Packed, resolvePacked, resolveRuntimeType } from './processor.js';
import { NoTypeReceived } from '../utils.js';
import type { ValidateFunction } from '../type-annotations.js';
import { isWithDeferredDecorators } from '../decorator.js';
import { SerializedTypes, serializeType } from '../type-serialization.js';

/**
 * Receives the runtime type of template argument or runtime symbols like
 * class references, functions, or packed types.
 *
 * Use
 *
 * ```typescript
 * function f<T>(type?: ReceiveType<T>): Type {
 *     return resolveReceiveType(type);
 * }
 * ```
 */
export type ReceiveType<T> = Packed<T> | ClassType<T> | Type;

export function resolveReceiveType(type?: Packed | Type | Function | ClassType | AbstractClassType | ReflectionClass<any>): Type {
    if (!type) throw new NoTypeReceived();
    let typeFn: Function | undefined = undefined;

    if (isArray(type)) {
        if (type.__type) return type.__type;
        // this is fast path for simple references to a type, e.g. cast<User>(), so that User is directly handled
        // instead of running the VM to resolve to User first.
        if (type[type.length - 1] === 'n!' || type[type.length - 1] === 'P7!') {
            //n! represents a simple inline: [Op.inline, 0]
            //P7! represents a class reference: [Op.Frame, Op.classReference, 0] (Op.Frame seems unnecessary)
            const packed = type;
            typeFn = (type as any)[0] as Function | any;
            const target = (isFunction(typeFn) ? typeFn() : typeFn) as Packed | Type | ClassType | AbstractClassType | ReflectionClass<any> | undefined;
            if (!target) {
                throw new Error(`No type resolved for ${String(typeFn)}. Circular import or no runtime type available.`);
            }
            // The compiler hoists static type arguments into module-level constants,
            // so caching on the reference makes every later call a single lookup.
            return packed.__type = resolveReceiveType(target);
        }
    }

    if (type instanceof ReflectionClass) return type.type;
    if (isArray(type) && type.__type) return type.__type;
    if (isType(type)) return type as Type;
    if (isClass(type) || isGlobalClass(type)) {
        if (!('__type' in type)) {
            if ((type as any).__cached_type) return (type as any).__cached_type;
            // disabled reflection for this class, so we return shallow TypeClass
            return (type as any).__cached_type = {
                kind: ReflectionKind.class,
                classType: type as any,
                types: [],
            } as any;
        }
        return resolveRuntimeType(type) as Type;
    }
    if (isFunction(type)) return resolveRuntimeType(type) as Type;
    return resolvePacked(type, undefined, { reuseCached: true });
}

export function reflect(o: any, ...args: any[]): Type {
    return resolveRuntimeType(o, args) as Type;
}

export function reflectOrUndefined(o: any, ...args: any[]): Type | undefined {
    try {
        return resolveRuntimeType(o, args) as Type;
    } catch (error: any) {
        return undefined;
    }
}

export function valuesOf<T>(args: any[] = [], p?: ReceiveType<T>): (string | number | symbol | Type)[] {
    const type = typeOf(args, p);
    if (type.kind === ReflectionKind.union) {
        return type.types.map(v => {
            if (v.kind === ReflectionKind.literal) return v.literal;
            return v;
        }) as (string | number | symbol | Type)[];
    }
    if (type.kind === ReflectionKind.objectLiteral || type.kind === ReflectionKind.class) {
        return type.types.map(v => {
            if (v.kind === ReflectionKind.method) return v;
            if (v.kind === ReflectionKind.property) return v.type;
            if (v.kind === ReflectionKind.propertySignature) return v.type;
            if (v.kind === ReflectionKind.methodSignature) return v;
            return v;
        }) as (string | number | symbol | Type)[];
    }
    return [];
}

export function propertiesOf<T>(args: any[] = [], p?: ReceiveType<T>): (string | number | symbol | Type)[] {
    const type = typeOf(args, p);
    if (type.kind === ReflectionKind.objectLiteral || type.kind === ReflectionKind.class) {
        return type.types.map(v => {
            if (v.kind === ReflectionKind.method) return v.name;
            if (v.kind === ReflectionKind.property) return v.name;
            if (v.kind === ReflectionKind.propertySignature) return v.name;
            if (v.kind === ReflectionKind.methodSignature) return v.name;
            return v;
        }) as (string | number | symbol | Type)[];
    }
    return [];
}

export function getNominalId<T>(args: any[] = [], p?: ReceiveType<T>): number | undefined {
    const t = typeOf(args, p);
    if (t.kind === ReflectionKind.class || t.kind === ReflectionKind.objectLiteral) return t.id;
    return;
}

export function typeOf<T>(args: any[] = [], p?: ReceiveType<T>): Type {
    if (p) {
        return args.length > 0 ? resolveRuntimeType(p, args) : resolveReceiveType(p) as Type;
    }

    throw new Error('No type given');
}

export function removeTypeName<T extends Type>(type: T): T {
    const o = { ...type };
    o.id = undefined;
    o.typeName = undefined;
    o.typeArguments = undefined;
    return o;
}

export function removeNominal<T extends Type | undefined | Type[]>(type: T): T {
    if (!type) return type;
    if (isArray(type)) {
        return type.map(v => removeNominal(v)) as T;
    } else {
        if (type.kind === ReflectionKind.class || type.kind === ReflectionKind.objectLiteral) {
            return { ...type, id: undefined };
        }
    }
    return type;
}

export function getProperty(type: TypeObjectLiteral | TypeClass, memberName: number | string | symbol): TypeProperty | TypePropertySignature | undefined {
    for (const t of type.types) {
        if ((t.kind === ReflectionKind.property || t.kind === ReflectionKind.propertySignature) && t.name === memberName) return t;
    }
    return;
}

export function toSignature(type: TypeProperty | TypeMethod | TypePropertySignature | TypeMethodSignature): TypePropertySignature | TypeMethodSignature {
    if (type.kind === ReflectionKind.propertySignature || type.kind === ReflectionKind.methodSignature) return type;
    if (type.kind === ReflectionKind.property) {
        return { ...type, parent: type.parent as any, kind: ReflectionKind.propertySignature };
    }

    return { ...type, parent: type.parent as any, kind: ReflectionKind.methodSignature };
}

export function hasCircularReference(type: Type) {
    const jit = getTypeJitContainer(type);
    if (jit.hasCircularReference !== undefined) return jit.hasCircularReference;

    let hasCircular = false;
    visit(type, () => undefined, () => {
        hasCircular = true;
    });

    return jit.hasCircularReference = hasCircular;
}

let visitStackId: number = 0;

function extendPath(path: string, member: Type): string {
    let name: string | number | symbol | undefined = '';
    if ('name' in member) {
        name = member.name;
    }
    if (name === '' || name === undefined) return path;
    if (path) return path + '.' + String(name);
    return String(name);
}

export function visit(type: Type, visitor: (type: Type, path: string) => false | void, onCircular?: () => void): void {
    const stack: { type: Type, depth: number, path: string }[] = [];
    stack.push({ type, depth: 0, path: '' });
    const stackId: number = visitStackId++;

    while (stack.length) {
        const entry = stack.shift();
        if (!entry) break;
        const type = entry.type;

        const jit = getTypeJitContainer(type);
        if (jit.visitStack && jit.visitStack.id === stackId && jit.visitStack.depth < entry.depth) {
            if (onCircular) onCircular();
            return;
        }
        jit.visitStack = { id: stackId, depth: entry.depth };
        if (visitor(type, entry.path) === false) return;

        switch (type.kind) {
            case ReflectionKind.objectLiteral:
            case ReflectionKind.tuple:
            case ReflectionKind.union:
            case ReflectionKind.class:
            case ReflectionKind.intersection:
            case ReflectionKind.templateLiteral:
                for (const member of type.types) stack.push({
                    type: member,
                    depth: entry.depth + 1,
                    path: extendPath(entry.path, member),
                });
                break;
            case ReflectionKind.string:
            case ReflectionKind.number:
            case ReflectionKind.bigint:
            case ReflectionKind.symbol:
            case ReflectionKind.regexp:
            case ReflectionKind.boolean:
                if (type.origin) stack.push({ type: type.origin, depth: entry.depth + 1, path: entry.path });
                break;
            case ReflectionKind.function:
            case ReflectionKind.method:
            case ReflectionKind.methodSignature:
                stack.push({ type: type.return, depth: entry.depth + 1, path: entry.path });
                for (const member of type.parameters) stack.push({
                    type: member,
                    depth: entry.depth + 1,
                    path: extendPath(entry.path, member),
                });
                break;
            case ReflectionKind.propertySignature:
            case ReflectionKind.property:
            case ReflectionKind.array:
            case ReflectionKind.promise:
            case ReflectionKind.parameter:
            case ReflectionKind.tupleMember:
            case ReflectionKind.rest:
                stack.push({ type: type.type, depth: entry.depth + 1, path: entry.path });
                break;
            case ReflectionKind.indexSignature:
                stack.push({ type: type.index, depth: entry.depth + 1, path: entry.path });
                stack.push({ type: type.type, depth: entry.depth + 1, path: entry.path });
                break;
        }
    }
}

function hasFunctionExpression(fn: Function): boolean {
    let code = fn.toString();
    if (code.startsWith('() => ')) code = code.slice('() => '.length);
    if (code.startsWith('function () { return ')) {
        code = code.slice('function () { return '.length);
        if (code.endsWith('; }')) code = code.slice(0, -3);
    }
    if (code.startsWith('function() { return ')) {
        code = code.slice('function() { return '.length);
        if (code.endsWith('; }')) code = code.slice(0, -3);
    }
    if (code[0] === '\'' && code[code.length - 1] === '\'') return false;
    if (code[0] === '"' && code[code.length - 1] === '"') return false;
    if (code[0] === '`' && code[code.length - 1] === '`') return false;
    return code.includes('(');
}

/**
 * @reflection never
 */
export class ReflectionParameter {
    type: Type;

    constructor(
        public readonly parameter: TypeParameter,
        public readonly reflectionFunction: ReflectionMethod | ReflectionFunction,
    ) {
        this.type = this.parameter.type;
    }

    getType(): Type {
        return this.type;
    }

    getName(): string {
        return this.parameter.name;
    }

    get name(): string {
        return this.parameter.name;
    }

    isOptional(): boolean {
        return this.parameter.optional === true;
    }

    hasDefault(): boolean {
        return this.parameter.default !== undefined;
    }

    isValueRequired(): boolean {
        if (this.hasDefault()) return false;

        return !this.isOptional();
    }

    getDefaultValue(): any {
        if (this.parameter.default !== undefined) {
            return this.parameter.default();
        }
    }

    hasDefaultFunctionExpression(): boolean {
        return !!(this.parameter.default && hasFunctionExpression(this.parameter.default));
    }

    applyDecorator(t: TData) {
        if (t.type) {
            this.type = resolveReceiveType(t.type);
            if (this.getVisibility() !== undefined && this.reflectionFunction instanceof ReflectionMethod) {
                this.reflectionFunction.reflectionClass.getProperty(this.getName())!.setType(this.type);
            }
        }
    }

    getVisibility(): ReflectionVisibility | undefined {
        return this.parameter.visibility;
    }

    isPublic(): boolean {
        return this.parameter.visibility === ReflectionVisibility.public;
    }

    isProtected(): boolean {
        return this.parameter.visibility === ReflectionVisibility.protected;
    }

    isPrivate(): boolean {
        return this.parameter.visibility === ReflectionVisibility.private;
    }

    isReadonly(): boolean {
        return this.parameter.readonly === true;
    }

    /**
     * True if the parameter becomes a property in the class.
     * This is the case for parameters in constructors with visibility or readonly.
     *
     * ```typescript
     * class User {
     *    constructor(public name: string) {}
     * }
     */
    isProperty(): boolean {
        return this.parameter.readonly === true || this.parameter.visibility !== undefined;
    }
}

/**
 * @reflection never
 */
export class ReflectionFunction {
    parameters: ReflectionParameter[] = [];
    description: string = '';

    constructor(
        public readonly type: TypeMethod | TypeMethodSignature | TypeFunction,
    ) {
        for (const p of this.type.parameters) {
            this.parameters.push(new ReflectionParameter(p, this));
        }
        if (this.type.description) this.description = this.type.description;
    }

    static from(fn: Function): ReflectionFunction {
        //todo: cache it

        if (!('__type' in fn)) {
            //functions without any types have no __type attached
            return new ReflectionFunction({
                kind: ReflectionKind.function,
                function: fn,
                return: { kind: ReflectionKind.any },
                parameters: [],
            });
        }

        const type = reflect(fn);
        if (type.kind !== ReflectionKind.function) {
            throw new Error(`Given object is not a function ${fn}`);
        }
        return new ReflectionFunction(type);
    }

    getParameterNames(): (string)[] {
        return this.getParameters().map(v => v.getName());
    }

    hasParameter(name: string | number | symbol): boolean {
        return !!this.getParameterOrUndefined(name);
    }

    getParameterOrUndefined(name: string | number | symbol): ReflectionParameter | undefined {
        for (const property of this.getParameters()) {
            if (property.getName() === name) return property;
        }
        return;
    }

    getParameter(name: string | number | symbol): ReflectionParameter {
        const property = this.getParameterOrUndefined(name);
        if (!property) throw new Error(`No parameter ${String(name)} in method ${this.name} found.`);
        return property;
    }

    getParameterType(name: string | number | symbol): Type | undefined {
        const parameter = this.getParameter(name);
        if (parameter) return parameter.getType();
        return;
    }

    getParameters(): ReflectionParameter[] {
        return this.parameters;
    }

    getReturnType(): Type {
        return this.type.return;
    }

    getName(): number | string | symbol {
        return this.type.name || 'anonymous';
    }

    getDescription(): string {
        return this.description;
    }

    get name(): string {
        return memberNameToString(this.getName());
    }
}

/**
 * @reflection never
 */
export class ReflectionMethod extends ReflectionFunction {
    /**
     * Whether this method acts as validator.
     */
    validator: boolean = false;

    constructor(
        public type: TypeMethod | TypeMethodSignature,
        public reflectionClass: ReflectionClass<any>,
    ) {
        super(type);
    }

    setType(method: TypeMethod | TypeMethodSignature) {
        this.type = method;
        this.parameters = [];
        for (const p of this.type.parameters) {
            this.parameters.push(new ReflectionParameter(p, this));
        }
    }

    applyDecorator(data: TData) {
        this.validator = data.validator;
        if (this.validator) {
            this.reflectionClass.validationMethod = this.getName();
        }
    }

    clone(reflectionClass?: ReflectionClass<any>, method?: TypeMethod | TypeMethodSignature): ReflectionMethod {
        const c = new ReflectionMethod(method || this.type, reflectionClass || this.reflectionClass);
        //todo, clone parameter
        return c;
    }

    isOptional(): boolean {
        return this.type.optional === true;
    }
}

export function resolveForeignReflectionClass(property: ReflectionProperty): ReflectionClass<any> {
    if (property.isReference()) return property.getResolvedReflectionClass();
    if (property.isBackReference()) {
        if (property.isArray()) {
            return resolveClassType(property.getSubType());
        }
        return property.getResolvedReflectionClass();
    }

    throw new Error(`Property ${property.name} is neither a Reference nor a BackReference.`);
}

/**
 * Resolved the class/object ReflectionClass of the given TypeClass|TypeObjectLiteral
 */
export function resolveClassType(type: Type): ReflectionClass<any> {
    if (type.kind !== ReflectionKind.class && type.kind !== ReflectionKind.objectLiteral) {
        throw new Error(`Cant resolve ReflectionClass of type ${type.kind} since its not a class or object literal`);
    }

    return ReflectionClass.from(type);
}

/**
 * @reflection never
 */
export class ReflectionProperty {
    //is this really necessary?
    jsonType?: Type;

    serializer?: SerializerFn;
    deserializer?: SerializerFn;

    data: { [name: string]: any } = {};

    /**
     * The type of the property, not the property itself.
     *
     * Note: If the property is optional via `property?: T`, this information
     * is not available here. It's on `property`.
     * Use `isOptional()` instead, which handles this case plus the case
     * where optionality is given via union of T and undefined.
     */
    type: Type;

    symbol: symbol;

    protected cachedResolvedReflectionClass?: ReflectionClass<any>;

    constructor(
        public property: TypeProperty | TypePropertySignature,
        public reflectionClass: ReflectionClass<any>,
    ) {
        this.type = property.type;
        this.setType(this.type);
        this.symbol = Symbol(memberNameToString(this.getName()));
    }

    setType(type: Type) {
        this.type = type;
    }

    isIdentifier(): boolean {
        return identifierAnnotation.isIdentifier(this.getType());
    }

    isEmbedded(): boolean {
        return !!embeddedAnnotation.getFirst(this.getType());
    }

    /**
     * Returns the sub type if available (for arrays for example).
     *
     * @throws Error if the property type does not support sub types.
     */
    getSubType(): Type {
        if (this.type.kind === ReflectionKind.array) return this.type.type as Type;

        throw new Error(`Type ${this.type.kind} does not support sub types`);
    }

    /**
     * If undefined, it's not an embedded class.
     */
    getEmbedded(): { prefix?: string } | undefined {
        return embeddedAnnotation.getFirst(this.getType());
    }

    isBackReference(): boolean {
        return isBackReferenceType(this.getType());
    }

    getBackReference(): BackReferenceOptionsResolved {
        return getBackReferenceType(this.getType());
    }

    isReference(): boolean {
        return isReferenceType(this.getType());
    }

    isArray(): boolean {
        return this.type.kind === ReflectionKind.array;
    }

    isDate(): boolean {
        return this.type.kind === ReflectionKind.class && this.type.classType === Date;
    }

    isNumber(): boolean {
        return this.type.kind === ReflectionKind.number || this.type.kind === ReflectionKind.bigint;
    }

    getForeignKeyName(): string {
        return this.getNameAsString();
    }

    getReference(): ReferenceOptions | undefined {
        return getReferenceType(this.getType());
    }

    getGroups(): string[] {
        return groupAnnotation.getAnnotations(this.getType());
    }

    isInGroup(...group: string[]): boolean {
        return this.getGroups().some(v => group.includes(v));
    }

    getExcluded(): string[] {
        return excludedAnnotation.getAnnotations(this.getType());
    }

    isSerializerExcluded(name: string): boolean {
        return excludedAnnotation.isExcluded(this.getType(), name);
    }

    getData(): { [name: string]: any } {
        return dataAnnotation.getFirst(this.getType()) || {};
    }

    /**
     * Returns the ReflectionClass of the reference class/object literal.
     *
     * @throws Error if the property is not from type TypeClass or TypeObjectLiteral
     */
    getResolvedReflectionClass(): ReflectionClass<any> {
        if (this.type.kind !== ReflectionKind.class && this.type.kind !== ReflectionKind.objectLiteral) {
            throw new Error(`Could not resolve reflection class since ${this.name} is not a class|object but of type ${stringifyType(this.type)}`);
        }
        return this.cachedResolvedReflectionClass ||= resolveClassType(this.getType());
    }

    clone(reflectionClass?: ReflectionClass<any>, property?: TypeProperty | TypePropertySignature): ReflectionProperty {
        const c = new ReflectionProperty(copyAndSetParent(property || this.property), reflectionClass || this.reflectionClass);
        c.jsonType = this.jsonType;
        c.serializer = this.serializer;
        c.deserializer = this.deserializer;
        return c;
    }

    applyDecorator(data: TData) {
        this.serializer = data.serializer;
        this.deserializer = data.deserializer;
        Object.assign(this.data, data.data);

        //note: data.validators is already applied in Processor
    }

    getName(): number | string | symbol {
        return this.property.name;
    }

    getNameAsString(): string {
        return memberNameToString(this.property.name);
    }

    get name(): string {
        return memberNameToString(this.property.name);
    }

    getKind(): ReflectionKind {
        return this.type.kind;
    }

    getType(): Type {
        return this.type as Type;
    }

    getDescription(): string {
        return this.property.description || '';
    }

    /**
     * Whether a value is required from serialization point of view.
     * If this property has for example a default value (set via constructor or manually via t.default),
     * then the value is not required to instantiate the property value.
     */
    isValueRequired(): boolean {
        if (this.hasDefault()) return false;

        return !this.isOptional();
    }

    /**
     * Returns true when `undefined` or a missing value is allowed at the class itself.
     * This is now only true when `optional` is set, but also when type is `any`.
     */
    isActualOptional(): boolean {
        return this.isOptional() || this.type.kind === ReflectionKind.any;
    }

    /**
     * If the property is actual optional or is an union with undefined in it.
     */
    isOptional(): boolean {
        return this.property.optional === true || (this.type.kind === ReflectionKind.union && this.type.types.some(v => v.kind === ReflectionKind.undefined));
    }

    setOptional(v: boolean): void {
        this.property.optional = v ? true : undefined;
    }

    isNullable(): boolean {
        return (this.type.kind === ReflectionKind.union && this.type.types.some(v => v.kind === ReflectionKind.null));
    }

    isReadonly(): boolean {
        return this.property.readonly === true;
    }

    isAbstract(): boolean {
        return this.property.kind === ReflectionKind.property && this.property.abstract === true;
    }

    hasDefault(): boolean {
        return this.property.kind === ReflectionKind.property && this.property.default !== undefined;
    }

    getDefaultValue(): any {
        if (this.property.kind === ReflectionKind.property && this.property.default !== undefined) {
            try {
                return this.property.default();
            } catch {
                return;
            }
        }
    }

    hasDefaultFunctionExpression(): boolean {
        return this.property.kind === ReflectionKind.property && !!this.property.default && hasFunctionExpression(this.property.default);
    }

    getDefaultValueFunction(): (() => any) | undefined {
        if (this.property.kind === ReflectionKind.property && this.property.default !== undefined) {
            return this.property.default;
        }
        return;
    }

    getVisibility(): ReflectionVisibility | undefined {
        return this.property.kind === ReflectionKind.property ? this.property.visibility : undefined;
    }

    isPublic(): boolean {
        return this.property.kind === ReflectionKind.property ? this.property.visibility === ReflectionVisibility.public : true;
    }

    isProtected(): boolean {
        return this.property.kind === ReflectionKind.property ? this.property.visibility === ReflectionVisibility.protected : false;
    }

    isPrivate(): boolean {
        return this.property.kind === ReflectionKind.property ? this.property.visibility === ReflectionVisibility.private : false;
    }
}

export const reflectionClassSymbol = Symbol('reflectionClass');

export interface SerializerFn {
    (value: any, property: ReflectionProperty): any;
}

export class TData {
    validator: boolean = false;
    validators: ValidateFunction[] = [];
    type?: Packed | Type | ClassType;
    data: { [name: string]: any } = {};
    serializer?: SerializerFn;
    deserializer?: SerializerFn;
}

export class EntityData {
    name?: string;
    disableConstructor: boolean = false;
    data: { [name: string]: any } = {};
}

function applyEntityOptions(reflection: ReflectionClass<any>, entityOptions: EntityOptions) {
    if (entityOptions.name !== undefined) reflection.name = entityOptions.name;
    if (entityOptions.description !== undefined) reflection.description = entityOptions.description;
}

/**
 * @reflection never
 */
export class ReflectionClass<T> {
    /**
     * The description, extracted from the class JSDoc @description.
     */
    description: string = '';

    /**
     * A place where arbitrary data is stored, usually set via decorator t.data.
     */
    data: { [name: string]: any } = {};

    /**
     * The unique entity name.
     *
     * ```typescript
     * @entity.name('user')
     * class User {
     *
     * }
     * ```
     */
    name?: string;

    disableConstructor: boolean = false;

    protected propertyNames: string[] = [];
    protected methodNames: string[] = [];
    protected properties: ReflectionProperty[] = [];
    protected methods: ReflectionMethod[] = [];

    /**
     * References and back references.
     */
    protected references: ReflectionProperty[] = [];

    protected identifiers: ReflectionProperty[] = [];

    /**
     * If a custom validator method was set via @t.validator, then this is the method name.
     */
    public validationMethod?: string | symbol | number | TypeTemplateLiteral;

    constructor(public readonly type: TypeClass | TypeObjectLiteral, public readonly parent?: ReflectionClass<any>) {
        if (type.kind !== ReflectionKind.class && type.kind !== ReflectionKind.objectLiteral) throw new Error('Only class, interface, or object literal type possible');

        if (parent) {
            this.name = parent.name;
            this.description = parent.description;

            for (const member of parent.getProperties()) {
                this.registerProperty(member.clone(this));
            }
            for (const member of parent.getMethods()) {
                this.registerMethod(member.clone(this));
            }
        }

        for (const member of type.types) {
            this.add(member);
        }

        const entityOptions = entityAnnotation.getFirst(this.type);
        if (entityOptions) {
            applyEntityOptions(this, entityOptions);
        }
        this.description = this.type.description || this.description;

        //apply decorators
        if (type.kind === ReflectionKind.class && isWithDeferredDecorators(type.classType)) {
            for (const decorator of type.classType.__decorators) {
                if (decorator.target !== type.classType) continue;
                const { data, property, parameterIndexOrDescriptor } = decorator;
                if (property === undefined && parameterIndexOrDescriptor === undefined) {
                    this.applyDecorator(data);
                } else if (property !== undefined && parameterIndexOrDescriptor === undefined) {
                    const reflectionProperty = this.getPropertyOrUndefined(property);
                    if (reflectionProperty) reflectionProperty.applyDecorator(data);

                    const reflectionMethod = this.getMethodOrUndefined(property);
                    if (reflectionMethod) reflectionMethod.applyDecorator(data);

                } else if (parameterIndexOrDescriptor !== undefined) {
                    const reflectionMethod = this.getMethodOrUndefined(property || 'constructor');
                    if (reflectionMethod) {
                        const params = reflectionMethod.getParameters();
                        const param = params[parameterIndexOrDescriptor];
                        if (param) param.applyDecorator(data);
                    }
                }
            }
        }
    }

    clone(): ReflectionClass<any> {
        const reflection = new ReflectionClass(copyAndSetParent(this.type), this.parent);
        reflection.name = this.name;
        reflection.data = { ...this.data };
        reflection.description = this.description;

        return reflection;
    }

    toString(): string {
        return stringifyResolvedType(this.type);
    }

    getPropertiesDeclaredInConstructor(): ReflectionProperty[] {
        const constructor = this.getMethod('constructor');
        if (!constructor) return [];
        const propertyNames = constructor.parameters.filter(v => v.getVisibility() !== undefined).map(v => v.getName());
        return this.properties.filter(v => propertyNames.includes(memberNameToString(v.getName())));
    }

    clearJitContainer() {
        clearTypeJitContainer(this.type);
    }

    getJitContainer() {
        return getTypeJitContainer(this.type);
    }

    getClassType(): ClassType {
        return this.type.kind === ReflectionKind.class ? this.type.classType : Object;
    }

    getClassName(): string {
        return this.type.kind === ReflectionKind.class ? this.type.typeName || getClassName(this.getClassType()) : this.type.typeName || 'Object';
    }

    createDefaultObject(): object {
        try {
            return new (this.getClassType());
        } catch {
            return {};
        }
    }

    getName(): string {
        return this.name || this.getClassName();
    }

    getDescription(): string {
        return this.description;
    }

    hasProperty(name: string | symbol | number): boolean {
        return this.propertyNames.includes(memberNameToString(name));
    }

    hasMethod(name: string | symbol | number): boolean {
        return this.methodNames.includes(memberNameToString(name));
    }

    getIdentifier(): ReflectionProperty {
        if (!this.identifiers.length) {
            throw new Error(`Class ${this.getClassName()} has no identifier.`);
        }
        return this.identifiers[0];
    }

    public isSchemaOf(classType: ClassType): boolean {
        return isPrototypeOfBase(this.getClassType(), classType);
    }

    hasIdentifier(): boolean {
        return this.identifiers.length > 0;
    }

    getIdentifiers(): ReflectionProperty[] {
        return this.identifiers;
    }

    /**
     * Returns the ReflectionClass object from parent/super class, if available.
     */
    getSuperReflectionClass(): ReflectionClass<any> | undefined {
        return this.parent;
    }

    removeProperty(name: string | number | symbol) {
        const property = this.properties.find(v => v.getName() === name);
        if (!property) throw new Error(`Property ${String(name)} not known in ${this.getClassName()}`);

        const stringName = memberNameToString(name);
        arrayRemoveItem(this.propertyNames, stringName);

        const indexType = this.type.types.findIndex(v => (v.kind === ReflectionKind.property || v.kind === ReflectionKind.propertySignature) && v.name === name);
        if (indexType !== -1) this.type.types.splice(indexType, 1);

        arrayRemoveItem(this.properties, property);

        if (property.isReference() || property.isBackReference()) {
            arrayRemoveItem(this.references, property);
        }

        if (property.isIdentifier()) arrayRemoveItem(this.identifiers, property);
    }

    registerProperty(property: ReflectionProperty) {
        if (this.propertyNames.includes(property.name)) {
            this.removeProperty(property.getName());
        }

        if (!hasMember(this.type, property.getName())) {
            this.type.types.push(property.property as any);
        }

        property.property.parent = this.type;
        this.properties.push(property);
        this.propertyNames.push(property.name);
        if (property.isReference() || property.isBackReference()) {
            this.references.push(property);
        }

        if (property.isIdentifier()) this.identifiers.push(property);

        this.getJitContainer();
    }

    addProperty(prop: {
        name: number | string | symbol;
        optional?: true;
        readonly?: true;
        description?: string;
        visibility?: ReflectionVisibility
        type: Type;
    }): ReflectionProperty {
        const type = {
            kind: this.type.kind === ReflectionKind.class ? ReflectionKind.property : ReflectionKind.propertySignature,
            parent: this.type,
            ...prop,
        } as TypeProperty | TypePropertySignature;
        if (type.kind === ReflectionKind.property) {
            type.visibility = prop.visibility ?? ReflectionVisibility.public;
        }

        const property = new ReflectionProperty(type, this);
        this.registerProperty(property);

        return property;
    }

    registerMethod(method: ReflectionMethod) {
        if (this.methodNames.includes(method.name)) return;

        this.methods.push(method);
        this.methodNames.push(method.name);
    }

    add(member: Type) {
        if (member.kind === ReflectionKind.property || member.kind === ReflectionKind.propertySignature) {
            const existing = this.getPropertyOrUndefined(member.name);
            if (existing) {
                existing.setType(member.type);
            } else {
                this.registerProperty(new ReflectionProperty(member, this));
            }
        }

        if (member.kind === ReflectionKind.method || member.kind === ReflectionKind.methodSignature) {
            const existing = this.getMethodOrUndefined(member.name);
            if (existing) {
                existing.setType(member);
            } else {
                this.registerMethod(new ReflectionMethod(member, this));
            }
        }
    }

    applyDecorator(data: EntityData) {
        Object.assign(this.data, data.data);
        if (data.name !== undefined) this.name = data.name;
        this.disableConstructor = data.disableConstructor;
    }

    static from<T>(classTypeIn?: ReceiveType<T> | AbstractClassType<T> | TypeClass | TypeObjectLiteral | ReflectionClass<any>, args: any[] = []): ReflectionClass<T> {
        if (!classTypeIn) throw new Error(`No type given in ReflectionClass.from<T>`);
        if (isArray(classTypeIn)) classTypeIn = resolveReceiveType(classTypeIn);

        if (classTypeIn instanceof ReflectionClass) return classTypeIn;
        if (isType(classTypeIn)) {
            if (classTypeIn.kind === ReflectionKind.objectLiteral || (classTypeIn.kind === ReflectionKind.class && classTypeIn.typeArguments)) {
                const jit = getTypeJitContainer(classTypeIn);
                if (jit.reflectionClass) return jit.reflectionClass;
                return jit.reflectionClass = new ReflectionClass<T>(classTypeIn);
            }
            if (classTypeIn.kind !== ReflectionKind.class) throw new Error(`TypeClass or TypeObjectLiteral expected, not ${ReflectionKind[classTypeIn.kind]}`);
        }

        const classType = isType(classTypeIn) ? (classTypeIn as TypeClass).classType : (classTypeIn as any)['prototype'] ? classTypeIn as ClassType<T> : classTypeIn.constructor as ClassType<T>;

        if (!classType.prototype.hasOwnProperty(reflectionClassSymbol)) {
            Object.defineProperty(classType.prototype, reflectionClassSymbol, { writable: true, enumerable: false });
        }

        if (classType.prototype[reflectionClassSymbol] && args.length === 0) {
            return classType.prototype[reflectionClassSymbol];
        }

        const type = isType(classTypeIn) ? classTypeIn as TypeClass : ('__type' in classType ?
            args.length ? resolveRuntimeType(classType, args) : resolveRuntimeType(classType)
            : {
                kind: ReflectionKind.class,
                classType,
                types: [],
            } as TypeClass);

        if (type.kind !== ReflectionKind.class) {
            throw new Error(`Given class is not a class but kind ${ReflectionKind[type.kind]}. classType: ${stringifyValueWithType(classType)}`);
        }

        const parentProto = Object.getPrototypeOf(classType.prototype);
        const parentReflectionClass: ReflectionClass<T> | undefined = parentProto && parentProto.constructor !== Object ? ReflectionClass.from(parentProto, type.extendsArguments) : undefined;

        const reflectionClass = new ReflectionClass(type, parentReflectionClass);
        if (args.length === 0) {
            classType.prototype[reflectionClassSymbol] = reflectionClass;
            return reflectionClass;
        } else {
            return reflectionClass;
        }
    }

    getIndexSignatures() {
        throw new Error('todo');
    }

    getPropertyNames(): (string | number | symbol)[] {
        return this.propertyNames;
    }

    getProperties(): ReflectionProperty[] {
        return this.properties;
    }

    getPropertiesInGroup(...group: string[]): ReflectionProperty[] {
        return this.properties.filter(v => v.isInGroup(...group));
    }

    getMethodNames(): (string | number | symbol)[] {
        return this.methodNames;
    }

    getMethods(): ReflectionMethod[] {
        return this.methods;
    }

    /**
     * Returns references and back references.
     */
    getReferences(): ReflectionProperty[] {
        return this.references;
    }

    getConstructorOrUndefined(): ReflectionMethod | undefined {
        return this.getMethodOrUndefined('constructor');
    }

    getPropertyOrUndefined(name: string | number | symbol | TypeTemplateLiteral): ReflectionProperty | undefined {
        for (const property of this.getProperties()) {
            if (property.getName() === name) return property;
        }
        return;
    }

    getProperty(name: string | number | symbol): ReflectionProperty {
        const property = this.getPropertyOrUndefined(name);
        if (!property) throw new Error(`No property ${memberNameToString(name)} found in ${this.getClassName()}`);
        return property;
    }

    getMethodParameters(name: string | number | symbol): ReflectionParameter[] {
        const method = this.getMethodOrUndefined(name);
        return method ? method.getParameters() : [];
    }

    getMethodOrUndefined(name: string | number | symbol | TypeTemplateLiteral): ReflectionMethod | undefined {
        for (const method of this.getMethods()) {
            if (method.getName() === name) return method;
        }
        return;
    }

    getMethod(name: string | number | symbol): ReflectionMethod {
        const method = this.getMethodOrUndefined(name);
        if (!method) throw new Error(`No method ${memberNameToString(name)} found in ${this.getClassName()}`);
        return method;
    }

    public hasCircularReference(): boolean {
        return hasCircularReference(this.type);
    }

    serializeType(): SerializedTypes {
        return serializeType(this.type);
    }

    /**
     * All references have a counter-part. This methods finds it and errors if not possible.
     *
     * If the given reference is a owning reference it finds the correct backReference,
     *    which can be found by checking all reference options.mappedBy.
     *
     * If the given reference is a back reference it finds the owning reference,
     *    which can be found by using its options.mappedBy.
     *
     * Alternatively we simply check for resolvedClassType to be given `classType`, and if only one
     * found, we return it. When more than one found, we throw an error saying the user he
     * should make its relation mapping not ambiguous.
     */
    public findReverseReference(toClassType: ClassType, fromReference: ReflectionProperty): ReflectionProperty {
        if (fromReference.isBackReference() && fromReference.getBackReference().mappedBy) {
            if (resolveForeignReflectionClass(fromReference).getClassType() === this.getClassType()) {
                return this.getProperty(fromReference.getBackReference().mappedBy as string);
            }
        }

        const candidates: ReflectionProperty[] = [];
        for (const backRef of this.references) {
            if (backRef === fromReference) continue;

            //backRef points to something completely different
            if (!backRef.isArray() && resolveForeignReflectionClass(backRef).getClassType() !== toClassType) continue;
            if (backRef.isArray() && getClassType(backRef.getSubType()) !== toClassType) continue;

            //we found the perfect match, manually annotated
            if (backRef.isBackReference() && backRef.getBackReference().mappedBy) {
                if (backRef.getBackReference().mappedBy === fromReference.name) {
                    return backRef;
                }
                continue;
            }

            if (fromReference.isBackReference() && fromReference.getBackReference().mappedBy && !fromReference.getBackReference().via) {
                if (fromReference.getBackReference().mappedBy === backRef.name) {
                    //perfect match
                    return backRef;
                }
                continue;
            }

            //add to candidates if possible
            if (fromReference.isBackReference() && fromReference.getBackReference().via && backRef.isBackReference() && backRef.getBackReference().via) {
                if (fromReference.getBackReference().via === backRef.getBackReference().via) {
                    candidates.push(backRef);
                }
                continue;
            }

            if (fromReference.isBackReference() && fromReference.isArray() && !fromReference.getBackReference().via) {
                //other side must be non-array
                if (backRef.isArray()) continue;
            }

            candidates.push(backRef);
        }

        if (candidates.length > 1) {
            throw new Error(`Class ${this.getClassName()} has multiple potential reverse references [${candidates.map(v => v.name).join(', ')}] for ${fromReference.name} to class ${getClassName(toClassType)}. ` +
                `Please specify each back reference by using 'mappedBy', e.g. @t.backReference({mappedBy: 'fieldNameOnTheOtherSide'} so its not ambiguous anymore.`);
        }

        if (candidates.length === 1) return candidates[0];

        throw new Error(`Class ${this.getClassName()} has no reference to class ${getClassName(toClassType)} defined.`);
    }

    public extractIdentifier(item: object): Partial<T> {
        const identifier: Partial<T> = {};
        for (const id of this.getIdentifiers()) {
            (identifier as any)[id.name] = (item as any)[id.name];
        }

        return identifier;
    }
}


// old function to decorate an interface
// export function decorate<T>(decorate: { [P in keyof T]?: FreeDecoratorFn<any> }, p?: ReceiveType<T>): ReflectionClass<T> {
//     const type = typeOf([], p);
//     if (type.kind === ReflectionKind.objectLiteral) {
//         const classType = class {
//         };
//         const reflection = new ReflectionClass({ kind: ReflectionKind.class, classType, types: type.types });
//         (classType as any).prototype[reflectionClassSymbol] = reflection;
//
//         for (const [p, fn] of Object.entries(decorate)) {
//             (fn as FreeDecoratorFn<any>)(classType, p);
//         }
//
//         return reflection;
//     }
//     throw new Error('Decorate is only possible on object literal/interfaces.');
// }
