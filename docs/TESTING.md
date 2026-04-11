# Testing

## Root library checks

Run the root-package quality path with a single command:

```bash
node tools/check-root/index.js
```

This executes:

1. `tests/root-api.test.js`
2. `tools/runtime-harness/runtime-lifecycle.test.js`
3. `tools/validate/index.js`

## Release-facing checks

Run the publish smoke checks:

```bash
node tools/release-smoke/index.js
```

Use this before tagging or publishing to verify both npm packages still pack
with the expected key files.

## Individual checks

Run the root API smoke test:

```bash
node tests/root-api.test.js
```

Run the runtime lifecycle harness:

```bash
cd tools/runtime-harness
npm test
```

Run component validation:

```bash
npm run validate
```
