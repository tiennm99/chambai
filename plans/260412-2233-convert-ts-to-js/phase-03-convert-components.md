# Phase 3: Convert Components (.tsx to .jsx)

## Priority: High | Status: Pending

## Overview

Convert all 5 React component files from TypeScript JSX to plain JSX. These files contain JSX + type annotations.

## Key Insights

- Components use `import type` from `@/types` — remove entirely
- Some components define inline prop types or use TS interfaces — remove
- React event handler types (e.g., `React.ChangeEvent<HTMLInputElement>`) must be stripped
- State hooks with generic types like `useState<TestConfig>()` — remove the generic

## Related Code Files

**Convert (rename .tsx to .jsx, strip types):**
- `src/components/ConfigurationPage.tsx` → `src/components/ConfigurationPage.jsx`
- `src/components/ImageProcessor.tsx` → `src/components/ImageProcessor.jsx`
- `src/components/Navigation.tsx` → `src/components/Navigation.jsx`
- `src/components/ResultsPage.tsx` → `src/components/ResultsPage.jsx`
- `src/components/UploadPage.tsx` → `src/components/UploadPage.jsx`

## Implementation Steps

For each component file, apply these transformations:

### 1. Remove `import type` statements

```tsx
// DELETE:
import type { TestConfig } from '@/types';
```

### 2. Remove prop type definitions

```tsx
// Before:
interface ConfigurationPageProps {
  config: TestConfig;
  onSave: (config: TestConfig) => void;
}
export default function ConfigurationPage({ config, onSave }: ConfigurationPageProps) {
// After:
export default function ConfigurationPage({ config, onSave }) {
```

### 3. Remove useState generics

```tsx
// Before:
const [config, setConfig] = useState<TestConfig>(initialConfig);
// After:
const [config, setConfig] = useState(initialConfig);
```

### 4. Remove event handler type annotations

```tsx
// Before:
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// After:
const handleChange = (e) => {
```

### 5. Remove type assertions and other TS syntax

Same rules as Phase 2 — strip `as Type`, `: Type`, generic params.

### 6. Rename files

```bash
git mv src/components/ConfigurationPage.tsx src/components/ConfigurationPage.jsx
git mv src/components/ImageProcessor.tsx src/components/ImageProcessor.jsx
git mv src/components/Navigation.tsx src/components/Navigation.jsx
git mv src/components/ResultsPage.tsx src/components/ResultsPage.jsx
git mv src/components/UploadPage.tsx src/components/UploadPage.jsx
```

## Todo List

- [ ] Convert `ConfigurationPage.tsx`
- [ ] Convert `ImageProcessor.tsx`
- [ ] Convert `Navigation.tsx`
- [ ] Convert `ResultsPage.tsx`
- [ ] Convert `UploadPage.tsx`

## Success Criteria

- No `.tsx` files remain in `src/components/`
- All components render without errors
- No TypeScript syntax in any `.jsx` file

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Inline interface removal breaks destructuring | Only remove type annotations, keep destructuring patterns |
| Missed generic on useState causes runtime issue | Generics are compile-time only; removal is safe |
