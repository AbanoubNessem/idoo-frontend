import { Injectable, inject, signal, computed } from '@angular/core';
import {
  FieldRenderRequest,
  RenderResult,
  RenderEngineState,
  RenderContextData,
  AdapterType,
  RenderDiagnosticsReport,
  RenderMetricsSnapshot,
} from './rendering.types';
import { RendererRegistryService } from './renderer-registry.service';
import { RenderPipelineService, PipelineRunOptions } from './render-pipeline.service';
import { RenderDiagnosticsService } from './render-diagnostics.service';
import { RenderMetricsService } from './render-metrics.service';
import { RenderCacheService } from './render-cache.service';
import { RenderEventsService } from './render-events.service';
import { AdapterManagerService } from './adapter-manager.service';

// Built-in renderers
import { TextRenderer } from './renderers/text.renderer';
import { NumberRenderer } from './renderers/number.renderer';
import { CurrencyRenderer } from './renderers/currency.renderer';
import { DateRenderer } from './renderers/date.renderer';
import { TimeRenderer } from './renderers/time.renderer';
import { DateTimeRenderer } from './renderers/datetime.renderer';
import { BooleanRenderer } from './renderers/boolean.renderer';
import { EmailRenderer } from './renderers/email.renderer';
import { PhoneRenderer } from './renderers/phone.renderer';
import { TextareaRenderer } from './renderers/textarea.renderer';
import { SelectRenderer } from './renderers/select.renderer';
import { LookupRenderer } from './renderers/lookup.renderer';
import { AutocompleteRenderer } from './renderers/autocomplete.renderer';
import { FileRenderer } from './renderers/file.renderer';
import { ImageRenderer } from './renderers/image.renderer';
import { AvatarRenderer } from './renderers/avatar.renderer';
import { ChipRenderer } from './renderers/chip.renderer';
import { BadgeRenderer } from './renderers/badge.renderer';
import { ColorRenderer } from './renderers/color.renderer';
import { JsonRenderer } from './renderers/json.renderer';
import { MarkdownRenderer } from './renderers/markdown.renderer';

export interface RenderEngineOptions {
  readonly defaultAdapter?: AdapterType;
  readonly useCache?: boolean;
  readonly defaultContextData?: Partial<RenderContextData>;
}

const DEFAULT_CONTEXT: RenderContextData = {
  userId: 'anonymous',
  tenantId: 'default',
  permissions: new Set<string>(),
  locale: 'en-US',
  adapter: 'material',
  mode: 'display',
  model: {},
};

@Injectable({ providedIn: 'root' })
export class RenderingEngineService {
  private readonly registry = inject(RendererRegistryService);
  private readonly pipeline = inject(RenderPipelineService);
  private readonly diagnostics = inject(RenderDiagnosticsService);
  private readonly metrics = inject(RenderMetricsService);
  private readonly cache = inject(RenderCacheService);
  private readonly events = inject(RenderEventsService);
  private readonly adapterManager = inject(AdapterManagerService);

  private readonly _state = signal<RenderEngineState>('uninitialized');
  private readonly _options = signal<RenderEngineOptions>({});

  readonly state = computed(() => this._state());
  readonly isReady = computed(() => this._state() === 'ready');

  initialize(options: RenderEngineOptions = {}): void {
    if (this._state() === 'ready') return;

    this._state.set('initializing');
    this.diagnostics.setEngineState('initializing');
    this._options.set(options);

    try {
      this.registerBuiltInRenderers();
      this.registry.initializeFromInjected();

      if (options.defaultAdapter && options.defaultAdapter !== 'material') {
        this.adapterManager.setActiveAdapter(options.defaultAdapter);
      }

      this._state.set('ready');
      this.diagnostics.setEngineState('ready');
      this.events.emit('engine:initialized', { registeredRenderers: this.registry.getCounts() });
    } catch (err) {
      const error = {
        code: 'ENGINE_INIT_FAILED',
        message: err instanceof Error ? err.message : String(err),
      };
      this.diagnostics.recordError(error);
      this._state.set('error');
      this.diagnostics.setEngineState('error');
      this.events.emit('engine:error', { error });
      throw err;
    }
  }

  async renderField(
    request: FieldRenderRequest,
    contextOverrides?: Partial<RenderContextData>,
  ): Promise<RenderResult> {
    this.assertReady();

    const opts = this._options();
    const contextData: RenderContextData = {
      ...DEFAULT_CONTEXT,
      ...opts.defaultContextData,
      ...contextOverrides,
    };

    const pipelineOptions: PipelineRunOptions = {
      contextData,
      useCache: opts.useCache,
    };

    return this.pipeline.runField(request, pipelineOptions);
  }

  setAdapter(type: AdapterType): void {
    this.adapterManager.setActiveAdapter(type);
  }

  invalidateCache(fieldType?: string): void {
    if (fieldType) {
      this.cache.invalidateByFieldType(fieldType);
    } else {
      this.cache.clear();
    }
  }

  getMetrics(): RenderMetricsSnapshot {
    return this.metrics.getSnapshot();
  }

  getDiagnostics(): RenderDiagnosticsReport {
    return this.diagnostics.generateReport();
  }

  reset(): void {
    this.cache.clear();
    this.metrics.reset();
    this.diagnostics.clearErrors();
    this.registry.clear();
    this._state.set('uninitialized');
    this.diagnostics.setEngineState('uninitialized');
  }

  private assertReady(): void {
    if (this._state() !== 'ready') {
      throw new Error(
        `RenderingEngine is not ready (current state: "${this._state()}"). Call initialize() first.`,
      );
    }
  }

  private registerBuiltInRenderers(): void {
    const renderers = [
      new TextRenderer(),
      new NumberRenderer(),
      new CurrencyRenderer(),
      new DateRenderer(),
      new TimeRenderer(),
      new DateTimeRenderer(),
      new BooleanRenderer(),
      new EmailRenderer(),
      new PhoneRenderer(),
      new TextareaRenderer(),
      new SelectRenderer(),
      new LookupRenderer(),
      new AutocompleteRenderer(),
      new FileRenderer(),
      new ImageRenderer(),
      new AvatarRenderer(),
      new ChipRenderer(),
      new BadgeRenderer(),
      new ColorRenderer(),
      new JsonRenderer(),
      new MarkdownRenderer(),
    ];

    for (const r of renderers) {
      this.registry.registerField(r);
    }
  }
}
