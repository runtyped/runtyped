/*
 * Runtyped Framework
 * Copyright (c) Deepkit UG, Marc J. Schmidt
 * Copyright (c) Jacopo Scazzosi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */
import { CustomError } from './core.js';

/**
 * Base error class for Runtyped errors with error codes.
 *
 * Each error has a unique code (e.g., `RT-TP001`) identifying it.
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
