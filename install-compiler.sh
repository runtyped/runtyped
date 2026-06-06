#!/usr/bin/env sh

set -e;

node_modules/.bin/tsc --build packages/type-compiler/tsconfig.json
node packages/type-compiler/dist/install-transformer.js
