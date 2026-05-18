#!/usr/bin/env sh

set -e;

node_modules/.bin/tsc --build packages/type-compiler/tsconfig.json
node packages/type-compiler/dist/cjs/install-transformer.js
