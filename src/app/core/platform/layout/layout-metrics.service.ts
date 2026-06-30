import { Injectable, inject } from '@angular/core';
import { LayoutMetricsSnapshot } from './layout.types';
import { LAYOUT_DIAGNOSTICS_ENABLED } from './layout.tokens';

interface MutableMetrics {
  renderCount: number;
  lastRenderMs: number;
  totalRenderMs: number;
  resolveCount: number;
  breakpointChanges: number;
  createdAt: string;
  lastActivityAt: string;
}

@Injectable({ providedIn: 'root' })
export class LayoutMetricsService {
  private readonly _enabled = inject(LAYOUT_DIAGNOSTICS_ENABLED);
  private readonly _metrics = new Map<string, MutableMetrics>();

  track(instanceId: string): void {
    if (!this._enabled) return;
    this._metrics.set(instanceId, {
      renderCount: 0,
      lastRenderMs: 0,
      totalRenderMs: 0,
      resolveCount: 0,
      breakpointChanges: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });
  }

  recordRender(instanceId: string, durationMs: number): void {
    if (!this._enabled) return;
    const m = this._metrics.get(instanceId);
    if (!m) return;
    m.renderCount++;
    m.lastRenderMs = durationMs;
    m.totalRenderMs += durationMs;
    m.lastActivityAt = new Date().toISOString();
  }

  recordResolve(instanceId: string): void {
    if (!this._enabled) return;
    const m = this._metrics.get(instanceId);
    if (!m) return;
    m.resolveCount++;
    m.lastActivityAt = new Date().toISOString();
  }

  recordBreakpointChange(instanceId: string): void {
    if (!this._enabled) return;
    const m = this._metrics.get(instanceId);
    if (!m) return;
    m.breakpointChanges++;
    m.lastActivityAt = new Date().toISOString();
  }

  untrack(instanceId: string): void {
    this._metrics.delete(instanceId);
  }

  snapshot(instanceId: string): LayoutMetricsSnapshot | null {
    const m = this._metrics.get(instanceId);
    if (!m) return null;
    return {
      instanceId,
      renderCount: m.renderCount,
      lastRenderMs: m.lastRenderMs,
      avgRenderMs: m.renderCount ? m.totalRenderMs / m.renderCount : 0,
      resolveCount: m.resolveCount,
      breakpointChanges: m.breakpointChanges,
      createdAt: m.createdAt,
      lastActivityAt: m.lastActivityAt,
    };
  }

  allSnapshots(): ReadonlyArray<LayoutMetricsSnapshot> {
    return Array.from(this._metrics.keys())
      .map(id => this.snapshot(id))
      .filter((s): s is LayoutMetricsSnapshot => s !== null);
  }
}
