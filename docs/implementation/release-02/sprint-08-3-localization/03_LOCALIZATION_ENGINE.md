# Localization Engine

## Purpose

The Localization Engine provides culture-aware formatting using the native `Intl` API.
It is framework-independent — no date-fns, moment, or Angular i18n required.

## Service

```typescript
const l10n = inject(LocalizationEngineService);
```

## Signals

```typescript
l10n.activeLocale   // Signal<string> — from ExperienceState.localeCode()
l10n.activeLanguage // Signal<string> — from ExperienceState.languageCode()
```

## Date Formatting

```typescript
// Basic
l10n.formatDate(new Date())                       // FormattedDate
l10n.formatDate(new Date(), { dateStyle: 'long' })
l10n.formatDateStyle(new Date(), 'short')         // string

// Time
l10n.formatTime(new Date())                       // FormattedDate
l10n.formatDateTime(new Date())                   // date + time together

// With explicit locale
l10n.formatDate(date, { locale: 'de-DE' })
```

## Number Formatting

```typescript
l10n.formatNumber(1234567.89)                     // '1,234,567.89' in en-US
l10n.formatNumber(1234567.89, { locale: 'de-DE' }) // '1.234.567,89' in de-DE
l10n.formatInteger(42)                             // '42' (no decimals)
l10n.formatPercent(75)                             // '75%'
l10n.formatPercent(33.3, 1)                        // '33.3%'
```

## Currency Formatting

```typescript
l10n.formatCurrency(1234.56, 'USD')               // '$1,234.56' in en-US
l10n.formatCurrency(1234.56, 'EUR', { locale: 'de-DE' }) // '1.234,56 €'
```

## Relative Time

```typescript
l10n.formatRelativeTime({ value: -1, unit: 'day' })   // 'yesterday'
l10n.formatRelativeTime({ value: 2,  unit: 'hour' })  // 'in 2 hours'
l10n.formatRelativeDate(new Date(Date.now() - 3600000)) // 'an hour ago'
```

## Plural Rules

```typescript
l10n.plural(0, 'en-US')  // 'other'
l10n.plural(1, 'en-US')  // 'one'
l10n.plural(2, 'ar-SA')  // 'two'  (Arabic has 6 plural forms)
```

## RTL Detection

```typescript
l10n.isRtl()          // uses activeLocale()
l10n.isRtl('ar-SA')  // true
l10n.isRtl('en-US')  // false
```

## Locale Switching

```typescript
l10n.setLocale('de-DE');           // updates ExperienceState, emits event
l10n.events$.subscribe(e => { ... }); // type: 'locale:changed'
```

## Formatter Caching

All `Intl` formatters are cached by locale+options key. The cache is cleared on every
`setLocale()` call. This avoids `Intl` construction overhead on repeated calls.

## Configuration

```typescript
{ provide: LOCALIZATION_DEFAULT_LOCALE,  useValue: 'en-US' }
{ provide: LOCALIZATION_FALLBACK_LOCALE, useValue: 'en-US' }
{ provide: LOCALIZATION_CONFIG, useValue: { hour12: false } }
```

## SSR Safety

All `Intl` operations are standard TC39 — available in both browser and Node environments.
No `window`, `document`, or `navigator` access in LocalizationEngine.
