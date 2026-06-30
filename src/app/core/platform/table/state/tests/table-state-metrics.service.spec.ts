import { TestBed } from '@angular/core/testing';
import { TableStateMetricsService } from '../table-state-metrics.service';

describe('TableStateMetricsService', () => {
  let service: TableStateMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableStateMetricsService);
    service.resetAll();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('trackedCount should start at 0', () => {
    expect(service.trackedCount()).toBe(0);
  });

  it('snapshot() should return null for unknown tableId', () => {
    expect(service.snapshot('missing')).toBeNull();
  });

  it('trackUpdate() should increment updateCount', () => {
    service.trackUpdate('orders');
    expect(service.snapshot('orders')!.updateCount).toBe(1);
  });

  it('trackUpdate() should set lastUpdatedAt', () => {
    service.trackUpdate('orders');
    expect(service.snapshot('orders')!.lastUpdatedAt).toBeTruthy();
  });

  it('trackSnapshot() should increment snapshotCount', () => {
    service.trackSnapshot('orders');
    service.trackSnapshot('orders');
    expect(service.snapshot('orders')!.snapshotCount).toBe(2);
  });

  it('trackRestore() should increment restoreCount', () => {
    service.trackRestore('orders');
    expect(service.snapshot('orders')!.restoreCount).toBe(1);
  });

  it('trackReset() should increment resetCount', () => {
    service.trackReset('orders');
    expect(service.snapshot('orders')!.resetCount).toBe(1);
  });

  it('trackDispose() should increment disposeCount', () => {
    service.trackDispose('orders');
    expect(service.snapshot('orders')!.disposeCount).toBe(1);
  });

  it('trackedCount should increase as tables are tracked', () => {
    service.trackUpdate('a');
    service.trackUpdate('b');
    expect(service.trackedCount()).toBe(2);
  });

  it('all() should return snapshots for all tracked tables', () => {
    service.trackUpdate('x');
    service.trackUpdate('y');
    expect(service.all().length).toBe(2);
  });

  it('reset() should remove a specific table', () => {
    service.trackUpdate('orders');
    service.reset('orders');
    expect(service.snapshot('orders')).toBeNull();
  });

  it('resetAll() should remove all tables', () => {
    service.trackUpdate('a');
    service.trackUpdate('b');
    service.resetAll();
    expect(service.trackedCount()).toBe(0);
  });

  it('multiple calls to trackUpdate() should accumulate', () => {
    service.trackUpdate('t');
    service.trackUpdate('t');
    service.trackUpdate('t');
    expect(service.snapshot('t')!.updateCount).toBe(3);
  });

  it('snapshot() tableId field should match the requested tableId', () => {
    service.trackUpdate('products');
    expect(service.snapshot('products')!.tableId).toBe('products');
  });
});
