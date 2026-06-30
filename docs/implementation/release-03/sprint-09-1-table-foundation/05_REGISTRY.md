# Sprint 9.1 — Registry

## TableRegistryService

Core signal-based registry for `TableDefinition` objects.

### API

```typescript
class TableRegistryService {
  // Signal-based reactive state
  readonly registeredCount: Signal<number>;
  readonly all: Signal<TableRegistryEntry[]>;

  // Registration
  register(definition: TableDefinition, options?: TableRegistrationOptions): void;
  registerLazy(id: string, factory: () => Promise<TableDefinition>, options?: TableRegistrationOptions): void;

  // Resolution
  resolve(id: string): Promise<TableDefinition | null>;

  // Lookup
  get(id: string): TableRegistryEntry | undefined;
  has(id: string): boolean;

  // Removal
  remove(id: string): boolean;

  // Listing
  list(): TableRegistryEntry[];
  listByLayer(layer: TableRegistryLayer): TableRegistryEntry[];
  query(tags: string[]): TableRegistryEntry[];
}
```

### TableRegistrationOptions

```typescript
interface TableRegistrationOptions {
  readonly overwrite?: boolean;          // Replace if already registered
  readonly layer?:     TableRegistryLayer; // Default: 'module'
  readonly tags?:      string[];         // Queryable tags
  readonly factory?:   () => Promise<TableDefinition>; // For lazy registration
}
```

### Layers

```typescript
type TableRegistryLayer = 'platform' | 'plugin' | 'module' | 'runtime';
```

---

## TableMetadataRegistryService

Manages layer-based overrides that are merged on top of the base definition during resolution.

### API

```typescript
class TableMetadataRegistryService {
  // Signal
  readonly overrideCount: Signal<number>;

  // Overrides
  applyOverride(tableId: string, layer: TableRegistryLayer, patch: Partial<Omit<TableDefinition, 'id' | 'name'>>): void;
  removeOverride(tableId: string, layer: TableRegistryLayer): boolean;
  getOverridesFor(tableId: string): TableLayerOverride[];

  // Merge
  mergeInto(base: TableDefinition): TableDefinition;

  // Inspection
  hasOverrides(tableId: string): boolean;
  listTableIds(): string[];

  // Cleanup
  clearForTable(tableId: string): void;
  clearAll(): void;
}
```

### Resolution Priority

Overrides are applied in order: `platform → plugin → module → runtime`.

`runtime` has the highest priority and wins over all other layers.

---

## TableRegistryEntry

```typescript
interface TableRegistryEntry {
  readonly id:           string;
  readonly definition:   TableDefinition;
  readonly layer:        TableRegistryLayer;
  readonly registeredAt: string;  // ISO timestamp
  readonly tags:         string[];
  readonly factory?:     () => Promise<TableDefinition>;
}
```
