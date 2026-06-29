# iDoo ERP Platform — Filter Engine

---

## 1. Overview

The Filter Engine renders a filter bar above entity list views, manages filter state as signals, and passes active filter values as query parameters to the `EntityDataSource`. It supports static options, API-loaded options, date ranges, and custom filter components.

---

## 2. FilterBarComponent

`FilterBarComponent` reads `FilterDef[]` from the current entity definition and renders filter controls:

```
┌─ FilterBar ──────────────────────────────────────────────────────────────┐
│  Status: [All ▼]   Department: [All ▼]   Hire Date: [From] — [To]        │
│                                            [Reset All]  [2 active filters]│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FilterDef

See `06-metadata-system.md` §9. Summary:

```typescript
interface FilterDef {
  key: string;           // query param name sent to backend
  label: string;
  type: FilterType;
  defaultValue?: unknown;
  options?: SelectOption[];
  optionsLoader?: () => Observable<SelectOption[]>;
  order?: number;
}
```

---

## 4. Filter State Management

Each `FilterBarComponent` instance maintains a signal per filter key:

```typescript
class FilterEngineService {
  private readonly _filters = signal<Record<string, unknown>>({});
  
  readonly activeFilters: Signal<Record<string, unknown>> = this._filters.asReadonly();
  readonly activeCount = computed(() =>
    Object.values(this._filters()).filter(v => v !== null && v !== undefined && v !== '').length
  );
  
  setFilter(key: string, value: unknown): void {
    this._filters.update(current => ({ ...current, [key]: value }));
  }
  
  clearFilter(key: string): void {
    this._filters.update(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  
  clearAll(): void {
    this._filters.set({});
  }
}
```

`EntityDataSource` reads `FilterEngineService.activeFilters` as a signal dependency. When any filter changes, the data source automatically re-fetches page 0.

---

## 5. Filter Type Renderers

| Type | Rendered as | Backend query param |
|---|---|---|
| `text` | Text input (debounced 500ms) | `?{key}={value}` |
| `select` | Single-select dropdown | `?{key}={value}` |
| `multiselect` | Multi-select dropdown | `?{key}=A&{key}=B` |
| `date` | Date picker | `?{key}=2025-06-26` |
| `date-range` | Start + end date pickers | `?{key}From=...&{key}To=...` |
| `boolean` | Toggle button group (All / Yes / No) | `?{key}=true` |
| `number-range` | Min + max number inputs | `?{key}Min=...&{key}Max=...` |

---

## 6. Options Loading

Filters with `optionsLoader` are lazy-loaded when the filter bar first renders:

```typescript
const DepartmentFilterDef: FilterDef = {
  key: 'departmentId',
  label: 'Department',
  type: 'select',
  optionsLoader: () => inject(DepartmentApiClient)
    .list({ page: 0, size: 200 })
    .pipe(
      map(resp => resp.data.content.map(d => ({
        value: d.id,
        label: d.name,
      })))
    ),
};
```

Loaded options are cached in memory for the lifetime of the filter bar instance.

---

## 7. Active Filter Chips

When filters are active, the filter bar shows chips below the filter controls:

```
Status: ACTIVE  ✕     Department: Engineering  ✕     [Reset All]
```

Clicking `✕` on a chip clears that filter. "Reset All" calls `FilterEngineService.clearAll()`.

---

## 8. Advanced Filter Drawer

For entities with many filter options (> 4 filters), a "More Filters" button opens a `DrawerEngine` drawer containing all `FilterDef[]` laid out in a vertical form. This prevents the filter bar from becoming a wall of controls.

---

## 9. URL Synchronization

Active filters are synchronized to the URL as query params, so users can bookmark and share filtered views:

```
/app/hr/employees?status=ACTIVE&departmentId=123&hireDateFrom=2024-01-01
```

On page load, the `FilterEngineService` reads the URL and pre-populates the filter state. This is handled by `FilterUrlSyncService`.

---

## 10. Server-side vs Client-side Filtering

The platform always uses server-side filtering. All filter values are sent as query parameters to the backend. Client-side filtering within the current page is not supported — this ensures accuracy with large datasets.

The backend must handle unrecognized query params gracefully (ignore them). The frontend never adds filter params for empty/null filter values.
