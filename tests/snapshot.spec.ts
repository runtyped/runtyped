import { test } from 'node:test';
import { expect } from './expect/index.js';
import { getConverterForSnapshot, getIdentifierExtractor, getIdentifierHashGenerator } from '../src/snapshot.js';
import { Identifier, Reference } from '../src/reflection/type.js';
import { ReflectionClass } from '../src/reflection/reflection.js';

class Image {
    title: string = '';

    constructor(public id: number & Identifier = 0) {
    }
}

class User {
    image?: Image & Reference;

    title: string = '';

    constructor(public id: number & Identifier = 0) {

    }
}

test('benchmark', () => {
});

test('getJITConverterForSnapshot', () => {
    const converter = getConverterForSnapshot(ReflectionClass.from(User));

    {
        const converted = converter({ id: 22, title: 'Peter' });
        expect(converted).toBeInstanceOf(Object);
        expect(converted).toEqual({ id: 22, title: 'Peter', image: null });
    }

    {
        const converted = converter({ id: 22, title: 'Peter', image: new Image(3) });
        expect(converted).toBeInstanceOf(Object);
        expect(converted).toEqual({ id: 22, title: 'Peter', image: { id: 3 } });
    }
});


test('getIdentifierExtractor', () => {
    const converter = getIdentifierExtractor(ReflectionClass.from(User));

    {
        const converted = converter({ id: 22, title: 'Peter' });
        expect(converted).toBeInstanceOf(Object);
        expect(converted).toEqual({ id: 22 });
    }

    {
        const converted = converter({ id: 22, title: 'Peter', image: new Image(3) });
        expect(converted).toBeInstanceOf(Object);
        expect(converted).toEqual({ id: 22 });
    }
});

test('getIdentifierHashGenerator', () => {
    const schema = ReflectionClass.from(User);
    expect(schema.getIdentifiers().length).toBe(1);
    const converter = getIdentifierHashGenerator(schema);

    {
        const converted = converter({ id: 22, title: 'Peter' });
        expect(converted).toBe('\u000022');
    }

    {
        const converted = converter({ id: 22, title: 'Peter', image: new Image(3) });
        expect(converted).toBe('\u000022');
    }
});

test('bigint and binary', () => {
    class Node {
        created: Date = new Date;

        stake: bigint = 0n;

        constructor(
            public publicKey: Uint8Array & Identifier,
            public address: Uint8Array,
        ) {
        }
    }

    const schema = ReflectionClass.from(Node);
    expect(schema.getIdentifiers().length).toBe(1);

    const snapshot = getConverterForSnapshot(schema);
    const converter = getIdentifierHashGenerator(schema);
    const pkExtract = getIdentifierExtractor(schema);

    {
        const converted = converter({ publicKey: new Uint8Array([0, 1, 2, 3]) });
        expect(converted).toBe('\u0000AAECAw==');
    }

    {
        const converted = snapshot({ publicKey: new Uint8Array([0, 1, 2, 3]), stake: 12n });
        expect(converted).toEqual({ address: null, created: null, publicKey: 'AAECAw==', stake: 12n });

        // const back = snapshotSerializer.for(schema).deserialize(converted);
        // expect(back.stake).toBe(12n);
        // expect(back.publicKey).toBeInstanceOf(Uint8Array);
        // expect(Array.from(back.publicKey as any)).toEqual([0, 1, 2, 3]);

        const pk = pkExtract(converted);
        expect(pk.publicKey).toBeInstanceOf(Uint8Array);
        expect(Array.from(pk.publicKey as any)).toEqual([0, 1, 2, 3]);
    }

    {
        const converted = snapshot({ address: null });
        expect(converted).toEqual({ address: null, created: null, publicKey: null, stake: null });
        // const back = snapshotSerializer.for(schema).deserialize(converted);
    }
});

test('bigint primary key', () => {
    class Node {
        constructor(
            public stake: bigint & Identifier,
        ) {
        }
    }

    const schema = ReflectionClass.from(Node);
    expect(schema.getIdentifiers().length).toBe(1);

    const snapshot = getConverterForSnapshot(schema);
    const converter = getIdentifierHashGenerator(schema);
    const pkExtract = getIdentifierExtractor(schema);

    {
        const converted = converter({ stake: 12n });
        expect(converted).toBe('\u000012');
    }

    {
        const converted = snapshot({ stake: 12n });
        expect(converted).toEqual({ stake: 12n });

        // const back = snapshotSerializer.for(schema).deserialize(converted);
        // expect(back.stake).toBe(12n);

        const pk = pkExtract(converted);
        expect(pk.stake).toBe(12n);
    }
});
