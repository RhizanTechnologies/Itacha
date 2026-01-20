# Documentation

This directory contains all documentation for the Ithaca UI project, including guides, audits, and reference materials.

## Structure

```
docs/
├── README.md (this file)
├── performance-audit/
│   ├── README.md
│   ├── ANIMATION_PERFORMANCE_AUDIT_FIXES.css
│   ├── CANVAS_LAYOUT_PATCHED.tsx
│   ├── GRAPH_CONSTELLATION_PATCHED.tsx
│   └── hooks_useAnimationPause.ts
└── guides/
    └── (guides to be added)
```

## Folders

### `performance-audit/`

Contains comprehensive performance audit results and reference files showing all optimizations applied to improve animation and scroll performance.

Key topics:
- Animation optimization techniques
- CSS containment and GPU acceleration
- Mobile performance improvements
- Tab visibility optimization

**Start here:** [`performance-audit/README.md`](./performance-audit/README.md)

### `guides/`

Developer guides and how-to documentation for common tasks.

## Quick Links

- **Performance Audit:** [View Full Report](./performance-audit/README.md)
- **Main Project README:** [../README.md](../README.md)
- **Source Code:** [../src](../src)

## Contributing

When adding new documentation:

1. Organize files by topic in appropriate subdirectories
2. Always include a README.md in each directory
3. Link related documents together
4. Keep documentation up-to-date with code changes
5. Use clear headings and formatting for readability
