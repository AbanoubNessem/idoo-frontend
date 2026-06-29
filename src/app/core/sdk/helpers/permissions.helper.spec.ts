import { describe, it, expect } from 'vitest';
import { createPermissions, permissionDefsFromModule } from './permissions.helper';

describe('createPermissions', () => {
  it('should build typed permission constant object', () => {
    const perms = createPermissions('HR', ['EMPLOYEES', 'CONTRACTS']);
    expect(perms.EMPLOYEES.READ).toBe('HR:EMPLOYEES:READ');
    expect(perms.EMPLOYEES.CREATE).toBe('HR:EMPLOYEES:CREATE');
    expect(perms.EMPLOYEES.UPDATE).toBe('HR:EMPLOYEES:UPDATE');
    expect(perms.EMPLOYEES.DELETE).toBe('HR:EMPLOYEES:DELETE');
    expect(perms.CONTRACTS.READ).toBe('HR:CONTRACTS:READ');
  });

  it('should be deeply frozen', () => {
    const perms = createPermissions('FIN', ['INVOICES']);
    expect(Object.isFrozen(perms)).toBe(true);
    expect(Object.isFrozen(perms.INVOICES)).toBe(true);
  });
});

describe('permissionDefsFromModule', () => {
  it('should create PermissionDef array', () => {
    const defs = permissionDefsFromModule('HR', ['EMPLOYEES']);
    expect(defs.length).toBe(4); // READ, CREATE, UPDATE, DELETE
    expect(defs.every(d => d.moduleCode === 'HR')).toBe(true);
    expect(defs.every(d => d.resource === 'EMPLOYEES')).toBe(true);
  });

  it('should use custom labels when provided', () => {
    const defs = permissionDefsFromModule('HR', ['EMPLOYEES'], {
      EMPLOYEES: {
        READ: 'View Employees',
        CREATE: 'Add Employee',
        UPDATE: 'Edit Employee',
        DELETE: 'Remove Employee',
      },
    });
    expect(defs.find(d => d.action === 'READ')?.label).toBe('View Employees');
  });

  it('should generate default labels when not provided', () => {
    const defs = permissionDefsFromModule('HR', ['EMPLOYEES']);
    const readDef = defs.find(d => d.action === 'READ');
    expect(readDef?.label).toContain('EMPLOYEES');
    expect(readDef?.label).toContain('READ');
  });

  it('should generate valid permission codes', () => {
    const defs = permissionDefsFromModule('FIN', ['INVOICES']);
    expect(defs.map(d => d.code)).toContain('FIN:INVOICES:READ');
    expect(defs.map(d => d.code)).toContain('FIN:INVOICES:DELETE');
  });
});
