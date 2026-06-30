# Sprint 8.4 — Typography System

## Built-in Profiles

### `typography-default`
- Font: Inter (Latin system stack fallback)
- Base size: 14px
- Scale: xs(10) → sm(12) → base(14) → lg(16) → xl(20) → 2xl(24) → 3xl(30) → 4xl(36)

### `typography-arabic`
- Fonts: Cairo (Arabic), Inter (Latin)
- Base size: 15px — slightly larger for Arabic glyph legibility
- Larger line heights (1.3 / 1.6 / 1.8) to accommodate Arabic descenders

### `typography-large`
- Font: Inter
- Base size: 16px — WCAG 2.1 criterion for "large text"
- Scale starts 2px higher than default at every step
- Relaxed line heights (1.3 / 1.6 / 1.85) for improved readability

## Runtime Switching

```typescript
// Switch to Arabic profile (automatically used when direction is RTL)
engine.setTypography('typography-arabic');

// Accessibility: enable large typography
engine.setLargeTypography(true);
// → setTypography('typography-large') is called automatically
```

## CSS Variable Usage in SCSS

```scss
.heading {
  font-family: var(--platform-font-family-base);
  font-size:   var(--platform-font-size-xl);
  font-weight: var(--platform-font-weight-semibold);
  line-height: var(--platform-font-leading-tight);
}

// For components that support Arabic
:lang(ar) .content {
  font-family: var(--platform-font-family-arabic, var(--platform-font-family-base));
  line-height: var(--platform-font-leading-relaxed);
}
```

## Registering a Custom Profile

```typescript
registry.registerTypography({
  id:             'tenant-poppins',
  name:           'Poppins Brand',
  fontFamilyBase: "'Poppins', 'Inter', sans-serif",
  scale: {
    base: '14px',
    lg:   '16px',
    xl:   '20px',
  },
  weights:     { normal: '400', medium: '500', bold: '700' },
  lineHeights: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
  tags: ['brand', 'tenant'],
});
engine.setTypography('tenant-poppins');
```
