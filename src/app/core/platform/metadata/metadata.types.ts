import { Signal } from '@angular/core';

// ─── Engine State ─────────────────────────────────────────────────────────────

export type MetadataEngineState =
  | 'uninitialized'
  | 'loading'
  | 'validating'
  | 'resolving'
  | 'indexing'
  | 'ready'
  | 'refreshing'
  | 'error';

// ─── Metadata Types ───────────────────────────────────────────────────────────

export type MetadataType =
  | 'entity'
  | 'form'
  | 'table'
  | 'route'
  | 'menu'
  | 'action'
  | 'permission'
  | 'lookup'
  | 'widget'
  | 'dashboard'
  | 'report'
  | 'workflow'
  | 'validator'
  | 'layout'
  | 'theme'
  | 'localization';

export const ALL_METADATA_TYPES: readonly MetadataType[] = [
  'entity', 'form', 'table', 'route', 'menu', 'action',
  'permission', 'lookup', 'widget', 'dashboard', 'report',
  'workflow', 'validator', 'layout', 'theme', 'localization',
] as const;

// ─── Validation ───────────────────────────────────────────────────────────────

export interface MetadataValidationError {
  readonly entryId: string;
  readonly type: MetadataType;
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning';
}

export interface MetadataValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<MetadataValidationError>;
  readonly warnings: ReadonlyArray<MetadataValidationError>;
}

// ─── Entry ────────────────────────────────────────────────────────────────────

export interface MetadataEntry<TDef = unknown> {
  readonly id: string;
  readonly type: MetadataType;
  readonly sourcePluginId: string;
  readonly version: string;
  readonly definition: Readonly<TDef>;
  readonly resolvedAt: string | null;
  readonly validationErrors: ReadonlyArray<MetadataValidationError>;
  readonly isResolved: boolean;
  readonly isValid: boolean;
  readonly overriddenBy: string | null;
  readonly checksum: string;
}

// ─── Index ────────────────────────────────────────────────────────────────────

export interface MetadataIndex {
  readonly byId: ReadonlyMap<string, MetadataEntry>;
  readonly byType: ReadonlyMap<MetadataType, ReadonlyArray<MetadataEntry>>;
  readonly byPlugin: ReadonlyMap<string, ReadonlyArray<MetadataEntry>>;
  readonly entityToForms: ReadonlyMap<string, ReadonlyArray<string>>;
  readonly entityToTables: ReadonlyMap<string, ReadonlyArray<string>>;
  readonly entityToWorkflows: ReadonlyMap<string, ReadonlyArray<string>>;
  readonly entityToActions: ReadonlyMap<string, ReadonlyArray<string>>;
  readonly entityToRoutes: ReadonlyMap<string, ReadonlyArray<string>>;
  readonly permissionsByCode: ReadonlyMap<string, MetadataEntry>;
  readonly lookupById: ReadonlyMap<string, MetadataEntry>;
  readonly menuByParent: ReadonlyMap<string | null, ReadonlyArray<string>>;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export type MetadataByTypeStats = Readonly<Record<MetadataType, number>>;

export interface MetadataStats {
  readonly totalEntries: number;
  readonly byType: MetadataByTypeStats;
  readonly validEntries: number;
  readonly invalidEntries: number;
  readonly resolvedEntries: number;
  readonly unresolvedEntries: number;
  readonly conflictCount: number;
  readonly loadDurationMs: number;
  readonly validationDurationMs: number;
  readonly resolutionDurationMs: number;
  readonly indexingDurationMs: number;
  readonly totalPipelineDurationMs: number;
  readonly generatedAt: string;
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

export interface MetadataSnapshot {
  readonly id: string;
  readonly createdAt: string;
  readonly entries: ReadonlyMap<string, MetadataEntry>;
  readonly index: MetadataIndex;
  readonly statistics: MetadataStats;
  readonly validationErrors: ReadonlyArray<MetadataValidationError>;
  readonly warnings: ReadonlyArray<string>;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type MetadataEventType =
  | 'metadata:loading:started'
  | 'metadata:loading:completed'
  | 'metadata:validation:started'
  | 'metadata:validation:completed'
  | 'metadata:resolution:started'
  | 'metadata:resolution:completed'
  | 'metadata:indexing:started'
  | 'metadata:indexing:completed'
  | 'metadata:snapshot:created'
  | 'metadata:ready'
  | 'metadata:refreshing'
  | 'metadata:error';

export interface MetadataEvent {
  readonly type: MetadataEventType;
  readonly timestamp: string;
  readonly payload: unknown;
  readonly correlationId: string;
}

// ─── Conflicts ────────────────────────────────────────────────────────────────

export interface MetadataConflict {
  readonly id: string;
  readonly type: MetadataType;
  readonly existingPluginId: string;
  readonly incomingPluginId: string;
  readonly conflictType: 'duplicate-id' | 'version-conflict';
  readonly resolution: 'incoming-wins' | 'existing-wins';
}

// ─── Resolution ───────────────────────────────────────────────────────────────

export interface MetadataResolutionResult {
  readonly resolved: number;
  readonly unresolved: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export interface MetadataDiagnosticsReport {
  readonly engineState: MetadataEngineState;
  readonly snapshotId: string | null;
  readonly snapshotAgeMs: number | null;
  readonly totalEntries: number;
  readonly validEntries: number;
  readonly invalidEntries: number;
  readonly unresolvedEntries: number;
  readonly conflictCount: number;
  readonly errors: ReadonlyArray<MetadataValidationError>;
  readonly warnings: ReadonlyArray<string>;
  readonly statistics: MetadataStats | null;
  readonly generatedAt: string;
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

export interface PipelineContext {
  entries: Map<string, MetadataEntry>;
  errors: MetadataValidationError[];
  warnings: string[];
  timings: Record<string, number>;
  conflicts: MetadataConflict[];
  snapshot: MetadataSnapshot | null;
}

// ─── Engine API ───────────────────────────────────────────────────────────────

export interface MetadataEngineAPI {
  readonly state: Signal<MetadataEngineState>;
  readonly isReady: Signal<boolean>;
  readonly snapshot: Signal<MetadataSnapshot | null>;
  initialize(): Promise<void>;
  refresh(): Promise<void>;
  getSnapshot(): MetadataSnapshot | null;
  getDiagnostics(): MetadataDiagnosticsReport;
}
