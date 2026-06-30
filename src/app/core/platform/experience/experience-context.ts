import { Injectable, inject, computed } from '@angular/core';
import { ExperienceContextData } from './experience.types';
import { ExperienceState } from './experience-state';

@Injectable({ providedIn: 'root' })
export class ExperienceContext {
  private readonly _state = inject(ExperienceState);

  readonly snapshot = computed<ExperienceContextData>(() => ({
    state:      this._state.snapshot(),
    resolvedAt: new Date().toISOString(),
  }));

  // Convenience accessors
  readonly themeId      = this._state.themeId;
  readonly languageCode = this._state.languageCode;
  readonly localeCode   = this._state.localeCode;
  readonly direction    = this._state.direction;
  readonly densityId    = this._state.densityId;
  readonly typographyId = this._state.typographyId;
  readonly iconPackId   = this._state.iconPackId;
  readonly brandingId   = this._state.brandingId;

  isRtl(): boolean {
    return this._state.direction() === 'rtl';
  }

  isLanguage(code: string): boolean {
    return this._state.languageCode() === code;
  }

  isLocale(code: string): boolean {
    return this._state.localeCode() === code;
  }
}
