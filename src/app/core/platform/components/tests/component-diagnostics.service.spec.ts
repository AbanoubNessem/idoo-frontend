import { TestBed } from '@angular/core/testing';
import { ComponentDiagnosticsService } from '../diagnostics/component-diagnostics.service';
import { Component } from '@angular/core';
import { ComponentRegistryService } from '../registry/component-registry.service';
import { ComponentMetricsService } from '../metrics/component-metrics.service';

@Component({ standalone: true, template: '' })
class StubCmp {}

describe('ComponentDiagnosticsService', () => {
  let service: ComponentDiagnosticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentDiagnosticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start disabled', () => {
    expect(service.enabled()).toBeFalse();
    expect(service.eventCount()).toBe(0);
  });

  it('should not record events when disabled', () => {
    service.recordRender('text', 5);
    expect(service.eventCount()).toBe(0);
  });

  it('should record events when enabled', () => {
    service.enable();
    service.recordRender('text', 5);
    expect(service.eventCount()).toBe(1);
  });

  it('should record render event with durationMs', () => {
    service.enable();
    service.recordRender('number', 12.3);
    const e = service.events()[0];
    expect(e.type).toBe('render');
    expect(e.componentKey).toBe('number');
    expect(e.durationMs).toBe(12.3);
  });

  it('should record error events', () => {
    service.enable();
    service.recordError('json', 'Invalid JSON');
    const e = service.events()[0];
    expect(e.type).toBe('error');
    expect(e.message).toBe('Invalid JSON');
  });

  it('should record lifecycle events', () => {
    service.enable();
    service.recordLifecycle('chip', 'rendered', 'chip-1');
    const e = service.events()[0];
    expect(e.type).toBe('lifecycle');
    expect(e.data?.['phase']).toBe('rendered');
  });

  it('should record validation events', () => {
    service.enable();
    service.recordValidation('text', false, ['Required']);
    const latest = service.latestErrors();
    expect(latest.length).toBe(0); // validation is not type 'error'
  });

  it('should record interaction events', () => {
    service.enable();
    service.recordInteraction('select', 'option selected', { value: 'a' });
    const e = service.events()[0];
    expect(e.type).toBe('interaction');
  });

  it('should filter events by component key', () => {
    service.enable();
    service.recordRender('text', 5);
    service.recordRender('date', 3);
    expect(service.getEventsFor('text').length).toBe(1);
    expect(service.getEventsFor('date').length).toBe(1);
  });

  it('should surface latest error events', () => {
    service.enable();
    service.recordError('json', 'Error 1');
    service.recordError('json', 'Error 2');
    expect(service.latestErrors().length).toBe(2);
  });

  it('should clear all events', () => {
    service.enable();
    service.recordRender('x', 1);
    service.clear();
    expect(service.eventCount()).toBe(0);
  });

  it('should disable recording', () => {
    service.enable();
    service.recordRender('y', 2);
    service.disable();
    service.recordRender('y', 3);
    expect(service.eventCount()).toBe(1);
  });

  it('should generate a report', () => {
    service.enable();
    service.recordRender('markdown', 8);
    const report = service.generateReport();
    expect(report.generatedAt).toBeTruthy();
    expect(report.events.length).toBe(1);
  });

  it('should cap event log at 500 entries', () => {
    service.enable();
    for (let i = 0; i < 600; i++) {
      service.recordRender('x', 1);
    }
    expect(service.eventCount()).toBeLessThanOrEqual(500);
  });
});
