# Sprint 9.1 — Metadata Model

## TableDefinition

The root metadata contract for every table.

```typescript
interface TableDefinition {
  readonly id:               string;
  readonly name:             string;
  readonly description?:     string;
  readonly version?:         string;
  readonly columns:          TableColumnDefinition[];
  readonly toolbar?:         TableToolbarDefinition;
  readonly actions?:         TableActionDefinition[];
  readonly filters?:         TableFilterDefinition[];
  readonly groups?:          TableGroupDefinition[];
  readonly summaries?:       TableSummaryDefinition[];
  readonly permissions?:     TablePermissionDefinition;
  readonly selectionMode?:   TableSelectionMode;   // 'none' | 'single' | 'multiple'
  readonly density?:         TableDensity;         // 'compact' | 'default' | 'comfortable'
  readonly responsiveRules?: TableResponsiveRule[];
  readonly metadata?:        Record<string, unknown>;
}
```

## TableToolbarDefinition

```typescript
interface TableToolbarDefinition {
  readonly search?:            boolean;
  readonly searchPlaceholder?: string;
  readonly density?:           boolean;
  readonly columnVisibility?:  boolean;
  readonly export?:            boolean;
  readonly print?:             boolean;
  readonly refresh?:           boolean;
  readonly actions?:           TableActionDefinition[];
}
```

## TableActionDefinition

```typescript
interface TableActionDefinition {
  readonly id:          string;
  readonly label:       string;
  readonly icon?:       string;
  readonly type:        'primary' | 'secondary' | 'danger' | 'ghost';
  readonly position:    'toolbar' | 'row' | 'bulk';
  readonly permission?: string | string[];
  readonly disabled?:   boolean | ((ctx: TableActionContext) => boolean);
  readonly visible?:    boolean | ((ctx: TableActionContext) => boolean);
  readonly handler?:    string;
  readonly order?:      number;
}
```

## TableFilterDefinition

```typescript
interface TableFilterDefinition {
  readonly id:            string;
  readonly field:         string;
  readonly label:         string;
  readonly type:          'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';
  readonly options?:      TableFilterOption[];
  readonly defaultValue?: unknown;
}
```

## TableGroupDefinition

```typescript
interface TableGroupDefinition {
  readonly field:      string;
  readonly label?:     string;
  readonly collapsed?: boolean;
  readonly showCount?: boolean;
}
```

## TableSummaryDefinition

```typescript
interface TableSummaryDefinition {
  readonly field:      string;
  readonly type:       'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';
  readonly label?:     string;
  readonly formatter?: TableFormatter;
  readonly customFn?:  string;
}
```

## TablePermissionDefinition

```typescript
interface TablePermissionDefinition {
  readonly view?:   string | string[];
  readonly create?: string | string[];
  readonly edit?:   string | string[];
  readonly delete?: string | string[];
  readonly export?: string | string[];
  readonly print?:  string | string[];
  readonly bulk?:   string | string[];
}
```

## TableResponsiveRule

```typescript
interface TableResponsiveRule {
  readonly breakpoint:     'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly hiddenColumns?: string[];
  readonly density?:       TableDensity;
  readonly stackColumns?:  boolean;
}
```

## Defaults

| Property        | Default       |
|-----------------|---------------|
| `density`       | `'default'`   |
| `selectionMode` | `'none'`      |
| `version`       | `'1.0.0'`     |
| `layer`         | `'module'`    |
