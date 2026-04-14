# Testing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the repository boundaries behind
these checks.

## Root library checks

Run the text-file boundary check:

```bash
npm run check:text
```

This verifies source-controlled text files use the repository-standard UTF-8
without BOM and LF line endings.

Run the script-manifest boundary check:

```bash
npm run check:scripts
```

This verifies the root `package.json` scripts still match the shared script
manifest used by the repository tooling layer.

Run the generated-artifact boundary check:

```bash
npm run check:generated
```

This verifies the required `registry/` outputs and `site/dist/` build entries
exist and match the shared generated-output contract.

Run the root-package quality path with a single command:

```bash
npm run check:root
```

This executes:

1. `tools/check-text/index.js`
2. `tools/check-scripts/index.js`
3. `tests/root-api.test.js`
4. `tools/runtime-harness/runtime-lifecycle.test.js`
5. `tools/validate/index.js`

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
