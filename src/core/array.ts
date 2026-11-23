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

/**
 * Removes on particular item by reference of an array.
 */
export function arrayRemoveItem<T>(array: T[], item: T): boolean {
    const index = array.indexOf(item);
    if (-1 !== index) {
        array.splice(index, 1);
        return true;
    }

    return false;
}

