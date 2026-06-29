import { Injectable, signal, computed } from '@angular/core';
import { ComponentRenderMetrics } from '../component.types';

interface MutableMetrics {
  componentKey: string;
  renderCount: number;
  totalRenderMs: number;
  lastRenderMs: number;
  errorCount: number;
  firstRenderAt: string;
  lastRenderAt: string;
}

@Injectable({ providedIn: 'root' })
export class ComponentMetricsService {
  private readonly _metrics = new Map<string, MutableMetrics>();
  private readonly _version = signal(0);

  readonly snapshot = computed<Record<string, ComponentRenderMetrics>>(() => {
    this._version();
    return this._buildSnapshot();
  });

  readonly totalRenders = computed(() => {
    this._version();
    let total = 0;
    for (const m of this._metrics.values()) total += m.renderCount;
    return total;
  });

  readonly totalErrors = computed(() => {
    this._version();
    let total = 0;
    for (const m of this._metrics.values()) total += m.errorCount;
    return total;
  });

  recordRender(componentKey: string, durationMs: number): void {
    const existing = this._metrics.get(componentKey);
    const now      = new Date().toISOString();

    if (existing) {
      existing.renderCount++;
      existing.totalRenderMs += durationMs;
      existing.lastRenderMs   = durationMs;
      existing.lastRenderAt   = now;
    } else {
      this._metrics.set(componentKey, {
        componentKey,
        renderCount:   1,
        totalRenderMs: durationMs,
        lastRenderMs:  durationMs,
        errorCount:    0,
        firstRenderAt: now,
        lastRenderAt:  now,
      });
    }

    this._version.update(v => v + 1);
  }

  recordError(componentKey: string): void {
    const existing = this._metrics.get(componentKey);
    if (existing) {
      existing.errorCount++;
    } else {
      const now = new Date().toISOString();
      this._metrics.set(componentKey, {
        componentKey,
        renderCount:   0,
        totalRenderMs: 0,
        lastRenderMs:  0,
        errorCount:    1,
        firstRenderAt: now,
        lastRenderAt:  now,
      });
    }
    this._version.update(v => v + 1);
  }

  getMetrics(componentKey: string): ComponentRenderMetrics | null {
    const m = this._metrics.get(componentKey);
    return m ? this._toPublic(m) : null;
  }

  reset(componentKey?: string): void {
    if (componentKey) {
      this._metrics.delete(componentKey);
    } else {
      this._metrics.clear();
    }
    this._version.update(v => v + 1);
  }

  private _buildSnapshot(): Record<string, ComponentRenderMetrics> {
    const snap: Record<string, ComponentRenderMetrics> = {};
    for (const [key, m] of this._metrics.entries()) {
      snap[key] = this._toPublic(m);
    }
    return snap;
  }

  private _toPublic(m: MutableMetrics): ComponentRenderMetrics {
    return {
      componentKey:   m.componentKey,
      renderCount:    m.renderCount,
      lastRenderMs:   m.lastRenderMs,
      avgRenderMs:    m.renderCount > 0 ? m.totalRenderMs / m.renderCount : 0,
      errorCount:     m.errorCount,
      firstRenderAt:  m.firstRenderAt,
      lastRenderAt:   m.lastRenderAt,
    };
  }
}
