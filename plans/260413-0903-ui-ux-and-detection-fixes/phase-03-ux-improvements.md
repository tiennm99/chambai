# Phase 3: UX Improvements (P1)

## Context

- [Review report](../reports/ui-ux-review-260413-0856-answer-sheet-analysis.md)
- [Plan overview](./plan.md)

## Overview

- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h
- **Dependencies**: Phase 1 (IndexedDB store established; localStorage pattern understood)
- **Blocks**: Phase 4 (workflow features use lifted state)

## Key Issues

1. **No shared state** - Each page reads/writes localStorage independently, causing sync bugs
2. **No keyboard navigation** for Phan I - 40 answers require 40+ mouse clicks
3. **Upload tab accessible without config** - Teachers can process images with no answer key
4. **No step-completion indicators** - Teachers don't know which steps are done
5. **Save/Reset buttons at top** of ConfigurationPage - Must scroll up after filling answers
6. **Status messages auto-dismiss in 3s** - Too fast for target users

## Architecture

### State Lifting Design

Currently each page reads from localStorage on mount. After lifting:

```
page.jsx (Home)
  state: { config, results, configSaved }
  |
  ├── Navigation  (receives: configSaved, hasResults)
  ├── ConfigurationPage  (receives: config, onConfigChange, onSave, onReset)
  ├── UploadPage  (receives: config, onResultsAdd)
  └── ResultsPage  (receives: results, config, onResultsUpdate, onResultsClear)
```

**Data flow:**
- `config` flows down from Home -> all pages
- `onConfigChange` bubbles up from ConfigPage -> Home (updates state + localStorage)
- `onResultsAdd` bubbles up from UploadPage -> Home (merges results + saves)
- `onResultsUpdate` bubbles up from ResultsPage -> Home (for manual corrections in Phase 4)
- `configSaved` boolean: true when config has been saved at least once

**Migration:** On mount, Home reads both `testConfig` and `studentResults` from localStorage. Pages no longer read localStorage directly.

