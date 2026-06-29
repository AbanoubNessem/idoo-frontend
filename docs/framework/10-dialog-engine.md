# iDoo ERP Platform — Dialog Engine

---

## 1. Overview

The Dialog Engine provides a centralized, declarative API for displaying modal dialogs throughout the platform. All dialogs — confirmations, forms, detail views, pickers, and custom content — are opened through a single `DialogEngine` service. No component directly instantiates dialogs.

---

## 2. Dialog Types

| Type | Use Case |
|---|---|
| `confirm` | Destructive action confirmation (delete, deactivate) |
| `info` | Non-blocking informational message |
| `form` | Inline record creation or editing |
| `detail` | Read-only record detail overlay |
| `picker` | Entity selection (single or multi) |
| `custom` | Arbitrary component in a dialog shell |

---

## 3. DialogEngine Service API

```typescript
interface DialogEngine {
  confirm(config: ConfirmDialogConfig): Observable<boolean>;
  info(config: InfoDialogConfig): void;
  openForm(config: FormDialogConfig): Observable<Record<string, unknown> | null>;
  openDetail(config: DetailDialogConfig): void;
  openPicker(config: PickerDialogConfig): Observable<unknown | unknown[] | null>;
  open<T>(config: CustomDialogConfig<T>): Observable<T | null>;
  closeAll(): void;
}
```

---

## 4. ConfirmDialog

The most frequently used dialog. Used before any destructive action.

**Config:**

```typescript
interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;    // default: 'Confirm'
  cancelLabel?: string;     // default: 'Cancel'
  type?: 'confirm' | 'delete' | 'warn';
  // 'delete' renders confirm button in red with a trash icon
}
```

**Example:**

```typescript
this.dialogEngine.confirm({
  title: 'Delete Employee',
  message: 'Are you sure you want to delete John Doe? This cannot be undone.',
  confirmLabel: 'Delete',
  type: 'delete',
}).subscribe(confirmed => {
  if (confirmed) {
    this.employeeApi.delete(id).subscribe(...);
  }
});
```

**Visual:**

```
┌─────────────────────────────────┐
│  Delete Employee                │
├─────────────────────────────────┤
│  Are you sure you want to       │
│  delete John Doe? This cannot   │
│  be undone.                     │
│                                 │
│             [Cancel] [Delete ⚠] │
└─────────────────────────────────┘
```

---

## 5. FormDialog

Opens a `FormEngineComponent` inside a dialog. Used for quick-create operations that should not navigate away from the current page.

**Config:**

```typescript
interface FormDialogConfig {
  title: string;
  entityId: string;
  mode: 'create' | 'edit';
  recordId?: string;         // required for edit mode
  initialValue?: Record<string, unknown>;
  width?: string;            // default: '600px'
}
```

On save, the dialog emits the saved record and closes automatically. On cancel or backdrop click, emits `null`.

**Example:**

```typescript
this.dialogEngine.openForm({
  title: 'Add Department',
  entityId: 'hr:department',
  mode: 'create',
}).subscribe(saved => {
  if (saved) {
    this.tableEngine.refresh(); // reload the table
  }
});
```

---

## 6. PickerDialog

Opens a searchable entity list in a dialog, allowing single or multi-selection.

**Config:**

```typescript
interface PickerDialogConfig {
  title: string;
  entityId: string;          // entity to browse e.g. 'hr:department'
  multi?: boolean;           // default: false
  filters?: FilterDef[];
  extraQueryParams?: Record<string, string>;
  preselected?: unknown[];   // IDs of already-selected items
}
```

The picker renders a compact `TableEngineComponent` with selection enabled. On confirm, emits selected row(s). On cancel, emits `null`.

---

## 7. CustomDialog

Opens any lazy-loaded Angular component inside the dialog shell.

**Config:**

```typescript
interface CustomDialogConfig<T> {
  title?: string;
  component: () => Promise<Type<unknown>>;
  inputs?: Record<string, unknown>;
  width?: string;
  maxHeight?: string;
  disableClose?: boolean;    // prevents backdrop click closing
}
```

The dialog shell renders the header (title + close button) and scrollable content area. The component is responsible for emitting the result via the `DialogRef` injection.

---

## 8. Dialog Shell Layout

All dialogs (except `confirm`) use this shell:

```
┌─ DialogShellComponent ─────────────────────────────────┐
│  [title]                                     [✕ close] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  <dialog content>                                      │
│  (FormEngine / Table / Custom Component)               │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [Cancel]                                    [Save]    │
└────────────────────────────────────────────────────────┘
```

---

## 9. Stack and z-Index

Multiple dialogs can be open simultaneously (e.g., a picker opened from within a form dialog). The Dialog Engine manages a stack of active dialogs. Each successive dialog increments the z-index. Pressing Escape closes the top-most dialog only.

---

## 10. ActionEngine Integration

The `ActionEngine` uses `DialogEngine` automatically for `confirmBefore` on `ActionDef`. No manual wiring is needed:

```typescript
const DeleteEmployeeAction: ActionDef = {
  id: 'delete-employee',
  label: 'Delete',
  icon: 'delete',
  color: 'warn',
  scope: 'row',
  permission: 'HR:employees:delete',
  confirmBefore: {
    title: 'Delete Employee',
    message: 'This cannot be undone.',
    type: 'delete',
  },
  handler: (ctx) => this.employeeApi.delete(ctx.row!['id'] as string),
};
```
