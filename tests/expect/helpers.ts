
import { expect } from 'chai';

export const toMatch = (actual: any, expected: any): void => {
    if (typeof expected === 'object' && expected !== null) {
        toMatchObject(actual, expected);
    } else {
        expect(actual).to.equal(expected);
    }
};

export const toMatchMap = (actual: any, expected: Map<any, any>): void => {
    expect(actual).to.be.a('map');
    toMatchArray(Array.from(actual as Map<any, any>), Array.from(expected));
};

export const toMatchSet = (actual: any, expected: Set<any>): void => {
    expect(actual).to.be.a('set');
    toMatchArray(Array.from(actual as Set<any>), Array.from(expected));
};

export const toMatchArray = (actual: any, expected: any[]): void => {
    expect(actual).to.be.an('array').and.to.have.length(expected.length);
    (actual as any[]).forEach((el, idx) => {
        toMatch(el, expected[idx]);
    });
};

export const toMatchObject = <O extends {}>(actual: any, expected: O): void => {
    if (Array.isArray(expected)) {
        toMatchArray(actual, expected);
    } else if (expected instanceof Set) {
        toMatchSet(actual, expected);
    } else if (expected instanceof Map) {
        toMatchMap(actual, expected);
    } else if (expected instanceof ArrayBuffer) {
        toMatchArrayBufferLike<ArrayBuffer>(actual, expected, ArrayBuffer);
    } else if (expected instanceof Uint8Array) {
        toMatchArrayBufferLike<Uint8Array>(actual, expected, Uint8Array);
    } else if (expected instanceof Uint16Array) {
        toMatchArrayBufferLike<Uint16Array>(actual, expected, Uint16Array);
    } else if (expected instanceof Uint32Array) {
        toMatchArrayBufferLike<Uint32Array>(actual, expected, Uint32Array);
    } else if (expected instanceof Int8Array) {
        toMatchArrayBufferLike<Int8Array>(actual, expected, Int8Array);
    } else if (expected instanceof Int16Array) {
        toMatchArrayBufferLike<Int16Array>(actual, expected, Int16Array);
    } else if (expected instanceof Int32Array) {
        toMatchArrayBufferLike<Int32Array>(actual, expected, Int32Array);
    } else if (expected instanceof Date) {
        expect(actual).to.be.instanceof(Date);
        expect((actual as Date).valueOf()).to.equal(expected.valueOf());
    } else if (expected instanceof RegExp) {
        expect(actual).to.be.instanceof(RegExp);
        expect((actual as RegExp).toString()).to.equal(expected.toString());
    } else {
        expect(actual).to.be.an('object').and.not.be.null;
        for (const [key, value] of Object.entries(expected)) {
            toMatch(actual[key], value);
        }
    }
};

export type BufferLike = ArrayBuffer | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;

export const toMatchArrayBufferLike = <T extends BufferLike>(actual: any, expected: T, clss: new (...args: any[]) => T): void => {
    expect(actual).to.be.an.instanceof(clss);
    expect(actual.byteLength).to.equal(expected.byteLength);
    const actualView = Array.from(new Uint8Array(actual));
    const expectedView = Array.from(new Uint8Array(expected));
    expect(actualView).to.deep.equal(expectedView);
};
