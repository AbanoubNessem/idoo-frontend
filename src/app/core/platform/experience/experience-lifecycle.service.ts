import { Injectable, inject } from '@angular/core';
import { ExperiencePhase } from './experience.types';
import { ExperienceEventsService } from './experience-events.service';

const VALID_TRANSITIONS: Partial<Record<ExperiencePhase, ReadonlyArray<ExperiencePhase>>> = {
  created:      ['initializing'],
  initializing: ['ready', 'error'],
  ready:        ['applying', 'error'],
  applying:     ['ready', 'error'],
  error:        ['initializing', 'ready'],
};

@Injectable({ providedIn: 'root' })
export class ExperienceLifecycleService {
  private readonly _events = inject(ExperienceEventsService);

  isValid(from: ExperiencePhase, to: ExperiencePhase): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(from: ExperiencePhase, to: ExperiencePhase): boolean {
    if (!this.isValid(from, to)) {
      console.warn(`[ExperienceLifecycle] Invalid transition: ${from} → ${to}`);
      return false;
    }
    if (to === 'ready') {
      this._events.emit('experience:initialized', { from, to });
    }
    return true;
  }
}
