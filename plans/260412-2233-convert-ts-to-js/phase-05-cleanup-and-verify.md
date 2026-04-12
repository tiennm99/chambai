# Phase 5: Cleanup and Verification

## Priority: High | Status: Pending
## Depends On: Phases 1, 2, 3, 4

## Overview

Delete leftover TS artifacts, update docs, verify the app builds and runs.

## Implementation Steps

### 1. Delete `src/types/` directory

```bash
git rm -r src/types/
```

Files deleted:
- `src/types/index.ts` (shared interfaces)
- `src/types/opencv.ts` (OpenCV type declarations)

### 2. Verify no .ts/.tsx files remain

```bash
find src/ -name "*.ts" -o -name "*.tsx" | head -20
# Should return nothing
```

### 3. Verify no `import type` or TS syntax remains

```bash
grep -r "import type" src/ || echo "Clean"
grep -rn ": [A-Z][a-zA-Z]*[^=]" src/ --include="*.js" --include="*.jsx" | head -20
# Manual review of any hits — some may be legitimate JS (object properties)
```

### 4. Run build

```bash
npm run build
```

Fix any errors. Common issues:
- Missed type annotation → syntax error pointing to exact line
- Broken import path → module not found error

### 5. Run dev server smoke test

```bash
npm run dev
# Open http://localhost:3000 and verify page loads
```

### 6. Run lint

```bash
npm run lint
```

### 7. Update README.md

- Change "Next.js 15 with TypeScript" to "Next.js 15"
- Remove TypeScript interface examples from Data Structure section, or convert to JSDoc comments
- Update Project Structure to show `.jsx`/`.js` extensions

## Todo List

- [ ] Delete `src/types/` directory
- [ ] Verify no TS files remain
- [ ] Verify no TS syntax remains in JS files
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run dev` starts and page loads
- [ ] Update README.md

## Success Criteria

- Zero `.ts`/`.tsx` files in project (except node_modules)
- `npm run build` exits 0
- `npm run dev` serves the app
- `npm run lint` passes
- README reflects JS stack

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Build fails from missed conversion | Error messages point to exact file:line, fix iteratively |
| Lint rules incompatible | Already removed `next/typescript` in Phase 1 |
