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

/** @group String */

export function indent(indentation: number, prefix: string = '') {
    return (str: string = '') => {
        return ' '.repeat(indentation) + str.replace(/\n/g, '\n' + (' '.repeat(indentation)) + prefix);
    };
}

