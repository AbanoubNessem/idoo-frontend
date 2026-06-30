import { Injectable, inject } from '@angular/core';
import { ExperienceDimension, ExperienceMetricsSnapshot } from './experience.types';
import { EXPERIENCE_DIMENSIONS } from './experience.constants';
import { EXPERIENCE_DIAGNOSTICS_ENABLED } from './experience.tokens';

@Injectable({ providedIn: 'root' })
export class ExperienceMetricsService {
  private readonly _enabled = inject(EXPERIENCE_DIAGNOSTICS_ENABLED);

  private _applyCount    = 0;
  private _totalApplyMs  = 0;
  private _lastApplyMs   = 0;
  private _errorCount    = 0;
  private _initializedAt = new Date().toISOString();
  private _lastActivityAt = this._initializedAt;

  private readonly _changeCount: Record<ExperienceDimension, number> =
    Object.fromEntries(EXPERIENCE_DIMENSIONS.map(d => [d, 0])) as Record<ExperienceDimension, number>;

  recordApply(durationMs: number): void {
    if (!this._enabled) return;
    this._applyCount++;
    this._lastApplyMs   = durationMs;
    this._totalApplyMs += durationMs;
    this._touch();
  }

  recordChange(dimension: ExperienceDimension): void {
    if (!this._enabled) return;
    this._changeCount[dimension]++;
    this._touch();
  }

  recordError(): void {
    if (!this._enabled) return;
    this._errorCount++;
    this._touch();
  }

  snapshot(): ExperienceMetricsSnapshot {
    return {
      applyCount:      this._applyCount,
      changeCount:     { ...this._changeCount },
      lastApplyMs:     this._lastApplyMs,
      avgApplyMs:      this._applyCount ? this._totalApplyMs / this._applyCount : 0,
      errorCount:      this._errorCount,
      initializedAt:   this._initializedAt,
      lastActivityAt:  this._lastActivityAt,
    };
  }

  reset(): void {
    this._applyCount   = 0;
    this._totalApplyMs = 0;
    this._lastApplyMs  = 0;
    this._errorCount   = 0;
    for (const d of EXPERIENCE_DIMENSIONS) this._changeCount[d] = 0;
    this._touch();
  }

  private _touch(): void {
    this._lastActivityAt = new Date().toISOString();
  }
}
