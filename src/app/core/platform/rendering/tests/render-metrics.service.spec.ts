import { TestBed } from '@angular/core/testing';
import { RenderMetricsService } from '../render-metrics.service';

describe('RenderMetricsService', () => {
  let service: RenderMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RenderMetricsService] });
    service = TestBed.inject(RenderMetricsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should return zero snapshot when no records', () => {
    const snap = service.getSnapshot();
    expect(snap.totalRenders).toBe(0);
    expect(snap.successfulRenders).toBe(0);
    expect(snap.failedRenders).toBe(0);
    expect(snap.averageDurationMs).toBe(0);
    expect(snap.p95DurationMs).toBe(0);
    expect(snap.cacheHitRate).toBe(0);
  });

  it('should record a successful render', () => {
    service.record('text', 10, true, false);
    const snap = service.getSnapshot();
    expect(snap.totalRenders).toBe(1);
    expect(snap.successfulRenders).toBe(1);
    expect(snap.failedRenders).toBe(0);
  });

  it('should record a failed render', () => {
    service.record('text', 5, false, false);
    const snap = service.getSnapshot();
    expect(snap.failedRenders).toBe(1);
    expect(snap.successfulRenders).toBe(0);
  });

  it('should track renderer usage', () => {
    service.record('text', 10, true, false);
    service.record('text', 10, true, false);
    service.record('number', 5, true, false);
    const snap = service.getSnapshot();
    expect(snap.rendererUsage['text']).toBe(2);
    expect(snap.rendererUsage['number']).toBe(1);
  });

  it('should compute average duration', () => {
    service.record('text', 10, true, false);
    service.record('text', 20, true, false);
    const snap = service.getSnapshot();
    expect(snap.averageDurationMs).toBe(15);
  });

  it('should compute cache hit rate', () => {
    service.record('text', 5, true, true);
    service.record('text', 5, true, false);
    service.record('text', 5, true, true);
    const snap = service.getSnapshot();
    expect(snap.cacheHitRate).toBeCloseTo(2 / 3, 2);
  });

  it('should compute p95 duration', () => {
    for (let i = 1; i <= 100; i++) {
      service.record('text', i, true, false);
    }
    const snap = service.getSnapshot();
    expect(snap.p95DurationMs).toBeGreaterThanOrEqual(95);
  });

  it('should include generatedAt timestamp', () => {
    const snap = service.getSnapshot();
    expect(snap.generatedAt).toBeTruthy();
    expect(() => new Date(snap.generatedAt)).not.toThrow();
  });

  it('should reset all records', () => {
    service.record('text', 10, true, false);
    service.reset();
    expect(service.getRecordCount()).toBe(0);
    const snap = service.getSnapshot();
    expect(snap.totalRenders).toBe(0);
  });

  it('should cap records at 1000', () => {
    for (let i = 0; i < 1005; i++) {
      service.record('text', 5, true, false);
    }
    expect(service.getRecordCount()).toBe(1000);
  });
});
