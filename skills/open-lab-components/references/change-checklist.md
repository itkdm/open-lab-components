# Change Checklist

## Before Editing

- Inspect a similar component or existing runtime pattern
- Confirm whether the task is component-local or project-wide
- Prefer compatibility over broad rewrites

## During Editing

- Keep manifest, runtime, registry, and site assumptions aligned
- Keep styles local and avoid global leakage
- Preserve event names and payload shape unless the task says otherwise
- Prefer explicit cleanup for high-risk interactive components

## Before Finishing

Run:

```powershell
npm run validate
npm run build:registry
npm run check:registry
npm run build:site
```

Then verify:

- `events` are present in `registry.json` when declared in the component manifest
- type definitions still match exported runtime behavior
- site pages still consume registry fields correctly
- no unrelated user changes were reverted

## Reporting

Mention:

- what changed
- what was verified
- any browser-side testing that was not performed
- any intentionally untouched files or existing worktree changes
