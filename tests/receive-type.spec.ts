import { test } from 'node:test';
import { expect } from './expect/index.js';
import { ReceiveType, resolveReceiveType, typeOf } from '../src/reflection/reflection.js';
import { ReflectionKind, Type } from '../src/reflection/type.js';
import { validate, validates } from '../src/validator.js';
import { is } from '../src/typeguard.js';

test('typeOf', () => {
    const type = typeOf<string>();
    expect(type).toEqual({ kind: ReflectionKind.string });
});

test('custom function', () => {
    function inferTypes<A, B>(a?: ReceiveType<A>, b?: ReceiveType<B>) {
        return [resolveReceiveType(a), resolveReceiveType(b)];
    }

    const types = inferTypes<string, number>();

    expect(types).toEqual([{ kind: ReflectionKind.string }, { kind: ReflectionKind.number }]);
});

test('method call', () => {
    class Database {
        query<T>(type?: ReceiveType<T>) {
            return resolveReceiveType(type);
        }
    }

    const db = new Database();

    const type = db.query<string>();
    expect(type).toEqual({ kind: ReflectionKind.string });
});

test('maintain name', () => {
    interface User {}

    function c<T>(type?: ReceiveType<T>) {
        return resolveReceiveType(type);
    }

    const t = c<User>();
    expect(t.typeName).toBe('User');
});

test('decorator call', () => {
    let got: Type | undefined;

    class HttpDecorator {
        something(): HttpDecorator {
            return this;
        }

        response<T>(name: string, description: string = '', type?: ReceiveType<T>): any {
            got = resolveReceiveType(type);
        }
    }

    const http = new HttpDecorator;

    interface User {
    }

    class Controller {
        @(http.something().response<User>('abc'))
        action() {
        }
    }

    expect(got).toMatchObject({ kind: ReflectionKind.objectLiteral, typeName: 'User' });
});

test('class constructor', () => {
    class A<T> {
        public type: Type;

        constructor(type?: ReceiveType<T>) {
            this.type = resolveReceiveType(type);
        }
    }

    const aString = new A<string>();
    expect(aString.type).toMatchObject({ kind: ReflectionKind.string });
});

test('class constructor multiple', () => {
    class A<T, A> {
        public type1: Type;
        public type2: Type;

        constructor(type1?: ReceiveType<T>, type2?: ReceiveType<A>) {
            this.type1 = resolveReceiveType(type1);
            this.type2 = resolveReceiveType(type2);
        }
    }

    const aString = new A<string, number>();
    expect(aString.type1).toMatchObject({ kind: ReflectionKind.string });
    expect(aString.type2).toMatchObject({ kind: ReflectionKind.number });
});

test('function with ReceiveType return expression', () => {
    const typeValidation = <T>(type?: ReceiveType<T>) => (value: any) => {
        type = resolveReceiveType(type);
        return validates(value, type);
    }

    const validateString = typeValidation<string>();
    expect(validateString('hello')).toBe(true);
    expect(validateString(2)).toBe(false);
});

test('ReceiveType forward to type passing', () => {
    function typeOf2<T>(type?: ReceiveType<T>) {
        return resolveReceiveType(type);
    }

    function mySerialize<T>(type?: ReceiveType<T>) {
        return typeOf2<T>();
    }

    function mySerialize2<T>(type?: ReceiveType<T>) {
        return typeOf2<T[]>();
    }

    const type = mySerialize<string>();
    expect(type).toMatchObject({ kind: ReflectionKind.string });

    const type2 = mySerialize2<string>();
    expect(type2).toMatchObject({ kind: ReflectionKind.array, type: { kind: ReflectionKind.string } });
});

