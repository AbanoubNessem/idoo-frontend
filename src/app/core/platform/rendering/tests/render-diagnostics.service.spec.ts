import { TestBed } from '@angular/core/testing';
import { RenderDiagnosticsService } from '../render-diagnostics.service';
import { RendererRegistryService } from '../renderer-registry.service';
import { AdapterManagerService } from '../adapter-manager.service';
import { RenderCacheService } from '../render-cache.service';
import { RenderMetricsService } from '../render-metrics.service';
import { RenderEventsService } from '../render-events.service';
import { MaterialAdapter } from '../adapters/material.adapter';

describe('RenderDiagnosticsService', () => {
  let service: RenderDiagnosticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RenderDiagnosticsService,
        RendererRegistryService,
        AdapterManagerService,
        RenderCacheService,
        RenderMetricsService,
        RenderEventsService,
        MaterialAdapter,
      ],
    });
    service = TestBed.inject(RenderDiagnosticsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should start in uninitialized state', () => {
    const report = service.generateReport();
    expect(report.engineState).toBe('uninitialized');
  });

  it('should reflect engine state changes', () => {
    service.setEngineState('ready');
    expect(service.generateReport().engineState).toBe('ready');
  });

  it('should report active adapter', () => {
    const report = service.generateReport();
    expect(report.activeAdapter).toBe('material');
  });

  it('should report zero renderers initially', () => {
    const report = service.generateReport();
    expect(report.registeredFieldRenderers).toBe(0);
    expect(report.registeredLayoutRenderers).toBe(0);
    expect(report.registeredActionRenderers).toBe(0);
  });

  it('should report zero cache size initially', () => {
    const report = service.generateReport();
    expect(report.cachedResults).toBe(0);
  });

  it('should include generatedAt', () => {
    const report = service.generateReport();
    expect(report.generatedAt).toBeTruthy();
  });

  it('should record errors', () => {
    service.recordError({ code: 'TEST_ERROR', message: 'test' });
    const report = service.generateReport();
    expect(report.errors.length).toBe(1);
    expect(report.errors[0].code).toBe('TEST_ERROR');
  });

  it('should clear errors', () => {
    service.recordError({ code: 'E1', message: 'm1' });
    service.clearErrors();
    expect(service.generateReport().errors.length).toBe(0);
  });

  it('should return event log from getEventLog()', () => {
    const log = service.getEventLog();
    expect(Array.isArray(log)).toBeTrue();
  });

  it('should produce a human-readable summary', () => {
    service.setEngineState('ready');
    const summary = service.summarize();
    expect(summary).toContain('ready');
    expect(summary).toContain('material');
  });

  it('should include metrics in report', () => {
    const metrics = TestBed.inject(RenderMetricsService);
    metrics.record('text', 10, true, false);
    const report = service.generateReport();
    expect(report.metrics).toBeTruthy();
    expect(report.metrics!.totalRenders).toBe(1);
  });
});
