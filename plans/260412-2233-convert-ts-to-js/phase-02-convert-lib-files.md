# Phase 2: Convert Library Files (.ts to .js)

## Priority: High | Status: Pending

## Overview

Convert all 6 files in `src/lib/` from TypeScript to JavaScript. These are pure logic files (no JSX).

## Key Insights

- All files import types from `@/types` and `@/types/opencv` — these `import type` lines must be **removed entirely** (not converted)
- Type annotations on function params, return types, variable declarations must be stripped
- No TS enums or complex generics found — straightforward removal
- Some files use `as` type assertions — remove them

## Related Code Files

**Convert (rename .ts to .js, strip types):**
- `src/lib/image-preprocessing.ts` → `src/lib/image-preprocessing.js`
- `src/lib/marker-detection.ts` → `src/lib/marker-detection.js`
- `src/lib/bubble-grid-generator.ts` → `src/lib/bubble-grid-generator.js`
- `src/lib/answer-detection.ts` → `src/lib/answer-detection.js`
- `src/lib/debug-visualization.ts` → `src/lib/debug-visualization.js`
- `src/lib/scoring.ts` → `src/lib/scoring.js`

## Implementation Steps

For each file, apply these transformations:

### 1. Remove all `import type` statements

```ts
// DELETE these lines entirely:
import type { OpenCVMat } from '@/types/opencv';
import type { Bubble, TrueFalseAnswer } from '@/types';
```

### 2. Remove type annotations from function parameters

```ts
// Before:
function processImage(src: OpenCVMat, threshold: number): OpenCVMat {
// After:
function processImage(src, threshold) {
```

### 3. Remove return type annotations

```ts
// Before:
export function detectMarkers(gray: OpenCVMat): MarkerDetectionResult {
// After:
export function detectMarkers(gray) {
```

### 4. Remove variable type annotations

```ts
// Before:
const result: MarkerDetectionResult = { ... };
// After:
const result = { ... };
```

### 5. Remove type assertions (`as Type`)

```ts
// Before:
const cv = window.cv as OpenCV;
// After:
const cv = window.cv;
```

### 6. Remove generic type parameters

```ts
// Before:
const answers: Array<TrueFalseAnswer> = [];
// After:
const answers = [];
```

### 7. Rename files

```bash
git mv src/lib/image-preprocessing.ts src/lib/image-preprocessing.js
git mv src/lib/marker-detection.ts src/lib/marker-detection.js
git mv src/lib/bubble-grid-generator.ts src/lib/bubble-grid-generator.js
git mv src/lib/answer-detection.ts src/lib/answer-detection.js
git mv src/lib/debug-visualization.ts src/lib/debug-visualization.js
git mv src/lib/scoring.ts src/lib/scoring.js
```

## Todo List

- [ ] Convert `image-preprocessing.ts`
- [ ] Convert `marker-detection.ts`
- [ ] Convert `bubble-grid-generator.ts`
- [ ] Convert `answer-detection.ts`
- [ ] Convert `debug-visualization.ts`
- [ ] Convert `scoring.ts`

## Success Criteria

- No `.ts` files remain in `src/lib/`
- No TypeScript syntax in any `.js` file
- All exports preserved (same function names, same default values)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Accidental logic removal when stripping types | Only remove type syntax, preserve all runtime code |
| Missed type annotation causes syntax error | `npm run build` in Phase 5 catches this |
