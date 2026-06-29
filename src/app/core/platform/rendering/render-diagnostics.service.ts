import { Injectable, inject } from '@angular/core';
import { RenderDiagnosticsReport, RenderEngineState, RenderError } from './rendering.types';
import { RendererRegistryService } from './renderer-registry.service';
import { AdapterManagerService } from './adapter-manager.service';
import { RenderCacheService } from './render-cache.service';
import { RenderMetricsService } from './render-metrics.service';
import { RenderEventsService } from './render-events.service';

@Injectable({ providedIn: 'root' })
export class RenderDiagnosticsService {
  private readonly registry = inject(RendererRegistryService);
  private readonly adapterManager = inject(AdapterManagerService);
  private readonly cache = inject(RenderCacheService);
  private readonly metrics = inject(RenderMetricsService);
  private readonly events = inject(RenderEventsService);

  private _engineState: RenderEngineState = 'uninitialized';
  private readonly _errors: RenderError[] = [];

  setEngineState(state: RenderEngineState): void {
    this._engineState = state;
  }

  recordError(error: RenderError): void {
    this._errors.push(error);
  }

  clearErrors(): void {
    this._errors.length = 0;
  }

  generateReport(): RenderDiagnosticsReport {
    const counts = this.registry.getCounts();
    const cacheStats = this.cache.getStats();

    return {
      engineState: this._engineState,
      activeAdapter: this.adapterManager.activeAdapterType(),
      registeredFieldRenderers: counts.field,
      registeredLayoutRenderers: counts.layout,
      registeredActionRenderers: counts.action,
      registeredCellRenderers: counts.cell,
      registeredWidgetRenderers: counts.widget,
      cachedResults: cacheStats.size,
      metrics: this.metrics.getSnapshot(),
      errors: [...this._errors],
      generatedAt: new Date().toISOString(),
    };
  }

  getEventLog() {
    return this.events.getLog();
  }

  summarize(): string {
    const r = this.generateReport();
    return [
      `RenderEngine [${r.engineState}] — adapter: ${r.activeAdapter}`,
      `Renderers: field=${r.registeredFieldRenderers} layout=${r.registeredLayoutRenderers} action=${r.registeredActionRenderers}`,
      `Cache: ${r.cachedResults} entries | hitRate=${(r.metrics?.cacheHitRate ?? 0).toFixed(2)}`,
      `Errors: ${r.errors.length}`,
    ].join('\n');
  }
}
