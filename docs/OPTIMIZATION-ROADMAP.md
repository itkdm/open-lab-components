# Optimization Roadmap

This roadmap defines how to improve the repository in small, reversible batches.
Each batch must be validated locally, committed independently, and pushed to the
remote branch before the next batch starts.

## Execution Rules

1. One batch, one goal, one commit.
2. Do not mix runtime changes, refactors, documentation cleanup, and build
   system work in the same commit.
3. Each batch must include:
   - change scope
   - verification command(s)
   - rollback command
   - expected follow-up
4. Prefer additive changes before structural refactors.
5. Use `git revert <commit>` for rollback. Do not rewrite shared history.

## Working Branch

- Branch: `codex/root-quality-hardening`
- Remote: `gitee`
- Push after every completed batch:

```bash
git push
```

## Batch Workflow

For every batch, follow this sequence:

```bash
node <targeted-check>
git add <scoped files>
git commit -m "<type(scope): summary>"
git push
```

If verification fails:

1. Stop the batch.
2. Fix only the failing scope.
3. Re-run the same verification.
4. Commit only after the check is green.

If a pushed batch must be undone:

```bash
git revert <commit>
git push
```

## Priority Order

### Batch 1: Root Node API smoke coverage

Status: completed

- Goal:
  Lock down the current behavior of the root package Node-facing API.
- Files:
  - `tests/root-api.test.js`
- Verification:
  - `node ./tests/root-api.test.js`
  - `npm run validate`
- Rollback:
  - `git revert 61e015f`

### Batch 2: Runtime lifecycle coverage

Status: completed

- Goal:
  Add browser/runtime coverage for `mount`, `unmount`, and `updateProps`.
- Scope:
  - script re-activation
  - cleanup registration
  - event listener wrapping and release
  - timer cleanup
  - mutation observer cleanup
- Deliverables:
  - isolated runtime test harness
  - one runtime-focused test file
- Verification:
  - targeted runtime test command
  - `npm run validate`
- Rollback:
  - `git revert ed65add`

### Batch 3: Runtime module split

Status: completed

- Goal:
  Reduce risk in `index.js` by separating registry API and browser runtime code.
- Scope:
  - extract registry access helpers
  - extract mount/runtime helpers
  - keep public API stable
- Constraints:
  - no behavior changes unless forced by failing tests
- Verification:
  - root API tests
  - runtime tests
  - `npm run validate`
- Rollback:
  - `git revert 103c5a6`

### Batch 4: Encoding normalization

Status: partially completed

- Goal:
  Eliminate visible text corruption in docs, comments, and admin console UI.
- Scope:
  - `README.md`
  - root source comments
  - `tools/build-site/index.js`
- user-facing admin/control surfaces if they remain part of the repository
- Constraints:
  - text-only cleanup
  - no logic changes in the same commit
- Verification:
  - targeted text diff review
  - existing validation/test commands
- Rollback:
  - `git revert 5a6284c`

Current scope completed:

- added `.editorconfig` to standardize UTF-8 and newline defaults
- added `.gitattributes` to normalize text files to LF in Git
- corrected the root API mount example in `index.js`

Remaining scope:

- clean up user-facing text in the admin console and public-facing docs where
  needed, without overlapping unrelated in-progress work

### Batch 5: Root quality entrypoints

Status: completed

- Goal:
  Provide one stable entrypoint for root-library quality checks.
- Scope:
  - add root-level test/check scripts
  - keep package responsibilities explicit
- Verification:
  - `node tools/check-root/index.js`
  - existing MCP checks remain green
- Rollback:
  - `git revert 3620705`

### Batch 6: CI hardening

Status: partially completed

- Goal:
  Ensure the repository enforces validation automatically on remote changes.
- Scope:
  - root API tests
  - runtime tests
  - `npm run validate`
  - `npm run mcp:test`
- optional admin/control UI build smoke check if such a UI remains in-repo
- Constraints:
  - CI-only changes
  - do not mix with code refactors
- Verification:
  - local dry run of each command
  - workflow syntax review
- Rollback:
  - `git revert 6f03c15`

Current scope completed:

- added `.github/workflows/root-quality.yml`
- root workflow installs only root and runtime harness dependencies
- root workflow runs `node tools/check-root/index.js` on `main`, `master`, and
  `codex/**` pushes plus pull requests targeting `main` and `master`

Remaining scope:

- decide later whether MCP-specific checks should be merged into the new
  workflow or continue to live only in the existing CI pipeline

### Batch 7: Workspace and script consolidation

Status: partially completed

- Goal:
  Reduce coordination cost across the root package and other maintained
  subpackages.
- Scope:
  - review workspace migration feasibility
  - unify repetitive scripts
  - keep package boundaries explicit
- Constraints:
  - only start after tests and CI are stable
- Verification:
  - root checks
  - MCP tests
  - console build check
- Rollback:
  - `git revert 3d24927`

Current scope completed:

- added `docs/WORKSPACE-PLAN.md` to document the recommended migration path
- deferred npm workspace migration until root CI and package boundaries are
  stable enough to absorb lockfile and install-flow changes

Remaining scope:

- optional future script consolidation once the root `package.json` is no
  longer carrying unrelated in-progress changes

### Batch 8: Release smoke checks

Status: completed

- Goal:
  Ensure both publishable packages still produce sane npm pack output before
  release or tagging.
- Scope:
  - root package pack dry-run
  - MCP package pack dry-run
  - assert presence of critical published files
- Verification:
  - `node tools/release-smoke/index.js`
  - `node tools/check-root/index.js`
- Rollback:
  - `git revert a33645a`

Follow-up completed:

- `docs/PUBLISHING.md` now places root checks and release smoke checks ahead of
  the broader release flow
- `docs/TESTING.md` now points release work to `tools/release-smoke/index.js`

## Commit Message Policy

Use short conventional commit messages:

- `test(root): add node api smoke coverage`
- `test(runtime): cover mount lifecycle cleanup`
- `refactor(runtime): extract browser lifecycle helpers`
- `fix(encoding): normalize utf8 text assets`
- `build(root): add quality entrypoints`
- `ci(repo): enforce root and mcp validation`

## Staging Policy

Only stage files that belong to the current batch.

Examples:

```bash
git add tests/root-api.test.js
git add docs/OPTIMIZATION-ROADMAP.md
git add index.js lib/runtime.js tests/runtime-lifecycle.test.js
```

Avoid broad staging commands such as:

```bash
git add .
git add -A
```

## Completion Criteria

The optimization project is complete when:

1. Root API behavior is covered by executable tests.
2. Browser/runtime lifecycle is covered by executable tests.
3. `index.js` is no longer the single high-risk runtime bucket.
4. Text encoding issues are removed from user-facing surfaces.
5. Root checks and remote CI enforce the critical quality path.
