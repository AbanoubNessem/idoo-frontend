# iDoo ERP Platform — Table Engine

---

## 1. Overview

The Table Engine renders a complete, paginated, searchable, filterable, and sortable data table from a `TableDef` metadata object. It handles all API calls, pagination state, column rendering, row actions, bulk operations, and export — without any per-entity code.

---

## 2. Responsibilities

| Responsibility | Component / Service |
|---|---|
| Fetch paginated data from API | `EntityDataSource` |
| Render columns | `TableEngineComponent` |
| Column type rendering | `CellRendererRegistry` |
| Row selection | `TableSelectionManager` |
| Pagination state | `PaginationStateService` |
| Sort state | Signal in `TableEngineComponent` |
| Filter state | `FilterEngineComponent` |
| Bulk actions | `ActionEngine` (scope: bulk) |
| Export | `ExportService` |
| Loading skeleton | `TableSkeletonComponent` |

---

## 3. TableEngineComponent Inputs

```typescript
@Input() tableDef: TableDef;
@Input() entityId: string;            // for API path resolution
@Input() filters?: FilterDef[];       // optional filter bar
@Input() extraQueryParams?: Record<string, string>;  // injected from context (e.g. companyId)
@Output() rowClick = new EventEmitter<Record<string, unknown>>();
@Output() selectionChange = new EventEmitter<Record<string, unknown>[]>();
```

---

## 4. Data Loading Pipeline

```
EntityDataSource
        │
        ├── Builds query params from:
        │     - page / size (PaginationState signals)
        │     - sort field + direction (TableEngineComponent signal)
        │     - search term (debounced 300ms)
        │     - active filters (FilterEngineComponent signals)
        │     - extraQueryParams (context: companyId, branchId)
        │
        ├── Calls EntityHttpService.list(entityId, params)
        │     → GET {apiPath}?page=0&size=20&sort=createdAt,desc&...
        │
        ├── Receives ApiResponse<PageResponse<T>>
        │
        ├── Updates signals:
        │     data signal    → table rows
        │     total signal   → paginator totalElements
        │     loading signal → skeleton on/off
        │     error signal   → ErrorStateComponent
        │
        └── TableEngineComponent renders reactively
```

---

## 5. Column Type Renderers

Each `ColumnDef.type` maps to a cell renderer:

| Type | Renderer | Example output |
|---|---|---|
| `text` | Plain text | `John Doe` |
| `email` | Mailto link | `john@example.com` |
| `phone` | Tel link | `+20-100-000-0000` |
| `number` | Formatted number | `1,234` |
| `currency` | Currency formatted | `EGP 10,000.00` |
| `percentage` | Percentage | `85%` |
| `date` | Formatted date | `26 Jun 2025` |
| `datetime` | Formatted datetime | `26 Jun 2025 14:30` |
| `boolean` | Checkmark / Cross | ✓ / ✗ |
| `badge` | Colored chip | `● ACTIVE` |
| `avatar` | Avatar + name | `[avatar] John Doe` |
| `link` | Clickable router link | `→ View` |
| `actions` | Row action buttons | `[Edit] [Delete]` |
| `custom` | Custom renderer component | — |

Custom cell renderers are registered in `CellRendererRegistry` and referenced by a string type key.

---

## 6. Pagination

The `TableEngine` uses zero-based pagination matching the backend contract:

```
Backend: page=0 (first page), size=20, sort=createdAt,desc

Paginator displays: Page 1 of 5 | 42 total records
```

Pagination state is managed in `PaginationStateService` as signals:

```typescript
readonly page  = signal(0);
readonly size  = signal(20);
readonly total = signal(0);
readonly pages = computed(() => Math.ceil(this.total() / this.size()));
```

On page/size change, `EntityDataSource` automatically re-fetches.

---

## 7. Search

When `TableDef.searchable = true`, a search input appears. Keystrokes are debounced 300ms before triggering a new data fetch. The search term is sent as a `search` query parameter to the backend (backend must support this — if not, the field is omitted).

---

## 8. Sort

Clicking a `sortable: true` column header toggles between `asc` → `desc` → `none`. The active sort is sent to the backend as `sort={field},{direction}`.

Multiple sort columns (shift-click) are supported when `TableDef.multiSort = true`. Multiple sort params are sent as repeated `sort` query params (Spring Data Pageable supports this).

---

## 9. Row Actions

Row actions are rendered in the last column (type: `actions`). They are sourced from `ActionDef[]` with `scope: 'row'` for this entity.

Each action button:
- Checks `action.permission` via `PermissionStateService`
- Evaluates `action.hidden(row)` predicate
- Evaluates `action.disabled(row)` predicate
- Shows confirmation dialog if `action.confirmBefore` is set
- Executes `action.handler(context)` on click

By default, only icon buttons are shown in rows. Labels are shown in tooltips.

---

## 10. Row Selection

When `TableDef.selectable = true`:
- A checkbox column appears as the first column
- A "select all on this page" checkbox appears in the header
- Selected rows are tracked in `TableSelectionManager` signals
- `ActionEngine` shows bulk actions when selection is non-empty

```
[✓] [Name]      [Status] [Created At] [Actions]
[✓]  John Doe   ACTIVE   26 Jun 2025  [Edit][Delete]
[✓]  Jane Smith INACTIVE 25 Jun 2025  [Edit][Delete]
─────────────────────────────────────────────────
    2 rows selected  [Activate] [Deactivate] [Delete]
```

---

## 11. Column Visibility

Users can show/hide columns via a column picker menu. Column visibility is persisted per-user per-entity in `localStorage`. The default visibility is determined by `ColumnDef.hidden`.

---

## 12. Export

When `TableDef.exportable = true` (and user has export permission), an "Export" button appears. Clicking it:
1. Calls `ExportService.export(entityId, currentFilters)`
2. Either downloads a CSV from the current page, or calls a backend export endpoint
3. Shows a progress indicator for large exports

---

## 13. Loading State

While data is fetching, `TableSkeletonComponent` renders animated skeleton rows matching the column structure, preventing layout shift.

```
[■■■■■■■■■■]  [■■■■■■]   [■■■■■■■■]   [■■ ■■]
[■■■■■■■■■■]  [■■■■■■]   [■■■■■■■■]   [■■ ■■]
[■■■■■■■■■■]  [■■■■■■]   [■■■■■■■■]   [■■ ■■]
```

---

## 14. Empty State

When the API returns `content: []`, `EmptyStateComponent` renders:
- A relevant icon
- A message: "No {entity.labelPlural} found"
- Optionally a "Create {entity.labelSingular}" button (if user has create permission)

---

## 15. Error State

On API error, `ErrorStateComponent` renders:
- Error icon
- Error message from `ApiErrorDetail.message`
- A "Retry" button that re-triggers the data fetch

---

## 16. Embedded Tables (Relations)

The `TableEngine` is reusable for embedded relation panels. When embedded, it:
- Does NOT show the global filter bar
- Uses `extraQueryParams` to pre-filter by parent entity ID
- Uses a compact version of the paginator
- Has a reduced set of row actions (no navigation links)

```typescript
// In RelationDef:
{
  id: 'employee-roles',
  relatedEntityId: 'auth:role',
  foreignKey: 'userId',          // adds ?userId={currentId} to query
  table: CompactRoleTableDef,
  actions: [AssignRoleActionDef, RevokeRoleActionDef],
}
```
