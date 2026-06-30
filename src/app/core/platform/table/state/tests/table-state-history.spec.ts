import { TableStateHistory } from '../table-state-history';
import { TableStateSnapshot, TableState } from '../table-state.types';

function snap(id = 'snap-1'): TableStateSnapshot {
  const state: TableState = Object.freeze({
    tableId: 'tbl', loading: false, error: null, density: 'default',
    visibleColumns: [], expandedRows: [], focusedCell: null,
    hoveredRow: null, activeRow: null,
    selection: { active: false, mode: 'none' },
    sort: { active: false }, filter: { active: false },
    pagination: { active: false }, editing: { active: false },
  });
  return Object.freeze({ id, tableId: 'tbl', capturedAt: new Date().toISOString(), state });
}

describe('TableStateHistory', () => {

  it('should start with canUndo=false', () => {
    expect(new TableStateHistory().canUndo()).toBeFalse();
  });

  it('should start with canRedo=false', () => {
    expect(new TableStateHistory().canRedo()).toBeFalse();
  });

  it('should start with depth=0', () => {
    expect(new TableStateHistory().depth()).toBe(0);
  });

  it('push() should increase depth', () => {
    const h = new TableStateHistory();
    h.push(snap());
    expect(h.depth()).toBe(1);
  });

  it('push() should set canUndo=true', () => {
    const h = new TableStateHistory();
    h.push(snap());
    expect(h.canUndo()).toBeTrue();
  });

  it('push() should keep canRedo=false', () => {
    const h = new TableStateHistory();
    h.push(snap());
    expect(h.canRedo()).toBeFalse();
  });

  it('push() multiple snapshots should accumulate', () => {
    const h = new TableStateHistory();
    h.push(snap('s1'));
    h.push(snap('s2'));
    h.push(snap('s3'));
    expect(h.depth()).toBe(3);
  });

  it('should enforce maxDepth', () => {
    const h = new TableStateHistory(3);
    h.push(snap('a'));
    h.push(snap('b'));
    h.push(snap('c'));
    h.push(snap('d'));
    expect(h.depth()).toBe(3);
  });

  it('peek() should return the latest snapshot', () => {
    const h = new TableStateHistory();
    h.push(snap('s1'));
    h.push(snap('s2'));
    expect(h.peek()?.id).toBe('s2');
  });

  it('peek() should return null on empty history', () => {
    expect(new TableStateHistory().peek()).toBeNull();
  });

  it('undo() should return null (deferred)', () => {
    const h = new TableStateHistory();
    h.push(snap());
    expect(h.undo()).toBeNull();
  });

  it('redo() should return null (deferred)', () => {
    expect(new TableStateHistory().redo()).toBeNull();
  });

  it('clear() should reset depth to 0', () => {
    const h = new TableStateHistory();
    h.push(snap('s1'));
    h.push(snap('s2'));
    h.clear();
    expect(h.depth()).toBe(0);
  });

  it('clear() should set canUndo=false', () => {
    const h = new TableStateHistory();
    h.push(snap());
    h.clear();
    expect(h.canUndo()).toBeFalse();
  });

  it('clear() should set peek()=null', () => {
    const h = new TableStateHistory();
    h.push(snap());
    h.clear();
    expect(h.peek()).toBeNull();
  });
});
