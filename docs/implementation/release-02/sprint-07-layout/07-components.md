# Sprint 7 — Angular Components & Directives

---

## `LayoutHostComponent` (`layout-host.component.ts`)

**Selector:** `<platform-layout-host>`

Renders a host `<div>` styled with the layout engine's generated CSS.

### Inputs

| Input | Type | Description |
|---|---|---|
| `definition` | `LayoutDefinition` (required) | The layout blueprint |
| `context` | `Partial<LayoutContextData>` | Context overrides |
| `trackInstance` | `boolean` | Whether to create/destroy a LayoutEngine instance |

### Template Pattern

```html
<platform-layout-host [definition]="myGridDef">
  <div [platformLayoutSlot]="'left'" [layoutId]="myGridDef.id">...</div>
  <div [platformLayoutSlot]="'right'" [layoutId]="myGridDef.id">...</div>
</platform-layout-host>
```

Uses `effect()` to re-resolve layout on definition or context change.

---

## `LayoutSlotDirective` (`layout-slot.directive.ts`)

**Selector:** `[platformLayoutSlot]`

Applies slot-specific CSS (order, grid-column span, visibility) to a host element by reading the resolved slot from the engine.

### Inputs

| Input | Type |
|---|---|
| `platformLayoutSlot` | `string` (slot id, required) |
| `layoutId` | `string` (parent layout instance id) |

---

## `ContainerQueryDirective` (`container-query.directive.ts`)

**Selector:** `[platformContainerQuery]`

Uses `ResizeObserver` to emit a `Breakpoint` whenever the host element's width crosses a breakpoint threshold.

### Outputs

| Output | Type |
|---|---|
| `breakpointChange` | `EventEmitter<Breakpoint>` |

Uses native CSS Container Queries (`container-type: inline-size`) when supported; falls back to `ResizeObserver` + JS breakpoints.
