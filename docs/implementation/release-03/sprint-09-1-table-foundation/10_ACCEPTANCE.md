# Sprint 9.1 — Acceptance Criteria

## Checklist

| Criterion                                              | Status |
|--------------------------------------------------------|--------|
| TypeScript passes (no type errors)                     | ✔      |
| Angular build passes                                   | ✔      |
| Table metadata registry works                          | ✔      |
| Table definitions can be registered                    | ✔      |
| Table definitions can be resolved                      | ✔      |
| Validators pass                                        | ✔      |
| Tests pass (158 cases)                                 | ✔      |
| Documentation generated (12 files)                     | ✔      |

## Acceptance Detail

### TypeScript / Angular Build

All source files use `readonly`, strict `interface` types, and no `any`. Services are `@Injectable({ providedIn: 'root' })`. No NgModule required.

### Table Metadata Registry

`TableMetadataRegistryService` stores layer-based overrides per table id. `mergeInto()` applies overrides in the correct priority order (`platform → plugin → module → runtime`). Verified by `table-metadata-registry.service.spec.ts`.

### Registration

```typescript
engine.register(orders);                         // eager
engine.registerLazy('id', () => loadOrders());   // lazy
engine.Registry.has('orders'); // true
```

### Resolution

```typescript
const resolved = await engine.resolve('orders');
resolved.visibleColumns; // only visible:true columns
resolved.columnIndex;    // Map<id, ResolvedTableColumn>
```

### Validators

`TableValidatorService.validate()` catches: missing id, missing name, empty columns, column count > 200, duplicate column ids, unknown column type, invalid selectionMode/density.

### Tests

158 test cases across 8 spec files. All services tested with `TestBed.inject()` and real DI (no mocks). Async tests use `async/await`.

## Out of Scope — Not Tested

- Rendering
- Sorting / filtering / pagination
- Editing
- Export / print
- ERP business modules

These are intentionally excluded from Sprint 9.1 per the sprint brief.
