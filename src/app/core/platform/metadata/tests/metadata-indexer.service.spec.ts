import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataIndexerService } from '../metadata-indexer.service';
import { MetadataEntry, MetadataType } from '../metadata.types';

function makeEntry(type: MetadataType, id: string, definition: unknown, pluginId = 'plugin-a'): MetadataEntry {
  return {
    id,
    type,
    sourcePluginId: pluginId,
    version: '1.0.0',
    definition: definition as Readonly<unknown>,
    resolvedAt: null,
    validationErrors: [],
    isResolved: true,
    isValid: true,
    overriddenBy: null,
    checksum: 'abc',
  };
}

describe('MetadataIndexerService', () => {
  let service: MetadataIndexerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataIndexerService);
  });

  it('should build empty index for empty entries', () => {
    const index = service.build(new Map());
    expect(index.byId.size).toBe(0);
    expect(index.byType.get('entity')).toHaveLength(0);
    expect(index.byPlugin.size).toBe(0);
  });

  it('should index entries by id', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {})],
    ]);
    const index = service.build(entries);
    expect(index.byId.get('entity:hr:employee')?.id).toBe('hr:employee');
  });

  it('should index entries by type', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {})],
      ['entity:hr:department', makeEntry('entity', 'hr:department', {})],
      ['form:hr:employee:create', makeEntry('form', 'hr:employee:create', {})],
    ]);
    const index = service.build(entries);
    expect(index.byType.get('entity')).toHaveLength(2);
    expect(index.byType.get('form')).toHaveLength(1);
    expect(index.byType.get('workflow')).toHaveLength(0);
  });

  it('should index entries by plugin', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {}, 'HR_MODULE')],
      ['entity:hr:dept', makeEntry('entity', 'hr:dept', {}, 'HR_MODULE')],
      ['entity:acc:journal', makeEntry('entity', 'acc:journal', {}, 'ACCOUNTING_MODULE')],
    ]);
    const index = service.build(entries);
    expect(index.byPlugin.get('HR_MODULE')).toHaveLength(2);
    expect(index.byPlugin.get('ACCOUNTING_MODULE')).toHaveLength(1);
  });

  it('should build entityToForms index via naming convention', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {})],
      ['form:hr:employee:create', makeEntry('form', 'hr:employee:create', {})],
      ['form:hr:employee:edit', makeEntry('form', 'hr:employee:edit', {})],
    ]);
    const index = service.build(entries);
    const forms = service.getFormsForEntity(index, 'hr:employee');
    expect(forms).toContain('hr:employee:create');
    expect(forms).toContain('hr:employee:edit');
  });

  it('should build permissionsByCode index', () => {
    const entries = new Map<string, MetadataEntry>([
      ['permission:hr:read', makeEntry('permission', 'hr:read', { code: 'HR:EMPLOYEES:READ' })],
    ]);
    const index = service.build(entries);
    expect(service.getPermissionByCode(index, 'HR:EMPLOYEES:READ')?.id).toBe('hr:read');
  });

  it('should build lookupById index', () => {
    const entries = new Map<string, MetadataEntry>([
      ['lookup:job-titles', makeEntry('lookup', 'job-titles', { label: 'Job Titles' })],
    ]);
    const index = service.build(entries);
    expect(service.getLookupById(index, 'job-titles')?.id).toBe('job-titles');
  });

  it('should build menuByParent index with null for root items', () => {
    const entries = new Map<string, MetadataEntry>([
      ['menu:hr', makeEntry('menu', 'hr', { label: 'HR', parentId: null })],
      ['menu:hr:employees', makeEntry('menu', 'hr:employees', { label: 'Employees', parentId: 'hr' })],
    ]);
    const index = service.build(entries);
    expect(service.getRootMenuItems(index)).toContain('hr');
    expect(service.getChildMenuItems(index, 'hr')).toContain('hr:employees');
  });

  it('should build entityToWorkflows index', () => {
    const entries = new Map<string, MetadataEntry>([
      ['workflow:hr:leave-approval', makeEntry('workflow', 'hr:leave-approval', { entityId: 'hr:employee' })],
    ]);
    const index = service.build(entries);
    expect(service.getWorkflowsForEntity(index, 'hr:employee')).toContain('hr:leave-approval');
  });

  it('should build entityToActions index', () => {
    const entries = new Map<string, MetadataEntry>([
      ['action:hr:export', makeEntry('action', 'hr:export', { entityId: 'hr:employee', type: 'bulk' })],
    ]);
    const index = service.build(entries);
    expect(service.getActionsForEntity(index, 'hr:employee')).toContain('hr:export');
  });

  it('should build entityToRoutes index', () => {
    const entries = new Map<string, MetadataEntry>([
      ['route:hr:employee:list', makeEntry('route', 'hr:employee:list', { entityId: 'hr:employee', path: '/employees' })],
    ]);
    const index = service.build(entries);
    expect(service.getRoutesForEntity(index, 'hr:employee')).toContain('hr:employee:list');
  });

  it('summarize should return count per type', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', makeEntry('entity', 'e1', {})],
      ['entity:e2', makeEntry('entity', 'e2', {})],
      ['form:f1', makeEntry('form', 'f1', {})],
    ]);
    const index = service.build(entries);
    const summary = service.summarize(index);
    expect(summary['entity']).toBe(2);
    expect(summary['form']).toBe(1);
    expect(summary['workflow']).toBe(0);
  });
});
