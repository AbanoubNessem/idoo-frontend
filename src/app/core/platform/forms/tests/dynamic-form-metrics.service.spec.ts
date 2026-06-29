import { TestBed } from '@angular/core/testing';
import { DynamicFormMetricsService } from '../metrics/dynamic-form-metrics.service';

describe('DynamicFormMetricsService', () => {
  let service: DynamicFormMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty snapshot', () => {
    expect(Object.keys(service.snapshot()).length).toBe(0);
  });

  it('should initialize metrics for a form', () => {
    service.init('f1', 5, 100, 30);
    const m = service.get('f1');
    expect(m).not.toBeNull();
    expect(m?.formId).toBe('f1');
    expect(m?.fieldCount).toBe(5);
    expect(m?.initDurationMs).toBe(100);
  });

  it('should increment renderCount on recordRender', () => {
    service.init('f1', 3, 50, 10);
    service.recordRender('f1');
    service.recordRender('f1');
    expect(service.get('f1')?.renderCount).toBe(2);
  });

  it('should increment validationCount on recordValidation', () => {
    service.init('f1', 3, 50, 10);
    service.recordValidation('f1');
    expect(service.get('f1')?.validationCount).toBe(1);
  });

  it('should increment submitCount on recordSubmit', () => {
    service.init('f1', 3, 50, 10);
    service.recordSubmit('f1');
    expect(service.get('f1')?.submitCount).toBe(1);
  });

  it('should increment errorCount on recordError', () => {
    service.init('f1', 3, 50, 10);
    service.recordError('f1');
    expect(service.get('f1')?.errorCount).toBe(1);
  });

  it('should return null for unknown form', () => {
    expect(service.get('unknown')).toBeNull();
  });

  it('should reset specific form metrics', () => {
    service.init('f1', 3, 50, 10);
    service.reset('f1');
    expect(service.get('f1')).toBeNull();
  });

  it('should reset all metrics', () => {
    service.init('f1', 3, 50, 10);
    service.init('f2', 5, 80, 20);
    service.reset();
    expect(Object.keys(service.snapshot()).length).toBe(0);
  });

  it('should update lastActivityAt on record', () => {
    service.init('f1', 1, 10, 5);
    const before = service.get('f1')!.lastActivityAt;
    service.recordRender('f1');
    const after = service.get('f1')!.lastActivityAt;
    expect(after >= before).toBeTrue();
  });
});
