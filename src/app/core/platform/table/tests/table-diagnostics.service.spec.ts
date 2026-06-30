import { TestBed } from '@angular/core/testing';
import { TableDiagnosticsService } from '../diagnostics/table-diagnostics.service';

describe('TableDiagnosticsService', () => {
  let service: TableDiagnosticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableDiagnosticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start disabled', () => {
    expect(service.enabled()).toBeFalse();
  });

  it('should not record when disabled', () => {
    service.record({ type: 'register', tableId: 't1', message: 'test' });
    expect(service.eventCount()).toBe(0);
  });

  it('should record events when enabled', () => {
    service.enable();
    service.record({ type: 'register', tableId: 't1', message: 'registered' });
    expect(service.eventCount()).toBe(1);
  });

  it('should clear events on disable', () => {
    service.enable();
    service.record({ type: 'error', tableId: 't1', message: 'oops' });
    service.disable();
    expect(service.eventCount()).toBe(0);
  });

  it('should record register event via helper', () => {
    service.enable();
    service.recordRegister('t1', 'module');
    expect(service.forTable('t1').length).toBe(1);
    expect(service.forTable('t1')[0].type).toBe('register');
  });

  it('should record resolve event with duration', () => {
    service.enable();
    service.recordResolve('t1', 12);
    const ev = service.forTable('t1')[0];
    expect(ev.type).toBe('resolve');
    expect(ev.durationMs).toBe(12);
  });

  it('should record remove event', () => {
    service.enable();
    service.recordRemove('t1');
    expect(service.forTable('t1')[0].type).toBe('remove');
  });

  it('should record validate event (passed)', () => {
    service.enable();
    service.recordValidate('t1', true, 0);
    expect(service.forTable('t1')[0].message).toContain('passed');
  });

  it('should record validate event (failed)', () => {
    service.enable();
    service.recordValidate('t1', false, 3);
    expect(service.forTable('t1')[0].message).toContain('3 error');
  });

  it('should record serialize event', () => {
    service.enable();
    service.recordSerialize('t1', 5);
    expect(service.forTable('t1')[0].type).toBe('serialize');
  });

  it('should record error and expose via latestErrors', () => {
    service.enable();
    service.recordError('t1', 'Something failed');
    expect(service.latestErrors().length).toBe(1);
    expect(service.latestErrors()[0].message).toBe('Something failed');
  });

  it('should record lifecycle event', () => {
    service.enable();
    service.recordLifecycle('t1', 'override:runtime');
    expect(service.forTable('t1')[0].type).toBe('lifecycle');
  });

  it('should filter events by tableId', () => {
    service.enable();
    service.recordRegister('t1');
    service.recordRegister('t2');
    expect(service.forTable('t1').length).toBe(1);
    expect(service.forTable('t2').length).toBe(1);
  });

  it('should generate a diagnostic report', () => {
    service.enable();
    service.recordRegister('t1');
    service.recordResolve('t1', 10);
    service.recordError('t1', 'oops');
    const report = service.generateReport('t1');
    expect(report.tableId).toBe('t1');
    expect(report.totalEvents).toBe(3);
    expect(report.errorCount).toBe(1);
  });

  it('should clearTable remove events for that table', () => {
    service.enable();
    service.recordRegister('t1');
    service.recordRegister('t2');
    service.clearTable('t1');
    expect(service.forTable('t1').length).toBe(0);
    expect(service.forTable('t2').length).toBe(1);
  });

  it('should clearAll remove all events', () => {
    service.enable();
    service.recordRegister('t1');
    service.recordRegister('t2');
    service.clearAll();
    expect(service.eventCount()).toBe(0);
  });
});
