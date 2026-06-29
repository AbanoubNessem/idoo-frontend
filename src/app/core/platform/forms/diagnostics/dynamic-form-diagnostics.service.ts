import { computed, Injectable, signal } from '@angular/core';
import { FormDiagEvent, FormDiagEventType, FormDiagnosticsReport } from '../form.types';

const MAX_EVENTS = 500;
let _counter = 0;

@Injectable({ providedIn: 'root' })
export class DynamicFormDiagnosticsService {
  private readonly _events  = signal<FormDiagEvent[]>([]);
  private readonly _enabled = signal(false);

  readonly enabled      = this._enabled.asReadonly();
  readonly eventCount   = computed(() => this._events().length);
  readonly latestErrors = computed(() =>
    this._events().filter(e => e.type === 'error').slice(-10),
  );

  enable(): void  { this._enabled.set(true); }
  disable(): void { this._enabled.set(false); this._events.set([]); }

  record(event: Omit<FormDiagEvent, 'id' | 'timestamp'>): void {
    if (!this._enabled()) return;
    const full: FormDiagEvent = {
      ...event,
      id:        `fd-${++_counter}`,
      timestamp: new Date().toISOString(),
    };
    this._events.update(events => {
      const next = [...events, full];
      return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
    });
  }

  recordInit(formId: string, durationMs: number): void {
    this.record({ type: 'init', formId, message: `Form ${formId} initialized`, durationMs });
  }

  recordRender(formId: string, fieldKey: string, durationMs: number): void {
    this.record({ type: 'render', formId, fieldKey, message: `Field ${fieldKey} rendered`, durationMs });
  }

  recordValidation(formId: string, message: string, durationMs?: number): void {
    this.record({ type: 'validate', formId, message, durationMs });
  }

  recordSubmit(formId: string, durationMs: number): void {
    this.record({ type: 'submit', formId, message: `Form ${formId} submitted`, durationMs });
  }

  recordError(formId: string, message: string, metadata?: Record<string, unknown>): void {
    this.record({ type: 'error', formId, message, metadata });
  }

  recordLifecycle(formId: string, phase: string): void {
    this.record({ type: 'lifecycle', formId, message: `Form ${formId} → ${phase}` });
  }

  recordExpression(formId: string, fieldKey: string, expression: string): void {
    this.record({
      type: 'expression', formId, fieldKey,
      message: `Expression evaluated for ${fieldKey}: ${expression}`,
    });
  }

  recordAutosave(formId: string, status: 'start' | 'complete' | 'error'): void {
    this.record({ type: 'autosave', formId, message: `Autosave ${status} for ${formId}` });
  }

  generateReport(formId: string): FormDiagnosticsReport {
    const events = this._events().filter(e => e.formId === formId);
    const renderEvents = events.filter(e => e.type === 'render' && e.durationMs != null);
    const avgRenderMs = renderEvents.length
      ? renderEvents.reduce((s, e) => s + (e.durationMs ?? 0), 0) / renderEvents.length
      : 0;

    return {
      formId,
      generatedAt: new Date().toISOString(),
      totalEvents: events.length,
      errorCount:  events.filter(e => e.type === 'error').length,
      avgRenderMs: Math.round(avgRenderMs * 100) / 100,
      events,
    };
  }

  forForm(formId: string): FormDiagEvent[] {
    return this._events().filter(e => e.formId === formId);
  }

  clearForm(formId: string): void {
    this._events.update(events => events.filter(e => e.formId !== formId));
  }
}
