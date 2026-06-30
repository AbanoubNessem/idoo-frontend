# Sprint 9.1 — Table Architecture

## Architectural Principles

| Principle                | How Applied                                                    |
|--------------------------|----------------------------------------------------------------|
| Framework Independent    | Core logic in plain TypeScript; Angular only at injection boundary |
| Signals Ready            | All reactive state via Angular `signal()` / `computed()`       |
| Strict TypeScript        | `readonly` on all interface members; no `any`                  |
| SOLID                    | Each service has a single responsibility                       |
| No Circular Dependencies | Services inject downward; engine depends on all, nothing depends on engine |

## Layer Diagram

```
┌──────────────────────────────────────────┐
│                TableEngine                │  ← Main facade / orchestrator
├──────────────────────────────────────────┤
│  TableRegistryService                     │  ← Stores TableDefinition entries
│  TableMetadataRegistryService             │  ← Manages layer-based overrides
├──────────────────────────────────────────┤
│  TableResolverService                     │  ← Merges layers → ResolvedTableDefinition
├──────────────────────────────────────────┤
│  TableValidatorService                    │  ← Validates TableDefinition
│  TableSerializerService                   │  ← JSON serialize / deserialize
├──────────────────────────────────────────┤
│  TableDiagnosticsService                  │  ← Event recording / reports
│  TableMetricsService                      │  ← Performance counters
└──────────────────────────────────────────┘
```

## Resolution Chain

```
Platform Definition (base)
        ↓
  Plugin Override
        ↓
  ERP Module Override
        ↓
  Runtime Override
        ↓
Effective TableDefinition
        ↓
  TableResolverService
        ↓
 ResolvedTableDefinition
```

## Data Flow

```
register(TableDefinition)
    → TableValidatorService.validate()
    → TableRegistryService.register()
    → TableMetricsService.trackRegistration()
    → TableDiagnosticsService.recordRegister()
    → TableEngine emits TableRegistered

resolve(tableId)
    → TableRegistryService.resolve()
    → TableMetadataRegistryService.mergeInto()
    → TableResolverService resolves columns
    → cache set
    → TableMetricsService.trackResolve()
    → TableDiagnosticsService.recordResolve()
    → TableEngine emits TableResolved
```

## Plugin Support

External table providers register definitions via `TableEngine.register()` specifying `layer: 'plugin'`. The metadata registry ensures plugin overrides apply after the platform baseline but before module and runtime overrides.

## Integration Points

| System                | Integration                                               |
|-----------------------|-----------------------------------------------------------|
| Platform Runtime      | `TableEngine` is `providedIn: 'root'`                     |
| Metadata Engine       | `TableDefinition.metadata` carries engine-specific data   |
| Registry              | `TableRegistryService` follows the same pattern as FormRegistry |
| Theme Engine          | `density` field wires to the theme engine (Sprint 9.2+)   |
| Localization Engine   | `header`, `label` fields to be localized (Sprint 9.2+)   |
| Visual Experience     | `density`, `responsiveRules` consumed by renderer         |
| Permission Engine     | `TablePermissionDefinition`, column-level `permission`    |
