# Sprint 9.3 — Dynamic Table State Engine: Implementation

## Overview

Sprint 9.3 adds a centralized, signal-driven state engine for all dynamic tables. State is completely separate from metadata (Sprint 9.1) and rendering (Sprint 9.2). Components never read state directly from the engine — they consume signals exposed through `TableStateContext`.

## Directory Structure

```
src/app/core/platform/table/state/
├── table-state.types.ts               # All TypeScript interfaces & types
├── table-state.constants.ts           # Default state, valid densities, max history
├── table-state.tokens.ts              # Injection tokens
├── table-state-store.ts               # Per-instance signal store (non-injectable)
├── table-state-context.ts             # Per-instance context with computed helpers (non-injectable)
├── table-state-history.ts             # Undo/redo architecture (non-injectable, deferred impl)
├── table-state-validator.service.ts   # State validation
├── table-state-serializer.service.ts  # Snapshot serialization / deserialization
├── table-state-metrics.service.ts     # Per-table operation metrics
├── table-state-engine.service.ts      # Main facade (Injectable)
└── index.ts                           # Public API barrel
tests/
├── table-state-store.spec.ts
├── table-state-context.spec.ts
├── table-state-history.spec.ts
├── table-state-validator.service.spec.ts
├── table-state-serializer.service.spec.ts
├── table-state-metrics.service.spec.ts
└── table-state-engine.service.spec.ts
```

## Source File Count

| Category | Count |
|----------|-------|
| Type / constant / token files | 3 |
| Non-injectable classes | 3 |
| Injectable services | 3 |
| Engine (facade) | 1 |
| Barrel index | 1 |
| **Total** | **11** |

## Angular Patterns

- `signal()` / `computed()` — no injection context required for non-injectable classes
- `@Injectable({ providedIn: 'root' })` for all three services and the engine
- `inject()` in the engine to compose services
- No RxJS, no NgRx, no third-party store libraries
- All state mutations go through `TableStateEngine` — stores are not updated directly in production code
