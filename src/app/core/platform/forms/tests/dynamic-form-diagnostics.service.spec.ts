import { TestBed } from '@angular/core/testing';
import { DynamicFormDiagnosticsService } from '../diagnostics/dynamic-form-diagnostics.service';

describe('DynamicFormDiagnosticsService', () => {
  let service: DynamicFormDiagnosticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormDiagnosticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start disabled', () => {
    expect(service.enabled()).toBeFalse();
  });

  it('should not record when disabled', () => {
    service.record({ type: 'init', formId: 'f1', message: 'test' });
    expect(service.eventCount()).toBe(0);
  });

  it('should record events when enabled', () => {
    service.enable();
    service.record({ type: 'init', formId: 'f1', message: 'initialized' });
    expect(service.eventCount()).toBe(1);
  });

  it('should clear events on disable', () => {
    service.enable();
    service.record({ type: 'error', formId: 'f1', message: 'oops' });
    service.disable();
    expect(service.eventCount()).toBe(0);
  });

  it('should record init event via helper', () => {
    service.enable();
    service.recordInit('f1', 45);
    const events = service.forForm('f1');
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('init');
    expect(events[0].durationMs).toBe(45);
  });

  it('should record error events and expose via latestErrors', () => {
    service.enable();
    service.recordError('f1', 'Something went wrong');
    expect(service.latestErrors().length).toBe(1);
    expect(service.latestErrors()[0].message).toBe('Something went wrong');
  });

  it('should filter events by formId', () => {
    service.enable();
    service.recordInit('f1', 10);
    service.recordInit('f2', 20);
    expect(service.forForm('f1').length).toBe(1);
    expect(service.forForm('f2').length).toBe(1);
  });

  it('should generate a diagnostic report', () => {
    service.enable();
    service.recordInit('f1', 30);
    service.recordRender('f1', 'name', 5);
    service.recordError('f1', 'bad field');
    const report = service.generateReport('f1');
    expect(report.formId).toBe('f1');
    expect(report.totalEvents).toBe(3);
    expect(report.errorCount).toBe(1);
    expect(report.avgRenderMs).toBe(5);
  });

  it('should clear events for a form', () => {
    service.enable();
    service.recordInit('f1', 10);
    service.recordInit('f2', 10);
    service.clearForm('f1');
    expect(service.forForm('f1').length).toBe(0);
    expect(service.forForm('f2').length).toBe(1);
  });

  it('should record validation and lifecycle events', () => {
    service.enable();
    service.recordValidation('f1', '2 errors', 12);
    service.recordLifecycle('f1', 'ready');
    expect(service.forForm('f1').length).toBe(2);
  });
});
