// ─── Types ────────────────────────────────────────────────────────────────────
export * from './metadata.types';

// ─── Core Utilities ───────────────────────────────────────────────────────────
export { buildMetadataIndex, buildMetadataStats, createMetadataSnapshot } from './metadata-snapshot';

// ─── Services ─────────────────────────────────────────────────────────────────
export { MetadataEngineService } from './metadata-engine.service';
export { MetadataManagerService } from './metadata-manager.service';
export { MetadataLoaderService } from './metadata-loader.service';
export { MetadataValidatorService } from './metadata-validator.service';
export { MetadataResolverService } from './metadata-resolver.service';
export { MetadataIndexerService } from './metadata-indexer.service';
export { MetadataCacheService } from './metadata-cache.service';
export { MetadataEventsService } from './metadata-events.service';
export { MetadataStatisticsService } from './metadata-statistics.service';
export { MetadataLifecycleService } from './metadata-lifecycle.service';
export { MetadataPipelineService } from './metadata-pipeline.service';
export { MetadataDiagnosticsService } from './metadata-diagnostics.service';
