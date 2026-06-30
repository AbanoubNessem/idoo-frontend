# Sprint 7 — Type System

**File:** `src/app/core/platform/layout/layout.types.ts`

---

## Layout Types (18)

```
grid | flex | rows | columns | stack | cards | sections | panels |
tabs | accordion | splitter | sidebar | header | footer |
content-area | responsive-container | overlay | nested
```

## Breakpoints

```typescript
type Breakpoint  = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type DeviceClass = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';
type LayoutDirection = 'ltr' | 'rtl';
```

## Core Interfaces

### `LayoutDefinition`
The metadata blueprint — plain object, fully readonly, no Angular dependencies.

### `LayoutConfig`
Type-safe configuration per layout type. Contains nested `GridConfig`, `FlexConfig`, `SidebarConfig`, `SplitterConfig`, `TabsConfig`, `AccordionConfig`, `CardsConfig`, `OverlayConfig`, `ResponsiveContainerConfig`.

### `ResolvedLayout`
The output of `LayoutResolverService.resolve()`. Contains `css: CssProperties`, resolved `slots`, `children`, `direction`, `breakpoint`.

### `LayoutContextData`
Immutable snapshot of the current environment: `breakpoint`, `device`, `orientation`, `direction`, `permissions`, `model`.

### `LayoutStateData`
Immutable snapshot of per-instance interactive state: `activeTabIndex`, `openAccordionIds`, `sidebarCollapsed`, `splitterRatio`, `overlayOpen`, `hiddenSlotIds`, `slotOrder`.

## Responsive Overrides

```typescript
type ResponsiveOverrides<T> = Partial<Record<Breakpoint, Partial<T>>>;
```

Applied mobile-first (xs → current breakpoint). Lower breakpoints cascade into higher ones.
