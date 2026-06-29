# iDoo ERP Platform — Drawer Engine

---

## 1. Overview

The Drawer Engine provides sliding side-panel overlays that open from the right edge of the screen without fully blocking the page behind them. Drawers are used for quick-view, quick-edit, and auxiliary content that supports the primary view without replacing it.

---

## 2. Drawers vs Dialogs

| Dimension | Dialog | Drawer |
|---|---|---|
| Position | Center of screen | Right side |
| Backdrop | Full-screen dark | Partial or none |
| Width | Fixed (400–700px) | Proportion of viewport (30–50%) |
| Use case | Focused action (confirm, create) | Supplementary context (preview, notes) |
| Navigation | Blocks parent | Does not block parent |

---

## 3. DrawerEngine Service API

```typescript
interface DrawerEngine {
  open<T>(config: DrawerConfig<T>): DrawerRef<T>;
  closeAll(): void;
}

interface DrawerRef<T> {
  readonly result$: Observable<T | null>;
  close(result?: T): void;
}
```

---

## 4. DrawerConfig

```typescript
interface DrawerConfig<T = unknown> {
  title?: string;
  subtitle?: string;

  // Content
  component: () => Promise<Type<unknown>>;
  inputs?: Record<string, unknown>;

  // Layout
  width?: string;            // default: '40%', min: '320px', max: '60%'
  position?: 'right' | 'left';  // default: 'right'

  // Behaviour
  hasBackdrop?: boolean;     // default: false — drawer is non-modal
  closeOnNavigation?: boolean;  // default: true
  closeOnEscape?: boolean;      // default: true
}
```

---

## 5. Standard Drawer Use Cases

### 5.1 Detail Preview Drawer

Clicking a row in a table opens a detail drawer on the right, showing the record's key fields without navigating away. The user can review and decide whether to open the full detail page.

```
┌─ Table ─────────────────────────┬─ Preview Drawer ─────────────┐
│  [Name]    [Status]  [Date]     │  John Doe                    │
│  John Doe  ACTIVE    26 Jun     │  ─────────────────────────── │  ← clicked row
│  Jane ...  INACTIVE  25 Jun     │  Email: john@example.com     │
│  Bob  ...  ACTIVE    24 Jun     │  Dept:  Engineering          │
│                                 │  Status: ACTIVE              │
│                                 │                              │
│                                 │  [Open Full Detail →]        │
└─────────────────────────────────┴──────────────────────────────┘
```

### 5.2 Quick Edit Drawer

An "Edit" action opens a form in a drawer. The user edits and saves without leaving the list page.

### 5.3 Activity / Notes Drawer

Shows the audit trail or comments thread for a record alongside the main form (e.g., CRM opportunity notes).

### 5.4 Filter / Advanced Search Drawer

For complex filter sets, a "More Filters" button opens a filter drawer with all available filter fields laid out vertically.

---

## 6. Drawer Shell Layout

```
                               ┌─ DrawerShellComponent (40%) ───┐
                               │  [title]            [✕ close]  │
                               │  subtitle (optional)            │
                               ├─────────────────────────────────┤
                               │                                 │
                               │  <drawer content>               │
                               │  (scrollable)                   │
                               │                                 │
                               ├─────────────────────────────────┤
                               │  [Cancel]           [Save]      │
                               └─────────────────────────────────┘
```

The footer is optional — preview-only drawers do not render a footer.

---

## 7. Drawer Stack

Up to 3 drawers can be stacked simultaneously, each slightly offset to the right to indicate depth. The visible offset is 16px per level:

```
                         ┌─ Drawer 2 ─┐
                    ┌─ Drawer 1 ──────┤
               ┌─ Main Page ──────────┤
```

---

## 8. EntityDef Integration

Plugins can configure whether a row click opens a navigation, a dialog, or a drawer:

```typescript
const EmployeeEntityDef: EntityDef = {
  // ...
  table: {
    // ...
    rowClickBehavior: 'drawer',   // 'navigate' | 'dialog' | 'drawer' | 'none'
    rowClickDrawer: () => import('./employee-preview.drawer')
                           .then(m => m.EmployeePreviewDrawer),
  }
};
```

When `rowClickBehavior = 'drawer'`, the TableEngine calls `DrawerEngine.open()` automatically on row click, passing the row data as the `inputs.record` binding.
