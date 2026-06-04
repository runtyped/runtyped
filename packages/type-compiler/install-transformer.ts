#!/usr/bin/env node

/**
 * This script installs the @runtyped/type-compiler transformer (that extracts automatically types and adds the correct @t decorator) to the typescript node_modules.
 *
 * The critical section that needs adjustment is in the `function getScriptTransformers` in `node_modules/typescript/lib/tsc.js`.
 */

import { dirname, join, relative } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

let to = process.argv[2] || process.cwd();

console.log(`

  ================ @runtyped/type-compiler ================

  This script patches the TypeScript compiler by adding the
  @runtyped/type-compiler transformer, which extracts types
  and adds the correct @t decorator.

`);

function getPatchId(id: string): string {
    return 'runtyped_patch_' + id;
}

function getCode(runtypedDistPath: string, varName: string, id: string): string {
    return `
        //${getPatchId(id)}
        try {
            var typeTransformer;
            try {
                typeTransformer = require('@runtyped/type-compiler');
            } catch (error) {
                typeTransformer = require(${JSON.stringify(runtypedDistPath)});
            }
            if (typeTransformer) {
                if (!customTransformers) ${varName} = {};
                if (!${varName}.before) ${varName}.before = [];
                let alreadyPatched = false;
                for (let fn of ${varName}.before) {
                    if (fn && fn.name === 'deepkitTransformer') alreadyPatched = true;
                }
                if (!alreadyPatched) {
                    if (!${varName}.before.includes(typeTransformer.transformer)) ${varName}.before.push(typeTransformer.transformer);

                    if (!${varName}.afterDeclarations) ${varName}.afterDeclarations = [];
                    if (!${varName}.afterDeclarations.includes(typeTransformer.declarationTransformer)) {
                        ${varName}.afterDeclarations.push(typeTransformer.declarationTransformer);
                    }
                }
            }
        } catch (e) {
        }
        //${getPatchId(id)}-end
    `;
}

function isPatched(code: string, id: string) {
    return code.includes(getPatchId(id));
}

if (to + '/dist/cjs' === __dirname) {
    to = join(to, '..'); //we exclude type-compiler/node_modules
}

const typeScriptPath = dirname(require.resolve('typescript', { paths: [to] }));
const runtypedDistPath = relative(typeScriptPath, __dirname);

const paths = ['tsc.js', '_tsc.js', 'typescript.js'];

let patched_count = 0;

for (const fileName of paths) {

  const file = join(typeScriptPath, fileName);

  if (!existsSync(file)) {
    console.log('  Runtyped: skipping file %s (does not exist)', file);
    continue;
  }

  let code = readFileSync(file, 'utf8');

  const id = 'patchGetTransformers';
  if (isPatched(code, id)) {
    patched_count += 1;
    console.log('  Runtyped: skipping file %s (already patched)', file);
    continue;
  }

  const find = /function getTransformers\([^)]+\)\s*{/;

  if (!code.match(find)) {
    console.log('  Runtyped: skipping file %s (no getTransformers function found)', file);
    continue;
  }

  code = code.replace(find, function (a) {
    return a + '\n    ' + getCode(runtypedDistPath, 'customTransformers', id);
  });

  writeFileSync(file, code);
  patched_count += 1;
  console.log('  Runtyped: injected TypeScript transformer at', file);

}

if (patched_count === 0) {
  console.error(`

    Runtyped: WARNING: no files patched. Please report this issue.

  `)
}

console.log(`

  =========================================================

`);
