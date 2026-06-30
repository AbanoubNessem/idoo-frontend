# Sprint 7 — Layout Renderer

**File:** `src/app/core/platform/layout/layout-renderer.service.ts`

---

## Responsibility

Converts a `LayoutDefinition` + `LayoutContextData` into `CssProperties` (a `Record<string, string>`). Stateless — same inputs always produce same output.

## Output Shape

```typescript
interface LayoutRenderOutput {
  hostCss:  CssProperties;                         // Applied to the host element
  slotCss:  Readonly<Record<string, CssProperties>>; // Per slot id
  childCss: ReadonlyArray<CssProperties>;          // Per child index
  cssVars:  CssProperties;                         // --platform-* overrides
}
```

## Type-to-CSS Mapping

| Layout Type | CSS Output |
|---|---|
| `grid` | `display: grid; grid-template-columns: repeat(N, 1fr)` |
| `flex` | `display: flex; flex-direction: row/column` |
| `rows` / `stack` / `sections` | `display: flex; flex-direction: column` |
| `columns` / `panels` | `display: flex; flex-direction: row` |
| `cards` | `display: grid; grid-template-columns: repeat(auto-fill, ...)` |
| `sidebar` | `display: flex; flex-direction: row/row-reverse` |
| `splitter` | `display: flex; flex-direction: row/column` |
| `overlay` | `position: fixed; inset: 0; display: flex` |
| `responsive-container` | `container-type: inline-size` |

## RTL Behaviour

- Row flex-direction is automatically flipped to `row-reverse` in RTL context.
- Sidebar position `start` becomes `row-reverse` in RTL (puts sidebar on the right).
- Grid areas are reversed in RTL if `config.grid.areas` is provided.
- All logical directions (`inline-start`, `inline-end`) are used for padding/margin.

## Config Merging

Default configs from `layout.constants.ts` are merged with `definition.config` at render time. Definition config always wins (`Object.assign` order).
