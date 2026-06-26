/*
 * Deepkit Framework
 * Copyright (C) 2021 Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */
import { CustomError } from './core.js';

/**
 * Maps error code prefixes to their documentation page names.
 *
 * Error code format: RT-XX### where XX is the package prefix and ### is a number.
 *
 * Core packages:
 * - RT-TP    @deepkit/type (runtime types, validation, serialization)
 * - RT-TC   @deepkit/type-compiler
 */
const packageFromPrefix: Record<string, string> = {
    'RT-TP': 'type',
    'RT-TC': 'type-compiler',
};

/**
 * Extracts the package name from an error code for documentation linking.
 *
 * @example
 * getPackageFromCode('RT-TP001') // returns 'type'
 * getPackageFromCode('RT-TC042') // returns 'mongo'
 */
export function getPackageFromCode(code: string): string {
    if (!code || typeof code !== 'string') return 'unknown';
    const match = code.match(/^(DK-[A-Z]+)/);
    if (match && packageFromPrefix[match[1]]) {
        return packageFromPrefix[match[1]];
    }
    return 'unknown';
}

/**
 * Base error class for all Deepkit errors with error codes.
 *
 * Each error has a unique code (e.g., `DK-T001`) that links to detailed
 * documentation explaining the error, common causes, and how to fix it.
 *
 * @example
 * ```typescript
 * // Direct throw with inline code
 * throw new RuntypedError('RT-TP100', 'Class User has no primary key');
 *
 * // Subclass with fixed code
 * class NoPrimaryKeyError extends RuntypedError {
 *     constructor(className: string) {
 *         super('RT-TP100', `Class ${className} has no primary key`);
 *     }
 * }
 * ```
 *
 * Output:
 * ```
 * RuntypedError: Class User has no primary key
 *
 * Error code: RT-TP100
 * ```
 */
export class RuntypedError extends CustomError {
    /**
     * The unique error code (e.g., 'RT-TP001').
     * Can be overridden by subclasses.
     */
    public code: string;

    constructor(code: string, message: string, options?: { cause?: Error }) {
        const fullMessage = `${message}\n\nError code: ${code}`;
        super(fullMessage);
        this.code = code;
        if (options?.cause) {
            this.cause = options.cause;
        }
    }

    /**
     * Returns a JSON-serializable representation of this error for structured logging.
     *
     * @example
     * ```typescript
     * try {
     *     // ... code that throws
     * } catch (error) {
     *     if (error instanceof RuntypedError) {
     *         logger.error(JSON.stringify(error.toJSON()));
     *     }
     * }
     * ```
     */
    toJSON(): { name: string; code: string; message: string; cause?: string } {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            ...(this.cause instanceof Error ? { cause: this.cause.message } : {}),
        };
    }
}
