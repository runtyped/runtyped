import { bench, do_not_optimize, group, summary } from 'mitata';
import { Ajv } from 'ajv';
import { is, toJsonSchema, typeGuard, validate, validateFunction } from '../../index.js';

// Compares Runtyped's validation against Ajv (https://ajv.js.org).
//
// Ajv validators are compiled from the JSON Schemas that `toJsonSchema<T>()`
// generates for the very same TypeScript types, so both libraries check the
// same constraints. Extra properties are allowed on both sides (Runtyped's
// `is()` is loose; Ajv's default for `additionalProperties` is permissive).
//
// Ajv instances are compiled once up front, as one would in production.
// Runtyped is measured both through the idiomatic per-call API (`is<T>()`,
// `validate<T>()`, which resolve the type and look up the cached JIT function
// on every call) and through pre-built functions (`typeGuard<T>()`,
// `validateFunction<T>()`), which is the closer match to Ajv's `compile()`.

// ============================================================================
// Types
// ============================================================================

interface SimpleUser {
    id: number;
    name: string;
    email: string;
    active: boolean;
}

interface NestedAddress {
    street: string;
    city: string;
    zip: string;
    country: string;
}

interface ComplexUser {
    id: number;
    name: string;
    email: string;
    active: boolean;
    roles: string[];
    address: NestedAddress;
    metadata: Record<string, string>;
    createdAt: string;
}

// ============================================================================
// Fixtures
// ============================================================================

const simpleUser = {
    id: 42,
    name: 'Alice',
    email: 'alice@example.com',
    active: true,
};

const invalidSimpleUser = {
    ...simpleUser,
    id: 'not-a-number',
};

const complexUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    active: true,
    roles: ['admin', 'editor'],
    address: {
        street: '123 Main St',
        city: 'Springfield',
        zip: '62704',
        country: 'US',
    },
    metadata: { source: 'web', plan: 'pro' },
    createdAt: '2024-01-15T10:30:00.000Z',
};

// Fails deep inside the structure, so validators have to walk most of it.
const invalidComplexUser = {
    ...complexUser,
    address: { ...complexUser.address, zip: 62704 },
};

// ============================================================================
// Validators
// ============================================================================

const ajvFirstError = new Ajv();
const ajvAllErrors = new Ajv({ allErrors: true });

const simpleSchema = toJsonSchema<SimpleUser>();
const complexSchema = toJsonSchema<ComplexUser>();

const ajvIsSimpleUser = ajvFirstError.compile<SimpleUser>(simpleSchema);
const ajvIsComplexUser = ajvFirstError.compile<ComplexUser>(complexSchema);
const ajvValidateSimpleUser = ajvAllErrors.compile<SimpleUser>(simpleSchema);
const ajvValidateComplexUser = ajvAllErrors.compile<ComplexUser>(complexSchema);

const isSimpleUser = typeGuard<SimpleUser>();
const isComplexUser = typeGuard<ComplexUser>();
const validateSimpleUser = validateFunction<SimpleUser>();
const validateComplexUser = validateFunction<ComplexUser>();

// Sanity check: both libraries must agree on every fixture, or the
// comparison is meaningless.
const checks: [string, boolean, boolean][] = [
    ['SimpleUser (valid)', is<SimpleUser>(simpleUser), ajvIsSimpleUser(simpleUser)],
    ['SimpleUser (invalid)', is<SimpleUser>(invalidSimpleUser), ajvIsSimpleUser(invalidSimpleUser)],
    ['ComplexUser (valid)', is<ComplexUser>(complexUser), ajvIsComplexUser(complexUser)],
    ['ComplexUser (invalid)', is<ComplexUser>(invalidComplexUser), ajvIsComplexUser(invalidComplexUser)],
];
for (const [name, runtyped, ajv] of checks) {
    if (runtyped !== ajv) {
        throw new Error(`Runtyped and Ajv disagree on ${name}: runtyped=${runtyped}, ajv=${ajv}`);
    }
}

// Feeds the fixture through mitata's computed parameters, so that V8 cannot
// constant-fold a small, fully inlined validator against a fixed input
// (which otherwise produces sub-nanosecond, meaningless results).
function measure(name: string, data: unknown, fn: (data: unknown) => unknown) {
    bench(name, function* () {
        yield {
            [0]() {
                return data;
            },
            bench(d: unknown) {
                do_not_optimize(fn(d));
            },
        };
    });
}

// ============================================================================
// Benchmarks — boolean type guards (stop at first error)
// ============================================================================

for (const [name, data, rtIs, rtGuard, ajv] of [
    ['SimpleUser (valid)', simpleUser, (d: unknown) => is<SimpleUser>(d), isSimpleUser, ajvIsSimpleUser],
    ['SimpleUser (invalid)', invalidSimpleUser, (d: unknown) => is<SimpleUser>(d), isSimpleUser, ajvIsSimpleUser],
    ['ComplexUser (valid)', complexUser, (d: unknown) => is<ComplexUser>(d), isComplexUser, ajvIsComplexUser],
    ['ComplexUser (invalid)', invalidComplexUser, (d: unknown) => is<ComplexUser>(d), isComplexUser, ajvIsComplexUser],
] as const) {
    group(`vs Ajv — type guard — ${name}`, () => {
        summary(() => {
            measure('runtyped is<T>()', data, (d) => rtIs(d));
            measure('runtyped typeGuard<T>()', data, (d) => rtGuard(d));
            measure('ajv compile()', data, (d) => ajv(d));
        });
    });
}

// ============================================================================
// Benchmarks — validation with error collection (all errors)
// ============================================================================

for (const [name, data, rtValidate, rtValidateFn, ajv] of [
    ['SimpleUser (valid)', simpleUser, (d: unknown) => validate<SimpleUser>(d), validateSimpleUser, ajvValidateSimpleUser],
    ['SimpleUser (invalid)', invalidSimpleUser, (d: unknown) => validate<SimpleUser>(d), validateSimpleUser, ajvValidateSimpleUser],
    ['ComplexUser (valid)', complexUser, (d: unknown) => validate<ComplexUser>(d), validateComplexUser, ajvValidateComplexUser],
    ['ComplexUser (invalid)', invalidComplexUser, (d: unknown) => validate<ComplexUser>(d), validateComplexUser, ajvValidateComplexUser],
] as const) {
    group(`vs Ajv — errors — ${name}`, () => {
        summary(() => {
            measure('runtyped validate<T>()', data, (d) => rtValidate(d));
            measure('runtyped validateFunction<T>()', data, (d) => rtValidateFn(d as any));
            measure('ajv compile({ allErrors })', data, (d) => ajv(d) ? null : ajv.errors);
        });
    });
}
