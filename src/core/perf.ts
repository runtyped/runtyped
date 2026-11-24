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

/*
 * Port of the `to-fast-properties` package (MIT, Sindre Sorhus).
 *
 * Forces V8 to switch an object (e.g. a JIT container that has had many
 * properties added to it) back to fast properties, by briefly installing it
 * as a prototype and touching it through an inline cache. See
 * https://medium.com/@tverwaes/setting-up-prototypes-in-v8-ec9c9491dfe2#5f62
 */

let fastProto: any = null;

function FastObject(this: any, object?: any): any {
    // A prototype object gets fast properties once it is checked against the
    // inline property cache of a function, e.g. `fastProto.property`.
    if (fastProto !== null && typeof fastProto.property) {
        const result = fastProto;
        fastProto = FastObject.prototype = null;
        return result;
    }
    fastProto = FastObject.prototype = object == null ? Object.create(null) : object;
    return new (FastObject as any)();
}

// Warm up the inline property cache of FastObject.
for (let i = 0; i <= 10; i++) (FastObject as any)();

export function toFastProperties(obj: any): void {
    (FastObject as any)(obj);
}
