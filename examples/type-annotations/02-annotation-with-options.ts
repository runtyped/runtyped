/*
 * Example: a type annotation that carries options.
 *
 * The second type argument of `TypeAnnotation<Name, Options>` can be any
 * type, typically an object literal type. At run-time it is available as a
 * `Type`, and `typeToObject()` turns literal types into plain JS values.
 * Annotated type aliases can be reused like any other type.
 *
 * Scenario: a `Sequence<{ start, step }>` annotation, used by a tiny
 * in-memory store to assign values from per-property counters on insert.
 *
 * Run with: node dist/examples/type-annotations/02-annotation-with-options.js
 */

import assert from 'node:assert/strict';
import {
    Identifier,
    ReceiveType,
    ReflectionClass,
    ReflectionProperty,
    TypeAnnotation,
    typeAnnotation,
    typeToObject,
} from '../../index.js';

// ---------------------------------------------------------------------------
// 1. Declare the annotation and a reader for its options.
// ---------------------------------------------------------------------------

export interface SequenceOptions {
    start?: number;
    step?: number;
}

/** A numeric property assigned from its own sequence on insert. */
export type Sequence<Options extends SequenceOptions = {}> = TypeAnnotation<'sequence', Options>;

/** Returns the resolved sequence options, or undefined if not a sequence. */
export function getSequence(property: ReflectionProperty): Required<SequenceOptions> | undefined {
    const annotation = typeAnnotation.getAnnotations(property.getType()).find(v => v.name === 'sequence');
    if (!annotation) return undefined;
    const options: SequenceOptions = typeToObject(annotation.options) ?? {};
    return { start: options.start ?? 1, step: options.step ?? 1 };
}

// ---------------------------------------------------------------------------
// 2. A store that supports any number of sequences per type.
// ---------------------------------------------------------------------------

export function createStore<T extends object>(type?: ReceiveType<T>) {
    const reflection = ReflectionClass.from<T>(type);
    const identifier = reflection.getIdentifier().getNameAsString();

    // One counter per sequence property, holding the next value to assign.
    const sequences = new Map<string, { next: number; step: number }>();
    for (const property of reflection.getProperties()) {
        const sequence = getSequence(property);
        if (sequence) sequences.set(property.getNameAsString(), { next: sequence.start, step: sequence.step });
    }

    const rows = new Map<unknown, T>();
    return {
        insert(item: T): T {
            const row: any = { ...item };
            for (const [name, sequence] of sequences) {
                row[name] = sequence.next;
                sequence.next += sequence.step;
            }
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

// Annotated aliases can be reused like any other type.
type InvoiceNumber = number & Sequence<{ start: 1000, step: 10 }>;

interface Invoice {
    id: number & Identifier & Sequence;
    number: InvoiceNumber;
    customer: string;
}

const invoices = createStore<Invoice>();
assert.deepEqual(invoices.insert({ id: 0, number: 0, customer: 'ACME' }), { id: 1, number: 1000, customer: 'ACME' });
assert.deepEqual(invoices.insert({ id: 0, number: 0, customer: 'Initech' }), { id: 2, number: 1010, customer: 'Initech' });
assert.equal(invoices.get(2)?.customer, 'Initech');

console.log('02-annotation-with-options: ok');
