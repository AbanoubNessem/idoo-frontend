import { describe, it, expect } from 'vitest';
import { buildMetadataIndex, buildMetadataStats, createMetadataSnapshot } from '../metadata-snapshot';
import { MetadataEntry, MetadataConflict, MetadataType } from '../metadata.types';

function makeEntry(type: MetadataType, id: string, def: unknown = {}): MetadataEntry {
  return {
    id,
    type,
    sourcePluginId: 'plugin',
    version: '1.0.0',
    definition: def as Readonly<unknown>,
    resolvedAt: null,
    validationErrors: [],
    isResolved: true,
    isValid: true,
    overriddenBy: null,
    checksum: 'abc',
  };
}

describe('buildMetadataIndex()', () => {
  it('should build an empty index from empty entries', () => {
    const index = buildMetadataIndex(new Map());
    expect(index.byId.size).toBe(0);
    expect(index.byPlugin.size).toBe(0);
  });

  it('should index all 16 types with empty arrays', () => {
    const index = buildMetadataIndex(new Map());
    expect(index.byType.size).toBe(16);
    expect(index.byType.get('entity')).toHaveLength(0);
    expect(index.byType.get('localization')).toHaveLength(0);
  });

  it('should group entries by type', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:a', makeEntry('entity', 'a')],
      ['form:b', makeEntry('form', 'b')],
    ]);
    const index = buildMetadataIndex(entries);
    expect(index.byType.get('entity')).toHaveLength(1);
    expect(index.byType.get('form')).toHaveLength(1);
  });

  it('should index permissions by code field', () => {
    const entries = new Map<string, MetadataEntry>([
      ['permission:p1', makeEntry('permission', 'p1', { code: 'HR:READ' })],
    ]);
    const index = buildMetadataIndex(entries);
    expect(index.permissionsByCode.get('HR:READ')?.id).toBe('p1');
  });

  it('should fall back to id when permission has no code field', () => {
    const entries = new Map<string, MetadataEntry>([
      ['permission:p1', makeEntry('permission', 'p1', {})],
    ]);
    const index = buildMetadataIndex(entries);
    expect(index.permissionsByCode.get('p1')?.id).toBe('p1');
  });

  it('should build entityToForms using naming convention', () => {
    const entries = new Map<string, MetadataEntry>([
      ['form:hr:employee:create', makeEntry('form', 'hr:employee:create', {})],
    ]);
    const index = buildMetadataIndex(entries);
    const forms = index.entityToForms.get('hr:employee');
    expect(forms).toContain('hr:employee:create');
  });

  it('should not add form to entityToForms when id has no prefix pattern', () => {
    const entries = new Map<string, MetadataEntry>([
      ['form:simple', makeEntry('form', 'simple', {})],
    ]);
    const index = buildMetadataIndex(entries);
    // no ':' prefix → no entity association
    expect(index.entityToForms.size).toBe(0);
  });
});

describe('buildMetadataStats()', () => {
  it('should compute counts correctly', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', { ...makeEntry('entity', 'e1'), isValid: true, isResolved: true }],
      ['entity:e2', { ...makeEntry('entity', 'e2'), isValid: false, isResolved: false }],
    ]);
    const stats = buildMetadataStats(entries, [], { load: 10, validate: 5, resolve: 3, index: 2 });
    expect(stats.totalEntries).toBe(2);
    expect(stats.validEntries).toBe(1);
    expect(stats.invalidEntries).toBe(1);
    expect(stats.resolvedEntries).toBe(1);
    expect(stats.unresolvedEntries).toBe(1);
    expect(stats.totalPipelineDurationMs).toBe(20);
  });
});

describe('createMetadataSnapshot()', () => {
  it('should generate a unique id each call', () => {
    const index = buildMetadataIndex(new Map());
    const stats = buildMetadataStats(new Map(), [], {});
    const s1 = createMetadataSnapshot(new Map(), index, stats, [], []);
    const s2 = createMetadataSnapshot(new Map(), index, stats, [], []);
    expect(s1.id).not.toBe(s2.id);
  });

  it('should include errors and warnings in the snapshot', () => {
    const index = buildMetadataIndex(new Map());
    const stats = buildMetadataStats(new Map(), [], {});
    const err = { entryId: 'e1', type: 'entity' as MetadataType, field: 'apiPath', message: 'required', code: 'ERR', severity: 'error' as const };
    const snap = createMetadataSnapshot(new Map(), index, stats, [err], ['a warning']);
    expect(snap.validationErrors).toHaveLength(1);
    expect(snap.warnings).toHaveLength(1);
  });

  it('should be frozen (immutable)', () => {
    const index = buildMetadataIndex(new Map());
    const stats = buildMetadataStats(new Map(), [], {});
    const snap = createMetadataSnapshot(new Map(), index, stats, [], []);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.validationErrors)).toBe(true);
    expect(Object.isFrozen(snap.warnings)).toBe(true);
  });

  it('should set a valid ISO createdAt timestamp', () => {
    const index = buildMetadataIndex(new Map());
    const stats = buildMetadataStats(new Map(), [], {});
    const snap = createMetadataSnapshot(new Map(), index, stats, [], []);
    expect(new Date(snap.createdAt).getTime()).toBeGreaterThan(0);
  });
});
