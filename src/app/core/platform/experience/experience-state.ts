import { Injectable, inject, signal, computed } from '@angular/core';
import { ExperienceStateData, ExperienceDirection } from './experience.types';
import { DEFAULT_EXPERIENCE_STATE, RTL_LANGUAGE_CODES } from './experience.constants';
import { EXPERIENCE_INITIAL_STATE } from './experience.tokens';

@Injectable({ providedIn: 'root' })
export class ExperienceState {
  private readonly _initial = inject(EXPERIENCE_INITIAL_STATE);

  private readonly _themeId      = signal<string | null>(
    this._initial.themeId      ?? DEFAULT_EXPERIENCE_STATE.themeId,
  );
  private readonly _languageCode = signal<string>(
    this._initial.languageCode ?? DEFAULT_EXPERIENCE_STATE.languageCode,
  );
  private readonly _localeCode   = signal<string>(
    this._initial.localeCode   ?? DEFAULT_EXPERIENCE_STATE.localeCode,
  );
  private readonly _densityId    = signal<string>(
    this._initial.densityId    ?? DEFAULT_EXPERIENCE_STATE.densityId,
  );
  private readonly _typographyId = signal<string>(
    this._initial.typographyId ?? DEFAULT_EXPERIENCE_STATE.typographyId,
  );
  private readonly _iconPackId   = signal<string>(
    this._initial.iconPackId   ?? DEFAULT_EXPERIENCE_STATE.iconPackId,
  );
  private readonly _brandingId   = signal<string | null>(
    this._initial.brandingId   ?? DEFAULT_EXPERIENCE_STATE.brandingId,
  );

  // Direction is derived from language code
  readonly direction = computed<ExperienceDirection>(() =>
    RTL_LANGUAGE_CODES.has(this._languageCode()) ? 'rtl' : 'ltr',
  );

  // Public read-only signals
  readonly themeId      = this._themeId.asReadonly();
  readonly languageCode = this._languageCode.asReadonly();
  readonly localeCode   = this._localeCode.asReadonly();
  readonly densityId    = this._densityId.asReadonly();
  readonly typographyId = this._typographyId.asReadonly();
  readonly iconPackId   = this._iconPackId.asReadonly();
  readonly brandingId   = this._brandingId.asReadonly();

  readonly snapshot = computed<ExperienceStateData>(() => ({
    themeId:      this._themeId(),
    languageCode: this._languageCode(),
    localeCode:   this._localeCode(),
    direction:    this.direction(),
    densityId:    this._densityId(),
    typographyId: this._typographyId(),
    iconPackId:   this._iconPackId(),
    brandingId:   this._brandingId(),
  }));

  // ─── Setters ─────────────────────────────────────────────────────────────

  setTheme(id: string | null): void          { this._themeId.set(id); }
  setLanguage(code: string): void            { this._languageCode.set(code); }
  setLocale(code: string): void              { this._localeCode.set(code); }
  setDensity(id: string): void               { this._densityId.set(id); }
  setTypography(id: string): void            { this._typographyId.set(id); }
  setIconPack(id: string): void              { this._iconPackId.set(id); }
  setBranding(id: string | null): void       { this._brandingId.set(id); }

  applySnapshot(state: Partial<ExperienceStateData>): void {
    if (state.themeId      !== undefined) this._themeId.set(state.themeId);
    if (state.languageCode !== undefined) this._languageCode.set(state.languageCode);
    if (state.localeCode   !== undefined) this._localeCode.set(state.localeCode);
    if (state.densityId    !== undefined) this._densityId.set(state.densityId);
    if (state.typographyId !== undefined) this._typographyId.set(state.typographyId);
    if (state.iconPackId   !== undefined) this._iconPackId.set(state.iconPackId);
    if (state.brandingId   !== undefined) this._brandingId.set(state.brandingId);
  }

  reset(): void {
    this.applySnapshot(DEFAULT_EXPERIENCE_STATE);
  }
}
