import { expect } from "chai";
import { toMatch, toMatchObject } from "./helpers";


export class Expect<T> {

    #not?: Expect<T>;
    #actual: T;
    #negated: boolean;

    constructor(actual: T, negated: boolean = false) {
        this.#actual = actual;
        this.#negated = negated;
    }

    /**
     * Negates the assertion.
     */
    get not(): Expect<T> {
        return this.#not ?? (this.#not = new Expect(this.#actual, !this.#negated));
    }

    #wrap() {
        return this.#negated ? expect(this.#actual).not : expect(this.#actual);
    }

    toBe(expected: any): void {
        this.#wrap().to.equal(expected);
    }

    /**
     * Asserts deep equality using Node's deepStrictEqual.
     */
    toEqual(expected: any): void {
        try {
            toMatch(this.#actual, expected);
        } catch (err) {
            if (this.#negated) {
                return;
            }
            throw err;
        }
    }

    /**
     * Asserts that value is strictly equal to true.
     */
    toBeTrue(): void {
        if (this.#negated) {
            expect(this.#actual).not.to.equal(true, 'Expected value not to be true');
        } else {
            expect(this.#actual).to.equal(true, 'Expected value to be true');
        }
    }

    /**
     * Asserts that value is strictly equal to false.
     */
    toBeFalse(): void {
        if (this.#negated) {
            expect(this.#actual).not.to.equal(false, 'Expected value not to be false');
        } else {
            expect(this.#actual).to.equal(false, 'Expected value to be false');
        }
    }

    /**
     * Asserts that value is truthy (Boolean(value) === true).
     */
    toBeTruthy(): void {
        if (this.#negated) {
            expect(Boolean(this.#actual)).not.to.equal(true, 'Expected value not to be truthy');
        } else {
            expect(Boolean(this.#actual)).to.equal(true, 'Expected value to be truthy');
        }
    }

    /**
     * Asserts that value is falsy (Boolean(value) === false).
     */
    toBeFalsy(): void {
        if (this.#negated) {
            expect(Boolean(this.#actual)).not.to.equal(false, 'Expected value not to be falsy');
        } else {
            expect(Boolean(this.#actual)).to.equal(false, 'Expected value to be falsy');
        }
    }

    /**
     * Asserts that value is defined (not undefined).
     */
    toBeDefined(): void {
        this.#wrap().to.not.be.undefined;
    }

    /**
     * Asserts that value is undefined.
     */
    toBeUndefined(): void {
        this.#wrap().to.be.undefined;
    }

    /**
     * Asserts that value is null.
     */
    toBeNull(): void {
        this.#wrap().to.be.null;
    }

    /**
     * Asserts that value is NaN.
     */
    toBeNaN(): void {
        this.#wrap().to.be.NaN;
    }

    /**
     * Asserts that value is greater than expected.
     */
    toBeGreaterThan(expected: number): void {
        this.#wrap().to.be.greaterThan(expected);
    }

    /**
     * Asserts that value is greater than or equal to expected.
     */
    toBeGreaterThanOrEqual(expected: number): void {
        this.#wrap().to.be.greaterThanOrEqual(expected);
    }

    /**
     * Asserts that value is less than expected.
     */
    toBeLessThan(expected: number): void {
        this.#wrap().to.be.lessThan(expected);
    }

    /**
     * Asserts that value is less than or equal to expected.
     */
    toBeLessThanOrEqual(expected: number): void {
        this.#wrap().to.be.lessThanOrEqual(expected);
    }

    /**
     * Asserts that a number is close to expected within a delta (default 0.005).
     */
    toBeCloseTo(expected: number, precision: number = 3): void {
        this.#wrap().to.be.closeTo(expected, (10 ** -precision) / 2);
    }

    /**
     * Asserts that a string or array contains the expected item.
     */
    toContain(expected: any): void {
        this.#wrap().to.contain(expected);
    }

    /**
     * Asserts that an array has a specific length.
     */
    toHaveLength(expected: number): void {
        this.#wrap().to.have.length(expected);
    }

    /**
     * Asserts that an object has a specific property.
     */
    toHaveProperty(property: string | string[], value?: any): void {
        if (Array.isArray(property)) {
            this.#wrap().to.have.nested.property(property.join('.'), value);
        } else {
            this.#wrap().to.have.property(property, value);
        }
    }

    /**
     * Asserts that an object matches a subset of properties.
     */
    toMatchObject(expected: Record<string, any> | any[]): void {
        try {
            toMatchObject(this.#actual, expected);
        } catch (err) {
            if (this.#negated) {
                return;
            }
            throw err;
        }
    }

    /**
     * Asserts that a string matches a regular expression or substring.
     */
    toMatch(expected: RegExp | string): void {
        if (typeof expected === 'string') {
            this.#wrap().to.equal(expected);
        } else {
            this.#wrap().to.match(expected);
        }
    }

    /**
     * Asserts that a value is an instance of a specific class.
     */
    toBeInstanceOf(expected: new (...args: any[]) => any): void {
        this.#wrap().to.be.instanceOf(expected);
    }

    /**
     * Asserts that a function throws an error.
     */
    toThrow(expected?: string | Error | Function): void {
        if (typeof expected === 'undefined' || typeof expected === 'string') {
            this.#wrap().to.throw(expected);
        } else {
            this.#wrap().to.throw(expected);
        }
    }

}