test('resolveReceiveType caches type references on the received array', () => {
    interface CachedUser {
        id: number;
    }

    function receive<T>(type?: ReceiveType<T>) {
        return type;
    }

    // Recent compilers hoist this array into a module-level variable, so the
    // cache turns every later call into a single property lookup.
    const packed = receive<CachedUser>() as any;
    expect(packed.__type).toBe(undefined);
    const type = resolveReceiveType(packed);
    expect(type).toBe(typeOf<CachedUser>());
    expect(packed.__type).toBe(type);
    expect(resolveReceiveType(packed)).toBe(type);
});

// is() and validate() cache what they build on the received type argument.
// None of that may leak between different types passed explicitly or
// forwarded through ReceiveType<T>.
interface ExplicitA {
    a: string;
}

interface ExplicitB {
    b: number;
}

class ExplicitClass {
    c: boolean = false;
}

const explicitA = { a: 'x' };
const explicitB = { b: 1 };

function forwardExplicitly<T>(data: unknown, type?: ReceiveType<T>) {
    return { is: is(data, type), errors: validate(data, type).length, type: resolveReceiveType(type) };
}

function forwardImplicitly<T>(data: unknown, type?: ReceiveType<T>) {
    return { is: is<T>(data), errors: validate<T>(data).length, type: resolveReceiveType(type) };
}

test('explicit Type objects are honoured on every call', () => {
    const types = [typeOf<ExplicitA>(), typeOf<ExplicitB>()];
    for (let i = 0; i < 3; i++) {
        for (const type of types) {
            const expected = type === types[0];
            expect(is(explicitA, type)).toBe(expected);
            expect(validate(explicitA, type).length === 0).toBe(expected);
            expect(resolveReceiveType(type)).toBe(type);
        }
    }
});

test('explicit classes are honoured on every call', () => {
    for (let i = 0; i < 3; i++) {
        expect(is({ c: true }, ExplicitClass)).toBe(true);
        expect(is({ c: 'no' }, ExplicitClass)).toBe(false);
        expect(validate({ c: 'no' }, ExplicitClass).length).toBe(1);
        expect(resolveReceiveType(ExplicitClass).kind).toBe(ReflectionKind.class);
    }
});

test('ReceiveType<T> forwarded explicitly keeps each type apart', () => {
    for (let i = 0; i < 3; i++) {
        const a = forwardExplicitly<ExplicitA>(explicitA);
        const b = forwardExplicitly<ExplicitB>(explicitA);
        expect(a.is).toBe(true);
        expect(a.errors).toBe(0);
        expect(a.type).toBe(typeOf<ExplicitA>());
        expect(b.is).toBe(false);
        expect(b.errors).toBe(1);
        expect(b.type).toBe(typeOf<ExplicitB>());
        expect(forwardExplicitly<ExplicitB>(explicitB).is).toBe(true);
    }
});

test('ReceiveType<T> forwarded implicitly keeps each type apart', () => {
    for (let i = 0; i < 3; i++) {
        const a = forwardImplicitly<ExplicitA>(explicitA);
        const b = forwardImplicitly<ExplicitB>(explicitA);
        expect(a.is).toBe(true);
        expect(a.errors).toBe(0);
        expect(a.type).toBe(typeOf<ExplicitA>());
        expect(b.is).toBe(false);
        expect(b.errors).toBe(1);
        expect(b.type).toBe(typeOf<ExplicitB>());
        expect(forwardImplicitly<ExplicitB>(explicitB).is).toBe(true);
    }
});

test('a received type argument reused across is(), validate() and resolveReceiveType()', () => {
    function receive<T>(type?: ReceiveType<T>) {
        return type;
    }
    const packed = receive<ExplicitA>();
    for (let i = 0; i < 3; i++) {
        expect(is(explicitA, packed)).toBe(true);
        expect(is(explicitB, packed)).toBe(false);
        expect(validate(explicitB, packed).length).toBe(1);
        expect(validate(explicitA, packed).length).toBe(0);
        expect(resolveReceiveType(packed)).toBe(typeOf<ExplicitA>());
    }
});
