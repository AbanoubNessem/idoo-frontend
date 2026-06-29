import { describe, it, expect } from 'vitest';
import { validateEntity, validateForm, validateTable, validateWorkflow, validatePlugin } from './metadata-validators';

describe('validateEntity', () => {
  it('should pass valid entity', () => {
    const result = validateEntity({
      id: 'hr:employee',
      apiPath: '/v1/employees',
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      labelField: 'name',
      icon: 'person',
      permissions: { list: 'HR:EMPLOYEES:READ' },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail with missing apiPath', () => {
    const result = validateEntity({
      id: 'hr:employee',
      apiPath: '',
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      labelField: 'name',
      icon: 'person',
      permissions: { list: 'HR:EMPLOYEES:READ' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(i => i.path === 'apiPath')).toBe(true);
  });

  it('should fail with missing labelSingular', () => {
    const result = validateEntity({
      id: 'hr:employee',
      apiPath: '/v1/employees',
      labelSingular: '',
      labelPlural: 'Employees',
      labelField: 'name',
      icon: 'person',
      permissions: { list: 'HR:EMPLOYEES:READ' },
    });
    expect(result.valid).toBe(false);
  });

  it('should fail with missing list permission', () => {
    const result = validateEntity({
      id: 'hr:employee',
      apiPath: '/v1/employees',
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      labelField: 'name',
      icon: 'person',
      permissions: { list: '' },
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateForm', () => {
  it('should pass valid form', () => {
    const result = validateForm({
      sections: [{ id: 's1', fields: [{ key: 'name', type: 'text', label: 'Name' }] }],
    });
    expect(result.valid).toBe(true);
  });

  it('should fail with empty sections', () => {
    const result = validateForm({ sections: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(i => i.path === 'sections')).toBe(true);
  });

  it('should fail with section missing fields', () => {
    const result = validateForm({
      sections: [{ id: 's1', fields: [] }],
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateTable', () => {
  it('should pass valid table', () => {
    const result = validateTable({
      columns: [{ id: 'name', header: 'Name', type: 'text' }],
    });
    expect(result.valid).toBe(true);
  });

  it('should fail with empty columns', () => {
    const result = validateTable({ columns: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(i => i.path === 'columns')).toBe(true);
  });
});

describe('validateWorkflow', () => {
  it('should pass valid workflow', () => {
    const result = validateWorkflow({
      id: 'hr:employee:wf',
      entityId: 'hr:employee',
      initialState: 'ACTIVE',
      states: [
        { id: 'ACTIVE', label: 'Active', terminal: false, color: 'success' },
        { id: 'INACTIVE', label: 'Inactive', terminal: true, color: 'neutral' },
      ],
      transitions: [
        { id: 't1', from: 'ACTIVE', to: 'INACTIVE', label: 'Deactivate', permission: 'HR:EMPLOYEES:UPDATE' },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('should fail with empty states', () => {
    const result = validateWorkflow({
      id: 'x',
      entityId: 'e',
      initialState: 'A',
      states: [],
      transitions: [],
    });
    expect(result.valid).toBe(false);
  });

  it('should fail when transition references undefined state', () => {
    const result = validateWorkflow({
      id: 'x',
      entityId: 'e',
      initialState: 'A',
      states: [{ id: 'A', label: 'A', terminal: false, color: 'success' }],
      transitions: [{ id: 't1', from: 'A', to: 'MISSING', label: 'go', permission: 'X:Y:Z' }],
    });
    expect(result.valid).toBe(false);
  });
});

describe('validatePlugin', () => {
  it('should pass valid plugin manifest', () => {
    const result = validatePlugin({
      id: 'HR_MODULE',
      name: 'HR Module',
      version: '1.0.0',
      minimumPlatformVersion: '^1.0.0',
      category: 'erp',
      author: { name: 'Test' },
    });
    expect(result.valid).toBe(true);
  });

  it('should fail with invalid plugin id pattern', () => {
    const result = validatePlugin({
      id: 'invalid-id',
      name: 'Test',
      version: '1.0.0',
      minimumPlatformVersion: '^1.0.0',
      category: 'erp',
      author: { name: 'Test' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(i => i.path === 'id')).toBe(true);
  });

  it('should fail with invalid version', () => {
    const result = validatePlugin({
      id: 'HR_MODULE',
      name: 'Test',
      version: 'not-a-version',
      minimumPlatformVersion: '^1.0.0',
      category: 'erp',
      author: { name: 'Test' },
    });
    expect(result.valid).toBe(false);
  });
});
