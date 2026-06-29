import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataValidatorService } from '../metadata-validator.service';
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

describe('MetadataValidatorService', () => {
  let service: MetadataValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataValidatorService);
  });

  // ─── Entity ───────────────────────────────────────────────────────────────────

  it('should validate a valid entity with no errors', () => {
    const entry = makeEntry('entity', 'hr:employee', {
      apiPath: '/employees',
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      labelField: 'name',
      icon: 'person',
      permissions: { list: 'HR:EMPLOYEES:READ' },
    });
    const errors = service.validateEntry(entry).filter(e => e.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('should report error when entity missing apiPath', () => {
    const entry = makeEntry('entity', 'hr:employee', {
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      permissions: { list: 'HR:EMPLOYEES:READ' },
    });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'ENTITY_MISSING_API_PATH')).toBe(true);
  });

  it('should report error when entity missing permissions.list', () => {
    const entry = makeEntry('entity', 'hr:employee', {
      apiPath: '/employees',
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      permissions: {},
    });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'ENTITY_MISSING_LIST_PERMISSION')).toBe(true);
  });

  // ─── Form ─────────────────────────────────────────────────────────────────────

  it('should validate a valid form with no errors', () => {
    const entry = makeEntry('form', 'hr:employee:create', {
      sections: [{
        id: 's1',
        title: 'Details',
        fields: [{ key: 'name', type: 'text', label: 'Name' }],
      }],
    });
    const errors = service.validateEntry(entry).filter(e => e.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('should report error for form with no sections', () => {
    const entry = makeEntry('form', 'hr:employee:create', { sections: [] });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'FORM_NO_SECTIONS')).toBe(true);
  });

  it('should report error for duplicate field keys', () => {
    const entry = makeEntry('form', 'hr:employee:create', {
      sections: [{
        id: 's1',
        fields: [
          { key: 'name', type: 'text', label: 'Name' },
          { key: 'name', type: 'text', label: 'Name Again' },
        ],
      }],
    });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'FORM_FIELD_DUPLICATE_KEY')).toBe(true);
  });

  // ─── Table ────────────────────────────────────────────────────────────────────

  it('should validate a valid table with no errors', () => {
    const entry = makeEntry('table', 'hr:employee:list', {
      columns: [{ id: 'name', header: 'Name', type: 'text' }],
    });
    const errors = service.validateEntry(entry).filter(e => e.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('should report error for table with no columns', () => {
    const entry = makeEntry('table', 'hr:employee:list', { columns: [] });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'TABLE_NO_COLUMNS')).toBe(true);
  });

  it('should report error for duplicate column ids', () => {
    const entry = makeEntry('table', 'hr:employee:list', {
      columns: [
        { id: 'name', header: 'Name' },
        { id: 'name', header: 'Name Copy' },
      ],
    });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'TABLE_COLUMN_DUPLICATE_ID')).toBe(true);
  });

  // ─── Workflow ────────────────────────────────────────────────────────────────

  it('should report error when workflow initialState does not exist in states', () => {
    const entry = makeEntry('workflow', 'hr:employee:approval', {
      initialState: 'GHOST',
      states: [{ id: 'DRAFT' }, { id: 'APPROVED' }],
      transitions: [],
    });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'WORKFLOW_INVALID_INITIAL_STATE')).toBe(true);
  });

  it('should report error for invalid transition.from state', () => {
    const entry = makeEntry('workflow', 'hr:employee:approval', {
      initialState: 'DRAFT',
      states: [{ id: 'DRAFT' }, { id: 'APPROVED' }],
      transitions: [{ from: 'NONEXISTENT', to: 'APPROVED' }],
    });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'WORKFLOW_INVALID_TRANSITION_FROM')).toBe(true);
  });

  // ─── Permission ───────────────────────────────────────────────────────────────

  it('should report error for permission missing code', () => {
    const entry = makeEntry('permission', 'hr:read', { label: 'Read HR' });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'PERMISSION_MISSING_CODE')).toBe(true);
  });

  // ─── Localization ─────────────────────────────────────────────────────────────

  it('should report error for localization missing locale', () => {
    const entry = makeEntry('localization', 'ar', { translations: {} });
    const errors = service.validateEntry(entry);
    expect(errors.some(e => e.code === 'LOCALIZATION_MISSING_LOCALE')).toBe(true);
  });

  // ─── validateAll ─────────────────────────────────────────────────────────────

  it('validateAll should return valid:false when any entry has errors', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {})],
    ]);
    const result = service.validateAll(entries);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateAll should return valid:true when all entries are valid', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:hr:employee', makeEntry('entity', 'hr:employee', {
        apiPath: '/employees',
        labelSingular: 'Employee',
        labelPlural: 'Employees',
        permissions: { list: 'HR:EMPLOYEES:READ' },
      })],
    ]);
    const result = service.validateAll(entries);
    expect(result.valid).toBe(true);
  });

  it('applyValidation should update isValid flag on each entry', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:bad', makeEntry('entity', 'bad', {})],
    ]);
    const updated = service.applyValidation(entries);
    expect(updated.get('entity:bad')?.isValid).toBe(false);
  });
});
