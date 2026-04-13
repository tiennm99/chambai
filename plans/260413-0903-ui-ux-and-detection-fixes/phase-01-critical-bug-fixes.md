# Phase 1: Critical Bug Fixes (P0)

## Context

- [Review report](../reports/ui-ux-review-260413-0856-answer-sheet-analysis.md)
- [Plan overview](./plan.md)

## Overview

- **Priority**: P0
- **Status**: Pending
- **Effort**: 2h
- **Blocks**: Phase 3 (state lifting replaces localStorage pattern established here)

## Key Issues

1. **localStorage race condition** - `setTimeout(100)` in UploadPage.jsx:99-104 to save results. State may not have settled; results silently lost.
2. **`useState` misused as `useEffect`** - ImageThumbnail (UploadPage.jsx:271-275) uses `useState(() => {...})` to create object URLs. Never updates on prop change, never revokes old URLs = memory leak.
3. **localStorage overflow** - Debug image data URLs (~1-2MB each) stored in `studentResults`. 50+ students = blown 5MB localStorage limit.

## Architecture

### Data Flow (After Fix)

```
processImages loop
  -> handleProcessingComplete collects result in resultsRef (not state)
  -> loop ends
  -> finally block: write resultsRef.current to localStorage (scores only)
  -> finally block: write debug images to IndexedDB via indexed-db-store.js
  -> update React state from ref

ImageThumbnail
  -> useEffect(file): create objectURL, return cleanup that revokes it
  -> on file prop change: old URL revoked, new URL created
```

## Related Code Files

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/UploadPage.jsx` | Fix race condition with ref-based result collection; fix ImageThumbnail useEffect |
| `src/components/ImageProcessor.jsx` | Separate debugImageUrl from result object before returning |

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/indexed-db-store.js` | IndexedDB wrapper for debug images (put/get/delete/clear) |

## Implementation Steps

### 1. Create `src/lib/indexed-db-store.js` (~60 lines)

Simple IndexedDB wrapper. Single object store `debugImages` keyed by student result ID.

```js
// API:
// openDB() -> Promise<IDBDatabase>
// saveDebugImage(id: string, dataUrl: string) -> Promise<void>
// getDebugImage(id: string) -> Promise<string|null>
// deleteDebugImage(id: string) -> Promise<void>
// clearDebugImages() -> Promise<void>
```

- DB name: `chambai`
- Store name: `debugImages`
- Key path: `id`
- Version: 1

### 2. Fix localStorage race condition in UploadPage.jsx

**Current code (lines 86-114):**
```js
// Uses setTimeout(100) + setState callback to read final results
setTimeout(() => {
  setProcessedResults((current) => {
    localStorage.setItem('studentResults', JSON.stringify([...finalResults, ...current]));
    return current;
  });
}, 100);
```

**Fix:** Use a ref to accumulate results during processing loop.

Changes to `UploadPage.jsx`:
- Add `const resultsRef = useRef([])` at component top
- In `handleProcessingComplete`: push to `resultsRef.current` (in addition to `setProcessedResults`)
- In `processImages`, after the for-loop completes:
  - Strip `debugImageUrl` from each result before localStorage save
  - Save debug images to IndexedDB via `saveDebugImage(result.id, result.debugImageUrl)`
  - Merge with existing results and write to localStorage synchronously (no setTimeout)
  - Reset `resultsRef.current = []`

```js
// In finally block or after loop:
const existing = JSON.parse(localStorage.getItem('studentResults') || '[]');
const toSave = resultsRef.current.map(r => {
  const { debugImageUrl, ...rest } = r;
  return rest;
});
localStorage.setItem('studentResults', JSON.stringify([...existing, ...toSave]));

// Save debug images to IndexedDB
for (const r of resultsRef.current) {
  if (r.debugImageUrl) {
    await saveDebugImage(r.id, r.debugImageUrl);
  }
}
resultsRef.current = [];
```

### 3. Fix ImageThumbnail memory leak (UploadPage.jsx:267-294)

**Current (broken):**
```js
function ImageThumbnail({ file, index, onRemove }) {
  const [src, setSrc] = useState('');
  useState(() => {  // <-- misused! This is NOT useEffect
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url); // return value ignored
  });
```

**Fix:**
```js
function ImageThumbnail({ file, index, onRemove }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
```

Add `useEffect` to the import list at top of file.

### 4. Update ResultsPage.jsx to load debug images from IndexedDB

When opening StudentDetailModal, load debug image from IndexedDB:

```js
// In StudentDetailModal, add:
const [debugImageUrl, setDebugImageUrl] = useState(null);
useEffect(() => {
  getDebugImage(student.id).then(url => setDebugImageUrl(url));
}, [student.id]);
```

### 5. Update ImageProcessor.jsx - no debugImageUrl in result

In `runDetectionPipeline`, return debugImageUrl separately (already done), but ensure the `onProcessingComplete` callback receives it as a separate field that UploadPage can handle independently.

No change needed here - current code already passes `debugImageUrl` in the result object. The separation happens in UploadPage step 2.

## Todo List

- [ ] Create `src/lib/indexed-db-store.js` with put/get/delete/clear API
- [ ] Fix UploadPage.jsx: add resultsRef, remove setTimeout hack, save to IndexedDB
- [ ] Fix UploadPage.jsx: change ImageThumbnail `useState` -> `useEffect` with cleanup
- [ ] Add `useEffect` to UploadPage import statement
- [ ] Update ResultsPage.jsx StudentDetailModal to load debug images from IndexedDB
- [ ] Update ResultsPage clearResults to also call `clearDebugImages()`
- [ ] Test: process 5+ images, verify all results saved, verify debug images load in detail modal
- [ ] Test: verify no object URL memory leaks (check browser devtools)

## Success Criteria

1. Process 50+ images without localStorage overflow error
2. All results persisted after processing completes (no silent data loss)
3. Debug images viewable in StudentDetailModal (loaded from IndexedDB)
4. No object URL memory leaks in ImageThumbnail on re-render
5. `localStorage.getItem('studentResults')` contains no data URL strings

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| IndexedDB not available in old browsers | Feature-detect; fallback to not saving debug images (scores still saved to localStorage) |
| Existing localStorage data has embedded debug URLs | Migration: on first load, if results contain `debugImageUrl`, extract to IndexedDB and re-save without them |

## Security Considerations

- No auth concerns (client-only app)
- IndexedDB is same-origin scoped, no cross-site risk
- Debug images are transient; no PII beyond student ID numbers visible on sheet
