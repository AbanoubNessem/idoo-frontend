# iDoo ERP Platform — Component Lifecycle

---

## 1. Overview

This document defines the lifecycle contract for platform engine components (`EntityViewComponent`, `FormEngineComponent`, `TableEngineComponent`, `WidgetComponent`, and their sub-components). It also defines how plugins integrate with these lifecycles via hooks.

---

## 2. Angular Lifecycle Compatibility

The platform uses Angular 22+ with standalone components and Signals. The following Angular lifecycle hooks are used:

| Hook | Used by |
|---|---|
| `ngOnInit` | Not used in engine components (inputs are not stable yet in Angular 22 Signals) |
| `ngOnChanges` | Used for `@Input()` change detection where Signals are not applicable |
| `afterNextRender` | Used for DOM measurements (virtual scroll, chart resize) |
| `afterRender` | Not used (too frequent) |
| `ngOnDestroy` | Used to cancel HTTP requests and clean up effect() registrations |

Engine components use `input()` signals (Angular 17.1+) where possible instead of `@Input()` + `ngOnChanges`.

---

## 3. EntityViewComponent Lifecycle

```
1. Component created (route navigated to)
   │
   ├── Reads entityId from route signal
   ├── Resolves EntityDef from EntityRegistry
   ├── Checks entity.permissions.list
   │     If denied → renders AccessDeniedComponent and stops
   │
2. Mode determination
   ├── Reads URL pattern → sets mode signal
   │
3. Data loading (for detail/edit modes)
   ├── Calls entityHttpService.getById(entityId, recordId)
   ├── Sets isLoading = true
   ├── On success → sets record signal, isLoading = false
   └── On error → sets error signal, renders error component
   │
4. Sub-engine initialization
   ├── Passes resolved EntityDef + mode + record to sub-engine
   │
5. On route change (same component, different record)
   └── Re-triggers step 3 (ngOnChanges or input signal change)
   │
6. Component destroyed (route navigated away)
   └── Pending HTTP requests cancelled (takeUntilDestroyed)
```

---

## 4. FormEngineComponent Lifecycle

```
1. Receives FormSchema + mode + initialValue inputs
   │
2. FormBuilderService.build(schema, mode, initialValue)
   ├── Creates FormGroup
   ├── Applies validators
   ├── Sets initial values
   │
3. Sets up conditional field effects
   ├── For each field with hidden/required/disabled predicates:
   │     effect(() => { evaluate predicate against form.valueSignal })
   │
4. Sets up dirty-change tracking
   ├── form.valueChanges → isDirty = true
   │
5. User edits → real-time validation on blur
   │
6. User submits
   ├── Marks all controls as touched (show errors)
   ├── Runs async validators
   ├── If valid → ActionEngine.execute(submitAction, context)
   ├── On success → emits saved, shows toast, optionally navigates
   └── On 400 error → FormErrorMapperService.applyErrors(form, fieldErrors)
   │
7. Component destroyed
   └── Effects auto-cleaned up (Angular manages effect() cleanup)
```

---

## 5. TableEngineComponent Lifecycle

```
1. Receives TableDef + entityId + filters inputs
   │
2. EntityDataSource initialized
   ├── Creates page/size/sort/search/filter signals
   ├── Computes queryParams signal from all above
   ├── Sets up effect(() => fetchData(queryParams()))
   │
3. Initial data fetch (triggered by effect)
   ├── isLoading = true
   ├── API call: GET {apiPath}?page=0&size=20&...
   ├── On success → data signal, total signal, isLoading = false
   └── On error → error signal, renders ErrorStateComponent
   │
4. User interactions (search, sort, filter, paginate)
   └── Update corresponding signals → effect triggers new fetch
   │
5. Action completed event from EventBus
   └── Re-triggers fetch (refreshes current page)
   │
6. Component destroyed
   └── takeUntilDestroyed cleans up all subscriptions
```

---

## 6. Plugin Lifecycle Hooks

Plugins attach to engine lifecycles via `FormHooks` (see `07-form-engine.md` §10):

```typescript
interface FormHooks {
  afterBuild?:    (form: FormGroup) => void;
  beforeSubmit?:  (value: Record<string, unknown>) => Record<string, unknown>;
  afterSave?:     (savedRecord: Record<string, unknown>) => void;
  afterError?:    (error: ApiError) => void;
}
```

And table hooks:

```typescript
interface TableHooks {
  afterLoad?:     (rows: Record<string, unknown>[]) => void;
  beforeAction?:  (actionId: string, context: ActionContext) => boolean; // return false to cancel
  afterAction?:   (actionId: string, context: ActionContext) => void;
}
```

---

## 7. Memory Management Rules

1. **Never subscribe manually** in engine components — use `takeUntilDestroyed()` or `toSignal()`.
2. **Effects are auto-cleaned** — Angular's `effect()` tracks the component's `DestroyRef` automatically.
3. **HTTP requests use `takeUntilDestroyed()`** on all Observable chains in engine components.
4. **`EntityDataSource` is not a shared singleton** — a new instance is created per `TableEngineComponent` and destroyed with it.

---

## 8. Change Detection Strategy

All engine components use `ChangeDetectionStrategy.OnPush`. Rendering updates are triggered exclusively by:
- Signal reads that Angular Signals tracks
- `@Input()` reference changes (for non-signal inputs)
- Explicit `cdr.markForCheck()` in async callbacks that cannot use Signals

This ensures the engines perform well even in pages with many simultaneous components (dashboard with 10+ widgets).
