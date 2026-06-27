import { bench, do_not_optimize, group } from 'mitata';
import { deserialize } from '@runtyped/type';

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
    createdAt: Date;
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
    createdAt: '2024-01-15T10:30:00.000Z', // ISO string; deserialize() parses into Date
};

// ============================================================================
// Benchmarks
// ============================================================================

group('deserialize() — simple types', () => {
    bench('SimpleUser (valid)', () => {
        do_not_optimize(deserialize<SimpleUser>(simpleUser));
    });
});

group('deserialize() — nested types', () => {
    bench('ComplexUser (valid)', () => {
        do_not_optimize(deserialize<ComplexUser>(complexUser));
    });
});
