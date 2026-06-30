import { TestBed } from '@angular/core/testing';
import { TableInteractionEvents } from '../table-interaction-events.service';
import { TableInteractionMetrics } from '../table-interaction-metrics.service';
import { TableEditingEngine } from '../table-editing-engine.service';
import { TableInteractionEvent, TableValidatorFn } from '../table-interaction.types';

describe('TableEditingEngine', () => {
  let engine:  TableEditingEngine;
  let events:  TableInteractionEvents;
  let metrics: TableInteractionMetrics;

  const ROW = { id: 'r1', name: 'Alice', age: 30 };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine  = TestBed.inject(TableEditingEngine);
    events  = TestBed.inject(TableInteractionEvents);
    metrics = TestBed.inject(TableInteractionMetrics);
  });

  describe('createContext()', () => {
    it('creates and returns a TableEditingContext', () => {
      const ctx = engine.createContext('t1');
      expect(ctx).toBeDefined();
      expect(ctx.mode()).toBe('cell');
    });

    it('hasContext returns true after creation', () => {
      engine.createContext('t1');
      expect(engine.hasContext('t1')).toBeTrue();
    });

    it('getContext returns same instance', () => {
      const ctx = engine.createContext('t1');
      expect(engine.getContext('t1')).toBe(ctx);
    });

    it('getContext returns null for unknown', () => {
      expect(engine.getContext('x')).toBeNull();
    });

    it('tracks metrics on creation', () => {
      engine.createContext('t1');
      expect(metrics.getSnapshot('t1')).not.toBeNull();
    });
  });

  describe('startCellEdit()', () => {
    it('puts context into cell editing mode', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'name' }, 'Alice');
      const ctx = engine.getContext('t1')!;
      expect(ctx.isEditing()).toBeTrue();
      expect(ctx.editingCell()).toEqual({ rowId: 'r1', columnId: 'name' });
    });

    it('emits EditStarted event', () => {
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      engine.createContext('t1');
      events.on('t1', 'EditStarted', spy);
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'name' }, 'Alice');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('records editStart in metrics', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'name' }, 'Alice');
      expect(metrics.getSnapshot('t1')!.editStarts).toBe(1);
    });

    it('is no-op for unknown table', () => {
      expect(() =>
        engine.startCellEdit('x', { rowId: 'r1', columnId: 'name' }, 'v'),
      ).not.toThrow();
    });
  });

  describe('startRowEdit()', () => {
    it('puts context into row editing mode', () => {
      engine.createContext('t1', 'row');
      engine.startRowEdit('t1', 'r1', ROW);
      const ctx = engine.getContext('t1')!;
      expect(ctx.isEditing()).toBeTrue();
      expect(ctx.editingRowId()).toBe('r1');
    });

    it('emits EditStarted with row mode', () => {
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      engine.createContext('t1');
      events.on('t1', 'EditStarted', spy);
      engine.startRowEdit('t1', 'r1', ROW);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.first().args[0].payload).toEqual(
        jasmine.objectContaining({ mode: 'row' }),
      );
    });
  });

  describe('setValue() / getValue()', () => {
    it('sets and reads a pending edit value', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'name' }, 'Alice');
      engine.setValue('t1', 'name', 'Bob');
      expect(engine.getValue('t1', 'name')).toBe('Bob');
    });

    it('getValue returns undefined for unknown table', () => {
      expect(engine.getValue('x', 'name')).toBeUndefined();
    });
  });

  describe('commitEdit()', () => {
    it('returns commits and emits EditCommitted', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'name' }, 'Alice');
      engine.setValue('t1', 'name', 'Bob');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'EditCommitted', spy);
      const commits = engine.commitEdit('t1');
      expect(commits).not.toBeNull();
      expect(commits!.length).toBe(1);
      expect(commits![0].value).toBe('Bob');
      expect(commits![0].previousValue).toBe('Alice');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('returns null when not editing', () => {
      engine.createContext('t1');
      expect(engine.commitEdit('t1')).toBeNull();
    });

    it('records commit in metrics', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'x' }, 1);
      engine.setValue('t1', 'x', 2);
      engine.commitEdit('t1');
      expect(metrics.getSnapshot('t1')!.editCommits).toBe(1);
    });

    it('clears editing state after commit', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'x' }, 'a');
      engine.setValue('t1', 'x', 'b');
      engine.commitEdit('t1');
      expect(engine.getContext('t1')!.isEditing()).toBeFalse();
    });
  });

  describe('cancelEdit()', () => {
    it('cancels and emits EditCancelled', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'x' }, 'old');
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      events.on('t1', 'EditCancelled', spy);
      engine.cancelEdit('t1');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(engine.getContext('t1')!.isEditing()).toBeFalse();
    });

    it('records cancel in metrics', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'x' }, 'v');
      engine.cancelEdit('t1');
      expect(metrics.getSnapshot('t1')!.editCancels).toBe(1);
    });
  });

  describe('validate()', () => {
    it('returns true with no validators registered', () => {
      engine.createContext('t1');
      expect(engine.validate('t1', ROW)).toBeTrue();
    });

    it('calls registered validator and marks error on failure', () => {
      engine.createContext('t1');
      engine.startRowEdit('t1', 'r1', ROW);
      engine.setValue('t1', 'name', '');
      const validator: TableValidatorFn = (v) =>
        v ? { valid: true, error: null } : { valid: false, error: 'Required' };
      engine.registerValidator('t1', 'name', validator);
      const result = engine.validate('t1', ROW);
      expect(result).toBeFalse();
      expect(engine.getContext('t1')!.getValidationError('name')).toBe('Required');
    });

    it('emits EditValidationFailed on failure', () => {
      const spy = jasmine.createSpy<(e: TableInteractionEvent) => void>();
      engine.createContext('t1');
      engine.startRowEdit('t1', 'r1', ROW);
      engine.setValue('t1', 'name', '');
      engine.registerValidator('t1', 'name', () => ({ valid: false, error: 'Bad' }));
      events.on('t1', 'EditValidationFailed', spy);
      engine.validate('t1', ROW);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('records validation failure in metrics', () => {
      engine.createContext('t1');
      engine.startRowEdit('t1', 'r1', ROW);
      engine.registerValidator('t1', 'name', () => ({ valid: false, error: 'Bad' }));
      engine.validate('t1', ROW);
      expect(metrics.getSnapshot('t1')!.validationFailures).toBe(1);
    });

    it('commitEdit returns null when validation fails', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'name' }, 'Alice');
      engine.setValue('t1', 'name', '');
      engine.registerValidator('t1', 'name', () => ({ valid: false, error: 'Required' }));
      const result = engine.commitEdit('t1', ROW);
      expect(result).toBeNull();
    });
  });

  describe('registerValidator / removeValidator', () => {
    it('removeValidator stops the validator from running', () => {
      engine.createContext('t1');
      engine.startRowEdit('t1', 'r1', ROW);
      engine.setValue('t1', 'name', '');
      engine.registerValidator('t1', 'name', () => ({ valid: false, error: 'Req' }));
      engine.removeValidator('t1', 'name');
      expect(engine.validate('t1', ROW)).toBeTrue();
    });
  });

  describe('resolveEditor()', () => {
    it('resolves text for string column', () => {
      const r = engine.resolveEditor('string');
      expect(r.editorType).toBe('text');
    });

    it('respects override type', () => {
      const r = engine.resolveEditor('string', 'textarea');
      expect(r.editorType).toBe('textarea');
    });
  });

  describe('canEdit()', () => {
    it('returns false for unknown table', () => {
      expect(engine.canEdit('unknown', { columnId: 'x', columnType: 'text' })).toBeFalse();
    });

    it('returns true for editable column', () => {
      engine.createContext('t1');
      expect(engine.canEdit('t1', { columnId: 'x', columnType: 'text' })).toBeTrue();
    });

    it('returns false for readOnly column', () => {
      engine.createContext('t1');
      expect(engine.canEdit('t1', { columnId: 'id', columnType: 'number', readOnly: true })).toBeFalse();
    });
  });

  describe('snapshot()', () => {
    it('returns null for unknown table', () => {
      expect(engine.snapshot('x')).toBeNull();
    });

    it('returns frozen editing snapshot', () => {
      engine.createContext('t1');
      engine.startCellEdit('t1', { rowId: 'r1', columnId: 'x' }, 'v');
      const snap = engine.snapshot('t1')!;
      expect(Object.isFrozen(snap)).toBeTrue();
      expect(snap.isDirty).toBeFalse();
    });
  });

  describe('dispose()', () => {
    it('removes context', () => {
      engine.createContext('t1');
      engine.dispose('t1');
      expect(engine.hasContext('t1')).toBeFalse();
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
