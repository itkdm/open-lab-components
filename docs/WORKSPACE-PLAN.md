# Workspace Plan

This document records the recommended path for consolidating package management
without mixing that migration into the current quality-hardening batches.

## Current layout

The repository currently contains three active npm boundaries plus one optional
quality-only harness:

1. root package
2. `mcp-server/`
3. `tools/runtime-harness/`

Current coordination is mostly manual from the root package through
`npm --prefix ...`.

## Observed constraints

- The root package is the publishable library and must keep its package metadata
  stable.
- `mcp-server/` is also publishable and has its own release surface.
- `tools/runtime-harness/` exists only to support quality checks.
- The repository already contains multiple `package-lock.json` files, so a
  workspace migration would change install behavior and lockfile ownership.
- `package.json` in the root is currently dirty in the working tree, so this is
  not the right time for a structural package-manager migration.

## Recommendation

Do not perform workspace migration until the following are true:

1. the root quality path is stable in CI
2. the MCP pipeline ownership is clear
3. unrelated local changes in `package.json` and `mcp-server/` are either
   merged or intentionally parked

## Recommended target structure

If migration is approved later, use npm workspaces and keep the current publish
boundaries explicit:

```json
{
  "private": true,
  "workspaces": [
    "mcp-server",
    "tools/runtime-harness"
  ]
}
```

The root library should remain the repository package, not move under
`packages/`, because:

- publish paths are already stable
- docs and scripts are written against the current root layout
- moving the root library would create more churn than value right now

## Migration sequence

### Phase 1: script consolidation only

- add root aliases for:
  - root checks
  - MCP tests
  - console build
- keep existing per-package lockfiles for the moment
- do not change publish metadata yet

### Phase 2: workspace declaration

- add `private: true` and `workspaces` to the root package definition only if
  publish behavior is confirmed safe
- verify `npm install`, `npm ci`, and `npm pack --dry-run`
- confirm that `mcp-server` packaging still includes the expected files

### Phase 3: dependency ownership cleanup

- decide whether `tools/runtime-harness/` stays as a standalone workspace or is
  folded into root dev dependencies
- only then revisit lockfile strategy

## Risks

- accidental change to publish output for the root package
- accidental change to publish output for `mcp-server`
- npm workspace behavior interfering with existing `npm --prefix` commands
- noisy lockfile churn across unrelated packages

## Minimum verification for future migration

If workspace migration is attempted later, require all of the following before
merge:

```bash
node tools/check-root/index.js
npm run mcp:test
npm pack --dry-run
npm --prefix mcp-server pack --dry-run
```

## Decision

Recommendation for now: keep the current package topology, continue improving
quality entrypoints and CI, and postpone workspace migration until the repo is
less noisy.
