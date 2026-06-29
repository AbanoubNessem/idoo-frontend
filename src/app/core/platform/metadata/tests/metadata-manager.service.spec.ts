import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataManagerService } from '../metadata-manager.service';
import { MetadataCacheService } from '../metadata-cache.service';
import { MetadataSnapshot, MetadataEntry, MetadataType } from '../metadata.types';
import { buildMetadataIndex, buildMetadataStats, createMetadataSnapshot } from '../metadata-snapshot';

function makeEntry(type: MetadataType, id: string, def: unknown = {}, pluginId = 'plugin-a'): MetadataEntry {
  return {
    id,
    type,
    sourcePluginId: pluginId,
    version: '1.0.0',
    definition: def as Readonly<unknown>,
    resolvedAt: new Date().toISOString(),
    validationErrors: [],
    isResolved: true,
    isValid: true,
    overriddenBy: null,
    checksum: 'abc',
  };
}

function buildSnapshot(entries: Map<string, MetadataEntry>): MetadataSnapshot {
  const index = buildMetadataIndex(entries);
  const stats = buildMetadataStats(entries, [], {});
  return createMetadataSnapshot(entries, index, stats, [], []);
}

describe('MetadataManagerService', () => {
  let service: MetadataManagerService;
  let cache: MetadataCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataManagerService);
    cache = TestBed.inject(MetadataCacheService);
  });

  it('should return null snapshot when cache is empty', () => {
    expect(service.getSnapshot()).toBeNull();
  });

  it('should return null from getById when no snapshot', () => {
    expect(service.getById('entity:hr:employee')).toBeUndefined();
  });

  it('should return empty array from getByType when no snapshot', () => {
    expect(service.getByType('entity')).toHaveLength(0);
  });

  describe('with snapshot', () => {
    beforeEach(() => {
      const entries = new Map<string, MetadataEntry>([
        ['entity:hr:employee', makeEntry('entity', 'hr:employee', { apiPath: '/employees' })],
        ['entity:hr:dept', makeEntry('entity', 'hr:dept', {}, 'HR_MODULE')],
        ['form:hr:employee:create', makeEntry('form', 'hr:employee:create', {})],
        ['permission:hr:read', makeEntry('permission', 'hr:read', { code: 'HR:READ' })],
        ['lookup:job-titles', makeEntry('lookup', 'job-titles', { label: 'Job Titles' })],
        ['menu:hr', makeEntry('menu', 'hr', { label: 'HR', parentId: null })],
        ['route:hr:employee:list', makeEntry('route', 'hr:employee:list', { entityId: 'hr:employee', path: '/employees' })],
      ]);
      cache.store(buildSnapshot(entries));
    });

    it('should get snapshot from cache', () => {
      expect(service.getSnapshot()).not.toBeNull();
    });

    it('should get entry by composite id', () => {
      const entry = service.getById('entity:hr:employee');
      expect(entry?.id).toBe('hr:employee');
    });

    it('should get entries by type', () => {
      const entities = service.getByType('entity');
      expect(entities).toHaveLength(2);
    });

    it('should get entries by plugin', () => {
      const entries = service.getByPlugin('HR_MODULE');
      expect(entries).toHaveLength(1);
    });

    it('should find by definition predicate', () => {
      const results = service.findByDefinition<{ apiPath?: string }>('entity', def => !!def.apiPath);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('hr:employee');
    });

    it('should get forms for entity via naming convention', () => {
      const forms = service.getFormsForEntity('hr:employee');
      expect(forms).toContain('hr:employee:create');
    });

    it('should get routes for entity', () => {
      const routes = service.getRoutesForEntity('hr:employee');
      expect(routes).toContain('hr:employee:list');
    });

    it('should get permission by code', () => {
      const perm = service.getPermissionByCode('HR:READ');
      expect(perm?.id).toBe('hr:read');
    });

    it('hasPermission returns true for registered permission code', () => {
      expect(service.hasPermission('HR:READ')).toBe(true);
      expect(service.hasPermission('HR:GHOST')).toBe(false);
    });

    it('should get lookup by id', () => {
      const lookup = service.getLookupById('job-titles');
      expect(lookup?.id).toBe('job-titles');
    });

    it('should get root menu items', () => {
      expect(service.getRootMenuItems()).toContain('hr');
    });

    it('should return count by type', () => {
      const counts = service.countByType();
      expect(counts['entity']).toBe(2);
      expect(counts['form']).toBe(1);
    });

    it('should return total entries count', () => {
      expect(service.totalEntries()).toBe(7);
    });

    it('should return empty errors list for clean snapshot', () => {
      expect(service.getAllErrors()).toHaveLength(0);
    });
  });
});
