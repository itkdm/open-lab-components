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
manifest used by the repository tooling layer, and that the root package
`files` list and shared package metadata still match the shared publish
contracts, including description, keyword, `name`, `main`, and `types`
boundaries, plus the declared `dependencies` / `devDependencies` contract and
the shared package version.

Run the root docs boundary check:

```bash
npm run check:docs
```

This verifies the root README, quick-start guide, contribution guide, and
architecture/testing docs still include the shared command-entry and generated
artifact references that define the repository contract, including the shared
root API usage snippets. It also verifies that versioned release docs still
match the current package version and release tag, and that the documented
release workflow order stays consistent.

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
3. `tools/check-docs/index.js`
4. `tests/root-api.test.js`
   This also checks the root JS export surface, shared query API contract, and
   `index.d.ts` declarations.
5. `tools/runtime-harness/runtime-lifecycle.test.js`
6. `tools/validate/index.js`

The MCP catalog tests also exercise the shared `lib/catalog.js` query layer,
which now backs both the root package API and the MCP discovery surface.

## Release-facing checks

Run the publish smoke checks:

```bash
npm run check:release
```

Use this before tagging or publishing to verify both npm packages still pack
with the expected key files.

The narrower npm publish hook remains:

```bash
npm run prepublishOnly
```

This is expected to cover only `build:registry` and `check:registry`, while
`release:check` stays responsible for the broader release preflight.

## MCP package checks

Run the MCP script-manifest boundary check:

```bash
npm run mcp:check:scripts
```

This verifies the `mcp-server/package.json` scripts still match the shared MCP
script manifest, and that the MCP package `files` list still matches the shared
publish-asset contract and shared package metadata contract, including
description, keyword, `name`, `type`, and `bin` boundaries, plus the declared
dependency contract and the shared package version.

Run the MCP docs boundary check:

```bash
npm run mcp:check:docs
```

This verifies the MCP README and deployment guide still include the shared
runtime env vars, operational routes, verification commands, and startup
entrypoint references.

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
