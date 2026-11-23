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

# Build all packages with @runtyped/typescript, which emits the type
# information they surface at run-time.
npm run build

# Run tests.
npm test

# Run benchmarks
npm run bench
```
