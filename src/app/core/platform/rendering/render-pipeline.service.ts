import { Injectable, inject } from '@angular/core';
import {
  FieldRenderRequest,
  RenderResult,
  RenderError,
  RenderPipelineStage,
  RenderContextData,
  AdapterType,
} from './rendering.types';
import { RenderContext } from './renderer-context';
import { RendererResolverService } from './renderer-resolver.service';
import { AdapterManagerService } from './adapter-manager.service';
import { RenderCacheService } from './render-cache.service';
import { RenderMetricsService } from './render-metrics.service';
import { RenderEventsService } from './render-events.service';

export interface PipelineRunOptions {
  readonly contextData: RenderContextData;
  readonly useCache?: boolean;
  readonly correlationId?: string;
}

interface StageResult {
  error: RenderError | null;
}

@Injectable({ providedIn: 'root' })
export class RenderPipelineService {
  private readonly resolver = inject(RendererResolverService);
  private readonly adapterManager = inject(AdapterManagerService);
  private readonly cache = inject(RenderCacheService);
  private readonly metrics = inject(RenderMetricsService);
  private readonly events = inject(RenderEventsService);

  async runField(
    request: FieldRenderRequest,
    options: PipelineRunOptions,
  ): Promise<RenderResult> {
    const requestId = options.correlationId ?? this.genId();
    const start = performance.now();

    this.events.emit('render:started', { requestId, fieldType: request.fieldType }, requestId);

    const adapter = options.contextData.adapter as AdapterType;
    const cacheKey = this.cache.buildKey(
      request.fieldType,
      adapter,
      request.mode,
    );

    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.events.emit('render:cache:hit', { requestId, cacheKey }, requestId);
        this.metrics.record(request.fieldType, performance.now() - start, true, true);
        return { ...cached, requestId, fromCache: true };
      }
      this.events.emit('render:cache:miss', { requestId, cacheKey }, requestId);
    }

    // Stage: normalize
    const normalized = this.stageNormalize(request);
    if (normalized.error) {
      return this.failResult(requestId, [normalized.error], adapter, start, request.fieldType);
    }

    // Stage: resolve
    const { renderer, resolveError } = this.stageResolve(request.fieldType);
    if (resolveError) {
      return this.failResult(requestId, [resolveError], adapter, start, request.fieldType);
    }

    // Stage: permissions
    const permError = this.stagePermissions(request, options.contextData);
    if (permError) {
      return this.failResult(requestId, [permError], adapter, start, request.fieldType);
    }

    // Stage: context
    const ctx = this.stageContext(options.contextData);

    // Stage: render
    const adapterInstance = this.adapterManager.getAdapter(adapter);
    const component = adapterInstance.getFieldComponent(request.fieldType);
    const output = renderer!.render(request, ctx);

    const result: RenderResult = {
      requestId,
      success: true,
      component: component ?? output.component,
      inputs: output.inputs,
      errors: [],
      durationMs: performance.now() - start,
      fromCache: false,
      adapter,
    };

    if (options.useCache !== false) {
      this.cache.set(cacheKey, result);
    }

    this.metrics.record(request.fieldType, result.durationMs, true, false);
    this.events.emit('render:completed', { requestId, durationMs: result.durationMs }, requestId);

    return result;
  }

  private stageNormalize(_request: FieldRenderRequest): StageResult {
    return { error: null };
  }

  private stageResolve(fieldType: string): {
    renderer: ReturnType<RendererResolverService['resolveField']>['renderer'];
    resolveError: RenderError | null;
  } {
    const resolution = this.resolver.resolveField(fieldType);
    if (!resolution.resolved || !resolution.renderer) {
      return {
        renderer: null,
        resolveError: {
          code: 'RENDERER_NOT_FOUND',
          message: `No renderer found for field type: "${fieldType}"`,
          stage: 'resolve' as RenderPipelineStage,
          field: fieldType,
        },
      };
    }
    return { renderer: resolution.renderer, resolveError: null };
  }

  private stagePermissions(
    request: FieldRenderRequest,
    ctx: RenderContextData,
  ): RenderError | null {
    if (!request.permissions?.length) return null;
    const hasAll = request.permissions.every(p => ctx.permissions.has(p));
    if (!hasAll) {
      return {
        code: 'PERMISSION_DENIED',
        message: `Missing required permissions for field "${request.fieldKey}"`,
        stage: 'permissions' as RenderPipelineStage,
        field: request.fieldKey,
      };
    }
    return null;
  }

  private stageContext(data: RenderContextData): RenderContext {
    const adapter = this.adapterManager.getAdapter(data.adapter as AdapterType);
    return RenderContext.create(
      data,
      (fieldType) => adapter.getFieldComponent(fieldType),
      (expression) => {
        try {
          const fn = new Function('model', `return (${expression})`);
          return fn(data.model);
        } catch {
          return undefined;
        }
      },
      (_key) => null,
    );
  }

  private failResult(
    requestId: string,
    errors: RenderError[],
    adapter: AdapterType,
    start: number,
    fieldType: string,
  ): RenderResult {
    const durationMs = performance.now() - start;
    this.metrics.record(fieldType, durationMs, false, false);
    this.events.emit('render:error', { requestId, errors });
    return {
      requestId,
      success: false,
      component: null,
      inputs: {},
      errors,
      durationMs,
      fromCache: false,
      adapter,
    };
  }

  private genId(): string {
    return 'rpl-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
}
