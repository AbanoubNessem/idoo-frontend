import { TestBed } from '@angular/core/testing';
import { RenderingEngineService } from '../rendering-engine.service';
import { RendererRegistryService } from '../renderer-registry.service';
import { RenderPipelineService } from '../render-pipeline.service';
import { RenderDiagnosticsService } from '../render-diagnostics.service';
import { RenderMetricsService } from '../render-metrics.service';
import { RenderCacheService } from '../render-cache.service';
import { RenderEventsService } from '../render-events.service';
import { AdapterManagerService } from '../adapter-manager.service';
import { RendererResolverService } from '../renderer-resolver.service';
import { RendererFactoryService } from '../renderer-factory.service';
import { MaterialAdapter } from '../adapters/material.adapter';
import { FieldRenderRequest, RenderContextData } from '../rendering.types';

const contextData: RenderContextData = {
  userId: 'u1',
  tenantId: 't1',
  permissions: new Set(),
  locale: 'en-US',
  adapter: 'material',
  mode: 'display',
  model: {},
};

describe('RenderingEngineService', () => {
  let engine: RenderingEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RenderingEngineService,
        RendererRegistryService,
        RenderPipelineService,
        RenderDiagnosticsService,
        RenderMetricsService,
        RenderCacheService,
        RenderEventsService,
        AdapterManagerService,
        RendererResolverService,
        RendererFactoryService,
        MaterialAdapter,
      ],
    });
    engine = TestBed.inject(RenderingEngineService);
  });

  afterEach(() => {
    engine.reset();
  });

  it('should create', () => {
    expect(engine).toBeTruthy();
  });

  it('should start in uninitialized state', () => {
    expect(engine.state()).toBe('uninitialized');
    expect(engine.isReady()).toBeFalse();
  });

  it('should transition to ready after initialize()', () => {
    engine.initialize();
    expect(engine.state()).toBe('ready');
    expect(engine.isReady()).toBeTrue();
  });

  it('should register all 21 built-in field renderers', () => {
    engine.initialize();
    const registry = TestBed.inject(RendererRegistryService);
    expect(registry.getCounts().field).toBe(21);
  });

  it('should be idempotent — double initialize() is a no-op', () => {
    engine.initialize();
    engine.initialize();
    expect(engine.state()).toBe('ready');
  });

  it('should throw when rendering before initialize()', async () => {
    const req: FieldRenderRequest = {
      fieldType: 'text', fieldKey: 'f', label: 'L', value: 'v', model: {}, mode: 'display',
    };
    await expectAsync(engine.renderField(req)).toBeRejectedWithError(/not ready/);
  });

  it('should render a text field successfully', async () => {
    engine.initialize();
    const req: FieldRenderRequest = {
      fieldType: 'text', fieldKey: 'name', label: 'Name', value: 'Alice', model: {}, mode: 'display',
    };
    const result = await engine.renderField(req, contextData);
    expect(result.success).toBeTrue();
  });

  it('should render all 21 built-in field types', async () => {
    engine.initialize();
    const types = [
      'text', 'number', 'currency', 'date', 'time', 'datetime', 'boolean', 'email', 'phone',
      'textarea', 'select', 'lookup', 'autocomplete', 'file', 'image', 'avatar', 'chip', 'badge',
      'color', 'json', 'markdown',
    ];
    for (const fieldType of types) {
      const req: FieldRenderRequest = {
        fieldType, fieldKey: 'f', label: 'L', value: null, model: {}, mode: 'display',
      };
      const result = await engine.renderField(req, contextData);
      expect(result.success).withContext(fieldType).toBeTrue();
    }
  });

  it('should return metrics snapshot', () => {
    engine.initialize();
    const snap = engine.getMetrics();
    expect(snap).toBeTruthy();
    expect(snap.totalRenders).toBe(0);
  });

  it('should return diagnostics report', () => {
    engine.initialize();
    const diag = engine.getDiagnostics();
    expect(diag.engineState).toBe('ready');
    expect(diag.registeredFieldRenderers).toBe(21);
  });

  it('should reset to uninitialized', () => {
    engine.initialize();
    engine.reset();
    expect(engine.state()).toBe('uninitialized');
  });

  it('should emit engine:initialized event', () => {
    const events = TestBed.inject(RenderEventsService);
    const log: unknown[] = [];
    events.on('engine:initialized').subscribe(e => log.push(e));
    engine.initialize();
    expect(log.length).toBe(1);
  });

  it('should invalidate cache by field type', async () => {
    engine.initialize();
    const req: FieldRenderRequest = {
      fieldType: 'text', fieldKey: 'n', label: 'N', value: 'v', model: {}, mode: 'display',
    };
    await engine.renderField(req, contextData);
    engine.invalidateCache('text');
    const cache = TestBed.inject(RenderCacheService);
    expect(cache.getStats().size).toBe(0);
  });

  it('should invalidate entire cache when no fieldType given', async () => {
    engine.initialize();
    const req: FieldRenderRequest = {
      fieldType: 'text', fieldKey: 'n', label: 'N', value: 'v', model: {}, mode: 'display',
    };
    await engine.renderField(req, contextData);
    engine.invalidateCache();
    const cache = TestBed.inject(RenderCacheService);
    expect(cache.getStats().size).toBe(0);
  });
});
