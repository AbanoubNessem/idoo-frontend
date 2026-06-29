import { TestBed } from '@angular/core/testing';
import { ComponentMetricsService } from '../metrics/component-metrics.service';

describe('ComponentMetricsService', () => {
  let service: ComponentMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with zero renders and errors', () => {
    expect(service.totalRenders()).toBe(0);
    expect(service.totalErrors()).toBe(0);
  });

  it('should record a render', () => {
    service.recordRender('text-field', 12.5);
    expect(service.totalRenders()).toBe(1);
  });

  it('should accumulate render count per component', () => {
    service.recordRender('text-field', 10);
    service.recordRender('text-field', 15);
    const m = service.getMetrics('text-field')!;
    expect(m.renderCount).toBe(2);
  });

  it('should compute average render time', () => {
    service.recordRender('select-field', 10);
    service.recordRender('select-field', 20);
    const m = service.getMetrics('select-field')!;
    expect(m.avgRenderMs).toBe(15);
  });

  it('should record last render time', () => {
    service.recordRender('number-field', 5);
    service.recordRender('number-field', 25);
    expect(service.getMetrics('number-field')!.lastRenderMs).toBe(25);
  });

  it('should record errors', () => {
    service.recordError('json-field');
    service.recordError('json-field');
    expect(service.totalErrors()).toBe(2);
    expect(service.getMetrics('json-field')!.errorCount).toBe(2);
  });

  it('should return null for unknown component', () => {
    expect(service.getMetrics('unknown')).toBeNull();
  });

  it('should reset a single component', () => {
    service.recordRender('chip-field', 5);
    service.reset('chip-field');
    expect(service.getMetrics('chip-field')).toBeNull();
  });

  it('should reset all components', () => {
    service.recordRender('a', 5);
    service.recordRender('b', 10);
    service.reset();
    expect(service.totalRenders()).toBe(0);
  });

  it('should produce a snapshot with all recorded metrics', () => {
    service.recordRender('text-field', 8);
    service.recordRender('date-field', 12);
    const snap = service.snapshot();
    expect(snap['text-field']).toBeTruthy();
    expect(snap['date-field']).toBeTruthy();
  });

  it('should include first and last render timestamps', () => {
    service.recordRender('color-field', 6);
    const m = service.getMetrics('color-field')!;
    expect(m.firstRenderAt).toBeTruthy();
    expect(m.lastRenderAt).toBeTruthy();
  });

  it('should track renders and errors separately across components', () => {
    service.recordRender('a', 1);
    service.recordError('b');
    expect(service.totalRenders()).toBe(1);
    expect(service.totalErrors()).toBe(1);
  });
});
