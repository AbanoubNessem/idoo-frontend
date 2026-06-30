import { Injectable, inject, computed, Signal, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import {
  DateFormatOptions, NumberFormatOptions, RelativeTimeInput,
  FormattedDate, FormattedNumber, FormattedCurrency, FormattedRelativeTime,
  PluralCategory,
} from './localization.types';
import { ExperienceState } from '../../experience-state';
import { LOCALIZATION_DEFAULT_LOCALE, LOCALIZATION_FALLBACK_LOCALE } from './localization.tokens';

// ─── Events ───────────────────────────────────────────────────────────────────

export interface LocaleChangedEvent {
  readonly type:   'locale:changed';
  readonly locale: string;
  readonly prev:   string;
}

export type LocalizationEvent = LocaleChangedEvent;

@Injectable({ providedIn: 'root' })
export class LocalizationEngineService implements OnDestroy {
  // ─── Dependencies ────────────────────────────────────────────────────────

  private readonly _state          = inject(ExperienceState);
  private readonly _defaultLocale  = inject(LOCALIZATION_DEFAULT_LOCALE);
  private readonly _fallbackLocale = inject(LOCALIZATION_FALLBACK_LOCALE);

  // ─── Signals ─────────────────────────────────────────────────────────────

  readonly activeLocale: Signal<string> = computed(() =>
    this._state.localeCode() || this._defaultLocale,
  );

  readonly activeLanguage: Signal<string> = computed(() =>
    this._state.languageCode() || this._activeLocale2Language(),
  );

  // ─── Events ──────────────────────────────────────────────────────────────

  private readonly _events$ = new Subject<LocalizationEvent>();
  readonly events$           = this._events$.asObservable();

  // ─── Formatter Cache ─────────────────────────────────────────────────────

  private readonly _dtfCache  = new Map<string, Intl.DateTimeFormat>();
  private readonly _nfCache   = new Map<string, Intl.NumberFormat>();
  private readonly _rtfCache  = new Map<string, Intl.RelativeTimeFormat>();
  private readonly _plurCache = new Map<string, Intl.PluralRules>();

  ngOnDestroy(): void {
    this._events$.complete();
  }

  // ─── Locale Switching ────────────────────────────────────────────────────

  setLocale(code: string): void {
    const prev = this.activeLocale();
    this._state.setLocale(code);
    this._clearFormatters();
    this._events$.next({ type: 'locale:changed', locale: code, prev });
  }

  // ─── Date Formatting ─────────────────────────────────────────────────────

  formatDate(date: Date | number | string, options?: DateFormatOptions): FormattedDate {
    const d      = this._toDate(date);
    const locale = options?.locale ?? this.activeLocale();
    const fmt    = this._getDateFormatter(locale, options);
    return { raw: d, formatted: fmt.format(d), locale };
  }

  formatDateStyle(date: Date | number | string, style: 'full' | 'long' | 'medium' | 'short' = 'medium'): string {
    return this.formatDate(date, { dateStyle: style }).formatted;
  }

  formatTime(date: Date | number | string, options?: DateFormatOptions): FormattedDate {
    const d      = this._toDate(date);
    const locale = options?.locale ?? this.activeLocale();
    const fmt    = this._getDateFormatter(locale, { timeStyle: 'short', ...options });
    return { raw: d, formatted: fmt.format(d), locale };
  }

  formatDateTime(date: Date | number | string, options?: DateFormatOptions): FormattedDate {
    const d      = this._toDate(date);
    const locale = options?.locale ?? this.activeLocale();
    const fmt    = this._getDateFormatter(locale, { dateStyle: 'medium', timeStyle: 'short', ...options });
    return { raw: d, formatted: fmt.format(d), locale };
  }

  // ─── Number Formatting ────────────────────────────────────────────────────

  formatNumber(value: number, options?: NumberFormatOptions): FormattedNumber {
    const locale = options?.locale ?? this.activeLocale();
    const fmt    = this._getNumberFormatter(locale, options);
    return { raw: value, formatted: fmt.format(value), locale };
  }

  formatInteger(value: number): string {
    return this.formatNumber(value, { maximumFractionDigits: 0 }).formatted;
  }

  formatPercent(value: number, decimals = 0): string {
    return this.formatNumber(value / 100, {
      style:                'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).formatted;
  }

  // ─── Currency Formatting ──────────────────────────────────────────────────

  formatCurrency(amount: number, currency: string, options?: NumberFormatOptions): FormattedCurrency {
    const locale = options?.locale ?? this.activeLocale();
    const fmt    = this._getNumberFormatter(locale, {
      style: 'currency',
      currency,
      ...options,
    });
    return { raw: amount, currency, formatted: fmt.format(amount), locale };
  }

  // ─── Relative Time ────────────────────────────────────────────────────────

  formatRelativeTime(input: RelativeTimeInput, locale?: string): FormattedRelativeTime {
    const l   = locale ?? this.activeLocale();
    const fmt = this._getRelativeTimeFormatter(l);
    return {
      value:     input.value,
      unit:      input.unit,
      formatted: fmt.format(input.value, input.unit),
      locale:    l,
    };
  }

  /** Convenience: compute relative time from a Date or timestamp */
  formatRelativeDate(date: Date | number | string, locale?: string): FormattedRelativeTime {
    const d     = this._toDate(date);
    const now   = Date.now();
    const diff  = d.getTime() - now;
    const { value, unit } = this._bestRelativeUnit(diff);
    return this.formatRelativeTime({ value, unit }, locale);
  }

  // ─── Plural Rules ─────────────────────────────────────────────────────────

  plural(count: number, locale?: string): PluralCategory {
    const l    = locale ?? this.activeLocale();
    const rules = this._getPluralRules(l);
    return rules.select(count) as PluralCategory;
  }

  // ─── Locale Detection ─────────────────────────────────────────────────────

  detectLocale(): string {
    if (typeof navigator === 'undefined') return this._defaultLocale;
    return navigator.language ?? this._defaultLocale;
  }

  isRtl(locale?: string): boolean {
    const l = locale ?? this.activeLocale();
    try {
      // textInfo is a Stage-3 proposal; cast to any for environments that support it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dir = (new Intl.Locale(l) as any).textInfo?.direction as string | undefined;
      if (dir) return dir === 'rtl';
    } catch { /* ignore */ }
    const lang = l.split('-')[0];
    return ['ar', 'he', 'fa', 'ur', 'yi', 'ku', 'ps', 'dv', 'sd'].includes(lang);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _activeLocale2Language(): string {
    return this._state.localeCode().split('-')[0] || 'en';
  }

  private _getDateFormatter(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `${locale}::${JSON.stringify(options ?? {})}`;
    if (!this._dtfCache.has(key)) {
      this._dtfCache.set(key, new Intl.DateTimeFormat(locale, options));
    }
    return this._dtfCache.get(key)!;
  }

  private _getNumberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `${locale}::${JSON.stringify(options ?? {})}`;
    if (!this._nfCache.has(key)) {
      this._nfCache.set(key, new Intl.NumberFormat(locale, options));
    }
    return this._nfCache.get(key)!;
  }

  private _getRelativeTimeFormatter(locale: string): Intl.RelativeTimeFormat {
    if (!this._rtfCache.has(locale)) {
      this._rtfCache.set(locale, new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));
    }
    return this._rtfCache.get(locale)!;
  }

  private _getPluralRules(locale: string): Intl.PluralRules {
    if (!this._plurCache.has(locale)) {
      this._plurCache.set(locale, new Intl.PluralRules(locale));
    }
    return this._plurCache.get(locale)!;
  }

  private _clearFormatters(): void {
    this._dtfCache.clear();
    this._nfCache.clear();
    this._rtfCache.clear();
    this._plurCache.clear();
  }

  private _toDate(input: Date | number | string): Date {
    if (input instanceof Date) return input;
    return new Date(input);
  }

  private _bestRelativeUnit(diffMs: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
    const abs = Math.abs(diffMs);
    const sign = diffMs < 0 ? -1 : 1;
    if (abs < 60_000)        return { value: Math.round(diffMs / 1_000)  , unit: 'second' };
    if (abs < 3_600_000)     return { value: Math.round(diffMs / 60_000) , unit: 'minute' };
    if (abs < 86_400_000)    return { value: Math.round(diffMs / 3_600_000), unit: 'hour' };
    if (abs < 2_592_000_000) return { value: Math.round(diffMs / 86_400_000), unit: 'day' };
    if (abs < 31_536_000_000) return { value: sign * Math.round(abs / 2_592_000_000), unit: 'month' };
    return { value: Math.round(diffMs / 31_536_000_000), unit: 'year' };
  }
}
