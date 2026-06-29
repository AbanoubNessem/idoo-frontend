import { computed, Injectable, signal } from '@angular/core';
import { FormRenderMetrics } from '../form.types';

@Injectable({ providedIn: 'root' })
export class DynamicFormMetricsService {
  private readonly _metrics = signal<Record<string, FormRenderMetrics>>({});

  readonly snapshot = computed(() => this._metrics());

  init(formId: string, fieldCount: number, initDurationMs: number, resolveDurationMs: number): void {
    this._metrics.update(m => ({
      ...m,
      [formId]: {
        formId,
        initDurationMs,
        resolveDurationMs,
        fieldCount,
        renderCount:      0,
        validationCount:  0,
        submitCount:      0,
        errorCount:       0,
        firstRenderAt:    new Date().toISOString(),
        lastActivityAt:   new Date().toISOString(),
      },
    }));
  }

  recordRender(formId: string): void {
    this._mutate(formId, m => ({
      ...m,
      renderCount:    m.renderCount + 1,
      lastActivityAt: new Date().toISOString(),
    }));
  }

  recordValidation(formId: string): void {
    this._mutate(formId, m => ({
      ...m,
      validationCount: m.validationCount + 1,
      lastActivityAt:  new Date().toISOString(),
    }));
  }

  recordSubmit(formId: string): void {
    this._mutate(formId, m => ({
      ...m,
      submitCount:    m.submitCount + 1,
      lastActivityAt: new Date().toISOString(),
    }));
  }

  recordError(formId: string): void {
    this._mutate(formId, m => ({
      ...m,
      errorCount:     m.errorCount + 1,
      lastActivityAt: new Date().toISOString(),
    }));
  }

  get(formId: string): FormRenderMetrics | null {
    return this._metrics()[formId] ?? null;
  }

  reset(formId?: string): void {
    if (formId) {
      this._metrics.update(m => {
        const next = { ...m };
        delete next[formId];
        return next;
      });
    } else {
      this._metrics.set({});
    }
  }

  private _mutate(formId: string, updater: (m: FormRenderMetrics) => FormRenderMetrics): void {
    const current = this._metrics()[formId];
    if (!current) return;
    this._metrics.update(m => ({ ...m, [formId]: updater(current) }));
  }
}
