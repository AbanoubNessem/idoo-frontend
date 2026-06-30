// ─── Types ────────────────────────────────────────────────────────────────────
export * from './layout.types';

// ─── Constants ────────────────────────────────────────────────────────────────
export * from './layout.constants';

// ─── Tokens ───────────────────────────────────────────────────────────────────
export * from './layout.tokens';

// ─── Per-instance Primitives ──────────────────────────────────────────────────
export { LayoutContext }  from './layout-context';
export { LayoutState }   from './layout-state';

// ─── Foundation Services ──────────────────────────────────────────────────────
export { LayoutEventsService }     from './layout-events.service';
export { LayoutMetricsService }    from './layout-metrics.service';
export { LayoutDiagnosticsService }from './layout-diagnostics.service';
export { LayoutLifecycleService }  from './layout-lifecycle.service';

// ─── Core Services ────────────────────────────────────────────────────────────
export { LayoutRegistryService }   from './layout-registry.service';
export { LayoutSerializerService } from './layout-serializer.service';
export { LayoutBuilderService }    from './layout-builder.service';
export { LayoutRendererService }   from './layout-renderer.service';
export { LayoutResolverService }   from './layout-resolver.service';
export { LayoutFactoryService }    from './layout-factory.service';

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export { LayoutEngineService }     from './layout-engine.service';

// ─── Angular Components ───────────────────────────────────────────────────────
export { LayoutHostComponent }     from './layout-host.component';
export { LayoutSlotDirective }     from './layout-slot.directive';
export { ContainerQueryDirective } from './container-query.directive';

// ─── Integration Adapters ─────────────────────────────────────────────────────
export { FormLayoutAdapter }       from './form-layout.adapter';
