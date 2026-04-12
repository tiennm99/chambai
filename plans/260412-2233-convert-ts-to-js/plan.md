---
title: "Convert TypeScript to JavaScript"
description: "Remove TypeScript from Next.js project, convert all .ts/.tsx files to .js/.jsx"
status: pending
priority: P2
effort: 2h
branch: main
tags: [migration, typescript, javascript]
created: 2026-04-12
---

# Convert TypeScript to JavaScript

## Summary

Mechanical conversion: strip all TS annotations, rename files, update configs. No logic changes.

## Data Flow

```
.ts/.tsx files --> remove type annotations --> rename to .js/.jsx
tsconfig.json --> DELETE
next.config.ts --> convert to next.config.mjs (plain JS)
package.json --> remove @types/* and typescript deps
eslint.config.mjs --> remove "next/typescript" extend
src/types/ --> DELETE entirely
```

## Phases

| # | Phase | Files Touched | Status |
|---|-------|--------------|--------|
| 1 | [Config changes](phase-01-config-changes.md) | package.json, tsconfig.json, next.config.ts, eslint.config.mjs, next-env.d.ts | Pending |
| 2 | [Convert lib files](phase-02-convert-lib-files.md) | src/lib/*.ts (6 files) | Pending |
| 3 | [Convert components](phase-03-convert-components.md) | src/components/*.tsx (5 files) | Pending |
| 4 | [Convert app files](phase-04-convert-app-files.md) | src/app/layout.tsx, src/app/page.tsx | Pending |
| 5 | [Cleanup and verify](phase-05-cleanup-and-verify.md) | src/types/ (delete), jsconfig.json (create), README.md | Pending |

## Dependency Graph

Phase 1 (config) has no blockers.
Phases 2, 3, 4 can run in parallel after Phase 1 (no shared files).
Phase 5 depends on all of 1-4 completing.

```
Phase 1 --> Phase 2 --|
         \-> Phase 3 --|--> Phase 5
         \-> Phase 4 --|
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Broken imports after rename | Low | High | Phase 5 runs `npm run build` to catch |
| `next.config.ts` rename breaks Next.js | Low | High | Next.js supports `.mjs` natively |
| Missing type-as-value usage (enums) | Very Low | Medium | No TS enums in codebase (verified) |
| `opencv-ts` package requires TS | Low | Low | It's a runtime lib, works without TS |

## Rollback Plan

Git commit before starting. Single `git checkout .` reverts everything.

## Success Criteria

- [x] `npm run build` passes with zero errors
- [x] `npm run dev` starts successfully
- [x] No `.ts` or `.tsx` files remain in `src/`
- [x] No `typescript` or `@types/*` in package.json
- [x] No `tsconfig.json` in project root
- [x] `jsconfig.json` preserves `@/*` path alias
