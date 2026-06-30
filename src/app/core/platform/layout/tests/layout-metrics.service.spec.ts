import { TestBed } from '@angular/core/testing';
import { LayoutMetricsService } from '../layout-metrics.service';
import { LAYOUT_DIAGNOSTICS_ENABLED } from '../layout.tokens';

describe('LayoutMetricsService (diagnostics enabled)', () => {
  let service: LayoutMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LAYOUT_DIAGNOSTICS_ENABLED, useValue: true }],
    });
    service = TestBed.inject(LayoutMetricsService);
  });

  it('tracks an instance', () => {
    service.track('m1');
    const snap = service.snapshot('m1');
    expect(snap).not.toBeNull();
    expect(snap!.renderCount).toBe(0);
  });

  it('recordRender increments renderCount', () => {
    service.track('m2');
    service.recordRender('m2', 10);
    service.recordRender('m2', 20);
    const snap = service.snapshot('m2')!;
    expect(snap.renderCount).toBe(2);
    expect(snap.lastRenderMs).toBe(20);
    expect(snap.avgRenderMs).toBe(15);
  });

  it('recordResolve increments resolveCount', () => {
    service.track('m3');
    service.recordResolve('m3');
    service.recordResolve('m3');
    expect(service.snapshot('m3')!.resolveCount).toBe(2);
  });

  it('recordBreakpointChange increments counter', () => {
    service.track('m4');
    service.recordBreakpointChange('m4');
    expect(service.snapshot('m4')!.breakpointChanges).toBe(1);
  });

  it('untrack() removes instance', () => {
    service.track('m5');
    service.untrack('m5');
    expect(service.snapshot('m5')).toBeNull();
  });

  it('allSnapshots() returns all tracked instances', () => {
    service.track('a1');
    service.track('a2');
    const ids = service.allSnapshots().map(s => s.instanceId);
    expect(ids).toContain('a1');
    expect(ids).toContain('a2');
  });
});

describe('LayoutMetricsService (diagnostics disabled)', () => {
  let service: LayoutMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LAYOUT_DIAGNOSTICS_ENABLED, useValue: false }],
    });
    service = TestBed.inject(LayoutMetricsService);
  });

  it('does not track when disabled', () => {
    service.track('x');
    expect(service.snapshot('x')).toBeNull();
  });
});
