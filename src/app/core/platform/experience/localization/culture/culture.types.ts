import { ExperienceDirection } from '../../experience.types';

// ─── Calendar / Number / Measurement ─────────────────────────────────────────

export type CalendarSystem =
  | 'gregory'
  | 'islamic'
  | 'islamic-civil'
  | 'hebrew'
  | 'chinese'
  | 'persian'
  | 'buddhist'
  | 'coptic';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday … 6=Saturday

export type NumberSystem =
  | 'latn'     // 0-9
  | 'arab'     // Arabic-Indic
  | 'arabext'  // Extended Arabic-Indic
  | 'deva'     // Devanagari
  | 'hanidec'  // Chinese decimal
  | 'thai';

export type MeasurementSystem = 'metric' | 'imperial' | 'us';

// ─── Resolution Layer ─────────────────────────────────────────────────────────

export type CultureLayer =
  | 'platform'
  | 'tenant'
  | 'company'
  | 'user'
  | 'browser'
  | 'runtime';

// ─── Culture Definition ───────────────────────────────────────────────────────

export interface CultureDefinition {
  /** BCP 47 locale tag, e.g. 'en-US', 'ar-SA' */
  readonly code:              string;
  /** ISO 639-1 language code, e.g. 'en', 'ar' */
  readonly language:          string;
  /** ISO 3166-1 alpha-2, e.g. 'US', 'SA'. Undefined for language-only entries. */
  readonly region?:           string;
  /** Display name in English */
  readonly name:              string;
  /** Display name in the language itself */
  readonly nativeName:        string;
  readonly direction:         ExperienceDirection;
  /** IANA timezone, e.g. 'America/New_York' */
  readonly timezone:          string;
  readonly calendar:          CalendarSystem;
  /** 0=Sunday, 1=Monday … */
  readonly weekStart:         DayOfWeek;
  readonly numberSystem:      NumberSystem;
  readonly measurementSystem: MeasurementSystem;
  /** Default ISO 4217 currency code, e.g. 'USD' */
  readonly currency?:         string;
  readonly tags?:             ReadonlyArray<string>;
}

// ─── Effective Culture (result of resolution) ─────────────────────────────────

export interface CultureLayerSnapshot {
  readonly layer:   CultureLayer;
  readonly code:    string | null;
  readonly applied: boolean;
  readonly reason?: string;
}

export interface EffectiveCulture {
  readonly code:              string;
  readonly language:          string;
  readonly region?:           string;
  readonly direction:         ExperienceDirection;
  readonly timezone:          string;
  readonly calendar:          CalendarSystem;
  readonly weekStart:         DayOfWeek;
  readonly numberSystem:      NumberSystem;
  readonly measurementSystem: MeasurementSystem;
  readonly currency?:         string;
  readonly layers:            ReadonlyArray<CultureLayerSnapshot>;
  readonly resolvedAt:        string;
}

// ─── Browser Detection ────────────────────────────────────────────────────────

export interface BrowserCultureInfo {
  readonly primaryLocale:   string;
  readonly allLocales:      ReadonlyArray<string>;
  readonly primaryLanguage: string;
  readonly timezone:        string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface CultureChangedEvent {
  readonly type: 'culture:changed';
  readonly code: string;
  readonly prev: string | null;
  readonly effective: EffectiveCulture;
}

export interface CultureLocaleChangedEvent {
  readonly type: 'locale:changed';
  readonly code: string;
  readonly prev: string;
}

export interface CultureLanguageChangedEvent {
  readonly type: 'language:changed';
  readonly code: string;
  readonly prev: string;
}

export type CultureEvent =
  | CultureChangedEvent
  | CultureLocaleChangedEvent
  | CultureLanguageChangedEvent;

// ─── Resolution Result ────────────────────────────────────────────────────────

export interface CultureResolutionResult {
  readonly effectiveCode:   string | null;
  readonly layerSnapshots:  ReadonlyArray<CultureLayerSnapshot>;
  readonly resolvedAt:      string;
}
