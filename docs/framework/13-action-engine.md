# iDoo ERP Platform — Action Engine

---

## 1. Overview

The Action Engine is the execution layer for all user-initiated operations in the platform. It resolves `ActionDef` metadata into runnable operations, handling permission checks, confirmation dialogs, API calls, loading states, success/error feedback, and post-action behaviour — all without per-entity code.

---

## 2. Responsibilities

| Responsibility | Handled by |
|---|---|
| Render action buttons | `ActionBarComponent` |
| Check permission | `PermissionEngine` |
| Evaluate `hidden` predicate | `ActionEngine` |
| Evaluate `disabled` predicate | `ActionEngine` |
| Show confirmation | `DialogEngine` |
| Execute handler | `ActionEngine` |
| Show loading state | `ActionEngine` (disables button while running) |
| Show success toast | `NotificationService` |
| Show error toast | `NotificationService` |
| Post-action navigation | `ActionEngine` (if `navigateAfter` configured) |

---

## 3. ActionDef Full Type

See `06-metadata-system.md` §8 for the full `ActionDef` interface. Key fields:

```typescript
interface ActionDef {
  id: string;
  label: string;
  icon?: string;
  scope: ActionScope | ActionScope[];
  permission?: string;
  hidden?: (context: ActionContext) => boolean;
  disabled?: (context: ActionContext) => boolean;
  confirmBefore?: ConfirmConfig;
  handler: (context: ActionContext) => void | Observable<void> | Promise<void>;
  navigateAfter?: (context: ActionContext, result?: unknown) => string[];
  successMessage?: string;
  errorMessage?: string;
}
```

---

## 4. Action Resolution Pipeline

```
User clicks action button
        │
        ▼
ActionEngine.execute(actionId, context)
        │
        ├── 1. Check action.permission
        │       If denied: do nothing (button should already be hidden, but defence-in-depth)
        │
        ├── 2. Evaluate action.disabled(context)
        │       If true: do nothing (button should be disabled, but defence-in-depth)
        │
        ├── 3. If action.confirmBefore:
        │       dialogEngine.confirm(confirmBefore)
        │       If user clicks cancel: abort
        │
        ├── 4. Mark button as loading (disabled + spinner)
        │
        ├── 5. Execute action.handler(context)
        │       Accepts: void, Observable<void>, or Promise<void>
        │       Wraps all in Observable internally
        │
        ├── 6a. On success:
        │       - Show notificationService.success(action.successMessage ?? 'Done')
        │       - If action.navigateAfter: router.navigate(...)
        │       - Emit ActionEngine.actionCompleted$ event
        │
        └── 6b. On error:
                - Show notificationService.error(action.errorMessage ?? api error message)
                - Mark button as not loading
                - Emit ActionEngine.actionFailed$ event
```

---

## 5. ActionScope and Rendering Location

| Scope | Rendered by | Context available |
|---|---|---|
| `list-toolbar` | `ActionBarComponent` (above table) | `entityId`, `mode` |
| `row` | `TableEngineComponent` (last column) | `entityId`, `mode`, `row` |
| `bulk` | `BulkActionBarComponent` (appears when rows selected) | `entityId`, `mode`, `selectedRows` |
| `form-toolbar` | `ActionBarComponent` (form header) | `entityId`, `mode`, `formValue` |
| `form-footer` | `FormFooterComponent` (bottom of form) | `entityId`, `mode`, `formValue` |
| `detail-toolbar` | `ActionBarComponent` (detail page header) | `entityId`, `mode`, `row` |

---

## 6. Built-in Platform Actions

The platform registers a set of standard actions automatically for every entity, based on `EntityDef.permissions`:

| Action ID | Scope | Condition |
|---|---|---|
| `platform:create` | `list-toolbar` | `entity.permissions.create` |
| `platform:edit` | `row`, `detail-toolbar` | `entity.permissions.update` |
| `platform:delete` | `row`, `bulk` | `entity.permissions.delete` |
| `platform:export` | `list-toolbar` | `entity.permissions.export && entity.exportable` |
| `platform:import` | `list-toolbar` | `entity.permissions.import && entity.importable` |

These can be overridden by providing an `ActionDef` with the same `id` in `EntityDef.actions`.

---

## 7. Workflow Transition Actions

When `EntityDef.hasWorkflow = true`, the Action Engine reads `WorkflowDef.transitions` and renders them as actions in the `detail-toolbar`:

```typescript
// WorkflowTransitionDef is automatically converted to ActionDef:
{
  id: `workflow:${transition.id}`,
  label: transition.label,
  icon: transition.icon,
  scope: 'detail-toolbar',
  permission: transition.permission,
  confirmBefore: transition.confirmBefore,
  hidden: (ctx) => ctx.row!['status'] !== transition.from,
  handler: (ctx) => transition.handler
    ? transition.handler(ctx.row!)
    : this.entityHttpService.patch(entityId, ctx.row!['id'], { status: transition.to }),
}
```

---

## 8. ActionEngine Events

The `ActionEngine` emits events on the `EventBus` so other parts of the platform can react:

```typescript
// EventBus events emitted by ActionEngine:
interface ActionCompletedEvent {
  type: 'action:completed';
  actionId: string;
  entityId: string;
  context: ActionContext;
}

interface ActionFailedEvent {
  type: 'action:failed';
  actionId: string;
  entityId: string;
  error: unknown;
}
```

The `TableEngine` listens for `action:completed` events and refreshes its data when the `entityId` matches.

---

## 9. ActionBarComponent

`ActionBarComponent` accepts a list of `ActionDef[]` and renders them as buttons:

```
[+ Create Employee]  [↑ Import]  [↓ Export]
```

Button appearance rules:
- First action in `list-toolbar`: primary filled button
- Subsequent actions: outlined or icon-only buttons
- Row actions: icon-only buttons (label in tooltip)
- If more than 3 row actions: first 2 visible, rest in a `⋮` overflow menu

---

## 10. Hotkeys

Critical actions support keyboard shortcuts via `HotkeyService`:

```typescript
const CreateAction: ActionDef = {
  id: 'create-employee',
  label: 'Create Employee',
  scope: 'list-toolbar',
  hotkey: 'ctrl+n',
  // ...
};
```

Hotkeys are displayed in tooltips: `Create Employee (Ctrl+N)`.
