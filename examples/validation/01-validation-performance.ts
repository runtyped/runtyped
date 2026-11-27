/*
 * Example: the different ways to validate data, and what each one costs.
 *
 * Runtyped compiles a type into JavaScript the first time it is used for a
 * given purpose, then caches that code on the type. Each API below builds a
 * different kind of function, so they differ in what they accept, what they
 * return and how fast they are (per call, after warm-up):
 *
 * | API                           | Unknown keys | On failure           | Valid   | Invalid |
 * | ----------------------------- | ------------ | -------------------- | ------- | ------- |
 * | `typeGuard<T>()`              | allowed      | `false`              | ~7 ns   | ~15 ns  |
 * | `typeGuardWeak<T>()`          | allowed      | `false`, NaN passes  | ~7 ns   | ~14 ns  |
 * | `is<T>(x)`                    | allowed      | `false`              | ~19 ns  | ~11 ns  |
 * | `typeGuardStrict<T>()`        | rejected     | `false`              | ~45 ns  | ~32 ns  |
 * | `validate<T>(x)`              | allowed      | list of errors       | ~30 ns  | ~120 ns |
 * | `validates<T>(x)`             | allowed      | `false`              | ~32 ns  | ~107 ns |
 * | `assert<T>(x)`                | allowed      | throws, with details | ~48 ns  | ~3.8 us |
 * | guard + `deserializeFunction` | removed      | throws (your error)  | ~40 ns  | ~1.7 us |
 * | `castFunction<T>()`           | removed      | throws, with details | ~73 ns  | ~3.4 us |
 * | `cast<T>(x)`                  | removed      | throws, with details | ~102 ns | ~3.5 us |
 *
 * Measured by running this file with `--bench` on Node.js 24, for the `User`
 * type below. They are only indicative: measure your own types and inputs.
 *
 * Rules of thumb:
 *
 * - Throwing is by far the most expensive part of rejecting input: creating
 *   an `Error` (and capturing its stack trace) costs microseconds, around 100
 *   times the validation itself. Where invalid input is common, such as when
 *   filtering data or facing untrusted clients, use a guard, or `validate()`
 *   when you need to say what's wrong.
 * - Prefer the precompiled functions (`typeGuard<T>()`, `castFunction<T>()`,
 *   ...) on hot paths. The call-site forms (`is<T>(x)`, `cast<T>(x)`, ...)
 *   look the cached function up on every call, which costs more than the
 *   check itself for a small type.
 * - When you only need a yes/no, use a guard. `validates<T>()` gives the same
 *   answer, but always runs the slower, error-collecting validator.
 * - Strict checks, which reject unknown keys, cost several times more than
 *   loose ones, since they have to look at every key of the input.
 * - `cast<T>()` coerces by default ("42" becomes 42). To strip unknown keys
 *   without coercing, check with a guard first, then build the result with
 *   `deserializeFunction<T>()`: the input is then already valid, so nothing
 *   gets coerced. It's also the fastest way to strip unknown keys.
 * - Validation annotations (`MinLength<>`, `Positive`, ...) make `assert<T>()`
 *   and `cast<T>()` always run the error-collecting validator (~75 ns instead
 *   of ~48 ns for `assert<T>()` here). Guards check annotations at full speed.
 *
 * Run with: node dist/examples/validation/01-validation-performance.js [--bench]
 */

import nodeAssert from 'node:assert/strict';
import {
    MinLength,
    Positive,
    ValidationError,
    assert,
    cast,
    castFunction,
    deserializeFunction,
    is,
    isStrict,
    typeGuard,
    typeGuardStrict,
    typeGuardWeak,
    validate,
    validates,
} from '../../index.js';

// ---------------------------------------------------------------------------
// 1. The types to validate.
// ---------------------------------------------------------------------------

interface Address {
    street: string;
    city: string;
}

interface User {
    id: number;
    name: string;
    active: boolean;
    tags: string[];
    address: Address;
}

// The same shape, with validation annotations.
interface ConstrainedUser {
    id: number & Positive;
    name: string & MinLength<3>;
    active: boolean;
    tags: string[];
    address: Address;
}

const user: User = {
    id: 1,
    name: 'Alice',
    active: true,
    tags: ['admin', 'editor'],
    address: { street: '1 Main St', city: 'Springfield' },
};
const withExtraKeys = { ...user, password: 'hunter2', address: { ...user.address, zip: '12345' } };
const wrongType = { ...user, id: 'not a number' };
const coercible = { ...user, id: '42' };
const nan = { ...user, id: NaN };

// ---------------------------------------------------------------------------
// 2. Type guards: a boolean, as fast as it gets.
// ---------------------------------------------------------------------------

// Precompiled once, then a plain function call. Unknown keys are allowed.
const isUser = typeGuard<User>();
nodeAssert.equal(isUser(user), true);
nodeAssert.equal(isUser(withExtraKeys), true);
nodeAssert.equal(isUser(wrongType), false);
nodeAssert.equal(isUser(nan), false);

// The call-site form gives the same answers, looking up the cached guard.
nodeAssert.equal(is<User>(user), true);
nodeAssert.equal(is<User>(wrongType), false);

