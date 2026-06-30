// ─── Types ────────────────────────────────────────────────────────────────────
export * from './experience.types';

// ─── Constants ────────────────────────────────────────────────────────────────
export * from './experience.constants';

// ─── Tokens ───────────────────────────────────────────────────────────────────
export * from './experience.tokens';

// ─── State & Context (injectable singletons) ──────────────────────────────────
export { ExperienceState }   from './experience-state';
export { ExperienceContext }  from './experience-context';

// ─── Foundation Services ──────────────────────────────────────────────────────
export { ExperienceEventsService }     from './experience-events.service';
export { ExperienceMetricsService }    from './experience-metrics.service';
export { ExperienceLifecycleService }  from './experience-lifecycle.service';

// ─── Core Services ────────────────────────────────────────────────────────────
export { ExperienceRegistryService }   from './experience-registry.service';
export { ExperienceSerializerService } from './experience-serializer.service';
export { ExperienceBuilderService }    from './experience-builder.service';
export { ExperienceDiagnosticsService }from './experience-diagnostics.service';

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export { ExperienceEngineService }     from './experience-engine.service';
