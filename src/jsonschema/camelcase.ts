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
 * Reduced port of the `camelcase` package (MIT, Sindre Sorhus), limited to
 * the behaviour used to build JSON Schema names: default options plus
 * `pascalCase`. Case conversion is locale-independent so that schema names
 * do not depend on the host's locale.
 */

const UPPERCASE = /[\p{Lu}]/u;
const LOWERCASE = /[\p{Ll}]/u;
const SEPARATORS = /[_.\- ]+/;
const IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
const LEADING_SEPARATORS = new RegExp('^' + SEPARATORS.source);
const SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, 'gu');
const NUMBERS_AND_IDENTIFIER = new RegExp(String.raw`\d+` + IDENTIFIER.source, 'gu');

const isLower = (c: string) => c.toLowerCase() === c && c.toUpperCase() !== c;
const isUpper = (c: string) => c.toUpperCase() === c && c.toLowerCase() !== c;

/** Inserts `-` at camelCase word boundaries: FooBar → Foo-Bar, FOOBar → FOO-Bar. */
function splitCamelCase(input: string): string {
    let lastLower = false;
    let lastUpper = false;
    let lastLastUpper = false;

    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        const lastLastPreserved = i > 2 ? input[i - 3] === '-' : true;

        if (lastLower && UPPERCASE.test(c)) {
            input = input.slice(0, i) + '-' + input.slice(i);
            lastLower = false;
            lastLastUpper = lastUpper;
            lastUpper = true;
            i++;
        } else if (lastUpper && lastLastUpper && LOWERCASE.test(c) && !lastLastPreserved) {
            input = input.slice(0, i - 1) + '-' + input.slice(i - 1);
            lastLastUpper = lastUpper;
            lastUpper = false;
            lastLower = true;
        } else {
            lastLower = isLower(c);
            lastLastUpper = lastUpper;
            lastUpper = isUpper(c);
        }
    }

    return input;
}

/**
 * Joins the given words into a single camelCase (or PascalCase) identifier.
 * `['foo', 'bar-baz']` → `fooBarBaz`; with `pascalCase` → `FooBarBaz`.
 */
export function camelCase(words: string[], options: { pascalCase?: boolean } = {}): string {
    let input = words
        .map((w) => w.trim())
        .filter((w) => w.length > 0)
        .join('-');

    if (input.length === 0) return '';

    // Preserve leading _ and $ as they have semantic meaning
    const prefix = input.match(/^[_$]*/)![0];
    input = input.slice(prefix.length);
    if (input.length === 0) return prefix;

    if (input.length === 1) {
        if (SEPARATORS.test(input)) return prefix;
        return prefix + (options.pascalCase ? input.toUpperCase() : input.toLowerCase());
    }

    if (input !== input.toLowerCase()) input = splitCamelCase(input);

    input = input.replace(LEADING_SEPARATORS, '').toLowerCase();

    if (options.pascalCase && input.length > 0) {
        input = input[0].toUpperCase() + input.slice(1);
    }

    return prefix + input
        .replaceAll(NUMBERS_AND_IDENTIFIER, (match, id: string, offset: number, str: string) => {
            // A numeric run followed by a separator continues the current word
            if (SEPARATORS.test(str.charAt(offset + match.length))) return match;
            return id ? match.slice(0, -id.length) + id.toUpperCase() : match;
        })
        .replaceAll(SEPARATORS_AND_IDENTIFIER, (_, id: string) => id.toUpperCase());
}
