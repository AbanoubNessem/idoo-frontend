import { TestBed } from '@angular/core/testing';
import { TableInteractionMetrics } from '../table-interaction-metrics.service';

describe('TableInteractionMetrics', () => {
  let metrics: TableInteractionMetrics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    metrics = TestBed.inject(TableInteractionMetrics);
  });

  it('starts with 0 tracked tables', () => {
    expect(metrics.trackedCount()).toBe(0);
  });

  describe('track()', () => {
    it('initialises counters for a table', () => {
      metrics.track('t1');
      expect(metrics.trackedCount()).toBe(1);
      const snap = metrics.getSnapshot('t1')!;
      expect(snap.selectionChanges).toBe(0);
      expect(snap.editStarts).toBe(0);
    });

    it('is idempotent — tracking same table twice keeps count', () => {
      metrics.track('t1');
      metrics.track('t1');
      expect(metrics.trackedCount()).toBe(1);
    });
  });

  describe('recording', () => {
    beforeEach(() => metrics.track('t1'));

    it('recordSelectionChange increments counter', () => {
      metrics.recordSelectionChange('t1');
      metrics.recordSelectionChange('t1');
      expect(metrics.getSnapshot('t1')!.selectionChanges).toBe(2);
    });

    it('recordEditStart increments counter', () => {
      metrics.recordEditStart('t1');
      expect(metrics.getSnapshot('t1')!.editStarts).toBe(1);
    });

    it('recordEditCommit increments counter', () => {
      metrics.recordEditCommit('t1');
      expect(metrics.getSnapshot('t1')!.editCommits).toBe(1);
    });

    it('recordEditCancel increments counter', () => {
      metrics.recordEditCancel('t1');
      expect(metrics.getSnapshot('t1')!.editCancels).toBe(1);
    });

    it('recordValidationFailure increments counter', () => {
      metrics.recordValidationFailure('t1');
      metrics.recordValidationFailure('t1');
      expect(metrics.getSnapshot('t1')!.validationFailures).toBe(2);
    });

    it('updates lastActivityAt on record', () => {
      metrics.recordSelectionChange('t1');
      expect(metrics.getSnapshot('t1')!.lastActivityAt).not.toBeNull();
    });

    it('auto-tracks unknown table when recording', () => {
      metrics.recordSelectionChange('t99');
      expect(metrics.trackedCount()).toBeGreaterThanOrEqual(1);
      expect(metrics.getSnapshot('t99')!.selectionChanges).toBe(1);
    });
  });

  describe('getSnapshot()', () => {
    it('returns null for un-tracked table', () => {
      expect(metrics.getSnapshot('unknown')).toBeNull();
    });

    it('snapshot is frozen', () => {
      metrics.track('t1');
      const snap = metrics.getSnapshot('t1')!;
      expect(Object.isFrozen(snap)).toBeTrue();
    });

    it('snapshot includes trackedTables count', () => {
      metrics.track('t1');
      metrics.track('t2');
      const snap = metrics.getSnapshot('t1')!;
      expect(snap.trackedTables).toBe(2);
    });
  });

  describe('dispose()', () => {
    it('removes table from tracking', () => {
      metrics.track('t1');
      metrics.dispose('t1');
      expect(metrics.trackedCount()).toBe(0);
      expect(metrics.getSnapshot('t1')).toBeNull();
    });
  });
});
