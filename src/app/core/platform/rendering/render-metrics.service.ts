import { Injectable } from '@angular/core';
import { RenderMetricsSnapshot } from './rendering.types';

interface RenderRecord {
  readonly fieldType: string;
  readonly durationMs: number;
  readonly success: boolean;
  readonly fromCache: boolean;
  readonly timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class RenderMetricsService {
  private readonly _records: RenderRecord[] = [];
  private readonly MAX_RECORDS = 1000;

  record(
    fieldType: string,
    durationMs: number,
    success: boolean,
    fromCache = false,
  ): void {
    if (this._records.length >= this.MAX_RECORDS) this._records.shift();
    this._records.push({ fieldType, durationMs, success, fromCache, timestamp: Date.now() });
  }

  getSnapshot(): RenderMetricsSnapshot {
    const total = this._records.length;
    const successful = this._records.filter(r => r.success).length;
    const failed = total - successful;
    const cacheHits = this._records.filter(r => r.fromCache).length;

    const durations = this._records.filter(r => r.success).map(r => r.durationMs).sort((a, b) => a - b);
    const avg = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95 = durations.length > 0 ? (durations[p95Index] ?? durations[durations.length - 1]) : 0;

    const rendererUsage: Record<string, number> = {};
    for (const r of this._records) {
      rendererUsage[r.fieldType] = (rendererUsage[r.fieldType] ?? 0) + 1;
    }

    return {
      totalRenders: total,
      successfulRenders: successful,
      failedRenders: failed,
      averageDurationMs: Math.round(avg * 100) / 100,
      p95DurationMs: p95,
      cacheHitRate: total > 0 ? cacheHits / total : 0,
      rendererUsage,
      generatedAt: new Date().toISOString(),
    };
  }

  reset(): void {
    this._records.length = 0;
  }

  getRecordCount(): number {
    return this._records.length;
  }
}
