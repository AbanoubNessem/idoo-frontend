import { Injectable, signal, computed, inject } from '@angular/core';
import {
  ComponentDiagnosticEvent, ComponentDiagnosticsReport,
} from '../component.types';
import { ComponentRegistryService } from '../registry/component-registry.service';
import { ComponentMetricsService } from '../metrics/component-metrics.service';

@Injectable({ providedIn: 'root' })
export class ComponentDiagnosticsService {
  private readonly registry = inject(ComponentRegistryService);
  private readonly metrics  = inject(ComponentMetricsService);

  private readonly _events   = signal<ComponentDiagnosticEvent[]>([]);
  private readonly _enabled  = signal(false);
  private readonly _maxLog   = 500;

  readonly enabled    = computed(() => this._enabled());
  readonly eventCount = computed(() => this._events().length);
  readonly events     = computed(() => this._events());

  readonly latestErrors = computed(() =>
    this._events().filter(e => e.type === 'error').slice(-10),
  );

  enable(): void  { this._enabled.set(true); }
  disable(): void { this._enabled.set(false); }

  record(event: Omit<ComponentDiagnosticEvent, 'timestamp'>): void {
    if (!this._enabled()) return;

    const full: ComponentDiagnosticEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this._events.update(prev => {
      const next = [...prev, full];
      return next.length > this._maxLog ? next.slice(-this._maxLog) : next;
    });
  }

  recordRender(componentKey: string, durationMs: number): void {
    this.record({ type: 'render', componentKey, message: 'Component rendered', data: { durationMs }, durationMs });
  }

  recordError(componentKey: string, message: string, data?: Record<string, unknown>): void {
    this.record({ type: 'error', componentKey, message, data });
  }

  recordLifecycle(componentKey: string, phase: string, instanceId: string): void {
    this.record({ type: 'lifecycle', componentKey, message: `Phase: ${phase}`, data: { phase, instanceId } });
  }

  recordValidation(componentKey: string, valid: boolean, errors: string[]): void {
    this.record({
      type: 'validation',
      componentKey,
      message: valid ? 'Validation passed' : 'Validation failed',
      data: { valid, errors },
    });
  }

  recordInteraction(componentKey: string, interaction: string, data?: Record<string, unknown>): void {
    this.record({ type: 'interaction', componentKey, message: interaction, data });
  }

  generateReport(): ComponentDiagnosticsReport {
    return {
      events:           this._events(),
      metricsSnapshot:  this.metrics.snapshot(),
      registeredCount:  this.registry.registeredCount(),
      resolvedCount:    this.registry.all().filter(e => e.resolved).length,
      generatedAt:      new Date().toISOString(),
    };
  }

  clear(): void {
    this._events.set([]);
  }

  getEventsFor(componentKey: string): ComponentDiagnosticEvent[] {
    return this._events().filter(e => e.componentKey === componentKey);
  }
}
