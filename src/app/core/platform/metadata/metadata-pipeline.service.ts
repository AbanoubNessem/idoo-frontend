import { Injectable, inject } from '@angular/core';
import { PipelineContext, MetadataEntry } from './metadata.types';
import { MetadataLoaderService } from './metadata-loader.service';
import { MetadataValidatorService } from './metadata-validator.service';
import { MetadataResolverService } from './metadata-resolver.service';
import { MetadataIndexerService } from './metadata-indexer.service';
import { MetadataStatisticsService } from './metadata-statistics.service';
import { MetadataEventsService } from './metadata-events.service';
import { MetadataLifecycleService } from './metadata-lifecycle.service';
import { createMetadataSnapshot } from './metadata-snapshot';

@Injectable({ providedIn: 'root' })
export class MetadataPipelineService {
  private readonly loader = inject(MetadataLoaderService);
  private readonly validator = inject(MetadataValidatorService);
  private readonly resolver = inject(MetadataResolverService);
  private readonly indexer = inject(MetadataIndexerService);
  private readonly statistics = inject(MetadataStatisticsService);
  private readonly events = inject(MetadataEventsService);
  private readonly lifecycle = inject(MetadataLifecycleService);

  /**
   * Executes the full metadata pipeline.
   * Engine must transition to 'loading' before calling this.
   * Pipeline transitions: loading → validating → resolving → indexing.
   * Engine is responsible for transitioning to 'ready' or 'error' after.
   */
  async run(): Promise<PipelineContext> {
    const ctx: PipelineContext = {
      entries: new Map<string, MetadataEntry>(),
      errors: [],
      warnings: [],
      timings: {},
      conflicts: [],
      snapshot: null,
    };

    await this.runLoadStage(ctx);

    this.lifecycle.transition('validating');
    await this.runValidateStage(ctx);

    this.lifecycle.transition('resolving');
    await this.runResolveStage(ctx);

    this.lifecycle.transition('indexing');
    await this.runIndexStage(ctx);

    return ctx;
  }

  private async runLoadStage(ctx: PipelineContext): Promise<void> {
    this.events.emit('metadata:loading:started');
    const start = Date.now();

    ctx.entries = this.loader.load();

    ctx.timings['load'] = Date.now() - start;
    this.events.emit('metadata:loading:completed', { count: ctx.entries.size });
  }

  private async runValidateStage(ctx: PipelineContext): Promise<void> {
    this.events.emit('metadata:validation:started');
    const start = Date.now();

    ctx.entries = this.validator.applyValidation(ctx.entries);

    for (const entry of ctx.entries.values()) {
      for (const err of entry.validationErrors) {
        if (err.severity === 'error') ctx.errors.push(err);
      }
    }

    ctx.timings['validate'] = Date.now() - start;
    this.events.emit('metadata:validation:completed', { errorCount: ctx.errors.length });
  }

  private async runResolveStage(ctx: PipelineContext): Promise<void> {
    this.events.emit('metadata:resolution:started');
    const start = Date.now();

    const { entries, result } = this.resolver.resolve(ctx.entries);
    ctx.entries = entries;
    ctx.warnings.push(...result.warnings);

    ctx.timings['resolve'] = Date.now() - start;
    this.events.emit('metadata:resolution:completed', {
      resolved: result.resolved,
      unresolved: result.unresolved.length,
    });
  }

  private async runIndexStage(ctx: PipelineContext): Promise<void> {
    this.events.emit('metadata:indexing:started');
    const start = Date.now();

    const index = this.indexer.build(ctx.entries);
    const stats = this.statistics.compute(ctx.entries, ctx.conflicts, ctx.timings);
    ctx.snapshot = createMetadataSnapshot(ctx.entries, index, stats, ctx.errors, ctx.warnings);

    ctx.timings['index'] = Date.now() - start;
    this.events.emit('metadata:indexing:completed', { snapshotId: ctx.snapshot.id });
    this.events.emit('metadata:snapshot:created', { snapshotId: ctx.snapshot.id, stats });
  }
}