// Strict guards also reject unknown keys, nested objects included.
const isUserStrict = typeGuardStrict<User>();
nodeAssert.equal(isUserStrict(user), true);
nodeAssert.equal(isUserStrict(withExtraKeys), false);
nodeAssert.equal(isStrict<User>({ ...user, address: { ...user.address, zip: '1' } }), false);

// Weak guards skip the NaN checks on numbers, and nothing else.
const isUserWeak = typeGuardWeak<User>();
nodeAssert.equal(isUserWeak(nan), true);
nodeAssert.equal(isUserWeak(wrongType), false);

// Guards check validation annotations too.
const isConstrained = typeGuard<ConstrainedUser>();
nodeAssert.equal(isConstrained(user), true);
nodeAssert.equal(isConstrained({ ...user, name: 'Al' }), false);
nodeAssert.equal(isConstrained({ ...user, id: -1 }), false);

// ---------------------------------------------------------------------------
// 3. Error details: assert() and validate().
// ---------------------------------------------------------------------------

// assert() narrows the type, or throws a ValidationError saying what's wrong.
assert<User>(user);
nodeAssert.throws(() => assert<User>(wrongType), (error: unknown) => {
    nodeAssert.ok(error instanceof ValidationError);
    nodeAssert.equal(error.errors[0].path, 'id');
    return true;
});

// validate() returns the errors instead of throwing.
nodeAssert.deepEqual(validate<User>(user), []);
const errors = validate<ConstrainedUser>({ ...user, id: -1, name: 'Al' });
nodeAssert.deepEqual(errors.map(e => e.path), ['id', 'name']);

// validates() is a boolean, but runs the same error-collecting validator.
nodeAssert.equal(validates<User>(user), true);
nodeAssert.equal(validates<User>(wrongType), false);

// ---------------------------------------------------------------------------
// 4. Parsing: a new object holding only the declared properties.
// ---------------------------------------------------------------------------

// cast() validates, drops unknown keys and returns a new object...
const castUser = castFunction<User>();
nodeAssert.deepEqual(castUser(withExtraKeys), user);
nodeAssert.notEqual(castUser(user), user);
nodeAssert.throws(() => castUser(wrongType), ValidationError);

// ...but it also coerces values by default, unless told otherwise.
nodeAssert.equal(cast<User>(coercible).id, 42);
nodeAssert.throws(() => cast<User>(coercible, { loosely: false }), ValidationError);

// To strip unknown keys without any coercion, guard first, then copy.
const copyUser = deserializeFunction<User>();
function parseUser(data: unknown): User {
    if (!isUser(data)) throw new Error('not a User');
    return copyUser(data);
}
nodeAssert.deepEqual(parseUser(withExtraKeys), user);
nodeAssert.throws(() => parseUser(coercible));

// ---------------------------------------------------------------------------
// 5. With --bench, measure each approach on valid and invalid input.
// ---------------------------------------------------------------------------

function nsPerOp(fn: () => unknown, iterations: number): number {
    let sink: unknown;
    for (let i = 0; i < iterations / 10; i++) sink = fn(); // warm-up
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) sink = fn();
    const elapsed = Number(process.hrtime.bigint() - start);
    if (sink === Symbol.for('never')) console.log(sink); // keep `sink` alive
    return elapsed / iterations;
}

function throws(fn: () => unknown): () => unknown {
    return () => {
        try {
            return fn();
        } catch (error) {
            return error;
        }
    };
}

const assertConstrained = (data: unknown) => assert<ConstrainedUser>(data);

if (process.argv.includes('--bench')) {
    const cases: [string, () => unknown, () => unknown][] = [
        ['typeGuard<T>()', () => isUser(user), () => isUser(wrongType)],
        ['is<T>(x)', () => is<User>(user), () => is<User>(wrongType)],
        ['typeGuardWeak<T>()', () => isUserWeak(user), () => isUserWeak(wrongType)],
        ['typeGuardStrict<T>()', () => isUserStrict(user), () => isUserStrict(withExtraKeys)],
        ['assert<T>(x)', () => assert<User>(user), throws(() => assert<User>(wrongType))],
        ['assert<T>(x), annotated T', () => assertConstrained(user), throws(() => assertConstrained({ ...user, id: -1 }))],
        ['validate<T>(x)', () => validate<User>(user), () => validate<User>(wrongType)],
        ['validates<T>(x)', () => validates<User>(user), () => validates<User>(wrongType)],
        ['guard + deserializeFunction', () => parseUser(withExtraKeys), throws(() => parseUser(wrongType))],
        ['castFunction<T>()', () => castUser(withExtraKeys), throws(() => castUser(wrongType))],
        ['cast<T>(x)', () => cast<User>(withExtraKeys), throws(() => cast<User>(wrongType))],
    ];

    console.log(`${'API'.padEnd(30)}${'valid'.padStart(12)}${'invalid'.padStart(12)}`);
    for (const [name, valid, invalid] of cases) {
        const v = nsPerOp(valid, 1_000_000).toFixed(1);
        const i = nsPerOp(invalid, 200_000).toFixed(1);
        console.log(`${name.padEnd(30)}${`${v} ns`.padStart(12)}${`${i} ns`.padStart(12)}`);
    }
}

console.log('01-validation-performance: ok');
