/*
 * Example: a type annotation with its own `AnnotationDefinition`.
 *
 * Instead of searching the generic `typeAnnotation` entries by name, a
 * framework can give its annotation its own storage. This is how the
 * library's built-in annotations (`Identifier`, `Reference`, …) work:
 *
 * - lookups go straight to the annotation's own symbol;
 * - the stored data is typed, and can be pre-processed once, when the type
 *   is first reflected, rather than on every read;
 * - the framework decides how `ResetAnnotation<>` affects it.
 *
 * A type decorator registered with `registerTypeDecorator()` maps the
 * `TypeAnnotation<'autoIncrement'>` declaration to the dedicated annotation.
 * Registered decorators run before the built-in one.
 *
 * Scenario: an `AutoIncrement<{ start }>` annotation, used by a tiny
 * in-memory store to assign ids on insert.
 *
 * Run with: node dist/examples/type-annotations/03-annotation-definition.js
 */

import assert from 'node:assert/strict';
import {
    AnnotationDefinition,
    getAnnotationMeta,
    Identifier,
    ReceiveType,
    ReflectionClass,
    registerTypeDecorator,
    ResetAnnotation,
    Type,
    TypeAnnotation,
    typeAnnotation,
    typeOf,
    typeToObject,
} from '../../index.js';

// ---------------------------------------------------------------------------
// 1. Declare the annotation, its storage and its type decorator.
// ---------------------------------------------------------------------------

export interface AutoIncrementOptions {
    /** Value assigned to the first inserted item. */
    start?: number;
}

export type AutoIncrement<Options extends AutoIncrementOptions = {}> = TypeAnnotation<'autoIncrement', Options>;

/** Stores the resolved options of each `AutoIncrement` annotation. */
export const autoIncrementAnnotation = new AnnotationDefinition<Required<AutoIncrementOptions>>('autoIncrement');

// Registration must happen before any type using the annotation is first
// reflected. Types are reflected lazily, so doing it when this module is
// loaded is enough.
registerTypeDecorator((annotations, decorator) => {
    const meta = getAnnotationMeta(decorator);
    if (!meta) return false;

    if (meta.id === 'autoIncrement') {
        const options: AutoIncrementOptions = typeToObject(meta.options) ?? {};
        // `replace` rather than `register`: a property has at most one.
        autoIncrementAnnotation.replace(annotations, [{ start: options.start ?? 1 }]);
        return true;
    }

    // Annotations stored outside `typeAnnotation` handle their own reset.
    if (meta.id === 'reset' && typeToObject(meta.options) === 'autoIncrement') {
        autoIncrementAnnotation.reset(annotations);
        return true;
    }

    return false;
});

export function getAutoIncrement(type: Type): Required<AutoIncrementOptions> | undefined {
    return autoIncrementAnnotation.getFirst(type);
}

// ---------------------------------------------------------------------------
// 2. Use it in a store.
// ---------------------------------------------------------------------------

export function createStore<T extends object>(type?: ReceiveType<T>) {
    const reflection = ReflectionClass.from<T>(type);
    const identifier = reflection.getIdentifier().getNameAsString();

    let autoIncrement: { name: string; next: number } | undefined;
    for (const property of reflection.getProperties()) {
        const options = getAutoIncrement(property.getType());
        if (options) autoIncrement = { name: property.getNameAsString(), next: options.start };
    }

    const rows = new Map<unknown, T>();
    return {
        insert(item: T): T {
            const row: any = { ...item };
            if (autoIncrement) row[autoIncrement.name] = autoIncrement.next++;
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

interface Order {
    id: number & Identifier & AutoIncrement<{ start: 500 }>;
    total: number;
}

const orders = createStore<Order>();
assert.deepEqual(orders.insert({ id: 0, total: 10 }), { id: 500, total: 10 });
assert.deepEqual(orders.insert({ id: 0, total: 20 }), { id: 501, total: 20 });

// The annotation lives in its own storage, not among the generic entries.
const idType = ReflectionClass.from<Order>().getProperty('id').getType();
assert.deepEqual(getAutoIncrement(idType), { start: 500 });
assert.deepEqual(typeAnnotation.getAnnotations(idType), []);

// Reset is handled by the decorator above.
interface ArchivedOrder {
    id: Order['id'] & ResetAnnotation<'autoIncrement'>;
    total: number;
}

const archived = createStore<ArchivedOrder>();
assert.deepEqual(archived.insert({ id: 7, total: 30 }), { id: 7, total: 30 });

// The same applies to standalone types.
assert.deepEqual(getAutoIncrement(typeOf<number & AutoIncrement>()), { start: 1 });

console.log('03-annotation-definition: ok');
