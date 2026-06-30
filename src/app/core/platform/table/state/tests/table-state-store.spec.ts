import { TableStateStore } from '../table-state-store';
import { TABLE_STATE_DEFAULTS } from '../table-state.constants';

function store(tableId = 'orders', initial?: Parameters<typeof TableStateStore['prototype']['update']>[0]): TableStateStore {
  return new TableStateStore(tableId, initial);
}

describe('TableStateStore', () => {

  it('should set tableId', () => {
    expect(store().tableId).toBe('orders');
  });

  it('should initialise with platform defaults', () => {
    const s = store();
    expect(s.loading()).toBe(false);
    expect(s.error()).toBeNull();
    expect(s.density()).toBe('default');
    expect(s.visibleColumns()).toEqual([]);
    expect(s.expandedRows()).toEqual([]);
    expect(s.focusedCell()).toBeNull();
    expect(s.hoveredRow()).toBeNull();
    expect(s.activeRow()).toBeNull();
  });

  it('should apply initial state passed to constructor', () => {
    const s = store('t', { loading: true, density: 'compact' });
    expect(s.loading()).toBeTrue();
    expect(s.density()).toBe('compact');
  });

  it('update() should change individual fields', () => {
    const s = store();
    s.update({ loading: true });
    expect(s.loading()).toBeTrue();
    s.update({ error: 'oops' });
    expect(s.error()).toBe('oops');
  });

  it('update() should set visibleColumns (defensive copy)', () => {
    const s   = store();
    const arr = ['id', 'name'];
    s.update({ visibleColumns: arr });
    arr.push('extra');
    expect(s.visibleColumns()).toEqual(['id', 'name']);
  });

  it('update() should set expandedRows (defensive copy)', () => {
    const s = store();
    s.update({ expandedRows: [1, 2] });
    expect(s.expandedRows()).toEqual([1, 2]);
  });

  it('update() should set focusedCell', () => {
    const s = store();
    s.update({ focusedCell: { rowId: 'r1', columnId: 'name' } });
    expect(s.focusedCell()).toEqual({ rowId: 'r1', columnId: 'name' });
  });

  it('update() should clear focusedCell when null', () => {
    const s = store();
    s.update({ focusedCell: { rowId: 'r1', columnId: 'c1' } });
    s.update({ focusedCell: null });
    expect(s.focusedCell()).toBeNull();
  });

  it('update() should set hoveredRow and activeRow', () => {
    const s = store();
    s.update({ hoveredRow: 'row-1', activeRow: 'row-2' });
    expect(s.hoveredRow()).toBe('row-1');
    expect(s.activeRow()).toBe('row-2');
  });

  it('update() should set density', () => {
    const s = store();
    s.update({ density: 'comfortable' });
    expect(s.density()).toBe('comfortable');
  });

  it('update() should update sort placeholder', () => {
    const s = store();
    s.update({ sort: { active: true } });
    expect(s.sort().active).toBeTrue();
  });

  it('update() should update filter placeholder', () => {
    const s = store();
    s.update({ filter: { active: true } });
    expect(s.filter().active).toBeTrue();
  });

  it('update() should update pagination placeholder', () => {
    const s = store();
    s.update({ pagination: { active: true } });
    expect(s.pagination().active).toBeTrue();
  });

  it('update() should update selection placeholder', () => {
    const s = store();
    s.update({ selection: { active: true, mode: 'multiple' } });
    expect(s.selection().active).toBeTrue();
    expect(s.selection().mode).toBe('multiple');
  });

  it('update() should update editing placeholder', () => {
    const s = store();
    s.update({ editing: { active: true } });
    expect(s.editing().active).toBeTrue();
  });

  it('reset() should restore platform defaults', () => {
    const s = store();
    s.update({ loading: true, density: 'compact', visibleColumns: ['id'] });
    s.reset();
    expect(s.loading()).toBe(TABLE_STATE_DEFAULTS.loading);
    expect(s.density()).toBe(TABLE_STATE_DEFAULTS.density);
    expect(s.visibleColumns()).toEqual([]);
  });

  it('snapshot() should return a frozen TableState', () => {
    const s    = store();
    s.update({ density: 'compact', visibleColumns: ['id', 'name'] });
    const snap = s.snapshot();
    expect(snap.tableId).toBe('orders');
    expect(snap.density).toBe('compact');
    expect(snap.visibleColumns).toEqual(['id', 'name']);
    expect(() => (snap as Record<string, unknown>)['density'] = 'default').toThrow();
  });

  it('snapshot() should be independent of subsequent store changes', () => {
    const s    = store();
    s.update({ visibleColumns: ['id'] });
    const snap = s.snapshot();
    s.update({ visibleColumns: ['id', 'name'] });
    expect(snap.visibleColumns).toEqual(['id']);
  });

  it('restore() should apply a captured state snapshot', () => {
    const s = store();
    s.update({ density: 'compact', visibleColumns: ['id'] });
    const snap = s.snapshot();
    s.update({ density: 'comfortable', visibleColumns: ['id', 'name', 'email'] });
    s.restore(snap);
    expect(s.density()).toBe('compact');
    expect(s.visibleColumns()).toEqual(['id']);
  });
});
