import { TableSelectionContext } from '../table-selection-context';
import { TableSelectionStrategy } from '../table-selection-strategy';

describe('TableSelectionStrategy', () => {
  let ctx: TableSelectionContext;
  let strategy: TableSelectionStrategy;

  beforeEach(() => {
    ctx      = new TableSelectionContext('multiple');
    strategy = new TableSelectionStrategy('multiple');
  });

  it('exposes its mode', () => {
    expect(strategy.mode).toBe('multiple');
  });

  describe('apply() — select', () => {
    it('selects a row', () => {
      strategy.apply({ type: 'select', rowId: 'r1' }, ctx);
      expect(ctx.selectedIds()).toContain('r1');
    });

    it('sets anchorRowId after select', () => {
      strategy.apply({ type: 'select', rowId: 'r1' }, ctx);
      expect(ctx.anchorRowId()).toBe('r1');
    });

    it('is no-op without rowId', () => {
      strategy.apply({ type: 'select' }, ctx);
      expect(ctx.selectedCount()).toBe(0);
    });
  });

  describe('apply() — deselect', () => {
    it('deselects a selected row', () => {
      ctx.select('r1');
      strategy.apply({ type: 'deselect', rowId: 'r1' }, ctx);
      expect(ctx.selectedIds()).not.toContain('r1');
    });
  });

  describe('apply() — toggle', () => {
    it('selects and then deselects on double toggle', () => {
      strategy.apply({ type: 'toggle', rowId: 'r1' }, ctx);
      expect(ctx.selectedIds()).toContain('r1');
      strategy.apply({ type: 'toggle', rowId: 'r1' }, ctx);
      expect(ctx.selectedIds()).not.toContain('r1');
    });

    it('sets anchor after toggle', () => {
      strategy.apply({ type: 'toggle', rowId: 'r2' }, ctx);
      expect(ctx.anchorRowId()).toBe('r2');
    });
  });

  describe('apply() — range', () => {
    const all = ['r1', 'r2', 'r3', 'r4', 'r5'];

    it('selects range from anchor to target', () => {
      ctx.setAnchorRow('r2');
      strategy.apply({ type: 'range', rowId: 'r4', allIds: all }, ctx);
      expect(ctx.selectedIds().sort()).toEqual(['r2', 'r3', 'r4']);
    });

    it('falls back to single select when no anchor', () => {
      strategy.apply({ type: 'range', rowId: 'r3', allIds: all }, ctx);
      expect(ctx.selectedIds()).toContain('r3');
    });

    it('is no-op without rowId', () => {
      ctx.setAnchorRow('r1');
      strategy.apply({ type: 'range', allIds: all }, ctx);
      expect(ctx.selectedCount()).toBe(0);
    });
  });

  describe('apply() — selectAll', () => {
    it('selects all provided ids', () => {
      const all = ['r1', 'r2', 'r3'];
      strategy.apply({ type: 'selectAll', allIds: all }, ctx);
      expect(ctx.selectedCount()).toBe(3);
    });

    it('clears anchor after selectAll', () => {
      ctx.setAnchorRow('r1');
      strategy.apply({ type: 'selectAll', allIds: ['r1', 'r2'] }, ctx);
      expect(ctx.anchorRowId()).toBeNull();
    });
  });

  describe('apply() — clear', () => {
    it('clears all selections', () => {
      ctx.select('r1');
      ctx.select('r2');
      strategy.apply({ type: 'clear' }, ctx);
      expect(ctx.selectedCount()).toBe(0);
    });

    it('clears anchor after clear', () => {
      ctx.setAnchorRow('r1');
      strategy.apply({ type: 'clear' }, ctx);
      expect(ctx.anchorRowId()).toBeNull();
    });
  });

  describe('canSelect / canMultiSelect', () => {
    it('canSelect returns true for multi', () => {
      expect(strategy.canSelect('multiple')).toBeTrue();
    });

    it('canSelect returns false for none', () => {
      expect(strategy.canSelect('none')).toBeFalse();
    });

    it('canMultiSelect returns true for multi', () => {
      expect(strategy.canMultiSelect('multiple')).toBeTrue();
    });

    it('canMultiSelect returns false for single', () => {
      expect(strategy.canMultiSelect('single')).toBeFalse();
    });
  });
});
