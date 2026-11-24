/*
 * Example: declaring and reading a simple type annotation.
 *
 * A type annotation is declared in user land with `TypeAnnotation<Name>`,
 * attached to types via intersections, and read back at run-time from the
 * generic `typeAnnotation` store. No registration is needed. It also shows
 * that annotations do not affect serialization, and how `ResetAnnotation<>`
 * removes an annotation from a derived type.
 *
 * Scenario: an `AutoIncrement` annotation, used by a tiny in-memory store to
 * assign ids on insert.
 *
 * Run with: node dist/examples/type-annotations/01-simple-annotation.js
 */

import assert from 'node:assert/strict';
import {
    cast,
    Identifier,
    ReceiveType,
    ReflectionClass,
    ReflectionProperty,
    ResetAnnotation,
    TypeAnnotation,
    typeAnnotation,
} from '../../index.js';

// ---------------------------------------------------------------------------
// 1. Declare the annotation.
// ---------------------------------------------------------------------------

/**
 * Marks a numeric property whose value is assigned by the store on insert.
 * At compile-time this is `unknown`, so `number & AutoIncrement` is still
 * just `number`. At run-time the annotation is attached to the property type.
 */
export type AutoIncrement = TypeAnnotation<'autoIncrement'>;

/**
 * Annotations declared via `TypeAnnotation<>` that the library does not know
 * about end up in `typeAnnotation`, as `{ name, options }` entries.
 */
export function isAutoIncrement(property: ReflectionProperty): boolean {
    return typeAnnotation.getAnnotations(property.getType()).some(v => v.name === 'autoIncrement');
}

// ---------------------------------------------------------------------------
// 2. Use it in a (very) small framework: an in-memory store.
// ---------------------------------------------------------------------------

export interface Store<T> {
    insert(item: T): T;
    get(id: unknown): T | undefined;
}

/**
 * The type is passed implicitly: `createStore<User>()` makes the compiler
 * provide `User`'s runtime type through the `ReceiveType<T>` parameter.
 */
export function createStore<T extends object>(type?: ReceiveType<T>): Store<T> {
    const reflection = ReflectionClass.from<T>(type);
    const identifier = reflection.getIdentifier().getNameAsString();
    const autoIncrement = reflection.getProperties().find(isAutoIncrement)?.getNameAsString();

    const rows = new Map<unknown, T>();
    let counter = 0;

    return {
        insert(item: T): T {
            const row: any = { ...item };
            if (autoIncrement) row[autoIncrement] = ++counter;
            rows.set(row[identifier], row);
            return row;
        },
        get(id: unknown): T | undefined {
            return rows.get(id);
        },
    };
}

// ---------------------------------------------------------------------------
// 3. Application code.
// ---------------------------------------------------------------------------

interface User {
    id: number & Identifier & AutoIncrement;
    name: string;
}

const users = createStore<User>();
const alice = users.insert({ id: 0, name: 'Alice' });
const bob = users.insert({ id: 0, name: 'Bob' });

assert.equal(alice.id, 1);
assert.equal(bob.id, 2);
assert.deepEqual(users.get(2), { id: 2, name: 'Bob' });

// The annotation does not change how the type is validated or serialized:
// `id` is still a plain number.
assert.deepEqual(cast<User>({ id: '3', name: 'Carol' }), { id: 3, name: 'Carol' });

// `ResetAnnotation<>` removes the annotation from a derived type, e.g. for
// records imported with their ids already assigned. It only removes the named
// annotation: `Identifier` stays.
interface ImportedUser {
    id: User['id'] & ResetAnnotation<'autoIncrement'>;
    name: string;
}

const imported = createStore<ImportedUser>();
assert.deepEqual(imported.insert({ id: 42, name: 'Dave' }), { id: 42, name: 'Dave' });
assert.equal(ReflectionClass.from<ImportedUser>().getIdentifier().getNameAsString(), 'id');

console.log('01-simple-annotation: ok');
