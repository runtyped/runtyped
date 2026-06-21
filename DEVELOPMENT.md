# Development

## Prerequisites

- Local package linking is managed through the NPM Workspaces.
- Node >= v20 is needed.

## Getting Started

```sh
# Clone the repository.
git clone https://github.com/runtyped/runtyped.git
cd runtyped

# Install all dependencies.
npm install

# Build `@runtyped/type-compiler` first and patch the TypeScript compiler
# with the provided transformer.
./install-compiler.sh

# Build the rest of the packages, which will surface type information at
# run-time due to using the patched TypeScript compiler.
npm run build

# Run tests.
npm test
```
