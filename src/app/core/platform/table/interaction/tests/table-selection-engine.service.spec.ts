import { TestBed } from '@angular/core/testing';
import { TableInteractionEvents } from '../table-interaction-events.service';
import { TableInteractionMetrics } from '../table-interaction-metrics.service';
import { TableSelectionEngine } from '../table-selection-engine.service';
import { TableInteractionEvent } from '../table-interaction.types';

describe('TableSelectionEngine', () => {
  let engine:  TableSelectionEngine;
  let events:  TableInteractionEvents;
  let metrics: TableInteractionMetrics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine  = TestBed.inject(TableSelectionEngine);
    events  = TestBed.inject(TableInteractionEvents);
    metrics = TestBed.inject(TableInteractionMetrics);
  });

  describe('createContext()', () => {
    it('creates and returns a TableSelectionContext', () => {
      const ctx = engine.createContext('t1');
      expect(ctx).toBeDefined();
      expect(ctx.mode()).toBe('multiple');
    });

    it('emits SelectionChanged event on creation', () => {
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'SelectionChanged', spy);
      engine.createContext('t1');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('tracks table in metrics', () => {
      engine.createContext('t1');
      expect(metrics.getSnapshot('t1')).not.toBeNull();
    });

    it('hasContext returns true after creation', () => {
      engine.createContext('t1');
      expect(engine.hasContext('t1')).toBeTrue();
    });

    it('getContext returns same instance', () => {
      const ctx = engine.createContext('t1');
      expect(engine.getContext('t1')).toBe(ctx);
    });

    it('hasContext returns false for unknown table', () => {
      expect(engine.hasContext('unknown')).toBeFalse();
    });
  });

  describe('select()', () => {
    it('selects a row and emits RowSelected', () => {
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      engine.createContext('t1');
      events.on('t1', 'RowSelected', spy);
      engine.select('t1', 'r1');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.selectedIds()).toContain('r1');
    });

    it('is no-op for unknown tableId', () => {
      expect(() => engine.select('unknown', 'r1')).not.toThrow();
    });
  });

  describe('deselect()', () => {
    it('deselects a row and emits RowDeselected', () => {
      engine.createContext('t1');
      engine.select('t1', 'r1');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'RowDeselected', spy);
      engine.deselect('t1', 'r1');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.selectedIds()).not.toContain('r1');
    });
  });

  describe('toggle()', () => {
    it('toggles selection and emits SelectionChanged', () => {
      engine.createContext('t1');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'SelectionChanged', spy);
      engine.toggle('t1', 'r1');
      expect(engine.getContext('t1')!.selectedIds()).toContain('r1');
    });
  });

  describe('selectRange()', () => {
    it('selects a range of rows', () => {
      engine.createContext('t1');
      engine.select('t1', 'r2'); // sets anchor
      engine.selectRange('t1', 'r4', ['r1', 'r2', 'r3', 'r4', 'r5']);
      const ids = engine.getContext('t1')!.selectedIds();
      expect(ids).toContain('r2');
      expect(ids).toContain('r3');
      expect(ids).toContain('r4');
    });
  });

  describe('selectAll()', () => {
    it('selects all rows and emits AllSelected', () => {
      engine.createContext('t1');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'AllSelected', spy);
      engine.selectAll('t1', ['r1', 'r2', 'r3']);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.selectedCount()).toBe(3);
    });
  });

  describe('clearSelection()', () => {
    it('clears all selections and emits SelectionCleared', () => {
      engine.createContext('t1');
      engine.selectAll('t1', ['r1', 'r2']);
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'SelectionCleared', spy);
      engine.clearSelection('t1');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.selectedCount()).toBe(0);
    });
  });

  describe('setCurrentRow()', () => {
    it('updates currentRowId and emits CurrentRowChanged', () => {
      engine.createContext('t1');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'CurrentRowChanged', spy);
      engine.setCurrentRow('t1', 'r3');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.currentRowId()).toBe('r3');
    });
  });

  describe('setCurrentCell()', () => {
    it('updates currentCell and emits CurrentCellChanged', () => {
      engine.createContext('t1');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'CurrentCellChanged', spy);
      engine.setCurrentCell('t1', { rowId: 'r1', columnId: 'name' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.currentCell()).toEqual({ rowId: 'r1', columnId: 'name' });
    });
  });

  describe('snapshot()', () => {
    it('returns null for unknown table', () => {
      expect(engine.snapshot('x')).toBeNull();
    });

    it('returns a frozen selection snapshot', () => {
      engine.createContext('t1');
      engine.select('t1', 'r1');
      const snap = engine.snapshot('t1')!;
      expect(Object.isFrozen(snap)).toBeTrue();
      expect(snap.selectedIds).toContain('r1');
    });
  });

  describe('metrics integration', () => {
    it('records a selection change per action', () => {
      engine.createContext('t1');
      engine.select('t1', 'r1');
      engine.select('t1', 'r2');
      const snap = metrics.getSnapshot('t1')!;
      expect(snap.selectionChanges).toBe(2);
    });
  });

  describe('dispose()', () => {
    it('removes context and stops event delivery', () => {
      engine.createContext('t1');
      engine.dispose('t1');
      expect(engine.hasContext('t1')).toBeFalse();
      expect(engine.getContext('t1')).toBeNull();
    });

    it('listTables excludes disposed table', () => {
      engine.createContext('t1');
      engine.createContext('t2');
      engine.dispose('t1');
      expect(engine.listTables()).not.toContain('t1');
      expect(engine.listTables()).toContain('t2');
    });
  });
});
