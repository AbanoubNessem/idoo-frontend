import { Injectable } from '@angular/core';
import { VisualDimension, VisualMetricsSnapshot } from './visual.types';

@Injectable({ providedIn: 'root' })
export class VisualExperienceMetricsService {
  private _applyCount  = 0;
  private _errorCount  = 0;
  private _lastApplyMs = 0;
  private readonly _initializedAt = new Date().toISOString();

  private readonly _changes: Record<VisualDimension, number> = {
    typography:    0,
    density:       0,
    'icon-pack':   0,
    motion:        0,
    accessibility: 0,
  };

  recordApply(durationMs: number): void {
    this._applyCount++;
    this._lastApplyMs = durationMs;
  }

  recordChange(dimension: VisualDimension): void {
    this._changes[dimension]++;
  }

  recordError(): void {
    this._errorCount++;
  }

  snapshot(): VisualMetricsSnapshot {
    return {
      applyCount:        this._applyCount,
      changeByDimension: { ...this._changes },
      lastApplyMs:       this._lastApplyMs,
      errorCount:        this._errorCount,
      initializedAt:     this._initializedAt,
    };
  }

  reset(): void {
    this._applyCount  = 0;
    this._errorCount  = 0;
    this._lastApplyMs = 0;
    for (const k of Object.keys(this._changes) as VisualDimension[]) {
      this._changes[k] = 0;
    }
  }
}
