// ─── Types & Tokens ──────────────────────────────────────────────────────────
export * from './table.types';
export * from './table.constants';
export * from './table.tokens';

// ─── Registry ────────────────────────────────────────────────────────────────
export { TableRegistryService }         from './registry/table-registry.service';
export { TableMetadataRegistryService } from './registry/table-metadata-registry.service';

// ─── Resolver ────────────────────────────────────────────────────────────────
export { TableResolverService } from './resolver/table-resolver.service';

// ─── Validator ───────────────────────────────────────────────────────────────
export { TableValidatorService } from './validator/table-validator.service';

// ─── Serializer ──────────────────────────────────────────────────────────────
export { TableSerializerService } from './serializer/table-serializer.service';

// ─── Diagnostics ─────────────────────────────────────────────────────────────
export { TableDiagnosticsService } from './diagnostics/table-diagnostics.service';

// ─── Metrics ─────────────────────────────────────────────────────────────────
export { TableMetricsService } from './metrics/table-metrics.service';

// ─── Engine ──────────────────────────────────────────────────────────────────
export { TableEngine } from './engine/table-engine.service';

// ─── Rendering ───────────────────────────────────────────────────────────────
export * from './rendering';

// ─── State ───────────────────────────────────────────────────────────────────
export * from './state';

// ─── Data Operations ─────────────────────────────────────────────────────────
export * from './data';

// ─── Interaction (Selection + Editing) ───────────────────────────────────────
export * from './interaction';
