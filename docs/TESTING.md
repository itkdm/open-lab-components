# Testing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the repository boundaries behind
these checks.

## Root library checks

Run the root-package quality path with a single command:

```bash
npm run check:root
```

This executes:

1. `tests/root-api.test.js`
2. `tools/runtime-harness/runtime-lifecycle.test.js`
3. `tools/validate/index.js`

## Release-facing checks

Run the publish smoke checks:

```bash
npm run check:release
```

Use this before tagging or publishing to verify both npm packages still pack
with the expected key files.

## Individual checks

Run the root API smoke test:

```bash
npm run test:root
```

Run the runtime lifecycle harness:

```bash
npm run test:runtime
```

Run component validation:

```bash
npm run validate
```
