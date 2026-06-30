import { TableSortContext } from '../table-sort-context';
import { TableSortField } from '../table-data.types';

function field(columnId: string, dir: 'asc' | 'desc' = 'asc'): TableSortField {
  return { columnId, field: columnId, direction: dir };
}

describe('TableSortContext', () => {

  it('should start with no sort fields', () => {
    expect(new TableSortContext().fields()).toEqual([]);
  });

  it('should start with isActive=false', () => {
    expect(new TableSortContext().isActive()).toBeFalse();
  });

  it('should apply initial fields from constructor', () => {
    const ctx = new TableSortContext({ fields: [field('name')] });
    expect(ctx.fields().length).toBe(1);
    expect(ctx.isActive()).toBeTrue();
  });

  it('setFields() should replace all fields', () => {
    const ctx = new TableSortContext();
    ctx.setFields([field('name'), field('age')]);
    expect(ctx.fieldCount()).toBe(2);
  });

  it('clear() should remove all fields', () => {
    const ctx = new TableSortContext({ fields: [field('name')] });
    ctx.clear();
    expect(ctx.isActive()).toBeFalse();
  });

  it('addField() should append in multi-column mode', () => {
    const ctx = new TableSortContext({ multiColumn: true });
    ctx.addField(field('name'));
    ctx.addField(field('age'));
    expect(ctx.fieldCount()).toBe(2);
  });

  it('addField() should replace in single-column mode', () => {
    const ctx = new TableSortContext();
    ctx.addField(field('name'));
    ctx.addField(field('age'));
    expect(ctx.fieldCount()).toBe(1);
    expect(ctx.fields()[0].columnId).toBe('age');
  });

  it('addField() should update existing field by columnId', () => {
    const ctx = new TableSortContext({ multiColumn: true });
    ctx.addField(field('name', 'asc'));
    ctx.addField(field('name', 'desc'));
    expect(ctx.fieldCount()).toBe(1);
    expect(ctx.fields()[0].direction).toBe('desc');
  });

  it('removeField() should remove by columnId', () => {
    const ctx = new TableSortContext({ fields: [field('name'), field('age')], multiColumn: true });
    ctx.removeField('name');
    expect(ctx.fieldCount()).toBe(1);
    expect(ctx.fields()[0].columnId).toBe('age');
  });

  it('toggleField() should add a new field in single-column mode', () => {
    const ctx = new TableSortContext();
    ctx.toggleField(field('name', 'asc'));
    expect(ctx.fields()[0].direction).toBe('asc');
  });

  it('toggleField() should cycle asc→desc on same column', () => {
    const ctx = new TableSortContext();
    ctx.toggleField(field('name', 'asc'));
    ctx.toggleField(field('name', 'asc'));
    expect(ctx.fields()[0].direction).toBe('desc');
  });

  it('toggleField() should remove field on third toggle (desc→remove)', () => {
    const ctx = new TableSortContext();
    ctx.toggleField(field('name', 'asc'));
    ctx.toggleField(field('name'));
    ctx.toggleField(field('name'));
    expect(ctx.isActive()).toBeFalse();
  });

  it('setMultiColumn(false) should trim to first field when >1 exist', () => {
    const ctx = new TableSortContext({ fields: [field('name'), field('age')], multiColumn: true });
    ctx.setMultiColumn(false);
    expect(ctx.fieldCount()).toBe(1);
    expect(ctx.fields()[0].columnId).toBe('name');
  });

  it('toConfig() should return a frozen snapshot', () => {
    const ctx = new TableSortContext({ fields: [field('name')] });
    const cfg = ctx.toConfig();
    expect(cfg.fields.length).toBe(1);
    expect(() => (cfg as Record<string, unknown>)['stable'] = false).toThrow();
  });

  it('toConfig() should be independent of subsequent context changes', () => {
    const ctx = new TableSortContext({ fields: [field('name')] });
    const cfg = ctx.toConfig();
    ctx.clear();
    expect(cfg.fields.length).toBe(1);
  });
});
