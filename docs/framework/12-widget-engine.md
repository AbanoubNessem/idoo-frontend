# iDoo ERP Platform — Widget Engine

---

## 1. Overview

The Widget Engine powers the dashboard layer of the platform. A dashboard is a collection of widgets arranged in a responsive grid. Widgets are self-contained components that each own their own data fetching, rendering, and configuration. They are registered by plugins and composed into dashboards dynamically.

---

## 2. Widget Architecture

```
DashboardPageComponent
        │
        ├── reads active widget slots from WidgetRegistry
        ├── renders DashboardGridComponent
        │       └── For each slot: renders WidgetHostComponent
        │               └── dynamically loads WidgetDef.component
        │                       └── Widget fetches its own data
        │                       └── Widget renders its own content
        └── WidgetConfigDrawer (optional — user configures each widget)
```

---

## 3. WidgetDef

```typescript
interface WidgetDef {
  id: string;               // unique: '{pluginCode}:widget:{name}'
  name: string;
  description?: string;
  icon?: string;
  component: () => Promise<Type<WidgetComponent>>;
  defaultConfig?: Record<string, unknown>;
  minWidth?: number;        // grid columns (default: 1)
  minHeight?: number;       // grid rows (default: 1)
  maxWidth?: number;
  permission?: string;      // widget hidden if user lacks this
  configSchema?: FormSchema;  // if provided, user can configure the widget
}
```

---

## 4. WidgetComponent Interface

Every widget component must implement:

```typescript
abstract class WidgetComponent {
  @Input() config!: Record<string, unknown>;  // from DashboardSlot.config
  @Input() slot!: DashboardSlot;              // layout metadata

  // Signals the widget owns:
  readonly isLoading = signal(false);
  readonly hasError  = signal(false);
  readonly title     = signal('');
}
```

---

## 5. DashboardSlot

The dashboard configuration (stored per-user or per-role) is a list of slots:

```typescript
interface DashboardSlot {
  id: string;
  widgetId: string;          // refers to WidgetDef.id
  position: GridPosition;
  config?: Record<string, unknown>;  // widget-specific config
}

interface GridPosition {
  col: number;    // 1-based column (grid is 12 columns)
  row: number;    // 1-based row
  colSpan: number;
  rowSpan: number;
}
```

---

## 6. Dashboard Grid

The dashboard uses a 12-column grid. Each widget occupies a `colSpan × rowSpan` block:

```
Col: 1   2   3   4   5   6   7   8   9   10  11  12
     ┌───────────────┐   ┌───────────────┐   ┌───────┐
     │  KPI (span 3) │   │  KPI (span 3) │   │ KPI 3 │
     └───────────────┘   └───────────────┘   └───────┘
     ┌──────────────────────────────┐   ┌───────────────┐
     │  Revenue Chart (span 6)      │   │  Alerts (3)   │
     │                              │   │               │
     └──────────────────────────────┘   └───────────────┘
```

---

## 7. Standard Widget Types

All plugins are encouraged to contribute widgets. The platform ships these core widget types:

| Widget ID | Description |
|---|---|
| `core:widget:kpi-card` | Single metric with trend indicator |
| `core:widget:line-chart` | Time-series line chart |
| `core:widget:bar-chart` | Bar chart comparison |
| `core:widget:pie-chart` | Distribution pie/donut chart |
| `core:widget:activity-feed` | Latest N audit events |
| `core:widget:quick-links` | Configurable shortcut buttons |
| `core:widget:table` | Top-N record list with link |
| `core:widget:calendar` | Upcoming events/deadlines |

Each ERP module registers its own business widgets (e.g., `hr:widget:headcount`, `fleet:widget:vehicles-by-status`).

---

## 8. Widget Data Fetching

Each widget owns its data fetching independently. The platform provides a `WidgetDataService` helper:

```typescript
class WidgetDataService {
  query<T>(endpoint: string, params?: Record<string, string>): Signal<WidgetData<T>>;
}

interface WidgetData<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  lastRefreshed: Date | null;
}
```

Widgets call `widgetDataService.query()` in their constructor and bind to the returned signal.

---

## 9. Widget Configuration

If a `WidgetDef.configSchema` is provided, a gear icon appears on the widget header. Clicking it opens a `DrawerEngine` drawer with a `FormEngineComponent` rendering the config schema. On save, the slot config is updated and the widget re-renders with the new config.

---

## 10. Dashboard Persistence

Dashboard layouts are saved per user in the backend:

```
GET  /v1/users/{id}/dashboard          → load user's layout
PUT  /v1/users/{id}/dashboard          → save user's layout
```

If no user-specific layout exists, the platform falls back to the role-default dashboard, then to the module-default dashboard.

---

## 11. Widget Refresh

Widgets expose a refresh interval via `WidgetDef.refreshIntervalMs`. The dashboard automatically refreshes each widget on its interval. Users can also manually refresh individual widgets via the refresh icon on the widget header.
