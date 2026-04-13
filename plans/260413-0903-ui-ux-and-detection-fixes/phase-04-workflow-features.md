# Phase 4: Workflow Features (P2)

## Context

- [Review report](../reports/ui-ux-review-260413-0856-answer-sheet-analysis.md)
- [Plan overview](./plan.md)

## Overview

- **Priority**: P2
- **Status**: Pending
- **Effort**: 3h
- **Dependencies**: Phase 3 (lifted state, extracted components)

## Key Features

1. **Manual answer correction** in StudentDetailModal - teachers fix OCR errors
2. **Paste-from-spreadsheet** for Phan I answers - accept tab/comma-separated string
3. **Class summary statistics** - mean, median, score distribution
4. **Vietnamese debug legend** - translate English labels to Vietnamese

## Related Code Files

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/student-detail-modal.jsx` | Add edit mode for manual answer correction |
| `src/components/ConfigurationPage.jsx` | Add paste handler for Phan I bulk input |
| `src/components/ResultsPage.jsx` | Add statistics summary panel |
| `src/lib/debug-visualization.js` | Translate legend labels to Vietnamese |

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/statistics.js` | Calculate class statistics (mean, median, distribution buckets) |

## Implementation Steps

### 1. Manual answer correction in StudentDetailModal

Add an "edit mode" toggle to the extracted `student-detail-modal.jsx`:

```jsx
const [editing, setEditing] = useState(false);
const [editedResult, setEditedResult] = useState(null);

const startEdit = () => {
  setEditing(true);
  setEditedResult({ ...student });
};

const saveEdit = () => {
  onResultUpdate(editedResult);  // callback from parent via ResultsPage
  setEditing(false);
};
```

In edit mode:
- **Phan I**: Each answer cell becomes clickable A/B/C/D buttons (reuse phan-i-answer-grid pattern)
- **Phan II**: Dung/Sai buttons become toggleable
- **Phan III**: Text input fields for each answer
- Show "Sua" (Edit) button in modal header; when editing, show "Luu" (Save) and "Huy" (Cancel)

**Data flow:**
```
StudentDetailModal -> onResultUpdate(editedStudent)
  -> ResultsPage -> onResultsUpdate(updatedResults)
    -> Home -> setResults + localStorage.setItem
```

### 2. Paste-from-spreadsheet for Phan I

Add a paste zone above the Phan I answer grid in ConfigurationPage:

```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Dan dap an tu Excel (cach boi dau phay hoac tab):
  </label>
  <input
    type="text"
    placeholder="VD: A,B,C,D,A,B,C,D,..."
    onPaste={handlePasteAnswers}
    onChange={handlePasteInput}
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
  />
</div>
```

Parse logic:
```js
const handlePasteAnswers = (e) => {
  const text = (e.clipboardData?.getData('text') || '').trim();
  // Split by comma, tab, newline, or space
  const answers = text.split(/[,\t\n\s]+/)
    .map(s => s.trim().toUpperCase())
    .filter(s => ['A', 'B', 'C', 'D'].includes(s));

  if (answers.length > 0) {
    const newConfig = { ...config };
    newConfig.phanI.answers = answers.slice(0, config.phanI.questionCount);
    setConfig(newConfig);
    showStatus('success', `Da dan ${answers.length} dap an Phan I`);
    e.preventDefault();
  }
};
```

### 3. Class summary statistics

Create `src/lib/statistics.js` (~50 lines):

```js
/**
 * Calculate class summary statistics from scored results.
 * @param {Array<{score: {total: number, percentage: number}}>} results
 * @returns {{ mean: number, median: number, min: number, max: number, distribution: Record<string, number> }}
 */
export function calculateClassStatistics(results) {
  if (results.length === 0) return null;

  const scores = results.map(r => r.score?.total ?? 0).sort((a, b) => a - b);
  const percentages = results.map(r => r.score?.percentage ?? 0);

  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / scores.length;
  const median = scores.length % 2 === 0
    ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
    : scores[Math.floor(scores.length / 2)];

  // Distribution buckets by percentage: 0-20, 20-40, 40-60, 60-80, 80-100
  const distribution = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
  for (const pct of percentages) {
    if (pct < 20) distribution['0-20']++;
    else if (pct < 40) distribution['20-40']++;
    else if (pct < 60) distribution['40-60']++;
    else if (pct < 80) distribution['60-80']++;
    else distribution['80-100']++;
  }

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: scores[0],
    max: scores[scores.length - 1],
    count: scores.length,
    distribution,
  };
}
```

Add statistics panel to ResultsPage above the table:

```jsx
{results.length > 0 && (
  <StatisticsSummary results={sortedResults} />
)}
```

Display as a grid of cards:
- Si so: N
- Diem TB: mean
- Trung vi: median
- Cao nhat / Thap nhat
- Simple bar chart of distribution (CSS-only, no chart library)

### 4. Vietnamese debug legend

Update `debug-visualization.js` `drawLegend` function:

```js
const entries = [
  { color: COLORS.allPositions, label: 'Tat ca vi tri' },
  { color: COLORS.studentId, label: 'So bao danh' },
  { color: COLORS.examCode, label: 'Ma de thi' },
  { color: COLORS.correct, label: 'Dung' },
  { color: COLORS.wrong, label: 'Sai' },
];
```

Also update the legend title from 'Debug Legend' to 'Chu thich'.

## Todo List

- [ ] Add edit mode to student-detail-modal.jsx (toggle editing, save/cancel)
- [ ] Wire onResultUpdate callback through ResultsPage -> Home
- [ ] Add paste input zone in ConfigurationPage for Phan I bulk answers
- [ ] Implement paste parsing (comma/tab/newline/space delimited, validate A/B/C/D)
- [ ] Create `src/lib/statistics.js` with calculateClassStatistics
- [ ] Add StatisticsSummary component to ResultsPage (inline, not separate file unless >50 lines)
- [ ] Translate debug-visualization.js legend to Vietnamese
- [ ] Test: paste "A,B,C,D,A,B,C,D" fills first 8 answers correctly
- [ ] Test: edit Phan I answer in modal, verify score recalculates
- [ ] Test: statistics show correct mean/median for 5+ results

## Success Criteria

1. Teachers can click "Sua" in detail modal, change any answer, save, see updated score
2. Paste "A,B,C,D..." from Excel into Phan I input fills all answer buttons
3. Statistics panel shows mean, median, min/max, distribution for class
4. Debug legend shows Vietnamese labels ("So bao danh", "Ma de thi", "Dung", "Sai")

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Paste format varies across Excel versions / locales | Medium | Low | Support multiple delimiters (comma, tab, newline, space) |
| Manual correction without audit trail | Low | Medium | Future: add edit history. For now, teachers accept this trade-off |
| Statistics calculation wrong for edge cases | Low | Low | Handle empty results, single result, all-same-score |

## Security Considerations

- Paste input sanitized: only accept characters matching A/B/C/D
- Manual edits validated against allowed answer formats before saving
- No external data transmitted
