# Phase 4: Convert App Files (.tsx to .jsx)

## Priority: High | Status: Pending

## Overview

Convert the 2 Next.js app directory files from TypeScript to JavaScript.

## Related Code Files

**Convert:**
- `src/app/layout.tsx` → `src/app/layout.jsx`
- `src/app/page.tsx` → `src/app/page.jsx`

## Implementation Steps

### 1. Convert `layout.tsx`

Likely contains:
- `import type { Metadata } from 'next'` — remove
- Type annotation on props — remove
- `metadata` export with `Metadata` type — keep export, remove type

```tsx
// Before:
import type { Metadata } from "next";
export const metadata: Metadata = { ... };
export default function RootLayout({ children }: { children: React.ReactNode }) {
// After:
export const metadata = { ... };
export default function RootLayout({ children }) {
```

### 2. Convert `page.tsx`

Strip any type annotations, `import type` lines. Keep all JSX and logic intact.

### 3. Rename files

```bash
git mv src/app/layout.tsx src/app/layout.jsx
git mv src/app/page.tsx src/app/page.jsx
```

## Todo List

- [ ] Convert `layout.tsx`
- [ ] Convert `page.tsx`

## Success Criteria

- No `.tsx` files remain in `src/app/`
- Next.js recognizes `.jsx` layout and page files

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Next.js not picking up `.jsx` in app dir | Next.js supports .jsx natively in app router |
