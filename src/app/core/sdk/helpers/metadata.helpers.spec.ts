import { describe, it, expect } from 'vitest';
import { withDefaults, pick, omit, extendForm, extendTable, createActionsColumn } from './metadata.helpers';

describe('withDefaults', () => {
  it('should merge defaults under the target', () => {
    const result = withDefaults({ a: 1 }, { a: 99, b: 2 });
    expect(result.a).toBe(1);
    expect((result as Record<string, unknown>)['b']).toBe(2);
  });

  it('should apply all defaults when target has no overlap', () => {
    const result = withDefaults({}, { x: 10, y: 20 });
    expect((result as Record<string, unknown>)['x']).toBe(10);
    expect((result as Record<string, unknown>)['y']).toBe(20);
  });
});

describe('pick', () => {
  it('should return only specified keys', () => {
    const result = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
    expect((result as Record<string, unknown>)['b']).toBeUndefined();
  });
});

describe('omit', () => {
  it('should exclude specified keys', () => {
    const result = omit({ a: 1, b: 2, c: 3 }, ['b']);
    expect(result).toEqual({ a: 1, c: 3 });
    expect((result as Record<string, unknown>)['b']).toBeUndefined();
  });
});

describe('extendForm', () => {
  const base = {
    sections: [
      {
        id: 'main',
        fields: [{ key: 'name', type: 'text' as const, label: 'Name' }],
      },
    ],
  };

  it('should add a new section', () => {
    const extended = extendForm(base, {
      addSections: [{ id: 'extra', fields: [{ key: 'notes', type: 'textarea' as const, label: 'Notes' }] }],
    });
    expect(extended.sections).toHaveLength(2);
    expect(extended.sections[1].id).toBe('extra');
  });

  it('should remove a section by id', () => {
    const extended = extendForm(base, { removeSectionIds: ['main'] });
    expect(extended.sections).toHaveLength(0);
  });

  it('should add field to existing section', () => {
    const extended = extendForm(base, {
      addFields: [{ sectionId: 'main', field: { key: 'email', type: 'email' as const, label: 'Email' } }],
    });
    const main = extended.sections.find(s => s.id === 'main')!;
    expect(main.fields).toHaveLength(2);
    expect(main.fields[1].key).toBe('email');
  });
});

describe('extendTable', () => {
  const base = {
    columns: [{ id: 'name', header: 'Name', type: 'text' as const }],
  };

  it('should add new columns', () => {
    const extended = extendTable(base, {
      addColumns: [{ id: 'email', header: 'Email', type: 'text' as const }],
    });
    expect(extended.columns).toHaveLength(2);
  });

  it('should remove column by id', () => {
    const extended = extendTable(base, { removeColumnIds: ['name'] });
    expect(extended.columns).toHaveLength(0);
  });
});

describe('createActionsColumn', () => {
  it('should create a column with actions type', () => {
    const col = createActionsColumn();
    expect(col.id).toBe('_actions');
    expect(col.type).toBe('actions');
    expect(col.sortable).toBe(false);
  });

  it('should accept custom label', () => {
    const col = createActionsColumn('Operations');
    expect(col.header).toBe('Operations');
  });
});
