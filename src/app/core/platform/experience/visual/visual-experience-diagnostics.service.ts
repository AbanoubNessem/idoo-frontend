import { Injectable, inject } from '@angular/core';
import { VisualDiagnosticsReport } from './visual.types';
import { VisualExperienceState }   from './visual-experience-state';
import { VisualExperienceRegistryService } from './visual-experience-registry.service';
import { VisualExperienceMetricsService }  from './visual-experience-metrics.service';
import { DEFAULT_TYPOGRAPHY_ID }           from './visual.constants';

@Injectable({ providedIn: 'root' })
export class VisualExperienceDiagnosticsService {
  private readonly _state    = inject(VisualExperienceState);
  private readonly _registry = inject(VisualExperienceRegistryService);
  private readonly _metrics  = inject(VisualExperienceMetricsService);

  report(): VisualDiagnosticsReport {
    const counts = this._registry.counts();

    return {
      registeredProfiles: {
        typography:    counts['typography']    ?? 0,
        density:       counts['density']       ?? 0,
        'icon-pack':   counts['icon-pack']     ?? 0,
        motion:        counts['motion']        ?? 0,
        accessibility: counts['accessibility'] ?? 0,
      },
      activeIds: {
        typographyId:    this._state.typographyId() ?? DEFAULT_TYPOGRAPHY_ID,
        densityId:       this._state.densityId(),
        iconPackId:      this._state.iconPackId(),
        motionId:        this._state.motionId(),
        accessibilityId: this._state.accessibilityId(),
      },
      accessibility: {
        reducedMotion:   this._state.reducedMotion(),
        largeTypography: this._state.largeTypography(),
        focusVisible:    this._state.focusVisible(),
      },
      metrics:     this._metrics.snapshot(),
      generatedAt: new Date().toISOString(),
    };
  }
}
