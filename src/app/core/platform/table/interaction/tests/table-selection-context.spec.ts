import { TestBed } from '@angular/core/testing';
import { TableSelectionContext } from '../table-selection-context';

describe('TableSelectionContext', () => {
  describe('initial state', () => {
    it('defaults to multi mode', () => {
      const ctx = new TableSelectionContext();
      expect(ctx.mode()).toBe('multiple');
    });

    it('accepts constructor mode', () => {
      const ctx = new TableSelectionContext('single');
      expect(ctx.mode()).toBe('single');
    });

    it('starts with empty selection', () => {
      const ctx = new TableSelectionContext();
      expect(ctx.selectedCount()).toBe(0);
      expect(ctx.hasSelection()).toBeFalse();
      expect(ctx.selectedIds()).toEqual([]);
    });

    it('starts with null currentRowId', () => {
      const ctx = new TableSelectionContext();
      expect(ctx.currentRowId()).toBeNull();
    });

    it('starts with null currentCell', () => {
      const ctx = new TableSelectionContext();
      expect(ctx.currentCell()).toBeNull();
    });

    it('starts with null anchorRowId', () => {
      const ctx = new TableSelectionContext();
      expect(ctx.anchorRowId()).toBeNull();
    });
  });

  describe('select()', () => {
    it('selects a row in multi mode', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.select('r1');
      expect(ctx.selectedIds()).toContain('r1');
    });

    it('accumulates multiple rows in multi mode', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.select('r1');
      ctx.select('r2');
      expect(ctx.selectedIds()).toContain('r1');
      expect(ctx.selectedIds()).toContain('r2');
      expect(ctx.selectedCount()).toBe(2);
    });

    it('replaces selection in single mode', () => {
      const ctx = new TableSelectionContext('single');
      ctx.select('r1');
      ctx.select('r2');
      expect(ctx.selectedIds()).toEqual(['r2']);
      expect(ctx.selectedCount()).toBe(1);
    });

    it('does nothing in none mode', () => {
      const ctx = new TableSelectionContext('none');
      ctx.select('r1');
      expect(ctx.selectedCount()).toBe(0);
    });
  });

  describe('deselect()', () => {
    it('removes a selected row', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.select('r1');
      ctx.select('r2');
      ctx.deselect('r1');
      expect(ctx.selectedIds()).not.toContain('r1');
      expect(ctx.selectedIds()).toContain('r2');
    });

    it('is no-op for non-selected row', () => {
      const ctx = new TableSelectionContext();
      ctx.deselect('r1');
      expect(ctx.selectedCount()).toBe(0);
    });
  });

  describe('toggle()', () => {
    it('selects an unselected row', () => {
      const ctx = new TableSelectionContext();
      ctx.toggle('r1');
      expect(ctx.selectedIds()).toContain('r1');
    });

    it('deselects a selected row', () => {
      const ctx = new TableSelectionContext();
      ctx.select('r1');
      ctx.toggle('r1');
      expect(ctx.selectedIds()).not.toContain('r1');
    });
  });

  describe('selectRange()', () => {
    const all = ['r1', 'r2', 'r3', 'r4', 'r5'];

    it('selects rows between fromId and toId inclusive', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.selectRange('r2', 'r4', all);
      expect(ctx.selectedIds().sort()).toEqual(['r2', 'r3', 'r4']);
    });

    it('works in reverse order', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.selectRange('r4', 'r2', all);
      expect(ctx.selectedIds().sort()).toEqual(['r2', 'r3', 'r4']);
    });

    it('does nothing in single mode', () => {
      const ctx = new TableSelectionContext('single');
      ctx.selectRange('r1', 'r3', all);
      expect(ctx.selectedCount()).toBe(0);
    });

    it('does nothing when id not in allIds', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.selectRange('r1', 'rX', all);
      expect(ctx.selectedCount()).toBe(0);
    });

    it('adds to existing selection', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.select('r1');
      ctx.selectRange('r3', 'r5', all);
      expect(ctx.selectedIds()).toContain('r1');
      expect(ctx.selectedIds()).toContain('r3');
    });
  });

  describe('selectAll() / clearSelection()', () => {
    it('selects all given ids in multi mode', () => {
      const ctx  = new TableSelectionContext('multiple');
      const all  = ['a', 'b', 'c'];
      ctx.selectAll(all);
      expect(ctx.selectedCount()).toBe(3);
    });

    it('does nothing in single mode', () => {
      const ctx = new TableSelectionContext('single');
      ctx.selectAll(['a', 'b']);
      expect(ctx.selectedCount()).toBe(0);
    });

    it('clearSelection empties selection', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.selectAll(['a', 'b']);
      ctx.clearSelection();
      expect(ctx.selectedCount()).toBe(0);
    });
  });

  describe('isSelected() / isAllSelected()', () => {
    it('isSelected signal reflects selection', () => {
      const ctx = new TableSelectionContext();
      const sig = ctx.isSelected('r1');
      expect(sig()).toBeFalse();
      ctx.select('r1');
      expect(sig()).toBeTrue();
    });

    it('isAllSelected returns true when all selected', () => {
      const ctx = new TableSelectionContext('multiple');
      const all = ['r1', 'r2'];
      ctx.selectAll(all);
      expect(ctx.isAllSelected(all)()).toBeTrue();
    });

    it('isAllSelected returns false for empty allIds', () => {
      const ctx = new TableSelectionContext();
      expect(ctx.isAllSelected([])()).toBeFalse();
    });
  });

  describe('setMode()', () => {
    it('trims to first when switching to single with multiple selected', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.select('r1');
      ctx.select('r2');
      ctx.setMode('single');
      expect(ctx.selectedCount()).toBe(1);
    });

    it('changes mode signal', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.setMode('none');
      expect(ctx.mode()).toBe('none');
    });
  });

  describe('setCurrentRow / setCurrentCell / setAnchorRow', () => {
    it('updates currentRowId', () => {
      const ctx = new TableSelectionContext();
      ctx.setCurrentRow('r3');
      expect(ctx.currentRowId()).toBe('r3');
    });

    it('updates currentCell', () => {
      const ctx = new TableSelectionContext();
      ctx.setCurrentCell({ rowId: 'r1', columnId: 'name' });
      expect(ctx.currentCell()).toEqual({ rowId: 'r1', columnId: 'name' });
    });

    it('updates anchorRowId', () => {
      const ctx = new TableSelectionContext();
      ctx.setAnchorRow('r5');
      expect(ctx.anchorRowId()).toBe('r5');
    });
  });

  describe('toSnapshot()', () => {
    it('returns frozen snapshot', () => {
      const ctx = new TableSelectionContext('multiple');
      ctx.select('r1');
      ctx.setCurrentRow('r1');
      const snap = ctx.toSnapshot();
      expect(snap.mode).toBe('multiple');
      expect(snap.selectedIds).toContain('r1');
      expect(snap.currentRowId).toBe('r1');
      expect(Object.isFrozen(snap)).toBeTrue();
      expect(Object.isFrozen(snap.selectedIds)).toBeTrue();
    });

    it('snapshot is independent of further mutations', () => {
      const ctx  = new TableSelectionContext();
      ctx.select('r1');
      const snap = ctx.toSnapshot();
      ctx.select('r2');
      expect(snap.selectedIds).not.toContain('r2');
    });
  });
});
