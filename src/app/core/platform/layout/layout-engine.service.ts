import { Injectable, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  LayoutDefinition, LayoutInstance, LayoutContextData, ResolvedLayout,
  LayoutDirection, Breakpoint, LayoutDiagnosticsReport, LayoutMetricsSnapshot,
  SerializedLayout,
} from './layout.types';
import { LayoutRegistryService }    from './layout-registry.service';
import { LayoutFactoryService }     from './layout-factory.service';
import { LayoutResolverService }    from './layout-resolver.service';
import { LayoutRendererService }    from './layout-renderer.service';
import { LayoutBuilderService }     from './layout-builder.service';
import { LayoutSerializerService }  from './layout-serializer.service';
import { LayoutMetricsService }     from './layout-metrics.service';
import { LayoutDiagnosticsService } from './layout-diagnostics.service';
import { LayoutEventsService }      from './layout-events.service';
import { LayoutContext }            from './layout-context';
import { BREAKPOINT_WIDTHS, BREAKPOINT_ORDER } from './layout.constants';

@Injectable({ providedIn: 'root' })
export class LayoutEngineService implements OnDestroy {
  private readonly _doc          = inject(DOCUMENT);
  private readonly _registry     = inject(LayoutRegistryService);
  private readonly _factory      = inject(LayoutFactoryService);
  private readonly _resolver     = inject(LayoutResolverService);
  private readonly _renderer     = inject(LayoutRendererService);
  private readonly _builder      = inject(LayoutBuilderService);
  private readonly _serializer   = inject(LayoutSerializerService);
  private readonly _metrics      = inject(LayoutMetricsService);
  private readonly _diagnostics  = inject(LayoutDiagnosticsService);
  readonly events                = inject(LayoutEventsService);

  // ─── Global Context ─────────────────────────────────────────────────────────

  private readonly _globalContext = new LayoutContext();

  private readonly _direction     = signal<LayoutDirection>('ltr');
  private readonly _viewportWidth = signal(0);

  readonly breakpoint = computed<Breakpoint>(() => {
    const w = this._viewportWidth();
    return this._widthToBreakpoint(w);
  });

  readonly direction = this._direction.asReadonly();

  // ─── Init ────────────────────────────────────────────────────────────────────

  constructor() {
    this._globalContext.bindDocument(this._doc);
    this._syncDocDirection();

    if (typeof window !== 'undefined') {
      this._viewportWidth.set(window.innerWidth);
      window.addEventListener('resize', this._onResize);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
    }
  }

  // ─── Registry API ────────────────────────────────────────────────────────────

  register(definition: LayoutDefinition): void {
    this._registry.register(definition);
  }

  registerAll(definitions: ReadonlyArray<LayoutDefinition>): void {
    this._registry.registerAll(definitions);
  }

  has(id: string): boolean {
    return this._registry.has(id);
  }

  // ─── Instance API ────────────────────────────────────────────────────────────

  create(definitionOrId: LayoutDefinition | string, context?: Partial<LayoutContextData>): LayoutInstance {
    const def = typeof definitionOrId === 'string'
      ? this._registry.get(definitionOrId)
      : definitionOrId;

    if (!def) throw new Error(`[LayoutEngine] Definition not found: ${definitionOrId}`);

    const ctx = this._buildContext(context);
    return this._factory.create(def, ctx);
  }

  update(id: string, context?: Partial<LayoutContextData>): LayoutInstance | null {
    const ctx = this._buildContext(context);
    return this._factory.update(id, ctx);
  }

  destroy(id: string): void {
    this._factory.destroy(id);
  }

  getInstance(id: string): LayoutInstance | null {
    return this._factory.get(id);
  }

  // ─── Resolve API (stateless) ─────────────────────────────────────────────────

  resolve(definitionOrId: LayoutDefinition | string, context?: Partial<LayoutContextData>): ResolvedLayout | null {
    const def = typeof definitionOrId === 'string'
      ? this._registry.get(definitionOrId)
      : definitionOrId;

    if (!def) return null;
    return this._resolver.resolve(def, this._buildContext(context));
  }

  // ─── Direction API ───────────────────────────────────────────────────────────

  setDirection(dir: LayoutDirection): void {
    this._direction.set(dir);
    this._globalContext.setDirection(dir);
    this._syncDocDirection();
    this.events.emitFor('global', 'direction:changed', { dir });
  }

  // ─── Builder Delegation ───────────────────────────────────────────────────────

  get builder(): LayoutBuilderService {
    return this._builder;
  }

  // ─── Serialization ────────────────────────────────────────────────────────────

  serialize(definition: LayoutDefinition): string {
    return this._serializer.serialize(definition);
  }

  deserialize(json: string): LayoutDefinition {
    return this._serializer.deserialize(json);
  }

  // ─── CSS Helpers ─────────────────────────────────────────────────────────────

  toCssString(definition: LayoutDefinition, context?: Partial<LayoutContextData>): string {
    const ctx    = this._buildContext(context);
    const output = this._renderer.render(definition, ctx);
    return this._renderer.toCssString(output.hostCss);
  }

  // ─── Metrics & Diagnostics ───────────────────────────────────────────────────

  metricsSnapshot(id: string): LayoutMetricsSnapshot | null {
    return this._metrics.snapshot(id);
  }

  diagnosticsReport(): LayoutDiagnosticsReport {
    return this._diagnostics.report();
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private _buildContext(partial?: Partial<LayoutContextData>): LayoutContextData {
    const snap = this._globalContext.snapshot();
    return {
      breakpoint:      partial?.breakpoint ?? snap.breakpoint,
      device:          partial?.device      ?? snap.device,
      orientation:     partial?.orientation  ?? snap.orientation,
      direction:       partial?.direction    ?? this._direction(),
      permissions:     partial?.permissions  ?? snap.permissions,
      model:           partial?.model        ?? snap.model,
      containerWidth:  partial?.containerWidth,
      containerHeight: partial?.containerHeight,
    };
  }

  private _syncDocDirection(): void {
    this._doc.documentElement.setAttribute('dir', this._direction());
  }

  private readonly _onResize = (): void => {
    this._viewportWidth.set(window.innerWidth);
    this.events.emitFor('global', 'breakpoint:changed', { breakpoint: this.breakpoint() });
  };

  private _widthToBreakpoint(width: number): Breakpoint {
    let result: Breakpoint = 'xs';
    for (const bp of BREAKPOINT_ORDER) {
      if (width >= BREAKPOINT_WIDTHS[bp]) result = bp;
      else break;
    }
    return result;
  }
}
