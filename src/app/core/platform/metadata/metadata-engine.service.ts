import { Injectable, inject, signal, computed } from '@angular/core';
import {
  MetadataDiagnosticsReport,
  MetadataEngineAPI,
  MetadataEngineState,
  MetadataSnapshot,
} from './metadata.types';
import { MetadataLifecycleService } from './metadata-lifecycle.service';
import { MetadataPipelineService } from './metadata-pipeline.service';
import { MetadataCacheService } from './metadata-cache.service';
import { MetadataEventsService } from './metadata-events.service';
import { MetadataDiagnosticsService } from './metadata-diagnostics.service';

@Injectable({ providedIn: 'root' })
export class MetadataEngineService implements MetadataEngineAPI {
  private readonly lifecycle = inject(MetadataLifecycleService);
  private readonly pipeline = inject(MetadataPipelineService);
  private readonly cache = inject(MetadataCacheService);
  private readonly events = inject(MetadataEventsService);
  private readonly diagnostics = inject(MetadataDiagnosticsService);

  private readonly _snapshot = signal<MetadataSnapshot | null>(null);

  readonly state = computed<MetadataEngineState>(() => this.lifecycle.state());
  readonly isReady = computed<boolean>(() => this.lifecycle.isReady());
  readonly snapshot = computed<MetadataSnapshot | null>(() => this._snapshot());

  async initialize(): Promise<void> {
    const current = this.lifecycle.state();
    if (current !== 'uninitialized' && current !== 'error') return;

    try {
      this.lifecycle.transition('loading');
      // pipeline drives: loading → validating → resolving → indexing
      const ctx = await this.pipeline.run();

      if (!ctx.snapshot) throw new Error('Pipeline produced no snapshot');

      this.cache.store(ctx.snapshot);
      this._snapshot.set(ctx.snapshot);
      this.lifecycle.transition('ready');
      this.events.emit('metadata:ready', { snapshotId: ctx.snapshot.id });
    } catch (err) {
      this.handleError(err);
    }
  }

  async refresh(): Promise<void> {
    if (!this.lifecycle.isReady()) return;

    try {
      this.events.emit('metadata:refreshing');
      this.lifecycle.transition('refreshing');
      this.cache.invalidate();
      this.lifecycle.transition('loading');
      // pipeline drives: loading → validating → resolving → indexing
      const ctx = await this.pipeline.run();

      if (!ctx.snapshot) throw new Error('Pipeline produced no snapshot on refresh');

      this.cache.store(ctx.snapshot);
      this._snapshot.set(ctx.snapshot);
      this.lifecycle.transition('ready');
      this.events.emit('metadata:ready', { snapshotId: ctx.snapshot.id, refresh: true });
    } catch (err) {
      this.handleError(err);
    }
  }

  getSnapshot(): MetadataSnapshot | null {
    return this._snapshot();
  }

  getDiagnostics(): MetadataDiagnosticsReport {
    return this.diagnostics.generate();
  }

  private handleError(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    try {
      this.lifecycle.transition('error', message);
    } catch {
      // already in error state
    }
    this.events.emit('metadata:error', { message });
  }
}
