# Sprint 7 — Form Engine Integration

---

## FormLayoutAdapter (`form-layout.adapter.ts`)

Bridges `FormDefinition` (Dynamic Form Engine) to `LayoutDefinition` (Layout Engine).

### Mapping Table

| FormLayout | LayoutType | Slots |
|---|---|---|
| `simple` | `stack` | One per `section` |
| `sections` | `sections` | One per `section` |
| `tabs` | `tabs` | One per `tab` |
| `accordion` | `accordion` | One per `section` |
| `wizard` | `sections` | One per `step` |

### SectionLayout → LayoutType

| SectionLayout | LayoutType | Config |
|---|---|---|
| `grid` | `grid` | `columns: section.columns` |
| `flex` | `flex` | `direction: row, wrap: true` |
| `stack` | `stack` | `direction: column` |

---

## Refactored Form Components

### `FormSectionComponent`

**Before:** `gridColumns = computed(() => 'repeat(N, 1fr)')` — inline CSS string.  
**After:** `sectionBodyStyle = computed(...)` — calls `FormLayoutAdapter.sectionToLayoutDefinition()` then `LayoutRendererService.render()`. Result applied via `[ngStyle]`.

This eliminates the only place in the Dynamic Form Engine that duplicated layout logic.

### `FormTabsContainerComponent`

**Before:** `private readonly activeIndex = signal(0)`  
**After:** `private readonly _layoutState = new LayoutState()` — delegates tab activation to `LayoutState.activateTab()`.

### `FormAccordionContainerComponent`

**Before:** `private readonly _openSet = signal<Set<number>>(new Set([0]))`  
**After:** `private readonly _layoutState = new LayoutState()` — delegates accordion toggle to `LayoutState.toggleAccordion()`.

---

## No Duplicate Layout Logic

After Sprint 7 there is exactly one place that computes grid CSS: `LayoutRendererService`. No component manually builds `repeat(N, 1fr)` or `flex-direction: column` strings.
