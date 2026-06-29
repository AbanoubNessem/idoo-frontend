import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataResolverService } from '../metadata-resolver.service';
import { MetadataEntry, MetadataType } from '../metadata.types';

function makeEntry(type: MetadataType, id: string, definition: unknown): MetadataEntry {
  return {
    id,
    type,
    sourcePluginId: 'test-plugin',
    version: '1.0.0',
    definition: definition as Readonly<unknown>,
    resolvedAt: null,
    validationErrors: [],
    isResolved: false,
    isValid: true,
    overriddenBy: null,
    checksum: 'abc123',
  };
}

describe('MetadataResolverService', () => {
  let service: MetadataResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataResolverService);
  });

  it('should resolve entries with no cross-references as resolved', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', { apiPath: '/employees' })],
    ]);
    const { entries: updated, result } = service.resolve(entries);

    expect(result.resolved).toBe(1);
    expect(result.unresolved).toHaveLength(0);
    expect(updated.get('entity:hr:employee')?.isResolved).toBe(true);
    expect(updated.get('entity:hr:employee')?.resolvedAt).not.toBeNull();
  });

  it('should resolve route with known entityId', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {})],
      ['route:hr:employee:list', makeEntry('route', 'hr:employee:list', { entityId: 'hr:employee', path: '/employees' })],
    ]);
    const { entries: updated, result } = service.resolve(entries);
    expect(updated.get('route:hr:employee:list')?.isResolved).toBe(true);
  });

  it('should mark route as unresolved when entityId is missing from registry', () => {
    const entries = new Map<string, MetadataEntry>([
      ['route:hr:employee:list', makeEntry('route', 'hr:employee:list', { entityId: 'hr:unknown', path: '/unknown' })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.unresolved).toContain('route:hr:employee:list');
  });

  it('should add warning for route with unknown permission', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {})],
      ['route:hr:employee:list', makeEntry('route', 'hr:employee:list', {
        entityId: 'hr:employee',
        path: '/employees',
        permission: 'HR:GHOST:READ',
      })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.warnings.some(w => w.includes('HR:GHOST:READ'))).toBe(true);
  });

  it('should warn for action with unknown entityId', () => {
    const entries = new Map<string, MetadataEntry>([
      ['action:hr:export', makeEntry('action', 'hr:export', { entityId: 'hr:ghost', type: 'custom' })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.unresolved).toContain('action:hr:export');
  });

  it('should warn for workflow with unknown entityId', () => {
    const entries = new Map<string, MetadataEntry>([
      ['workflow:hr:approval', makeEntry('workflow', 'hr:approval', { entityId: 'hr:ghost', initialState: 'DRAFT', states: [] })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.unresolved).toContain('workflow:hr:approval');
  });

  it('should warn for menu with unknown parentId', () => {
    const entries = new Map<string, MetadataEntry>([
      ['menu:hr:sub', makeEntry('menu', 'hr:sub', { label: 'Sub', parentId: 'hr:ghost-parent' })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.warnings.some(w => w.includes('hr:ghost-parent'))).toBe(true);
  });

  it('should warn for dashboard with unknown widgetId', () => {
    const entries = new Map<string, MetadataEntry>([
      ['dashboard:main', makeEntry('dashboard', 'main', {
        title: 'Main',
        slots: [{ widgetId: 'ghost-widget' }],
      })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.warnings.some(w => w.includes('ghost-widget'))).toBe(true);
  });

  it('should warn for form field with unknown entity-picker entityRef', () => {
    const entries = new Map<string, MetadataEntry>([
      ['form:hr:employee:create', makeEntry('form', 'hr:employee:create', {
        sections: [{
          id: 's1',
          fields: [{ key: 'manager', type: 'entity-picker', label: 'Manager', entityRef: 'hr:ghost' }],
        }],
      })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.unresolved).toContain('form:hr:employee:create');
  });

  it('should warn (not error) for form field with unknown lookup', () => {
    const entries = new Map<string, MetadataEntry>([
      ['form:hr:employee:create', makeEntry('form', 'hr:employee:create', {
        sections: [{
          id: 's1',
          fields: [{ key: 'dept', type: 'lookup', label: 'Dept', lookupId: 'ghost-lookup' }],
        }],
      })],
    ]);
    const { result } = service.resolve(entries);
    // warning only, form should still resolve
    expect(result.warnings.some(w => w.includes('ghost-lookup'))).toBe(true);
  });

  it('should mark all entries resolved when no cross-refs', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:a', makeEntry('entity', 'hr:a', {})],
      ['entity:hr:b', makeEntry('entity', 'hr:b', {})],
      ['permission:hr:read', makeEntry('permission', 'hr:read', { code: 'HR:READ' })],
    ]);
    const { result } = service.resolve(entries);
    expect(result.resolved).toBe(3);
    expect(result.unresolved).toHaveLength(0);
  });
});
