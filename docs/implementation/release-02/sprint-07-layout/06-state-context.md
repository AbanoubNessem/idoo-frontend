# Sprint 7 — Layout State & Context

---

## LayoutContext (`layout-context.ts`)

A plain class (not an Angular service) that holds signal-based environment data. Instantiated per component or per engine instance.

### Signals

| Signal | Type | Description |
|---|---|---|
| `breakpoint` | `Signal<Breakpoint>` | Derived from container or viewport width |
| `device` | `Signal<DeviceClass>` | Derived from breakpoint |
| `orientation` | `Signal<Orientation>` | Landscape / portrait |
| `direction` | `Signal<LayoutDirection>` | LTR / RTL |
| `permissions` | `Signal<string[]>` | Current user permissions |
| `model` | `Signal<Record<string,unknown>>` | Bound data model |
| `snapshot` | `Signal<LayoutContextData>` | Full computed snapshot |

### Methods

- `setContainerSize(w, h?)` — updates container-based breakpoint
- `setDirection(dir)` — changes RTL/LTR
- `setPermissions(perms)` — replaces permissions array
- `setModel(model)` / `patchModel(patch)` — replaces/merges model
- `bindDocument(doc)` — wires viewport dimension fallback

---

## LayoutState (`layout-state.ts`)

A plain class (not an Angular service) holding interactive UI state per layout instance. Used by `LayoutHostComponent` and form containers.

### Signals

| Signal | Controls |
|---|---|
| `activeTabIndex` | Which tab is active |
| `openAccordionIds` | Which accordion panels are expanded |
| `sidebarCollapsed` | Whether sidebar is folded |
| `splitterRatio` | Split pane ratio 0–1 |
| `overlayOpen` | Whether an overlay is visible |
| `hiddenSlotIds` | Slots hidden via conditions |
| `slotOrder` | Reordered slot id array |

### Methods

`activateTab(n)`, `toggleAccordion(id)`, `openAccordion(id)`, `closeAccordion(id)`, `toggleSidebar()`, `setSplitterRatio(r)`, `hideSlot(id)`, `showSlot(id)`, `setSlotOrder([...])`, `reset()`

Both classes are instantiated with `new` (not `inject`). This avoids Angular DI overhead for short-lived per-component state.
