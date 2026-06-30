# Sprint 8.4 — Motion System

## Built-in Motion Profiles

| Profile | reducedMotion | durationNormal | durationScale |
|---|---|---|---|
| `motion-normal` | false | 200ms | 1 |
| `motion-reduced` | true | 0ms | 0 |
| `motion-slow` | false | 400ms | 2 |

## CSS Variables

```
--platform-motion-duration-fast        (100ms / 0ms / 200ms)
--platform-motion-duration-normal      (200ms / 0ms / 400ms)
--platform-motion-duration-slow        (300ms / 0ms / 600ms)
--platform-motion-easing-standard      cubic-bezier(0.4, 0, 0.2, 1)
--platform-motion-easing-decelerate    cubic-bezier(0, 0, 0.2, 1)
--platform-motion-easing-accelerate    cubic-bezier(0.4, 0, 1, 1)
```

## Reduced Motion

Two ways to enable:

```typescript
// Switch to reduced-motion profile explicitly
engine.setMotion('motion-reduced');

// Or use convenience method (also handles profile switching)
engine.setReducedMotion(true);
```

The HTML attribute `data-reduced-motion="true"` is set for CSS targeting:

```scss
@media (prefers-reduced-motion: reduce),
[data-reduced-motion="true"] {
  .animated-element {
    transition-duration: var(--platform-motion-duration-normal, 0ms);
  }
}
```

## SCSS Usage

```scss
.panel {
  transition: opacity var(--platform-motion-duration-normal)
                      var(--platform-motion-easing-standard),
              transform var(--platform-motion-duration-normal)
                        var(--platform-motion-easing-decelerate);
}
```

## AccessibilityProfile Integration

Setting an accessibility profile that has `reducedMotion: true` automatically calls
`setMotion('motion-reduced')` via `VisualExperienceEngineService.setAccessibility()`.
