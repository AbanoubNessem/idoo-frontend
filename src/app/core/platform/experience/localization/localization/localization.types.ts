// ─── Format Options ───────────────────────────────────────────────────────────

export type DateStyle  = 'full' | 'long' | 'medium' | 'short';
export type TimeStyle  = 'full' | 'long' | 'medium' | 'short';
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface DateFormatOptions extends Intl.DateTimeFormatOptions {
  readonly locale?: string;
}

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  readonly locale?: string;
}

export interface RelativeTimeInput {
  readonly value: number;
  readonly unit:  Intl.RelativeTimeFormatUnit;
}

// ─── Formatted Result Objects ─────────────────────────────────────────────────

export interface FormattedDate {
  readonly raw:       Date;
  readonly formatted: string;
  readonly locale:    string;
}

export interface FormattedNumber {
  readonly raw:       number;
  readonly formatted: string;
  readonly locale:    string;
}

export interface FormattedCurrency {
  readonly raw:       number;
  readonly currency:  string;
  readonly formatted: string;
  readonly locale:    string;
}

export interface FormattedRelativeTime {
  readonly value:     number;
  readonly unit:      Intl.RelativeTimeFormatUnit;
  readonly formatted: string;
  readonly locale:    string;
}

// ─── Localization Config ──────────────────────────────────────────────────────

export interface LocalizationConfig {
  readonly defaultLocale:  string;
  readonly fallbackLocale: string;
  readonly timezone?:      string;
  readonly hour12?:        boolean;
  readonly calendar?:      string;
  readonly numberSystem?:  string;
}

// ─── Formatter Cache Key ──────────────────────────────────────────────────────

export interface FormatterCacheKey {
  locale:  string;
  type:    'date' | 'number' | 'currency' | 'reltime' | 'plural';
  options: string; // JSON serialized options
}
