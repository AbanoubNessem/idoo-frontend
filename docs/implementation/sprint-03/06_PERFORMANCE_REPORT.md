# Sprint 3 — Performance Report

**Module:** Dynamic Rendering Engine

---

## Design Decisions for Performance

### 1. Result Caching

`RenderCacheService` caches `RenderResult` by a composite key `fieldType:adapter:mode[:configHash]`.

- First render for a given key: full pipeline execution
- Subsequent renders: direct Map lookup, O(1)
- Expected cache hit rate in typical form rendering: >80% (same field types re-rendered across rows)

### 2. Ring Buffer for Metrics

`RenderMetricsService` uses a fixed-size ring buffer (MAX_RECORDS = 1000). When full, oldest record is shifted out. This bounds memory regardless of render volume.

### 3. Event Log Cap

`RenderEventsService` caps its internal log at 500 entries (FIFO eviction). Events are emitted synchronously to RxJS Subject — no async overhead.

### 4. Signal-Based State

Engine state, cache size, and active adapter are `signal()`s. Computed consumers only re-evaluate when their dependencies change — no dirty-checking on each render.

### 5. Renderer Registry — Map Lookup

All renderer resolution is O(1) Map lookup. No iteration, no linear search.

### 6. AbstractFieldRenderer — Minimal Template Method

`buildInputs()` performs only:
1. Expression evaluation (only if expression fields are present)
2. `Object.assign({})` for input merging

No DOM access, no Angular lifecycle. Pure computation.

---

## Benchmark Targets

| Operation | Target |
|-----------|--------|
| Registry lookup | <0.01 ms |
| Pipeline (cache hit) | <0.1 ms |
| Pipeline (cache miss, simple field) | <2 ms |
| Engine initialization (21 renderers) | <5 ms |
| Diagnostics report generation | <1 ms |

---

## Memory Bounds

| Resource | Bound |
|----------|-------|
| Render metric records | 1,000 max |
| Event log entries | 500 max |
| Cache entries | Unbounded (cleared by Sprint 4 form lifecycle) |

---

## Known Limitations (Sprint 3 Scope)

- `RenderCacheService` has no TTL or LRU eviction. Cache can grow unbounded for high-cardinality field types. Sprint 4 should add a max-size limit.
- Expression evaluation uses `new Function()` which has a cold-start JIT cost on first call. Acceptable for display scenarios.
- `performance.now()` used for timing — available in all modern browsers and Node.js environments.
