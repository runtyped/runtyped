#!/usr/bin/env node

/**
 * This script installs the @runtyped/type-compiler transformer (that extracts automatically types and adds the correct @t decorator) to the typescript node_modules.
 *
 * The critical section that needs adjustment is in the `function getScriptTransformers` in `node_modules/typescript/lib/tsc.js`.
 */

import { dirname, join, relative } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = import.meta.dirname;

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

function getCode(runtypedDistPath: string, id: string): string {
  const patchCode = `
    //${getPatchId(id)}
    let runtypedTypeTransformer;
    try {
      runtypedTypeTransformer = require('@runtyped/type-compiler');
    } catch (error) {
      try {
        runtypedTypeTransformer = require(${JSON.stringify(runtypedDistPath)});
      } catch (error) { }
    }
    if (runtypedTypeTransformer) {
      if (!customTransformers) customTransformers = {};
      if (!customTransformers.before) customTransformers.before = [];
      let alreadyPatched = false;
      for (let fn of customTransformers.before) {
        if (fn && fn.name === 'runtypedTypeTransformer') {
          alreadyPatched = true;
          break;
        }
      }
      if (!alreadyPatched) {
        if (!customTransformers.before.includes(runtypedTypeTransformer.transformer)) {
          customTransformers.before.push(runtypedTypeTransformer.transformer);
        }
        if (!customTransformers.afterDeclarations) {
          customTransformers.afterDeclarations = [];
        }
        if (!customTransformers.afterDeclarations.includes(runtypedTypeTransformer.declarationTransformer)) {
          customTransformers.afterDeclarations.push(runtypedTypeTransformer.declarationTransformer);
        }
      }
    } else {
      console.error(\`
        ==================== @runtyped/type-compiler ====================

            WARNING: failed to require() @runtyped/type-compiler.

        The TypeScript compiler has been correctly patched but the patch
        itself is unable to load the transformer module from the expected
        path. Please report this issue to the Runtyped team.
        =================================================================
      \`);
    }
    //${getPatchId(id)}-end
  `;
  return patchCode;
}

function isPatched(code: string, id: string) {
    return code.includes(getPatchId(id));
}

// if (to + '/dist/cjs' === __dirname) {
//     to = join(to, '..'); //we exclude type-compiler/node_modules
// }

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
    const patchCode = getCode(runtypedDistPath, id);
    return a + '\n    ' + patchCode;
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
