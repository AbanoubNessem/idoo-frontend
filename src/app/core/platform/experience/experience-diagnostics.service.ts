import { Injectable, inject } from '@angular/core';
import { ExperienceDiagnosticsReport, ExperiencePhase } from './experience.types';
import { EXPERIENCE_DIAGNOSTICS_ENABLED } from './experience.tokens';
import { ExperienceMetricsService } from './experience-metrics.service';
import { ExperienceRegistryService } from './experience-registry.service';
import { ExperienceState } from './experience-state';

@Injectable({ providedIn: 'root' })
export class ExperienceDiagnosticsService {
  private readonly _enabled  = inject(EXPERIENCE_DIAGNOSTICS_ENABLED);
  private readonly _metrics  = inject(ExperienceMetricsService);
  private readonly _registry = inject(ExperienceRegistryService);
  private readonly _state    = inject(ExperienceState);

  private _currentPhase: ExperiencePhase = 'created';

  setPhase(phase: ExperiencePhase): void {
    this._currentPhase = phase;
  }

  report(): ExperienceDiagnosticsReport {
    return {
      phase:               this._currentPhase,
      currentState:        this._state.snapshot(),
      registeredProfiles:  this._registry.countByDimension(),
      totalProfiles:       this._registry.totalCount(),
      metrics:             this._metrics.snapshot(),
      diagnosticsEnabled:  this._enabled,
      generatedAt:         new Date().toISOString(),
    };
  }

  logReport(): void {
    if (!this._enabled) return;
    console.group('[ExperienceDiagnostics]');
    console.log(this.report());
    console.groupEnd();
  }
}