## Related Code Files

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/page.jsx` | Lift config + results state; pass as props; load from localStorage on mount |
| `src/components/Navigation.jsx` | Accept `configSaved` + `hasResults` props; show completion indicators; disable Upload when no config |
| `src/components/ConfigurationPage.jsx` | Accept config/callbacks as props; move Save/Reset to sticky bottom; add keyboard nav for Phan I; increase status message timeout |
| `src/components/UploadPage.jsx` | Accept config prop instead of reading localStorage; accept `onResultsAdd` callback |
| `src/components/ResultsPage.jsx` | Accept results + config as props instead of reading localStorage |

## Implementation Steps

### 1. Lift state to `page.jsx`

```jsx
export default function Home() {
  const [currentPage, setCurrentPage] = useState('config');
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState([]);
  const [configSaved, setConfigSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('testConfig');
    const savedResults = localStorage.getItem('studentResults');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
      setConfigSaved(true);
    }
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
  }, []);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    setConfigSaved(true);
    localStorage.setItem('testConfig', JSON.stringify(newConfig));
  };

  const handleResultsAdd = (newResults) => {
    setResults(prev => {
      const merged = [...prev, ...newResults];
      localStorage.setItem('studentResults', JSON.stringify(merged));
      return merged;
    });
  };

  const handleResultsClear = () => {
    setResults([]);
    localStorage.removeItem('studentResults');
  };

  const handleResetAll = () => {
    setConfig(null);
    setResults([]);
    setConfigSaved(false);
    localStorage.clear();
  };
  // ... pass these to child components
}
```

### 2. Update Navigation.jsx - completion indicators + guard

```jsx
export default function Navigation({ currentPage, onPageChange, configSaved, hasResults }) {
  const buttons = [
    { key: 'config', label: '1. Cau hinh de thi', done: configSaved },
    { key: 'upload', label: '2. Tai va xu ly anh', done: hasResults, disabled: !configSaved },
    { key: 'results', label: '3. Ket qua', done: false, disabled: !hasResults },
  ];
```

- Show green checkmark icon when `done` is true
- When `disabled`, use `cursor-not-allowed` + `opacity-50` + show tooltip: "Vui long luu cau hinh truoc"
- Prevent `onPageChange` call when disabled

### 3. Update ConfigurationPage.jsx

**a) Accept props instead of localStorage:**
```jsx
export default function ConfigurationPage({ config: initialConfig, onSave, onReset }) {
  const [config, setConfig] = useState(initialConfig || DEFAULT_CONFIG);
  // Remove useEffect that reads localStorage
  // saveConfig calls onSave(config) instead of localStorage.setItem
}
```

**b) Move Save/Reset to sticky bottom bar:**
```jsx
// Remove buttons from top of page
// Add at bottom:
<div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 flex gap-3">
  <button onClick={() => onSave(config)} ...>Luu cau hinh</button>
  <button onClick={onReset} ...>Xoa tat ca du lieu</button>
</div>
```

**c) Add keyboard navigation for Phan I:**

Wrap Phan I grid items in a component that:
- On key press `A/B/C/D` (case insensitive): set answer for current question, auto-advance focus to next question
- On `Backspace`: clear current answer, move focus to previous question
- On `ArrowDown/ArrowRight`: advance to next question
- On `ArrowUp/ArrowLeft`: go to previous question
- Each question row gets `tabIndex={0}` and a ref for focus management

```jsx
const questionRefs = useRef([]);

const handlePhanIKeyDown = (index, e) => {
  const key = e.key.toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(key)) {
    updatePhanIAnswer(index, key);
    // Auto-advance
    if (index < config.phanI.questionCount - 1) {
      questionRefs.current[index + 1]?.focus();
    }
  } else if (e.key === 'Backspace') {
    updatePhanIAnswer(index, '');
    if (index > 0) questionRefs.current[index - 1]?.focus();
  }
  // Arrow keys for navigation
};
```

**d) Increase status message timeout from 3s to 5s.**

### 4. Update UploadPage.jsx

- Accept `config` prop (used to check config exists before processing)
- Accept `onResultsAdd` callback
- Remove `localStorage.getItem('testConfig')` call
- In `processImages`: call `onResultsAdd(resultsRef.current)` instead of writing localStorage directly
- The parent (Home) handles localStorage persistence

### 5. Update ResultsPage.jsx

- Accept `results` and `config` props
- Remove `useEffect` that reads localStorage
- Accept `onResultsClear` callback for the clear button
- `clearResults` calls `onResultsClear()` instead of `localStorage.removeItem`

## Todo List

- [ ] Lift config + results state to page.jsx
- [ ] Pass config/results/callbacks as props to all child pages
- [ ] Remove all direct localStorage reads from ConfigurationPage, UploadPage, ResultsPage
- [ ] Add completion indicators (checkmarks) to Navigation buttons
- [ ] Disable Upload tab when config not saved (with tooltip)
- [ ] Move Save/Reset buttons to sticky bottom bar in ConfigurationPage
- [ ] Add keyboard navigation for Phan I (A/B/C/D keys + arrow keys + backspace)
- [ ] Increase status message timeout from 3s to 5s
- [ ] Verify: changing config in ConfigPage immediately reflects in UploadPage processing
- [ ] Verify: results added in UploadPage immediately visible in ResultsPage tab

## Success Criteria

1. No direct localStorage reads in child components (all state flows from parent)
2. Type A/B/C/D on keyboard to set Phan I answer and auto-advance to next question
3. Upload tab visually disabled (grayed out + tooltip) when config not saved
4. Green checkmark appears on Config tab after saving, on Upload tab after processing
5. Save/Reset buttons visible at bottom of ConfigurationPage without scrolling

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| State lifting breaks page isolation | Medium | Medium | Props match current data shapes; pages still manage local UI state |
| Keyboard nav conflicts with browser shortcuts | Low | Low | Only capture A/B/C/D/arrows when Phan I grid is focused |
| ConfigurationPage exceeds 200 line limit after changes | Medium | Low | Extract PhanI keyboard grid into `src/components/phan-i-answer-grid.jsx` |

## File Size Management

Current line counts:
- `page.jsx`: 48 lines -> ~80 after lifting (OK)
- `Navigation.jsx`: 32 lines -> ~60 after indicators (OK)
- `ConfigurationPage.jsx`: 279 lines -> will EXCEED 200. Extract:
  - `src/components/phan-i-answer-grid.jsx` (~80 lines) - keyboard-navigable Phan I grid
  - `src/components/scoring-config-panel.jsx` (~40 lines) - scoring inputs
- `UploadPage.jsx`: 294 lines -> already over 200. Extract:
  - `src/components/image-thumbnail.jsx` (~30 lines) - thumbnail component (also fixes the useState bug from Phase 1)
- `ResultsPage.jsx`: 345 lines -> extract:
  - `src/components/student-detail-modal.jsx` (~100 lines) - modal component

## Security Considerations

- No new attack surface
- Config validation: ensure questionCount is within sane bounds before saving (already present with min/max on inputs)
