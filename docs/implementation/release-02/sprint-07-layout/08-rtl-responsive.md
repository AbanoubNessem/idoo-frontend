# Sprint 7 — RTL & Responsive

---

## RTL Support

RTL is applied at three levels:

### 1. Document Direction
`LayoutEngineService.setDirection('rtl')` sets `document.documentElement.setAttribute('dir', 'rtl')`. This activates native browser RTL for text, form controls, and scroll bars without any CSS changes.

### 2. Flex Direction Flipping
`LayoutRendererService` automatically flips row-based flex directions:
- `row` → `row-reverse` in RTL
- `row-reverse` → `row` in RTL

### 3. Sidebar Placement
The sidebar `position: 'start'` places the sidebar on the left in LTR and on the right in RTL. This is achieved by switching `flex-direction` between `row` and `row-reverse`.

### 4. Grid Areas
If `config.grid.areas` is provided, the area array is reversed in RTL to mirror the grid template.

### 5. CSS Logical Properties
All token-driven spacing uses `--platform-spacing-*` variables rather than `margin-left`/`padding-right` etc. The host app is expected to use logical properties (`margin-inline-start`, `padding-block`) in component CSS.

---

## Responsive System

### Breakpoint Widths

| Breakpoint | Min Width |
|---|---|
| `xs` | 0px |
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |
| `xxl` | 1400px |

### Mobile-First Cascade

Responsive overrides are applied cumulatively from `xs` up to the current breakpoint. A definition with only `md` overrides will apply those overrides at `md`, `lg`, `xl`, and `xxl`.

### Container Queries

`ContainerQueryDirective` observes the element's own width using `ResizeObserver`. When CSS Container Queries are supported (`CSS.supports('container-type', 'inline-size')`), `responsive-container` layout type adds `container-type: inline-size` to the host.
