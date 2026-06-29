import { Signal } from '@angular/core';

// ─── Registry Entry Status ────────────────────────────────────────────────────

export type RegistryEntryStatus =
  | 'pending'
  | 'validated'
  | 'registered'
  | 'overridden'
  | 'invalid'
  | 'removed';

// ─── Registry Status ──────────────────────────────────────────────────────────

export type RegistryStatus =
  | 'initializing'
  | 'open'
  | 'publishing'
  | 'published'
  | 'degraded'
  | 'refreshing'
  | 'disposed';

// ─── Registry Entry ───────────────────────────────────────────────────────────

export interface RegistryEntry<TDef = unknown> {
  id: string;
  version: string;
  sourcePluginId: string;
  overriddenBy: string | null;
  dependencies: string[];
  capabilities: string[];
  definition: TDef;
  rawDefinition: TDef;
  checksum: string;
  registeredAt: string;
  publishedAt: string | null;
  status: RegistryEntryStatus;
  validationErrors: string[];
  metadata: Record<string, unknown>;
}

// ─── Override / Merge Strategies ─────────────────────────────────────────────

export type MergeStrategy = 'DEEP' | 'SHALLOW' | 'ADDITIVE' | 'REPLACE' | 'NO_OVERRIDE';

// ─── Conflict Types ───────────────────────────────────────────────────────────

export type ConflictType =
  | 'same-plugin-upgrade'
  | 'declared-override'
  | 'undeclared-conflict'
  | 'capability-conflict'
  | 'circular-dependency';

export interface RegistryConflict {
  entryId: string;
  existingPluginId: string;
  incomingPluginId: string;
  conflictType: ConflictType;
  resolution: 'incoming-wins' | 'existing-wins' | 'rejected';
  reason: string;
}

// ─── Registration Pipeline Step ───────────────────────────────────────────────

export type RegistrationPipelineStep =
  | 'schema-validation'
  | 'id-normalization'
  | 'dependency-resolution'
  | 'conflict-detection'
  | 'override-merge'
  | 'checksum-generation'
  | 'index-update'
  | 'entry-finalization';

// ─── Registry Events ─────────────────────────────────────────────────────────

export type RegistryEventType =
  | 'registry:entry:registered'
  | 'registry:entry:overridden'
  | 'registry:entry:removed'
  | 'registry:entry:invalid'
  | 'registry:published'
  | 'registry:conflict';

export interface RegistryEvent {
  type: RegistryEventType;
  registryName: string;
  entryId: string;
  sourcePluginId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Registry Query ───────────────────────────────────────────────────────────

export interface RegistryQuery<TDef = unknown> {
  pluginId?: string;
  status?: RegistryEntryStatus;
  capabilities?: string[];
  predicate?: (entry: RegistryEntry<TDef>) => boolean;
}

// ─── Registry Diagnostics ────────────────────────────────────────────────────

export interface RegistryDiagnosticsIssue {
  type: 'duplicate' | 'version-conflict' | 'missing-dependency' | 'orphan' | 'cycle';
  entryId: string;
  pluginId: string;
  description: string;
}

export interface RegistryDiagnosticsReport {
  registryName: string;
  totalEntries: number;
  publishedEntries: number;
  invalidEntries: number;
  overriddenEntries: number;
  issues: RegistryDiagnosticsIssue[];
  generatedAt: string;
}

// ─── Registry API Surface ─────────────────────────────────────────────────────

export interface BaseRegistryAPI<TDef> {
  readonly name: string;
  readonly status: Signal<RegistryStatus>;
  register(id: string, definition: TDef, pluginId: string, version?: string): RegistryEntry<TDef>;
  getById(id: string): RegistryEntry<TDef> | undefined;
  getAll(): RegistryEntry<TDef>[];
  query(q: RegistryQuery<TDef>): RegistryEntry<TDef>[];
  has(id: string): boolean;
  remove(id: string, requestingPluginId: string): boolean;
  publish(): void;
  getDiagnostics(): RegistryDiagnosticsReport;
  clear(): void;
}
