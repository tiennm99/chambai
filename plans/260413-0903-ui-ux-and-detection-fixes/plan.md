---
title: "UI/UX & Detection Pipeline Fixes"
description: "Fix critical bugs, correct sheet layout coordinates, add perspective correction, and improve UX for Vietnamese THPT answer sheet scoring app"
status: pending
priority: P1
effort: 12h
branch: main
tags: [bugfix, detection, ux, opencv]
created: 2026-04-13
---

# UI/UX & Detection Pipeline Fixes

## Context

Review report: `plans/reports/ui-ux-review-260413-0856-answer-sheet-analysis.md`

The chambai app scores Vietnamese THPT answer sheets using OpenCV.js. Three categories of issues were found: critical bugs (data loss), wrong detection coordinates, and UX friction for teachers.

## Phase Overview

| Phase | Focus | Effort | Files Modified | Status |
|-------|-------|--------|----------------|--------|
| [Phase 1](./phase-01-critical-bug-fixes.md) | P0 critical bugs (data loss, memory leak, storage overflow) | 2h | UploadPage.jsx, ImageProcessor.jsx, new: lib/indexed-db-store.js | Pending |
| [Phase 2](./phase-02-detection-pipeline-fixes.md) | Sheet layout coordinates + perspective correction + Phan III model | 4h | bubble-grid-generator.js, marker-detection.js, answer-detection.js, types.js | Pending |
| [Phase 3](./phase-03-ux-improvements.md) | State lifting, keyboard nav, navigation guards, sticky buttons | 3h | page.jsx, Navigation.jsx, ConfigurationPage.jsx, UploadPage.jsx, ResultsPage.jsx | Pending |
| [Phase 4](./phase-04-workflow-features.md) | Manual correction, paste-import, class statistics, Vietnamese debug legend | 3h | ResultsPage.jsx, ConfigurationPage.jsx, debug-visualization.js, new: lib/statistics.js | Pending |

## Dependency Graph

```
Phase 1 (bugs) ──> Phase 3 (UX - depends on state lifting which replaces localStorage pattern)
Phase 2 (detection) ──> independent, can parallel with Phase 1
Phase 3 (UX) ──> Phase 4 (workflow features use lifted state)
```

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sheet layout coordinates still wrong after fix | Medium | High | Must test with real CV1239 scan images; keep coordinates in a single constant for easy tuning |
| IndexedDB migration breaks existing localStorage data | Low | High | Phase 1 includes migration function; read from both stores, write to IndexedDB |
| Perspective correction degrades already-straight images | Low | Medium | Only apply when 4 markers detected AND skew angle > 2 degrees |
| State lifting breaks existing page isolation | Medium | Medium | Phase 3 lifts incrementally; each page still receives props matching its current interface |

## Rollback Strategy

- Each phase is a separate commit (or PR)
- Phase 1: revert to setTimeout-based save (lossy but functional)
- Phase 2: old SHEET_LAYOUT values are documented in phase file for revert
- Phase 3: revert state to localStorage-per-page pattern
- Phase 4: purely additive features, safe to revert

## Success Criteria

1. **Phase 1**: No data loss after processing 50+ images; no object URL memory leaks; IndexedDB stores debug images
2. **Phase 2**: Student ID and Exam Code detected correctly on straight CV1239 scans; Phan III returns multi-character answers
3. **Phase 3**: Keyboard-driven Phan I input; Upload tab blocked without config; step indicators visible
4. **Phase 4**: Teachers can correct answers in results modal; paste 40 answers from spreadsheet
