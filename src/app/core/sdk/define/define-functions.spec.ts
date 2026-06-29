import { describe, it, expect } from 'vitest';
import {
  defineEntity, defineForm, defineTable, defineAction,
  definePermission, defineMenu, defineRoute, defineWorkflow,
  defineLookup, defineWidget,
} from './define-functions';

describe('defineEntity', () => {
  it('should return frozen entity with defaults', () => {
    const entity = defineEntity({
      id: 'hr:employee',
      apiPath: '/v1/hr/employees',
      labelSingular: 'Employee',
      labelPlural: 'Employees',
      labelField: 'fullName',
      icon: 'person',
      permissions: { list: 'HR:EMPLOYEES:READ' },
    });
    expect(entity.id).toBe('hr:employee');
    expect(entity.searchable).toBe(false);
    expect(entity.exportable).toBe(false);
    expect(Object.isFrozen(entity)).toBe(true);
  });
});

describe('defineForm', () => {
  it('should apply field defaults', () => {
    const form = defineForm({
      sections: [{
        id: 'main',
        fields: [{ key: 'name', type: 'text', label: 'Name' }],
      }],
    });
    expect(form.sections[0].columns).toBe(2);
    expect(form.sections[0].fields[0].required).toBe(false);
  });

  it('should set default layout', () => {
    const form = defineForm({ sections: [{ id: 's1', fields: [{ key: 'f', type: 'text', label: 'F' }] }] });
    expect(form.layout).toBe('two-column');
  });
});

describe('defineTable', () => {
  it('should apply defaults', () => {
    const table = defineTable({
      columns: [{ id: 'name', header: 'Name', type: 'text' }],
    });
    expect(table.pageSize).toBe(20);
    expect(table.selectable).toBe(true);
    expect(table.searchable).toBe(true);
    expect(table.rowClickBehavior).toBe('navigate-detail');
  });
});

describe('defineAction', () => {
  it('should return action with defaults', () => {
    const action = defineAction({
      id: 'hr:employee:activate',
      label: 'Activate',
      scope: ['row'],
      handler: () => {},
    });
    expect(action.variant).toBe('secondary');
    expect(action.order).toBe(99);
  });
});

describe('definePermission', () => {
  it('should return frozen permission', () => {
    const perm = definePermission({
      code: 'HR:EMPLOYEES:READ',
      moduleCode: 'HR',
      resource: 'EMPLOYEES',
      action: 'READ',
      label: 'View Employees',
    });
    expect(perm.code).toBe('HR:EMPLOYEES:READ');
    expect(Object.isFrozen(perm)).toBe(true);
  });
});

describe('defineMenu', () => {
  it('should set default order', () => {
    const menu = defineMenu({ id: 'hr:menu', label: 'HR', icon: 'people', path: '/hr', order: 1 });
    expect(menu.order).toBe(1);
  });

  it('should default order to 99 when omitted', () => {
    const menu = defineMenu({ id: 'hr:menu', label: 'HR', icon: 'people', path: '/hr' } as import('../../registry/registries/menu.registry').MenuItemDef);
    expect(menu.order).toBe(99);
  });
});

describe('defineRoute', () => {
  it('should set preload false by default', () => {
    const route = defineRoute({ path: 'hr/employees', entityId: 'hr:employee' });
    expect(route.preload).toBe(false);
  });
});

describe('defineWorkflow', () => {
  it('should accept valid workflow', () => {
    const wf = defineWorkflow({
      id: 'hr:employee:workflow',
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
    expect(wf.id).toBe('hr:employee:workflow');
  });
});

describe('defineLookup', () => {
  it('should set default source', () => {
    const lookup = defineLookup({ id: 'hr:contract-types', label: 'Contract Types', items: [] });
    expect(lookup.source).toBe('static');
  });
});
