import { defineEntity, defineForm, defineLookup, defineAction } from '../platform-api';

describe('Platform API factory functions', () => {

  describe('defineEntity()', () => {
    it('should attach __type: "entity"', () => {
      const e = defineEntity({ id: 'test', displayName: 'Test', fields: [] });
      expect(e.__type).toBe('entity');
    });

    it('should preserve all config properties', () => {
      const e = defineEntity({
        id: 'customer', displayName: 'Customer', pluralName: 'Customers',
        permissions: ['read'], fields: [{ key: 'name', type: 'text', label: 'Name' }],
      });
      expect(e.id).toBe('customer');
      expect(e.displayName).toBe('Customer');
      expect(e.pluralName).toBe('Customers');
      expect(e.fields).toHaveLength(1);
      expect(e.permissions).toEqual(['read']);
    });
  });

  describe('defineForm()', () => {
    it('should return the config unchanged (identity function)', () => {
      const config = { id: 'f1', version: '1.0', mode: 'create' as const, layout: 'simple' as const };
      const form = defineForm(config);
      expect(form).toBe(config);
    });

    it('should preserve tabs and sections', () => {
      const form = defineForm({
        id: 'form', version: '1.0', mode: 'create', layout: 'tabs',
        tabs: [{ id: 'tab1', title: 'Tab 1', sections: [] }],
      });
      expect(form.tabs).toHaveLength(1);
      expect(form.tabs![0].id).toBe('tab1');
    });
  });

  describe('defineLookup()', () => {
    it('should attach __type: "lookup"', () => {
      const l = defineLookup({ id: 'country', label: 'Country', queryType: 'country' });
      expect(l.__type).toBe('lookup');
    });

    it('should preserve valueKey and labelKey', () => {
      const l = defineLookup({ id: 'x', label: 'X', queryType: 'x', valueKey: 'code', labelKey: 'name' });
      expect(l.valueKey).toBe('code');
      expect(l.labelKey).toBe('name');
    });
  });

  describe('defineAction()', () => {
    it('should attach __type: "action"', () => {
      const a = defineAction({ id: 'save', label: 'Save' });
      expect(a.__type).toBe('action');
    });

    it('should preserve permissions and handler', () => {
      const a = defineAction({ id: 'del', label: 'Delete', permissions: ['admin'], handler: 'delete' });
      expect(a.permissions).toEqual(['admin']);
      expect(a.handler).toBe('delete');
    });
  });
});
