# Sprint 9.1 — Public API

All exports are available from:

```typescript
import { ... } from 'src/app/core/platform/table';
```

---

## Types

```typescript
// Column
export type TableColumnType
export type TableSelectionMode
export type TableDensity
export type TableStickyEdge
export type TableFilterType
export type TableSummaryType
export type TableActionPosition
export type TableActionVariant
export type TableBreakpoint
export type TableRegistryLayer
export type TableFormatter<T>
export type TableCellClassFn

// Interfaces
export interface TableColumnDefinition
export interface TableActionContext
export interface TableActionDefinition
export interface TableToolbarDefinition
export interface TableFilterOption
export interface TableFilterDefinition
export interface TableGroupDefinition
export interface TableSummaryDefinition
export interface TablePermissionDefinition
export interface TableResponsiveRule
export interface TableDefinition
export interface TableRegistryEntry
export interface TableRegistrationOptions
export interface TableLayerOverride
export interface ResolvedTableColumn
export interface ResolvedTableDefinition
export interface TableValidationError
export interface TableValidationResult
export interface TableSerializationOptions
export interface TableDeserializationOptions
export interface TableEvent<T>
export type TableEventType
export interface TableDiagEvent
export type TableDiagEventType
export interface TableDiagnosticsReport
export interface TableMetricsSnapshot
```

---

## Constants

```typescript
export const TABLE_DEFAULTS
export const TABLE_COLUMN_DEFAULTS
export const TABLE_RESOLUTION_ORDER
export const TABLE_COLUMN_TYPES
export const TABLE_MAX_DIAG_EVENTS
export const TABLE_MAX_COLUMNS
```

---

## Tokens

```typescript
export const TABLE_DEFAULT_LAYER          // InjectionToken<TableRegistryLayer>
export const TABLE_INITIAL_DEFINITIONS    // InjectionToken<TableDefinition[]>
export const TABLE_MAX_DIAG_EVENTS_TOKEN  // InjectionToken<number>
```

---

## Services

```typescript
export class TableRegistryService
export class TableMetadataRegistryService
export class TableResolverService
export class TableValidatorService
export class TableSerializerService
export class TableDiagnosticsService
export class TableMetricsService
export class TableEngine  // Main facade
```

---

## Quick Start

```typescript
import { inject } from '@angular/core';
import { TableEngine, TableDefinition } from 'src/app/core/platform/table';

const engine = inject(TableEngine);

const orders: TableDefinition = {
  id:   'orders',
  name: 'Orders',
  columns: [
    { id: 'id',     field: 'id',     header: 'Order #', type: 'text'     },
    { id: 'total',  field: 'total',  header: 'Total',   type: 'currency' },
    { id: 'status', field: 'status', header: 'Status',  type: 'status'   },
  ],
  selectionMode: 'multiple',
  density: 'default',
};

// Register
engine.register(orders);

// Resolve (with layer merge)
const resolved = await engine.resolve('orders');
console.log(resolved?.visibleColumns.length); // 3

// Apply runtime override (e.g. user preference)
engine.applyOverride('orders', 'runtime', { density: 'compact' });
```
