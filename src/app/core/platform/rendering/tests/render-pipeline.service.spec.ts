import { TestBed } from '@angular/core/testing';
import { RenderPipelineService } from '../render-pipeline.service';
import { RendererResolverService } from '../renderer-resolver.service';
import { RendererRegistryService } from '../renderer-registry.service';
import { AdapterManagerService } from '../adapter-manager.service';
import { RenderCacheService } from '../render-cache.service';
import { RenderMetricsService } from '../render-metrics.service';
import { RenderEventsService } from '../render-events.service';
import { MaterialAdapter } from '../adapters/material.adapter';
import { FieldRenderRequest, RenderContextData } from '../rendering.types';
import { TextRenderer } from '../renderers/text.renderer';

const defaultContext: RenderContextData = {
  userId: 'u1',
  tenantId: 't1',
  permissions: new Set(['read']),
  locale: 'en-US',
  adapter: 'material',
  mode: 'display',
  model: { name: 'Alice' },
};

function makeRequest(overrides: Partial<FieldRenderRequest> = {}): FieldRenderRequest {
  return {
    fieldType: 'text',
    fieldKey: 'name',
    label: 'Name',
    value: 'Alice',
    model: { name: 'Alice' },
    mode: 'display',
    ...overrides,
  };
}

describe('RenderPipelineService', () => {
  let pipeline: RenderPipelineService;
  let registry: RendererRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RenderPipelineService,
        RendererResolverService,
        RendererRegistryService,
        AdapterManagerService,
        RenderCacheService,
        RenderMetricsService,
        RenderEventsService,
        MaterialAdapter,
      ],
    });
    pipeline = TestBed.inject(RenderPipelineService);
    registry = TestBed.inject(RendererRegistryService);
    registry.registerField(new TextRenderer());
  });

  it('should create', () => {
    expect(pipeline).toBeTruthy();
  });

  it('should return successful result for known field type', async () => {
    const result = await pipeline.runField(makeRequest(), { contextData: defaultContext });
    expect(result.success).toBeTrue();
    expect(result.errors.length).toBe(0);
  });

  it('should include requestId in result', async () => {
    const result = await pipeline.runField(makeRequest(), { contextData: defaultContext, correlationId: 'test-id' });
    expect(result.requestId).toBe('test-id');
  });

  it('should return error result for unknown field type', async () => {
    const result = await pipeline.runField(
      makeRequest({ fieldType: 'nonexistent' }),
      { contextData: defaultContext },
    );
    expect(result.success).toBeFalse();
    expect(result.errors[0].code).toBe('RENDERER_NOT_FOUND');
  });

  it('should cache successful renders', async () => {
    const result1 = await pipeline.runField(makeRequest(), { contextData: defaultContext, useCache: true });
    const result2 = await pipeline.runField(makeRequest(), { contextData: defaultContext, useCache: true });
    expect(result1.fromCache).toBeFalse();
    expect(result2.fromCache).toBeTrue();
  });

  it('should skip cache when useCache is false', async () => {
    await pipeline.runField(makeRequest(), { contextData: defaultContext, useCache: false });
    const result = await pipeline.runField(makeRequest(), { contextData: defaultContext, useCache: false });
    expect(result.fromCache).toBeFalse();
  });

  it('should deny render when permission missing', async () => {
    const result = await pipeline.runField(
      makeRequest({ permissions: ['admin'] }),
      { contextData: { ...defaultContext, permissions: new Set(['read']) } },
    );
    expect(result.success).toBeFalse();
    expect(result.errors[0].code).toBe('PERMISSION_DENIED');
  });

  it('should allow render when all permissions present', async () => {
    const result = await pipeline.runField(
      makeRequest({ permissions: ['read'] }),
      { contextData: defaultContext },
    );
    expect(result.success).toBeTrue();
  });

  it('should emit render:started event', async () => {
    const events = TestBed.inject(RenderEventsService);
    const log: unknown[] = [];
    events.on('render:started').subscribe(e => log.push(e));
    await pipeline.runField(makeRequest(), { contextData: defaultContext });
    expect(log.length).toBe(1);
  });

  it('should emit render:completed event on success', async () => {
    const events = TestBed.inject(RenderEventsService);
    const log: unknown[] = [];
    events.on('render:completed').subscribe(e => log.push(e));
    await pipeline.runField(makeRequest(), { contextData: defaultContext });
    expect(log.length).toBe(1);
  });

  it('should record metrics after render', async () => {
    const metrics = TestBed.inject(RenderMetricsService);
    await pipeline.runField(makeRequest(), { contextData: defaultContext });
    expect(metrics.getSnapshot().totalRenders).toBe(1);
  });

  it('should include adapter in result', async () => {
    const result = await pipeline.runField(makeRequest(), { contextData: defaultContext });
    expect(result.adapter).toBe('material');
  });
});
