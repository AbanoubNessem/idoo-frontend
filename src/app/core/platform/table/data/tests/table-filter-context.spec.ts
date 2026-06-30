import { TableFilterContext } from '../table-filter-context';
import { TableFilterCondition } from '../table-data.types';

function cond(columnId: string, value: unknown = ''): TableFilterCondition {
  return { columnId, field: columnId, operator: 'contains', value };
}

describe('TableFilterContext', () => {

  it('should start with isActive=false', () => {
    expect(new TableFilterContext().isActive()).toBeFalse();
  });

  it('should start with conditionCount=0', () => {
    expect(new TableFilterContext().conditionCount()).toBe(0);
  });

  it('should apply initial group from constructor', () => {
    const ctx = new TableFilterContext({ logic: 'and', conditions: [cond('name')] });
    expect(ctx.conditionCount()).toBe(1);
    expect(ctx.isActive()).toBeTrue();
  });

  it('addCondition() should add to root', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name', 'John'));
    expect(ctx.conditionCount()).toBe(1);
  });

  it('addCondition() should replace existing condition for same columnId', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name', 'John'));
    ctx.addCondition(cond('name', 'Jane'));
    expect(ctx.conditionCount()).toBe(1);
    expect(ctx.root().conditions[0].value).toBe('Jane');
  });

  it('addCondition() for different columns should accumulate', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name', 'A'));
    ctx.addCondition(cond('age',  10));
    expect(ctx.conditionCount()).toBe(2);
  });

  it('removeCondition() should remove by columnId', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name'));
    ctx.addCondition(cond('age'));
    ctx.removeCondition('name');
    expect(ctx.conditionCount()).toBe(1);
    expect(ctx.root().conditions[0].columnId).toBe('age');
  });

  it('clear() should remove all conditions', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name'));
    ctx.clear();
    expect(ctx.isActive()).toBeFalse();
  });

  it('setLogic() should change root logic', () => {
    const ctx = new TableFilterContext();
    ctx.setLogic('or');
    expect(ctx.root().logic).toBe('or');
  });

  it('setGroup() should replace root entirely', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name'));
    ctx.setGroup({ logic: 'or', conditions: [cond('email'), cond('phone')] });
    expect(ctx.conditionCount()).toBe(2);
    expect(ctx.root().logic).toBe('or');
  });

  it('toConfig() should return a frozen snapshot', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name', 'test'));
    const cfg = ctx.toConfig();
    expect(cfg.root.conditions.length).toBe(1);
    expect(() => (cfg as Record<string, unknown>)['root'] = null).toThrow();
  });

  it('toConfig() should be independent of subsequent changes', () => {
    const ctx = new TableFilterContext();
    ctx.addCondition(cond('name', 'test'));
    const cfg = ctx.toConfig();
    ctx.clear();
    expect(cfg.root.conditions.length).toBe(1);
  });

  it('should handle nested groups in setGroup()', () => {
    const ctx = new TableFilterContext();
    ctx.setGroup({
      logic: 'and',
      conditions: [cond('status', 'active')],
      groups: [{ logic: 'or', conditions: [cond('name'), cond('email')] }],
    });
    expect(ctx.isActive()).toBeTrue();
    expect(ctx.toConfig().root.groups?.length).toBe(1);
  });
});
