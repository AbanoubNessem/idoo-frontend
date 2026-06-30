import { TestBed } from '@angular/core/testing';
import { TableMetricsService } from '../metrics/table-metrics.service';

describe('TableMetricsService', () => {
  let service: TableMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with 0 tracked tables', () => {
    expect(service.trackedCount()).toBe(0);
  });

  it('should return null snapshot for unknown tableId', () => {
    expect(service.snapshot('unknown')).toBeNull();
  });

  // ─── trackRegistration ────────────────────────────────────────────────────

  it('should track a registration', () => {
    service.trackRegistration('t1');
    const snap = service.snapshot('t1');
    expect(snap).not.toBeNull();
    expect(snap!.registrationCount).toBe(1);
  });

  it('should accumulate multiple registrations', () => {
    service.trackRegistration('t1');
    service.trackRegistration('t1');
    expect(service.snapshot('t1')!.registrationCount).toBe(2);
  });

  it('should increment trackedCount on first registration', () => {
    service.trackRegistration('t1');
    expect(service.trackedCount()).toBe(1);
  });

  // ─── trackResolve ─────────────────────────────────────────────────────────

  it('should track a resolve with duration', () => {
    service.trackResolve('t1', 20);
    const snap = service.snapshot('t1');
    expect(snap!.resolveCount).toBe(1);
    expect(snap!.avgResolveDurationMs).toBe(20);
  });

  it('should compute average resolve duration', () => {
    service.trackResolve('t1', 10);
    service.trackResolve('t1', 30);
    expect(service.snapshot('t1')!.avgResolveDurationMs).toBe(20);
  });

  it('should return avgResolveDurationMs of 0 when no resolves', () => {
    service.trackRegistration('t1');
    expect(service.snapshot('t1')!.avgResolveDurationMs).toBe(0);
  });

  // ─── trackError ───────────────────────────────────────────────────────────

  it('should track errors', () => {
    service.trackError('t1');
    service.trackError('t1');
    expect(service.snapshot('t1')!.errorCount).toBe(2);
  });

  // ─── all ──────────────────────────────────────────────────────────────────

  it('all() should return snapshots for all tracked tables', () => {
    service.trackRegistration('t1');
    service.trackRegistration('t2');
    expect(service.all().length).toBe(2);
  });

  // ─── reset ────────────────────────────────────────────────────────────────

  it('should reset a specific table', () => {
    service.trackRegistration('t1');
    service.reset('t1');
    expect(service.snapshot('t1')).toBeNull();
    expect(service.trackedCount()).toBe(0);
  });

  it('should resetAll clear all metrics', () => {
    service.trackRegistration('t1');
    service.trackRegistration('t2');
    service.resetAll();
    expect(service.trackedCount()).toBe(0);
    expect(service.all().length).toBe(0);
  });

  // ─── lastActivityAt ───────────────────────────────────────────────────────

  it('should update lastActivityAt on each track call', () => {
    service.trackRegistration('t1');
    const first = service.snapshot('t1')!.lastActivityAt;
    service.trackResolve('t1', 5);
    const second = service.snapshot('t1')!.lastActivityAt;
    expect(new Date(second).getTime()).toBeGreaterThanOrEqual(new Date(first).getTime());
  });

  // ─── independent tables ───────────────────────────────────────────────────

  it('should track tables independently', () => {
    service.trackRegistration('t1');
    service.trackResolve('t1', 10);
    service.trackError('t2');
    expect(service.snapshot('t1')!.errorCount).toBe(0);
    expect(service.snapshot('t2')!.registrationCount).toBe(0);
  });
});
