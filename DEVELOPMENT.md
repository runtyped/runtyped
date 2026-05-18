# Development

## Prerequisites

- Local package linking is managed through the NPM Workspaces.
- Node >= v20 is needed.

## Getting Started

```shell
git clone https://github.com/runtyped/runtyped.git
cd runtyped
npm install
```

Make sure the compiler is built first and injected to node_modules:

```shell
npx runtyped-type-install
```

When installation is finished you can build the packages:

```shell
npm run build
```

You can try running some tests

```shell
npm run test
```
